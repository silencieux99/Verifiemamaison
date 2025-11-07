/**
 * Test direct de Gemini Crime Search (sans dépendances TypeScript)
 */

require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('❌ GEMINI_API_KEY non configurée dans .env.local');
  process.exit(1);
}

const address = process.argv[2] || '36 bis rue auguste blanqui';
const city = process.argv[3] || 'Aulnay-sous-Bois';
const postcode = process.argv[4] || '93600';

console.log('🔍 Test Gemini Crime Search');
console.log(`📍 Adresse: ${address}, ${city} ${postcode}\n`);

async function testGeminiCrimeSearch() {
  try {
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite';
    
    const prompt = `Tu es un expert en sécurité et criminalité. Recherche des informations récentes sur la criminalité et la sécurité pour cette adresse :
${address}, ${city} ${postcode}

Recherche spécifiquement :
1. Le taux de criminalité dans ce quartier/commune (faible, moyen, élevé)
2. Un score de sécurité sur 100
3. Les types de crimes les plus fréquents
4. Des exemples de crimes récents (2024-2025) avec type, date, description si disponible
5. La tendance de la criminalité (hausse, baisse, stable)
6. Une comparaison avec d'autres quartiers de la ville
7. Un commentaire détaillé sur la sécurité du quartier

Réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après, sans markdown :
{
  "crime_rate": "<faible|moyen|élevé>",
  "safety_score": <score sur 100 (0-100)>,
  "crime_trend": "<hausse|baisse|stable>",
  "main_crime_types": ["<type 1>", "<type 2>", ...],
  "recent_crimes": [
    {
      "type": "<type de crime>",
      "date": "<date si trouvée (format: YYYY-MM ou YYYY-MM-DD)>",
      "description": "<description si trouvée>",
      "location": "<localisation si trouvée>"
    }
  ],
  "safety_comment": "<commentaire détaillé sur la sécurité du quartier basé sur tes recherches>",
  "comparison": "<comparaison avec d'autres quartiers de la ville>",
  "sources": ["<source 1>", "<source 2>"]
}`;

    console.log(`📡 Appel Gemini API avec modèle: ${modelName}`);
    console.log('⏳ Recherche en cours...\n');

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
            temperature: 0.3,
            maxOutputTokens: 2000,
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
      } catch {
        console.error(errorText.substring(0, 500));
      }
      return;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      console.error('❌ Aucune réponse texte');
      return;
    }

    // Nettoyer et parser le JSON
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const result = JSON.parse(cleanText);
    
    console.log('✅ Résultats de la recherche:\n');
    console.log('='.repeat(60));
    console.log(`🛡️  Score sécurité: ${result.safety_score !== undefined ? `${result.safety_score}/100` : 'Non trouvé'}`);
    console.log(`⚠️  Taux criminalité: ${result.crime_rate ? result.crime_rate.charAt(0).toUpperCase() + result.crime_rate.slice(1) : 'Non trouvé'}`);
    console.log(`📈 Tendance: ${result.crime_trend || 'Non trouvée'}`);
    
    if (result.main_crime_types && result.main_crime_types.length > 0) {
      console.log(`\n🔴 Types de crimes principaux:`);
      result.main_crime_types.forEach((type, i) => {
        console.log(`   ${i + 1}. ${type}`);
      });
    }
    
    if (result.recent_crimes && result.recent_crimes.length > 0) {
      console.log(`\n📋 Crimes récents trouvés: ${result.recent_crimes.length}`);
      result.recent_crimes.slice(0, 5).forEach((crime, i) => {
        console.log(`   ${i + 1}. ${crime.type}${crime.date ? ` (${crime.date})` : ''}`);
        if (crime.description) {
          console.log(`      ${crime.description.substring(0, 100)}...`);
        }
        if (crime.location) {
          console.log(`      📍 ${crime.location}`);
        }
      });
    }
    
    if (result.safety_comment) {
      console.log(`\n💬 Commentaire sécurité:`);
      console.log(result.safety_comment);
    }
    
    if (result.comparison) {
      console.log(`\n📊 Comparaison:`);
      console.log(result.comparison);
    }
    
    if (result.sources && result.sources.length > 0) {
      console.log(`\n📚 Sources:`);
      result.sources.forEach((source, i) => {
        console.log(`   ${i + 1}. ${source}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Test réussi !\n');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

testGeminiCrimeSearch();

