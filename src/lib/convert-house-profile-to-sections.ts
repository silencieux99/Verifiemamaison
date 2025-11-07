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
    if (profile.location.admin.citycode) {
      locationItems.push({ 
        label: 'Code INSEE', 
        value: profile.location.admin.citycode 
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
    if (profile.location.admin.iris) {
      locationItems.push({ 
        label: 'Code IRIS', 
        value: profile.location.admin.iris,
        hint: 'Îlot Regroupé pour l\'Information Statistique (INSEE)'
      });
    }
    if (profile.location.gps.lat && profile.location.gps.lon) {
      locationItems.push({ 
        label: 'Latitude', 
        value: `${profile.location.gps.lat.toFixed(6)}°` 
      });
      locationItems.push({ 
        label: 'Longitude', 
        value: `${profile.location.gps.lon.toFixed(6)}°` 
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

  // 1.5. Caractéristiques du bâtiment
  if (profile.building?.declared) {
    const buildingItems = [];
    const b = profile.building.declared;
    
    if (b.property_type) {
      buildingItems.push({
        label: 'Type de bien',
        value: b.property_type.charAt(0).toUpperCase() + b.property_type.slice(1)
      });
    }
    if (b.surface_habitable_m2) {
      buildingItems.push({
        label: 'Surface habitable',
        value: `${b.surface_habitable_m2} m²`
      });
    }
    if (b.rooms) {
      buildingItems.push({
        label: 'Nombre de pièces',
        value: `${b.rooms} pièce${b.rooms > 1 ? 's' : ''}`
      });
    }
    if (b.floors) {
      buildingItems.push({
        label: 'Nombre d\'étages',
        value: `${b.floors} étage${b.floors > 1 ? 's' : ''}`
      });
    }
    if (b.year_built) {
      const age = new Date().getFullYear() - b.year_built;
      buildingItems.push({
        label: 'Année de construction',
        value: `${b.year_built} (${age} ans)`,
        flag: age > 50 ? 'warn' as const : 'ok' as const
      });
    }
    if (b.roof_type) {
      buildingItems.push({
        label: 'Type de toiture',
        value: b.roof_type
      });
    }
    if (b.insulation) {
      buildingItems.push({
        label: 'Isolation',
        value: b.insulation
      });
    }
    if (b.electrical) {
      buildingItems.push({
        label: 'Installation électrique',
        value: b.electrical
      });
    }
    if (b.plumbing) {
      buildingItems.push({
        label: 'Plomberie',
        value: b.plumbing
      });
    }
    
    if (buildingItems.length > 0) {
      sections.push({
        id: 'building',
        title: 'Caractéristiques du bâtiment',
        items: buildingItems
      });
    }
  }

  // 2. Risques naturels et technologiques
  if (profile.risks) {
    const riskItems = [];
    
    // Inondation
    if (profile.risks.normalized?.flood_level) {
      const level = profile.risks.normalized.flood_level;
      riskItems.push({
        label: 'Risque d\'inondation',
        value: level.charAt(0).toUpperCase() + level.slice(1),
        flag: level === 'élevé' ? 'risk' as const : level === 'moyen' ? 'warn' as const : 'ok' as const,
        hint: 'Vérifiez les données PPRI (Plan de Prévention des Risques d\'Inondation)'
      });
    }
    
    // Séisme
    if (profile.risks.normalized?.seismic_level !== undefined) {
      const level = profile.risks.normalized.seismic_level;
      const labels = ['Très faible (zone 1)', 'Faible (zone 2)', 'Modéré (zone 3)', 'Moyen (zone 4)', 'Fort (zone 5)'];
      riskItems.push({
        label: 'Risque séismique',
        value: labels[level] || `Zone ${level}`,
        flag: level >= 3 ? 'risk' as const : level === 2 ? 'warn' as const : 'ok' as const,
        hint: level >= 3 ? 'Construction parasismique recommandée' : undefined
      });
    }
    
    // Radon
    if (profile.risks.normalized?.radon_zone !== undefined) {
      const zone = profile.risks.normalized.radon_zone;
      const labels = ['Faible potentiel (zone 1)', 'Potentiel faible à moyen (zone 2)', 'Potentiel significatif (zone 3)'];
      riskItems.push({
        label: 'Risque radon',
        value: labels[zone - 1] || `Zone ${zone}`,
        flag: zone === 3 ? 'warn' as const : 'ok' as const,
        hint: zone === 3 ? 'Mesure du radon recommandée dans les pièces habitées' : 'Un test radon peut être réalisé pour confirmer'
      });
    }
    
    // Retrait-gonflement des argiles
    if (profile.risks.clay_shrink_swell) {
      const raw = profile.risks.clay_shrink_swell;
      let level = 'Données disponibles';
      let flag: 'ok' | 'warn' | 'risk' = 'warn' as const;
      
      if (raw.level || raw.alea) {
        const alea = raw.level || raw.alea;
        if (alea === 'Fort' || alea === 'fort') {
          level = 'Aléa fort';
          flag = 'risk' as const;
        } else if (alea === 'Moyen' || alea === 'moyen') {
          level = 'Aléa moyen';
          flag = 'warn' as const;
        } else if (alea === 'Faible' || alea === 'faible') {
          level = 'Aléa faible';
          flag = 'ok' as const;
        }
      }
      
      riskItems.push({
        label: 'Retrait-gonflement des argiles',
        value: level,
        flag: flag,
        hint: flag !== 'ok' ? 'Peut affecter les fondations en cas de sécheresse. Étude de sol G2 recommandée.' : undefined
      });
    }
    
    // Mouvements de terrain
    if (profile.risks.ground_movements) {
      const raw = profile.risks.ground_movements;
      let count = 0;
      if (Array.isArray(raw)) count = raw.length;
      else if (raw.count) count = raw.count;
      
      riskItems.push({
        label: 'Mouvements de terrain',
        value: count > 0 ? `${count} événement${count > 1 ? 's' : ''} recensé${count > 1 ? 's' : ''}` : 'Données disponibles',
        flag: count > 0 ? 'warn' as const : 'ok' as const,
        hint: count > 0 ? 'Consultez le BRGM pour plus de détails' : undefined
      });
    }
    
    // Cavités souterraines
    if (profile.risks.cavities) {
      const raw = profile.risks.cavities;
      let count = 0;
      if (Array.isArray(raw)) count = raw.length;
      else if (raw.count) count = raw.count;
      
      riskItems.push({
        label: 'Cavités souterraines',
        value: count > 0 ? `${count} cavité${count > 1 ? 's' : ''} recensée${count > 1 ? 's' : ''}` : 'Données disponibles',
        flag: count > 0 ? 'warn' as const : 'ok' as const,
        hint: count > 0 ? 'Vérifiez auprès de la mairie et consultez le BRGM' : 'Vérifiez auprès de la mairie'
      });
    }
    
    // Feu de forêt
    if (profile.risks.wildfire) {
      const raw = profile.risks.wildfire;
      let level = 'Zone concernée';
      let flag: 'ok' | 'warn' | 'risk' = 'warn' as const;
      
      if (raw.level || raw.alea) {
        const alea = raw.level || raw.alea;
        if (alea === 'Fort' || alea === 'fort') {
          level = 'Aléa fort';
          flag = 'risk' as const;
        } else if (alea === 'Moyen' || alea === 'moyen') {
          level = 'Aléa moyen';
          flag = 'warn' as const;
        } else if (alea === 'Faible' || alea === 'faible') {
          level = 'Aléa faible';
          flag = 'ok' as const;
        }
      }
      
      riskItems.push({
        label: 'Risque de feu de forêt',
        value: level,
        flag: flag,
        hint: flag !== 'ok' ? 'Débroussaillement obligatoire dans un rayon de 50m' : undefined
      });
    }
    
    // Terres polluées
    if (profile.risks.polluted_lands) {
      const raw = profile.risks.polluted_lands;
      let count = 0;
      if (Array.isArray(raw)) count = raw.length;
      else if (raw.count) count = raw.count;
      else if (raw.basol_count || raw.basias_count) count = (raw.basol_count || 0) + (raw.basias_count || 0);
      
      riskItems.push({
        label: 'Sites et sols pollués',
        value: count > 0 ? `${count} site${count > 1 ? 's' : ''} recensé${count > 1 ? 's' : ''}` : 'Données disponibles',
        flag: count > 0 ? 'risk' as const : 'warn' as const,
        hint: 'Consultez les bases BASOL (sites pollués) et BASIAS (anciens sites industriels)'
      });
    }
    
    // Notes supplémentaires
    if (profile.risks.normalized?.notes && profile.risks.normalized.notes.length > 0) {
      profile.risks.normalized.notes.forEach((note, idx) => {
        riskItems.push({
          label: `Note ${idx + 1}`,
          value: note
        });
      });
    }
    
    // Si aucun risque spécifique, ajouter un message positif
    if (riskItems.length === 0) {
      riskItems.push({
        label: 'Analyse des risques',
        value: 'Aucun risque majeur détecté',
        flag: 'ok' as const
      });
    }
    
    if (riskItems.length > 0) {
      sections.push({
        id: 'risks',
        title: 'Risques naturels et technologiques',
        items: riskItems
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

  

  // 3. Performance énergétique (DPE)
  // Toujours afficher la section énergie, même si les données DPE ne sont pas disponibles
  const energyItems = [];
  
  if (profile.energy?.dpe?.class_energy) {
    const classEnergy = profile.energy.dpe.class_energy;
    energyItems.push({
      label: 'Classe énergétique',
      value: classEnergy,
      flag: ['E', 'F', 'G'].includes(classEnergy) ? 'risk' as const :
            classEnergy === 'D' ? 'warn' as const : 'ok' as const
    });
  }
  
  if (profile.energy?.dpe?.class_ges) {
    energyItems.push({
      label: 'Classe GES',
      value: profile.energy.dpe.class_ges,
      flag: ['E', 'F', 'G'].includes(profile.energy.dpe.class_ges) ? 'risk' as const :
            profile.energy.dpe.class_ges === 'D' ? 'warn' as const : 'ok' as const
    });
  }
  
  if (profile.energy?.dpe?.date) {
    energyItems.push({
      label: 'Date du DPE',
      value: new Date(profile.energy.dpe.date).toLocaleDateString('fr-FR')
    });
  }
  
  if (profile.energy?.dpe?.surface_m2) {
    energyItems.push({
      label: 'Surface',
      value: `${profile.energy.dpe.surface_m2} m²`
    });
  }
  
  if (profile.energy?.dpe?.housing_type) {
    energyItems.push({
      label: 'Type de logement',
      value: profile.energy.dpe.housing_type
    });
  }
  
  // Si aucune donnée DPE, afficher un message informatif
  if (energyItems.length === 0) {
    energyItems.push({
      label: 'Diagnostic de Performance Énergétique',
      value: 'Non disponible',
      flag: 'info' as const
    });
    energyItems.push({
      label: 'Information',
      value: 'Les données DPE ne sont pas disponibles pour cette adresse. Un DPE peut être réalisé par un professionnel certifié.',
      flag: 'info' as const
    });
  }
  
  // Toujours ajouter la section énergie
  sections.push({
    id: 'energy',
    title: 'Performance énergétique',
    items: energyItems
  });

  // 4. Marché immobilier (DVF)
  if (profile.market?.dvf) {
    const marketItems = [];
    
    if (profile.market.dvf.summary) {
      const summary = profile.market.dvf.summary;
      const isEstimated = (summary as any).estimated === true;
      
      if (summary.price_m2_median_1y) {
        marketItems.push({
          label: isEstimated ? 'Prix/m² estimé' : 'Prix/m² médian (1 an)',
          value: `${summary.price_m2_median_1y.toLocaleString('fr-FR')} €/m²`,
          hint: isEstimated ? 'Estimation basée sur la localisation' : undefined
        });
      }
      
      if (summary.price_m2_median_3y && !isEstimated) {
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
      
      if (summary.volume_3y && summary.volume_3y > 0) {
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

    // Transactions détaillées DVF (liste des comparables)
    if (profile.market.dvf.transactions && profile.market.dvf.transactions.length > 0) {
      // Trier par date décroissante et limiter à 12
      const tx = [...profile.market.dvf.transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 12);

      const txItems = tx.map((t, idx) => {
        const dateStr = t.date ? new Date(t.date).toLocaleDateString('fr-FR') : 'Date inconnue';
        const priceStr = t.price_eur ? `${t.price_eur.toLocaleString('fr-FR')} €` : 'Prix N/A';
        const priceM2Str = t.price_m2_eur ? `${t.price_m2_eur.toLocaleString('fr-FR')} €/m²` : '—';
        const surfaceStr = t.surface_m2 ? `${t.surface_m2} m²` : '—';
        const typeStr = t.type || 'vente';
        return {
          label: `Vente ${idx + 1} - ${dateStr}`,
          value: `${typeStr} • ${surfaceStr} • ${priceStr} • ${priceM2Str}`,
          hint: t.address_hint || undefined,
        };
      });

      if (txItems.length > 0) {
        sections.push({
          id: 'market_transactions',
          title: 'Transactions récentes (DVF)',
          items: txItems,
        });
      }
    }
  }

  // 4.5. Annonces similaires (Melo)
  if (profile.market?.melo) {
    const meloData = profile.market.melo;
    
    console.log('[Convert Sections] Données Melo trouvées:', {
      hasSimilarListings: !!meloData.similarListings,
      listingsCount: meloData.similarListings?.length || 0,
      hasMarketInsights: !!meloData.marketInsights,
    });
    
    if (meloData.similarListings && meloData.similarListings.length > 0) {
      // Section résumé avec statistiques
      const meloSummaryItems = [];
      
      if (meloData.marketInsights?.activeListings) {
        meloSummaryItems.push({
          label: 'Annonces actives trouvées',
          value: `${meloData.marketInsights.activeListings} annonce${meloData.marketInsights.activeListings > 1 ? 's' : ''}`,
          flag: 'ok' as const
        });
      }
      
      if (meloData.marketInsights?.averagePriceM2) {
        meloSummaryItems.push({
          label: 'Prix/m² moyen (annonces actives)',
          value: `${meloData.marketInsights.averagePriceM2.toLocaleString('fr-FR')} €/m²`
        });
      }
      
      if (meloData.marketInsights?.priceRange) {
        meloSummaryItems.push({
          label: 'Fourchette de prix/m²',
          value: `${meloData.marketInsights.priceRange.min.toLocaleString('fr-FR')} - ${meloData.marketInsights.priceRange.max.toLocaleString('fr-FR')} €/m²`
        });
      }
      
      if (meloData.marketInsights?.averageSurface) {
        meloSummaryItems.push({
          label: 'Surface moyenne',
          value: `${meloData.marketInsights.averageSurface} m²`
        });
      }
      
      if (meloData.fetchedAt) {
        meloSummaryItems.push({
          label: 'Données mises à jour',
          value: new Date(meloData.fetchedAt).toLocaleString('fr-FR')
        });
      }
      
      if (meloSummaryItems.length > 0) {
        const meloSection = {
          id: 'melo_summary',
          title: 'Marché actuel - Annonces similaires',
          items: meloSummaryItems,
          notes: [meloData.similarListings] as any // Stocker les listings pour le composant spécialisé
        };
        
        console.log('[Convert Sections] Section Melo créée:', {
          id: meloSection.id,
          itemsCount: meloSection.items.length,
          listingsCount: meloData.similarListings.length,
          notesIsArray: Array.isArray(meloSection.notes),
          notesLength: meloSection.notes.length,
          firstNoteIsArray: Array.isArray(meloSection.notes[0]),
        });
        
        sections.push(meloSection);
      }
    } else {
      console.log('[Convert Sections] Pas de listings Melo ou liste vide');
    }
  } else {
    console.log('[Convert Sections] Pas de données Melo dans profile.market.melo');
  }

  // 5. Urbanisme et PLU
  if (profile.urbanism) {
    const urbanismItems = [];
    
    if (profile.urbanism.zoning && profile.urbanism.zoning.length > 0) {
      urbanismItems.push({
        label: 'Zones PLU',
        value: `${profile.urbanism.zoning.length} zone${profile.urbanism.zoning.length > 1 ? 's' : ''} identifiée${profile.urbanism.zoning.length > 1 ? 's' : ''}`
      });
      
      profile.urbanism.zoning.forEach((zone, index) => {
        urbanismItems.push({
          label: `${zone.code}`,
          value: zone.label,
          hint: zone.doc_url ? `Document PLU disponible` : undefined
        });
      });
    }
    
    if (profile.urbanism.land_servitudes && profile.urbanism.land_servitudes.length > 0) {
      urbanismItems.push({
        label: 'Servitudes d\'utilité publique',
        value: `${profile.urbanism.land_servitudes.length} servitude${profile.urbanism.land_servitudes.length > 1 ? 's' : ''}`,
        flag: 'warn' as const
      });
      
      profile.urbanism.land_servitudes.forEach((servitude, index) => {
        urbanismItems.push({
          label: `${servitude.code}`,
          value: servitude.label,
          flag: 'warn' as const,
          hint: servitude.doc_url ? `Document disponible` : undefined
        });
      });
    }
    
    if (profile.urbanism.docs && profile.urbanism.docs.length > 0) {
      urbanismItems.push({
        label: 'Documents d\'urbanisme',
        value: `${profile.urbanism.docs.length} document${profile.urbanism.docs.length > 1 ? 's' : ''} disponible${profile.urbanism.docs.length > 1 ? 's' : ''}`
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

  // 5.5. Connectivité Internet
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
        value: `${profile.connectivity.down_max_mbps} Mb/s`,
        flag: profile.connectivity.down_max_mbps >= 100 ? 'ok' as const : 
              profile.connectivity.down_max_mbps >= 30 ? 'warn' as const : 'risk' as const
      });
    }
    
    if (profile.connectivity.up_max_mbps) {
      connectivityItems.push({
        label: 'Débit montant max',
        value: `${profile.connectivity.up_max_mbps} Mb/s`
      });
    }
    
    if (profile.connectivity.technologies && profile.connectivity.technologies.length > 0) {
      connectivityItems.push({
        label: 'Technologies disponibles',
        value: profile.connectivity.technologies.join(', ')
      });
    }
    
    if (profile.connectivity.operators && profile.connectivity.operators.length > 0) {
      connectivityItems.push({
        label: 'Opérateurs',
        value: `${profile.connectivity.operators.length} opérateur${profile.connectivity.operators.length > 1 ? 's' : ''}`,
        hint: profile.connectivity.operators.slice(0, 5).join(', ')
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
      gps: school.gps,
      rating: school.rating,
      rating_count: school.rating_count
    }));
    
    sections.push({
      id: 'education',
      title: 'Écoles à proximité',
      items: educationItems,
      notes: schoolsData as any // Stocker les données des écoles dans notes pour le composant spécialisé
    });
  }


  // 8. Commodités (Commerces de proximité)
  if (profile.amenities) {
    const amenitiesItems = [];
    const allAmenities: any[] = [];
    
    // Statistiques générales
    const totalCount = 
      (profile.amenities.supermarkets?.length || 0) +
      (profile.amenities.transit?.length || 0) +
      (profile.amenities.parks?.length || 0);
    
    if (totalCount > 0) {
      amenitiesItems.push({
        label: 'Nombre de commerces et services',
        value: `${totalCount} établissement${totalCount > 1 ? 's' : ''} à proximité`,
        flag: totalCount >= 10 ? 'ok' as const : totalCount >= 5 ? 'warn' as const : undefined
      });
      
      // Grouper par type
      const byType: Record<string, number> = {};
      
      if (profile.amenities.supermarkets && profile.amenities.supermarkets.length > 0) {
        byType['Supermarchés'] = profile.amenities.supermarkets.length;
        profile.amenities.supermarkets.forEach(supermarket => {
          allAmenities.push({
            name: supermarket.name || 'Supermarché',
            type: 'supermarket',
            category: 'Supermarché',
            distance_m: supermarket.distance_m,
            gps: supermarket.gps,
            address: supermarket.raw?.tags?.addr_street || supermarket.raw?.tags?.address,
            phone: supermarket.raw?.tags?.phone,
            website: supermarket.raw?.tags?.website,
            rating: supermarket.raw?.tags?.rating,
            rating_count: supermarket.raw?.tags?.rating_count
          });
        });
      }
      
      if (profile.amenities.transit && profile.amenities.transit.length > 0) {
        byType['Transports en commun'] = profile.amenities.transit.length;
        profile.amenities.transit.forEach(transit => {
          const typeLabel = transit.type === 'station' ? 'Gare' : 
                           transit.type === 'bus_station' ? 'Arrêt de bus' :
                           transit.type === 'subway_entrance' ? 'Métro' : 'Transport';
          allAmenities.push({
            name: transit.name || typeLabel,
            type: 'transit',
            category: 'Transport en commun',
            transit_type: transit.type,
            distance_m: transit.distance_m,
            gps: transit.gps,
            address: transit.raw?.tags?.addr_street || transit.raw?.tags?.address,
            phone: transit.raw?.tags?.phone,
            website: transit.raw?.tags?.website,
            rating: transit.raw?.tags?.rating,
            rating_count: transit.raw?.tags?.rating_count
          });
        });
      }
      
      if (profile.amenities.parks && profile.amenities.parks.length > 0) {
        byType['Parcs et espaces verts'] = profile.amenities.parks.length;
        profile.amenities.parks.forEach(park => {
          allAmenities.push({
            name: park.name || 'Parc',
            type: 'park',
            category: 'Parc et espace vert',
            distance_m: park.distance_m,
            gps: park.gps,
            address: park.raw?.tags?.addr_street || park.raw?.tags?.address,
            phone: park.raw?.tags?.phone,
            website: park.raw?.tags?.website,
            rating: park.raw?.tags?.rating,
            rating_count: park.raw?.tags?.rating_count
          });
        });
      }
      
      // Statistiques par type
      Object.entries(byType).forEach(([type, count]) => {
        amenitiesItems.push({
          label: type,
          value: `${count} établissement${count > 1 ? 's' : ''}`
        });
      });
      
      // Trier les commerces par distance et créer des items détaillés pour les plus proches (15 max)
      const sortedAmenities = [...allAmenities]
        .sort((a, b) => a.distance_m - b.distance_m)
        .slice(0, 15);
      
      // Stocker les données détaillées des commerces dans les notes (format spécial pour le composant)
      const amenitiesData = sortedAmenities.map(amenity => ({
        name: amenity.name,
        type: amenity.type,
        category: amenity.category,
        transit_type: amenity.transit_type,
        distance_m: amenity.distance_m,
        gps: amenity.gps,
        address: amenity.address,
        phone: amenity.phone,
        website: amenity.website,
        rating: amenity.rating,
        rating_count: amenity.rating_count
      }));
      
      sections.push({
        id: 'amenities',
        title: 'Commerces de proximité',
        items: amenitiesItems,
        notes: amenitiesData as any // Stocker les données des commerces dans notes pour le composant spécialisé
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

