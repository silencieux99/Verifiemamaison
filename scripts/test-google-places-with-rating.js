/**
 * Script de test pour Google Places API - Recherche avec rating
 * Teste avec différentes requêtes pour trouver des écoles avec rating
 */

require('dotenv').config({ path: '.env.local' });

async function testWithRating() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ Aucune clé API trouvée');
    process.exit(1);
  }
  
  console.log(`✅ Utilisation de la clé API: ${apiKey.substring(0, 10)}...\n`);
  
  // Test avec des établissements qui ont plus de chances d'avoir un rating
  const testQueries = [
    'Lycée privé Paris',
    'Collège privé Paris',
    'École privée Paris',
    'École maternelle Paris 75001',
    'École élémentaire publique Paris'
  ];
  
  for (const query of testQueries) {
    console.log(`🔍 Recherche: "${query}"`);
    
    try {
      const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}&language=fr&type=school`;
      
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();
      
      if (searchData.status !== 'OK') {
        console.log(`  ❌ Erreur: ${searchData.status} - ${searchData.error_message || ''}\n`);
        continue;
      }
      
      if (searchData.results.length === 0) {
        console.log('  ⚠️  Aucun résultat trouvé\n');
        continue;
      }
      
      // Filtrer les résultats avec rating
      const withRating = searchData.results.filter(r => r.rating);
      
      if (withRating.length > 0) {
        console.log(`  ✅ ${withRating.length}/${searchData.results.length} résultats avec rating`);
        
        // Afficher le premier avec rating
        const best = withRating[0];
        const stars = '⭐'.repeat(Math.round(best.rating)) + '☆'.repeat(5 - Math.round(best.rating));
        console.log(`  📊 ${best.name}`);
        console.log(`  ⭐ ${stars} ${best.rating}/5 (${best.user_ratings_total || 0} avis)`);
        console.log(`  📍 ${best.formatted_address || ''}`);
        
        // Récupérer les détails
        if (best.place_id) {
          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${best.place_id}&fields=rating,user_ratings_total,formatted_phone_number,website,types&key=${apiKey}&language=fr`;
          
          const detailsResponse = await fetch(detailsUrl);
          const detailsData = await detailsResponse.json();
          
          if (detailsData.status === 'OK' && detailsData.result) {
            console.log(`  📞 Téléphone: ${detailsData.result.formatted_phone_number || 'N/A'}`);
            console.log(`  🌐 Site web: ${detailsData.result.website || 'N/A'}`);
            console.log(`  🏷️  Types: ${detailsData.result.types?.join(', ') || 'N/A'}`);
          }
        }
      } else {
        console.log(`  ⚠️  ${searchData.results.length} résultats trouvés mais aucun avec rating`);
        console.log(`  📊 Premier résultat: ${searchData.results[0].name}`);
        console.log(`  📍 ${searchData.results[0].formatted_address || ''}`);
      }
      
      console.log('');
    } catch (error) {
      console.error(`  ❌ Erreur: ${error.message}\n`);
    }
  }
  
  console.log('✅ Test terminé !');
  console.log('\n💡 Note: Les écoles publiques en France ont souvent peu ou pas de ratings Google.');
  console.log('   Les établissements privés ont généralement plus de ratings.');
}

testWithRating();




