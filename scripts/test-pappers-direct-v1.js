/**
 * Test direct de l'API Pappers Immobilier v1
 * Basé sur la documentation officielle
 */

const address = '36 bis rue auguste blanqui aulnay sous bois 93600';
const apiKey = '26ea0f0d8ab7efb4541df9e4fb5ed7a784400bb9df8433b4';

const baseUrl = 'https://api-immobilier.pappers.fr/v1';
const params = new URLSearchParams({
  adresse: address,
  bases: 'proprietaires,ventes,batiments,dpe,occupants,permis,fonds_de_commerce,coproprietes',
  par_page: '1',
  champs_supplementaires: 'adresse',
});

const url = `${baseUrl}/parcelles?${params.toString()}`;

console.log('🧪 Test direct API Pappers Immobilier v1');
console.log(`📍 Adresse: ${address}`);
console.log(`🔗 URL: ${url.substring(0, 100)}...\n`);

async function test() {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'api-key': apiKey,
        'Accept': 'application/json',
      },
    });
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const text = await response.text();
      console.log(`❌ Erreur: ${text.substring(0, 500)}`);
      return;
    }
    
    const data = await response.json();
    
    console.log('\n✅ Réponse reçue!');
    console.log('📋 Structure de la réponse:');
    console.log(`   Type: ${Array.isArray(data) ? 'Array' : typeof data}`);
    
    if (Array.isArray(data)) {
      console.log(`   Nombre de résultats: ${data.length}`);
      if (data.length > 0) {
        console.log('\n📄 Premier résultat:');
        console.log(JSON.stringify(data[0], null, 2).substring(0, 2000));
      }
    } else if (data.resultats && Array.isArray(data.resultats)) {
      console.log(`   Nombre de résultats: ${data.resultats.length}`);
      if (data.resultats.length > 0) {
        console.log('\n📄 Premier résultat:');
        console.log(JSON.stringify(data.resultats[0], null, 2).substring(0, 2000));
      }
    } else {
      console.log('\n📄 Données:');
      console.log(JSON.stringify(data, null, 2).substring(0, 2000));
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

test();

