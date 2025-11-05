/**
 * Script de vérification de la configuration Gemini
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 VÉRIFICATION DE LA CONFIGURATION GEMINI');
console.log('='.repeat(60));

// Vérifier si .env.local existe
const envPath = path.join(process.cwd(), '.env.local');
console.log('\n1️⃣  Vérification du fichier .env.local');
console.log(`   Chemin: ${envPath}`);

if (!fs.existsSync(envPath)) {
  console.log('   ❌ Fichier .env.local non trouvé');
  console.log('\n💡 Créez le fichier .env.local à la racine du projet avec:');
  console.log('   GEMINI_API_KEY=votre_cle_ici');
  process.exit(1);
}

console.log('   ✅ Fichier .env.local trouvé');

// Lire le contenu
const envContent = fs.readFileSync(envPath, 'utf-8');
console.log('\n2️⃣  Vérification de la clé GEMINI_API_KEY');

const lines = envContent.split('\n');
const geminiLine = lines.find(line => line.trim().startsWith('GEMINI_API_KEY'));

if (!geminiLine) {
  console.log('   ❌ GEMINI_API_KEY non trouvée dans .env.local');
  console.log('\n💡 Ajoutez cette ligne dans .env.local:');
  console.log('   GEMINI_API_KEY=votre_cle_api_gemini');
  process.exit(1);
}

console.log('   ✅ GEMINI_API_KEY trouvée');

// Extraire la clé
const keyMatch = geminiLine.match(/GEMINI_API_KEY\s*=\s*(.+)/);
if (!keyMatch) {
  console.log('   ⚠️  Format incorrect (devrait être: GEMINI_API_KEY=valeur)');
  process.exit(1);
}

const apiKey = keyMatch[1].trim();
if (!apiKey || apiKey === '' || apiKey === 'votre_cle_ici') {
  console.log('   ❌ La clé API est vide ou non définie');
  console.log('\n💡 Remplacez "votre_cle_ici" par votre vraie clé API Gemini');
  process.exit(1);
}

if (apiKey.length < 20) {
  console.log('   ⚠️  La clé semble trop courte (doit faire au moins 20 caractères)');
}

console.log(`   ✅ Clé API trouvée (${apiKey.length} caractères)`);
console.log(`   🔑 Premiers caractères: ${apiKey.substring(0, 10)}...`);

console.log('\n3️⃣  Instructions importantes:');
console.log('   ⚠️  Après avoir ajouté/modifié .env.local, vous DEVEZ:');
console.log('   1. Arrêter le serveur (Ctrl+C)');
console.log('   2. Redémarrer avec: npm run dev');
console.log('   ⚠️  Les variables d\'environnement ne sont chargées qu\'au démarrage!');

console.log('\n' + '='.repeat(60));
console.log('✅ Configuration vérifiée');
console.log('\n💡 Si l\'analyse IA ne fonctionne toujours pas après redémarrage:');
console.log('   - Vérifiez que la clé est valide sur https://makersuite.google.com/app/apikey');
console.log('   - Vérifiez les logs du serveur pour voir les erreurs éventuelles');

