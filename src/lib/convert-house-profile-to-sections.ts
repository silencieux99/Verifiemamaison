/**
 * Convertit un HouseProfile en sections pour ModernReportView
 * Adapté du format VerifieMaVoiture pour l'immobilier
 */

import { HouseProfile } from './house-profile-types';
import { ReportSection } from '@/types/report.types';

/**
 * Fonction utilitaire pour vérifier si une valeur est valide
 */
function isValidValue(val: any): boolean {
  if (!val) return false;
  const str = String(val).trim();
  return str !== '' && 
         str !== 'Non disponible' && 
         str !== 'N/D' && 
         str !== '—' &&
         str !== 'null' &&
         str !== 'undefined';
}

/**
 * Convertit un HouseProfile en sections pour l'affichage
 */
export function convertHouseProfileToSections(profile: HouseProfile): ReportSection[] {
  const sections: ReportSection[] = [];

  // 1. Localisation
  if (profile.location) {
    const locationItems = [];
    if (profile.location.normalized_address) {
      locationItems.push({ 
        label: 'Adresse', 
        value: profile.location.normalized_address 
      });
    }
    if (profile.location.admin.city) {
      locationItems.push({ 
        label: 'Commune', 
        value: profile.location.admin.city 
      });
    }
    if (profile.location.admin.postcode) {
      locationItems.push({ 
        label: 'Code postal', 
        value: profile.location.admin.postcode 
      });
    }
    if (profile.location.admin.department) {
      locationItems.push({ 
        label: 'Département', 
        value: profile.location.admin.department 
      });
    }
    if (profile.location.admin.region) {
      locationItems.push({ 
        label: 'Région', 
        value: profile.location.admin.region 
      });
    }
    if (profile.location.gps.lat && profile.location.gps.lon) {
      locationItems.push({ 
        label: 'Coordonnées GPS', 
        value: `${profile.location.gps.lat.toFixed(6)}, ${profile.location.gps.lon.toFixed(6)}` 
      });
    }
    
    if (locationItems.length > 0) {
      sections.push({
        id: 'location',
        title: 'Localisation',
        items: locationItems
      });
    }
  }

  // 1.5. Analyse IA (si disponible)
  if (profile.ai_analysis) {
    const ai = profile.ai_analysis;
    
    // Section principale - Score et Synthèse
    const aiMainItems = [];
    if (ai.score !== undefined) {
      aiMainItems.push({
        label: 'Score global',
        value: `${ai.score}/100`,
        flag: ai.score >= 80 ? 'ok' as const : ai.score >= 60 ? 'warn' as const : 'risk' as const
      });
    }
    if (ai.summary) {
      aiMainItems.push({
        label: 'Synthèse',
        value: ai.summary
      });
    }
    
    if (aiMainItems.length > 0) {
      sections.push({
        id: 'ai_overview',
        title: 'Synthèse',
        items: aiMainItems
      });
    }

    // Analyse du marché
    if (ai.market_analysis) {
      const marketItems = [];
      if (ai.market_analysis.estimated_value_m2) {
        marketItems.push({
          label: 'Valeur estimée au m²',
          value: `${ai.market_analysis.estimated_value_m2.toLocaleString('fr-FR')}€/m²`
        });
      }
      if (ai.market_analysis.market_trend) {
        const trend = ai.market_analysis.market_trend;
        marketItems.push({
          label: 'Tendance du marché',
          value: trend.charAt(0).toUpperCase() + trend.slice(1),
          flag: trend === 'hausse' ? 'ok' as const : trend === 'baisse' ? 'risk' as const : undefined
        });
      }
      if (ai.market_analysis.market_comment) {
        marketItems.push({
          label: 'Commentaire marché',
          value: ai.market_analysis.market_comment
        });
      }
      if (ai.market_analysis.price_comparison) {
        marketItems.push({
          label: 'Comparaison prix',
          value: ai.market_analysis.price_comparison
        });
      }
      
      if (marketItems.length > 0) {
        sections.push({
          id: 'ai_market',
          title: 'Évaluation du marché',
          items: marketItems
        });
      }
    }

    // Analyse du quartier
    if (ai.neighborhood_analysis) {
      const neighborhoodItems = [];
      if (ai.neighborhood_analysis.shops_analysis) {
        neighborhoodItems.push({
          label: 'Analyse des commerces',
          value: ai.neighborhood_analysis.shops_analysis
        });
      }
      if (ai.neighborhood_analysis.amenities_score !== undefined) {
        neighborhoodItems.push({
          label: 'Score commodités',
          value: `${ai.neighborhood_analysis.amenities_score}/100`,
          flag: ai.neighborhood_analysis.amenities_score >= 70 ? 'ok' as const : ai.neighborhood_analysis.amenities_score >= 50 ? 'warn' as const : 'risk' as const
        });
      }
      if (ai.neighborhood_analysis.transport_score !== undefined) {
        neighborhoodItems.push({
          label: 'Score transports',
          value: `${ai.neighborhood_analysis.transport_score}/100`,
          flag: ai.neighborhood_analysis.transport_score >= 70 ? 'ok' as const : ai.neighborhood_analysis.transport_score >= 50 ? 'warn' as const : 'risk' as const
        });
      }
      if (ai.neighborhood_analysis.quality_of_life) {
        neighborhoodItems.push({
          label: 'Qualité de vie',
          value: ai.neighborhood_analysis.quality_of_life
        });
      }
      
      if (neighborhoodItems.length > 0) {
        sections.push({
          id: 'ai_neighborhood',
          title: 'Analyse du quartier',
          items: neighborhoodItems
        });
      }
    }

    // Analyse des risques
    if (ai.risks_analysis) {
      const riskItems = [];
      if (ai.risks_analysis.overall_risk_level) {
        const level = ai.risks_analysis.overall_risk_level;
        riskItems.push({
          label: 'Niveau de risque global',
          value: level.charAt(0).toUpperCase() + level.slice(1),
          flag: level === 'élevé' ? 'risk' as const : level === 'moyen' ? 'warn' as const : 'ok' as const
        });
      }
      if (ai.risks_analysis.main_risks && ai.risks_analysis.main_risks.length > 0) {
        riskItems.push({
          label: 'Principaux risques',
          value: ai.risks_analysis.main_risks.join(', ')
        });
      }
      if (ai.risks_analysis.risk_comment) {
        riskItems.push({
          label: 'Commentaire risques',
          value: ai.risks_analysis.risk_comment
        });
      }
      
      if (riskItems.length > 0) {
        sections.push({
          id: 'ai_risks',
          title: 'Analyse des risques',
          items: riskItems
        });
      }
    }

    // Potentiel d'investissement
    if (ai.investment_potential) {
      const investmentItems = [];
      if (ai.investment_potential.score !== undefined) {
        investmentItems.push({
          label: 'Score investissement',
          value: `${ai.investment_potential.score}/100`,
          flag: ai.investment_potential.score >= 70 ? 'ok' as const : ai.investment_potential.score >= 50 ? 'warn' as const : 'risk' as const
        });
      }
      if (ai.investment_potential.comment) {
        investmentItems.push({
          label: 'Commentaire',
          value: ai.investment_potential.comment
        });
      }
      if (ai.investment_potential.recommendations && ai.investment_potential.recommendations.length > 0) {
        ai.investment_potential.recommendations.forEach((rec, idx) => {
          investmentItems.push({
            label: `Recommandation ${idx + 1}`,
            value: rec
          });
        });
      }
      
      if (investmentItems.length > 0) {
        sections.push({
          id: 'ai_investment',
          title: 'Potentiel d\'investissement',
          items: investmentItems
        });
      }
    }

    // Points forts et faibles
    if (ai.strengths && ai.strengths.length > 0) {
      sections.push({
        id: 'ai_strengths',
        title: 'Points forts',
        items: ai.strengths.map((strength, idx) => ({
          label: `Point fort ${idx + 1}`,
          value: strength,
          flag: 'ok' as const
        }))
      });
    }

    if (ai.weaknesses && ai.weaknesses.length > 0) {
      sections.push({
        id: 'ai_weaknesses',
        title: 'Points faibles',
        items: ai.weaknesses.map((weakness, idx) => ({
          label: `Point faible ${idx + 1}`,
          value: weakness,
          flag: 'warn' as const
        }))
      });
    }

    // Recommandations IA
    if (ai.recommendations && ai.recommendations.length > 0) {
      sections.push({
        id: 'ai_recommendations',
        title: 'Recommandations',
        items: ai.recommendations.map((rec, idx) => ({
          label: `Recommandation ${idx + 1}`,
          value: rec
        }))
      });
    }
  }

  // 2. Risques naturels et technologiques
  if (profile.risks) {
    const risksItems = [];
    
    if (profile.risks.normalized.flood_level) {
      const level = profile.risks.normalized.flood_level;
      risksItems.push({
        label: 'Risque inondation',
        value: level.charAt(0).toUpperCase() + level.slice(1),
        flag: level === 'élevé' ? 'risk' as const : level === 'moyen' ? 'warn' as const : 'ok' as const
      });
    }
    
    if (profile.risks.normalized.seismic_level !== undefined) {
      const level = profile.risks.normalized.seismic_level;
      risksItems.push({
        label: 'Sismicité',
        value: `Niveau ${level}/5`,
        flag: level >= 4 ? 'risk' as const : level >= 3 ? 'warn' as const : 'ok' as const
      });
    }
    
    if (profile.risks.normalized.radon_zone) {
      const zone = profile.risks.normalized.radon_zone;
      risksItems.push({
        label: 'Zone radon',
        value: `Zone ${zone}/3`,
        flag: zone >= 2 ? 'warn' as const : 'ok' as const
      });
    }
    
    if (profile.risks.flood) {
      risksItems.push({
        label: 'Détails inondation',
        value: 'Données disponibles',
        hint: 'Consultez les données brutes pour plus de détails'
      });
    }
    
    if (profile.risks.seismicity) {
      risksItems.push({
        label: 'Détails sismicité',
        value: 'Données disponibles'
      });
    }
    
    if (profile.risks.normalized.notes && profile.risks.normalized.notes.length > 0) {
      const notes = profile.risks.normalized.notes;
      if (risksItems.length > 0) {
        sections.push({
          id: 'risks',
          title: 'Risques naturels et technologiques',
          items: risksItems,
          notes: notes
        });
      } else {
        sections.push({
          id: 'risks',
          title: 'Risques naturels et technologiques',
          items: [{ label: 'Notes', value: 'Voir ci-dessous' }],
          notes: notes
        });
      }
    } else if (risksItems.length > 0) {
      sections.push({
        id: 'risks',
        title: 'Risques naturels et technologiques',
        items: risksItems
      });
    }
  }

  // 3. Performance énergétique (DPE)
  if (profile.energy?.dpe) {
    const energyItems = [];
    
    if (profile.energy.dpe.class_energy) {
      const classEnergy = profile.energy.dpe.class_energy;
      energyItems.push({
        label: 'Classe énergétique',
        value: classEnergy,
        flag: ['E', 'F', 'G'].includes(classEnergy) ? 'risk' as const :
              classEnergy === 'D' ? 'warn' as const : 'ok' as const
      });
    }
    
    if (profile.energy.dpe.class_ges) {
      energyItems.push({
        label: 'Classe GES',
        value: profile.energy.dpe.class_ges,
        flag: ['E', 'F', 'G'].includes(profile.energy.dpe.class_ges) ? 'risk' as const :
              profile.energy.dpe.class_ges === 'D' ? 'warn' as const : 'ok' as const
      });
    }
    
    if (profile.energy.dpe.date) {
      energyItems.push({
        label: 'Date du DPE',
        value: new Date(profile.energy.dpe.date).toLocaleDateString('fr-FR')
      });
    }
    
    if (profile.energy.dpe.surface_m2) {
      energyItems.push({
        label: 'Surface',
        value: `${profile.energy.dpe.surface_m2} m²`
      });
    }
    
    if (profile.energy.dpe.housing_type) {
      energyItems.push({
        label: 'Type de logement',
        value: profile.energy.dpe.housing_type
      });
    }
    
    if (energyItems.length > 0) {
      sections.push({
        id: 'energy',
        title: 'Performance énergétique',
        items: energyItems
      });
    }
  }

  // 4. Marché immobilier (DVF)
  if (profile.market?.dvf) {
    const marketItems = [];
    
    if (profile.market.dvf.summary) {
      const summary = profile.market.dvf.summary;
      
      if (summary.price_m2_median_1y) {
        marketItems.push({
          label: 'Prix/m² médian (1 an)',
          value: `${summary.price_m2_median_1y.toLocaleString('fr-FR')} €/m²`
        });
      }
      
      if (summary.price_m2_median_3y) {
        marketItems.push({
          label: 'Prix/m² médian (3 ans)',
          value: `${summary.price_m2_median_3y.toLocaleString('fr-FR')} €/m²`
        });
      }
      
      if (summary.trend_label) {
        const trend = summary.trend_label;
        marketItems.push({
          label: 'Tendance du marché',
          value: trend.charAt(0).toUpperCase() + trend.slice(1),
          flag: trend === 'hausse' ? 'ok' as const : trend === 'baisse' ? 'warn' as const : undefined
        });
      }
      
      if (summary.volume_3y) {
        marketItems.push({
          label: 'Volume de transactions (3 ans)',
          value: `${summary.volume_3y} transaction${summary.volume_3y > 1 ? 's' : ''}`
        });
      }
    }
    
    if (profile.market.dvf.transactions && profile.market.dvf.transactions.length > 0) {
      marketItems.push({
        label: 'Nombre de transactions',
        value: `${profile.market.dvf.transactions.length} transaction${profile.market.dvf.transactions.length > 1 ? 's' : ''} trouvée${profile.market.dvf.transactions.length > 1 ? 's' : ''}`
      });
    }
    
    if (marketItems.length > 0) {
      const notes: string[] = [];
      if (profile.market.dvf.transactions && profile.market.dvf.transactions.length > 0) {
        notes.push(`Détails des ${profile.market.dvf.transactions.length} dernières transactions disponibles dans les données brutes.`);
      }
      
      sections.push({
        id: 'market',
        title: 'Marché immobilier',
        items: marketItems,
        notes: notes.length > 0 ? notes : undefined
      });
    }
  }

  // 5. Urbanisme et PLU
  if (profile.urbanism) {
    const urbanismItems = [];
    
    if (profile.urbanism.zoning && profile.urbanism.zoning.length > 0) {
      urbanismItems.push({
        label: 'Zones PLU',
        value: `${profile.urbanism.zoning.length} zone${profile.urbanism.zoning.length > 1 ? 's' : ''} identifiée${profile.urbanism.zoning.length > 1 ? 's' : ''}`
      });
      
      profile.urbanism.zoning.slice(0, 3).forEach((zone, index) => {
        urbanismItems.push({
          label: `Zone ${index + 1}`,
          value: `${zone.code} - ${zone.label}`,
          hint: zone.doc_url ? `Document: ${zone.doc_url}` : undefined
        });
      });
    }
    
    if (profile.urbanism.land_servitudes && profile.urbanism.land_servitudes.length > 0) {
      urbanismItems.push({
        label: 'Servitudes',
        value: `${profile.urbanism.land_servitudes.length} servitude${profile.urbanism.land_servitudes.length > 1 ? 's' : ''}`
      });
    }
    
    if (urbanismItems.length > 0) {
      sections.push({
        id: 'urbanism',
        title: 'Urbanisme et PLU',
        items: urbanismItems
      });
    }
  }

  // 6. Écoles à proximité
  if (profile.education?.schools && profile.education.schools.length > 0) {
    const educationItems = [];
    
    // Statistiques générales
    educationItems.push({
      label: 'Nombre d\'écoles',
      value: `${profile.education.schools.length} école${profile.education.schools.length > 1 ? 's' : ''} à proximité`,
      flag: profile.education.schools.length >= 5 ? 'ok' as const : profile.education.schools.length >= 3 ? 'warn' as const : undefined
    });
    
    // Grouper par type
    const byKind: Record<string, number> = {};
    const byPublicPrivate: { public: number; privé: number } = { public: 0, privé: 0 };
    
    profile.education.schools.forEach(school => {
      const kind = school.kind || 'autre';
      byKind[kind] = (byKind[kind] || 0) + 1;
      
      if (school.public_private === 'public') {
        byPublicPrivate.public++;
      } else if (school.public_private === 'privé') {
        byPublicPrivate.privé++;
      }
    });
    
    // Statistiques par type
    Object.entries(byKind).forEach(([kind, count]) => {
      educationItems.push({
        label: kind.charAt(0).toUpperCase() + kind.slice(1),
        value: `${count} établissement${count > 1 ? 's' : ''}`
      });
    });
    
    // Statistiques public/privé
    if (byPublicPrivate.public > 0 || byPublicPrivate.privé > 0) {
      educationItems.push({
        label: 'Établissements publics',
        value: `${byPublicPrivate.public}`
      });
      if (byPublicPrivate.privé > 0) {
        educationItems.push({
          label: 'Établissements privés',
          value: `${byPublicPrivate.privé}`
        });
      }
    }
    
    // Trier les écoles par distance et créer des items détaillés pour les plus proches (10 max)
    const sortedSchools = [...profile.education.schools]
      .sort((a, b) => (a.distance_m || 9999) - (b.distance_m || 9999))
      .slice(0, 10);
    
    // Stocker les données détaillées des écoles dans les notes (format spécial pour le composant)
    const schoolsData = sortedSchools.map(school => ({
      name: school.name,
      kind: school.kind || 'autre',
      public_private: school.public_private || 'public',
      address: school.address,
      postcode: school.postcode,
      city: school.city,
      phone: school.phone,
      website: school.website,
      distance_m: school.distance_m,
      gps: school.gps
    }));
    
    sections.push({
      id: 'education',
      title: 'Écoles à proximité',
      items: educationItems,
      notes: schoolsData as any // Stocker les données des écoles dans notes pour le composant spécialisé
    });
  }

  // 7. Connectivité Internet
  if (profile.connectivity) {
    const connectivityItems = [];
    
    if (profile.connectivity.fiber_available !== undefined) {
      connectivityItems.push({
        label: 'Fibre optique',
        value: profile.connectivity.fiber_available ? 'Disponible' : 'Non disponible',
        flag: profile.connectivity.fiber_available ? 'ok' as const : 'warn' as const
      });
    }
    
    if (profile.connectivity.down_max_mbps) {
      connectivityItems.push({
        label: 'Débit descendant max',
        value: `${profile.connectivity.down_max_mbps} Mbps`
      });
    }
    
    if (profile.connectivity.up_max_mbps) {
      connectivityItems.push({
        label: 'Débit montant max',
        value: `${profile.connectivity.up_max_mbps} Mbps`
      });
    }
    
    if (profile.connectivity.technologies && profile.connectivity.technologies.length > 0) {
      connectivityItems.push({
        label: 'Technologies disponibles',
        value: profile.connectivity.technologies.join(', ')
      });
    }
    
    if (connectivityItems.length > 0) {
      sections.push({
        id: 'connectivity',
        title: 'Connectivité Internet',
        items: connectivityItems
      });
    }
  }

  // 8. Commodités
  if (profile.amenities) {
    const amenitiesItems = [];
    
    if (profile.amenities.supermarkets && profile.amenities.supermarkets.length > 0) {
      amenitiesItems.push({
        label: 'Supermarchés',
        value: `${profile.amenities.supermarkets.length} à proximité`
      });
      
      const closest = profile.amenities.supermarkets
        .sort((a, b) => a.distance_m - b.distance_m)
        .slice(0, 3);
      
      closest.forEach((supermarket, index) => {
        amenitiesItems.push({
          label: `Supermarket ${index + 1}`,
          value: `${supermarket.name || 'Supermarché'} - ${Math.round(supermarket.distance_m)} m`
        });
      });
    }
    
    if (profile.amenities.transit && profile.amenities.transit.length > 0) {
      amenitiesItems.push({
        label: 'Transports en commun',
        value: `${profile.amenities.transit.length} à proximité`
      });
    }
    
    if (profile.amenities.parks && profile.amenities.parks.length > 0) {
      amenitiesItems.push({
        label: 'Parcs et espaces verts',
        value: `${profile.amenities.parks.length} à proximité`
      });
    }
    
    if (amenitiesItems.length > 0) {
      sections.push({
        id: 'amenities',
        title: 'Commodités',
        items: amenitiesItems
      });
    }
  }

  // 9. Qualité de l'air
  if (profile.air_quality) {
    const airQualityItems = [];
    
    if (profile.air_quality.index_today !== undefined) {
      airQualityItems.push({
        label: 'Indice du jour',
        value: String(profile.air_quality.index_today)
      });
    }
    
    if (profile.air_quality.label) {
      const label = profile.air_quality.label;
      airQualityItems.push({
        label: 'Qualité',
        value: label.charAt(0).toUpperCase() + label.slice(1),
        flag: label === 'mauvais' ? 'risk' as const :
              label === 'moyen' ? 'warn' as const : 'ok' as const
      });
    }
    
    if (airQualityItems.length > 0) {
      sections.push({
        id: 'air_quality',
        title: 'Qualité de l\'air',
        items: airQualityItems
      });
    }
  }

  // 10. Sécurité (délinquance communale)
  if (profile.safety) {
    const safetyItems = [];
    
    safetyItems.push({
      label: 'Périmètre',
      value: profile.safety.scope === 'commune' ? 'Commune' : profile.safety.scope
    });
    
    if (profile.safety.period) {
      safetyItems.push({
        label: 'Période analysée',
        value: `${profile.safety.period.from} - ${profile.safety.period.to}`
      });
    }
    
    if (profile.safety.indicators && profile.safety.indicators.length > 0) {
      profile.safety.indicators.forEach((indicator) => {
        safetyItems.push({
          label: indicator.category,
          value: indicator.level_vs_national 
            ? `${indicator.level_vs_national.charAt(0).toUpperCase() + indicator.level_vs_national.slice(1)} vs national`
            : 'Données disponibles',
          flag: indicator.level_vs_national === 'élevé' ? 'risk' as const :
                indicator.level_vs_national === 'moyen' ? 'warn' as const : 'ok' as const
        });
        
        if (indicator.rate_local_per_10k) {
          safetyItems.push({
            label: `Taux local (${indicator.category})`,
            value: `${indicator.rate_local_per_10k.toFixed(1)} pour 10 000 hab.`
          });
        }
      });
    }
    
    if (safetyItems.length > 0) {
      const notes: string[] = [];
      if (profile.safety.notes && profile.safety.notes.length > 0) {
        notes.push(...profile.safety.notes);
      }
      notes.push('⚠️ Données au niveau communal uniquement. Les statistiques ne sont pas attribuables à l\'adresse précise.');
      
      sections.push({
        id: 'safety',
        title: 'Sécurité et délinquance',
        items: safetyItems,
        notes: notes.length > 0 ? notes : undefined
      });
    }
  }

  // 11. Pappers Immobilier - Données complètes organisées en sections
  
  if (profile.pappers) {
    // 11.1. Informations cadastrales Pappers
    if (profile.pappers.cadastral) {
      const cadItems = [];
      const cad = profile.pappers.cadastral;
      
      if (cad.parcel) {
        cadItems.push({ label: 'Numéro de parcelle', value: cad.parcel });
      }
      if (cad.section) {
        cadItems.push({ label: 'Section cadastrale', value: cad.section });
      }
      if (cad.prefixe) {
        cadItems.push({ label: 'Préfixe', value: cad.prefixe });
      }
      if (cad.numero_plan) {
        cadItems.push({ label: 'Numéro de plan', value: cad.numero_plan });
      }
      if (cad.surface_m2) {
        cadItems.push({ label: 'Surface cadastrale', value: `${cad.surface_m2.toLocaleString('fr-FR')} m²` });
      }
      
      if (cad.autres_adresses && cad.autres_adresses.length > 0) {
        cadItems.push({
          label: 'Autres adresses',
          value: `${cad.autres_adresses.length} adresse${cad.autres_adresses.length > 1 ? 's' : ''} alternative${cad.autres_adresses.length > 1 ? 's' : ''}`
        });
        cad.autres_adresses.forEach((a, idx) => {
          cadItems.push({
            label: `Adresse alternative ${idx + 1}`,
            value: a.adresse,
            hint: `Sources: ${a.sources?.join(', ') || 'N/A'}`
          });
        });
      }
      
      if (cadItems.length > 0) {
        sections.push({
          id: 'pappers_cadastral',
          title: 'Cadastre Pappers',
          items: cadItems
        });
      }
    }
    
    // 11.2. Propriétaires (TOUS les propriétaires)
    if (profile.pappers.owners && profile.pappers.owners.length > 0) {
      profile.pappers.owners.forEach((owner, idx) => {
        const ownerItems = [];
        
        if (owner.name) {
          ownerItems.push({
            label: 'Nom / Raison sociale',
            value: owner.name,
            flag: owner.type === 'personne_morale' ? 'warn' : undefined
          });
        }
        if (owner.type) {
          ownerItems.push({
            label: 'Type',
            value: owner.type === 'personne_morale' ? 'Personne morale' : 'Personne physique'
          });
        }
        if (owner.siren) {
          ownerItems.push({ label: 'SIREN', value: owner.siren });
        }
        if (owner.siret) {
          ownerItems.push({ label: 'SIRET', value: owner.siret });
        }
        if (owner.legal_form) {
          ownerItems.push({ label: 'Forme juridique', value: owner.legal_form });
        }
        if (owner.code_naf) {
          ownerItems.push({ label: 'Code NAF', value: owner.code_naf });
        }
        if (owner.effectif) {
          ownerItems.push({ label: 'Tranche d\'effectif', value: owner.effectif });
        }
        if (owner.address) {
          ownerItems.push({ label: 'Adresse', value: owner.address });
        }
        
        if (ownerItems.length > 0) {
          sections.push({
            id: `pappers_owner_${idx}`,
            title: `Propriétaire ${profile.pappers.owners.length > 1 ? `${idx + 1}` : ''} (Pappers)`,
            items: ownerItems
          });
        }
      });
    }
    
    // 11.3. Transactions/Ventes complètes
    if (profile.pappers.transactions && profile.pappers.transactions.length > 0) {
      const transactionsItems = [];
      
      transactionsItems.push({
        label: 'Nombre total de transactions',
        value: `${profile.pappers.transactions.length} transaction${profile.pappers.transactions.length > 1 ? 's' : ''}`
      });
      
      profile.pappers.transactions.forEach((t, idx) => {
        const dateStr = t.date ? new Date(t.date).toLocaleDateString('fr-FR') : 'Date inconnue';
        const priceStr = t.price_eur ? `${t.price_eur.toLocaleString('fr-FR')}€` : 'N/A';
        const priceM2Str = t.price_m2_eur ? ` (${t.price_m2_eur.toLocaleString('fr-FR')}€/m²)` : '';
        const surfaceStr = t.surface_m2 ? ` • ${t.surface_m2}m²` : '';
        const piecesStr = t.nombre_pieces ? ` • ${t.nombre_pieces} pièce${t.nombre_pieces > 1 ? 's' : ''}` : '';
        const terrainStr = t.surface_terrain ? ` • Terrain: ${t.surface_terrain}m²` : '';
        
        transactionsItems.push({
          label: `Transaction ${idx + 1} - ${dateStr}`,
          value: `${priceStr}${priceM2Str}${surfaceStr}${piecesStr}${terrainStr}`,
          hint: t.address || `${t.type || t.nature || ''} • ${t.nombre_lots ? `${t.nombre_lots} lot${t.nombre_lots > 1 ? 's' : ''}` : ''}`
        });
      });
      
      sections.push({
        id: 'pappers_transactions',
        title: 'Historique des transactions (Pappers)',
        items: transactionsItems
      });
    }
    
    // 11.4. Bâtiments
    if (profile.pappers.buildings && profile.pappers.buildings.length > 0) {
      profile.pappers.buildings.forEach((building, idx) => {
        const buildingItems = [];
        
        if (building.numero) {
          buildingItems.push({ label: 'Numéro', value: building.numero });
        }
        if (building.nature) {
          buildingItems.push({ label: 'Nature', value: building.nature });
        }
        if (building.usage) {
          buildingItems.push({ label: 'Usage', value: building.usage });
        }
        if (building.annee_construction) {
          buildingItems.push({ label: 'Année de construction', value: String(building.annee_construction) });
        }
        if (building.nombre_logements) {
          buildingItems.push({ label: 'Nombre de logements', value: String(building.nombre_logements) });
        }
        if (building.surface) {
          buildingItems.push({ label: 'Surface', value: `${building.surface.toLocaleString('fr-FR')} m²` });
        }
        if (building.adresse) {
          buildingItems.push({ label: 'Adresse', value: building.adresse });
        }
        
        if (buildingItems.length > 0) {
          sections.push({
            id: `pappers_building_${idx}`,
            title: `Bâtiment ${profile.pappers.buildings.length > 1 ? `${idx + 1}` : ''} (Pappers)`,
            items: buildingItems
          });
        }
      });
    }
    
    // 11.5. DPE Pappers (complément ADEME)
    if (profile.pappers.dpe && profile.pappers.dpe.length > 0) {
      profile.pappers.dpe.forEach((dpe, idx) => {
        const dpeItems = [];
        
        if (dpe.classe_bilan) {
          dpeItems.push({
            label: 'Classe énergétique',
            value: dpe.classe_bilan,
            flag: ['E', 'F', 'G'].includes(dpe.classe_bilan) ? 'risk' : ['C', 'D'].includes(dpe.classe_bilan) ? 'warn' : 'ok'
          });
        }
        if (dpe.type_installation_chauffage) {
          dpeItems.push({ label: 'Type d\'installation', value: dpe.type_installation_chauffage });
        }
        if (dpe.type_energie_chauffage) {
          dpeItems.push({ label: 'Type d\'énergie', value: dpe.type_energie_chauffage });
        }
        if (dpe.date_etablissement) {
          try {
            dpeItems.push({
              label: 'Date d\'établissement',
              value: new Date(dpe.date_etablissement).toLocaleDateString('fr-FR')
            });
          } catch (e) {
            dpeItems.push({ label: 'Date d\'établissement', value: dpe.date_etablissement });
          }
        }
        if (dpe.adresse) {
          dpeItems.push({ label: 'Adresse', value: dpe.adresse });
        }
        
        // Ne créer la section que s'il y a au moins un item
        if (dpeItems.length > 0) {
          sections.push({
            id: `pappers_dpe_${idx}`,
            title: `DPE ${profile.pappers.dpe.length > 1 ? `${idx + 1}` : ''} (Pappers)`,
            items: dpeItems
          });
        }
      });
    }
    
    // 11.6. Copropriétés détaillées
    if (profile.pappers.coproprietes && profile.pappers.coproprietes.length > 0) {
      profile.pappers.coproprietes.forEach((copro, idx) => {
        const coproItems = [];
        
        if (copro.name) {
          coproItems.push({ label: 'Nom', value: copro.name });
        }
        if (copro.numero_immatriculation) {
          coproItems.push({ label: 'Numéro d\'immatriculation', value: copro.numero_immatriculation });
        }
        if (copro.mandat_en_cours) {
          coproItems.push({ label: 'Mandat en cours', value: copro.mandat_en_cours });
        }
        if (copro.nombre_total_lots) {
          coproItems.push({ label: 'Nombre total de lots', value: String(copro.nombre_total_lots) });
        }
        if (copro.nombre_lots_habitation) {
          coproItems.push({ label: 'Lots d\'habitation', value: String(copro.nombre_lots_habitation) });
        }
        if (copro.type_syndic) {
          coproItems.push({ label: 'Type de syndic', value: copro.type_syndic === 'professionnel' ? 'Professionnel' : 'Bénévole' });
        }
        if (copro.manager) {
          coproItems.push({ label: 'Gestionnaire', value: copro.manager });
        }
        if (copro.periode_construction) {
          coproItems.push({ label: 'Période de construction', value: copro.periode_construction.replace(/_/g, ' ') });
        }
        if (copro.adresse) {
          coproItems.push({ label: 'Adresse', value: copro.adresse });
        }
        
        if (coproItems.length > 0) {
          sections.push({
            id: `pappers_copropriete_${idx}`,
            title: `Copropriété ${profile.pappers.coproprietes.length > 1 ? `${idx + 1}` : ''} (Pappers)`,
            items: coproItems
          });
        }
      });
    }
    
    // 11.7. Occupants
    if (profile.pappers.occupants && profile.pappers.occupants.length > 0) {
      const occupantsItems = [];
      
      occupantsItems.push({
        label: 'Nombre d\'occupants',
        value: `${profile.pappers.occupants.length} occupant${profile.pappers.occupants.length > 1 ? 's' : ''}`
      });
      
      profile.pappers.occupants.forEach((occ, idx) => {
        const occName = occ.denomination || 'Non spécifié';
        const occDetails = [
          occ.siren ? `SIREN: ${occ.siren}` : null,
          occ.categorie_juridique ? `Forme: ${occ.categorie_juridique}` : null,
          occ.code_naf ? `NAF: ${occ.code_naf}` : null,
          occ.effectif ? `Effectif: ${occ.effectif}` : null,
        ].filter(Boolean).join(' • ');
        
        occupantsItems.push({
          label: `Occupant ${idx + 1}`,
          value: occName,
          hint: occDetails || occ.address || undefined
        });
      });
      
      sections.push({
        id: 'pappers_occupants',
        title: 'Occupants (Pappers)',
        items: occupantsItems
      });
    }
    
    // 11.8. Permis de construire
    if (profile.pappers.building_permits && profile.pappers.building_permits.length > 0) {
      const permitsItems = [];
      
      permitsItems.push({
        label: 'Nombre de permis',
        value: `${profile.pappers.building_permits.length} permis trouvé${profile.pappers.building_permits.length > 1 ? 's' : ''}`
      });
      
      profile.pappers.building_permits.forEach((p, idx) => {
        const dateStr = p.date ? new Date(p.date).toLocaleDateString('fr-FR') : 'Date inconnue';
        const statutStr = p.statut || p.type || 'N/A';
        const zoneStr = p.zone_operatoire ? ` • Zone: ${p.zone_operatoire}` : '';
        
        permitsItems.push({
          label: `Permis ${idx + 1}`,
          value: `${dateStr} - ${statutStr}${zoneStr}`,
          hint: p.adresse || undefined
        });
      });
      
      sections.push({
        id: 'pappers_permis',
        title: 'Permis de construire (Pappers)',
        items: permitsItems
      });
    }
    
    // 11.9. Fonds de commerce
    if (profile.pappers.fonds_de_commerce && profile.pappers.fonds_de_commerce.length > 0) {
      const fdcItems = [];
      
      fdcItems.push({
        label: 'Nombre de fonds de commerce',
        value: `${profile.pappers.fonds_de_commerce.length} fond${profile.pappers.fonds_de_commerce.length > 1 ? 's' : ''} trouvé${profile.pappers.fonds_de_commerce.length > 1 ? 's' : ''}`,
        flag: 'warn'
      });
      
      profile.pappers.fonds_de_commerce.forEach((fdc, idx) => {
        const dateStr = fdc.date_vente ? new Date(fdc.date_vente).toLocaleDateString('fr-FR') : 'Date inconnue';
        const priceStr = fdc.prix_vente ? `${fdc.prix_vente.toLocaleString('fr-FR')}€` : 'Prix N/A';
        
        fdcItems.push({
          label: `Fonds ${idx + 1}`,
          value: fdc.denomination || 'Non spécifié',
          hint: `${dateStr} • ${priceStr}${fdc.code_naf ? ` • NAF: ${fdc.code_naf}` : ''}${fdc.siren ? ` • SIREN: ${fdc.siren}` : ''}${fdc.adresse ? ` • ${fdc.adresse}` : ''}`
        });
      });
      
      sections.push({
        id: 'pappers_fonds_commerce',
        title: 'Fonds de commerce (Pappers)',
        items: fdcItems
      });
    }
  }

  // 12. Recommandations IA
  if (profile.recommendations) {
    const recommendationsItems = [];
    
    recommendationsItems.push({
      label: 'Résumé',
      value: profile.recommendations.summary || 'Aucune recommandation spécifique'
    });
    
    if (profile.recommendations.items && profile.recommendations.items.length > 0) {
      profile.recommendations.items.forEach((item, index) => {
        recommendationsItems.push({
          label: item.title,
          value: item.reason,
          flag: item.priority === 1 ? 'risk' as const :
                item.priority === 2 ? 'warn' as const : undefined
        });
      });
    }
    
    if (recommendationsItems.length > 0) {
      sections.push({
        id: 'recommendations',
        title: 'Recommandations IA',
        items: recommendationsItems
      });
    }
  }

  // 12. Métadonnées
  if (profile.meta) {
    const metaItems = [];
    
    if (profile.meta.generated_at) {
      metaItems.push({
        label: 'Généré le',
        value: new Date(profile.meta.generated_at).toLocaleString('fr-FR')
      });
    }
    
    if (profile.meta.processing_ms) {
      metaItems.push({
        label: 'Temps de traitement',
        value: `${profile.meta.processing_ms} ms`
      });
    }
    
    if (profile.meta.sources && profile.meta.sources.length > 0) {
      metaItems.push({
        label: 'Sources consultées',
        value: `${profile.meta.sources.length} source${profile.meta.sources.length > 1 ? 's' : ''}`
      });
    }
    
    if (profile.meta.warnings && profile.meta.warnings.length > 0) {
      const notes: string[] = [];
      notes.push('Avertissements:');
      notes.push(...profile.meta.warnings);
      
      sections.push({
        id: 'meta',
        title: 'Informations techniques',
        items: metaItems,
        notes: notes
      });
    } else if (metaItems.length > 0) {
      sections.push({
        id: 'meta',
        title: 'Informations techniques',
        items: metaItems
      });
    }
  }

  return sections;
}

