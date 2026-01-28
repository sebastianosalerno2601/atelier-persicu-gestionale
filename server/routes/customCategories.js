const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

function slugFromName(name) {
  const s = String(name || '').trim().toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
  return s || 'custom';
}

// Lista sotto-categorie custom per sezione e mese
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { section, monthKey } = req.query;
    if (!section || !monthKey) {
      return res.status(400).json({ error: 'section e monthKey richiesti' });
    }
    const [rows] = await pool.query(
      'SELECT id, name, slug FROM custom_categories WHERE section = ? AND month_key = ? ORDER BY id',
      [section, monthKey]
    );
    res.json(rows || []);
  } catch (error) {
    console.error('Errore recupero custom categories:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Crea sotto-categoria (solo superadmin)
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== 'superadmin') {
      return res.status(403).json({ error: 'Solo l\'admin può creare sotto-categorie' });
    }
    const { section, monthKey, name } = req.body;
    if (!section || !monthKey || !name || !String(name).trim()) {
      return res.status(400).json({ error: 'section, monthKey e name richiesti' });
    }
    const baseSlug = slugFromName(name);
    let slug = baseSlug;
    let n = 1;
    while (true) {
      const [ex] = await pool.query(
        'SELECT 1 FROM custom_categories WHERE section = ? AND month_key = ? AND slug = ?',
        [section, monthKey, slug]
      );
      if (!ex || ex.length === 0) break;
      slug = `${baseSlug}_${++n}`;
    }
    const [ins] = await pool.query(
      'INSERT INTO custom_categories (section, month_key, name, slug) VALUES (?, ?, ?, ?) RETURNING id, name, slug',
      [section, monthKey, String(name).trim(), slug]
    );
    const row = ins && ins[0];
    if (!row) return res.status(500).json({ error: 'Errore creazione sotto-categoria' });
    res.status(201).json({ id: row.id, name: row.name, slug: row.slug });
  } catch (error) {
    console.error('Errore creazione custom category:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Elimina sotto-categoria (solo superadmin). Rimuove anche le spese collegate.
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== 'superadmin') {
      return res.status(403).json({ error: 'Solo l\'admin può eliminare sotto-categorie' });
    }
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'ID non valido' });

    const [rows] = await pool.query(
      'SELECT section, month_key, slug FROM custom_categories WHERE id = ?',
      [id]
    );
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Sotto-categoria non trovata' });
    }
    const { section, month_key, slug } = rows[0];

    if (section === 'utilities') {
      await pool.query('DELETE FROM utility_expenses WHERE month_key = ? AND utility_type = ?', [month_key, slug]);
    } else if (section === 'bar') {
      await pool.query('DELETE FROM bar_expenses WHERE month_key = ? AND expense_type = ?', [month_key, slug]);
    } else if (section === 'product') {
      await pool.query('DELETE FROM product_expenses WHERE month_key = ? AND product_type = ?', [month_key, slug]);
    } else if (section === 'maintenance') {
      await pool.query('DELETE FROM maintenance_custom_expenses WHERE month_key = ? AND slug = ?', [month_key, slug]);
    }

    await pool.query('DELETE FROM custom_categories WHERE id = ?', [id]);
    res.json({ message: 'Sotto-categoria eliminata' });
  } catch (error) {
    console.error('Errore eliminazione custom category:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

module.exports = router;
