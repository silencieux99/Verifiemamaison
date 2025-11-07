/**
 * Script de test pour Gemini Crime Search
 * Teste la recherche de données de criminalité en temps réel via Google Search
 */

require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('❌ GEMINI_API_KEY non configurée dans .env.local');
  process.exit(1);
}

const address = process.argv[2] || '11 rue barbes';
const city = process.argv[3] || 'Aulnay-sous-Bois';
const postcode = process.argv[4] || '93600';

console.log('🔍 Test Gemini Crime Search');
console.log(`📍 Adresse: ${address}, ${city} ${postcode}\n`);

async function testGeminiCrimeSearch() {
  try {
    const { searchCrimeDataWithGemini } = require('../src/lib/gemini-web-search');
    
    console.log('📡 Appel Gemini API...');
    console.log('⏳ Recherche en cours sur Google...\n');

    const result = await searchCrimeDataWithGemini(address, city, postcode);
    
    if (!result) {
      console.log('❌ Aucune donnée trouvée');
      return;
    }

    console.log('✅ Résultats de la recherche:\n');
    console.log('='.repeat(60));
    console.log(`🛡️  Score sécurité: ${result.safety_score !== undefined ? `${result.safety_score}/100` : 'Non trouvé'}`);
    console.log(`⚠️  Taux criminalité: ${result.crime_rate ? result.crime_rate.charAt(0).toUpperCase() + result.crime_rate.slice(1) : 'Non trouvé'}`);
    console.log(`📈 Tendance: ${result.crime_trend || 'Non trouvée'}`);
    
    if (result.main_crime_types && result.main_crime_types.length > 0) {
      console.log(`\n🔴 Types de crimes principaux:`);
      result.main_crime_types.forEach((type, i) => {
        console.log(`   ${i + 1}. ${type}`);
      });
    }
    
    if (result.recent_crimes && result.recent_crimes.length > 0) {
      console.log(`\n📋 Crimes récents trouvés: ${result.recent_crimes.length}`);
      result.recent_crimes.slice(0, 3).forEach((crime, i) => {
        console.log(`   ${i + 1}. ${crime.type}${crime.date ? ` (${crime.date})` : ''}`);
        if (crime.description) {
          console.log(`      ${crime.description.substring(0, 80)}...`);
        }
      });
    }
    
    if (result.safety_comment) {
      console.log(`\n💬 Commentaire sécurité:`);
      console.log(result.safety_comment);
    }
    
    if (result.comparison) {
      console.log(`\n📊 Comparaison:`);
      console.log(result.comparison);
    }
    
    if (result.sources && result.sources.length > 0) {
      console.log(`\n📚 Sources:`);
      result.sources.forEach((source, i) => {
        console.log(`   ${i + 1}. ${source}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Test réussi !\n');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

testGeminiCrimeSearch();

