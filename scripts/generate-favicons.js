const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const logoPath = path.join(__dirname, '../public/logo-atelier-persicu.png');
const outputDir = path.join(__dirname, '../public');

// Verifica che il logo esista
if (!fs.existsSync(logoPath)) {
  console.error('❌ Logo non trovato:', logoPath);
  process.exit(1);
}

// Dimensioni dei favicon da creare
const sizes = [
  { name: 'logo-atelier-persicu-64x64.png', size: 64 },
  { name: 'logo-atelier-persicu-96x96.png', size: 96 },
  { name: 'logo-atelier-persicu-128x128.png', size: 128 },
  { name: 'logo-atelier-persicu-192x192.png', size: 192 },
  { name: 'logo-atelier-persicu-180x180.png', size: 180 }
];

async function generateFavicons() {
  console.log('🎨 Generazione favicon...');
  
  try {
    for (const { name, size } of sizes) {
      const outputPath = path.join(outputDir, name);
      
      await sharp(logoPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Creato: ${name} (${size}x${size})`);
    }
    
    console.log('✨ Tutti i favicon sono stati generati con successo!');
  } catch (error) {
    console.error('❌ Errore durante la generazione dei favicon:', error);
    process.exit(1);
  }
}

generateFavicons();

