/**
 * Test des comparables DVF
 * Utilise les données DVF déjà intégrées comme source de comparables
 */

const address = '36 rue auguste blanqui a aulnay sous bois';

async function testDVFComparables() {
  console.log('🏠 Test des comparables DVF');
  console.log('📍 Adresse:', address);
  console.log('');
  console.log('💡 Les données DVF sont des transactions RÉELLES, très fiables!');
  console.log('');

  try {
    // 1. Appeler l'API house-profile pour obtenir les données DVF
    console.log('🔍 Étape 1: Récupération des données via API house-profile...');
    const fullAddress = encodeURIComponent(address);
    const apiUrl = `http://localhost:3000/api/house-profile?address=${fullAddress}&radius_m=2000`;
    
    console.log('   URL:', apiUrl);
    console.log('   ⚠️ Assurez-vous que le serveur Next.js est démarré (npm run dev)');
    console.log('');

    const response = await fetch(apiUrl);

    if (!response.ok) {
      if (response.status === 503 || response.status === 500) {
        console.log('   ⚠️ Serveur non démarré ou erreur');
        console.log('   💡 Démarrez le serveur avec: npm run dev');
        return;
      }
      throw new Error(`API returned ${response.status}`);
    }

    const profile = await response.json();
    console.log('✅ Données reçues');
    console.log('');

    // 2. Extraire les transactions DVF
    console.log('🔍 Étape 2: Extraction des comparables DVF...');
    
    const dvfData = profile.market?.dvf;
    if (!dvfData || !dvfData.transactions || !Array.isArray(dvfData.transactions)) {
      console.log('   ⚠️ Aucune transaction DVF trouvée');
      return;
    }

    const transactions = dvfData.transactions;
    console.log(`   ✅ ${transactions.length} transaction(s) DVF trouvée(s)`);
    console.log('');

    // 3. Afficher les comparables
    console.log('📋 Comparables DVF (transactions réelles):');
    console.log('');

    const location = profile.location;
    const refLat = location?.coordinates?.latitude;
    const refLon = location?.coordinates?.longitude;

    transactions.slice(0, 10).forEach((tx, i) => {
      console.log(`   ${i + 1}. Transaction du ${tx.date ? new Date(tx.date).toLocaleDateString('fr-FR') : 'Date inconnue'}`);
      if (tx.price_eur) {
        console.log(`      💰 Prix: ${tx.price_eur.toLocaleString('fr-FR')} €`);
      }
      if (tx.surface_m2) {
        console.log(`      📐 Surface: ${tx.surface_m2} m²`);
      }
      if (tx.price_m2_eur) {
        console.log(`      💵 Prix/m²: ${tx.price_m2_eur.toLocaleString('fr-FR')} €/m²`);
      }
      if (tx.type) {
        console.log(`      🏠 Type: ${tx.type}`);
      }
      if (tx.address_hint) {
        console.log(`      📍 ${tx.address_hint}`);
      }
      if (refLat && refLon && tx.latitude && tx.longitude) {
        const distance = haversineDistance(refLat, refLon, tx.latitude, tx.longitude);
        console.log(`      📏 Distance: ${Math.round(distance)} m`);
      }
      console.log('');
    });

    // 4. Statistiques
    const withPrice = transactions.filter(tx => tx.price_eur).length;
    const withSurface = transactions.filter(tx => tx.surface_m2).length;
    const withPriceM2 = transactions.filter(tx => tx.price_m2_eur).length;
    
    console.log('📊 Statistiques:');
    console.log(`   - Total: ${transactions.length}`);
    console.log(`   - Avec prix: ${withPrice}`);
    console.log(`   - Avec surface: ${withSurface}`);
    console.log(`   - Avec prix/m²: ${withPriceM2}`);
    console.log('');

    // 5. Prix médian
    if (dvfData.median_price_m2_1y) {
      console.log('💰 Prix médian (1 an):', dvfData.median_price_m2_1y.toLocaleString('fr-FR'), '€/m²');
    }
    if (dvfData.median_price_m2_3y) {
      console.log('💰 Prix médian (3 ans):', dvfData.median_price_m2_3y.toLocaleString('fr-FR'), '€/m²');
    }
    if (dvfData.trend) {
      console.log('📈 Tendance:', dvfData.trend);
    }
    console.log('');

    console.log('✅ Test terminé!');
    console.log('');
    console.log('💡 Les données DVF sont:');
    console.log('   ✅ Légales (données publiques)');
    console.log('   ✅ Fiables (transactions réelles)');
    console.log('   ✅ Complètes (prix, surface, date, adresse)');
    console.log('   ✅ Déjà intégrées dans votre système!');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.message.includes('fetch')) {
      console.log('');
      console.log('💡 Solution: Démarrez le serveur Next.js avec: npm run dev');
    }
  }
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

testDVFComparables();

