/**
 * Script de test pour Google Places API - École réelle avec rating
 * Teste avec une vraie école qui devrait avoir un rating
 */

require('dotenv').config({ path: '.env.local' });

async function testRealSchool() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ Aucune clé API trouvée');
    process.exit(1);
  }
  
  console.log(`✅ Utilisation de la clé API: ${apiKey.substring(0, 10)}...\n`);
  
  // Test avec une école connue qui devrait avoir un rating
  const testSchools = [
    {
      name: 'Lycée Henri IV',
      city: 'Paris',
      postcode: '75005',
      gps: { lat: 48.8462, lon: 2.3442 }
    },
    {
      name: 'Collège Stanislas',
      city: 'Paris',
      postcode: '75006',
      gps: { lat: 48.8477, lon: 2.3326 }
    },
    {
      name: 'École élémentaire',
      city: 'Paris',
      postcode: '75001',
      gps: { lat: 48.8566, lon: 2.3522 }
    }
  ];
  
  for (const testSchool of testSchools) {
    console.log(`📚 Test avec: ${testSchool.name} (${testSchool.city})`);
    
    try {
      const searchQuery = `${testSchool.name} ${testSchool.city} ${testSchool.postcode}`.trim();
      const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${apiKey}&language=fr`;
      
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();
      
      if (searchData.status !== 'OK') {
        console.log(`  ❌ Erreur: ${searchData.status} - ${searchData.error_message || ''}`);
        continue;
      }
      
      if (searchData.results.length === 0) {
        console.log('  ⚠️  Aucun résultat trouvé');
        continue;
      }
      
      // Trouver le meilleur match
      let bestMatch = searchData.results[0];
      let minDistance = Infinity;
      
      for (const result of searchData.results) {
        if (result.geometry && result.geometry.location) {
          const distance = Math.sqrt(
            Math.pow(result.geometry.location.lat - testSchool.gps.lat, 2) +
            Math.pow(result.geometry.location.lng - testSchool.gps.lon, 2)
          ) * 111000; // Approximation en mètres
          
          if (distance < minDistance) {
            minDistance = distance;
            bestMatch = result;
          }
        }
      }
      
      console.log(`  ✅ Trouvé: ${bestMatch.name}`);
      console.log(`  📍 Distance: ${Math.round(minDistance)}m`);
      
      if (bestMatch.rating) {
        const stars = '⭐'.repeat(Math.round(bestMatch.rating)) + '☆'.repeat(5 - Math.round(bestMatch.rating));
        console.log(`  ⭐ Rating: ${stars} ${bestMatch.rating}/5 (${bestMatch.user_ratings_total || 0} avis)`);
      } else {
        console.log('  ⚠️  Pas de rating disponible');
      }
      
      // Récupérer les détails si on a un place_id
      if (bestMatch.place_id && bestMatch.rating) {
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${bestMatch.place_id}&fields=rating,user_ratings_total,formatted_phone_number,website&key=${apiKey}&language=fr`;
        
        const detailsResponse = await fetch(detailsUrl);
        const detailsData = await detailsResponse.json();
        
        if (detailsData.status === 'OK' && detailsData.result) {
          console.log(`  📞 Téléphone: ${detailsData.result.formatted_phone_number || 'N/A'}`);
          console.log(`  🌐 Site web: ${detailsData.result.website || 'N/A'}`);
        }
      }
      
      console.log('');
    } catch (error) {
      console.error(`  ❌ Erreur: ${error.message}\n`);
    }
  }
  
  console.log('✅ Test terminé !');
}

testRealSchool();




