const pool = require('./database');

const initDatabase = async () => {
  let client;
  try {
    client = await pool.connect();
  } catch (error) {
    console.error('❌ Errore connessione al database:', error.message);
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      console.error('   Verifica che DATABASE_URL sia configurato correttamente su Render');
    } else {
      console.error('   Verifica che PostgreSQL sia installato e in esecuzione');
      console.error('   Verifica le credenziali nel file server/.env (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)');
    }
    throw error; // Rilancia l'errore per essere gestito da server.js
  }
  
  try {
    // Crea tipi ENUM se non esistono
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE role_type AS ENUM('superadmin', 'employee');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE payment_method_type AS ENUM('carta', 'contanti', 'scontistica', 'da-pagare');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE maintenance_type AS ENUM('ordinaria', 'straordinaria');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    // Tabella utenti
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role role_type NOT NULL DEFAULT 'employee',
        employee_id INTEGER NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Trigger per aggiornare updated_at automaticamente (users)
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
    
    await client.query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
    
    // Tabella dipendenti
    await client.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        fiscal_code VARCHAR(16) NOT NULL,
        birth_year INTEGER NOT NULL,
        monthly_salary DECIMAL(10, 2) NOT NULL,
        color VARCHAR(7) DEFAULT '#ffffff',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`
      DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
      CREATE TRIGGER update_employees_updated_at
        BEFORE UPDATE ON employees
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
    
    // Tabella appuntamenti
    await client.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL,
        date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        client_name VARCHAR(255) NOT NULL,
        service_type VARCHAR(100) NOT NULL,
        payment_method payment_method_type NOT NULL DEFAULT 'da-pagare',
        product_sold VARCHAR(50) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
      )
    `);
    
    // Aggiungi colonna product_sold se non esiste (per migrazione database esistenti)
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'appointments' AND column_name = 'product_sold'
        ) THEN
          ALTER TABLE appointments ADD COLUMN product_sold VARCHAR(50) NULL;
        END IF;
      END $$;
    `);
    
    // Aggiungi colonne per ricorrenza se non esistenti
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'appointments' AND column_name = 'recurrence_group_id'
        ) THEN
          ALTER TABLE appointments ADD COLUMN recurrence_group_id VARCHAR(255) NULL;
        END IF;
        
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'appointments' AND column_name = 'is_recurring'
        ) THEN
          ALTER TABLE appointments ADD COLUMN is_recurring BOOLEAN NOT NULL DEFAULT FALSE;
        END IF;
      END $$;
    `);
    
    await client.query(`
      DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
      CREATE TRIGGER update_appointments_updated_at
        BEFORE UPDATE ON appointments
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
    
    // Indici per appuntamenti
    await client.query(`CREATE INDEX IF NOT EXISTS idx_date ON appointments (date)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_employee_date ON appointments (employee_id, date)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_recurrence_group ON appointments (recurrence_group_id)`);
    
    // Tabella utenze
    await client.query(`
      CREATE TABLE IF NOT EXISTS utilities (
        id SERIAL PRIMARY KEY,
        month_key VARCHAR(7) NOT NULL UNIQUE,
        pigione DECIMAL(10, 2) DEFAULT 0,
        acqua DECIMAL(10, 2) DEFAULT 0,
        luce DECIMAL(10, 2) DEFAULT 0,
        spazzatura DECIMAL(10, 2) DEFAULT 0,
        gas DECIMAL(10, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`
      DROP TRIGGER IF EXISTS update_utilities_updated_at ON utilities;
      CREATE TRIGGER update_utilities_updated_at
        BEFORE UPDATE ON utilities
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
    
    // Tabella spese prodotti
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_expenses (
        id SERIAL PRIMARY KEY,
        month_key VARCHAR(7) NOT NULL,
        product_type VARCHAR(100) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`CREATE INDEX IF NOT EXISTS idx_product_expenses_month_type ON product_expenses (month_key, product_type)`);
    
    // Tabella note prodotti
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_expenses_notes (
        id SERIAL PRIMARY KEY,
        month_key VARCHAR(7) NOT NULL UNIQUE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`
      DROP TRIGGER IF EXISTS update_product_expenses_notes_updated_at ON product_expenses_notes;
      CREATE TRIGGER update_product_expenses_notes_updated_at
        BEFORE UPDATE ON product_expenses_notes
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
    
    // Tabella spese bar
    await client.query(`
      CREATE TABLE IF NOT EXISTS bar_expenses (
        id SERIAL PRIMARY KEY,
        month_key VARCHAR(7) NOT NULL,
        expense_type VARCHAR(100) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`CREATE INDEX IF NOT EXISTS idx_bar_expenses_month_type ON bar_expenses (month_key, expense_type)`);
    
    // Tabella manutenzioni (modificata per supportare multiple spese per tipo)
    await client.query(`
      CREATE TABLE IF NOT EXISTS maintenance (
        id SERIAL PRIMARY KEY,
        month_key VARCHAR(7) NOT NULL,
        type maintenance_type NOT NULL,
        price DECIMAL(10, 2) DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (month_key, type)
      )
    `);
    
    // Rimuovi il vincolo UNIQUE se esiste (per permettere più spese per tipo)
    try {
      await client.query('ALTER TABLE maintenance DROP CONSTRAINT IF EXISTS maintenance_month_key_type_key');
    } catch (error) {
      // Ignora se il constraint non esiste o ha un nome diverso
      console.log('Constraint UNIQUE non trovato o già rimosso');
    }
    
    await client.query(`
      DROP TRIGGER IF EXISTS update_maintenance_updated_at ON maintenance;
      CREATE TRIGGER update_maintenance_updated_at
        BEFORE UPDATE ON maintenance
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
    
    // Tabella note manutenzioni
    await client.query(`
      CREATE TABLE IF NOT EXISTS maintenance_notes (
        id SERIAL PRIMARY KEY,
        month_key VARCHAR(7) NOT NULL,
        type maintenance_type NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (month_key, type)
      )
    `);
    
    await client.query(`
      DROP TRIGGER IF EXISTS update_maintenance_notes_updated_at ON maintenance_notes;
      CREATE TRIGGER update_maintenance_notes_updated_at
        BEFORE UPDATE ON maintenance_notes
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
    
    await client.query(`CREATE INDEX IF NOT EXISTS idx_maintenance_month_type ON maintenance (month_key, type)`);
    
    // Inizializza superadmin con le nuove credenziali
    const bcrypt = require('bcryptjs');
    
    // Elimina il vecchio utente admin se esiste
    await client.query('DELETE FROM users WHERE username = $1', ['admin']);
    
    // Verifica se esiste già AntonioPersico
    const result = await client.query('SELECT * FROM users WHERE username = $1', ['AntonioPersico']);
    const hashedPassword = await bcrypt.hash('AntonioPersico1', 10);
    
    if (result.rows.length === 0) {
      // Crea il nuovo superadmin
      await client.query(
        'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
        ['AntonioPersico', hashedPassword, 'superadmin']
      );
    } else {
      // Aggiorna la password e il ruolo se l'utente esiste già
      await client.query(
        'UPDATE users SET password = $1, role = $2 WHERE username = $3',
        [hashedPassword, 'superadmin', 'AntonioPersico']
      );
    }
  } catch (error) {
    console.error('❌ Errore inizializzazione database:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = initDatabase;
