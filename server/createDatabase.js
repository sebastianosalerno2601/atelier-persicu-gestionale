const mysql = require('mysql2/promise');
require('dotenv').config();

const createDatabase = async () => {
  try {
    // Connetti a MySQL senza database specificato
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    console.log('✅ Connesso a MySQL');

    // Crea il database se non esiste
    const dbName = process.env.DB_NAME || 'atelier_persicu';
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Database '${dbName}' creato o già esistente`);

    // Seleziona il database
    await connection.query(`USE ${dbName}`);
    console.log(`✅ Database '${dbName}' selezionato`);

    await connection.end();
    console.log('✅ Connessione chiusa');
    console.log('\n🎉 Database pronto! Ora puoi avviare il server con: npm start');
  } catch (error) {
    console.error('❌ Errore:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Verifica le credenziali nel file .env:');
      console.error('   - DB_HOST');
      console.error('   - DB_USER');
      console.error('   - DB_PASSWORD');
    }
    process.exit(1);
  }
};

createDatabase();



