/**
 * Script de test pour Google Places API - Écoles
 * Teste l'enrichissement des écoles avec les notes Google
 */

require('dotenv').config({ path: '.env.local' });

async function testGooglePlacesSchools() {
  // Vérifier les clés API disponibles
  const googlePlacesKey = process.env.GOOGLE_PLACES_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const googleKey = process.env.GOOGLE_API_KEY;
  
  console.log('🔑 Clés API disponibles:');
  console.log('  - GOOGLE_PLACES_API_KEY:', googlePlacesKey ? '✅ Configurée' : '❌ Non configurée');
  console.log('  - GEMINI_API_KEY:', geminiKey ? '✅ Configurée' : '❌ Non configurée');
  console.log('  - GOOGLE_API_KEY:', googleKey ? '✅ Configurée' : '❌ Non configurée');
  
  // Utiliser la première clé disponible
  const apiKey = googlePlacesKey || geminiKey || googleKey;
  
  if (!apiKey) {
    console.error('❌ Aucune clé API Google trouvée dans .env.local');
    console.error('   Veuillez ajouter GOOGLE_PLACES_API_KEY, GEMINI_API_KEY ou GOOGLE_API_KEY');
    process.exit(1);
  }
  
  console.log(`\n✅ Utilisation de la clé API: ${apiKey.substring(0, 10)}...`);
  
  // Test avec une école réelle (exemple: École à Paris)
  const testSchool = {
    name: 'École élémentaire',
    city: 'Paris',
    postcode: '75001',
    gps: { lat: 48.8566, lon: 2.3522 }
  };
  
  console.log('\n📚 Test avec une école:');
  console.log('  Nom:', testSchool.name);
  console.log('  Ville:', testSchool.city, testSchool.postcode);
  console.log('  GPS:', testSchool.gps.lat, testSchool.gps.lon);
  
  try {
    // Recherche textuelle
    const searchQuery = `${testSchool.name} ${testSchool.city} ${testSchool.postcode}`.trim();
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${apiKey}&language=fr`;
    
    console.log('\n🔍 Recherche Google Places...');
    console.log('  URL:', searchUrl.replace(apiKey, '***'));
    
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    
    if (searchData.status !== 'OK') {
      console.error('❌ Erreur Google Places:', searchData.status, searchData.error_message);
      process.exit(1);
    }
    
    console.log(`\n✅ ${searchData.results.length} résultats trouvés`);
    
    if (searchData.results.length > 0) {
      const firstResult = searchData.results[0];
      console.log('\n📊 Premier résultat:');
      console.log('  Nom:', firstResult.name);
      console.log('  Adresse:', firstResult.formatted_address);
      console.log('  Rating:', firstResult.rating || 'N/A');
      console.log('  Nombre d\'avis:', firstResult.user_ratings_total || 'N/A');
      
      if (firstResult.place_id) {
        // Récupérer les détails
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${firstResult.place_id}&fields=rating,user_ratings_total,formatted_phone_number,website&key=${apiKey}&language=fr`;
        
        console.log('\n🔍 Récupération des détails...');
        const detailsResponse = await fetch(detailsUrl);
        const detailsData = await detailsResponse.json();
        
        if (detailsData.status === 'OK' && detailsData.result) {
          console.log('\n✅ Détails complets:');
          console.log('  Rating:', detailsData.result.rating || 'N/A');
          console.log('  Nombre d\'avis:', detailsData.result.user_ratings_total || 'N/A');
          console.log('  Téléphone:', detailsData.result.formatted_phone_number || 'N/A');
          console.log('  Site web:', detailsData.result.website || 'N/A');
          
          // Afficher les étoiles
          if (detailsData.result.rating) {
            const rating = Math.round(detailsData.result.rating);
            const stars = '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
            console.log('\n⭐ Étoiles:', stars, `(${detailsData.result.rating}/5)`);
          }
        } else {
          console.error('❌ Erreur détails:', detailsData.status, detailsData.error_message);
        }
      }
    }
    
    console.log('\n✅ Test réussi !');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

testGooglePlacesSchools();





