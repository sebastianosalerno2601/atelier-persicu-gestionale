const { Pool } = require('pg');
require('dotenv').config();

// Configurazione separata per ambiente locale e produzione
// - LOCALE (sviluppo): usa sempre database PostgreSQL locale, ignora DATABASE_URL
// - PRODUZIONE (Render): usa DATABASE_URL da Supabase

let pool;
const isProduction = process.env.NODE_ENV === 'production';

// Configurazione pool PostgreSQL
const poolConfig = {
  max: 12, // Supporta fino a 6+ utenti simultanei (2 connessioni per utente)
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000, // Aumentato a 5 secondi
  allowExitOnIdle: false, // Mantieni il pool attivo
};

// In PRODUZIONE (Render): usa DATABASE_URL da Supabase
if (isProduction && process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ...poolConfig,
    ssl: process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1')
      ? false
      : { rejectUnauthorized: false } // SSL per Supabase
  });
} else {
  // In SVILUPPO LOCALE: usa sempre database PostgreSQL locale
  // Ignora DATABASE_URL anche se presente
  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'atelier_persicu_local',
    port: process.env.DB_PORT || 5432,
    ...poolConfig,
    ssl: false // Nessun SSL per database locale
  });
}

// Gestisci errori di connessione senza crashare l'app
pool.on('error', (err) => {
  const errorMsg = err.message || err.toString() || '';
  // Ignora errori di terminazione normale del database (Supabase chiude connessioni inattive)
  if (errorMsg.includes('shutdown') || errorMsg.includes('termination') || errorMsg.includes('db_termination')) {
    // Non loggare - è normale che Supabase chiuda connessioni inattive
    return;
  }
  // Logga solo errori veri e critici
  console.error('❌ Errore pool database:', errorMsg);
  // Non fare crashare l'app, solo logga l'errore
});

// Test della connessione (non bloccante - non fa crashare l'app se fallisce)
setTimeout(() => {
  pool.connect()
    .then(client => {
      client.release();
      console.log('✅ Connessione database iniziale riuscita');
    })
    .catch(err => {
      const envType = isProduction ? 'produzione (Render)' : 'sviluppo locale';
      console.error(`⚠️  Warning connessione database (${envType}):`, err.message);
      if (err.code === '3D000') {
        console.error('\n💡 Il database non esiste ancora!');
        if (!isProduction) {
          console.error('   Crea il database con: createdb atelier_persicu_local');
          console.error('   Oppure modifica DB_NAME nel file server/.env');
        }
      } else if (err.code === '28P01') {
        console.error('\n💡 Errore credenziali PostgreSQL!');
        console.error('   Verifica il file server/.env con le credenziali corrette');
      } else if (err.code === 'ECONNREFUSED') {
        console.error('\n💡 PostgreSQL non è in esecuzione!');
        console.error('   Avvia PostgreSQL sul tuo computer');
      }
      // Non lanciare l'errore, lascia che l'app si avvii comunque
    });
}, 1000); // Aspetta 1 secondo prima di testare la connessione

// Keep-alive periodico per mantenere le connessioni attive (solo in produzione con Supabase)
if (isProduction && process.env.DATABASE_URL) {
  const KEEP_ALIVE_INTERVAL = 5 * 60 * 1000; // Ogni 5 minuti
  
  setInterval(async () => {
    try {
      const client = await pool.connect();
      try {
        await client.query('SELECT 1');
      } finally {
        client.release();
      }
    } catch (error) {
      // Ignora errori di keep-alive, non loggare per evitare spam
      // Le connessioni verranno ricreate quando necessario
    }
  }, KEEP_ALIVE_INTERVAL);
  
  console.log('🔄 Keep-alive database attivo (ogni 5 minuti)');
}

// Funzione helper per eseguire query con retry automatico
async function executeQueryWithRetry(text, params, retryCount = 0) {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 500; // 500ms
  
  // Converti ? placeholders a $1, $2, $3 per PostgreSQL
  let pgText = text;
  if (params && params.length > 0) {
    let paramIndex = 1;
    pgText = text.replace(/\?/g, () => `$${paramIndex++}`);
  }
  
  try {
    // Usa una connessione diretta dal pool invece di pool.query
    const client = await pool.connect();
    try {
      const result = await client.query(pgText, params);
      // Converte risultato PostgreSQL { rows } a formato mysql2-style [rows]
      return [result.rows];
    } finally {
      client.release(); // Rilascia sempre la connessione
    }
  } catch (error) {
    // Se l'errore è dovuto a una connessione chiusa o timeout, prova a riconnettersi
    const isConnectionError = 
      error.message?.includes('Connection terminated') ||
      error.message?.includes('connection timeout') ||
      error.message?.includes('terminated unexpectedly') ||
      error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND' ||
      error.code === '57P01'; // admin_shutdown
    
    if (isConnectionError && retryCount < MAX_RETRIES) {
      // Attendi prima di riprovare (backoff esponenziale)
      const delay = RETRY_DELAY * Math.pow(2, retryCount);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Riprova la query
      return executeQueryWithRetry(text, params, retryCount + 1);
    }
    
    // Se non è un errore di connessione o abbiamo superato i retry, rilancia l'errore
    throw error;
  }
}

// Wrapper per compatibilità con mysql2-style query e gestione retry automatico
pool.query = async function(text, params) {
  return executeQueryWithRetry(text, params);
};

module.exports = pool;

