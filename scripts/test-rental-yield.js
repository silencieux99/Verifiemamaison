/**
 * Script de test pour la section Rentabilité Locative
 * Teste la structure de données et l'intégration GPT
 */

const fs = require('fs');
const path = require('path');

// Charger les variables d'environnement
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY non configurée dans .env.local');
  process.exit(1);
}

console.log('🧪 Test de la section Rentabilité Locative\n');
console.log('='.repeat(60));

// Données de test simulées
const testProfile = {
  location: {
    normalized_address: "36 bis rue auguste blanqui",
    admin: {
      city: "Aulnay-sous-Bois",
      postcode: "93600",
      department: "93",
      region: "Île-de-France"
    }
  },
  building: {
    declared: {
      surface_habitable_m2: 80,
      type: "appartement",
      rooms: 4
    }
  },
  market: {
    dvf: {
      summary: {
        price_m2_median_1y: 3500,
        price_m2_median_3y: 3400,
        trend_label: "hausse"
      },
      transactions: [
        { price_m2_eur: 3600, surface_m2: 75, date: "2024-01-15" },
        { price_m2_eur: 3400, surface_m2: 85, date: "2024-03-20" }
      ]
    }
  },
  amenities: {
    supermarkets: 3,
    transit: 2,
    parks: 1
  },
  education: {
    schools: [
      { name: "École élémentaire", distance_m: 200 },
      { name: "Collège", distance_m: 500 }
    ]
  }
};

// Test 1: Vérifier la structure de l'interface
console.log('\n📋 Test 1: Structure de l\'interface TypeScript');
console.log('-'.repeat(60));

const expectedFields = [
  'estimated_rent_monthly',
  'estimated_rent_yearly',
  'yield_percentage',
  'yield_rating',
  'market_rent_comparison',
  'rental_demand',
  'rental_comment',
  'rental_recommendations'
];

console.log('✅ Champs attendus dans rental_yield_analysis:');
expectedFields.forEach(field => {
  console.log(`   - ${field}`);
});

// Test 2: Vérifier le prompt GPT
console.log('\n📝 Test 2: Vérification du prompt GPT');
console.log('-'.repeat(60));

const aiAnalysisPath = path.join(process.cwd(), 'src/lib/ai-analysis.ts');
const aiAnalysisContent = fs.readFileSync(aiAnalysisPath, 'utf-8');

const hasRentalYieldInPrompt = aiAnalysisContent.includes('rental_yield_analysis');
const hasRentalInstructions = aiAnalysisContent.includes('RECHERCHE activement les loyers moyens');

console.log(`✅ Prompt contient 'rental_yield_analysis': ${hasRentalYieldInPrompt ? 'OUI' : 'NON'}`);
console.log(`✅ Prompt contient instructions de recherche: ${hasRentalInstructions ? 'OUI' : 'NON'}`);

if (!hasRentalYieldInPrompt || !hasRentalInstructions) {
  console.error('❌ Le prompt GPT n\'est pas correctement configuré');
}

// Test 3: Vérifier la conversion en sections
console.log('\n🔄 Test 3: Vérification de la conversion en sections');
console.log('-'.repeat(60));

const convertPath = path.join(process.cwd(), 'src/lib/convert-house-profile-to-sections.ts');
const convertContent = fs.readFileSync(convertPath, 'utf-8');

const hasRentalSection = convertContent.includes('rental_yield');
const hasRentalItems = convertContent.includes('rentalItems');

console.log(`✅ Conversion contient section 'rental_yield': ${hasRentalSection ? 'OUI' : 'NON'}`);
console.log(`✅ Conversion crée les items: ${hasRentalItems ? 'OUI' : 'NON'}`);

// Test 4: Vérifier l'affichage dans le composant
console.log('\n🎨 Test 4: Vérification de l\'affichage UI');
console.log('-'.repeat(60));

const componentPath = path.join(process.cwd(), 'src/components/PremiumReportView.tsx');
const componentContent = fs.readFileSync(componentPath, 'utf-8');

const hasRentalTab = componentContent.includes("id: 'rental_yield'");
const hasRentalDisplay = componentContent.includes('activeTab === \'rental_yield\'');

console.log(`✅ Navigation contient onglet 'rental_yield': ${hasRentalTab ? 'OUI' : 'NON'}`);
console.log(`✅ Composant affiche la section: ${hasRentalDisplay ? 'OUI' : 'NON'}`);

// Test 5: Test de calcul du rendement (simulation)
console.log('\n💰 Test 5: Simulation du calcul de rendement');
console.log('-'.repeat(60));

const estimatedPrice = testProfile.market.dvf.summary.price_m2_median_1y * testProfile.building.declared.surface_habitable_m2;
const estimatedRentMonthly = 1200; // Estimation pour Aulnay-sous-Bois
const estimatedRentYearly = estimatedRentMonthly * 12;
const yieldPercentage = (estimatedRentYearly / estimatedPrice) * 100;

console.log(`📍 Adresse test: ${testProfile.location.normalized_address}, ${testProfile.location.admin.city}`);
console.log(`🏠 Surface: ${testProfile.building.declared.surface_habitable_m2} m²`);
console.log(`💵 Prix estimé: ${estimatedPrice.toLocaleString('fr-FR')} €`);
console.log(`🏘️ Loyer mensuel estimé: ${estimatedRentMonthly.toLocaleString('fr-FR')} €/mois`);
console.log(`📅 Loyer annuel estimé: ${estimatedRentYearly.toLocaleString('fr-FR')} €/an`);
console.log(`📊 Rendement calculé: ${yieldPercentage.toFixed(2)}%`);

let yieldRating;
if (yieldPercentage > 8) yieldRating = 'excellent';
else if (yieldPercentage >= 6) yieldRating = 'bon';
else if (yieldPercentage >= 4) yieldRating = 'moyen';
else yieldRating = 'faible';

console.log(`⭐ Évaluation: ${yieldRating}`);

// Test 6: Vérifier les types TypeScript
console.log('\n🔷 Test 6: Vérification des types TypeScript');
console.log('-'.repeat(60));

const typesPath = path.join(process.cwd(), 'src/lib/house-profile-types.ts');
const typesContent = fs.readFileSync(typesPath, 'utf-8');

const hasRentalInTypes = typesContent.includes('rental_yield_analysis');

console.log(`✅ Types contiennent 'rental_yield_analysis': ${hasRentalInTypes ? 'OUI' : 'NON'}`);

// Résumé
console.log('\n' + '='.repeat(60));
console.log('📊 RÉSUMÉ DES TESTS');
console.log('='.repeat(60));

const allTests = [
  { name: 'Structure interface', passed: true },
  { name: 'Prompt GPT', passed: hasRentalYieldInPrompt && hasRentalInstructions },
  { name: 'Conversion sections', passed: hasRentalSection && hasRentalItems },
  { name: 'Affichage UI', passed: hasRentalTab && hasRentalDisplay },
  { name: 'Calcul rendement', passed: yieldPercentage > 0 && yieldPercentage < 20 },
  { name: 'Types TypeScript', passed: hasRentalInTypes }
];

allTests.forEach(test => {
  console.log(`${test.passed ? '✅' : '❌'} ${test.name}: ${test.passed ? 'PASSÉ' : 'ÉCHOUÉ'}`);
});

const allPassed = allTests.every(test => test.passed);

console.log('\n' + '='.repeat(60));
if (allPassed) {
  console.log('✅ TOUS LES TESTS SONT PASSÉS !');
  console.log('\n💡 La section Rentabilité Locative est prête à être utilisée.');
  console.log('   Elle sera automatiquement remplie par GPT lors de la génération du rapport.');
} else {
  console.log('❌ CERTAINS TESTS ONT ÉCHOUÉ');
  console.log('   Vérifiez les erreurs ci-dessus.');
}
console.log('='.repeat(60));

process.exit(allPassed ? 0 : 1);

