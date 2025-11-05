/**
 * Script de test pour l'API Pappers Immo
 * Test avec une adresse spécifique
 */

const address = '36 bis rue auguste blanqui a aulnay sous bois 93600';

async function testPappersAPI() {
  console.log('🧪 Test de l\'API Pappers Immo');
  console.log(`📍 Adresse: ${address}\n`);

  try {
    // Test de l'API house-profile qui inclut maintenant Pappers
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
      console.log('📊 DONNÉES PAPPERS IMMO:');
      console.log('='.repeat(50));
      
      if (data.pappers.owner) {
        console.log('\n👤 PROPRIÉTAIRE:');
        console.log(JSON.stringify(data.pappers.owner, null, 2));
      }
      
      if (data.pappers.transactions && data.pappers.transactions.length > 0) {
        console.log(`\n💰 TRANSACTIONS (${data.pappers.transactions.length}):`);
        data.pappers.transactions.forEach((t, i) => {
          console.log(`  ${i + 1}. ${t.date || 'N/A'} - ${t.price_eur ? `${t.price_eur.toLocaleString('fr-FR')}€` : 'Prix N/A'}${t.surface_m2 ? ` (${t.surface_m2}m²)` : ''}`);
        });
      }
      
      if (data.pappers.cadastral) {
        console.log('\n🏛️ CADASTRAL:');
        console.log(JSON.stringify(data.pappers.cadastral, null, 2));
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
      
      if (data.pappers.raw) {
        console.log('\n📄 DONNÉES BRUTES (extrait):');
        console.log(JSON.stringify(data.pappers.raw, null, 2).substring(0, 500) + '...');
      }
    } else {
      console.log('⚠️  Aucune donnée Pappers trouvée');
      console.log('   Cela peut signifier que:');
      console.log('   - L\'API Pappers n\'a pas retourné de données pour cette adresse');
      console.log('   - L\'endpoint API utilisé n\'est pas le bon');
      console.log('   - La clé API n\'est pas valide ou les limites sont atteintes');
    }
    
    // Vérifier les sources
    if (data.meta && data.meta.sources) {
      const pappersSource = data.meta.sources.find(s => s.section === 'pappers');
      if (pappersSource) {
        console.log('\n✅ Source Pappers ajoutée aux métadonnées');
      } else {
        console.log('\n⚠️  Source Pappers non trouvée dans les métadonnées');
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Test terminé');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.error('\n💡 Assurez-vous que le serveur de développement est démarré:');
    console.error('   npm run dev');
    process.exit(1);
  }
}

testPappersAPI();

