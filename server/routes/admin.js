const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

/**
 * ENDPOINT TEMPORANEO per rimuovere le ricorrenze in produzione
 * Solo superadmin può chiamare questo endpoint
 * DA RIMUOVERE DOPO L'USO
 */
router.post('/remove-recurrences', authMiddleware, async (req, res) => {
  try {
    // Verifica che sia superadmin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Accesso negato. Solo il superadmin può eseguire questa operazione.' });
    }

    console.log('🔄 Avvio rimozione ricorrenze da endpoint API...\n');
    
    const results = {
      kept: [],
      deleted: [],
      updated: [],
      errors: []
    };

    // Trova tutti gli appuntamenti con ricorrenza
    const [appointments] = await pool.query(
      'SELECT id, client_name, date, start_time, recurrence_group_id, is_recurring FROM appointments WHERE (recurrence_group_id IS NOT NULL OR is_recurring = TRUE) ORDER BY date, start_time'
    );
    
    if (!Array.isArray(appointments) || appointments.length === 0) {
      return res.json({
        success: true,
        message: 'Nessun appuntamento con ricorrenza trovato.',
        results
      });
    }
    
    // Raggruppa per recurrence_group_id
    const groups = {};
    appointments.forEach(apt => {
      const groupId = apt.recurrence_group_id || `single_${apt.id}`;
      if (!groups[groupId]) {
        groups[groupId] = [];
      }
      groups[groupId].push(apt);
    });
    
    let keptCount = 0;
    let deletedCount = 0;
    let updatedCount = 0;
    
    // Per ogni gruppo, mantieni solo il primo appuntamento
    for (const [groupId, apts] of Object.entries(groups)) {
      if (apts.length === 0) continue;
      
      try {
        // CONTROLLO AGGIUNTIVO: processa solo se è una vera serie ricorrente
        const isRealRecurrenceGroup = groupId.startsWith('recur_') || groupId.startsWith('migrated_');
        const hasMultipleAppointments = apts.length >= 2;
        
        if (!isRealRecurrenceGroup || !hasMultipleAppointments) {
          // Appuntamento singolo con flag - rimuovi solo il flag
          await pool.query(
            'UPDATE appointments SET is_recurring = FALSE, recurrence_group_id = NULL WHERE id = ?',
            [apts[0].id]
          );
          results.updated.push({
            id: apts[0].id,
            client: apts[0].client_name,
            date: apts[0].date,
            action: 'Flag rimosso (appuntamento singolo)'
          });
          updatedCount++;
          continue;
        }
        
        // Ordina per data per trovare il primo
        apts.sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          if (dateA.getTime() !== dateB.getTime()) {
            return dateA - dateB;
          }
          return a.start_time.localeCompare(b.start_time);
        });
        
        const firstAppointment = apts[0];
        const otherAppointments = apts.slice(1);
        
        // Rimuovi il flag di ricorrenza dal primo appuntamento
        await pool.query(
          'UPDATE appointments SET is_recurring = FALSE, recurrence_group_id = NULL WHERE id = ?',
          [firstAppointment.id]
        );
        
        results.kept.push({
          id: firstAppointment.id,
          client: firstAppointment.client_name,
          date: firstAppointment.date,
          time: firstAppointment.start_time
        });
        updatedCount++;
        keptCount++;
        
        // Elimina tutti gli altri appuntamenti della serie
        if (otherAppointments.length > 0) {
          for (const apt of otherAppointments) {
            await pool.query('DELETE FROM appointments WHERE id = ?', [apt.id]);
            results.deleted.push({
              id: apt.id,
              client: apt.client_name,
              date: apt.date,
              time: apt.start_time
            });
            deletedCount++;
          }
        }
      } catch (error) {
        console.error(`Errore processando gruppo ${groupId}:`, error);
        results.errors.push({
          group: groupId,
          error: error.message
        });
      }
    }
    
    console.log(`\n✨ Completato: ${keptCount} mantenuti, ${deletedCount} eliminati, ${updatedCount} aggiornati\n`);
    
    res.json({
      success: true,
      message: `Rimozione ricorrenze completata: ${keptCount} appuntamenti mantenuti, ${deletedCount} eliminati`,
      summary: {
        kept: keptCount,
        deleted: deletedCount,
        updated: updatedCount,
        totalGroups: Object.keys(groups).length
      },
      results
    });
    
  } catch (error) {
    console.error('❌ Errore rimozione ricorrenze:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      message: error.message
    });
  }
});

module.exports = router;

