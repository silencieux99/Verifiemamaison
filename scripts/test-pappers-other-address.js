/**
 * Test avec différentes adresses pour trouver une qui a des données
 */

const apiKey = '26ea0f0d8ab7efb4541df9e4fb5ed7a784400bb9df8433b4';
const baseUrl = 'https://api-immobilier.pappers.fr/v1';

// Plusieurs adresses à tester
const addresses = [
  '10 Rue Ordener 75018 Paris',
  '16 Place Saint Pierre 31000 Toulouse',
  '1 Rue de Rivoli 75001 Paris',
  '50 Avenue des Champs-Élysées 75008 Paris',
  '36 bis rue auguste blanqui aulnay sous bois 93600',
];

async function testAddress(address) {
  const params = new URLSearchParams({
    adresse: address,
    bases: 'proprietaires,ventes,batiments,dpe,occupants,permis,fonds_de_commerce,coproprietes',
    par_page: '1',
    champs_supplementaires: 'adresse',
  });
  
  const url = `${baseUrl}/parcelles?${params.toString()}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'api-key': apiKey,
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.log(`❌ ${address}`);
      console.log(`   Status: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    let parcelle = null;
    if (Array.isArray(data)) {
      parcelle = data.length > 0 ? data[0] : null;
    } else if (data.resultats && Array.isArray(data.resultats)) {
      parcelle = data.resultats.length > 0 ? data.resultats[0] : null;
    } else if (data.numero) {
      parcelle = data;
    }
    
    if (parcelle) {
      console.log(`✅ ${address}`);
      console.log(`   Parcelle trouvée: ${parcelle.numero || 'N/A'}`);
      console.log(`   Propriétaires: ${parcelle.proprietaires?.length || 0}`);
      console.log(`   Ventes: ${parcelle.ventes?.length || 0}`);
      console.log(`   Copropriétés: ${parcelle.coproprietes?.length || 0}`);
      console.log(`   Permis: ${parcelle.permis?.length || 0}`);
      console.log(`   Fonds de commerce: ${parcelle.fonds_de_commerce?.length || 0}`);
      console.log('');
      return { address, parcelle };
    } else {
      console.log(`⚠️  ${address} - Aucune parcelle trouvée`);
      return null;
    }
  } catch (error) {
    console.log(`❌ ${address} - Erreur: ${error.message}`);
    return null;
  }
}

async function testAll() {
  console.log('🧪 Test de plusieurs adresses avec Pappers Immo API\n');
  console.log('='.repeat(60));
  console.log('');
  
  for (const address of addresses) {
    const result = await testAddress(address);
    if (result) {
      console.log('\n📊 Détails de la première parcelle trouvée:');
      console.log(JSON.stringify(result.parcelle, null, 2).substring(0, 3000));
      break; // Arrêter après avoir trouvé une adresse avec des données
    }
    await new Promise(resolve => setTimeout(resolve, 500)); // Délai entre les requêtes
  }
}

testAll();

