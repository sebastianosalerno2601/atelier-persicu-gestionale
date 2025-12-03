/**
 * Script per verificare la connessione al database PostgreSQL locale
 * Esegui: node verify-database.js
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'atelier_persicu_local',
  port: process.env.DB_PORT || 5432,
  ssl: false
});

async function verifyDatabase() {
  console.log('🔍 Verifica connessione database...\n');
  
  console.log('📋 Configurazione:');
  console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`   User: ${process.env.DB_USER || 'postgres'}`);
  console.log(`   Database: ${process.env.DB_NAME || 'atelier_persicu_local'}`);
  console.log(`   Port: ${process.env.DB_PORT || 5432}`);
  console.log(`   Password: ${process.env.DB_PASSWORD ? '***' : '(non impostata)'}\n`);

  let client;
  try {
    console.log('🔌 Tentativo di connessione...');
    client = await pool.connect();
    console.log('✅ Connessione riuscita!\n');

    // Verifica che il database esista
    const dbResult = await client.query('SELECT current_database()');
    console.log(`📊 Database connesso: ${dbResult.rows[0].current_database}\n`);

    // Verifica tabelle esistenti
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    if (tablesResult.rows.length > 0) {
      console.log('📋 Tabelle esistenti:');
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    } else {
      console.log('⚠️  Nessuna tabella trovata. Il database è vuoto.');
      console.log('   Avvia il server con "npm start" per inizializzare le tabelle.\n');
    }

    // Verifica utente superadmin
    const userResult = await client.query('SELECT username, role FROM users WHERE role = $1', ['superadmin']);
    if (userResult.rows.length > 0) {
      console.log('\n👤 Utente superadmin trovato:');
      userResult.rows.forEach(row => {
        console.log(`   - ${row.username} (${row.role})`);
      });
    } else {
      console.log('\n⚠️  Nessun utente superadmin trovato.');
      console.log('   Avvia il server con "npm start" per creare l\'utente superadmin.\n');
    }

    console.log('\n✅ Tutto OK! Il database è configurato correttamente.');
    
  } catch (error) {
    console.error('\n❌ Errore di connessione:\n');
    console.error(`   Codice errore: ${error.code || 'N/A'}`);
    console.error(`   Messaggio: ${error.message}\n`);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('   PostgreSQL non è in ascolto sulla porta specificata!');
      console.error('   Soluzione: Avvia il servizio PostgreSQL da "services.msc"\n');
    } else if (error.code === '3D000') {
      console.error('   Il database non esiste!');
      console.error(`   Tentativo di creare il database "${process.env.DB_NAME || 'atelier_persicu_local'}"...\n`);
      
      // Prova a connetterti al database 'postgres' per creare il database
      try {
        const defaultPool = new Pool({
          host: process.env.DB_HOST || 'localhost',
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || '',
          database: 'postgres', // Connessione al database default
          port: process.env.DB_PORT || 5432,
          ssl: false
        });
        
        const defaultClient = await defaultPool.connect();
        await defaultClient.query(`CREATE DATABASE ${process.env.DB_NAME || 'atelier_persicu_local'}`);
        defaultClient.release();
        await defaultPool.end();
        
        console.error('   ✅ Database creato con successo!');
        console.error('   Ora puoi avviare il server con "npm start" per inizializzare le tabelle.\n');
        process.exit(0);
      } catch (createError) {
        console.error(`   ❌ Impossibile creare il database: ${createError.message}`);
        console.error('   Soluzione: Crea manualmente il database:\n');
        console.error('   - Apri pgAdmin o usa psql');
        console.error(`   - Esegui: CREATE DATABASE ${process.env.DB_NAME || 'atelier_persicu_local'};\n`);
        process.exit(1);
      }
    } else if (error.code === '28P01') {
      console.error('   Errore di autenticazione (password errata)!');
      console.error('   Soluzione: Verifica la password nel file server/.env');
      console.error('   La password deve corrispondere a quella impostata durante l\'installazione di PostgreSQL.\n');
    } else if (error.code === 'ENOTFOUND') {
      console.error('   Host non trovato!');
      console.error('   Soluzione: Verifica DB_HOST nel file server/.env\n');
    } else if (error.code === '57P03') {
      console.error('   Il database è in fase di avvio.');
      console.error('   Soluzione: Attendi qualche secondo e riprova.\n');
    } else {
      console.error('   Soluzione: Verifica che PostgreSQL sia installato e in esecuzione.');
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

verifyDatabase();

