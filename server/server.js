const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const initDatabase = require('./config/initDatabase');
const authRoutes = require('./routes/auth');
const appointmentsRoutes = require('./routes/appointments');
const employeesRoutes = require('./routes/employees');
const utilitiesRoutes = require('./routes/utilities');
const productExpensesRoutes = require('./routes/productExpenses');
const barExpensesRoutes = require('./routes/barExpenses');
const maintenanceRoutes = require('./routes/maintenance');
const adminRoutes = require('./routes/admin');
const customCategoriesRoutes = require('./routes/customCategories');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inizializza database
let dbInitialized = false;
initDatabase()
  .then(() => {
    dbInitialized = true;
    console.log('✅ Database inizializzato correttamente');
  })
  .catch((err) => {
    dbInitialized = false;
    console.error('❌ Errore inizializzazione database:', err.message);
    console.error('Stack trace:', err.stack);
    console.error('⚠️  Il server si avvierà comunque, ma alcune funzionalità potrebbero non funzionare');
    console.error('💡 Verifica la connessione al database e riavvia il server');
  });

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/utilities', utilitiesRoutes);
app.use('/api/product-expenses', productExpensesRoutes);
app.use('/api/bar-expenses', barExpensesRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/custom-categories', customCategoriesRoutes);

// Serve static files dalla cartella build di React
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Server avviato sulla porta ${PORT}`);
  console.log(`📊 Database inizializzato: ${dbInitialized ? '✅ Sì' : '❌ No'}`);
  if (process.env.NODE_ENV === 'production') {
    console.log('🌐 Modalità: Produzione');
  } else {
    console.log('🔧 Modalità: Sviluppo');
  }
});

