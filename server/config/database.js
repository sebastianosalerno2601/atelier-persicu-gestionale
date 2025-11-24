const mysql = require('mysql2/promise');
require('dotenv').config();

// Supporta variabili ambiente di Railway, Render e configurazione personalizzata
// Railway: MYSQLHOST, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE, MYSQLPORT
// Render (PostgreSQL/MySQL): DATABASE_URL o variabili separate
// Render può anche usare DATABASE_URL con formato: mysql://user:pass@host:port/database
// o postgresql://user:pass@host:port/database

// Parsing di DATABASE_URL se presente (Render spesso lo fornisce)
let dbConfig = {
  host: process.env.MYSQLHOST || process.env.POSTGRES_HOST || process.env.DB_HOST || 'localhost',
  user: process.env.MYSQLUSER || process.env.POSTGRES_USER || process.env.DB_USER || 'root',
  password: process.env.MYSQLPASSWORD || process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.MYSQLDATABASE || process.env.POSTGRES_DATABASE || process.env.DB_NAME || 'atelier_persicu',
  port: process.env.MYSQLPORT || process.env.POSTGRES_PORT || process.env.DB_PORT || 3306,
};

// Se Render fornisce DATABASE_URL (o PlanetScale), parsalo
if (process.env.DATABASE_URL) {
  const url = new URL(process.env.DATABASE_URL);
  dbConfig.host = url.hostname;
  dbConfig.user = url.username;
  dbConfig.password = url.password;
  dbConfig.database = url.pathname.slice(1); // Rimuove lo slash iniziale
  dbConfig.port = parseInt(url.port) || 3306;
  
  // PlanetScale e altri servizi richiedono SSL
  // Controlla se la connection string ha parametri SSL
  if (url.searchParams.get('sslaccept') || url.protocol === 'mysql:') {
    dbConfig.ssl = {
      rejectUnauthorized: false // Per servizi cloud gestiti
    };
  }
}

const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Configurazione per evitare problemi di timezone con le date
  timezone: 'local',
  dateStrings: true, // Forza MySQL a restituire le date come stringhe invece di oggetti Date
  // Supporto SSL per database esterni (PlanetScale, etc.)
  ssl: dbConfig.ssl || false
});

// Test della connessione
pool.getConnection()
  .then(connection => {
    console.log('✅ Connesso al database MySQL');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Errore connessione database:', err.message);
    if (err.code === 'ER_BAD_DB_ERROR') {
      console.error('\n💡 Il database non esiste ancora!');
      console.error('   Esegui: node createDatabase.js');
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Errore credenziali MySQL!');
      console.error('   Verifica il file .env con le credenziali corrette');
    }
  });

module.exports = pool;

