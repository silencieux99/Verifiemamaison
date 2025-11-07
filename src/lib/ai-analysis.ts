/**
 * Analyse IA avec OpenAI ChatGPT / Gemini
 * Analyse complète des données immobilières pour générer un score, une synthèse et des insights
 * 
 * Supporte également Gemini avec Google Search Grounding pour des recherches web en temps réel
 */

import { HouseProfile } from './house-profile-types';
import { enrichMarketWithGeminiWebSearch } from './gemini-web-search';

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
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
}

/**
 * Génère un prompt structuré pour Gemini basé sur les données collectées
 * @param webSearchData Données de recherche web Gemini (optionnel)
 */
function generatePrompt(
  profile: Partial<HouseProfile>,
  webSearchData?: Partial<import('./gemini-web-search').GeminiWebSearchResult> | null
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

  // Ajouter les données de recherche web si disponibles
  const webSearchInfo = webSearchData ? `
DONNÉES DE RECHERCHE WEB RÉCENTES (Gemini + Google Search):
- Prix/m² trouvé: ${webSearchData.price_m2 ? `${webSearchData.price_m2} €/m²` : 'Non disponible'}
- Fourchette prix/m²: ${webSearchData.price_m2_range ? `${webSearchData.price_m2_range.min} - ${webSearchData.price_m2_range.max} €/m²` : 'Non disponible'}
- Tendance marché: ${webSearchData.market_trend || 'Non disponible'}
- Commentaire marché: ${webSearchData.market_comment || 'Non disponible'}
- Informations quartier: ${webSearchData.neighborhood_info || 'Non disponible'}
- Ventes récentes similaires: ${webSearchData.recent_sales?.length || 0} trouvée(s)
- Sources: ${webSearchData.sources?.join(', ') || 'Non disponible'}
` : '';

  return `Tu es un expert immobilier français. Analyse les données suivantes pour le bien situé à ${address}, ${city} ${postcode} et génère une analyse complète.

DONNÉES DISPONIBLES:
${JSON.stringify(data, null, 2)}
${webSearchInfo}

Génère une analyse JSON structurée avec les champs suivants. IMPORTANT: Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ou après, sans markdown, sans code block:

{
  "score": <nombre entre 0 et 100>,
  "summary": "<synthèse générale du bien très détaillée et complète (minimum 8-10 phrases, jusqu'à 15 phrases). Analyse en profondeur tous les aspects : localisation, risques, marché immobilier, commodités, transports, écoles, qualité de vie, potentiel d'investissement, points forts et faibles. Sois exhaustif et donne une vision complète du bien pour un acheteur potentiel>",
  "market_analysis": {
    "estimated_value_m2": <estimation €/m² réaliste. PRIORITÉ: 1) Données de recherche web Gemini si disponibles, 2) Données DVF si disponibles, 3) Estimation selon la région/ville. IMPORTANT: Toujours fournir une estimation réaliste>,
    "market_trend": "<hausse|baisse|stable>. Si données DVF disponibles, utilise la tendance. Sinon, estime selon le contexte général du marché immobilier français>",
    "market_comment": "<commentaire sur le marché immobilier du quartier. Si pas de données, base-toi sur la localisation, la région, et les tendances générales>",
    "price_comparison": "<comparaison avec le marché local. Si pas de données précises, compare avec le marché régional>"
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

IMPORTANT:
- Sois précis et factuel
- Utilise les données fournies pour justifier tes analyses
- Si une donnée n'est pas disponible, ESTIME intelligemment basé sur la localisation, la région, et les moyennes du marché français
- Pour estimated_value_m2: TOUJOURS fournir un nombre réaliste (entre 800€/m² et 15000€/m² selon la région). Ne jamais laisser vide ou null.
- Le score global doit refléter l'ensemble des critères (risques, marché, commodités, etc.)
- Les commentaires doivent être en français, professionnels et utiles pour un acheteur
- Réponds UNIQUEMENT avec le JSON, sans texte avant ou après`;
}

/**
 * Appelle l'API OpenAI ChatGPT pour analyser les données
 */
export async function analyzeWithOpenAI(profile: Partial<HouseProfile>): Promise<AIAnalysis | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  
  // Enrichir avec Gemini Web Search si disponible (recherches web en temps réel)
  let webSearchData: Partial<import('./gemini-web-search').GeminiWebSearchResult> | null = null;
  if (geminiApiKey && process.env.GEMINI_WEB_SEARCH_ENABLED !== 'false') {
    try {
      console.log('🔍 [Gemini] Recherche d\'informations web en temps réel...');
      webSearchData = await enrichMarketWithGeminiWebSearch(profile);
      if (webSearchData) {
        console.log(`✅ [Gemini] Données web trouvées: prix/m²=${webSearchData.price_m2}€`);
      }
    } catch (error) {
      console.warn('[Gemini] Erreur recherche web (ignoré):', error);
    }
  }
  
  if (!apiKey) {
    console.warn('⚠️ OPENAI_API_KEY not configured, skipping AI analysis');
    console.warn('   Vérifiez que la clé est dans .env.local et que le serveur a été redémarré');
    return null;
  }
  
  console.log('🤖 Démarrage de l\'analyse IA avec OpenAI ChatGPT...');

  try {
    // Enrichir le prompt avec les données de recherche web si disponibles
    const prompt = generatePrompt(profile, webSearchData);

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
    
    console.log(`✅ Analyse IA générée avec succès (score: ${analysis.score}/100)`);

    // Valider et normaliser les données
        // Si pas de prix estimé, essayer de l'estimer depuis les données du profil
        let estimatedValueM2 = analysis.market_analysis?.estimated_value_m2;
        
        // Priorité 1: Données de recherche web Gemini (les plus récentes)
        if (webSearchData?.price_m2 && webSearchData.price_m2 > 500 && webSearchData.price_m2 < 50000) {
          estimatedValueM2 = webSearchData.price_m2;
          console.log(`✅ [Gemini] Utilisation du prix/m² trouvé via recherche web: ${estimatedValueM2}€`);
        }
        
        // Priorité 2: Données DVF si pas de données web ou si estimation invalide
        if (!estimatedValueM2 || estimatedValueM2 < 500 || estimatedValueM2 > 50000) {
          const dvfPrice = profile.market?.dvf?.summary?.price_m2_median_1y || 
                          profile.market?.dvf?.summary?.price_m2_median_3y;
          if (dvfPrice && dvfPrice > 500 && dvfPrice < 50000) {
            estimatedValueM2 = dvfPrice;
          } else {
            // Estimation par défaut selon la région
            const region = profile.location?.admin?.region || '';
            const dept = profile.location?.admin?.department || '';
            if (dept === '75' || region.includes('Île-de-France')) {
              estimatedValueM2 = 8000;
            } else if (['92', '93', '94'].includes(dept)) {
              estimatedValueM2 = 6000;
            } else if (region.includes('Provence') || region.includes('PACA')) {
              estimatedValueM2 = 3500;
            } else if (region.includes('Auvergne') || region.includes('Rhône')) {
              estimatedValueM2 = 2800;
            } else {
              estimatedValueM2 = 2500; // Moyenne nationale
            }
          }
        }

        return {
          score: Math.max(0, Math.min(100, analysis.score || 0)),
          summary: analysis.summary || 'Analyse non disponible',
          market_analysis: {
            estimated_value_m2: estimatedValueM2,
            market_trend: webSearchData?.market_trend || analysis.market_analysis?.market_trend || 'stable',
            market_comment: webSearchData?.market_comment || analysis.market_analysis?.market_comment || '',
            price_comparison: analysis.market_analysis?.price_comparison || '',
            // Stocker les données Gemini complètes pour l'affichage
            gemini_data: webSearchData ? {
              price_m2: webSearchData.price_m2,
              price_m2_range: webSearchData.price_m2_range,
              recent_sales: webSearchData.recent_sales,
              sources: webSearchData.sources,
              neighborhood_info: webSearchData.neighborhood_info,
            } : undefined,
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

