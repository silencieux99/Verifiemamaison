/**
 * Test de l'intégration Pappers dans notre API house-profile
 */

const address = '10 Rue Ordener 75018 Paris';

async function testIntegration() {
  console.log('🧪 Test de l\'intégration Pappers dans house-profile');
  console.log(`📍 Adresse: ${address}\n`);

  try {
    const url = `http://localhost:3000/api/house-profile?address=${encodeURIComponent(address)}`;
    
    console.log('📡 Appel de l\'API house-profile...');
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('✅ Réponse reçue!\n');
    
    // Afficher les données Pappers si disponibles
    if (data.pappers && Object.keys(data.pappers).length > 0) {
      console.log('📊 DONNÉES PAPPERS IMMO INTÉGRÉES:');
      console.log('='.repeat(60));
      
      if (data.pappers.owner) {
        console.log('\n👤 PROPRIÉTAIRE:');
        console.log(JSON.stringify(data.pappers.owner, null, 2));
      }
      
      if (data.pappers.cadastral) {
        console.log('\n🏛️ CADASTRAL:');
        console.log(JSON.stringify(data.pappers.cadastral, null, 2));
      }
      
      if (data.pappers.transactions && data.pappers.transactions.length > 0) {
        console.log(`\n💰 TRANSACTIONS (${data.pappers.transactions.length}):`);
        data.pappers.transactions.slice(0, 5).forEach((t, i) => {
          console.log(`  ${i + 1}. ${t.date || 'N/A'} - ${t.price_eur ? `${t.price_eur.toLocaleString('fr-FR')}€` : 'Prix N/A'}${t.surface_m2 ? ` (${t.surface_m2}m²)` : ''} - ${t.type || 'N/A'}`);
        });
      }
      
      if (data.pappers.copropriete) {
        console.log('\n🏢 COPROPRIÉTÉ:');
        console.log(JSON.stringify(data.pappers.copropriete, null, 2));
      }
      
      if (data.pappers.building_permits && data.pappers.building_permits.length > 0) {
        console.log(`\n📋 PERMIS DE CONSTRUIRE (${data.pappers.building_permits.length}):`);
        data.pappers.building_permits.forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.date || 'N/A'} - ${p.type || 'N/A'}`);
        });
      }
      
      if (data.pappers.business) {
        console.log('\n🏪 LOCAL COMMERCIAL:');
        console.log(JSON.stringify(data.pappers.business, null, 2));
      }
      
      console.log('\n✅ Intégration Pappers fonctionnelle!');
    } else {
      console.log('⚠️  Aucune donnée Pappers trouvée');
      console.log('   Vérifiez que le serveur de développement est démarré: npm run dev');
    }
    
    // Vérifier les sources
    if (data.meta && data.meta.sources) {
      const pappersSource = data.meta.sources.find(s => s.section === 'pappers');
      if (pappersSource) {
        console.log('\n✅ Source Pappers ajoutée aux métadonnées');
      }
    }
    
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('\n💡 Assurez-vous que le serveur de développement est démarré:');
    console.error('   npm run dev');
  }
}

testIntegration();

