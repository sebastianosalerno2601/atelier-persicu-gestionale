const initDatabase = require('./config/initDatabase');

initDatabase()
  .then(() => {
    console.log('✅ Database inizializzato correttamente!');
    console.log('✅ Tabelle create!');
    console.log('✅ Superadmin creato (username: admin, password: admin123)');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Errore inizializzazione database:', err);
    process.exit(1);
  });



