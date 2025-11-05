/**
 * Test direct de l'API Gemini (sans passer par Next.js)
 */

const fs = require('fs');
const path = require('path');

// Charger la clé depuis .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ Fichier .env.local non trouvé');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const geminiLine = envContent.split('\n').find(line => line.trim().startsWith('GEMINI_API_KEY'));
if (!geminiLine) {
  console.error('❌ GEMINI_API_KEY non trouvée dans .env.local');
  process.exit(1);
}

const apiKey = geminiLine.match(/GEMINI_API_KEY\s*=\s*(.+)/)?.[1]?.trim();
if (!apiKey) {
  console.error('❌ Clé API vide');
  process.exit(1);
}

console.log('🤖 TEST DIRECT DE L\'API GEMINI');
console.log('='.repeat(60));
console.log(`🔑 Clé API: ${apiKey.substring(0, 10)}...`);
console.log(`📦 Modèle: gemini-1.5-flash (test)\n`);

async function testGemini() {
  try {
    const prompt = 'Analyse cette adresse immobilière en 2 phrases: 6 boulevard d\'indochine 75019 paris';
    
    console.log('📡 Appel de l\'API Gemini...\n');
    
    // Test avec gemini-2.5-flash (modèle disponible)
    const modelName = 'gemini-2.5-flash';
    console.log(`Tentative avec: ${modelName} (API v1)...`);
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
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erreur ${response.status}:`);
      console.error(errorText);
      return;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (text) {
      console.log(`\n✅ Modèle ${modelName} fonctionne avec l'API v1 !\n`);
      console.log('Réponse Gemini:\n');
      console.log(text);
      console.log('\n' + '='.repeat(60));
      console.log(`✅ Test réussi ! Utilisez l'API v1 avec ${modelName}\n`);
    } else {
      console.error('❌ Aucun texte dans la réponse');
      console.error('Réponse:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testGemini();

