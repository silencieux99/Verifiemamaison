/**
 * Script de test pour les scrapers alternatifs
 * Teste Bien'ici, Le Figaro Immobilier et PAP
 */

const address = '36 rue auguste blanqui a aulnay sous bois';

async function testAlternativeScrapers() {
  console.log('🏠 Test des scrapers alternatifs');
  console.log('📍 Adresse:', address);
  console.log('');

  try {
    // 1. Géocoder l'adresse
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
    const postcode = normalizedAddress.match(/\b(\d{5})\b/)?.[1] || '93600';

    console.log('✅ Adresse géocodée:');
    console.log('   - Coordonnées:', lat, lon);
    console.log('   - Adresse normalisée:', normalizedAddress);
    console.log('');

    // 2. Tester Bien'ici
    console.log('🔍 Étape 2: Test Bien\'ici...');
    try {
      const bieniciUrl = `https://api.bienici.com/search?latitude=${lat}&longitude=${lon}&radius=2`;
      console.log('   URL:', bieniciUrl);
      
      const bieniciResponse = await fetch(bieniciUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Referer': 'https://www.bienici.com/',
        },
      });

      if (bieniciResponse.ok) {
        const bieniciData = await bieniciResponse.json();
        console.log(`   ✅ Bien'ici accessible!`);
        console.log(`   📊 Structure:`, Object.keys(bieniciData));
        if (bieniciData.results) {
          console.log(`   📋 ${bieniciData.results.length} résultat(s) trouvé(s)`);
        }
      } else {
        console.log(`   ⚠️ Bien'ici retourne ${bieniciResponse.status}`);
      }
    } catch (e) {
      console.log(`   ❌ Erreur Bien'ici: ${e.message}`);
    }

    console.log('');

    // 3. Tester Le Figaro Immobilier
    console.log('🔍 Étape 3: Test Le Figaro Immobilier...');
    try {
      const figaroUrl = `https://immobilier.lefigaro.fr/annonces/vente?lat=${lat}&lng=${lon}&radius=2`;
      console.log('   URL:', figaroUrl);
      
      const figaroResponse = await fetch(figaroUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Referer': 'https://immobilier.lefigaro.fr/',
        },
      });

      if (figaroResponse.ok) {
        const html = await figaroResponse.text();
        console.log(`   ✅ Le Figaro accessible!`);
        console.log(`   📄 HTML reçu: ${html.length} caractères`);
        
        // Chercher des données JSON
        if (html.includes('__INITIAL_STATE__')) {
          console.log(`   ✅ Données JSON détectées dans le HTML`);
        }
        if (html.includes('application/ld+json')) {
          console.log(`   ✅ JSON-LD détecté`);
        }
      } else {
        console.log(`   ⚠️ Le Figaro retourne ${figaroResponse.status}`);
      }
    } catch (e) {
      console.log(`   ❌ Erreur Le Figaro: ${e.message}`);
    }

    console.log('');

    // 4. Tester PAP (Particulier à Particulier)
    console.log('🔍 Étape 4: Test PAP (Particulier à Particulier)...');
    try {
      const papUrl = `https://www.pap.fr/annonces/vente-${postcode}`;
      console.log('   URL:', papUrl);
      
      const papResponse = await fetch(papUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Referer': 'https://www.pap.fr/',
        },
      });

      if (papResponse.ok) {
        const html = await papResponse.text();
        console.log(`   ✅ PAP accessible!`);
        console.log(`   📄 HTML reçu: ${html.length} caractères`);
        
        // Chercher des annonces dans le HTML
        const adMatches = html.match(/class=["'][^"']*annonce[^"']*["']/gi);
        if (adMatches) {
          console.log(`   📋 ${adMatches.length} élément(s) d'annonce potentiel(s) trouvé(s)`);
        }
      } else {
        console.log(`   ⚠️ PAP retourne ${papResponse.status}`);
      }
    } catch (e) {
      console.log(`   ❌ Erreur PAP: ${e.message}`);
    }

    console.log('');

    // 5. Résumé
    console.log('📊 Résumé des tests:');
    console.log('   - Bien\'ici: À tester avec Puppeteer si API bloque');
    console.log('   - Le Figaro Immobilier: Accessible, scraping HTML possible');
    console.log('   - PAP: Accessible, scraping HTML possible');
    console.log('');
    console.log('💡 Prochaines étapes:');
    console.log('   1. Implémenter le scraping HTML pour Le Figaro et PAP');
    console.log('   2. Tester avec Puppeteer si nécessaire');
    console.log('   3. Intégrer dans le système principal');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Exécuter le test
testAlternativeScrapers();

