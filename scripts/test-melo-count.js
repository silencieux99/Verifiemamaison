/**
 * Script pour tester le nombre de résultats retournés par l'API Melo
 */

require('dotenv').config({ path: '.env.local' });

const testMeloCount = async () => {
  const environment = process.env.MELO_ENVIRONMENT || 'production';
  const baseUrl = environment === 'sandbox' 
    ? 'https://preprod-api.notif.immo'
    : 'https://api.notif.immo';
  const apiKey = process.env.MELO_API_KEY;

  console.log('🔍 Test du nombre de résultats API Melo\n');
  console.log('Configuration:');
  console.log(`  - Base URL: ${baseUrl}`);
  console.log(`  - Environment: ${environment}`);
  console.log(`  - API Key: ${apiKey ? apiKey.substring(0, 8) + '...' : 'NON CONFIGURÉE'}\n`);

  if (!apiKey) {
    console.error('❌ MELO_API_KEY non configurée dans .env.local');
    process.exit(1);
  }

  // Test avec plusieurs adresses
  const testAddresses = [
    {
      name: 'Paris Centre (48.8566, 2.3522)',
      lat: 48.8566,
      lon: 2.3522,
      radius_km: 2,
    },
    {
      name: 'Paris Centre - Rayon 5km',
      lat: 48.8566,
      lon: 2.3522,
      radius_km: 5,
    },
    {
      name: 'Aulnay-sous-Bois (48.9368, 2.5014)',
      lat: 48.9368,
      lon: 2.5014,
      radius_km: 2,
    },
    {
      name: 'Lyon Centre (45.7640, 4.8357)',
      lat: 45.7640,
      lon: 4.8357,
      radius_km: 2,
    },
  ];

  for (const address of testAddresses) {
    console.log(`\n📍 ${address.name}`);
    console.log(`   Rayon: ${address.radius_km}km\n`);

    try {
      const url = `${baseUrl}/documents/properties?lat=${address.lat}&lon=${address.lon}&radius=${address.radius_km}`;
      
      const response = await fetch(url, {
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const properties = data['hydra:member'] || [];
        const totalItems = data['hydra:totalItems'] || 0;
        
        // Compter les adverts
        const totalAdverts = properties.reduce((sum, prop) => {
          return sum + (prop.adverts?.length || 0);
        }, 0);

        console.log(`   ✅ Résultats:`);
        console.log(`      - Propriétés: ${properties.length}`);
        console.log(`      - Total (hydra:totalItems): ${totalItems}`);
        console.log(`      - Annonces totales: ${totalAdverts}`);
        console.log(`      - Annonces par propriété (moyenne): ${properties.length > 0 ? (totalAdverts / properties.length).toFixed(2) : 0}`);

        // Afficher quelques détails
        if (properties.length > 0) {
          console.log(`\n   📊 Détails des premières propriétés:`);
          properties.slice(0, 3).forEach((prop, idx) => {
            const adverts = prop.adverts || [];
            const firstAdvert = adverts[0];
            console.log(`      ${idx + 1}. ${prop.address || 'Adresse non disponible'}`);
            console.log(`         - Annonces: ${adverts.length}`);
            if (firstAdvert) {
              console.log(`         - Prix: ${firstAdvert.price ? firstAdvert.price.toLocaleString('fr-FR') + '€' : 'N/A'}`);
              console.log(`         - Surface: ${firstAdvert.surface || 'N/A'} m²`);
              console.log(`         - Prix/m²: ${firstAdvert.pricePerMeter ? firstAdvert.pricePerMeter.toLocaleString('fr-FR') + '€' : 'N/A'}`);
            }
          });
        }
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Erreur ${response.status}:`, errorText.substring(0, 200));
      }
    } catch (error) {
      console.log(`   ❌ Erreur:`, error.message);
    }
  }

  console.log('\n\n📝 Résumé:');
  console.log('Le nombre de résultats dépend de:');
  console.log('  - La zone géographique (Paris a plus de résultats que les zones rurales)');
  console.log('  - Le rayon de recherche');
  console.log('  - L\'environnement (sandbox peut avoir des données limitées)');
};

testMeloCount().catch(console.error);

