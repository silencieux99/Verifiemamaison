/**
 * Test direct de l'API OpenAI (sans passer par Next.js)
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
const openaiLine = envContent.split('\n').find(line => line.trim().startsWith('OPENAI_API_KEY'));
if (!openaiLine) {
  console.error('❌ OPENAI_API_KEY non trouvée dans .env.local');
  console.error('\n💡 Ajoutez cette ligne dans .env.local:');
  console.error('   OPENAI_API_KEY=votre_cle_api_openai');
  process.exit(1);
}

const apiKey = openaiLine.match(/OPENAI_API_KEY\s*=\s*(.+)/)?.[1]?.trim();
if (!apiKey) {
  console.error('❌ Clé API vide');
  process.exit(1);
}

console.log('🤖 TEST DIRECT DE L\'API OPENAI');
console.log('='.repeat(60));
console.log(`🔑 Clé API: ${apiKey.substring(0, 10)}...`);
console.log(`📦 Modèle: gpt-4o\n`);

async function testOpenAI() {
  try {
    const prompt = 'Analyse cette adresse immobilière en 2 phrases: 6 boulevard d\'indochine 75019 paris';
    
    console.log('📡 Appel de l\'API OpenAI...\n');
    
    const response = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'Tu es un expert immobilier français.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 200,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erreur ${response.status}:`);
      try {
        const error = JSON.parse(errorText);
        console.error(`   Code: ${error.error?.code || 'N/A'}`);
        console.error(`   Message: ${error.error?.message || errorText}`);
      } catch {
        console.error(errorText);
      }
      return;
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    
    if (text) {
      console.log(`\n✅ Test réussi !\n`);
      console.log('Réponse OpenAI:\n');
      console.log(text);
      console.log('\n' + '='.repeat(60));
      console.log('✅ L\'API OpenAI fonctionne correctement !\n');
      console.log('💡 Vous pouvez maintenant utiliser l\'analyse IA dans votre application.\n');
    } else {
      console.error('❌ Aucun texte dans la réponse');
      console.error('Réponse:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testOpenAI();

