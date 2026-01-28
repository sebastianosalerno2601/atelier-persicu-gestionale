const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const UTILITY_TYPES = ['pigione', 'acqua', 'luce', 'spazzatura', 'gas'];

async function getCustomSlugs(section, monthKey) {
  const [rows] = await pool.query(
    'SELECT slug FROM custom_categories WHERE section = ? AND month_key = ?',
    [section, monthKey]
  );
  return (rows || []).map((r) => r.slug);
}

// Ottieni spese utenze per mese (raggruppate per tipo, inclusi custom)
router.get('/:monthKey', authMiddleware, async (req, res) => {
  try {
    const { monthKey } = req.params;
    const customSlugs = await getCustomSlugs('utilities', monthKey);
    const types = [...UTILITY_TYPES, ...customSlugs];

    const [rows] = await pool.query(
      'SELECT * FROM utility_expenses WHERE month_key = ? ORDER BY id',
      [monthKey]
    );

    const expenses = {};
    types.forEach((t) => { expenses[t] = []; });
    (rows || []).forEach((row) => {
      const t = row.utility_type;
      if (expenses[t]) {
        expenses[t].push({
          id: row.id,
          price: parseFloat(row.price),
          created_at: row.created_at,
          reason: row.reason || ''
        });
      }
    });

    res.json({ expenses });
  } catch (error) {
    console.error('Errore recupero utenze:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Aggiungi una spesa utenza (dopo motivo)
router.post('/:monthKey/expense', authMiddleware, async (req, res) => {
  try {
    const { monthKey } = req.params;
    const { type, price, reason } = req.body;
    const customSlugs = await getCustomSlugs('utilities', monthKey);
    const allowed = [...UTILITY_TYPES, ...customSlugs];
    if (!type || !allowed.includes(type)) {
      return res.status(400).json({ error: 'Tipo utenza non valido' });
    }
    const p = parseFloat(price);
    if (isNaN(p) || p <= 0) {
      return res.status(400).json({ error: 'Prezzo non valido' });
    }

    await pool.query(
      'INSERT INTO utility_expenses (month_key, utility_type, price, reason) VALUES (?, ?, ?, ?)',
      [monthKey, type, p, reason || null]
    );

    res.json({ message: 'Spesa utenza aggiunta' });
  } catch (error) {
    console.error('Errore aggiunta spesa utenza:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Elimina una spesa utenza
router.delete('/:monthKey/:expenseId', authMiddleware, async (req, res) => {
  try {
    const { expenseId } = req.params;
    await pool.query('DELETE FROM utility_expenses WHERE id = ?', [expenseId]);
    res.json({ message: 'Spesa utenza eliminata' });
  } catch (error) {
    console.error('Errore eliminazione spesa utenza:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

module.exports = router;
