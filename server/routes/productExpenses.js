const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

// Ottieni spese prodotti per mese
router.get('/:monthKey', authMiddleware, async (req, res) => {
  try {
    const { monthKey } = req.params;
    const [expenses] = await pool.query('SELECT * FROM product_expenses WHERE month_key = ? ORDER BY id', [monthKey]);
    
    // Raggruppa per tipo includendo anche l'ID
    const grouped = {};
    expenses.forEach(expense => {
      if (!grouped[expense.product_type]) {
        grouped[expense.product_type] = [];
      }
      grouped[expense.product_type].push({
        id: expense.id,
        price: parseFloat(expense.price),
        created_at: expense.created_at,
        reason: expense.reason || ''
      });
    });
    
    res.json(grouped);
  } catch (error) {
    console.error('Errore recupero spese prodotti:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Aggiungi spesa prodotto
router.post('/:monthKey', authMiddleware, async (req, res) => {
  try {
    const { monthKey } = req.params;
    const { productType, price, reason } = req.body;
    
    await pool.query(
      'INSERT INTO product_expenses (month_key, product_type, price, reason) VALUES (?, ?, ?, ?)',
      [monthKey, productType, price, reason || null]
    );
    
    res.json({ message: 'Spesa aggiunta' });
  } catch (error) {
    console.error('Errore aggiunta spesa:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Elimina spesa prodotto
router.delete('/:monthKey/:expenseId', authMiddleware, async (req, res) => {
  try {
    const { expenseId } = req.params;
    await pool.query('DELETE FROM product_expenses WHERE id = ?', [expenseId]);
    res.json({ message: 'Spesa eliminata' });
  } catch (error) {
    console.error('Errore eliminazione spesa:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Note prodotti
router.get('/notes/:monthKey', authMiddleware, async (req, res) => {
  try {
    const { monthKey } = req.params;
    const [notes] = await pool.query('SELECT notes FROM product_expenses_notes WHERE month_key = ?', [monthKey]);
    res.json({ notes: notes.length > 0 ? notes[0].notes : '' });
  } catch (error) {
    console.error('Errore recupero note:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

router.post('/notes/:monthKey', authMiddleware, async (req, res) => {
  try {
    const { monthKey } = req.params;
    const { notes } = req.body;
    
    await pool.query(
      `INSERT INTO product_expenses_notes (month_key, notes) VALUES (?, ?) 
       ON CONFLICT (month_key) DO UPDATE 
       SET notes = EXCLUDED.notes`,
      [monthKey, notes || '']
    );
    
    res.json({ message: 'Note salvate' });
  } catch (error) {
    console.error('Errore salvataggio note:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

module.exports = router;

