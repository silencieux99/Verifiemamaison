/**
 * Compte le nombre de lignes/informations retournées par l'API Pappers
 */

const address = '10 Rue Ordener 75018 Paris';
const apiKey = '26ea0f0d8ab7efb4541df9e4fb5ed7a784400bb9df8433b4';

const baseUrl = 'https://api-immobilier.pappers.fr/v1';
const params = new URLSearchParams({
  adresse: address,
  bases: 'proprietaires,ventes,batiments,dpe,occupants,permis,fonds_de_commerce,coproprietes',
  par_page: '1',
  champs_supplementaires: 'adresse',
});

const url = `${baseUrl}/parcelles?${params.toString()}`;

async function countData() {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'api-key': apiKey,
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.log(`❌ Erreur: ${response.status} ${response.statusText}`);
      return;
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
    
    if (!parcelle) {
      console.log('⚠️  Aucune parcelle trouvée');
      return;
    }
    
    console.log('📊 COMPTE DES DONNÉES PAPPERS IMMO');
    console.log('='.repeat(60));
    console.log(`📍 Adresse: ${address}`);
    console.log(`🏛️  Parcelle: ${parcelle.numero || 'N/A'}\n`);
    
    let totalLines = 0;
    const counts = {};
    
    // Informations de base de la parcelle
    const baseFields = ['numero', 'section', 'prefixe', 'numero_plan', 'adresse', 'code_commune', 
                        'commune', 'contenance', 'code_region', 'code_departement', 'departement', 
                        'region', 'codes_postaux'];
    const baseInfoCount = baseFields.filter(f => parcelle[f] !== undefined && parcelle[f] !== null).length;
    counts['Informations de base (parcelle)'] = baseInfoCount;
    totalLines += baseInfoCount;
    
    // Autres adresses
    if (parcelle.autres_adresses && Array.isArray(parcelle.autres_adresses)) {
      counts['Autres adresses'] = parcelle.autres_adresses.length;
      totalLines += parcelle.autres_adresses.length;
    }
    
    // Propriétaires
    if (parcelle.proprietaires && Array.isArray(parcelle.proprietaires)) {
      const ownerCount = parcelle.proprietaires.length;
      counts['Propriétaires'] = ownerCount;
      totalLines += ownerCount;
      
      // Champs par propriétaire
      if (ownerCount > 0) {
        const ownerFields = ['denomination', 'nom', 'prenom', 'siren', 'siret', 'categorie_juridique', 
                            'adresse', 'code_naf', 'tranche_effectif'];
        const ownerFieldsCount = ownerFields.length;
        counts['  ├─ Champs par propriétaire'] = ownerFieldsCount;
        totalLines += ownerCount * ownerFieldsCount;
      }
    }
    
    // Ventes
    if (parcelle.ventes && Array.isArray(parcelle.ventes)) {
      const salesCount = parcelle.ventes.length;
      counts['Ventes/Transactions'] = salesCount;
      totalLines += salesCount;
      
      // Champs par vente
      if (salesCount > 0) {
        const saleFields = ['id', 'date', 'nature', 'valeur_fonciere', 'type_local', 
                           'surface_reelle_bati', 'surface_terrain', 'nombre_pieces', 'nombre_lots', 'adresse'];
        const saleFieldsCount = saleFields.length;
        counts['  ├─ Champs par vente'] = saleFieldsCount;
        totalLines += salesCount * saleFieldsCount;
        
        // Lots par vente
        let totalLots = 0;
        parcelle.ventes.forEach(v => {
          if (v.lots && Array.isArray(v.lots)) {
            totalLots += v.lots.length;
          }
        });
        if (totalLots > 0) {
          counts['  ├─ Lots (total)'] = totalLots;
          totalLines += totalLots;
        }
      }
    }
    
    // Bâtiments
    if (parcelle.batiments && Array.isArray(parcelle.batiments)) {
      const buildingsCount = parcelle.batiments.length;
      counts['Bâtiments'] = buildingsCount;
      totalLines += buildingsCount;
      
      if (buildingsCount > 0) {
        const buildingFields = ['numero', 'nature', 'usage', 'annee_construction', 'nombre_logements', 
                               'surface', 'adresse'];
        const buildingFieldsCount = buildingFields.length;
        counts['  ├─ Champs par bâtiment'] = buildingFieldsCount;
        totalLines += buildingsCount * buildingFieldsCount;
      }
    }
    
    // DPE
    if (parcelle.dpe && Array.isArray(parcelle.dpe)) {
      const dpeCount = parcelle.dpe.length;
      counts['DPE (Diagnostics énergétiques)'] = dpeCount;
      totalLines += dpeCount;
      
      if (dpeCount > 0) {
        const dpeFields = ['classe_bilan', 'type_installation_chauffage', 'type_energie_chauffage', 
                          'date_etablissement', 'adresse'];
        const dpeFieldsCount = dpeFields.length;
        counts['  ├─ Champs par DPE'] = dpeFieldsCount;
        totalLines += dpeCount * dpeFieldsCount;
      }
    }
    
    // Occupants
    if (parcelle.occupants && Array.isArray(parcelle.occupants)) {
      const occupantsCount = parcelle.occupants.length;
      counts['Occupants'] = occupantsCount;
      totalLines += occupantsCount;
      
      if (occupantsCount > 0) {
        const occupantFields = ['denomination', 'siren', 'siret', 'categorie_juridique', 'adresse', 
                               'code_naf', 'tranche_effectif'];
        const occupantFieldsCount = occupantFields.length;
        counts['  ├─ Champs par occupant'] = occupantFieldsCount;
        totalLines += occupantsCount * occupantFieldsCount;
      }
    }
    
    // Permis de construire
    if (parcelle.permis && Array.isArray(parcelle.permis)) {
      const permitsCount = parcelle.permis.length;
      counts['Permis de construire'] = permitsCount;
      totalLines += permitsCount;
      
      if (permitsCount > 0) {
        const permitFields = ['date_autorisation', 'statut', 'zone_operatoire', 'adresse'];
        const permitFieldsCount = permitFields.length;
        counts['  ├─ Champs par permis'] = permitFieldsCount;
        totalLines += permitsCount * permitFieldsCount;
      }
    }
    
    // Fonds de commerce
    if (parcelle.fonds_de_commerce && Array.isArray(parcelle.fonds_de_commerce)) {
      const fdcCount = parcelle.fonds_de_commerce.length;
      counts['Fonds de commerce'] = fdcCount;
      totalLines += fdcCount;
      
      if (fdcCount > 0) {
        const fdcFields = ['denomination', 'siren', 'code_naf', 'date_vente', 'prix_vente', 'adresse'];
        const fdcFieldsCount = fdcFields.length;
        counts['  ├─ Champs par fonds'] = fdcFieldsCount;
        totalLines += fdcCount * fdcFieldsCount;
      }
    }
    
    // Copropriétés
    if (parcelle.coproprietes && Array.isArray(parcelle.coproprietes)) {
      const coproCount = parcelle.coproprietes.length;
      counts['Copropriétés'] = coproCount;
      totalLines += coproCount;
      
      if (coproCount > 0) {
        const coproFields = ['nom', 'numero_immatriculation', 'mandat_en_cours', 'nombre_total_lots', 
                            'type_syndic', 'syndic_professionnel', 'adresse'];
        const coproFieldsCount = coproFields.length;
        counts['  ├─ Champs par copropriété'] = coproFieldsCount;
        totalLines += coproCount * coproFieldsCount;
      }
    }
    
    // Affichage du résumé
    console.log('\n📈 DÉTAIL PAR CATÉGORIE:\n');
    Object.entries(counts).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log(`\n✅ TOTAL ESTIMÉ: ${totalLines} lignes/informations`);
    console.log(`\n💡 Note: Ce nombre inclut tous les champs et éléments de données`);
    console.log(`   retournés par l'API Pappers pour cette parcelle.\n`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

countData();

