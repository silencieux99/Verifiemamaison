/**
 * Analyse IA avec OpenAI ChatGPT / Gemini
 * Analyse complète des données immobilières pour générer un score, une synthèse et des insights
 * 
 * Supporte également Gemini avec Google Search Grounding pour des recherches web en temps réel
 */

import { HouseProfile } from './house-profile-types';

export interface AIAnalysis {
  score: number; // Score global sur 100
  summary: string; // Synthèse générale du bien
  market_analysis: {
    estimated_value_m2?: number;
    market_trend?: 'hausse' | 'baisse' | 'stable';
    market_comment?: string;
    price_comparison?: string;
    gemini_data?: {
      price_m2?: number;
      price_m2_range?: { min: number; max: number };
      recent_sales?: Array<{
        price_m2: number;
        surface: number;
        date?: string;
        address?: string;
      }>;
      sources?: string[];
      neighborhood_info?: string;
    };
  };
  neighborhood_analysis: {
    shops_analysis?: string;
    amenities_score?: number;
    transport_score?: number;
    quality_of_life?: string;
  };
  risks_analysis: {
    overall_risk_level?: 'faible' | 'moyen' | 'élevé';
    main_risks?: string[];
    risk_comment?: string;
  };
  investment_potential?: {
    score?: number;
    comment?: string;
    recommendations?: string[];
  };
  rental_yield_analysis?: {
    estimated_rent_monthly?: number; // Loyer mensuel estimé en €
    estimated_rent_yearly?: number; // Loyer annuel estimé en €
    yield_percentage?: number; // Rendement locatif en % (loyer annuel / prix d'achat * 100)
    yield_rating?: 'excellent' | 'bon' | 'moyen' | 'faible'; // Évaluation du rendement
    market_rent_comparison?: string; // Comparaison avec le marché locatif local
    rental_demand?: 'forte' | 'moyenne' | 'faible'; // Demande locative dans le quartier
    rental_comment?: string; // Commentaire détaillé sur la rentabilité locative
    rental_recommendations?: string[]; // Recommandations pour optimiser la rentabilité
  };
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
}

/**
 * Génère un prompt structuré pour GPT basé sur les données collectées
 */
function generatePrompt(
  profile: Partial<HouseProfile>
): string {
  const address = profile.location?.normalized_address || profile.query?.address || 'Adresse inconnue';
  const city = profile.location?.admin?.city || '';
  const postcode = profile.location?.admin?.postcode || '';

  // Préparer les données pour le prompt
  const data = {
    location: {
      address,
      city,
      postcode,
      department: profile.location?.admin?.department,
      region: profile.location?.admin?.region,
    },
    risks: {
      flood: profile.risks?.normalized?.flood_level,
      seismic: profile.risks?.normalized?.seismic_level,
      radon: profile.risks?.normalized?.radon_zone,
    },
    energy: {
      dpe_class: profile.energy?.dpe?.class_energy,
      dpe_ges: profile.energy?.dpe?.class_ges,
    },
    market: {
      price_m2_median: profile.market?.dvf?.summary?.price_m2_median_1y,
      price_m2_median_3y: profile.market?.dvf?.summary?.price_m2_median_3y,
      trend: profile.market?.dvf?.summary?.trend_label,
      transactions_count: profile.market?.dvf?.transactions?.length || 0,
    },
    building: {
      surface_m2: profile.building?.declared?.surface_habitable_m2,
      property_type: profile.building?.declared?.property_type,
      rooms: profile.building?.declared?.rooms,
    },
    amenities: {
      supermarkets: profile.amenities?.supermarkets?.length || 0,
      transit: profile.amenities?.transit?.length || 0,
      parks: profile.amenities?.parks?.length || 0,
    },
    education: {
      schools_count: profile.education?.schools?.length || 0,
    },
    connectivity: {
      fiber: profile.connectivity?.fiber_available,
    },
    air_quality: {
      index: profile.air_quality?.index_today,
      label: profile.air_quality?.label,
    },
    safety: {
      indicators_count: profile.safety?.indicators?.length || 0,
    },
  };

  return `Tu es un expert immobilier français ultra-précis. Analyse les données suivantes pour le bien situé à ${address}, ${city} ${postcode} et génère une analyse complète et ultra-précise.

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
  "rental_yield_analysis": {
    "estimated_rent_monthly": <loyer mensuel estimé en € basé sur le marché locatif du quartier. Recherche les loyers moyens pour des biens similaires dans ce quartier/commune>,
    "estimated_rent_yearly": <loyer annuel estimé (estimated_rent_monthly * 12)>,
    "yield_percentage": <rendement locatif en % calculé comme suit: (estimated_rent_yearly / (estimated_value_m2 * surface_m2)) * 100. Si surface_m2 non disponible, estime à 70m² pour un appartement ou 100m² pour une maison>,
    "yield_rating": "<excellent|bon|moyen|faible> - excellent si >8%, bon si 6-8%, moyen si 4-6%, faible si <4%",
    "market_rent_comparison": "<comparaison détaillée avec les loyers du marché local. Recherche les prix de location moyens dans ce quartier/commune pour des biens similaires>",
    "rental_demand": "<forte|moyenne|faible> - évalue la demande locative dans le quartier basé sur la localisation, les transports, les commodités, les écoles, etc.",
    "rental_comment": "<commentaire détaillé sur la rentabilité locative du bien. Analyse le rendement, la demande, les perspectives de revalorisation du loyer, les charges, etc. Sois exhaustif et factuel>",
    "rental_recommendations": ["<recommandation 1 pour optimiser la rentabilité>", "<recommandation 2>", ...]
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
- Pour rental_yield_analysis: RECHERCHE activement les loyers moyens du quartier/commune pour des biens similaires. Utilise tes connaissances du marché locatif français. Calcule le rendement de manière ULTRA-PRÉCISE.
- Le score global doit refléter l'ensemble des critères (risques, marché, commodités, etc.)
- Les commentaires doivent être en français, professionnels, détaillés et utiles pour un acheteur/investisseur
- Réponds UNIQUEMENT avec le JSON, sans texte avant ou après`;
}

/**
 * Appelle l'API OpenAI ChatGPT pour analyser les données
 */
export async function analyzeWithOpenAI(profile: Partial<HouseProfile>): Promise<AIAnalysis | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ OPENAI_API_KEY not configured, skipping AI analysis');
    console.warn('   Vérifiez que la clé est dans .env.local et que le serveur a été redémarré');
    return null;
  }
  
  console.log('🤖 Démarrage de l\'analyse IA avec OpenAI ChatGPT...');

  try {
    // Générer le prompt sans enrichissement externe - GPT calcule tout
    const prompt = generatePrompt(profile);

    // Appel à l'API OpenAI
    // Utilisation de gpt-4o-mini (rapide et économique, excellent rapport qualité/prix)
    // Alternatives: gpt-4.1 (le plus performant), gpt-4.1-mini, gpt-4o
    const modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const response = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
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
          response_format: { type: 'json_object' }, // Force JSON response
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API error:', response.status, errorText);
      return null;
    }
    
    console.log('✅ Réponse OpenAI reçue, parsing...');

    const data = await response.json();

    // Extraire le texte de la réponse
    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      console.error('No text in OpenAI response');
      return null;
    }

    // Nettoyer le texte (enlever les markdown code blocks si présents)
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Parser le JSON
    const analysis = JSON.parse(cleanText) as AIAnalysis;
    
    // Valider le prix au m² calculé par GPT
    let estimatedValueM2 = analysis.market_analysis?.estimated_value_m2;
    
    // Validation basique (s'assurer que c'est un nombre valide)
    if (!estimatedValueM2 || typeof estimatedValueM2 !== 'number' || estimatedValueM2 < 500 || estimatedValueM2 > 50000) {
      console.warn(`⚠️ Prix/m² GPT invalide (${estimatedValueM2}), utilisation de la valeur GPT telle quelle ou null`);
      // On laisse GPT gérer, même si invalide, pour voir ce qu'il propose
    } else {
      console.log(`✅ Prix/m² calculé par GPT: ${Math.round(estimatedValueM2).toLocaleString('fr-FR')} €/m²`);
    }
    
    console.log(`✅ Analyse IA générée avec succès (score: ${analysis.score}/100)`);

    return {
      score: Math.max(0, Math.min(100, analysis.score || 0)),
      summary: analysis.summary || 'Analyse non disponible',
      market_analysis: {
        estimated_value_m2: estimatedValueM2, // Utilise directement la valeur calculée par GPT
        market_trend: analysis.market_analysis?.market_trend || 'stable',
        market_comment: analysis.market_analysis?.market_comment || '',
        price_comparison: analysis.market_analysis?.price_comparison || '',
      },
      neighborhood_analysis: {
        shops_analysis: analysis.neighborhood_analysis?.shops_analysis || '',
        amenities_score: Math.max(0, Math.min(100, analysis.neighborhood_analysis?.amenities_score || 0)),
        transport_score: Math.max(0, Math.min(100, analysis.neighborhood_analysis?.transport_score || 0)),
        quality_of_life: analysis.neighborhood_analysis?.quality_of_life || '',
      },
      risks_analysis: {
        overall_risk_level: analysis.risks_analysis?.overall_risk_level || 'faible',
        main_risks: analysis.risks_analysis?.main_risks || [],
        risk_comment: analysis.risks_analysis?.risk_comment || '',
      },
      investment_potential: {
        score: analysis.investment_potential?.score,
        comment: analysis.investment_potential?.comment || '',
        recommendations: analysis.investment_potential?.recommendations || [],
      },
      strengths: analysis.strengths || [],
      weaknesses: analysis.weaknesses || [],
      recommendations: analysis.recommendations || [],
    };
  } catch (error) {
    console.error('Erreur analyse OpenAI:', error);
    return null;
  }
}

// Alias pour compatibilité (l'ancien nom de fonction)
export const analyzeWithGemini = analyzeWithOpenAI;

