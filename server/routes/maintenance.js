const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

// Ottieni manutenzioni per mese (array di spese per tipo)
router.get('/:monthKey', authMiddleware, async (req, res) => {
  try {
    const { monthKey } = req.params;
    const [maintenance] = await pool.query('SELECT * FROM maintenance WHERE month_key = ? ORDER BY id', [monthKey]);
    
    // Raggruppa per tipo includendo anche l'ID
    const grouped = {
      ordinaria: [],
      straordinaria: []
    };
    
    maintenance.forEach(m => {
      if (grouped[m.type]) {
        grouped[m.type].push({
          id: m.id,
          price: parseFloat(m.price),
          created_at: m.created_at
        });
      }
    });
    
    // Carica le note (se la tabella esiste)
    let notesObj = {
      ordinaria: '',
      straordinaria: ''
    };
    
    try {
      const [notes] = await pool.query('SELECT * FROM maintenance_notes WHERE month_key = ?', [monthKey]);
      notes.forEach(n => {
        if (notesObj[n.type] !== undefined) {
          notesObj[n.type] = n.notes || '';
        }
      });
    } catch (error) {
      // Se la tabella maintenance_notes non esiste ancora, ignora l'errore
      console.log('Tabella maintenance_notes non trovata, continuo senza note');
    }
    
    res.json({
      expenses: grouped,
      notes: notesObj
    });
  } catch (error) {
    console.error('Errore recupero manutenzioni:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Aggiungi spesa manutenzione
router.post('/:monthKey', authMiddleware, async (req, res) => {
  try {
    const { monthKey } = req.params;
    const { type, price } = req.body;
    
    if (!type || (type !== 'ordinaria' && type !== 'straordinaria')) {
      return res.status(400).json({ error: 'Tipo manutenzione non valido' });
    }
    
    await pool.query(
      'INSERT INTO maintenance (month_key, type, price) VALUES (?, ?, ?)',
      [monthKey, type, price || 0]
    );
    
    res.json({ message: 'Spesa aggiunta' });
  } catch (error) {
    console.error('Errore aggiunta spesa:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Elimina spesa manutenzione
router.delete('/:monthKey/:expenseId', authMiddleware, async (req, res) => {
  try {
    const { expenseId } = req.params;
    await pool.query('DELETE FROM maintenance WHERE id = ?', [expenseId]);
    res.json({ message: 'Spesa eliminata' });
  } catch (error) {
    console.error('Errore eliminazione spesa:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Note manutenzioni
router.get('/notes/:monthKey', authMiddleware, async (req, res) => {
  try {
    const { monthKey } = req.params;
    const [notes] = await pool.query('SELECT * FROM maintenance_notes WHERE month_key = ?', [monthKey]);
    
    const result = {
      ordinaria: '',
      straordinaria: ''
    };
    
    notes.forEach(n => {
      if (result[n.type] !== undefined) {
        result[n.type] = n.notes || '';
      }
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
      // Se la tabella non esiste, creala e riprova
      if (dbError.code === '42P01') {
        console.log('Tabella maintenance_notes non trovata, tentativo di creazione...');
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
          
          // Riprova l'inserimento
          await pool.query(
            `INSERT INTO maintenance_notes (month_key, type, notes) VALUES (?, ?, ?) 
             ON CONFLICT (month_key, type) DO UPDATE 
             SET notes = EXCLUDED.notes`,
            [monthKey, type, notes || '']
          );
          
          res.json({ message: 'Note salvate' });
        } catch (createError) {
          await client.query('ROLLBACK').catch(() => {});
          client.release();
          console.error('Errore creazione tabella maintenance_notes:', createError);
          res.status(500).json({ error: 'Errore nella creazione della tabella note' });
        }
      } else {
        throw dbError;
      }
    }
  } catch (error) {
    console.error('Errore salvataggio note:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

module.exports = router;
