/**
 * Script pour mettre à jour la configuration Melo en production
 * Usage: node scripts/update-melo-config.js
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
const envTemplatePath = path.join(process.cwd(), 'env.template');

console.log('🔧 Mise à jour de la configuration Melo...\n');

// Lire le template
let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
  console.log('✅ Fichier .env.local trouvé');
} else {
  // Créer depuis le template
  if (fs.existsSync(envTemplatePath)) {
    envContent = fs.readFileSync(envTemplatePath, 'utf8');
    console.log('✅ Création depuis env.template');
  } else {
    console.error('❌ Aucun fichier .env.local ou env.template trouvé');
    process.exit(1);
  }
}

// Mettre à jour MELO_API_KEY
const newApiKey = 'b911aaaa28f196ed01e6a05de549dfa4';
const newEnvironment = 'production';

// Remplacer ou ajouter MELO_API_KEY
if (envContent.includes('MELO_API_KEY=')) {
  envContent = envContent.replace(/MELO_API_KEY=.*/g, `MELO_API_KEY=${newApiKey}`);
  console.log('✅ Clé API Melo mise à jour');
} else {
  envContent += `\n# Melo API Configuration\nMELO_API_KEY=${newApiKey}\n`;
  console.log('✅ Clé API Melo ajoutée');
}

// Remplacer ou ajouter MELO_ENVIRONMENT
if (envContent.includes('MELO_ENVIRONMENT=')) {
  envContent = envContent.replace(/MELO_ENVIRONMENT=.*/g, `MELO_ENVIRONMENT=${newEnvironment}`);
  console.log('✅ Environnement Melo mis à jour en production');
} else {
  envContent += `MELO_ENVIRONMENT=${newEnvironment}\n`;
  console.log('✅ Environnement Melo ajouté');
}

// Corriger MELO_API_BASE_URL si elle pointe vers melo.io (la supprimer pour utiliser l'auto-détection)
if (envContent.includes('MELO_API_BASE_URL=')) {
  const oldUrl = envContent.match(/MELO_API_BASE_URL=.*/)?.[0];
  if (oldUrl && oldUrl.includes('melo.io')) {
    // Commenter ou supprimer l'ancienne URL incorrecte
    envContent = envContent.replace(/MELO_API_BASE_URL=.*/g, '# MELO_API_BASE_URL=  # Auto-détection selon MELO_ENVIRONMENT');
    console.log('✅ URL de base incorrecte supprimée (auto-détection activée)');
  } else if (oldUrl && !oldUrl.includes('notif.immo')) {
    // Si l'URL n'est pas correcte, la commenter
    envContent = envContent.replace(/MELO_API_BASE_URL=.*/g, '# MELO_API_BASE_URL=  # Auto-détection selon MELO_ENVIRONMENT');
    console.log('✅ URL de base incorrecte supprimée (auto-détection activée)');
  }
}

// Écrire le fichier
fs.writeFileSync(envPath, envContent, 'utf8');

console.log('\n✅ Configuration mise à jour avec succès!');
console.log(`   - Clé API: ${newApiKey.substring(0, 8)}...`);
console.log(`   - Environnement: ${newEnvironment}`);
console.log('\n⚠️  Redémarrez votre serveur Next.js pour que les changements prennent effet.\n');

