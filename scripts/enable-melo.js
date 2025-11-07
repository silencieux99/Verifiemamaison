/**
 * Script pour activer l'enrichissement Melo
 * Usage: node scripts/enable-melo.js
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');

console.log('🔧 Activation de l\'enrichissement Melo...\n');

if (!fs.existsSync(envPath)) {
  console.error('❌ Fichier .env.local non trouvé');
  process.exit(1);
}

let envContent = fs.readFileSync(envPath, 'utf8');

// Activer Melo
if (envContent.includes('MELO_ENABLED=')) {
  envContent = envContent.replace(/MELO_ENABLED=.*/g, 'MELO_ENABLED=true');
  console.log('✅ MELO_ENABLED mis à true');
} else {
  // Ajouter la ligne
  if (envContent.includes('MELO_API_KEY=')) {
    envContent = envContent.replace(/MELO_API_KEY=/g, 'MELO_ENABLED=true\nMELO_API_KEY=');
    console.log('✅ MELO_ENABLED=true ajouté');
  } else {
    envContent += '\n# Melo API - Activé\nMELO_ENABLED=true\n';
    console.log('✅ MELO_ENABLED=true ajouté');
  }
}

fs.writeFileSync(envPath, envContent, 'utf8');

console.log('\n✅ Enrichissement Melo activé!');
console.log('   Les rapports seront enrichis avec les données Melo.');
console.log('   Redémarrez votre serveur Next.js pour que les changements prennent effet.\n');

