/**
 * API Route: /api/house-profile
 * Agrégateur de données immobilières pour une adresse en France
 */

import { NextRequest, NextResponse } from 'next/server';
import { HouseProfile, HouseProfileQuery } from '@/lib/house-profile-types';
import {
  geocodeAddress,
  fetchGeoRisques,
  fetchGPU,
  fetchDPE,
  fetchDVF,
  fetchSchools,
  fetchAtmo,
  fetchOSMAmenities,
  fetchSafetySSMSI,
  fetchPappers,
  computeRecommendations,
  getCachedProfile,
  setCachedProfile,
} from '@/lib/house-profile-utils';
import { analyzeWithOpenAI } from '@/lib/ai-analysis';

export const dynamic = 'force-dynamic';
export const maxDuration = 30; // 30 secondes max pour Next.js

/**
 * GET /api/house-profile
 * 
 * Query params:
 * - address (string, required): Adresse à analyser
 * - radius_m (number, optional, default 1500): Rayon de recherche en mètres
 * - lang (fr|en, optional, default fr): Langue pour les labels
 * - nocache (1|0, optional): Ignorer le cache
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const sources: HouseProfile['meta']['sources'] = [];
  const warnings: string[] = [];

  try {
    // Récupération des paramètres
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');
    const radius_m = parseInt(searchParams.get('radius_m') || '1500', 10);
    const lang = (searchParams.get('lang') || 'fr') as 'fr' | 'en';
    const nocache = searchParams.get('nocache') === '1';

    // Validation
    if (!address || address.trim().length === 0) {
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_ADDRESS',
            message: 'Le paramètre "address" est requis',
          },
        },
        { status: 400 }
      );
    }

    if (radius_m < 100 || radius_m > 10000) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_RADIUS',
            message: 'Le rayon doit être entre 100 et 10000 mètres',
          },
        },
        { status: 400 }
      );
    }

    // Vérification du cache
    if (!nocache) {
      const cached = getCachedProfile(address, radius_m);
      if (cached) {
        return NextResponse.json(cached, {
          headers: {
            'X-Cache': 'HIT',
            'Cache-Control': 'public, max-age=900',
          },
        });
      }
    }

    // Initialisation du profil
    const query: HouseProfileQuery = {
      address: address.trim(),
      radius_m,
      lang,
    };

    // 1. Géocodage (obligatoire)
    let location: HouseProfile['location'];
    try {
      const geoResult = await geocodeAddress(address);
      sources.push({
        section: 'location',
        url: `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(address)}`,
        fetched_at: new Date().toISOString(),
      });

      location = {
        normalized_address: geoResult.normalized_address,
        gps: {
          lat: geoResult.lat,
          lon: geoResult.lon,
        },
        admin: {
          city: geoResult.city,
          postcode: geoResult.postcode,
          citycode: geoResult.citycode,
          department: geoResult.department,
          region: geoResult.region,
        },
        raw: geoResult.raw,
      };
    } catch (error) {
      return NextResponse.json(
        {
          error: {
            code: 'ADDRESS_NOT_FOUND',
            message: error instanceof Error ? error.message : 'Adresse non trouvée',
          },
        },
        { status: 422 }
      );
    }

    const { lat, lon } = location.gps;
    const { citycode } = location.admin;

    // Collecte parallèle des données (on lance tout en parallèle pour optimiser)
    const [
      risks,
      urbanism,
      energy,
      market,
      education,
      airQuality,
      amenities,
      safety,
      pappers,
    ] = await Promise.allSettled([
      fetchGeoRisques(lat, lon).catch((e) => {
        warnings.push('GéoRisques indisponible');
        return { normalized: {} };
      }),
      fetchGPU(citycode, lat, lon).catch((e) => {
        warnings.push('Géoportail Urbanisme indisponible');
        return {};
      }),
      fetchDPE(address, citycode).catch((e) => {
        warnings.push('DPE indisponible');
        return {};
      }),
      fetchDVF(lat, lon, citycode).catch((e) => {
        warnings.push('DVF indisponible');
        return { dvf: {} };
      }),
      fetchSchools(lat, lon, radius_m).catch((e) => {
        warnings.push('Écoles indisponible');
        return { schools: [] };
      }),
      fetchAtmo(citycode).catch((e) => {
        warnings.push('ATMO indisponible');
        return {};
      }),
      fetchOSMAmenities(lat, lon, radius_m).catch((e) => {
        warnings.push('OSM commodités indisponible');
        return {};
      }),
      fetchSafetySSMSI(citycode).catch((e) => {
        warnings.push('Sécurité SSMSI indisponible');
        return {
          scope: 'commune' as const,
          city: location.admin.city,
          citycode,
          period: { from: '2015', to: new Date().getFullYear().toString() },
          indicators: [],
          notes: ['Données indisponibles'],
        };
      }),
      fetchPappers(address, lat, lon, citycode).catch((e) => {
        warnings.push('Pappers Immo indisponible');
        return {};
      }),
    ]);

    // Extraction des résultats
    const risksResult = risks.status === 'fulfilled' ? risks.value : { normalized: {} };
    const urbanismResult = urbanism.status === 'fulfilled' ? urbanism.value : {};
    const energyResult = energy.status === 'fulfilled' ? energy.value : {};
    const marketResult = market.status === 'fulfilled' ? market.value : { dvf: {} };
    const educationResult = education.status === 'fulfilled' ? education.value : { schools: [] };
    const airQualityResult = airQuality.status === 'fulfilled' ? airQuality.value : {};
    const amenitiesResult = amenities.status === 'fulfilled' ? amenities.value : {};
    const safetyResult = safety.status === 'fulfilled' ? safety.value : {
      scope: 'commune' as const,
      city: location.admin.city,
      citycode,
      period: { from: '2015', to: new Date().getFullYear().toString() },
      indicators: [],
      notes: ['Données indisponibles'],
    };
    const pappersResult = pappers.status === 'fulfilled' ? pappers.value : {};

    // Ajout des sources pour chaque section réussie
    if (risks.status === 'fulfilled') {
      sources.push({
        section: 'risks',
        url: 'https://www.georisques.gouv.fr',
        fetched_at: new Date().toISOString(),
      });
    }
    if (urbanism.status === 'fulfilled') {
      sources.push({
        section: 'urbanism',
        url: 'https://www.geoportail-urbanisme.gouv.fr',
        fetched_at: new Date().toISOString(),
      });
    }
    if (energy.status === 'fulfilled' && energy.value && 'dpe' in energy.value && energy.value.dpe) {
      sources.push({
        section: 'energy.dpe',
        url: 'https://data.ademe.fr',
        fetched_at: new Date().toISOString(),
      });
    }
    if (market.status === 'fulfilled') {
      sources.push({
        section: 'market.dvf',
        url: 'https://api.cquest.org/dvf',
        fetched_at: new Date().toISOString(),
      });
    }
    if (education.status === 'fulfilled') {
      sources.push({
        section: 'education.schools',
        url: 'https://data.education.gouv.fr/api/records/1.0/search/?dataset=fr-en-annuaire-education',
        fetched_at: new Date().toISOString(),
      });
    }
    if (airQuality.status === 'fulfilled') {
      sources.push({
        section: 'air_quality',
        url: 'https://api.atmo-france.org',
        fetched_at: new Date().toISOString(),
      });
    }
    if (amenities.status === 'fulfilled') {
      sources.push({
        section: 'amenities',
        url: 'https://overpass-api.de/api/interpreter',
        fetched_at: new Date().toISOString(),
      });
    }
    if (safety.status === 'fulfilled') {
      sources.push({
        section: 'safety',
        url: 'https://www.data.gouv.fr/api/1/datasets/securite-commune',
        fetched_at: new Date().toISOString(),
      });
    }
    if (pappers.status === 'fulfilled' && pappers.value && Object.keys(pappers.value).length > 0) {
      sources.push({
        section: 'pappers',
        url: 'https://pappers.fr/immo',
        fetched_at: new Date().toISOString(),
      });
    }

    // Construction du profil complet
    const profile: Partial<HouseProfile> = {
      query,
      location,
      risks: risksResult,
      urbanism: urbanismResult,
      energy: energyResult,
      market: marketResult,
      building: {}, // Sera complété côté front par formulaire utilisateur
      education: educationResult,
      air_quality: airQualityResult,
      amenities: amenitiesResult,
      safety: safetyResult,
      pappers: Object.keys(pappersResult).length > 0 ? pappersResult : undefined,
    };

    // Génération des recommandations
    const recommendations = computeRecommendations(profile);

    // Analyse IA avec OpenAI ChatGPT (en parallèle, ne bloque pas si ça échoue)
    let aiAnalysis = null;
    try {
      aiAnalysis = await analyzeWithOpenAI(profile);
      if (aiAnalysis) {
        sources.push({
          section: 'ai_analysis',
          url: 'https://platform.openai.com',
          fetched_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.warn('Erreur analyse IA OpenAI:', error);
      warnings.push('Analyse IA indisponible');
    }

    // Profil final
    const finalProfile: HouseProfile = {
      ...profile,
      recommendations,
      ai_analysis: aiAnalysis || undefined,
      meta: {
        generated_at: new Date().toISOString(),
        processing_ms: Date.now() - startTime,
        sources,
        warnings: warnings.length > 0 ? warnings : undefined,
      },
    } as HouseProfile;

    // Mise en cache
    if (!nocache) {
      setCachedProfile(address, radius_m, finalProfile);
    }

    return NextResponse.json(finalProfile, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, max-age=900',
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Erreur API house-profile:', error);
    
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Erreur interne du serveur',
        },
      },
      { status: 500 }
    );
  }
}

