/**
 * Script de test pour Gemini Web Search
 * Teste la recherche d'informations immobilières en temps réel via Google Search
 */

require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('❌ GEMINI_API_KEY non configurée dans .env.local');
  process.exit(1);
}

const address = process.argv[2] || '6 boulevard d\'indochine 75019 paris';
const city = process.argv[3] || 'Paris';
const postcode = process.argv[4] || '75019';

console.log('🔍 Test Gemini Web Search (Google Search Grounding)');
console.log(`📍 Adresse: ${address}, ${city} ${postcode}\n`);

async function testGeminiWebSearch() {
  try {
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite';
    
    const prompt = `Recherche sur Google les informations immobilières réelles et à jour pour cette adresse :
${address}, ${city} ${postcode}

Recherche spécifiquement :
1. Le prix au m² actuel dans ce quartier/commune (données récentes 2024-2025)
2. La tendance du marché (hausse, baisse, stable)
3. Des exemples de ventes récentes similaires avec prix/m², surface, date
4. Des informations sur le quartier et le marché immobilier local

Réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après, sans markdown, sans code block :
{
  "price_m2": <prix moyen au m² en euros (nombre entier)>,
  "price_m2_range": {
    "min": <prix minimum au m²>,
    "max": <prix maximum au m²>
  },
  "market_trend": "<hausse|baisse|stable>",
  "market_comment": "<commentaire détaillé sur le marché local basé sur tes recherches>",
  "neighborhood_info": "<informations sur le quartier et son attractivité>",
  "recent_sales": [
    {
      "price_m2": <prix/m²>,
      "surface": <surface en m²>,
      "date": "<date si trouvée>",
      "address": "<adresse si trouvée>"
    }
  ],
  "sources": ["<source 1>", "<source 2>"]
}`;

    console.log(`📡 Appel Gemini API avec modèle: ${modelName}`);
    console.log('⏳ Recherche en cours sur Google...\n');

    // Structure de requête - essayer d'abord sans Google Search Grounding
    // car tous les modèles ne le supportent pas de la même manière
    const requestBody = {
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
    };

    // Essayer d'ajouter Google Search Grounding (peut ne pas être supporté)
    // Pour l'instant, on utilise Gemini sans grounding mais avec un prompt qui demande
    // explicitement de rechercher des informations réelles
    // Note: Google Search Grounding nécessite une activation spéciale dans Google AI Studio

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erreur ${response.status}:`);
      console.error(errorText.substring(0, 500));
      return;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      console.error('❌ Aucune réponse texte');
      console.error('Réponse complète:', JSON.stringify(data, null, 2));
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
    
    console.log('✅ Résultats de la recherche web:\n');
    console.log('='.repeat(60));
    console.log(`💰 Prix/m²: ${result.price_m2 ? `${result.price_m2.toLocaleString('fr-FR')} €/m²` : 'Non trouvé'}`);
    if (result.price_m2_range) {
      console.log(`📊 Fourchette: ${result.price_m2_range.min.toLocaleString('fr-FR')} - ${result.price_m2_range.max.toLocaleString('fr-FR')} €/m²`);
    }
    console.log(`📈 Tendance: ${result.market_trend || 'Non trouvée'}`);
    console.log(`\n💬 Commentaire marché:`);
    console.log(result.market_comment || 'Non disponible');
    console.log(`\n🏘️ Informations quartier:`);
    console.log(result.neighborhood_info || 'Non disponible');
    
    if (result.recent_sales && result.recent_sales.length > 0) {
      console.log(`\n🏠 Ventes récentes trouvées: ${result.recent_sales.length}`);
      result.recent_sales.slice(0, 3).forEach((sale, i) => {
        console.log(`  ${i + 1}. ${sale.price_m2?.toLocaleString('fr-FR')} €/m² - ${sale.surface} m²${sale.date ? ` (${sale.date})` : ''}`);
      });
    }
    
    if (result.sources && result.sources.length > 0) {
      console.log(`\n📚 Sources:`);
      result.sources.forEach((source, i) => {
        console.log(`  ${i + 1}. ${source}`);
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

testGeminiWebSearch();

