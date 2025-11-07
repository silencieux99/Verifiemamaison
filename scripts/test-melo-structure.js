/**
 * Test pour voir la structure complète des données retournées
 */

require('dotenv').config({ path: '.env.local' });

const testStructure = async () => {
  const environment = process.env.MELO_ENVIRONMENT || 'production';
  const baseUrl = environment === 'sandbox' 
    ? 'https://preprod-api.notif.immo'
    : 'https://api.notif.immo';
  const apiKey = process.env.MELO_API_KEY;

  const url = `${baseUrl}/documents/properties?lat=48.8566&lon=2.3522&radius=2&limit=1`;
  
  const response = await fetch(url, {
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
  });

  if (response.ok) {
    const data = await response.json();
    const property = data['hydra:member']?.[0];
    
    if (property) {
      console.log('📦 Structure complète d\'une propriété:\n');
      console.log(JSON.stringify(property, null, 2));
    }
  }
};

testStructure().catch(console.error);

