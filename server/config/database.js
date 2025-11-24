const { Pool } = require('pg');
require('dotenv').config();

// Supporta variabili ambiente di Render e configurazione personalizzata
// Render fornisce DATABASE_URL per PostgreSQL: postgresql://user:pass@host:port/database
// Oppure variabili separate: POSTGRES_HOST, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DATABASE, POSTGRES_PORT

let pool;

// Se Render fornisce DATABASE_URL (formato preferito), usalo direttamente
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1')
      ? false
      : { rejectUnauthorized: false } // SSL per connessioni cloud (Render)
  });
} else {
  // Altrimenti usa variabili separate
  pool = new Pool({
    host: process.env.POSTGRES_HOST || process.env.DB_HOST || 'localhost',
    user: process.env.POSTGRES_USER || process.env.DB_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.POSTGRES_DATABASE || process.env.DB_NAME || 'atelier_persicu',
    port: process.env.POSTGRES_PORT || process.env.DB_PORT || 5432,
    ssl: process.env.POSTGRES_HOST && !process.env.POSTGRES_HOST.includes('localhost')
      ? { rejectUnauthorized: false }
      : false
  });
}

// Test della connessione
pool.connect()
  .then(client => {
    console.log('✅ Connesso al database PostgreSQL');
    client.release();
  })
  .catch(err => {
    console.error('❌ Errore connessione database:', err.message);
    if (err.code === '3D000') {
      console.error('\n💡 Il database non esiste ancora!');
    } else if (err.code === '28P01') {
      console.error('\n💡 Errore credenziali PostgreSQL!');
      console.error('   Verifica il file .env con le credenziali corrette');
    }
  });

// Wrapper per compatibilità con mysql2-style query
const originalQuery = pool.query.bind(pool);
pool.query = async function(text, params) {
  // Converti ? placeholders a $1, $2, $3 per PostgreSQL
  let pgText = text;
  if (params && params.length > 0) {
    let paramIndex = 1;
    pgText = text.replace(/\?/g, () => `$${paramIndex++}`);
  }
  
  const result = await originalQuery(pgText, params);
  
  // Converte risultato PostgreSQL { rows } a formato mysql2-style [rows]
  // per compatibilità con le route esistenti
  return [result.rows];
};

module.exports = pool;

