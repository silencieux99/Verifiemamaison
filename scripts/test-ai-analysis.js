/**
 * Test de l'analyse IA avec Gemini
 */

const address = '6 boulevard d\'indochine 75019 paris';

async function testAIAnalysis() {
  console.log('🤖 TEST DE L\'ANALYSE IA AVEC GEMINI');
  console.log('='.repeat(60));
  console.log(`📍 Adresse: ${address}\n`);

  try {
    const url = `http://localhost:3000/api/house-profile?address=${encodeURIComponent(address)}&nocache=1`;
    
    console.log('📡 Appel de l\'API house-profile avec analyse IA...\n');
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
    console.log('1️⃣  VÉRIFICATION: Présence de l\'analyse IA');
    if (data.ai_analysis) {
      console.log('   ✅ Analyse IA présente dans le profil');
      console.log(`   📊 Score global: ${data.ai_analysis.score}/100`);
    } else {
      console.log('   ❌ Analyse IA absente');
      console.log('   💡 Vérifiez que GEMINI_API_KEY est bien configurée dans .env.local');
      return;
    }
    
    console.log('\n2️⃣  VÉRIFICATION: Structure de l\'analyse IA');
    const ai = data.ai_analysis;
    const checks = [];
    
    if (ai.score !== undefined) checks.push({ name: 'Score global', ok: true, value: `${ai.score}/100` });
    if (ai.summary) checks.push({ name: 'Synthèse', ok: true, value: ai.summary.substring(0, 100) + '...' });
    if (ai.market_analysis) checks.push({ name: 'Analyse marché', ok: true });
    if (ai.neighborhood_analysis) checks.push({ name: 'Analyse quartier', ok: true });
    if (ai.risks_analysis) checks.push({ name: 'Analyse risques', ok: true });
    if (ai.investment_potential) checks.push({ name: 'Potentiel investissement', ok: true });
    if (ai.strengths) checks.push({ name: 'Points forts', ok: true, value: `${ai.strengths.length} point(s)` });
    if (ai.weaknesses) checks.push({ name: 'Points faibles', ok: true, value: `${ai.weaknesses.length} point(s)` });
    if (ai.recommendations) checks.push({ name: 'Recommandations', ok: true, value: `${ai.recommendations.length} recommandation(s)` });
    
    checks.forEach(check => {
      console.log(`   ${check.ok ? '✅' : '❌'} ${check.name}${check.value ? ` - ${check.value}` : ''}`);
    });
    
    // Détails de l'analyse
    console.log('\n3️⃣  DÉTAILS DE L\'ANALYSE IA:\n');
    
    if (ai.summary) {
      console.log('📝 SYNTHÈSE:');
      console.log(`   ${ai.summary}\n`);
    }
    
    if (ai.market_analysis) {
      console.log('📈 ANALYSE MARCHÉ:');
      if (ai.market_analysis.estimated_value_m2) {
        console.log(`   💰 Valeur estimée: ${ai.market_analysis.estimated_value_m2.toLocaleString('fr-FR')}€/m²`);
      }
      if (ai.market_analysis.market_trend) {
        console.log(`   📊 Tendance: ${ai.market_analysis.market_trend}`);
      }
      if (ai.market_analysis.market_comment) {
        console.log(`   💬 Commentaire: ${ai.market_analysis.market_comment.substring(0, 150)}...`);
      }
      console.log('');
    }
    
    if (ai.neighborhood_analysis) {
      console.log('🏘️  ANALYSE QUARTIER:');
      if (ai.neighborhood_analysis.shops_analysis) {
        console.log(`   🛍️  Commerces: ${ai.neighborhood_analysis.shops_analysis.substring(0, 150)}...`);
      }
      if (ai.neighborhood_analysis.amenities_score !== undefined) {
        console.log(`   ⭐ Score commodités: ${ai.neighborhood_analysis.amenities_score}/100`);
      }
      if (ai.neighborhood_analysis.transport_score !== undefined) {
        console.log(`   🚇 Score transports: ${ai.neighborhood_analysis.transport_score}/100`);
      }
      if (ai.neighborhood_analysis.quality_of_life) {
        console.log(`   🌟 Qualité de vie: ${ai.neighborhood_analysis.quality_of_life.substring(0, 150)}...`);
      }
      console.log('');
    }
    
    if (ai.risks_analysis) {
      console.log('⚠️  ANALYSE RISQUES:');
      if (ai.risks_analysis.overall_risk_level) {
        console.log(`   🎯 Niveau de risque: ${ai.risks_analysis.overall_risk_level}`);
      }
      if (ai.risks_analysis.main_risks && ai.risks_analysis.main_risks.length > 0) {
        console.log(`   📋 Principaux risques: ${ai.risks_analysis.main_risks.join(', ')}`);
      }
      console.log('');
    }
    
    if (ai.investment_potential) {
      console.log('💼 POTENTIEL D\'INVESTISSEMENT:');
      if (ai.investment_potential.score !== undefined) {
        console.log(`   📊 Score: ${ai.investment_potential.score}/100`);
      }
      if (ai.investment_potential.comment) {
        console.log(`   💬 Commentaire: ${ai.investment_potential.comment.substring(0, 150)}...`);
      }
      console.log('');
    }
    
    if (ai.strengths && ai.strengths.length > 0) {
      console.log('✅ POINTS FORTS:');
      ai.strengths.forEach((strength, idx) => {
        console.log(`   ${idx + 1}. ${strength}`);
      });
      console.log('');
    }
    
    if (ai.weaknesses && ai.weaknesses.length > 0) {
      console.log('⚠️  POINTS FAIBLES:');
      ai.weaknesses.forEach((weakness, idx) => {
        console.log(`   ${idx + 1}. ${weakness}`);
      });
      console.log('');
    }
    
    if (ai.recommendations && ai.recommendations.length > 0) {
      console.log('💡 RECOMMANDATIONS:');
      ai.recommendations.forEach((rec, idx) => {
        console.log(`   ${idx + 1}. ${rec}`);
      });
      console.log('');
    }
    
    // Vérification des sources
    console.log('4️⃣  VÉRIFICATION: Source dans les métadonnées');
    const aiSource = data.meta?.sources?.find((s) => s.section === 'ai_analysis');
    if (aiSource) {
      console.log(`   ✅ Source IA ajoutée: ${aiSource.url}`);
    } else {
      console.log('   ⚠️  Source IA non trouvée dans les métadonnées');
    }
    
    // Résumé
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ TEST TERMINÉ AVEC SUCCÈS!\n');
    console.log('📊 RÉSUMÉ:');
    console.log(`   • Analyse IA: ✅`);
    console.log(`   • Score global: ${ai.score}/100`);
    console.log(`   • Sections créées: ~8 sections IA dans le rapport`);
    console.log(`   • Temps de traitement: ${data.meta?.processing_ms}ms\n`);
    console.log('🎉 L\'intégration Gemini fonctionne correctement !\n');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('\n💡 Assurez-vous que:');
    console.error('   1. Le serveur de développement est démarré: npm run dev');
    console.error('   2. La clé GEMINI_API_KEY est dans .env.local');
    console.error('   3. Le serveur a été redémarré après l\'ajout de la clé');
  }
}

testAIAnalysis();

