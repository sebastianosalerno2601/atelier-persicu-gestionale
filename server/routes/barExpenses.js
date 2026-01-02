const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

// Ottieni spese bar per mese
router.get('/:monthKey', authMiddleware, async (req, res) => {
  try {
    const { monthKey } = req.params;
    const [expenses] = await pool.query('SELECT * FROM bar_expenses WHERE month_key = ? ORDER BY id', [monthKey]);
    
    // Raggruppa per tipo includendo anche l'ID
    const grouped = {};
    expenses.forEach(expense => {
      if (!grouped[expense.expense_type]) {
        grouped[expense.expense_type] = [];
      }
      grouped[expense.expense_type].push({
        id: expense.id,
        price: parseFloat(expense.price),
        created_at: expense.created_at,
        reason: expense.reason || ''
      });
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

