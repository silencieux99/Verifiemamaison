/**
 * Script de test pour le scraper multi-sources d'annonces immobilières
 * Teste la recherche d'annonces autour d'une adresse
 */

const address = '36 rue auguste blanqui a aulnay sous bois';

async function testPropertyListings() {
  console.log('🏠 Test du scraper d\'annonces immobilières');
  console.log('📍 Adresse:', address);
  console.log('');

  try {
    // 1. Géocoder l'adresse pour obtenir les coordonnées
    console.log('🔍 Étape 1: Géocodage de l\'adresse...');
    const geocodeUrl = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(address)}&limit=1`;
    const geocodeResponse = await fetch(geocodeUrl);
    
    if (!geocodeResponse.ok) {
      throw new Error(`Géocodage échoué: ${geocodeResponse.status}`);
    }

    const geocodeData = await geocodeResponse.json();
    
    if (!geocodeData.features || geocodeData.features.length === 0) {
      throw new Error('Adresse non trouvée');
    }

    const feature = geocodeData.features[0];
    const [lon, lat] = feature.geometry.coordinates;
    const normalizedAddress = feature.properties.label;

    console.log('✅ Adresse géocodée:');
    console.log('   - Coordonnées:', lat, lon);
    console.log('   - Adresse normalisée:', normalizedAddress);
    console.log('');

    // 2. Rechercher les annonces
    console.log('🔍 Étape 2: Recherche des annonces...');
    console.log('   Sources: Leboncoin, PAP');
    console.log('   Rayon: 1 km');
    console.log('');

    // Importer la fonction de recherche
    // Note: En Node.js, on doit utiliser require pour les modules TypeScript compilés
    // Pour ce test, on va utiliser une version simplifiée
    
    const searchParams = {
      address: normalizedAddress,
      latitude: lat,
      longitude: lon,
      radius_m: 1000,
      propertyType: 'all',
    };

    // Test Leboncoin
    console.log('📡 Test Leboncoin...');
    try {
      const leboncoinUrl = `https://api.leboncoin.fr/finder/search?category=9&location=${lat},${lon}&radius=1`;
      const lbcResponse = await fetch(leboncoinUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
      });

      if (lbcResponse.ok) {
        const lbcData = await lbcResponse.json();
        console.log(`   ✅ ${lbcData.ads?.length || 0} annonce(s) trouvée(s) sur Leboncoin`);
        if (lbcData.ads && lbcData.ads.length > 0) {
          console.log('   Exemples:');
          lbcData.ads.slice(0, 3).forEach((ad, i) => {
            console.log(`      ${i + 1}. ${ad.subject || ad.title || 'Annonce'}`);
            if (ad.price) console.log(`         Prix: ${ad.price[0] || ad.price} €`);
            if (ad.square) console.log(`         Surface: ${ad.square} m²`);
          });
        }
      } else {
        console.log(`   ⚠️ Leboncoin retourne ${lbcResponse.status}`);
      }
    } catch (e) {
      console.log(`   ❌ Erreur Leboncoin: ${e.message}`);
    }

    console.log('');

    // Test PAP
    console.log('📡 Test PAP...');
    try {
      const postcode = normalizedAddress.match(/\b(\d{5})\b/)?.[1] || '93600';
      const papUrl = `https://www.pap.fr/api/search?type=appartements-maisons&location=${postcode}&radius=1`;
      const papResponse = await fetch(papUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
      });

      if (papResponse.ok) {
        const papData = await papResponse.json();
        console.log(`   ✅ ${papData.results?.length || 0} annonce(s) trouvée(s) sur PAP`);
        if (papData.results && papData.results.length > 0) {
          console.log('   Exemples:');
          papData.results.slice(0, 3).forEach((result, i) => {
            console.log(`      ${i + 1}. ${result.title || result.name || 'Annonce'}`);
            if (result.price) console.log(`         Prix: ${result.price} €`);
            if (result.surface) console.log(`         Surface: ${result.surface} m²`);
          });
        }
      } else {
        console.log(`   ⚠️ PAP retourne ${papResponse.status}`);
      }
    } catch (e) {
      console.log(`   ❌ Erreur PAP: ${e.message}`);
    }

    console.log('');
    console.log('✅ Test terminé!');
    console.log('');
    console.log('📝 Notes:');
    console.log('   - SeLoger est bloqué par DataDome (protection anti-bot)');
    console.log('   - Leboncoin et PAP peuvent avoir des APIs publiques');
    console.log('   - Pour un usage en production, considérer des services de proxy');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Exécuter le test
testPropertyListings();

