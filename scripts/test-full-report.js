/**
 * Script de test complet pour générer un rapport détaillé
 * Teste toutes les fonctionnalités : Gemini marché, Gemini criminalité, Melo, etc.
 */

require('dotenv').config({ path: '.env.local' });

const address = process.argv[2] || '36 bis rue auguste blanqui';
const city = process.argv[3] || 'Aulnay-sous-Bois';
const postcode = process.argv[4] || '93600';

console.log('='.repeat(80));
console.log('🔍 TEST COMPLET DU SITE - GÉNÉRATION DE RAPPORT DÉTAILLÉ');
console.log('='.repeat(80));
console.log(`📍 Adresse: ${address}, ${city} ${postcode}\n`);

// Simuler un token Firebase (pour les tests, on utilisera une clé de test)
// En production, il faudrait un vrai token Firebase Auth
const TEST_USER_TOKEN = process.env.TEST_FIREBASE_TOKEN || 'test-token';

async function testFullReport() {
  try {
    console.log('📡 Étape 1: Récupération des données de base (house-profile)...\n');
    
    // Étape 1: Récupérer les données de base
    const addressParam = encodeURIComponent(`${address}, ${city} ${postcode}`);
    const profileResponse = await fetch(`http://localhost:3000/api/house-profile?address=${addressParam}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TEST_USER_TOKEN}`,
      },
    });

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      console.error('❌ Erreur house-profile:', profileResponse.status);
      console.error(errorText);
      return;
    }

    const profileData = await profileResponse.json();
    console.log('✅ Données de base récupérées');
    console.log(`   - Localisation: ${profileData.profile?.location?.normalized_address || 'N/A'}`);
    console.log(`   - GPS: ${profileData.profile?.location?.gps?.lat}, ${profileData.profile?.location?.gps?.lon || 'N/A'}`);
    console.log(`   - Risques: ${profileData.profile?.risks ? 'Oui' : 'Non'}`);
    console.log(`   - Énergie: ${profileData.profile?.energy ? 'Oui' : 'Non'}`);
    console.log(`   - Marché: ${profileData.profile?.market ? 'Oui' : 'Non'}`);
    console.log(`   - Écoles: ${profileData.profile?.education?.schools?.length || 0} trouvée(s)`);
    console.log(`   - Commodités: ${profileData.profile?.amenities ? 'Oui' : 'Non'}`);
    console.log(`   - Analyse IA: ${profileData.profile?.ai_analysis ? 'Oui' : 'Non'}\n`);

    console.log('📡 Étape 2: Génération du rapport complet (avec Gemini marché + criminalité)...\n');
    
    // Étape 2: Générer le rapport complet
    const reportResponse = await fetch('http://localhost:3000/api/reports/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_USER_TOKEN}`,
      },
      body: JSON.stringify({
        address: `${address}, ${city} ${postcode}`,
        postalCode: postcode,
        city: city,
        profileData: profileData.profile,
      }),
    });

    if (!reportResponse.ok) {
      const errorText = await reportResponse.text();
      console.error('❌ Erreur génération rapport:', reportResponse.status);
      console.error(errorText);
      return;
    }

    const reportResult = await reportResponse.json();
    console.log('✅ Rapport généré avec succès');
    console.log(`   - Report ID: ${reportResult.reportId}`);
    console.log(`   - Order ID: ${reportResult.orderId}\n`);

    console.log('📡 Étape 3: Récupération du rapport complet...\n');
    
    // Étape 3: Récupérer le rapport complet
    const fullReportResponse = await fetch(`http://localhost:3000/api/reports/${reportResult.reportId}`, {
      headers: {
        'Authorization': `Bearer ${TEST_USER_TOKEN}`,
      },
    });

    if (!fullReportResponse.ok) {
      console.error('❌ Erreur récupération rapport:', fullReportResponse.status);
      return;
    }

    const fullReport = await fullReportResponse.json();
    const report = fullReport.report;
    const profile = report.profileData;

    console.log('='.repeat(80));
    console.log('📊 RAPPORT DÉTAILLÉ COMPLET');
    console.log('='.repeat(80));
    
    // 1. INFORMATIONS GÉNÉRALES
    console.log('\n📍 1. INFORMATIONS GÉNÉRALES');
    console.log('-'.repeat(80));
    console.log(`Adresse: ${report.address?.full || 'N/A'}`);
    console.log(`Ville: ${report.address?.city || 'N/A'}`);
    console.log(`Code postal: ${report.address?.postalCode || 'N/A'}`);
    console.log(`GPS: ${report.address?.gps?.lat || 'N/A'}, ${report.address?.gps?.lon || 'N/A'}`);
    console.log(`Score global: ${report.report?.score || 'N/A'}/100`);
    console.log(`Statut: ${report.report?.status || 'N/A'}`);

    // 2. DONNÉES GEMINI - MARCHÉ
    console.log('\n💰 2. DONNÉES GEMINI - MARCHÉ IMMOBILIER');
    console.log('-'.repeat(80));
    if (profile.ai_analysis?.market_analysis) {
      const market = profile.ai_analysis.market_analysis;
      console.log(`Prix/m² estimé: ${market.estimated_value_m2 ? `${market.estimated_value_m2.toLocaleString('fr-FR')} €/m²` : 'N/A'}`);
      console.log(`Tendance marché: ${market.market_trend || 'N/A'}`);
      if (market.market_comment) {
        console.log(`Commentaire: ${market.market_comment.substring(0, 200)}...`);
      }
      if (market.price_comparison) {
        console.log(`Comparaison: ${market.price_comparison.substring(0, 200)}...`);
      }
    } else {
      console.log('❌ Aucune donnée Gemini marché trouvée');
    }

    // 3. DONNÉES GEMINI - CRIMINALITÉ
    console.log('\n🛡️  3. DONNÉES GEMINI - CRIMINALITÉ & SÉCURITÉ');
    console.log('-'.repeat(80));
    if (profile.safety?.gemini_crime_data) {
      const crime = profile.safety.gemini_crime_data;
      console.log(`Score sécurité: ${crime.safety_score !== undefined ? `${crime.safety_score}/100` : 'N/A'}`);
      console.log(`Taux criminalité: ${crime.crime_rate ? crime.crime_rate.charAt(0).toUpperCase() + crime.crime_rate.slice(1) : 'N/A'}`);
      console.log(`Tendance: ${crime.crime_trend || 'N/A'}`);
      if (crime.main_crime_types && crime.main_crime_types.length > 0) {
        console.log(`Types de crimes principaux: ${crime.main_crime_types.join(', ')}`);
      }
      if (crime.recent_crimes && crime.recent_crimes.length > 0) {
        console.log(`Crimes récents trouvés: ${crime.recent_crimes.length}`);
        crime.recent_crimes.slice(0, 3).forEach((c, i) => {
          console.log(`   ${i + 1}. ${c.type}${c.date ? ` (${c.date})` : ''}`);
        });
      }
      if (crime.safety_comment) {
        console.log(`Commentaire sécurité: ${crime.safety_comment.substring(0, 200)}...`);
      }
      if (crime.sources && crime.sources.length > 0) {
        console.log(`Sources: ${crime.sources.join(', ')}`);
      }
    } else {
      console.log('❌ Aucune donnée Gemini criminalité trouvée');
    }

    // 4. DONNÉES MELO
    console.log('\n🏠 4. DONNÉES MELO - ANNONCES SIMILAIRES');
    console.log('-'.repeat(80));
    if (profile.market?.melo?.similarListings && profile.market.melo.similarListings.length > 0) {
      const listings = profile.market.melo.similarListings;
      console.log(`Annonces similaires trouvées: ${listings.length}`);
      if (profile.market.melo.marketInsights) {
        const insights = profile.market.melo.marketInsights;
        console.log(`Prix/m² moyen: ${insights.averagePriceM2 ? `${insights.averagePriceM2.toLocaleString('fr-FR')} €/m²` : 'N/A'}`);
        console.log(`Surface moyenne: ${insights.averageSurface ? `${insights.averageSurface} m²` : 'N/A'}`);
        console.log(`Distance moyenne: ${insights.averageDistance ? `${(insights.averageDistance / 1000).toFixed(1)} km` : 'N/A'}`);
      }
      console.log(`\nPremières annonces:`);
      listings.slice(0, 3).forEach((l, i) => {
        console.log(`   ${i + 1}. ${l.price ? `${l.price.toLocaleString('fr-FR')} €` : 'N/A'} - ${l.surface || 'N/A'} m² - ${l.price_m2 ? `${l.price_m2.toLocaleString('fr-FR')} €/m²` : 'N/A'}`);
        if (l.address) console.log(`      Adresse: ${l.address}`);
      });
    } else {
      console.log('ℹ️  Aucune donnée Melo (peut être désactivé)');
    }

    // 5. RISQUES
    console.log('\n⚠️  5. RISQUES NATURELS');
    console.log('-'.repeat(80));
    if (profile.risks) {
      if (profile.risks.normalized) {
        console.log(`Inondation: ${profile.risks.normalized.flood_level || 'N/A'}`);
        console.log(`Sismique: ${profile.risks.normalized.seismic_level || 'N/A'}`);
        console.log(`Radon: ${profile.risks.normalized.radon_zone || 'N/A'}`);
      }
    } else {
      console.log('❌ Aucune donnée de risques');
    }

    // 6. ÉNERGIE (DPE)
    console.log('\n⚡ 6. PERFORMANCE ÉNERGÉTIQUE (DPE)');
    console.log('-'.repeat(80));
    if (profile.energy?.dpe) {
      const dpe = profile.energy.dpe;
      console.log(`Classe énergétique: ${dpe.class_energy || 'N/A'}`);
      console.log(`Classe GES: ${dpe.class_ges || 'N/A'}`);
      if (dpe.conso_energy) console.log(`Consommation énergie: ${dpe.conso_energy} kWh/m²/an`);
      if (dpe.emission_ges) console.log(`Émissions GES: ${dpe.emission_ges} kg CO₂/m²/an`);
    } else {
      console.log('❌ Aucune donnée DPE');
    }

    // 7. MARCHÉ DVF
    console.log('\n📈 7. MARCHÉ IMMOBILIER (DVF)');
    console.log('-'.repeat(80));
    if (profile.market?.dvf) {
      const dvf = profile.market.dvf;
      if (dvf.summary) {
        console.log(`Prix/m² médian (1 an): ${dvf.summary.price_m2_median_1y ? `${dvf.summary.price_m2_median_1y.toLocaleString('fr-FR')} €/m²` : 'N/A'}`);
        console.log(`Prix/m² médian (3 ans): ${dvf.summary.price_m2_median_3y ? `${dvf.summary.price_m2_median_3y.toLocaleString('fr-FR')} €/m²` : 'N/A'}`);
        console.log(`Tendance: ${dvf.summary.trend_label || 'N/A'}`);
      }
      if (dvf.transactions && dvf.transactions.length > 0) {
        console.log(`Transactions trouvées: ${dvf.transactions.length}`);
      }
    } else {
      console.log('❌ Aucune donnée DVF');
    }

    // 8. ÉCOLES
    console.log('\n🏫 8. ÉCOLES');
    console.log('-'.repeat(80));
    if (profile.education?.schools && profile.education.schools.length > 0) {
      console.log(`Écoles trouvées: ${profile.education.schools.length}`);
      profile.education.schools.slice(0, 3).forEach((school, i) => {
        console.log(`   ${i + 1}. ${school.name || 'N/A'} - ${school.kind || 'N/A'}${school.distance_m ? ` (${(school.distance_m / 1000).toFixed(1)} km)` : ''}`);
      });
    } else {
      console.log('❌ Aucune école trouvée');
    }

    // 9. COMMODITÉS
    console.log('\n🛒 9. COMMODITÉS');
    console.log('-'.repeat(80));
    if (profile.amenities) {
      if (profile.amenities.supermarkets && profile.amenities.supermarkets.length > 0) {
        console.log(`Supermarchés: ${profile.amenities.supermarkets.length}`);
      }
      if (profile.amenities.transit && profile.amenities.transit.length > 0) {
        console.log(`Transports: ${profile.amenities.transit.length}`);
      }
      if (profile.amenities.parks && profile.amenities.parks.length > 0) {
        console.log(`Parcs: ${profile.amenities.parks.length}`);
      }
    } else {
      console.log('❌ Aucune commodité trouvée');
    }

    // 10. ANALYSE IA
    console.log('\n🤖 10. ANALYSE IA COMPLÈTE');
    console.log('-'.repeat(80));
    if (profile.ai_analysis) {
      const ai = profile.ai_analysis;
      console.log(`Score global: ${ai.score || 'N/A'}/100`);
      if (ai.summary) {
        console.log(`\nSynthèse:`);
        console.log(ai.summary.substring(0, 300) + '...');
      }
      if (ai.strengths && ai.strengths.length > 0) {
        console.log(`\nPoints forts (${ai.strengths.length}):`);
        ai.strengths.slice(0, 5).forEach((s, i) => console.log(`   ${i + 1}. ${s}`));
      }
      if (ai.weaknesses && ai.weaknesses.length > 0) {
        console.log(`\nPoints faibles (${ai.weaknesses.length}):`);
        ai.weaknesses.slice(0, 5).forEach((w, i) => console.log(`   ${i + 1}. ${w}`));
      }
      if (ai.recommendations && ai.recommendations.length > 0) {
        console.log(`\nRecommandations (${ai.recommendations.length}):`);
        ai.recommendations.slice(0, 5).forEach((r, i) => console.log(`   ${i + 1}. ${r}`));
      }
    } else {
      console.log('❌ Aucune analyse IA');
    }

    // 11. RÉSUMÉ DES SOURCES
    console.log('\n📚 11. SOURCES DE DONNÉES UTILISÉES');
    console.log('-'.repeat(80));
    const sources = [];
    if (profile.location) sources.push('📍 Géolocalisation');
    if (profile.risks) sources.push('⚠️  GeoRisques');
    if (profile.energy?.dpe) sources.push('⚡ ADEME DPE');
    if (profile.market?.dvf) sources.push('📈 DVF (Données Fiscales)');
    if (profile.market?.melo) sources.push('🏠 Melo API');
    if (profile.ai_analysis?.market_analysis?.estimated_value_m2) sources.push('💰 Gemini - Marché');
    if (profile.safety?.gemini_crime_data) sources.push('🛡️  Gemini - Criminalité');
    if (profile.education) sources.push('🏫 Écoles');
    if (profile.amenities) sources.push('🛒 Commodités');
    if (profile.ai_analysis) sources.push('🤖 Analyse IA');
    
    sources.forEach((s, i) => console.log(`   ${i + 1}. ${s}`));

    console.log('\n' + '='.repeat(80));
    console.log('✅ RAPPORT COMPLET GÉNÉRÉ AVEC SUCCÈS');
    console.log(`📄 Report ID: ${reportResult.reportId}`);
    console.log(`🔗 URL: http://localhost:3000/report/${reportResult.reportId}`);
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

// Vérifier que le serveur est démarré
console.log('⚠️  IMPORTANT: Assurez-vous que le serveur Next.js est démarré (npm run dev)\n');
console.log('⏳ Démarrage du test dans 2 secondes...\n');
setTimeout(() => {
  testFullReport();
}, 2000);

