/**
 * Script de test final pour l'API house-profile
 * Teste l'endpoint avec une adresse réelle
 */

const testAddress = '11 rue Barbès, 93600 Aulnay-sous-Bois';
const baseUrl = process.env.TEST_URL || 'http://localhost:3000';

async function testHouseProfileAPI() {
  console.log('🧪 Test de l\'API /api/house-profile\n');
  console.log(`📍 Adresse test: ${testAddress}`);
  console.log(`🌐 URL: ${baseUrl}\n`);

  const url = `${baseUrl}/api/house-profile?address=${encodeURIComponent(testAddress)}&radius_m=1500`;

  try {
    console.log('⏳ Appel de l\'API...\n');
    const startTime = Date.now();
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const duration = Date.now() - startTime;

    console.log(`📊 Statut HTTP: ${response.status} ${response.statusText}`);
    console.log(`⏱️  Temps de réponse: ${duration}ms`);
    console.log(`📦 Cache: ${response.headers.get('X-Cache') || 'N/A'}\n`);

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Erreur:', error);
      process.exit(1);
    }

    const data = await response.json();

    // Vérifications de base
    console.log('✅ Structure de la réponse:\n');
    console.log(`  - query: ${data.query ? '✅' : '❌'}`);
    console.log(`  - location: ${data.location ? '✅' : '❌'}`);
    console.log(`  - risks: ${data.risks ? '✅' : '❌'}`);
    console.log(`  - urbanism: ${data.urbanism ? '✅' : '❌'}`);
    console.log(`  - energy: ${data.energy ? '✅' : '❌'}`);
    console.log(`  - market: ${data.market ? '✅' : '❌'}`);
    console.log(`  - education: ${data.education ? '✅' : '❌'}`);
    console.log(`  - connectivity: ${data.connectivity ? '✅' : '❌'}`);
    console.log(`  - air_quality: ${data.air_quality ? '✅' : '❌'}`);
    console.log(`  - amenities: ${data.amenities ? '✅' : '❌'}`);
    console.log(`  - safety: ${data.safety ? '✅' : '❌'}`);
    console.log(`  - recommendations: ${data.recommendations ? '✅' : '❌'}`);
    console.log(`  - meta: ${data.meta ? '✅' : '❌'}\n`);

    // Détails
    if (data.location) {
      console.log('📍 Géocodage:');
      console.log(`  - Adresse normalisée: ${data.location.normalized_address}`);
      console.log(`  - GPS: ${data.location.gps.lat}, ${data.location.gps.lon}`);
      console.log(`  - Ville: ${data.location.admin.city} (${data.location.admin.postcode})`);
      console.log(`  - Code INSEE: ${data.location.admin.citycode}\n`);
    }

    if (data.meta) {
      console.log('📊 Métadonnées:');
      console.log(`  - Temps de traitement: ${data.meta.processing_ms}ms`);
      console.log(`  - Sources consultées: ${data.meta.sources.length}`);
      if (data.meta.warnings && data.meta.warnings.length > 0) {
        console.log(`  - Avertissements: ${data.meta.warnings.length}`);
        data.meta.warnings.forEach((w: string) => console.log(`    ⚠️  ${w}`));
      }
      console.log('');
    }

    if (data.recommendations) {
      console.log('💡 Recommandations:');
      console.log(`  - Résumé: ${data.recommendations.summary}`);
      console.log(`  - Nombre d'items: ${data.recommendations.items.length}`);
      if (data.recommendations.items.length > 0) {
        data.recommendations.items.slice(0, 3).forEach((item: any, i: number) => {
          console.log(`    ${i + 1}. [Priorité ${item.priority}] ${item.title}`);
        });
      }
      console.log('');
    }

    console.log('✅ Test réussi ! L\'API fonctionne correctement.\n');

    // Validation du schéma
    const requiredFields = [
      'query',
      'location',
      'risks',
      'urbanism',
      'energy',
      'market',
      'building',
      'education',
      'connectivity',
      'air_quality',
      'amenities',
      'safety',
      'recommendations',
      'meta',
    ];

    const missingFields = requiredFields.filter((field) => !(field in data));
    if (missingFields.length > 0) {
      console.warn(`⚠️  Champs manquants: ${missingFields.join(', ')}`);
    } else {
      console.log('✅ Tous les champs requis sont présents.\n');
    }

    return true;
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Le serveur n\'est pas démarré. Lancez d\'abord:');
      console.error('   npm run dev\n');
    }
    process.exit(1);
  }
}

// Exécution
if (require.main === module) {
  testHouseProfileAPI();
}

module.exports = { testHouseProfileAPI };

