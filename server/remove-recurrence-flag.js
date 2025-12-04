require('dotenv').config({ path: '.env' });
const pool = require('./config/database');

/**
 * Script per rimuovere i flag di ricorrenza mantenendo solo il primo appuntamento di ogni serie
 * Questo permette di ricreare le ricorrenze con le date corrette modificando solo il primo appuntamento
 */
async function removeRecurrenceFlags() {
  try {
    console.log('🔄 Rimozione ricorrenze: mantiene solo il primo appuntamento di ogni serie...\n');
    
    // Trova tutti gli appuntamenti con ricorrenza
    const [appointments] = await pool.query(
      'SELECT id, client_name, date, start_time, recurrence_group_id, is_recurring FROM appointments WHERE (recurrence_group_id IS NOT NULL OR is_recurring = TRUE) ORDER BY date, start_time'
    );
    
    if (!Array.isArray(appointments) || appointments.length === 0) {
      console.log('✅ Nessun appuntamento con ricorrenza trovato.');
      return;
    }
    
    console.log(`📋 Trovati ${appointments.length} appuntamenti con ricorrenza\n`);
    
    // Raggruppa per recurrence_group_id
    const groups = {};
    appointments.forEach(apt => {
      const groupId = apt.recurrence_group_id || `single_${apt.id}`;
      if (!groups[groupId]) {
        groups[groupId] = [];
      }
      groups[groupId].push(apt);
    });
    
    console.log(`📊 Trovati ${Object.keys(groups).length} serie ricorrenti:\n`);
    
    let keptCount = 0;
    let deletedCount = 0;
    let updatedCount = 0;
    
    // Per ogni gruppo, mantieni solo il primo appuntamento
    for (const [groupId, apts] of Object.entries(groups)) {
      if (apts.length === 0) continue;
      
      // CONTROLLO AGGIUNTIVO: processa solo se:
      // 1. È un gruppo con recurrence_group_id (non è un appuntamento singolo)
      // 2. Ha almeno 2 appuntamenti (è una vera serie ricorrente)
      const isRealRecurrenceGroup = groupId.startsWith('recur_') || groupId.startsWith('migrated_');
      const hasMultipleAppointments = apts.length >= 2;
      
      if (!isRealRecurrenceGroup || !hasMultipleAppointments) {
        // Appuntamento singolo con flag di ricorrenza ma senza gruppo o serie - rimuovi solo il flag
        console.log(`   - ${apts[0].client_name} (${apts[0].start_time}): Appuntamento singolo - rimozione solo flag`);
        await pool.query(
          'UPDATE appointments SET is_recurring = FALSE, recurrence_group_id = NULL WHERE id = ?',
          [apts[0].id]
        );
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
        // Se stessa data, ordina per orario
        return a.start_time.localeCompare(b.start_time);
      });
      
      const firstAppointment = apts[0];
      const otherAppointments = apts.slice(1);
      
      console.log(`   - ${firstAppointment.client_name} (${firstAppointment.start_time}):`);
      console.log(`     ✅ Mantiene il primo: ${firstAppointment.date}`);
      
      // Rimuovi il flag di ricorrenza dal primo appuntamento (ma non eliminarlo)
      await pool.query(
        'UPDATE appointments SET is_recurring = FALSE, recurrence_group_id = NULL WHERE id = ?',
        [firstAppointment.id]
      );
      updatedCount++;
      keptCount++;
      
      // Elimina tutti gli altri appuntamenti della serie
      if (otherAppointments.length > 0) {
        console.log(`     🗑️  Elimina ${otherAppointments.length} appuntamenti successivi`);
        for (const apt of otherAppointments) {
          await pool.query('DELETE FROM appointments WHERE id = ?', [apt.id]);
          deletedCount++;
        }
      }
    }
    
    console.log(`\n✨ Completato!`);
    console.log(`   - Appuntamenti mantenuti: ${keptCount}`);
    console.log(`   - Appuntamenti eliminati: ${deletedCount}`);
    console.log(`   - Flag rimossi: ${updatedCount}\n`);
    console.log('💡 Ora puoi modificare ogni appuntamento mantenuto e flaggare nuovamente la ricorrenza settimanale.');
    console.log('   Le nuove ricorrenze verranno create con le date corrette.\n');
    
  } catch (error) {
    console.error('❌ Errore:', error);
    throw error;
  }
}

// Esegui lo script
removeRecurrenceFlags()
  .then(() => {
    console.log('✅ Script completato con successo');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Errore fatale:', error);
    process.exit(1);
  });

