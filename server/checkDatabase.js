const mysql = require('mysql2/promise');
require('dotenv').config();

const checkDatabase = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'atelier_persicu'
    });

    console.log('✅ Connesso al database');

    // Verifica tabelle
    const [tables] = await connection.query('SHOW TABLES');
    console.log('\n📋 Tabelle presenti:', tables.length);
    tables.forEach(table => {
      console.log(`  - ${Object.values(table)[0]}`);
    });

    // Verifica utenti
    const [users] = await connection.query('SELECT id, username, role FROM users');
    console.log('\n👤 Utenti presenti:', users.length);
    users.forEach(user => {
      console.log(`  - ${user.username} (${user.role})`);
    });

    await connection.end();
  } catch (error) {
    console.error('❌ Errore:', error.message);
    process.exit(1);
  }
};

checkDatabase();



