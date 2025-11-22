const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

// Ottieni utenze per mese
router.get('/:monthKey', authMiddleware, async (req, res) => {
  try {
    const { monthKey } = req.params;
    const [utilities] = await pool.query('SELECT * FROM utilities WHERE month_key = ?', [monthKey]);
    
    if (utilities.length === 0) {
      return res.json({
        monthKey,
        pigione: '',
        acqua: '',
        luce: '',
        spazzatura: '',
        gas: ''
      });
    }
    
    res.json(utilities[0]);
  } catch (error) {
    console.error('Errore recupero utenze:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Salva/aggiorna utenze
router.post('/:monthKey', authMiddleware, async (req, res) => {
  try {
    const { monthKey } = req.params;
    const { pigione, acqua, luce, spazzatura, gas } = req.body;
    
    await pool.query(
      `INSERT INTO utilities (month_key, pigione, acqua, luce, spazzatura, gas) 
       VALUES (?, ?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
       pigione = VALUES(pigione), 
       acqua = VALUES(acqua), 
       luce = VALUES(luce), 
       spazzatura = VALUES(spazzatura), 
       gas = VALUES(gas)`,
      [monthKey, pigione || 0, acqua || 0, luce || 0, spazzatura || 0, gas || 0]
    );
    
    res.json({ message: 'Utenze salvate' });
  } catch (error) {
    console.error('Errore salvataggio utenze:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

module.exports = router;

