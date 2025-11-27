const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

// Ottieni tutti gli appuntamenti
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM appointments ORDER BY date, start_time');
    // Il wrapper ritorna [rows], quindi prendiamo result[0] che è l'array di righe
    const appointments = Array.isArray(result) && result[0] ? result[0] : (result.rows || result || []);
    
    // Normalizza le date restituite da PostgreSQL (potrebbero essere Date objects o stringhe)
    const normalizedAppointments = appointments.map(apt => {
      let dateStr = apt.date;
      if (dateStr instanceof Date) {
        // Se è un oggetto Date, convertilo in stringa locale YYYY-MM-DD
        const year = dateStr.getFullYear();
        const month = String(dateStr.getMonth() + 1).padStart(2, '0');
        const day = String(dateStr.getDate()).padStart(2, '0');
        dateStr = `${year}-${month}-${day}`;
      } else if (dateStr && typeof dateStr === 'string') {
        // Se è già una stringa, rimuovi eventuali timestamp
        dateStr = dateStr.split('T')[0];
      }
      
      return {
        ...apt,
        date: dateStr
      };
    });
    
    res.json(normalizedAppointments);
  } catch (error) {
    console.error('Errore recupero appuntamenti:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Crea nuovo appuntamento
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { employeeId, date, startTime, endTime, clientName, serviceType, paymentMethod, productSold } = req.body;
    
    // Normalizza la data per PostgreSQL (assicura formato YYYY-MM-DD)
    let normalizedDate = date;
    if (normalizedDate && typeof normalizedDate === 'string') {
      normalizedDate = normalizedDate.split('T')[0]; // Rimuove eventuali timestamp
    }
    
    const [result] = await pool.query(
      'INSERT INTO appointments (employee_id, date, start_time, end_time, client_name, service_type, payment_method, product_sold) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id',
      [employeeId, normalizedDate, startTime, endTime, clientName, serviceType, paymentMethod || 'da-pagare', productSold || null]
    );
    
    const newId = result[0]?.id;
    
    res.json({ id: newId, ...req.body });
  } catch (error) {
    console.error('❌ Errore creazione appuntamento:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Aggiorna appuntamento
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeId, date, startTime, endTime, clientName, serviceType, paymentMethod, productSold } = req.body;
    
    // Normalizza la data per PostgreSQL (assicura formato YYYY-MM-DD)
    let normalizedDate = date;
    if (normalizedDate && typeof normalizedDate === 'string') {
      normalizedDate = normalizedDate.split('T')[0]; // Rimuove eventuali timestamp
    }
    
    await pool.query(
      'UPDATE appointments SET employee_id = ?, date = ?, start_time = ?, end_time = ?, client_name = ?, service_type = ?, payment_method = ?, product_sold = ? WHERE id = ?',
      [employeeId, normalizedDate, startTime, endTime, clientName, serviceType, paymentMethod, productSold || null, id]
    );
    
    // Recupera l'appuntamento aggiornato
    const [updated] = await pool.query('SELECT * FROM appointments WHERE id = ?', [id]);
    
    res.json({ message: 'Appuntamento aggiornato', appointment: updated[0] });
  } catch (error) {
    console.error('❌ Errore aggiornamento appuntamento:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Elimina appuntamento
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM appointments WHERE id = ?', [id]);
    res.json({ message: 'Appuntamento eliminato' });
  } catch (error) {
    console.error('Errore eliminazione appuntamento:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

module.exports = router;

