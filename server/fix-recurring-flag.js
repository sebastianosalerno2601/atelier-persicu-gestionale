require('dotenv').config({ path: '.env' });
const pool = require('./config/database');

/**
 * Script per impostare is_recurring = TRUE per tutti gli appuntamenti
 * che hanno recurrence_group_id ma is_recurring = FALSE
 */
async function fixRecurringFlag() {
  try {
    console.log('🔄 Aggiornamento flag is_recurring...\n');
    
    // Trova tutti gli appuntamenti con recurrence_group_id ma is_recurring = FALSE
    const [appointments] = await pool.query(
      'SELECT id, client_name, date, start_time, recurrence_group_id, is_recurring FROM appointments WHERE recurrence_group_id IS NOT NULL AND (is_recurring IS FALSE OR is_recurring IS NULL)'
    );
    
    if (!Array.isArray(appointments) || appointments.length === 0) {
      console.log('✅ Nessun appuntamento da aggiornare.');
      return;
    }
    
    console.log(`📋 Trovati ${appointments.length} appuntamenti da aggiornare\n`);
    
    // Aggiorna tutti gli appuntamenti
    for (const apt of appointments) {
      await pool.query(
        'UPDATE appointments SET is_recurring = TRUE WHERE id = ?',
        [apt.id]
      );
      console.log(`✅ Aggiornato: ${apt.client_name} - ${apt.date} ${apt.start_time}`);
    }
    
    console.log(`\n✨ Completato! ${appointments.length} appuntamenti aggiornati.\n`);
    
  } catch (error) {
    console.error('❌ Errore:', error);
    throw error;
  }
}

// Esegui lo script
fixRecurringFlag()
  .then(() => {
    console.log('✅ Script completato con successo');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Errore fatale:', error);
    process.exit(1);
  });

