const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username e password sono richiesti' });
    }
    
    // Verifica che il pool sia configurato
    if (!pool) {
      console.error('❌ Pool database non inizializzato');
      return res.status(500).json({ error: 'Errore configurazione database' });
    }
    
    const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }
    
    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }
    
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, employeeId: user.employee_id },
      process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production',
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        employeeId: user.employee_id
      }
    });
  } catch (error) {
    console.error('❌ Errore login:', error.message);
    console.error('Stack:', error.stack);
    
    // Fornisci un messaggio di errore più informativo per il debug
    let errorMessage = 'Errore interno del server';
    if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Impossibile connettersi al database';
    } else if (error.code === '28P01') {
      errorMessage = 'Errore credenziali database';
    } else if (error.code === '3D000') {
      errorMessage = 'Database non trovato';
    }
    
    res.status(500).json({ error: errorMessage });
  }
});

// Health check endpoint (per servizi di ping/keep-alive)
router.get('/check', async (req, res) => {
  try {
    // Verifica che il database sia accessibile
    await pool.query('SELECT 1');
    res.json({ 
      status: 'ok', 
      message: 'Server attivo',
      database: 'connected'
    });
  } catch (error) {
    console.error('Health check - Errore database:', error.message);
    res.status(503).json({ 
      status: 'error', 
      message: 'Database non disponibile',
      database: 'disconnected',
      error: error.message
    });
  }
});

module.exports = router;

