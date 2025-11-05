/**
 * Script pour définir un utilisateur comme administrateur dans Firebase
 * Usage: node scripts/setAdmin.js <email>
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Charger les variables d'environnement
require('dotenv').config({ path: '.env.local' });

// Initialiser Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
    console.error('❌ Erreur: Variables d\'environnement Firebase Admin manquantes');
    console.error('Assurez-vous que FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL et FIREBASE_PRIVATE_KEY sont définis dans .env.local');
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function setAdmin() {
  try {
    const email = process.argv[2] || await question('Email de l\'utilisateur à définir comme admin: ');

    if (!email) {
      console.error('❌ Email requis');
      process.exit(1);
    }

    // Trouver l'utilisateur par email
    const user = await admin.auth().getUserByEmail(email);

    if (!user) {
      console.error(`❌ Utilisateur avec l'email ${email} non trouvé`);
      process.exit(1);
    }

    // Définir la claim admin
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });

    console.log(`✅ Utilisateur ${email} (UID: ${user.uid}) défini comme administrateur`);
    console.log('⚠️  L\'utilisateur devra se déconnecter et se reconnecter pour que les changements prennent effet');

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    rl.close();
    process.exit(1);
  }
}

setAdmin();

