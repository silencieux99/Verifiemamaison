#!/usr/bin/env node

/**
 * Script de vérification des variables d'environnement
 * Avertit si des variables importantes sont manquantes (en dev uniquement)
 */

const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLIC_KEY',
];

const optionalEnvVars = [
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_UNITE',
  'STRIPE_PRICE_PACK3',
  'STRIPE_PRICE_PACK10',
  'FIREBASE_ADMIN_KEY',
  'GOOGLE_APPLICATION_CREDENTIALS',
];

// En production (Vercel), les variables sont gérées par la plateforme
// On ne fait que des warnings en dev
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

if (isProduction) {
  // En production, on ne fait rien, les variables sont gérées par Vercel
  process.exit(0);
}

// En développement, on vérifie et affiche des warnings
const missing = [];
const optionalMissing = [];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    missing.push(varName);
  }
});

optionalEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    optionalMissing.push(varName);
  }
});

if (missing.length > 0) {
  console.warn('\n⚠️  Variables d\'environnement requises manquantes:');
  missing.forEach(varName => {
    console.warn(`   - ${varName}`);
  });
  console.warn('\n   Créez un fichier .env.local avec ces variables.\n');
  // On ne fait pas échouer le build, juste un warning
}

if (optionalMissing.length > 0) {
  console.log('\n📝 Variables d\'environnement optionnelles non définies:');
  optionalMissing.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  console.log('\n   Ces variables sont optionnelles mais peuvent être nécessaires pour certaines fonctionnalités.\n');
}

// Toujours réussir (ne pas faire échouer le build)
process.exit(0);

