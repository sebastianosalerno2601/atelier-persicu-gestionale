const pool = require('./config/database');
require('dotenv').config();

const checkDatabaseSize = async () => {
  let client;
  try {
    client = await pool.connect();
    const isProduction = process.env.NODE_ENV === 'production';
    
    console.log(`\n📊 Controllo dimensione database...`);
    console.log(`🔧 Ambiente: ${isProduction ? 'PRODUZIONE (Supabase)' : 'SVILUPPO LOCALE'}\n`);

    // Query per ottenere la dimensione del database corrente (PostgreSQL)
    const dbSizeQuery = `
      SELECT 
        pg_size_pretty(pg_database_size(current_database())) as database_size,
        pg_database_size(current_database()) as database_size_bytes
    `;

    const result = await client.query(dbSizeQuery);
    const dbSize = result.rows[0].database_size;
    const dbSizeBytes = parseInt(result.rows[0].database_size_bytes);

    console.log(`💾 Dimensione totale database: ${dbSize}`);

    // Converti in MB per confronto con il limite
    const dbSizeMB = (dbSizeBytes / (1024 * 1024)).toFixed(2);
    console.log(`📦 Dimensione in MB: ${dbSizeMB} MB`);

    // Limite Supabase free tier: 500 MB
    if (isProduction) {
      const limitMB = 500;
      const usedPercentage = ((dbSizeBytes / (1024 * 1024)) / limitMB * 100).toFixed(2);
      const remainingMB = (limitMB - dbSizeMB).toFixed(2);
      
      console.log(`\n📊 Piano Supabase FREE TIER:`);
      console.log(`   ├─ Limite: ${limitMB} MB`);
      console.log(`   ├─ Utilizzato: ${dbSizeMB} MB (${usedPercentage}%)`);
      console.log(`   └─ Disponibile: ${remainingMB} MB`);
      
      if (dbSizeMB > limitMB * 0.8) {
        console.log(`\n⚠️  ATTENZIONE: Stai usando più dell'80% dello spazio disponibile!`);
      } else if (dbSizeMB > limitMB * 0.5) {
        console.log(`\n💡 Nota: Stai usando più del 50% dello spazio disponibile.`);
      } else {
        console.log(`\n✅ Spazio disponibile: OK`);
      }
    }

    // Mostra dimensione per tabella
    console.log(`\n📋 Dimensione tabelle:`);
    const tableSizesQuery = `
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
        pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    `;

    const tableResult = await client.query(tableSizesQuery);
    tableResult.rows.forEach((row, index) => {
      const sizeMB = (row.size_bytes / (1024 * 1024)).toFixed(2);
      console.log(`   ${index + 1}. ${row.tablename}: ${row.size} (${sizeMB} MB)`);
    });

    client.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error.message);
    if (client) client.release();
    process.exit(1);
  }
};

checkDatabaseSize();


