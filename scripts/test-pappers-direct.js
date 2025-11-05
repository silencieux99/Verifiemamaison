/**
 * Test direct de l'API Pappers Immo
 * Pour trouver le bon endpoint et format
 */

const address = '36 bis rue auguste blanqui a aulnay sous bois 93600';
const apiKey = '26ea0f0d8ab7efb4541df9e4fb5ed7a784400bb9df8433b4';

// Différents endpoints possibles à tester
const endpoints = [
  {
    name: 'API Pappers v2 Immo Search',
    url: `https://api.pappers.fr/v2/immo/search?q=${encodeURIComponent(address)}`,
  },
  {
    name: 'API Pappers v2 Immo Adresse',
    url: `https://api.pappers.fr/v2/immo?adresse=${encodeURIComponent(address)}`,
  },
  {
    name: 'Pappers.fr API Immo',
    url: `https://pappers.fr/api/v2/immo/search?q=${encodeURIComponent(address)}`,
  },
  {
    name: 'API Pappers Immo (sans v2)',
    url: `https://api.pappers.fr/immo/search?q=${encodeURIComponent(address)}`,
  },
  {
    name: 'API Pappers Immo (adresse param)',
    url: `https://api.pappers.fr/immo?adresse=${encodeURIComponent(address)}`,
  },
];

async function testEndpoint(endpoint) {
  console.log(`\n🔍 Test: ${endpoint.name}`);
  console.log(`   URL: ${endpoint.url}`);
  
  try {
    const response = await fetch(endpoint.url, {
      method: 'GET',
      headers: {
        'api-key': apiKey,
        'Accept': 'application/json',
      },
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Succès! Données reçues:`);
      console.log(`   Structure:`, Object.keys(data).join(', '));
      console.log(`   Preview:`, JSON.stringify(data).substring(0, 300));
      return { success: true, data, endpoint };
    } else {
      const text = await response.text();
      console.log(`   ❌ Erreur: ${text.substring(0, 200)}`);
      return { success: false, error: text };
    }
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testAll() {
  console.log('🧪 Test des endpoints possibles pour Pappers Immo API');
  console.log('='.repeat(60));
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    if (result.success) {
      console.log('\n✅ ENDPOINT FONCTIONNEL TROUVÉ!');
      console.log(`   Endpoint: ${endpoint.url}`);
      console.log('\n📊 Données complètes:');
      console.log(JSON.stringify(result.data, null, 2));
      return;
    }
    // Petit délai entre les tentatives
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n❌ Aucun endpoint fonctionnel trouvé');
  console.log('\n💡 Suggestions:');
  console.log('   1. Vérifier la documentation officielle de Pappers Immo');
  console.log('   2. Vérifier que la clé API est correcte');
  console.log('   3. Vérifier les limites de l\'API (gratuit vs payant)');
}

testAll();

