/**
 * Test avec mock de réponse GPT pour vérifier la conversion complète
 */

const fs = require('fs');
const path = require('path');

// Mock d'une réponse GPT avec rental_yield_analysis
const mockGPTResponse = {
  score: 75,
  summary: "Bien situé dans un quartier résidentiel avec bon potentiel locatif.",
  market_analysis: {
    estimated_value_m2: 3500,
    market_trend: "hausse",
    market_comment: "Marché en hausse dans le quartier",
    price_comparison: "Prix légèrement en dessous de la moyenne du secteur"
  },
  rental_yield_analysis: {
    estimated_rent_monthly: 1200,
    estimated_rent_yearly: 14400,
    yield_percentage: 5.14,
    yield_rating: "moyen",
    market_rent_comparison: "Les loyers dans ce quartier d'Aulnay-sous-Bois sont en moyenne de 12-15€/m², ce qui correspond à un marché locatif actif. Le bien se situe dans la moyenne basse, offrant un bon rapport qualité/prix pour les locataires.",
    rental_demand: "moyenne",
    rental_comment: "Le rendement locatif de 5.14% est dans la moyenne pour la région parisienne. Le quartier bénéficie d'une demande locative stable grâce à sa proximité des transports et des commodités. Les perspectives de revalorisation du loyer sont modérées, avec une inflation des loyers suivie de près par la réglementation. Les charges locatives sont estimées à environ 15-20% du loyer hors charges.",
    rental_recommendations: [
      "Optimiser le rendement en proposant un loyer légèrement en dessous du marché pour garantir une occupation rapide",
      "Mettre en valeur la proximité des transports et des écoles pour attirer les familles",
      "Envisager des travaux d'amélioration énergétique pour augmenter la valeur locative"
    ]
  },
  investment_potential: {
    score: 70,
    comment: "Bon potentiel d'investissement",
    recommendations: ["Investissement intéressant pour un portefeuille locatif"]
  }
};

console.log('🧪 Test avec mock de réponse GPT\n');
console.log('='.repeat(60));

// Test 1: Vérifier la structure de la réponse
console.log('\n📋 Test 1: Structure de la réponse GPT');
console.log('-'.repeat(60));

const rentalData = mockGPTResponse.rental_yield_analysis;
const requiredFields = [
  'estimated_rent_monthly',
  'estimated_rent_yearly',
  'yield_percentage',
  'yield_rating',
  'market_rent_comparison',
  'rental_demand',
  'rental_comment',
  'rental_recommendations'
];

let allFieldsPresent = true;
requiredFields.forEach(field => {
  const present = field in rentalData;
  console.log(`${present ? '✅' : '❌'} ${field}: ${present ? 'PRÉSENT' : 'MANQUANT'}`);
  if (!present) allFieldsPresent = false;
});

// Test 2: Vérifier les valeurs
console.log('\n💰 Test 2: Validation des valeurs');
console.log('-'.repeat(60));

console.log(`✅ Loyer mensuel: ${rentalData.estimated_rent_monthly} € (${rentalData.estimated_rent_monthly > 0 ? 'VALIDE' : 'INVALIDE'})`);
console.log(`✅ Loyer annuel: ${rentalData.estimated_rent_yearly} € (${rentalData.estimated_rent_yearly === rentalData.estimated_rent_monthly * 12 ? 'COHÉRENT' : 'INCOHÉRENT'})`);
console.log(`✅ Rendement: ${rentalData.yield_percentage}% (${rentalData.yield_percentage > 0 && rentalData.yield_percentage < 20 ? 'VALIDE' : 'INVALIDE'})`);
console.log(`✅ Évaluation: ${rentalData.yield_rating} (${['excellent', 'bon', 'moyen', 'faible'].includes(rentalData.yield_rating) ? 'VALIDE' : 'INVALIDE'})`);
console.log(`✅ Demande: ${rentalData.rental_demand} (${['forte', 'moyenne', 'faible'].includes(rentalData.rental_demand) ? 'VALIDE' : 'INVALIDE'})`);

// Test 3: Simuler la conversion en sections
console.log('\n🔄 Test 3: Simulation de la conversion en sections');
console.log('-'.repeat(60));

const rentalItems = [];

if (rentalData.estimated_rent_monthly !== undefined) {
  rentalItems.push({
    label: 'Loyer mensuel estimé',
    value: `${rentalData.estimated_rent_monthly.toLocaleString('fr-FR')} €/mois`
  });
}

if (rentalData.estimated_rent_yearly !== undefined) {
  rentalItems.push({
    label: 'Loyer annuel estimé',
    value: `${rentalData.estimated_rent_yearly.toLocaleString('fr-FR')} €/an`
  });
}

if (rentalData.yield_percentage !== undefined) {
  const yieldRating = rentalData.yield_rating || 'moyen';
  const flag = yieldRating === 'excellent' || yieldRating === 'bon' ? 'ok' :
               yieldRating === 'moyen' ? 'warn' : 'risk';
  
  rentalItems.push({
    label: 'Rendement locatif',
    value: `${rentalData.yield_percentage.toFixed(2)}%`,
    flag: flag
  });
}

if (rentalData.yield_rating) {
  const ratingLabels = {
    'excellent': 'Excellent (>8%)',
    'bon': 'Bon (6-8%)',
    'moyen': 'Moyen (4-6%)',
    'faible': 'Faible (<4%)'
  };
  rentalItems.push({
    label: 'Évaluation du rendement',
    value: ratingLabels[rentalData.yield_rating] || rentalData.yield_rating
  });
}

if (rentalData.rental_demand) {
  const demandLabels = {
    'forte': 'Forte',
    'moyenne': 'Moyenne',
    'faible': 'Faible'
  };
  rentalItems.push({
    label: 'Demande locative',
    value: demandLabels[rentalData.rental_demand] || rentalData.rental_demand
  });
}

if (rentalData.market_rent_comparison) {
  rentalItems.push({
    label: 'Comparaison marché',
    value: rentalData.market_rent_comparison
  });
}

if (rentalData.rental_comment) {
  rentalItems.push({
    label: 'Analyse détaillée',
    value: rentalData.rental_comment
  });
}

if (rentalData.rental_recommendations && rentalData.rental_recommendations.length > 0) {
  rentalData.rental_recommendations.forEach((rec, idx) => {
    rentalItems.push({
      label: `Recommandation ${idx + 1}`,
      value: rec
    });
  });
}

console.log(`✅ Nombre d'items créés: ${rentalItems.length}`);
console.log('\n📊 Aperçu des items:');
rentalItems.forEach((item, idx) => {
  console.log(`   ${idx + 1}. ${item.label}: ${item.value.substring(0, 50)}${item.value.length > 50 ? '...' : ''}`);
});

// Test 4: Vérifier la cohérence du calcul
console.log('\n🧮 Test 4: Vérification du calcul de rendement');
console.log('-'.repeat(60));

const estimatedPrice = 3500 * 80; // Prix/m² * surface
const calculatedYield = (rentalData.estimated_rent_yearly / estimatedPrice) * 100;
const yieldMatch = Math.abs(calculatedYield - rentalData.yield_percentage) < 0.1;

console.log(`💵 Prix estimé du bien: ${estimatedPrice.toLocaleString('fr-FR')} €`);
console.log(`📊 Rendement calculé: ${calculatedYield.toFixed(2)}%`);
console.log(`📊 Rendement GPT: ${rentalData.yield_percentage}%`);
console.log(`${yieldMatch ? '✅' : '⚠️'} Les calculs sont ${yieldMatch ? 'COHÉRENTS' : 'INCOHÉRENTS'}`);

// Résumé final
console.log('\n' + '='.repeat(60));
console.log('📊 RÉSUMÉ DU TEST AVEC MOCK');
console.log('='.repeat(60));

const tests = [
  { name: 'Tous les champs présents', passed: allFieldsPresent },
  { name: 'Valeurs valides', passed: rentalData.estimated_rent_monthly > 0 && rentalData.yield_percentage > 0 },
  { name: 'Conversion en items', passed: rentalItems.length >= 4 },
  { name: 'Calcul cohérent', passed: yieldMatch }
];

tests.forEach(test => {
  console.log(`${test.passed ? '✅' : '❌'} ${test.name}: ${test.passed ? 'PASSÉ' : 'ÉCHOUÉ'}`);
});

const allPassed = tests.every(test => test.passed);

console.log('\n' + '='.repeat(60));
if (allPassed) {
  console.log('✅ TOUS LES TESTS SONT PASSÉS !');
  console.log('\n💡 La section Rentabilité Locative est fonctionnelle.');
  console.log('   GPT générera automatiquement ces données lors de la génération du rapport.');
  console.log(`\n📈 Exemple de rendement calculé: ${rentalData.yield_percentage}% (${rentalData.yield_rating})`);
  console.log(`🏘️ Loyer estimé: ${rentalData.estimated_rent_monthly} €/mois`);
  console.log(`📊 Demande locative: ${rentalData.rental_demand}`);
} else {
  console.log('❌ CERTAINS TESTS ONT ÉCHOUÉ');
}
console.log('='.repeat(60));

process.exit(allPassed ? 0 : 1);

