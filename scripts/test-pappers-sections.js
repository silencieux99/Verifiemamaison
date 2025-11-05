/**
 * Compte les sections Pappers qui seront créées dans le rapport
 */

const address = '10 Rue Ordener 75018 Paris';

async function testSections() {
  console.log('🧪 Test des sections Pappers dans le rapport interactif');
  console.log(`📍 Adresse: ${address}\n`);

  try {
    const url = `http://localhost:3000/api/house-profile?address=${encodeURIComponent(address)}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('📊 SECTIONS PAPPERS QUI SERONT CRÉÉES:\n');
    
    if (data.pappers) {
      const pappers = data.pappers;
      let totalSections = 0;
      let totalItems = 0;
      
      // 1. Cadastral
      if (pappers.cadastral) {
        totalSections++;
        let cadItems = 0;
        if (pappers.cadastral.parcel) cadItems++;
        if (pappers.cadastral.section) cadItems++;
        if (pappers.cadastral.prefixe) cadItems++;
        if (pappers.cadastral.numero_plan) cadItems++;
        if (pappers.cadastral.surface_m2) cadItems++;
        if (pappers.cadastral.autres_adresses) {
          cadItems += 1 + pappers.cadastral.autres_adresses.length;
        }
        totalItems += cadItems;
        console.log(`  ✅ Cadastre Pappers (${cadItems} items)`);
      }
      
      // 2. Propriétaires
      if (pappers.owners && pappers.owners.length > 0) {
        pappers.owners.forEach((owner, idx) => {
          totalSections++;
          let ownerItems = 0;
          if (owner.name) ownerItems++;
          if (owner.type) ownerItems++;
          if (owner.siren) ownerItems++;
          if (owner.siret) ownerItems++;
          if (owner.legal_form) ownerItems++;
          if (owner.code_naf) ownerItems++;
          if (owner.effectif) ownerItems++;
          if (owner.address) ownerItems++;
          totalItems += ownerItems;
          console.log(`  ✅ Propriétaire ${idx + 1} (${ownerItems} items) - ${owner.name || owner.company_name || 'N/A'}`);
        });
      }
      
      // 3. Transactions
      if (pappers.transactions && pappers.transactions.length > 0) {
        totalSections++;
        totalItems += 1 + pappers.transactions.length;
        console.log(`  ✅ Historique des transactions (${1 + pappers.transactions.length} items: 1 total + ${pappers.transactions.length} transactions)`);
      }
      
      // 4. Bâtiments
      if (pappers.buildings && pappers.buildings.length > 0) {
        pappers.buildings.forEach((building, idx) => {
          totalSections++;
          let buildingItems = 0;
          if (building.numero) buildingItems++;
          if (building.nature) buildingItems++;
          if (building.usage) buildingItems++;
          if (building.annee_construction) buildingItems++;
          if (building.nombre_logements) buildingItems++;
          if (building.surface) buildingItems++;
          if (building.adresse) buildingItems++;
          totalItems += buildingItems;
          console.log(`  ✅ Bâtiment ${idx + 1} (${buildingItems} items)`);
        });
      }
      
      // 5. DPE
      if (pappers.dpe && pappers.dpe.length > 0) {
        pappers.dpe.forEach((dpe, idx) => {
          totalSections++;
          let dpeItems = 0;
          if (dpe.classe_bilan) dpeItems++;
          if (dpe.type_installation_chauffage) dpeItems++;
          if (dpe.type_energie_chauffage) dpeItems++;
          if (dpe.date_etablissement) dpeItems++;
          if (dpe.adresse) dpeItems++;
          totalItems += dpeItems;
          console.log(`  ✅ DPE ${idx + 1} (${dpeItems} items) - Classe: ${dpe.classe_bilan || 'N/A'}`);
        });
      }
      
      // 6. Copropriétés
      if (pappers.coproprietes && pappers.coproprietes.length > 0) {
        pappers.coproprietes.forEach((copro, idx) => {
          totalSections++;
          let coproItems = 0;
          if (copro.name) coproItems++;
          if (copro.numero_immatriculation) coproItems++;
          if (copro.mandat_en_cours) coproItems++;
          if (copro.nombre_total_lots) coproItems++;
          if (copro.nombre_lots_habitation) coproItems++;
          if (copro.type_syndic) coproItems++;
          if (copro.manager) coproItems++;
          if (copro.periode_construction) coproItems++;
          if (copro.adresse) coproItems++;
          totalItems += coproItems;
          console.log(`  ✅ Copropriété ${idx + 1} (${coproItems} items) - ${copro.name || 'N/A'}`);
        });
      }
      
      // 7. Occupants
      if (pappers.occupants && pappers.occupants.length > 0) {
        totalSections++;
        totalItems += 1 + pappers.occupants.length;
        console.log(`  ✅ Occupants (${1 + pappers.occupants.length} items: 1 total + ${pappers.occupants.length} occupants)`);
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
      console.log(`\n✅ RÉSUMÉ:`);
      console.log(`   📊 ${totalSections} sections Pappers créées`);
      console.log(`   📝 ${totalItems} items/lignes affichées`);
      console.log(`\n💡 Toutes ces sections seront visibles dans le rapport interactif`);
      console.log(`   avec des onglets séparés pour chaque catégorie.\n`);
      
    } else {
      console.log('⚠️  Aucune donnée Pappers trouvée');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('\n💡 Assurez-vous que le serveur est démarré: npm run dev');
  }
}

testSections();

