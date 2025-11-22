const mysql = require('mysql2/promise');
require('dotenv').config();

// Railway usa prefissi diversi per le variabili MySQL
// Supporta sia le variabili Railway standard che quelle personalizzate
const pool = mysql.createPool({
  host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
  user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'atelier_persicu',
  port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Configurazione per evitare problemi di timezone con le date
  timezone: 'local',
  dateStrings: true // Forza MySQL a restituire le date come stringhe invece di oggetti Date
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

