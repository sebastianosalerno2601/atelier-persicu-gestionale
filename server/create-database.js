/**
 * Script per creare il database atelier_persicu_local
 * Esegui: node create-database.js
 */

require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');

// Valori hardcoded (dal tuo .env)
const dbName = 'atelier_persicu_local';
const port = 5433; // IMPORTANTE: porta corretta
const dbHost = 'localhost';
const dbUser = 'postgres';
const dbPassword = 'root'; // Password dal tuo .env

// Pool per connettersi al database 'postgres' (default)
const pool = new Pool({
  host: dbHost,
  user: dbUser,
  password: dbPassword,
  database: 'postgres', // Ci connettiamo sempre al database default
  port: port,
  ssl: false
});

async function createDatabase() {
  console.log('🔍 Creazione database...\n');
  
  console.log('📋 Configurazione:');
  console.log(`   Host: ${dbHost}`);
  console.log(`   User: ${dbUser}`);
  console.log(`   Port: ${port}`);
  console.log(`   Database da creare: ${dbName}\n`);

  let client;
  try {
    console.log('🔌 Connessione al database postgres...');
    client = await pool.connect();
    console.log('✅ Connesso!\n');

    // Verifica se il database esiste già
    console.log(`🔍 Verifica se il database "${dbName}" esiste...`);
    const checkResult = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (checkResult.rows.length > 0) {
      console.log(`✅ Il database "${dbName}" esiste già!\n`);
      console.log('   Puoi ora avviare il server con: npm start\n');
    } else {
      console.log(`📦 Creazione database "${dbName}"...`);
      
      // Crea il database
      // Nota: CREATE DATABASE non può essere eseguito in una transazione
      await client.query(`CREATE DATABASE ${dbName}`);
      
      console.log(`✅ Database "${dbName}" creato con successo!\n`);
      console.log('📝 Prossimi passi:');
      console.log('   1. Avvia il server con: npm start');
      console.log('   2. Il server creerà automaticamente tutte le tabelle');
      console.log('   3. Verifica con: npm run verify-db\n');
    }

  } catch (error) {
    console.error('\n❌ Errore:\n');
    console.error(`   Codice: ${error.code || 'N/A'}`);
    console.error(`   Messaggio: ${error.message}\n`);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('   PostgreSQL non è in ascolto sulla porta ' + port + '!');
      console.error('   Verifica che il servizio PostgreSQL sia in esecuzione.');
      console.error('   Soluzione: Avvia il servizio PostgreSQL da "services.msc"\n');
    } else if (error.code === '28P01') {
      console.error('   Errore di autenticazione (password errata)!');
      console.error('   Soluzione: Verifica la password nel file server/.env');
      console.error('   La password deve corrispondere a quella di PostgreSQL.\n');
    } else if (error.code === '42P04') {
      console.error(`   Il database "${dbName}" esiste già!\n`);
      console.log('   Puoi ora avviare il server con: npm start\n');
    } else {
      console.error('   Verifica che PostgreSQL sia installato e in esecuzione.');
      console.error('   Controlla il file server/.env per credenziali corrette.\n');
    }
    
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

createDatabase();
