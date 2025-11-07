/**
 * Script pour désactiver l'enrichissement Melo
 * Usage: node scripts/disable-melo.js
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');

console.log('🔧 Désactivation de l\'enrichissement Melo...\n');

if (!fs.existsSync(envPath)) {
  console.error('❌ Fichier .env.local non trouvé');
  process.exit(1);
}

let envContent = fs.readFileSync(envPath, 'utf8');

// Désactiver Melo
if (envContent.includes('MELO_ENABLED=')) {
  envContent = envContent.replace(/MELO_ENABLED=.*/g, 'MELO_ENABLED=false');
  console.log('✅ MELO_ENABLED mis à false');
} else {
  // Ajouter la ligne au début de la section Melo
  if (envContent.includes('MELO_API_KEY=')) {
    envContent = envContent.replace(/MELO_API_KEY=/g, 'MELO_ENABLED=false\nMELO_API_KEY=');
    console.log('✅ MELO_ENABLED=false ajouté');
  } else {
    envContent += '\n# Melo API - Désactivé\nMELO_ENABLED=false\n';
    console.log('✅ MELO_ENABLED=false ajouté');
  }
}

fs.writeFileSync(envPath, envContent, 'utf8');

console.log('\n✅ Enrichissement Melo désactivé!');
console.log('   Les rapports seront générés sans données Melo.');
console.log('   Pour réactiver: mettez MELO_ENABLED=true dans .env.local\n');

