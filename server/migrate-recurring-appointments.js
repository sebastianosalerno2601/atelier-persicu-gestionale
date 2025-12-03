require('dotenv').config({ path: '.env' });
const pool = require('./config/database');

/**
 * Script per migrare gli appuntamenti ricorrenti esistenti
 * Identifica le serie ricorrenti e assegna loro recurrence_group_id e is_recurring
 */
async function migrateRecurringAppointments() {
  let client;
  
  try {
    console.log('🔄 Inizio migrazione appuntamenti ricorrenti...\n');
    
    // Ottieni tutti gli appuntamenti
    const [allAppointments] = await pool.query('SELECT * FROM appointments ORDER BY client_name, employee_id, start_time, date');
    
    if (!Array.isArray(allAppointments) || allAppointments.length === 0) {
      console.log('✅ Nessun appuntamento trovato.');
      return;
    }
    
    console.log(`📋 Trovati ${allAppointments.length} appuntamenti totali\n`);
    
    // Raggruppa gli appuntamenti per cliente, dipendente e orario
    const groups = {};
    
    allAppointments.forEach(apt => {
      const key = `${apt.client_name}|${apt.employee_id}|${apt.start_time}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(apt);
    });
    
    console.log(`📊 Trovati ${Object.keys(groups).length} gruppi di appuntamenti\n`);
    
    let migratedCount = 0;
    let seriesCount = 0;
    
    // Per ogni gruppo, controlla se forma una serie ricorrente settimanale
    for (const [key, appointments] of Object.entries(groups)) {
      if (appointments.length < 2) {
        continue; // Serve almeno 2 appuntamenti per una serie
      }
      
      // Ordina per data - normalizza il formato della data
      appointments.sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : new Date(a.date);
        const dateB = b.date instanceof Date ? b.date : new Date(b.date);
        return dateA - dateB;
      });
      
      // Controlla se le date sono settimanali (circa 7 giorni di distanza)
      let isRecurring = appointments.length >= 2;
      const intervals = [];
      
      if (isRecurring) {
        for (let i = 1; i < appointments.length; i++) {
          // Normalizza le date - potrebbe essere un oggetto Date o una stringa
          let prevDateStr = appointments[i - 1].date;
          let currDateStr = appointments[i].date;
          
          // Se è un oggetto Date, convertilo in stringa YYYY-MM-DD
          if (prevDateStr instanceof Date) {
            prevDateStr = prevDateStr.toISOString().split('T')[0];
          } else if (typeof prevDateStr === 'string') {
            // Rimuovi eventuali timestamp
            prevDateStr = prevDateStr.split('T')[0];
          }
          
          if (currDateStr instanceof Date) {
            currDateStr = currDateStr.toISOString().split('T')[0];
          } else if (typeof currDateStr === 'string') {
            currDateStr = currDateStr.split('T')[0];
          }
          
          const prevDate = new Date(prevDateStr + 'T00:00:00');
          const currDate = new Date(currDateStr + 'T00:00:00');
          const daysDiff = Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24));
          intervals.push(daysDiff);
          
          // Accetta distanze di 5-9 giorni (più permissivo per gestire variazioni)
          if (daysDiff < 5 || daysDiff > 9) {
            isRecurring = false;
            break;
          }
        }
        
        // Se abbiamo almeno 3 appuntamenti, almeno l'80% degli intervalli devono essere 6-8 giorni (settimanali)
        if (isRecurring && appointments.length >= 3) {
          const weeklyIntervals = intervals.filter(d => d >= 6 && d <= 8).length;
          const weeklyRatio = weeklyIntervals / intervals.length;
          // Accetta se almeno l'80% sono settimanali (6-8 giorni)
          if (weeklyRatio < 0.8) {
            console.log(`   DEBUG: weeklyRatio=${weeklyRatio.toFixed(2)}, weeklyIntervals=${weeklyIntervals}, total=${intervals.length}`);
            isRecurring = false;
          }
        }
      }
      
      // Debug: mostra stato di isRecurring
      if (appointments.length >= 3 && intervals.length > 0) {
        const weeklyIntervals = intervals.filter(d => d >= 6 && d <= 8).length;
        const weeklyRatio = weeklyIntervals / intervals.length;
        console.log(`   DEBUG: isRecurring=${isRecurring}, weeklyRatio=${weeklyRatio.toFixed(2)}, hasRecurrenceGroup=${appointments.some(apt => apt.recurrence_group_id)}`);
      }
      
      // Se è una serie ricorrente e non ha già un recurrence_group_id
      if (isRecurring && appointments.every(apt => !apt.recurrence_group_id)) {
        // Genera un ID univoco per il gruppo
        const recurrenceGroupId = `migrated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Aggiorna tutti gli appuntamenti del gruppo
        for (const apt of appointments) {
          await pool.query(
            'UPDATE appointments SET recurrence_group_id = ?, is_recurring = TRUE WHERE id = ?',
            [recurrenceGroupId, apt.id]
          );
        }
        
        migratedCount += appointments.length;
        seriesCount++;
        
        console.log(`✅ Serie ricorrente trovata: ${appointments[0].client_name} - ${appointments[0].start_time} (${appointments.length} appuntamenti)`);
        console.log(`   Intervalli: ${intervals.join(', ')} giorni\n`);
      } else if (appointments.length >= 2) {
        // Debug: mostra gruppi che non sono stati riconosciuti come ricorrenti
        const [first, ...rest] = appointments;
        console.log(`ℹ️  Gruppo non ricorrente: ${first.client_name} - ${first.start_time} (${appointments.length} appuntamenti)`);
        if (intervals.length > 0) {
          console.log(`   Intervalli: ${intervals.join(', ')} giorni\n`);
        }
      }
    }
    
    console.log(`\n✨ Migrazione completata!`);
    console.log(`   - Serie ricorrenti identificate: ${seriesCount}`);
    console.log(`   - Appuntamenti aggiornati: ${migratedCount}\n`);
    
  } catch (error) {
    console.error('❌ Errore durante la migrazione:', error);
    throw error;
  }
}

// Esegui la migrazione
migrateRecurringAppointments()
  .then(() => {
    console.log('✅ Script completato con successo');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Errore fatale:', error);
    process.exit(1);
  });

