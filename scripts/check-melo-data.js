/**
 * Script pour vérifier si les données Melo sont présentes dans un rapport
 * Usage: node scripts/check-melo-data.js <reportId>
 */

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

// Initialiser Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

const db = admin.firestore();

async function checkMeloData(reportId) {
  try {
    console.log(`\n🔍 Vérification du rapport: ${reportId}\n`);
    
    const reportDoc = await db.collection('reports').doc(reportId).get();
    
    if (!reportDoc.exists) {
      console.error('❌ Rapport non trouvé');
      return;
    }
    
    const reportData = reportDoc.data();
    
    console.log('📊 Structure du rapport:');
    console.log('  - ID:', reportData.id);
    console.log('  - User ID:', reportData.userId);
    console.log('  - Status:', reportData.status);
    console.log('  - ProfileData existe:', !!reportData.profileData);
    
    if (reportData.profileData) {
      console.log('\n📈 Données de marché:');
      console.log('  - market existe:', !!reportData.profileData.market);
      
      if (reportData.profileData.market) {
        console.log('  - market.dvf existe:', !!reportData.profileData.market.dvf);
        console.log('  - market.melo existe:', !!reportData.profileData.market.melo);
        
        if (reportData.profileData.market.melo) {
          const melo = reportData.profileData.market.melo;
          console.log('\n✅ Données Melo trouvées!');
          console.log('  - similarListings:', melo.similarListings?.length || 0);
          console.log('  - marketInsights:', !!melo.marketInsights);
          console.log('  - source:', melo.source);
          console.log('  - fetchedAt:', melo.fetchedAt);
          
          if (melo.similarListings && melo.similarListings.length > 0) {
            console.log('\n📋 Premier listing:');
            const first = melo.similarListings[0];
            console.log('  - ID:', first.id);
            console.log('  - Titre:', first.title);
            console.log('  - Prix:', first.price);
            console.log('  - Prix/m²:', first.price_m2);
            console.log('  - Surface:', first.surface);
            console.log('  - Type:', first.type);
            console.log('  - Distance:', first.distance_m, 'm');
            console.log('  - Contact:', !!first.contact);
            console.log('  - Images:', first.picturesRemote?.length || 0);
          }
          
          if (melo.marketInsights) {
            console.log('\n💡 Insights de marché:');
            console.log('  - Annonces actives:', melo.marketInsights.activeListings);
            console.log('  - Prix/m² moyen:', melo.marketInsights.averagePriceM2);
            console.log('  - Fourchette:', melo.marketInsights.priceRange?.min, '-', melo.marketInsights.priceRange?.max);
            console.log('  - Surface moyenne:', melo.marketInsights.averageSurface);
          }
        } else {
          console.log('\n⚠️  Pas de données Melo dans market.melo');
        }
      }
    }
    
    console.log('\n✅ Vérification terminée\n');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
  }
}

const reportId = process.argv[2];

if (!reportId) {
  console.error('Usage: node scripts/check-melo-data.js <reportId>');
  process.exit(1);
}

checkMeloData(reportId).then(() => process.exit(0));

