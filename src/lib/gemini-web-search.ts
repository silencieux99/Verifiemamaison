/**
 * Utilisation de Gemini avec Google Search Grounding pour rechercher
 * des informations réelles sur internet (prix immobiliers, marché, etc.)
 * 
 * Documentation: https://ai.google.dev/docs/grounding
 */

import { HouseProfile } from './house-profile-types';

export interface GeminiWebSearchResult {
  price_m2?: number;
  price_m2_range?: { min: number; max: number };
  market_trend?: 'hausse' | 'baisse' | 'stable';
  market_comment?: string;
  neighborhood_info?: string;
  recent_sales?: Array<{
    price_m2: number;
    surface: number;
    date?: string;
    address?: string;
  }>;
  sources?: string[];
}

export interface GeminiCrimeData {
  crime_rate?: 'faible' | 'moyen' | 'élevé';
  safety_score?: number; // 0-100
  recent_crimes?: Array<{
    type: string;
    date?: string;
    description?: string;
    location?: string;
  }>;
  crime_trend?: 'hausse' | 'baisse' | 'stable';
  main_crime_types?: string[];
  safety_comment?: string;
  comparison?: string; // Comparaison avec autres quartiers
  sources?: string[];
}

/**
 * Recherche d'informations immobilières en temps réel avec Gemini + Google Search
 */
export async function searchRealEstateInfoWithGemini(
  address: string,
  city: string,
  postcode: string,
  surface_m2?: number
): Promise<GeminiWebSearchResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn('[Gemini Web Search] GEMINI_API_KEY non configurée');
    return null;
  }

  try {
    console.log(`[Gemini Web Search] Recherche d'informations pour ${address}, ${city} ${postcode}...`);

    // Modèle Gemini - utiliser un modèle disponible dans l'API v1
    // Modèles disponibles: gemini-2.5-flash, gemini-2.5-pro, gemini-2.0-flash, gemini-2.0-flash-lite
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite';
    
    const prompt = `Recherche sur Google les informations immobilières réelles et à jour pour cette adresse :
${address}, ${city} ${postcode}${surface_m2 ? ` (bien de ${surface_m2} m²)` : ''}

Recherche spécifiquement :
1. Le prix au m² actuel dans ce quartier/commune (données récentes 2024-2025)
2. La tendance du marché (hausse, baisse, stable)
3. Des exemples de ventes récentes similaires avec prix/m², surface, date
4. Des informations sur le quartier et le marché immobilier local

Réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après, sans markdown :
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
}

IMPORTANT:
- Utilise tes recherches Google pour trouver des données RÉELLES et RÉCENTES
- Si tu ne trouves pas de données précises, estime intelligemment basé sur la localisation
- Le prix/m² doit être réaliste pour la région (Paris: 8000-15000€/m², grandes villes: 3000-6000€/m², etc.)
- Les sources doivent être des sites immobiliers fiables (SeLoger, PAP, Bien'ici, etc.)`;

    // Structure de requête pour Gemini avec Google Search Grounding
    // Note: La structure peut varier selon la version de l'API
    const requestBody: any = {
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

    // Ajouter Google Search Grounding si supporté
    // Certains modèles supportent cette fonctionnalité
    if (modelName.includes('pro') || modelName.includes('flash')) {
      try {
        // Essayer avec la structure complète
        requestBody.tools = [
          {
            googleSearchRetrieval: {},
          },
        ];
        requestBody.generationConfig.responseMimeType = 'application/json';
      } catch (e) {
        // Si la structure n'est pas supportée, continuer sans
        console.warn('[Gemini] Google Search Grounding peut ne pas être supporté pour ce modèle');
      }
    }

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
      console.error(`[Gemini Web Search] Erreur ${response.status}:`, errorText.substring(0, 200));
      return null;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      console.warn('[Gemini Web Search] Aucune réponse texte');
      return null;
    }

    // Nettoyer et parser le JSON
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const result = JSON.parse(cleanText) as GeminiWebSearchResult;
    
    console.log(`✅ [Gemini Web Search] Informations trouvées: prix/m²=${result.price_m2}€, tendance=${result.market_trend}`);
    
    return result;
  } catch (error) {
    console.error('[Gemini Web Search] Erreur:', error);
    return null;
  }
}

/**
 * Enrichit les données de marché avec des recherches web Gemini
 */
export async function enrichMarketWithGeminiWebSearch(
  profile: Partial<HouseProfile>
): Promise<Partial<GeminiWebSearchResult> | null> {
  const address = profile.location?.normalized_address || '';
  const city = profile.location?.admin?.city || '';
  const postcode = profile.location?.admin?.postcode || '';
  const surface = profile.building?.declared?.surface_habitable_m2;

  if (!address || !city) {
    return null;
  }

  try {
    const searchResult = await searchRealEstateInfoWithGemini(
      address,
      city,
      postcode,
      surface
    );

    return searchResult;
  } catch (error) {
    console.error('[Gemini Web Search] Erreur enrichissement:', error);
    return null;
  }
}

/**
 * Recherche d'informations sur la criminalité avec Gemini + Google Search
 */
export async function searchCrimeDataWithGemini(
  address: string,
  city: string,
  postcode: string
): Promise<GeminiCrimeData | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn('[Gemini Crime Search] GEMINI_API_KEY non configurée');
    return null;
  }

  try {
    console.log(`[Gemini Crime Search] Recherche de données de criminalité pour ${address}, ${city} ${postcode}...`);

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
}

IMPORTANT:
- Utilise tes connaissances et recherches pour trouver des données RÉELLES et RÉCENTES
- Le score de sécurité doit être réaliste (0-100, où 100 = très sûr, 0 = très dangereux)
- Les crimes récents doivent être des exemples concrets si trouvés
- Les sources doivent être fiables (sites officiels, presse locale, etc.)`;

    const requestBody: any = {
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
      console.error(`[Gemini Crime Search] Erreur ${response.status}:`, errorText.substring(0, 200));
      return null;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      console.warn('[Gemini Crime Search] Aucune réponse texte');
      return null;
    }

    // Nettoyer et parser le JSON
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const result = JSON.parse(cleanText) as GeminiCrimeData;
    
    console.log(`✅ [Gemini Crime Search] Données trouvées: taux=${result.crime_rate}, score=${result.safety_score}/100`);
    
    return result;
  } catch (error) {
    console.error('[Gemini Crime Search] Erreur:', error);
    return null;
  }
}

/**
 * Enrichit les données de sécurité avec des recherches web Gemini
 */
export async function enrichSafetyWithGeminiWebSearch(
  profile: Partial<HouseProfile>
): Promise<GeminiCrimeData | null> {
  const address = profile.location?.normalized_address || '';
  const city = profile.location?.admin?.city || '';
  const postcode = profile.location?.admin?.postcode || '';

  if (!address || !city) {
    return null;
  }

  try {
    const crimeData = await searchCrimeDataWithGemini(
      address,
      city,
      postcode
    );

    return crimeData;
  } catch (error) {
    console.error('[Gemini Crime Search] Erreur enrichissement:', error);
    return null;
  }
}

