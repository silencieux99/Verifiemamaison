/**
 * Test de l'API Pappers standard (entreprises)
 * Peut-être que Pappers Immo utilise cette API
 */

const address = '36 bis rue auguste blanqui aulnay sous bois 93600';
const apiKey = '26ea0f0d8ab7efb4541df9e4fb5ed7a784400bb9df8433b4';

async function testPappersStandard() {
  console.log('🧪 Test de l\'API Pappers standard (entreprises)');
  console.log(`📍 Adresse: ${address}\n`);
  
  // Test 1: Recherche par adresse
  const endpoints = [
    {
      name: 'Recherche entreprise par adresse',
      url: `https://api.pappers.fr/v2/entreprise?api_key=${apiKey}&adresse=${encodeURIComponent(address)}`,
    },
    {
      name: 'Recherche entreprise (adresse complète)',
      url: `https://api.pappers.fr/v2/entreprise?api_key=${apiKey}&adresse_complete=${encodeURIComponent(address)}`,
    },
    {
      name: 'Recherche entreprise (q)',
      url: `https://api.pappers.fr/v2/entreprise?api_key=${apiKey}&q=${encodeURIComponent(address)}`,
    },
    {
      name: 'Recherche entreprise (header api-key)',
      url: `https://api.pappers.fr/v2/entreprise?adresse=${encodeURIComponent(address)}`,
      headers: { 'api-key': apiKey },
    },
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n🔍 Test: ${endpoint.name}`);
    console.log(`   URL: ${endpoint.url.substring(0, 100)}...`);
    
    try {
      const response = await fetch(endpoint.url, {
        method: 'GET',
        headers: endpoint.headers || {
          'api-key': apiKey,
          'Accept': 'application/json',
        },
      });
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Succès!`);
        console.log(`   Type de réponse:`, Array.isArray(data) ? 'Array' : typeof data);
        if (Array.isArray(data)) {
          console.log(`   Nombre de résultats: ${data.length}`);
          if (data.length > 0) {
            console.log(`   Premier résultat:`, JSON.stringify(data[0], null, 2).substring(0, 500));
          }
        } else {
          console.log(`   Clés:`, Object.keys(data).join(', '));
          console.log(`   Données:`, JSON.stringify(data, null, 2).substring(0, 500));
        }
        return data;
      } else {
        const text = await response.text();
        console.log(`   ❌ Erreur: ${text.substring(0, 200)}`);
      }
    } catch (error) {
      console.log(`   ❌ Exception: ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n💡 Note: Pappers Immo pourrait nécessiter:');
  console.log('   - Un endpoint spécifique différent');
  console.log('   - Une documentation accessible depuis votre compte Pappers');
  console.log('   - Une méthode de recherche différente (par coordonnées, par code INSEE, etc.)');
}

testPappersStandard();

