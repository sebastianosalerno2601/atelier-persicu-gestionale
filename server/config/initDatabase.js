const pool = require('./database');

const initDatabase = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Tabella utenti
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('superadmin', 'employee') NOT NULL DEFAULT 'employee',
        employee_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Tabella dipendenti
    await connection.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        fiscal_code VARCHAR(16) NOT NULL,
        birth_year INT NOT NULL,
        monthly_salary DECIMAL(10, 2) NOT NULL,
        color VARCHAR(7) DEFAULT '#ffffff',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Tabella appuntamenti
    await connection.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        client_name VARCHAR(255) NOT NULL,
        service_type VARCHAR(100) NOT NULL,
        payment_method ENUM('carta', 'contanti', 'scontistica', 'da-pagare') NOT NULL DEFAULT 'da-pagare',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        INDEX idx_date (date),
        INDEX idx_employee_date (employee_id, date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Tabella utenze
    await connection.query(`
      CREATE TABLE IF NOT EXISTS utilities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        month_key VARCHAR(7) NOT NULL,
        pigione DECIMAL(10, 2) DEFAULT 0,
        acqua DECIMAL(10, 2) DEFAULT 0,
        luce DECIMAL(10, 2) DEFAULT 0,
        spazzatura DECIMAL(10, 2) DEFAULT 0,
        gas DECIMAL(10, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_month (month_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Tabella spese prodotti
    await connection.query(`
      CREATE TABLE IF NOT EXISTS product_expenses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        month_key VARCHAR(7) NOT NULL,
        product_type VARCHAR(100) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_month_type (month_key, product_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Tabella note prodotti
    await connection.query(`
      CREATE TABLE IF NOT EXISTS product_expenses_notes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        month_key VARCHAR(7) NOT NULL UNIQUE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Tabella spese bar
    await connection.query(`
      CREATE TABLE IF NOT EXISTS bar_expenses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        month_key VARCHAR(7) NOT NULL,
        expense_type VARCHAR(100) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_month_type (month_key, expense_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Tabella manutenzioni
    await connection.query(`
      CREATE TABLE IF NOT EXISTS maintenance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        month_key VARCHAR(7) NOT NULL,
        type ENUM('ordinaria', 'straordinaria') NOT NULL,
        price DECIMAL(10, 2) DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_month_type (month_key, type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Inizializza superadmin se non esiste
    const [users] = await connection.query('SELECT * FROM users WHERE username = ?', ['admin']);
    if (users.length === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await connection.query(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        ['admin', hashedPassword, 'superadmin']
      );
      console.log('✅ Superadmin creato (username: admin, password: admin123)');
    }
    
    connection.release();
    console.log('✅ Database inizializzato correttamente');
  } catch (error) {
    console.error('❌ Errore inizializzazione database:', error);
    throw error;
  }
};

module.exports = initDatabase;

