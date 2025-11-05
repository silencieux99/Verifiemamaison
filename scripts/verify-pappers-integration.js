/**
 * Vérification complète de l'intégration Pappers dans l'API principale
 */

const address = '10 Rue Ordener 75018 Paris';

async function verifyIntegration() {
  console.log('🔍 VÉRIFICATION DE L\'INTÉGRATION PAPPERS');
  console.log('='.repeat(60));
  console.log(`📍 Adresse test: ${address}\n`);

  try {
    const url = `http://localhost:3000/api/house-profile?address=${encodeURIComponent(address)}&nocache=1`;
    
    console.log('📡 Appel de l\'API house-profile...\n');
    const startTime = Date.now();
    const response = await fetch(url);
    const endTime = Date.now();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('✅ Réponse reçue!\n');
    console.log(`⏱️  Temps de traitement: ${data.meta?.processing_ms || (endTime - startTime)}ms\n`);
    
    // Vérifications
    let allChecks = [];
    
    // 1. Vérifier que pappers est présent dans le profil
    console.log('1️⃣  VÉRIFICATION: Présence des données Pappers');
    if (data.pappers) {
      console.log('   ✅ Données Pappers présentes dans le profil');
      allChecks.push(true);
    } else {
      console.log('   ❌ Données Pappers absentes');
      allChecks.push(false);
    }
    
    // 2. Vérifier les différentes sections Pappers
    console.log('\n2️⃣  VÉRIFICATION: Sections Pappers extraites');
    if (data.pappers) {
      const sections = [];
      if (data.pappers.cadastral) sections.push('Cadastral');
      if (data.pappers.owners && data.pappers.owners.length > 0) sections.push(`${data.pappers.owners.length} Propriétaire(s)`);
      if (data.pappers.transactions && data.pappers.transactions.length > 0) sections.push(`${data.pappers.transactions.length} Transaction(s)`);
      if (data.pappers.buildings && data.pappers.buildings.length > 0) sections.push(`${data.pappers.buildings.length} Bâtiment(s)`);
      if (data.pappers.dpe && data.pappers.dpe.length > 0) sections.push(`${data.pappers.dpe.length} DPE`);
      if (data.pappers.coproprietes && data.pappers.coproprietes.length > 0) sections.push(`${data.pappers.coproprietes.length} Copropriété(s)`);
      if (data.pappers.occupants && data.pappers.occupants.length > 0) sections.push(`${data.pappers.occupants.length} Occupant(s)`);
      if (data.pappers.building_permits && data.pappers.building_permits.length > 0) sections.push(`${data.pappers.building_permits.length} Permis`);
      if (data.pappers.fonds_de_commerce && data.pappers.fonds_de_commerce.length > 0) sections.push(`${data.pappers.fonds_de_commerce.length} Fonds de commerce`);
      
      console.log(`   ✅ Sections trouvées: ${sections.join(', ')}`);
      allChecks.push(sections.length > 0);
    }
    
    // 3. Vérifier que la source est dans les métadonnées
    console.log('\n3️⃣  VÉRIFICATION: Source dans les métadonnées');
    const pappersSource = data.meta && data.meta.sources ? data.meta.sources.find((s) => s.section === 'pappers') : null;
    if (pappersSource) {
      console.log(`   ✅ Source Pappers ajoutée: ${pappersSource.url}`);
      allChecks.push(true);
    } else {
      console.log('   ⚠️  Source Pappers non trouvée dans les métadonnées');
      allChecks.push(false);
    }
    
    // 4. Vérifier la structure des données
    console.log('\n4️⃣  VÉRIFICATION: Structure des données');
    if (data.pappers) {
      const checks = [];
      
      // Propriétaires
      if (data.pappers.owners) {
        const hasOwnerData = data.pappers.owners.some((o) => o.siren || o.name || o.company_name);
        checks.push({ name: 'Propriétaires avec données', ok: hasOwnerData });
      }
      
      // Transactions
      if (data.pappers.transactions) {
        const hasTransactionData = data.pappers.transactions.some((t) => t.date || t.price_eur);
        checks.push({ name: 'Transactions avec données', ok: hasTransactionData });
      }
      
      // Cadastral
      if (data.pappers.cadastral) {
        const hasCadastralData = data.pappers.cadastral.parcel || data.pappers.cadastral.surface_m2;
        checks.push({ name: 'Données cadastrales', ok: hasCadastralData });
      }
      
      checks.forEach(check => {
        console.log(`   ${check.ok ? '✅' : '❌'} ${check.name}`);
        allChecks.push(check.ok);
      });
    }
    
    // 5. Vérifier qu'il n'y a pas d'erreurs
    console.log('\n5️⃣  VÉRIFICATION: Gestion des erreurs');
    if (data.meta && data.meta.warnings) {
      const pappersWarning = data.meta.warnings.find((w) => w.includes('Pappers'));
      if (pappersWarning) {
        console.log(`   ⚠️  Avertissement: ${pappersWarning}`);
      } else {
        console.log('   ✅ Aucun avertissement Pappers');
      }
    } else {
      console.log('   ✅ Aucun avertissement');
    }
    
    // 6. Vérifier les données brutes
    console.log('\n6️⃣  VÉRIFICATION: Données brutes disponibles');
    if (data.pappers && data.pappers.raw) {
      console.log('   ✅ Données brutes (raw) présentes pour débogage');
      allChecks.push(true);
    } else {
      console.log('   ⚠️  Données brutes absentes (peut être normal si pas de données)');
    }
    
    // Résumé
    console.log('\n' + '='.repeat(60));
    const successCount = allChecks.filter(Boolean).length;
    const totalChecks = allChecks.length;
    console.log(`\n📊 RÉSUMÉ: ${successCount}/${totalChecks} vérifications réussies`);
    
    if (successCount === totalChecks) {
      console.log('✅ Intégration Pappers complète et fonctionnelle!\n');
    } else {
      console.log('⚠️  Certaines vérifications ont échoué. Vérifiez les détails ci-dessus.\n');
    }
    
    // Afficher un aperçu des données
    if (data.pappers) {
      console.log('📋 APERÇU DES DONNÉES PAPPERS:\n');
      console.log(`   Propriétaires: ${(data.pappers.owners && data.pappers.owners.length) || 0}`);
      console.log(`   Transactions: ${(data.pappers.transactions && data.pappers.transactions.length) || 0}`);
      console.log(`   Bâtiments: ${(data.pappers.buildings && data.pappers.buildings.length) || 0}`);
      console.log(`   DPE: ${(data.pappers.dpe && data.pappers.dpe.length) || 0}`);
      console.log(`   Copropriétés: ${(data.pappers.coproprietes && data.pappers.coproprietes.length) || 0}`);
      console.log(`   Occupants: ${(data.pappers.occupants && data.pappers.occupants.length) || 0}`);
      console.log(`   Permis: ${(data.pappers.building_permits && data.pappers.building_permits.length) || 0}`);
      console.log(`   Fonds de commerce: ${(data.pappers.fonds_de_commerce && data.pappers.fonds_de_commerce.length) || 0}\n`);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('\n💡 Assurez-vous que le serveur de développement est démarré: npm run dev');
  }
}

verifyIntegration();

