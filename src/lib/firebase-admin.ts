import { initializeApp, getApps, cert, App, deleteApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

export { FieldValue };

/**
 * Configuration Firebase Admin pour VerifieMaMaison
 * Utilisé côté serveur pour les opérations administratives
 */
let adminApp: App | undefined;

// Fonction pour initialiser Firebase Admin
function initializeFirebaseAdmin(): App | undefined {
  try {
    // Vérifier que toutes les variables d'environnement nécessaires sont présentes
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      console.error("❌ Firebase Admin: Variables d'environnement manquantes");
      console.error(`  - FIREBASE_PROJECT_ID: ${projectId ? '✓' : '✗'}`);
      console.error(`  - FIREBASE_CLIENT_EMAIL: ${clientEmail ? '✓' : '✗'}`);
      console.error(`  - FIREBASE_PRIVATE_KEY: ${privateKey ? '✓' : '✗'}`);
      return undefined;
    }

    // Nettoyer la clé privée (remplacer les \n littéraux par de vrais retours à la ligne)
    const cleanPrivateKey = privateKey.replace(/\\n/g, '\n');

    const serviceAccount = {
      projectId,
      clientEmail,
      privateKey: cleanPrivateKey,
    };

    console.log("🔧 Initialisation Firebase Admin...");
    console.log(`  - Project ID: ${projectId}`);
    console.log(`  - Client Email: ${clientEmail}`);

    const app = initializeApp({
      credential: cert(serviceAccount),
      projectId: projectId,
    });

    console.log("✅ Firebase Admin initialisé avec succès");
    return app;
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation de Firebase Admin:", error);
    return undefined;
  }
}

// Initialiser Firebase Admin
const existingApps = getApps();
if (existingApps.length > 0) {
  // Utiliser l'app existante
  adminApp = existingApps[0];
  console.log("✅ Firebase Admin déjà initialisé (réutilisation)");
} else {
  // Initialiser une nouvelle app
  adminApp = initializeFirebaseAdmin();
}

// Exporter les instances (null si non initialisé)
export const adminDb = adminApp ? getFirestore(adminApp) : null;
export const adminAuth = adminApp ? getAuth(adminApp) : null;

// Helper pour vérifier si Firebase Admin est initialisé
export function isFirebaseAdminInitialized(): boolean {
  return adminApp !== undefined && adminDb !== null && adminAuth !== null;
}

