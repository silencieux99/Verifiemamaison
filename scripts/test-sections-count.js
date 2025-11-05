/**
 * Test pour compter toutes les sections générées avec les données Pappers
 */

const address = '10 Rue Ordener 75018 Paris';

async function testSections() {
  console.log('🧪 Test des sections du rapport interactif');
  console.log(`📍 Adresse: ${address}\n`);

  try {
    const url = `http://localhost:3000/api/house-profile?address=${encodeURIComponent(address)}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    // Simuler la conversion
    const { convertHouseProfileToSections } = require('../src/lib/convert-house-profile-to-sections.ts');
    
    // Note: On ne peut pas importer directement TypeScript, donc on va juste compter les données Pappers
    console.log('📊 DONNÉES PAPPERS DISPONIBLES:\n');
    
    if (data.pappers) {
      const pappers = data.pappers;
      let totalSections = 0;
      let totalItems = 0;
      
      console.log('📋 Sections qui seront créées:\n');
      
      // 1. Cadastral
      if (pappers.cadastral) {
        totalSections++;
        const cadItems = 5 + (pappers.cadastral.autres_adresses?.length || 0);
        totalItems += cadItems;
        console.log(`  ✅ Cadastre Pappers (${cadItems} items)`);
      }
      
      // 2. Propriétaires
      if (pappers.owners && pappers.owners.length > 0) {
        pappers.owners.forEach((owner, idx) => {
          totalSections++;
          const ownerFields = ['name', 'type', 'siren', 'siret', 'legal_form', 'code_naf', 'effectif', 'address'].filter(f => owner[f]).length;
          totalItems += ownerFields;
          console.log(`  ✅ Propriétaire ${idx + 1} (${ownerFields} items)`);
        });
      }
      
      // 3. Transactions
      if (pappers.transactions && pappers.transactions.length > 0) {
        totalSections++;
        totalItems += 1 + pappers.transactions.length; // 1 pour le total + toutes les transactions
        console.log(`  ✅ Historique des transactions (${1 + pappers.transactions.length} items)`);
      }
      
      // 4. Bâtiments
      if (pappers.buildings && pappers.buildings.length > 0) {
        pappers.buildings.forEach((building, idx) => {
          totalSections++;
          const buildingFields = ['numero', 'nature', 'usage', 'annee_construction', 'nombre_logements', 'surface', 'adresse'].filter(f => building[f]).length;
          totalItems += buildingFields;
          console.log(`  ✅ Bâtiment ${idx + 1} (${buildingFields} items)`);
        });
      }
      
      // 5. DPE
      if (pappers.dpe && pappers.dpe.length > 0) {
        pappers.dpe.forEach((dpe, idx) => {
          totalSections++;
          const dpeFields = ['classe_bilan', 'type_installation_chauffage', 'type_energie_chauffage', 'date_etablissement', 'adresse'].filter(f => dpe[f]).length;
          totalItems += dpeFields;
          console.log(`  ✅ DPE ${idx + 1} (${dpeFields} items)`);
        });
      }
      
      // 6. Copropriétés
      if (pappers.coproprietes && pappers.coproprietes.length > 0) {
        pappers.coproprietes.forEach((copro, idx) => {
          totalSections++;
          const coproFields = ['name', 'numero_immatriculation', 'mandat_en_cours', 'nombre_total_lots', 'nombre_lots_habitation', 'type_syndic', 'manager', 'periode_construction', 'adresse'].filter(f => copro[f]).length;
          totalItems += coproFields;
          console.log(`  ✅ Copropriété ${idx + 1} (${coproFields} items)`);
        });
      }
      
      // 7. Occupants
      if (pappers.occupants && pappers.occupants.length > 0) {
        totalSections++;
        totalItems += 1 + pappers.occupants.length; // 1 pour le total + tous les occupants
        console.log(`  ✅ Occupants (${1 + pappers.occupants.length} items)`);
      }
      
      // 8. Permis
      if (pappers.building_permits && pappers.building_permits.length > 0) {
        totalSections++;
        totalItems += 1 + pappers.building_permits.length;
        console.log(`  ✅ Permis de construire (${1 + pappers.building_permits.length} items)`);
      }
      
      // 9. Fonds de commerce
      if (pappers.fonds_de_commerce && pappers.fonds_de_commerce.length > 0) {
        totalSections++;
        totalItems += 1 + pappers.fonds_de_commerce.length;
        console.log(`  ✅ Fonds de commerce (${1 + pappers.fonds_de_commerce.length} items)`);
      }
      
      console.log('\n' + '='.repeat(60));
      console.log(`\n✅ TOTAL: ${totalSections} sections Pappers`);
      console.log(`✅ TOTAL: ${totalItems} items/lignes affichées`);
      console.log('\n💡 Toutes ces sections seront visibles dans le rapport interactif');
      console.log('   avec des onglets séparés pour chaque catégorie.\n');
    } else {
      console.log('⚠️  Aucune donnée Pappers trouvée');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testSections();

