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
    const { employeeId, date, startTime, endTime, clientName, serviceType, paymentMethod, productSold, recurrenceGroupId, isRecurring } = req.body;
    
    // Normalizza la data per PostgreSQL (assicura formato YYYY-MM-DD)
    let normalizedDate = date;
    if (normalizedDate && typeof normalizedDate === 'string') {
      normalizedDate = normalizedDate.split('T')[0]; // Rimuove eventuali timestamp
    }
    
    // Controllo duplicati: verifica se esiste già un appuntamento identico
    const [existing] = await pool.query(
      'SELECT id FROM appointments WHERE employee_id = ? AND date = ? AND start_time = ? AND client_name = ? AND service_type = ?',
      [employeeId, normalizedDate, startTime, clientName, serviceType]
    );
    
    if (existing && existing.length > 0) {
      return res.status(409).json({ error: 'Appuntamento duplicato: esiste già un appuntamento identico per questo dipendente, data, ora e cliente' });
    }
    
    const [result] = await pool.query(
      'INSERT INTO appointments (employee_id, date, start_time, end_time, client_name, service_type, payment_method, product_sold, recurrence_group_id, is_recurring) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id',
      [employeeId, normalizedDate, startTime, endTime, clientName, serviceType, paymentMethod || 'da-pagare', productSold || null, recurrenceGroupId || null, isRecurring || false]
    );
    
    const newId = result[0]?.id;
    
    res.json({ id: newId, ...req.body });
  } catch (error) {
    console.error('❌ Errore creazione appuntamento:', error);
    // Se è un errore di duplicato PostgreSQL, ritorna un messaggio più chiaro
    if (error.code === '23505' || error.message.includes('duplicate')) {
      return res.status(409).json({ error: 'Appuntamento duplicato: esiste già un appuntamento identico' });
    }
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Crea ricorrenze in batch (transazione unica per migliori performance)
router.post('/batch', authMiddleware, async (req, res) => {
  // Ottieni un client dal pool per la transazione
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { appointments } = req.body; // Array di appuntamenti da creare
    const recurrenceGroupId = req.body.recurrenceGroupId || `recur_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (!Array.isArray(appointments) || appointments.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({ error: 'Devi fornire un array di appuntamenti' });
    }
    
    const createdIds = [];
    
    // Helper per convertire ? placeholders a $1, $2, $3 per PostgreSQL
    const convertQuery = (text, params) => {
      if (!params || params.length === 0) return { text, params: [] };
      let paramIndex = 1;
      const pgText = text.replace(/\?/g, () => `$${paramIndex++}`);
      return { text: pgText, params };
    };
    
    // Controlla duplicati prima di inserire
    for (const apt of appointments) {
      let normalizedDate = apt.date;
      if (normalizedDate && typeof normalizedDate === 'string') {
        normalizedDate = normalizedDate.split('T')[0];
      }
      
      const queryParams = [apt.employeeId, normalizedDate, apt.startTime, apt.clientName, apt.serviceType];
      const { text: pgText, params } = convertQuery(
        'SELECT id FROM appointments WHERE employee_id = ? AND date = ? AND start_time = ? AND client_name = ? AND service_type = ?',
        queryParams
      );
      
      const result = await client.query(pgText, params);
      
      if (result.rows && result.rows.length > 0) {
        await client.query('ROLLBACK');
        client.release();
        return res.status(409).json({ 
          error: `Appuntamento duplicato: esiste già un appuntamento identico per ${apt.clientName} il ${normalizedDate} alle ${apt.startTime}` 
        });
      }
    }
    
    // Inserisci tutti gli appuntamenti
    for (const apt of appointments) {
      let normalizedDate = apt.date;
      if (normalizedDate && typeof normalizedDate === 'string') {
        normalizedDate = normalizedDate.split('T')[0];
      }
      
      const queryParams = [
        apt.employeeId,
        normalizedDate,
        apt.startTime,
        apt.endTime,
        apt.clientName,
        apt.serviceType,
        apt.paymentMethod || 'da-pagare',
        apt.productSold || null,
        recurrenceGroupId,
        true
      ];
      
      const { text: pgText, params } = convertQuery(
        'INSERT INTO appointments (employee_id, date, start_time, end_time, client_name, service_type, payment_method, product_sold, recurrence_group_id, is_recurring) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id',
        queryParams
      );
      
      const result = await client.query(pgText, params);
      createdIds.push(result.rows[0]?.id);
    }
    
    await client.query('COMMIT');
    client.release();
    
    res.json({ 
      message: `Creati ${createdIds.length} appuntamenti ricorrenti`,
      ids: createdIds,
      recurrenceGroupId: recurrenceGroupId
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {}); // Ignora errori di rollback
    client.release();
    console.error('❌ Errore creazione batch appuntamenti:', error);
    if (error.code === '23505' || error.message.includes('duplicate')) {
      return res.status(409).json({ error: 'Appuntamento duplicato: uno o più appuntamenti esistono già' });
    }
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Aggiorna appuntamento
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeId, date, startTime, endTime, clientName, serviceType, paymentMethod, productSold, isRecurring } = req.body;
    
    // Normalizza la data per PostgreSQL (assicura formato YYYY-MM-DD)
    let normalizedDate = date;
    if (normalizedDate && typeof normalizedDate === 'string') {
      normalizedDate = normalizedDate.split('T')[0]; // Rimuove eventuali timestamp
    }
    
    // Recupera l'appuntamento corrente per vedere se fa parte di una serie ricorrente
    const [current] = await pool.query('SELECT recurrence_group_id, is_recurring FROM appointments WHERE id = ?', [id]);
    const hasRecurrenceGroup = current[0]?.recurrence_group_id;
    const wasRecurring = current[0]?.is_recurring || hasRecurrenceGroup;
    
    // Se isRecurring è false e l'appuntamento faceva parte di una serie ricorrente,
    // cancelliamo tutti gli appuntamenti futuri della stessa serie (rispetto alla data odierna)
    if ((isRecurring === false || isRecurring === undefined) && wasRecurring && hasRecurrenceGroup) {
      // Ottieni la data odierna in formato YYYY-MM-DD
      const today = new Date().toISOString().split('T')[0];
      
      // Cancella tutti gli appuntamenti futuri (rispetto ad oggi) con lo stesso recurrence_group_id
      await pool.query(
        'DELETE FROM appointments WHERE recurrence_group_id = ? AND date > ?',
        [current[0].recurrence_group_id, today]
      );
      // Rimuovi il flag is_recurring e recurrence_group_id dall'appuntamento corrente
      await pool.query(
        'UPDATE appointments SET employee_id = ?, date = ?, start_time = ?, end_time = ?, client_name = ?, service_type = ?, payment_method = ?, product_sold = ?, is_recurring = FALSE, recurrence_group_id = NULL WHERE id = ?',
        [employeeId, normalizedDate, startTime, endTime, clientName, serviceType, paymentMethod, productSold || null, id]
      );
    } else {
      // Aggiorna normalmente
      await pool.query(
        'UPDATE appointments SET employee_id = ?, date = ?, start_time = ?, end_time = ?, client_name = ?, service_type = ?, payment_method = ?, product_sold = ? WHERE id = ?',
        [employeeId, normalizedDate, startTime, endTime, clientName, serviceType, paymentMethod, productSold || null, id]
      );
    }
    
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

