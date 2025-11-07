/**
 * Test simple de la clé API Gemini
 */

require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('❌ GEMINI_API_KEY non trouvée dans .env.local');
  process.exit(1);
}

console.log('🔍 Test de la clé API Gemini');
console.log(`🔑 Clé: ${apiKey.substring(0, 15)}...\n`);

async function testKey() {
  try {
    // Test simple avec gemini-2.0-flash-lite
    const modelName = 'gemini-2.0-flash-lite';
    
    console.log(`📡 Test avec modèle: ${modelName}...\n`);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: 'Dis-moi bonjour en une phrase.',
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 100,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erreur ${response.status}:`);
      try {
        const error = JSON.parse(errorText);
        console.error(`   Message: ${error.error?.message || errorText}`);
        if (error.error?.status === 'INVALID_ARGUMENT' && error.error?.message?.includes('expired')) {
          console.error('\n💡 La clé API est expirée. Vous devez:');
          console.error('   1. Aller sur https://makersuite.google.com/app/apikey');
          console.error('   2. Créer une nouvelle clé API');
          console.error('   3. Mettre à jour GEMINI_API_KEY dans .env.local');
          console.error('   4. Redémarrer le serveur');
        }
      } catch {
        console.error(errorText.substring(0, 500));
      }
      return;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (text) {
      console.log('✅ Clé API valide !');
      console.log(`📝 Réponse: ${text}\n`);
      console.log('✅ La clé fonctionne correctement. Vous pouvez maintenant utiliser Gemini Web Search.\n');
    } else {
      console.error('❌ Aucune réponse texte');
      console.error('Réponse:', JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testKey();

