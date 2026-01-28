require('dotenv').config({ path: '.env' });
const pool = require('./config/database');

/**
 * Migra i dati dalla tabella utilities (vecchia) a utility_expenses (nuova).
 * Per ogni mese, inserisce in utility_expenses le voci pigione, acqua, luce, spazzatura, gas > 0.
 * Poi rimuove il mese da utilities per evitare duplicati se lo script viene rieseguito.
 */
async function migrate() {
  try {
    console.log('🔄 Migrazione utenze -> utility_expenses...\n');

    const [rows] = await pool.query('SELECT * FROM utilities');
    if (!rows || rows.length === 0) {
      console.log('✅ Nessun dato in utilities da migrare.');
      process.exit(0);
      return;
    }

    const types = ['pigione', 'acqua', 'luce', 'spazzatura', 'gas'];
    let migrated = 0;

    for (const row of rows) {
      const monthKey = row.month_key;
      let inserted = 0;

      for (const t of types) {
        const val = parseFloat(row[t]);
        if (!isNaN(val) && val > 0) {
          await pool.query(
            'INSERT INTO utility_expenses (month_key, utility_type, price, reason) VALUES (?, ?, ?, ?)',
            [monthKey, t, val, null]
          );
          migrated++;
          inserted++;
          console.log(`   ${monthKey} ${t}: ${val} €`);
        }
      }

      if (inserted > 0) {
        await pool.query('DELETE FROM utilities WHERE month_key = ?', [monthKey]);
        console.log(`   → ${monthKey} rimosso da utilities.\n`);
      }
    }

    console.log(`\n✅ Migrazione completata. Inserite ${migrated} voci in utility_expenses.`);
  } catch (err) {
    console.error('❌ Errore migrazione:', err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

migrate();
