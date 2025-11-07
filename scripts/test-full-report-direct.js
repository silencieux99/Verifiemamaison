/**
 * Script de test complet DIRECT - Utilise les fonctions internes
 * Teste toutes les fonctionnalités : Gemini marché, Gemini criminalité, etc.
 * Sans passer par l'API HTTP (plus rapide et plus simple)
 */

require('dotenv').config({ path: '.env.local' });

const address = process.argv[2] || '36 bis rue auguste blanqui';
const city = process.argv[3] || 'Aulnay-sous-Bois';
const postcode = process.argv[4] || '93600';

console.log('='.repeat(80));
console.log('🔍 TEST COMPLET DU SITE - RAPPORT DÉTAILLÉ');
console.log('='.repeat(80));
console.log(`📍 Adresse: ${address}, ${city} ${postcode}\n`);

async function testFullReportDirect() {
  try {
    // Importer les fonctions nécessaires
    const { 
      geocodeAddress,
      fetchGeoRisques,
      fetchDPE,
      fetchDVF,
      fetchSchools,
      fetchOSMAmenities,
    } = require('../src/lib/house-profile-utils');
    const { analyzeWithOpenAI } = require('../src/lib/ai-analysis');
    const { 
      enrichMarketWithGeminiWebSearch,
      enrichSafetyWithGeminiWebSearch 
    } = require('../src/lib/gemini-web-search');
    const { enrichMarketWithMelo, mergeMeloWithMarket } = require('../src/lib/melo-market-enrichment');

    console.log('📡 Étape 1: Géocodage de l\'adresse...\n');
    
    // 1. Géocodage
    const location = await geocodeAddress(`${address}, ${city} ${postcode}`);
    if (!location || !location.gps) {
      console.error('❌ Impossible de géocoder l\'adresse');
      return;
    }
    
    console.log('✅ Adresse géocodée');
    console.log(`   - Adresse normalisée: ${location.normalized_address || 'N/A'}`);
    console.log(`   - GPS: ${location.gps.lat}, ${location.gps.lon}`);
    console.log(`   - Commune: ${location.admin?.city || 'N/A'}`);
    console.log(`   - Code postal: ${location.admin?.postcode || 'N/A'}`);
    console.log(`   - Code commune: ${location.admin?.citycode || 'N/A'}\n`);

    // Créer un profil de base
    const profile = {
      query: {
        address: `${address}, ${city} ${postcode}`,
      },
      location: location,
    };

    console.log('📡 Étape 2: Récupération des risques naturels...\n');
    
    // 2. Risques
    try {
      const risks = await fetchGeoRisques(location.admin?.citycode || '', location.gps.lat, location.gps.lon);
      if (risks) {
        profile.risks = risks;
        console.log('✅ Risques récupérés');
        if (risks.normalized) {
          console.log(`   - Inondation: ${risks.normalized.flood_level || 'N/A'}`);
          console.log(`   - Sismique: ${risks.normalized.seismic_level || 'N/A'}`);
          console.log(`   - Radon: ${risks.normalized.radon_zone || 'N/A'}`);
        }
      }
    } catch (e) {
      console.log('⚠️  Erreur risques (ignoré):', e.message);
    }

    console.log('\n📡 Étape 3: Récupération DPE (Performance énergétique)...\n');
    
    // 3. DPE
    try {
      const energy = await fetchDPE(
        location.normalized_address || `${address}, ${city} ${postcode}`,
        location.admin?.citycode || '',
        location.gps.lat,
        location.gps.lon
      );
      if (energy?.dpe) {
        profile.energy = energy;
        console.log('✅ DPE récupéré');
        console.log(`   - Classe énergétique: ${energy.dpe.class_energy || 'N/A'}`);
        console.log(`   - Classe GES: ${energy.dpe.class_ges || 'N/A'}`);
      }
    } catch (e) {
      console.log('⚠️  Erreur DPE (ignoré):', e.message);
    }

    console.log('\n📡 Étape 4: Récupération données marché DVF...\n');
    
    // 4. DVF
    try {
      const market = await fetchDVF(location.admin?.citycode || '', location.gps.lat, location.gps.lon);
      if (market) {
        profile.market = { dvf: market };
        console.log('✅ Données DVF récupérées');
        if (market.summary) {
          console.log(`   - Prix/m² médian (1 an): ${market.summary.price_m2_median_1y ? `${market.summary.price_m2_median_1y.toLocaleString('fr-FR')} €/m²` : 'N/A'}`);
          console.log(`   - Transactions: ${market.transactions?.length || 0}`);
        }
      }
    } catch (e) {
      console.log('⚠️  Erreur DVF (ignoré):', e.message);
    }

    console.log('\n📡 Étape 5: Récupération écoles...\n');
    
    // 5. Écoles
    try {
      const education = await fetchSchools(location.gps.lat, location.gps.lon, 1500);
      if (education?.schools && education.schools.length > 0) {
        profile.education = education;
        console.log(`✅ ${education.schools.length} école(s) trouvée(s)`);
        education.schools.slice(0, 3).forEach((s, i) => {
          console.log(`   ${i + 1}. ${s.name} - ${s.kind}${s.distance_m ? ` (${(s.distance_m / 1000).toFixed(1)} km)` : ''}`);
        });
      }
    } catch (e) {
      console.log('⚠️  Erreur écoles (ignoré):', e.message);
    }

    console.log('\n📡 Étape 6: Récupération commodités...\n');
    
    // 6. Commodités
    try {
      const amenities = await fetchOSMAmenities(location.gps.lat, location.gps.lon, 1500);
      if (amenities) {
        profile.amenities = amenities;
        const total = (amenities.supermarkets?.length || 0) + 
                     (amenities.transit?.length || 0) + 
                     (amenities.parks?.length || 0);
        console.log(`✅ ${total} commodité(s) trouvée(s)`);
        console.log(`   - Supermarchés: ${amenities.supermarkets?.length || 0}`);
        console.log(`   - Transports: ${amenities.transit?.length || 0}`);
        console.log(`   - Parcs: ${amenities.parks?.length || 0}`);
      }
    } catch (e) {
      console.log('⚠️  Erreur commodités (ignoré):', e.message);
    }

    console.log('\n📡 Étape 7: Recherche Gemini - Marché immobilier...\n');
    
    // 7. Gemini Marché
    let geminiMarketData = null;
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_WEB_SEARCH_ENABLED !== 'false') {
      try {
        geminiMarketData = await enrichMarketWithGeminiWebSearch(profile);
        if (geminiMarketData) {
          console.log('✅ Données Gemini marché trouvées');
          console.log(`   - Prix/m²: ${geminiMarketData.price_m2 ? `${geminiMarketData.price_m2.toLocaleString('fr-FR')} €/m²` : 'N/A'}`);
          console.log(`   - Tendance: ${geminiMarketData.market_trend || 'N/A'}`);
          if (geminiMarketData.price_m2_range) {
            console.log(`   - Fourchette: ${geminiMarketData.price_m2_range.min.toLocaleString('fr-FR')} - ${geminiMarketData.price_m2_range.max.toLocaleString('fr-FR')} €/m²`);
          }
          if (geminiMarketData.sources && geminiMarketData.sources.length > 0) {
            console.log(`   - Sources: ${geminiMarketData.sources.join(', ')}`);
          }
        } else {
          console.log('⚠️  Aucune donnée Gemini marché trouvée');
        }
      } catch (e) {
        console.log('⚠️  Erreur Gemini marché (ignoré):', e.message);
      }
    } else {
      console.log('ℹ️  Gemini marché désactivé (GEMINI_API_KEY non configurée)');
    }

    console.log('\n📡 Étape 8: Recherche Gemini - Criminalité...\n');
    
    // 8. Gemini Criminalité
    let geminiCrimeData = null;
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_WEB_SEARCH_ENABLED !== 'false') {
      try {
        geminiCrimeData = await enrichSafetyWithGeminiWebSearch(profile);
        if (geminiCrimeData) {
          console.log('✅ Données Gemini criminalité trouvées');
          console.log(`   - Score sécurité: ${geminiCrimeData.safety_score !== undefined ? `${geminiCrimeData.safety_score}/100` : 'N/A'}`);
          console.log(`   - Taux criminalité: ${geminiCrimeData.crime_rate ? geminiCrimeData.crime_rate.charAt(0).toUpperCase() + geminiCrimeData.crime_rate.slice(1) : 'N/A'}`);
          console.log(`   - Tendance: ${geminiCrimeData.crime_trend || 'N/A'}`);
          if (geminiCrimeData.main_crime_types && geminiCrimeData.main_crime_types.length > 0) {
            console.log(`   - Types de crimes: ${geminiCrimeData.main_crime_types.join(', ')}`);
          }
          if (geminiCrimeData.recent_crimes && geminiCrimeData.recent_crimes.length > 0) {
            console.log(`   - Crimes récents: ${geminiCrimeData.recent_crimes.length} trouvé(s)`);
          }
          if (geminiCrimeData.sources && geminiCrimeData.sources.length > 0) {
            console.log(`   - Sources: ${geminiCrimeData.sources.join(', ')}`);
          }
        } else {
          console.log('⚠️  Aucune donnée Gemini criminalité trouvée');
        }
      } catch (e) {
        console.log('⚠️  Erreur Gemini criminalité (ignoré):', e.message);
      }
    } else {
      console.log('ℹ️  Gemini criminalité désactivé (GEMINI_API_KEY non configurée)');
    }

    console.log('\n📡 Étape 9: Analyse IA complète...\n');
    
    // 9. Analyse IA (qui utilise aussi les données Gemini marché)
    let aiAnalysis = null;
    if (process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY) {
      try {
        // Préparer le profil avec les données Gemini
        const enrichedProfile = {
          ...profile,
          ai_analysis: null, // Sera rempli par analyzeWithOpenAI
        };
        
        aiAnalysis = await analyzeWithOpenAI(enrichedProfile);
        if (aiAnalysis) {
          profile.ai_analysis = aiAnalysis;
          console.log('✅ Analyse IA générée');
          console.log(`   - Score global: ${aiAnalysis.score}/100`);
          console.log(`   - Prix/m² estimé: ${aiAnalysis.market_analysis?.estimated_value_m2 ? `${aiAnalysis.market_analysis.estimated_value_m2.toLocaleString('fr-FR')} €/m²` : 'N/A'}`);
          console.log(`   - Tendance marché: ${aiAnalysis.market_analysis?.market_trend || 'N/A'}`);
          if (aiAnalysis.strengths && aiAnalysis.strengths.length > 0) {
            console.log(`   - Points forts: ${aiAnalysis.strengths.length}`);
          }
          if (aiAnalysis.weaknesses && aiAnalysis.weaknesses.length > 0) {
            console.log(`   - Points faibles: ${aiAnalysis.weaknesses.length}`);
          }
        }
      } catch (e) {
        console.log('⚠️  Erreur analyse IA (ignoré):', e.message);
      }
    } else {
      console.log('ℹ️  Analyse IA désactivée (OPENAI_API_KEY ou GEMINI_API_KEY non configurée)');
    }

    // Stocker les données Gemini dans le profil
    if (geminiCrimeData) {
      if (!profile.safety) profile.safety = {};
      profile.safety.gemini_crime_data = geminiCrimeData;
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 RAPPORT DÉTAILLÉ COMPLET');
    console.log('='.repeat(80));
    
    // RAPPORT DÉTAILLÉ
    console.log('\n📍 1. INFORMATIONS GÉNÉRALES');
    console.log('-'.repeat(80));
    console.log(`Adresse: ${location.normalized_address || address}`);
    console.log(`Ville: ${location.admin?.city || city}`);
    console.log(`Code postal: ${location.admin?.postcode || postcode}`);
    console.log(`GPS: ${location.gps.lat}, ${location.gps.lon}`);
    if (aiAnalysis) {
      console.log(`Score global: ${aiAnalysis.score}/100`);
    }

    // RISQUES
    console.log('\n⚠️  2. RISQUES NATURELS');
    console.log('-'.repeat(80));
    if (profile.risks?.normalized) {
      const r = profile.risks.normalized;
      console.log(`Inondation: ${r.flood_level || 'N/A'}`);
      console.log(`Sismique: ${r.seismic_level || 'N/A'}`);
      console.log(`Radon: ${r.radon_zone || 'N/A'}`);
    } else {
      console.log('❌ Aucune donnée');
    }

    // ÉNERGIE
    console.log('\n⚡ 3. PERFORMANCE ÉNERGÉTIQUE (DPE)');
    console.log('-'.repeat(80));
    if (profile.energy?.dpe) {
      const dpe = profile.energy.dpe;
      console.log(`Classe énergétique: ${dpe.class_energy || 'N/A'}`);
      console.log(`Classe GES: ${dpe.class_ges || 'N/A'}`);
      if (dpe.conso_energy) console.log(`Consommation: ${dpe.conso_energy} kWh/m²/an`);
      if (dpe.emission_ges) console.log(`Émissions GES: ${dpe.emission_ges} kg CO₂/m²/an`);
    } else {
      console.log('❌ Aucune donnée DPE');
    }

    // MARCHÉ DVF
    console.log('\n📈 4. MARCHÉ IMMOBILIER (DVF)');
    console.log('-'.repeat(80));
    if (profile.market?.dvf?.summary) {
      const dvf = profile.market.dvf;
      console.log(`Prix/m² médian (1 an): ${dvf.summary.price_m2_median_1y ? `${dvf.summary.price_m2_median_1y.toLocaleString('fr-FR')} €/m²` : 'N/A'}`);
      console.log(`Prix/m² médian (3 ans): ${dvf.summary.price_m2_median_3y ? `${dvf.summary.price_m2_median_3y.toLocaleString('fr-FR')} €/m²` : 'N/A'}`);
      console.log(`Tendance: ${dvf.summary.trend_label || 'N/A'}`);
      console.log(`Transactions: ${dvf.transactions?.length || 0}`);
    } else {
      console.log('❌ Aucune donnée DVF');
    }

    // GEMINI MARCHÉ
    console.log('\n💰 5. GEMINI - MARCHÉ EN TEMPS RÉEL');
    console.log('-'.repeat(80));
    if (geminiMarketData) {
      console.log(`Prix/m²: ${geminiMarketData.price_m2 ? `${geminiMarketData.price_m2.toLocaleString('fr-FR')} €/m²` : 'N/A'}`);
      if (geminiMarketData.price_m2_range) {
        console.log(`Fourchette: ${geminiMarketData.price_m2_range.min.toLocaleString('fr-FR')} - ${geminiMarketData.price_m2_range.max.toLocaleString('fr-FR')} €/m²`);
      }
      console.log(`Tendance: ${geminiMarketData.market_trend || 'N/A'}`);
      if (geminiMarketData.market_comment) {
        console.log(`\nCommentaire marché:`);
        console.log(geminiMarketData.market_comment);
      }
      if (geminiMarketData.recent_sales && geminiMarketData.recent_sales.length > 0) {
        console.log(`\nVentes récentes: ${geminiMarketData.recent_sales.length}`);
        geminiMarketData.recent_sales.slice(0, 3).forEach((sale, i) => {
          console.log(`   ${i + 1}. ${sale.price_m2.toLocaleString('fr-FR')} €/m² - ${sale.surface} m²${sale.date ? ` (${sale.date})` : ''}`);
        });
      }
      if (geminiMarketData.sources && geminiMarketData.sources.length > 0) {
        console.log(`\nSources: ${geminiMarketData.sources.join(', ')}`);
      }
    } else {
      console.log('❌ Aucune donnée Gemini marché');
    }

    // GEMINI CRIMINALITÉ
    console.log('\n🛡️  6. GEMINI - CRIMINALITÉ & SÉCURITÉ');
    console.log('-'.repeat(80));
    if (geminiCrimeData) {
      console.log(`Score sécurité: ${geminiCrimeData.safety_score !== undefined ? `${geminiCrimeData.safety_score}/100` : 'N/A'}`);
      console.log(`Taux criminalité: ${geminiCrimeData.crime_rate ? geminiCrimeData.crime_rate.charAt(0).toUpperCase() + geminiCrimeData.crime_rate.slice(1) : 'N/A'}`);
      console.log(`Tendance: ${geminiCrimeData.crime_trend || 'N/A'}`);
      if (geminiCrimeData.main_crime_types && geminiCrimeData.main_crime_types.length > 0) {
        console.log(`\nTypes de crimes principaux:`);
        geminiCrimeData.main_crime_types.forEach((type, i) => {
          console.log(`   ${i + 1}. ${type}`);
        });
      }
      if (geminiCrimeData.recent_crimes && geminiCrimeData.recent_crimes.length > 0) {
        console.log(`\nCrimes récents (${geminiCrimeData.recent_crimes.length}):`);
        geminiCrimeData.recent_crimes.slice(0, 5).forEach((crime, i) => {
          console.log(`   ${i + 1}. ${crime.type}${crime.date ? ` (${crime.date})` : ''}`);
          if (crime.description) {
            console.log(`      ${crime.description.substring(0, 100)}...`);
          }
          if (crime.location) {
            console.log(`      📍 ${crime.location}`);
          }
        });
      }
      if (geminiCrimeData.safety_comment) {
        console.log(`\nAnalyse sécurité:`);
        console.log(geminiCrimeData.safety_comment);
      }
      if (geminiCrimeData.comparison) {
        console.log(`\nComparaison:`);
        console.log(geminiCrimeData.comparison);
      }
      if (geminiCrimeData.sources && geminiCrimeData.sources.length > 0) {
        console.log(`\nSources: ${geminiCrimeData.sources.join(', ')}`);
      }
    } else {
      console.log('❌ Aucune donnée Gemini criminalité');
    }

    // ÉCOLES
    console.log('\n🏫 7. ÉCOLES');
    console.log('-'.repeat(80));
    if (profile.education?.schools && profile.education.schools.length > 0) {
      console.log(`Total: ${profile.education.schools.length} école(s)`);
      profile.education.schools.slice(0, 5).forEach((school, i) => {
        console.log(`   ${i + 1}. ${school.name} - ${school.kind || 'N/A'}${school.distance_m ? ` (${(school.distance_m / 1000).toFixed(1)} km)` : ''}`);
        if (school.rating) console.log(`      ⭐ ${school.rating}/5`);
      });
    } else {
      console.log('❌ Aucune école trouvée');
    }

    // COMMODITÉS
    console.log('\n🛒 8. COMMODITÉS');
    console.log('-'.repeat(80));
    if (profile.amenities) {
      const total = (profile.amenities.supermarkets?.length || 0) + 
                   (profile.amenities.transit?.length || 0) + 
                   (profile.amenities.parks?.length || 0);
      console.log(`Total: ${total} commodité(s)`);
      console.log(`   - Supermarchés: ${profile.amenities.supermarkets?.length || 0}`);
      if (profile.amenities.supermarkets && profile.amenities.supermarkets.length > 0) {
        profile.amenities.supermarkets.slice(0, 3).forEach((s, i) => {
          console.log(`      ${i + 1}. ${s.name}${s.distance_m ? ` (${(s.distance_m / 1000).toFixed(1)} km)` : ''}`);
        });
      }
      console.log(`   - Transports: ${profile.amenities.transit?.length || 0}`);
      if (profile.amenities.transit && profile.amenities.transit.length > 0) {
        profile.amenities.transit.slice(0, 3).forEach((t, i) => {
          console.log(`      ${i + 1}. ${t.name}${t.distance_m ? ` (${(t.distance_m / 1000).toFixed(1)} km)` : ''}`);
        });
      }
      console.log(`   - Parcs: ${profile.amenities.parks?.length || 0}`);
    } else {
      console.log('❌ Aucune commodité trouvée');
    }

    // ANALYSE IA
    console.log('\n🤖 9. ANALYSE IA COMPLÈTE');
    console.log('-'.repeat(80));
    if (aiAnalysis) {
      console.log(`Score global: ${aiAnalysis.score}/100`);
      if (aiAnalysis.summary) {
        console.log(`\nSynthèse:`);
        console.log(aiAnalysis.summary);
      }
      if (aiAnalysis.market_analysis) {
        console.log(`\nAnalyse marché:`);
        console.log(`   - Prix/m² estimé: ${aiAnalysis.market_analysis.estimated_value_m2 ? `${aiAnalysis.market_analysis.estimated_value_m2.toLocaleString('fr-FR')} €/m²` : 'N/A'}`);
        console.log(`   - Tendance: ${aiAnalysis.market_analysis.market_trend || 'N/A'}`);
        if (aiAnalysis.market_analysis.market_comment) {
          console.log(`   - Commentaire: ${aiAnalysis.market_analysis.market_comment.substring(0, 200)}...`);
        }
      }
      if (aiAnalysis.strengths && aiAnalysis.strengths.length > 0) {
        console.log(`\nPoints forts (${aiAnalysis.strengths.length}):`);
        aiAnalysis.strengths.forEach((s, i) => console.log(`   ${i + 1}. ${s}`));
      }
      if (aiAnalysis.weaknesses && aiAnalysis.weaknesses.length > 0) {
        console.log(`\nPoints faibles (${aiAnalysis.weaknesses.length}):`);
        aiAnalysis.weaknesses.forEach((w, i) => console.log(`   ${i + 1}. ${w}`));
      }
      if (aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0) {
        console.log(`\nRecommandations (${aiAnalysis.recommendations.length}):`);
        aiAnalysis.recommendations.forEach((r, i) => console.log(`   ${i + 1}. ${r}`));
      }
    } else {
      console.log('❌ Aucune analyse IA');
    }

    // RÉSUMÉ
    console.log('\n' + '='.repeat(80));
    console.log('📊 RÉSUMÉ DES DONNÉES RÉCUPÉRÉES');
    console.log('='.repeat(80));
    const summary = {
      '📍 Géolocalisation': location ? '✅' : '❌',
      '⚠️  Risques naturels': profile.risks ? '✅' : '❌',
      '⚡ DPE': profile.energy?.dpe ? '✅' : '❌',
      '📈 Marché DVF': profile.market?.dvf ? '✅' : '❌',
      '💰 Gemini Marché': geminiMarketData ? '✅' : '❌',
      '🛡️  Gemini Criminalité': geminiCrimeData ? '✅' : '❌',
      '🏫 Écoles': profile.education?.schools?.length > 0 ? `✅ (${profile.education.schools.length})` : '❌',
      '🛒 Commodités': profile.amenities ? '✅' : '❌',
      '🤖 Analyse IA': aiAnalysis ? '✅' : '❌',
    };
    
    Object.entries(summary).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('✅ TEST COMPLET TERMINÉ');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

testFullReportDirect();

