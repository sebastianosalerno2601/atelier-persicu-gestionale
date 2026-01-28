const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const BAR_TYPES = ['kitCaffe', 'beverage', 'operatoreBar'];

async function getCustomSlugs(section, monthKey) {
  const [rows] = await pool.query(
    'SELECT slug FROM custom_categories WHERE section = ? AND month_key = ?',
    [section, monthKey]
  );
  return (rows || []).map((r) => r.slug);
}

// Ottieni spese bar per mese (inclusi custom)
router.get('/:monthKey', authMiddleware, async (req, res) => {
  try {
    const { monthKey } = req.params;
    const customSlugs = await getCustomSlugs('bar', monthKey);
    const types = [...BAR_TYPES, ...customSlugs];

    const [expenses] = await pool.query('SELECT * FROM bar_expenses WHERE month_key = ? ORDER BY id', [monthKey]);

    const grouped = {};
    types.forEach((t) => { grouped[t] = []; });
    (expenses || []).forEach((expense) => {
      const t = expense.expense_type;
      if (grouped[t]) {
        grouped[t].push({
          id: expense.id,
          price: parseFloat(expense.price),
          created_at: expense.created_at,
          reason: expense.reason || ''
        });
      }
    });

    res.json(grouped);
  } catch (error) {
    console.error('Errore recupero spese bar:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Aggiungi spesa bar
router.post('/:monthKey', authMiddleware, async (req, res) => {
  try {
    const { monthKey } = req.params;
    const { expenseType, price, reason } = req.body;
    const customSlugs = await getCustomSlugs('bar', monthKey);
    const allowed = [...BAR_TYPES, ...customSlugs];
    if (!expenseType || !allowed.includes(expenseType)) {
      return res.status(400).json({ error: 'Tipo spesa bar non valido' });
    }

    await pool.query(
      'INSERT INTO bar_expenses (month_key, expense_type, price, reason) VALUES (?, ?, ?, ?)',
      [monthKey, expenseType, price, reason || null]
    );

    res.json({ message: 'Spesa aggiunta' });
  } catch (error) {
    console.error('Errore aggiunta spesa:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Elimina spesa bar
router.delete('/:monthKey/:expenseId', authMiddleware, async (req, res) => {
  try {
    const { expenseId } = req.params;
    await pool.query('DELETE FROM bar_expenses WHERE id = ?', [expenseId]);
    res.json({ message: 'Spesa eliminata' });
  } catch (error) {
    console.error('Errore eliminazione spesa:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

module.exports = router;
