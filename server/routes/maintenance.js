const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const MAINTENANCE_TYPES = ['ordinaria', 'straordinaria'];

async function getCustomSlugs(section, monthKey) {
  const [rows] = await pool.query(
    'SELECT slug FROM custom_categories WHERE section = ? AND month_key = ?',
    [section, monthKey]
  );
  return (rows || []).map((r) => r.slug);
}

// Ottieni manutenzioni per mese (ordinaria, straordinaria, + custom)
router.get('/:monthKey', authMiddleware, async (req, res) => {
  try {
    const { monthKey } = req.params;
    const customSlugs = await getCustomSlugs('maintenance', monthKey);
    const types = [...MAINTENANCE_TYPES, ...customSlugs];

    const grouped = {};
    types.forEach((t) => { grouped[t] = []; });

    const [maintenance] = await pool.query('SELECT * FROM maintenance WHERE month_key = ? ORDER BY id', [monthKey]);
    (maintenance || []).forEach((m) => {
      if (grouped[m.type]) {
        grouped[m.type].push({
          id: m.id,
          price: parseFloat(m.price),
          created_at: m.created_at,
          reason: m.reason || ''
        });
      }
    });

    const [customRows] = await pool.query(
      'SELECT * FROM maintenance_custom_expenses WHERE month_key = ? ORDER BY id',
      [monthKey]
    );
    (customRows || []).forEach((row) => {
      if (grouped[row.slug]) {
        grouped[row.slug].push({
          id: `custom-${row.id}`,
          price: parseFloat(row.price),
          created_at: row.created_at,
          reason: row.reason || ''
        });
      }
    });

    let notesObj = { ordinaria: '', straordinaria: '' };
    try {
      const [notes] = await pool.query('SELECT * FROM maintenance_notes WHERE month_key = ?', [monthKey]);
      (notes || []).forEach((n) => {
        if (notesObj[n.type] !== undefined) notesObj[n.type] = n.notes || '';
      });
    } catch (e) {
      // Tabella note assente
    }

    res.json({ expenses: grouped, notes: notesObj });
  } catch (error) {
    console.error('Errore recupero manutenzioni:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Aggiungi spesa manutenzione (ordinaria/straordinaria o custom)
router.post('/:monthKey', authMiddleware, async (req, res) => {
  try {
    const { monthKey } = req.params;
    const { type, price, reason } = req.body;
    if (!type) return res.status(400).json({ error: 'Tipo manutenzione richiesto' });

    if (MAINTENANCE_TYPES.includes(type)) {
      await pool.query(
        'INSERT INTO maintenance (month_key, type, price, reason) VALUES (?, ?, ?, ?)',
        [monthKey, type, price || 0, reason || null]
      );
    } else {
      const customSlugs = await getCustomSlugs('maintenance', monthKey);
      if (!customSlugs.includes(type)) {
        return res.status(400).json({ error: 'Tipo manutenzione non valido' });
      }
      await pool.query(
        'INSERT INTO maintenance_custom_expenses (month_key, slug, price, reason) VALUES (?, ?, ?, ?)',
        [monthKey, type, parseFloat(price) || 0, reason || null]
      );
    }
    res.json({ message: 'Spesa aggiunta' });
  } catch (error) {
    console.error('Errore aggiunta spesa:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Elimina spesa (maintenance o maintenance_custom_expenses)
router.delete('/:monthKey/:expenseId', authMiddleware, async (req, res) => {
  try {
    const { expenseId } = req.params;
    if (String(expenseId).startsWith('custom-')) {
      const id = parseInt(String(expenseId).slice(7), 10);
      if (!isNaN(id)) await pool.query('DELETE FROM maintenance_custom_expenses WHERE id = ?', [id]);
    } else {
      await pool.query('DELETE FROM maintenance WHERE id = ?', [expenseId]);
    }
    res.json({ message: 'Spesa eliminata' });
  } catch (error) {
    console.error('Errore eliminazione spesa:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Note manutenzioni (solo ordinaria/straordinaria)
router.get('/notes/:monthKey', authMiddleware, async (req, res) => {
  try {
    const { monthKey } = req.params;
    const [notes] = await pool.query('SELECT * FROM maintenance_notes WHERE month_key = ?', [monthKey]);
    const result = { ordinaria: '', straordinaria: '' };
    (notes || []).forEach((n) => {
      if (result[n.type] !== undefined) result[n.type] = n.notes || '';
    });
    res.json(result);
  } catch (error) {
    console.error('Errore recupero note:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

router.post('/notes/:monthKey', authMiddleware, async (req, res) => {
  try {
    const { monthKey } = req.params;
    const { type, notes } = req.body;
    if (!type || (type !== 'ordinaria' && type !== 'straordinaria')) {
      return res.status(400).json({ error: 'Tipo manutenzione non valido' });
    }
    try {
      await pool.query(
        `INSERT INTO maintenance_notes (month_key, type, notes) VALUES (?, ?, ?) 
         ON CONFLICT (month_key, type) DO UPDATE 
         SET notes = EXCLUDED.notes`,
        [monthKey, type, notes || '']
      );
      res.json({ message: 'Note salvate' });
    } catch (dbError) {
      if (dbError.code === '42P01') {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          await client.query(`
            CREATE TABLE IF NOT EXISTS maintenance_notes (
              id SERIAL PRIMARY KEY,
              month_key VARCHAR(7) NOT NULL,
              type maintenance_type NOT NULL,
              notes TEXT,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              UNIQUE (month_key, type)
            )
          `);
          await client.query(`
            DROP TRIGGER IF EXISTS update_maintenance_notes_updated_at ON maintenance_notes;
            CREATE TRIGGER update_maintenance_notes_updated_at
              BEFORE UPDATE ON maintenance_notes
              FOR EACH ROW
              EXECUTE FUNCTION update_updated_at_column();
          `);
          await client.query('COMMIT');
          client.release();
          await pool.query(
            `INSERT INTO maintenance_notes (month_key, type, notes) VALUES (?, ?, ?) 
             ON CONFLICT (month_key, type) DO UPDATE SET notes = EXCLUDED.notes`,
            [monthKey, type, notes || '']
          );
          res.json({ message: 'Note salvate' });
        } catch (createError) {
          await client.query('ROLLBACK').catch(() => {});
          client.release();
          console.error('Errore creazione maintenance_notes:', createError);
          res.status(500).json({ error: 'Errore creazione tabella note' });
        }
      } else throw dbError;
    }
  } catch (error) {
    console.error('Errore salvataggio note:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

module.exports = router;
