/**
 * Script de test pour l'API Melo
 * Teste l'intégration avec une adresse réelle
 */

require('dotenv').config({ path: '.env.local' });

const testMeloAPI = async () => {
  // Essayer différentes URLs selon l'environnement
  const environment = process.env.MELO_ENVIRONMENT || 'production';
  // L'URL de base selon la doc:
  // - Production: https://api.notif.immo
  // - Sandbox: https://preprod-api.notif.immo
  // Forcer l'URL correcte selon l'environnement (ignorer .env.local si nécessaire)
  const baseUrl = environment === 'sandbox' 
    ? 'https://preprod-api.notif.immo'
    : 'https://api.notif.immo';
  const apiKey = process.env.MELO_API_KEY;

  console.log('🔍 Test de l\'API Melo\n');
  console.log('Configuration:');
  console.log(`  - Base URL: ${baseUrl}`);
  console.log(`  - Environment: ${environment}`);
  console.log(`  - API Key: ${apiKey ? apiKey.substring(0, 8) + '...' : 'NON CONFIGURÉE'}\n`);

  if (!apiKey) {
    console.error('❌ MELO_API_KEY non configurée dans .env.local');
    process.exit(1);
  }

  // Coordonnées GPS d'une adresse parisienne (exemple: 11 rue Barbès, Aulnay-sous-Bois)
  const testAddresses = [
    {
      name: 'Aulnay-sous-Bois (11 rue Barbès)',
      lat: 48.9368,
      lon: 2.5014,
      radius_m: 2000,
    },
    {
      name: 'Paris Centre',
      lat: 48.8566,
      lon: 2.3522,
      radius_m: 2000,
    },
  ];

  for (const address of testAddresses) {
    console.log(`\n📍 Test avec: ${address.name}`);
    console.log(`   Coordonnées: ${address.lat}, ${address.lon}`);
    console.log(`   Rayon: ${address.radius_m}m\n`);

    // Test 1: Endpoint selon la doc: /documents/properties/{id}
    // Mais d'abord, testons une recherche/liste
    console.log('1️⃣  Test endpoint /documents/properties (liste)...');
    try {
      // Essayer différents formats d'endpoints possibles
      const propertiesUrl = `${baseUrl}/documents/properties?lat=${address.lat}&lon=${address.lon}&radius=${address.radius_m / 1000}&limit=5`;
      console.log(`   URL: ${propertiesUrl}`);
      
      const propertiesResponse = await fetch(propertiesUrl, {
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
      });

      console.log(`   Status: ${propertiesResponse.status} ${propertiesResponse.statusText}`);

      if (propertiesResponse.ok) {
        const propertiesData = await propertiesResponse.json();
        console.log('   ✅ Succès!');
        console.log(`   Données reçues:`, JSON.stringify(propertiesData, null, 2));
      } else {
        const errorText = await propertiesResponse.text();
        console.log(`   ❌ Erreur ${propertiesResponse.status}:`, errorText.substring(0, 500));
        // Si c'est un 401, essayer de voir si c'est un problème de format de clé
        if (propertiesResponse.status === 401) {
          console.log('   💡 Note: 401 peut indiquer que la clé sandbox n\'a pas les permissions ou que le format est incorrect');
        }
      }
    } catch (error) {
      console.log('   ❌ Erreur:', error.message);
      if (error.cause) {
        console.log('   Détails:', error.cause.message || error.cause);
      }
    }

    // Test 2: Recherche de propriétés
    console.log('\n2️⃣  Test recherche de propriétés (properties)...');
    try {
      const propertiesUrl = `${baseUrl}/api/v1/properties/search?lat=${address.lat}&lon=${address.lon}&radius=${address.radius_m / 1000}&limit=5`;
      console.log(`   URL: ${propertiesUrl}`);
      
      const propertiesResponse = await fetch(propertiesUrl, {
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
      });

      console.log(`   Status: ${propertiesResponse.status} ${propertiesResponse.statusText}`);

      if (propertiesResponse.ok) {
        const propertiesData = await propertiesResponse.json();
        console.log('   ✅ Succès!');
        console.log(`   Données reçues:`, JSON.stringify(propertiesData, null, 2).substring(0, 500));
      } else {
        const errorText = await propertiesResponse.text();
        console.log('   ❌ Erreur:', errorText.substring(0, 200));
      }
    } catch (error) {
      console.log('   ❌ Erreur:', error.message);
    }

    // Test 3: Endpoint alternatif possible
    console.log('\n3️⃣  Test endpoint alternatif (search simple)...');
    try {
      const searchUrl = `${baseUrl}/api/v1/search?lat=${address.lat}&lon=${address.lon}&radius=${address.radius_m / 1000}&limit=5`;
      console.log(`   URL: ${searchUrl}`);
      
      const searchResponse = await fetch(searchUrl, {
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
      });

      console.log(`   Status: ${searchResponse.status} ${searchResponse.statusText}`);

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        console.log('   ✅ Succès!');
        console.log(`   Données reçues:`, JSON.stringify(searchData, null, 2).substring(0, 500));
      } else {
        const errorText = await searchResponse.text();
        console.log('   ❌ Erreur:', errorText.substring(0, 200));
      }
    } catch (error) {
      console.log('   ❌ Erreur:', error.message);
    }
  }

  console.log('\n\n📝 Résumé:');
  console.log('Si tous les tests échouent avec 404, les endpoints doivent être adaptés selon la documentation Melo.');
  console.log('Consultez: https://docs.melo.io/api-reference');
};

testMeloAPI().catch(console.error);

