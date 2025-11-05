/**
 * Script de test pour l'API DVF (Demandes de Valeurs Foncières)
 * Teste la récupération des prix immobiliers
 */

async function testDVFAPI() {
  console.log('🧪 Test de l\'API DVF\n');
  
  // Test avec une adresse connue (Paris pour avoir des données)
  const testAddress = "10 rue de Rivoli, 75004 Paris";
  console.log(`📍 Adresse de test: ${testAddress}\n`);
  
  try {
    // 1) Géocoder l'adresse avec l'API BAN
    console.log('1️⃣ Géocodage de l\'adresse avec l\'API BAN...');
    const q = encodeURIComponent(testAddress);
    const banUrl = `https://api-adresse.data.gouv.fr/search/?q=${q}&limit=1`;
    
    const res1 = await fetch(banUrl);
    const data1 = await res1.json();
    
    if (!data1.features?.length) {
      throw new Error("Adresse introuvable");
    }
    
    const { geometry, properties } = data1.features[0];
    const [lon, lat] = geometry.coordinates;
    const citycode = properties.citycode;
    
    console.log(`   ✅ Adresse trouvée: ${properties.label}`);
    console.log(`   📍 Coordonnées: lat=${lat}, lon=${lon}`);
    console.log(`   🏙️  Code commune: ${citycode}\n`);
    
    // 2) Appeler l'API DVF
    console.log('2️⃣ Appel de l\'API DVF...');
    const dvfUrl = `https://api.cquest.org/dvf?code_commune=${citycode}&lat=${lat}&lon=${lon}&distance=500`;
    
    console.log(`   🔗 URL: ${dvfUrl}`);
    
    const res2 = await fetch(dvfUrl);
    
    if (!res2.ok) {
      console.log(`   ⚠️ Erreur HTTP: ${res2.status} ${res2.statusText}`);
      const text = await res2.text();
      console.log(`   Réponse: ${text}\n`);
      return;
    }
    
    const data2 = await res2.json();
    
    console.log('   ✅ Données reçues!\n');
    
    // 3) Analyser les résultats
    console.log('📊 Résultats de l\'analyse DVF:\n');
    console.log('─'.repeat(60));
    
    if (Array.isArray(data2) && data2.length > 0) {
      console.log(`📈 Nombre de transactions trouvées: ${data2.length}\n`);
      
      // Filtrer les transactions valides
      const validTransactions = data2.filter(t => 
        t.date_mutation && 
        t.valeur_fonciere && 
        t.surface_reelle_bati &&
        t.valeur_fonciere > 0 &&
        t.surface_reelle_bati > 0
      );
      
      console.log(`✅ Transactions valides: ${validTransactions.length}\n`);
      
      if (validTransactions.length > 0) {
        // Calculer les prix au m²
        const pricesM2 = validTransactions.map(t => {
          const priceM2 = Math.round(t.valeur_fonciere / t.surface_reelle_bati);
          return {
            date: t.date_mutation,
            type: t.type_local,
            surface: t.surface_reelle_bati,
            price: t.valeur_fonciere,
            priceM2: priceM2,
            address: `${t.adresse_numero || ''} ${t.adresse_nom_voie || ''}`.trim()
          };
        }).sort((a, b) => a.priceM2 - b.priceM2);
        
        // Prix médian
        const medianIndex = Math.floor(pricesM2.length / 2);
        const medianPrice = pricesM2[medianIndex].priceM2;
        
        console.log(`💰 Prix médian au m²: ${medianPrice.toLocaleString('fr-FR')} €/m²`);
        console.log(`📊 Prix min: ${pricesM2[0].priceM2.toLocaleString('fr-FR')} €/m²`);
        console.log(`📊 Prix max: ${pricesM2[pricesM2.length - 1].priceM2.toLocaleString('fr-FR')} €/m²\n`);
        
        // Afficher les 5 dernières transactions
        console.log('🏠 Dernières transactions:');
        console.log('─'.repeat(60));
        
        const recentTransactions = validTransactions
          .sort((a, b) => new Date(b.date_mutation) - new Date(a.date_mutation))
          .slice(0, 5);
        
        recentTransactions.forEach((t, i) => {
          const priceM2 = Math.round(t.valeur_fonciere / t.surface_reelle_bati);
          console.log(`${i + 1}. ${t.date_mutation} - ${t.type_local || 'N/A'}`);
          console.log(`   ${t.surface_reelle_bati}m² - ${t.valeur_fonciere.toLocaleString('fr-FR')}€ (${priceM2.toLocaleString('fr-FR')}€/m²)`);
          console.log(`   ${t.adresse_numero || ''} ${t.adresse_nom_voie || ''}`.trim());
          console.log('');
        });
        
      } else {
        console.log('⚠️ Aucune transaction valide trouvée');
      }
      
    } else {
      console.log('⚠️ Aucune transaction trouvée pour cette zone');
      console.log('   Cela peut être normal si:');
      console.log('   - Il n\'y a pas eu de ventes récentes dans le secteur');
      console.log('   - La zone est en Alsace-Moselle (non couverte par DVF)');
      console.log('   - L\'API a des limitations temporaires');
    }
    
    console.log('─'.repeat(60));
    
    // Afficher un échantillon des données brutes
    if (Array.isArray(data2) && data2.length > 0) {
      console.log('\n📄 Exemple de transaction (JSON):');
      console.log(JSON.stringify(data2[0], null, 2));
    }
    
  } catch (error) {
    console.error('\n❌ Erreur lors du test:', error.message);
    console.error(error);
  }
}

// Exécuter le test
testDVFAPI();
