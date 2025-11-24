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

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inizializza database
initDatabase()
  .then(() => {
    console.log('✅ Database inizializzato correttamente');
  })
  .catch((err) => {
    console.error('❌ Errore inizializzazione database:', err);
    console.error('Stack trace:', err.stack);
    // Non fare crashare l'app, continua comunque (il server si avvierà)
  });

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/utilities', utilitiesRoutes);
app.use('/api/product-expenses', productExpensesRoutes);
app.use('/api/bar-expenses', barExpensesRoutes);
app.use('/api/maintenance', maintenanceRoutes);

// Serve static files dalla cartella build di React
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Server in ascolto sulla porta ${PORT}`);
});

