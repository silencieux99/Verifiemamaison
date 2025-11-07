/**
 * Script de test pour vérifier que GPT calcule le prix au m² de manière ultra-précise
 */

require('dotenv').config({ path: '.env.local' });

const TEST_ADDRESS = '36 bis rue auguste blanqui 93600 aulnay sous bois';

async function testGPTPriceM2() {
  console.log('🧪 Test du calcul du prix au m² par GPT\n');
  console.log(`📍 Adresse de test: ${TEST_ADDRESS}\n`);

  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY non configurée dans .env.local');
    process.exit(1);
  }

  // Simuler un profil de bien minimal pour tester GPT
  const mockProfile = {
    location: {
      normalized_address: TEST_ADDRESS,
      admin: {
        city: 'Aulnay-sous-Bois',
        postcode: '93600',
        department: '93',
        region: 'Île-de-France',
      },
    },
    building: {
      declared: {
        surface_habitable_m2: 70,
        property_type: 'appartement',
        rooms: 3,
      },
    },
    market: {
      dvf: {
        summary: {
          price_m2_median_1y: 3500,
          price_m2_median_3y: 3200,
          trend_label: 'hausse',
        },
        transactions: [
          {
            price: 245000,
            price_m2: 3500,
            surface: 70,
            date: '2024-01-15',
          },
        ],
      },
    },
    energy: {
      dpe: {
        class_energy: 'D',
        class_ges: 'C',
      },
    },
    risks: {
      normalized: {
        flood_level: 'moyen',
        seismic_level: 'faible',
      },
    },
    amenities: {
      supermarkets: [{ name: 'Carrefour', distance: 500 }],
      transit: [{ name: 'RER B', distance: 800 }],
      parks: [{ name: 'Parc du Sausset', distance: 1200 }],
    },
    education: {
      schools: [
        { name: 'École élémentaire', distance: 300 },
        { name: 'Collège', distance: 600 },
      ],
    },
  };

  // Générer le prompt comme dans le code
  const address = mockProfile.location.normalized_address;
  const city = mockProfile.location.admin.city;
  const postcode = mockProfile.location.admin.postcode;

  const data = {
    location: {
      address,
      city,
      postcode,
      department: mockProfile.location.admin.department,
      region: mockProfile.location.admin.region,
    },
    risks: {
      flood: mockProfile.risks.normalized.flood_level,
      seismic: mockProfile.risks.normalized.seismic_level,
    },
    energy: {
      dpe_class: mockProfile.energy.dpe.class_energy,
      dpe_ges: mockProfile.energy.dpe.class_ges,
    },
    market: {
      price_m2_median: mockProfile.market.dvf.summary.price_m2_median_1y,
      price_m2_median_3y: mockProfile.market.dvf.summary.price_m2_median_3y,
      trend: mockProfile.market.dvf.summary.trend_label,
      transactions_count: mockProfile.market.dvf.transactions.length,
    },
    building: {
      surface_m2: mockProfile.building.declared.surface_habitable_m2,
      property_type: mockProfile.building.declared.property_type,
      rooms: mockProfile.building.declared.rooms,
    },
    amenities: {
      supermarkets: mockProfile.amenities.supermarkets.length,
      transit: mockProfile.amenities.transit.length,
      parks: mockProfile.amenities.parks.length,
    },
    education: {
      schools_count: mockProfile.education.schools.length,
    },
  };

  const prompt = `Tu es un expert immobilier français ultra-précis. Analyse les données suivantes pour le bien situé à ${address}, ${city} ${postcode} et génère une analyse complète et ultra-précise.

DONNÉES DISPONIBLES:
${JSON.stringify(data, null, 2)}

Génère une analyse JSON structurée avec les champs suivants. IMPORTANT: Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ou après, sans markdown, sans code block:

{
  "score": <nombre entre 0 et 100>,
  "summary": "<synthèse générale du bien très détaillée et complète (minimum 8-10 phrases, jusqu'à 15 phrases). Analyse en profondeur tous les aspects : localisation, risques, marché immobilier, commodités, transports, écoles, qualité de vie, potentiel d'investissement, points forts et faibles. Sois exhaustif et donne une vision complète du bien pour un acheteur potentiel>",
  "market_analysis": {
    "estimated_value_m2": <estimation €/m² ULTRA-PRÉCISE et réaliste. TU DOIS CALCULER ce prix en analysant:
    1. La localisation exacte (ville, quartier, département, région)
    2. Les données DVF disponibles (transactions réelles) si présentes dans les données
    3. Le type de bien (appartement/maison)
    4. La surface habitable
    5. Le nombre de pièces
    6. Les commodités et transports à proximité
    7. Les risques naturels (impact sur la valeur)
    8. La classe énergétique DPE (impact sur la valeur)
    9. Les écoles et services à proximité
    10. La qualité de vie du quartier
    
    UTILISE TES CONNAISSANCES DU MARCHÉ IMMOBILIER FRANÇAIS pour donner un prix au m² EXACT et JUSTIFIÉ.
    Exemples de références:
    - Paris intra-muros: 8000-15000 €/m² selon arrondissement
    - Petite couronne (92,93,94): 4000-8000 €/m² selon ville
    - Grande couronne: 2500-5000 €/m²
    - Grandes villes (Lyon, Marseille, Toulouse): 2500-5000 €/m²
    - Villes moyennes: 1500-3000 €/m²
    - Petites villes/rural: 1000-2000 €/m²
    
    IMPORTANT: Le prix doit être un NOMBRE ENTIER réaliste entre 800€/m² et 15000€/m². Ne jamais laisser vide ou null. Sois ULTRA-PRÉCIS et justifie mentalement ton calcul.>,
    "market_trend": "<hausse|baisse|stable>. Analyse la tendance du marché dans cette zone géographique. Si données DVF disponibles avec trend_label, utilise-les. Sinon, estime selon tes connaissances du marché immobilier français actuel (2024-2025)>",
    "market_comment": "<commentaire DÉTAILLÉ et ULTRA-PRÉCIS sur le marché immobilier du quartier/commune. Analyse la dynamique du marché, la demande, l'offre, les perspectives, les facteurs qui influencent les prix. Sois factuel et précis. Minimum 5-6 phrases>",
    "price_comparison": "<comparaison DÉTAILLÉE avec le marché local et régional. Compare avec les prix moyens du quartier, de la commune, du département, de la région. Donne des exemples concrets si possible. Minimum 4-5 phrases>"
  },
  "neighborhood_analysis": {
    "shops_analysis": "<analyse des commerces et services à proximité>",
    "amenities_score": <score sur 100 pour les commodités>,
    "transport_score": <score sur 100 pour les transports>,
    "quality_of_life": "<commentaire sur la qualité de vie du quartier>"
  },
  "risks_analysis": {
    "overall_risk_level": "<faible|moyen|élevé>",
    "main_risks": ["<risque 1>", "<risque 2>", ...],
    "risk_comment": "<commentaire sur les risques identifiés>"
  },
  "investment_potential": {
    "score": <score sur 100>,
    "comment": "<commentaire sur le potentiel d'investissement>",
    "recommendations": ["<recommandation 1>", "<recommandation 2>", ...]
  },
  "strengths": ["<point fort 1>", "<point fort 2>", ...],
  "weaknesses": ["<point faible 1>", "<point faible 2>", ...],
  "recommendations": ["<recommandation 1>", "<recommandation 2>", ...]
}

IMPORTANT - ULTRA-PRÉCISION REQUISE:
- Sois ULTRA-PRÉCIS et factuel dans toutes tes analyses
- Utilise les données fournies pour justifier tes analyses
- Pour estimated_value_m2: C'EST LA PRIORITÉ ABSOLUE. Tu DOIS calculer un prix au m² ULTRA-PRÉCIS en analysant TOUS les facteurs disponibles (localisation, type, surface, commodités, risques, DPE, etc.). Utilise tes connaissances approfondies du marché immobilier français. Le prix doit être JUSTIFIÉ et RÉALISTE. Ne jamais laisser vide ou null.
- Si une donnée n'est pas disponible, ESTIME intelligemment basé sur la localisation exacte, la région, et tes connaissances du marché français
- Les commentaires doivent être en français, professionnels, détaillés et utiles pour un acheteur/investisseur
- Réponds UNIQUEMENT avec le JSON, sans texte avant ou après`;

  console.log('📤 Envoi de la requête à GPT...\n');

  try {
    const modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: 'system',
            content: 'Tu es un expert immobilier français. Tu analyses les données immobilières et génères des analyses JSON structurées.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erreur API OpenAI:', response.status, errorText);
      process.exit(1);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      console.error('❌ Aucune réponse de GPT');
      process.exit(1);
    }

    // Nettoyer le texte
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Parser le JSON
    const analysis = JSON.parse(cleanText);

    console.log('✅ Réponse GPT reçue\n');
    console.log('📊 RÉSULTATS:\n');
    console.log(`💰 Prix au m² calculé par GPT: ${analysis.market_analysis?.estimated_value_m2?.toLocaleString('fr-FR')} €/m²`);
    console.log(`📈 Tendance marché: ${analysis.market_analysis?.market_trend || 'N/A'}`);
    console.log(`⭐ Score global: ${analysis.score}/100\n`);

    console.log('📝 Commentaire marché:');
    console.log(analysis.market_analysis?.market_comment || 'N/A');
    console.log('\n');

    console.log('🔍 Comparaison prix:');
    console.log(analysis.market_analysis?.price_comparison || 'N/A');
    console.log('\n');

    // Validation
    const priceM2 = analysis.market_analysis?.estimated_value_m2;
    if (!priceM2 || typeof priceM2 !== 'number') {
      console.error('❌ ERREUR: Prix au m² manquant ou invalide');
      process.exit(1);
    }

    if (priceM2 < 500 || priceM2 > 50000) {
      console.warn(`⚠️  Prix au m² hors limites: ${priceM2} €/m² (attendu: 500-50000)`);
    } else {
      console.log('✅ Prix au m² valide et dans les limites attendues\n');
    }

    // Comparaison avec DVF
    const dvfPrice = mockProfile.market.dvf.summary.price_m2_median_1y;
    const diff = Math.abs(priceM2 - dvfPrice);
    const diffPercent = ((diff / dvfPrice) * 100).toFixed(1);

    console.log('📊 COMPARAISON:');
    console.log(`   DVF (médiane 1 an): ${dvfPrice.toLocaleString('fr-FR')} €/m²`);
    console.log(`   GPT calculé: ${priceM2.toLocaleString('fr-FR')} €/m²`);
    console.log(`   Différence: ${diff.toLocaleString('fr-FR')} €/m² (${diffPercent}%)\n`);

    if (diffPercent < 20) {
      console.log('✅ Prix GPT cohérent avec les données DVF (différence < 20%)');
    } else if (diffPercent < 50) {
      console.log('⚠️  Prix GPT différent des données DVF (différence 20-50%)');
    } else {
      console.log('⚠️  Prix GPT très différent des données DVF (différence > 50%)');
    }

    console.log('\n✅ Test terminé avec succès');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

testGPTPriceM2();

