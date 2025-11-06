/**
 * Test complet de l'API house-profile avec enrichissement Google Places
 * Teste une vraie adresse pour voir les écoles avec ratings
 */

require('dotenv').config({ path: '.env.local' });

async function testHouseProfile() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ Aucune clé API Google trouvée');
    process.exit(1);
  }
  
  console.log(`✅ Clé API détectée: ${apiKey.substring(0, 10)}...\n`);
  
  // Test avec une adresse réelle
  const testAddress = '6 boulevard d\'indochine 75019 paris';
  
  console.log(`🏠 Test avec l'adresse: ${testAddress}\n`);
  
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const apiUrl = `${baseUrl}/api/house-profile?address=${encodeURIComponent(testAddress)}`;
    
    console.log(`📡 Appel API: ${apiUrl}\n`);
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erreur API:', response.status);
      console.error(errorText);
      process.exit(1);
    }
    
    const data = await response.json();
    
    // Vérifier les écoles
    if (data.education && data.education.schools) {
      const schools = data.education.schools;
      console.log(`✅ ${schools.length} écoles trouvées\n`);
      
      const schoolsWithRating = schools.filter(s => s.rating);
      console.log(`⭐ ${schoolsWithRating.length} écoles avec rating Google\n`);
      
      if (schoolsWithRating.length > 0) {
        console.log('📊 Écoles avec étoiles Google:');
        schoolsWithRating.forEach((school, idx) => {
          const stars = '⭐'.repeat(Math.round(school.rating)) + '☆'.repeat(5 - Math.round(school.rating));
          console.log(`\n${idx + 1}. ${school.name}`);
          console.log(`   ${stars} ${school.rating}/5 (${school.rating_count || 0} avis)`);
          console.log(`   📍 ${school.distance_m ? Math.round(school.distance_m) + 'm' : 'N/A'} de distance`);
          console.log(`   🏷️  ${school.kind} - ${school.public_private || 'N/A'}`);
        });
      } else {
        console.log('⚠️  Aucune école avec rating trouvée');
        console.log('   Cela peut être normal : les écoles publiques ont souvent peu de ratings Google.\n');
        console.log('📋 Écoles trouvées (sans rating):');
        schools.slice(0, 5).forEach((school, idx) => {
          console.log(`   ${idx + 1}. ${school.name} (${school.kind}) - ${school.distance_m ? Math.round(school.distance_m) + 'm' : 'N/A'}`);
        });
      }
    } else {
      console.log('⚠️  Aucune donnée d\'éducation trouvée');
    }
    
    console.log('\n✅ Test terminé !');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('\n💡 Assurez-vous que le serveur Next.js est démarré (npm run dev)');
    process.exit(1);
  }
}

testHouseProfile();




