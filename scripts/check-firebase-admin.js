/**
 * Script de vérification de la configuration Firebase Admin
 * Vérifie que les credentials sont correctement configurés
 */

require('dotenv').config({ path: '.env.local' });

console.log('🔍 Vérification de la configuration Firebase Admin\n');
console.log('═'.repeat(60));

// Vérifier les variables d'environnement
const requiredVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY'
];

let allPresent = true;

console.log('\n📋 Variables d\'environnement:\n');

requiredVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  const preview = value 
    ? (varName === 'FIREBASE_PRIVATE_KEY' 
        ? `${value.substring(0, 50)}...` 
        : value)
    : 'MANQUANTE';
  
  console.log(`${status} ${varName}`);
  if (value) {
    console.log(`   ${preview}\n`);
  } else {
    allPresent = false;
  }
});

console.log('═'.repeat(60));

if (!allPresent) {
  console.error('\n❌ ERREUR: Variables d\'environnement manquantes!');
  console.error('\nVérifiez votre fichier .env.local');
  process.exit(1);
}

// Tester l'initialisation de Firebase Admin
console.log('\n🔧 Test d\'initialisation Firebase Admin...\n');

try {
  const admin = require('firebase-admin');
  
  // Vérifier si déjà initialisé
  if (admin.apps.length > 0) {
    console.log('⚠️  Firebase Admin déjà initialisé, suppression...');
    admin.apps.forEach(app => app.delete());
  }
  
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
  
  console.log('📝 Configuration:');
  console.log(`   Project ID: ${projectId}`);
  console.log(`   Client Email: ${clientEmail}`);
  console.log(`   Private Key: ${privateKey.substring(0, 50)}...\n`);
  
  const app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    projectId,
  });
  
  console.log('✅ Firebase Admin initialisé avec succès!');
  console.log(`   App name: ${app.name}`);
  console.log(`   Project ID: ${app.options.projectId}\n`);
  
  // Tester Firestore
  console.log('🔧 Test de connexion Firestore...');
  const db = admin.firestore();
  
  // Tester une requête simple
  const testQuery = db.collection('reports').limit(1);
  console.log('   Exécution d\'une requête test...');
  
  testQuery.get()
    .then(snapshot => {
      console.log(`✅ Firestore fonctionne! (${snapshot.size} document(s) trouvé(s))\n`);
      
      // Tester Auth
      console.log('🔧 Test de Firebase Auth...');
      const auth = admin.auth();
      
      auth.listUsers(1)
        .then(result => {
          console.log(`✅ Firebase Auth fonctionne! (${result.users.length} utilisateur(s) trouvé(s))\n`);
          console.log('═'.repeat(60));
          console.log('✅ TOUT FONCTIONNE CORRECTEMENT!');
          console.log('═'.repeat(60));
          process.exit(0);
        })
        .catch(error => {
          console.error('❌ Erreur Firebase Auth:', error.message);
          console.error('\nDétails:', error);
          process.exit(1);
        });
    })
    .catch(error => {
      console.error('❌ Erreur Firestore:', error.message);
      console.error('\nDétails:', error);
      
      if (error.code === 16 || error.message.includes('UNAUTHENTICATED')) {
        console.error('\n⚠️  PROBLÈME D\'AUTHENTIFICATION DÉTECTÉ!');
        console.error('\nCauses possibles:');
        console.error('1. La clé privée (FIREBASE_PRIVATE_KEY) est incorrecte');
        console.error('2. Le service account n\'a pas les permissions nécessaires');
        console.error('3. Le projet Firebase n\'existe pas ou est désactivé');
        console.error('\nSolutions:');
        console.error('1. Téléchargez une nouvelle clé de service depuis:');
        console.error('   https://console.firebase.google.com/project/YOUR_PROJECT/settings/serviceaccounts/adminsdk');
        console.error('2. Vérifiez que le service account a le rôle "Firebase Admin SDK Administrator Service Agent"');
        console.error('3. Assurez-vous que Firestore est activé dans votre projet Firebase');
      }
      
      process.exit(1);
    });
  
} catch (error) {
  console.error('❌ Erreur lors de l\'initialisation:', error.message);
  console.error('\nDétails:', error);
  process.exit(1);
}
