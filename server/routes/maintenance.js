const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

// Ottieni manutenzioni per mese
router.get('/:monthKey', authMiddleware, async (req, res) => {
  try {
    const { monthKey } = req.params;
    const [maintenance] = await pool.query('SELECT * FROM maintenance WHERE month_key = ?', [monthKey]);
    
    const result = {
      ordinaria: { price: '', notes: '' },
      straordinaria: { price: '', notes: '' }
    };
    
    maintenance.forEach(m => {
      result[m.type] = {
        price: m.price ? m.price.toString() : '',
        notes: m.notes || ''
      };
    });
    
    res.json(result);
  } catch (error) {
    console.error('Errore recupero manutenzioni:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Salva/aggiorna manutenzioni
router.post('/:monthKey', authMiddleware, async (req, res) => {
  try {
    const { monthKey } = req.params;
    const { type, price, notes } = req.body;
    
    await pool.query(
      `INSERT INTO maintenance (month_key, type, price, notes) VALUES (?, ?, ?, ?) 
       ON CONFLICT (month_key, type) DO UPDATE 
       SET price = EXCLUDED.price, notes = EXCLUDED.notes`,
      [monthKey, type, price || 0, notes || '']
    );
    
    res.json({ message: 'Manutenzione salvata' });
  } catch (error) {
    console.error('Errore salvataggio manutenzione:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

module.exports = router;

