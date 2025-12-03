/**
 * Script per cambiare la password dell'utente postgres
 * 
 * ATTENZIONE: Questo script richiede che pg_hba.conf sia temporaneamente 
 * configurato con 'trust' invece di 'md5' per permettere la connessione senza password.
 * 
 * Passi manuali:
 * 1. Ferma PostgreSQL: Stop-Service -Name "postgresql-x64-18" -Force
 * 2. Modifica: C:\Program Files\PostgreSQL\18\data\pg_hba.conf
 *    - Cambia: host all all 127.0.0.1/32 md5
 *    - In:     host all all 127.0.0.1/32 trust
 * 3. Riavvia: Start-Service -Name "postgresql-x64-18"
 * 4. Esegui questo script
 * 5. Rimetti 'md5' in pg_hba.conf
 * 6. Riavvia PostgreSQL
 */

require('dotenv').config();
const { Pool } = require('pg');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function changePassword() {
  console.log('🔐 Cambio Password PostgreSQL\n');
  
  const port = process.env.DB_PORT || 5433;
  const newPassword = process.env.DB_PASSWORD || '';
  
  if (!newPassword) {
    console.error('❌ DB_PASSWORD non trovato nel file .env');
    console.error('   Aggiungi DB_PASSWORD=la_tua_password nel file server/.env\n');
    process.exit(1);
  }
  
  console.log(`📋 Configurazione:`);
  console.log(`   Porta: ${port}`);
  console.log(`   Nuova password: ${newPassword.substring(0, 3)}***`);
  console.log('\n⚠️  ATTENZIONE: Questo script richiede che PostgreSQL sia configurato');
  console.log('   con autenticazione "trust" per localhost.\n');
  
  const confirm = await question('Hai già modificato pg_hba.conf? (s/n): ');
  if (confirm.toLowerCase() !== 's' && confirm.toLowerCase() !== 'si') {
    console.log('\n📝 Istruzioni per modificare pg_hba.conf:');
    console.log('   1. Ferma PostgreSQL:');
    console.log('      Stop-Service -Name "postgresql-x64-18" -Force');
    console.log('   2. Apri come amministratore:');
    console.log('      C:\\Program Files\\PostgreSQL\\18\\data\\pg_hba.conf');
    console.log('   3. Cerca la riga:');
    console.log('      host all all 127.0.0.1/32 md5');
    console.log('   4. Cambia "md5" in "trust"');
    console.log('   5. Salva e riavvia:');
    console.log('      Start-Service -Name "postgresql-x64-18"');
    console.log('\n   Poi riesegui questo script.\n');
    rl.close();
    process.exit(0);
  }
  
  // Prova connessione senza password (trust mode)
  const pool = new Pool({
    host: 'localhost',
    user: 'postgres',
    password: '', // Nessuna password in trust mode
    database: 'postgres',
    port: port,
    ssl: false
  });
  
  let client;
  try {
    console.log('\n🔌 Connessione al database...');
    client = await pool.connect();
    console.log('✅ Connesso!\n');
    
    console.log('🔐 Cambio password...');
    await client.query(`ALTER USER postgres WITH PASSWORD $1`, [newPassword]);
    console.log('✅ Password cambiata con successo!\n');
    
    console.log('📝 Prossimi passi:');
    console.log('   1. Rimetti "md5" al posto di "trust" in pg_hba.conf');
    console.log('   2. Riavvia PostgreSQL:');
    console.log('      Restart-Service -Name "postgresql-x64-18"');
    console.log('   3. Verifica con: npm run verify-db\n');
    
  } catch (error) {
    console.error('\n❌ Errore:', error.message);
    if (error.code === '28P01') {
      console.error('\n💡 pg_hba.conf non è configurato correttamente.');
      console.error('   Verifica che "trust" sia impostato per 127.0.0.1/32\n');
    }
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
    rl.close();
  }
}

changePassword();


