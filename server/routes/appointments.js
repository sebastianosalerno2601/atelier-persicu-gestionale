const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

// Ottieni tutti gli appuntamenti
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [appointments] = await pool.query('SELECT * FROM appointments ORDER BY date, start_time');
    console.log('📋 Recupero appuntamenti - Totale:', appointments.length);
    
    // Normalizza le date restituite da MySQL (potrebbero essere Date objects o stringhe)
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
    
    if (normalizedAppointments.length > 0) {
      console.log('📋 Date presenti:', [...new Set(normalizedAppointments.map(apt => apt.date))]);
      console.log('📋 Primo appuntamento (raw):', appointments[0]);
      console.log('📋 Primo appuntamento (normalizzato):', normalizedAppointments[0]);
    }
    
    res.json(normalizedAppointments);
  } catch (error) {
    console.error('Errore recupero appuntamenti:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Crea nuovo appuntamento
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { employeeId, date, startTime, endTime, clientName, serviceType, paymentMethod } = req.body;
    
    console.log('📝 Creazione appuntamento - Dati ricevuti:', {
      employeeId,
      date,
      startTime,
      endTime,
      clientName,
      serviceType,
      paymentMethod
    });
    
    // Normalizza la data per MySQL (assicura formato YYYY-MM-DD)
    let normalizedDate = date;
    if (normalizedDate && typeof normalizedDate === 'string') {
      normalizedDate = normalizedDate.split('T')[0]; // Rimuove eventuali timestamp
    }
    
    console.log('📝 Data ricevuta:', date);
    console.log('📝 Data normalizzata per MySQL:', normalizedDate);
    
    const [result] = await pool.query(
      'INSERT INTO appointments (employee_id, date, start_time, end_time, client_name, service_type, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id',
      [employeeId, normalizedDate, startTime, endTime, clientName, serviceType, paymentMethod || 'da-pagare']
    );
    
    const newId = result[0]?.id;
    console.log('✅ Appuntamento creato con ID:', newId);
    
    // Recupera l'appuntamento appena creato per verificare
    const [created] = await pool.query('SELECT * FROM appointments WHERE id = ?', [newId]);
    console.log('✅ Appuntamento salvato nel DB:', created[0]);
    console.log('✅ Data salvata nel DB (raw):', created[0]?.date);
    console.log('✅ Data salvata nel DB (tipo):', typeof created[0]?.date);
    
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
    const { employeeId, date, startTime, endTime, clientName, serviceType, paymentMethod } = req.body;
    
    // Normalizza la data per MySQL (assicura formato YYYY-MM-DD)
    let normalizedDate = date;
    if (normalizedDate && typeof normalizedDate === 'string') {
      normalizedDate = normalizedDate.split('T')[0]; // Rimuove eventuali timestamp
    }
    
    console.log('📝 Aggiornamento appuntamento ID:', id);
    console.log('📝 Data ricevuta:', date);
    console.log('📝 Data normalizzata per MySQL:', normalizedDate);
    console.log('📝 Dati ricevuti:', { employeeId, date: normalizedDate, startTime, endTime, clientName, serviceType, paymentMethod });
    
    await pool.query(
      'UPDATE appointments SET employee_id = ?, date = ?, start_time = ?, end_time = ?, client_name = ?, service_type = ?, payment_method = ? WHERE id = ?',
      [employeeId, normalizedDate, startTime, endTime, clientName, serviceType, paymentMethod, id]
    );
    
    // Recupera l'appuntamento aggiornato per verificare
    const [updated] = await pool.query('SELECT * FROM appointments WHERE id = ?', [id]);
    console.log('✅ Appuntamento aggiornato nel DB (raw):', updated[0]);
    console.log('✅ Data aggiornata nel DB (raw):', updated[0]?.date);
    console.log('✅ Data aggiornata nel DB (tipo):', typeof updated[0]?.date);
    
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

