/**
 * Enrichissement des données de marché avec l'API Melo
 * 
 * Cette fonction enrichit les données de marché (section market) avec
 * des annonces similaires trouvées via l'API Melo pour compléter les
 * données DVF avec des annonces en cours.
 */

import { HouseProfile, HouseProfileMarket } from './house-profile-types';
import { 
  searchMeloProperties, 
  searchMeloAdverts,
  convertMeloToPropertyListing,
  isMeloConfigured,
  type MeloSearchParams 
} from './melo-api';

export interface MeloMarketEnrichment {
  similarListings?: Array<{
    id: string;
    title: string;
    price: number;
    price_m2?: number;
    surface: number;
    rooms?: number;
    bedrooms?: number;
    type: string;
    address: string;
    city?: string;
    postcode?: string;
    url: string;
    distance_m?: number;
    published_date?: string;
    energy_class?: string;
    contact?: string;
    picturesRemote?: string[];
  }>;
  marketInsights?: {
    averagePriceM2?: number;
    priceRange?: {
      min: number;
      max: number;
    };
    activeListings?: number;
    averageSurface?: number;
  };
  source: 'melo';
  fetchedAt: string;
}

/**
 * Enrichit les données de marché avec l'API Melo
 * 
 * @param profile - Le profil de la maison à enrichir
 * @param options - Options de recherche (rayon, filtres, etc.)
 * @returns Les données enrichies ou null si l'API n'est pas configurée ou en cas d'erreur
 */
export async function enrichMarketWithMelo(
  profile: Partial<HouseProfile>,
  options: {
    radius_m?: number;
    limit?: number;
    propertyType?: 'appartement' | 'maison' | 'all';
  } = {}
): Promise<MeloMarketEnrichment | null> {
  // Vérifier si Melo est configuré
  if (!isMeloConfigured()) {
    console.debug('[Melo] API non configurée, enrichissement ignoré');
    return null;
  }

  // Vérifier qu'on a les coordonnées GPS
  if (!profile.location?.gps?.lat || !profile.location?.gps?.lon) {
    console.warn('[Melo] Coordonnées GPS manquantes');
    return null;
  }

  const { lat, lon } = profile.location.gps;
  const radius_m = options.radius_m || 2000; // 2km par défaut
  const limit = options.limit || 20;

  try {
    // Paramètres de recherche basés sur le profil
    const searchParams: MeloSearchParams = {
      latitude: lat,
      longitude: lon,
      radius_m,
      limit,
      propertyType: options.propertyType || 'all',
    };

    // Ajuster les filtres selon les données du profil si disponibles
    if (profile.market?.dvf?.summary?.price_m2_median_1y) {
      const medianPriceM2 = profile.market.dvf.summary.price_m2_median_1y;
      // Chercher dans une fourchette de ±30% du prix médian
      if (profile.building?.declared?.surface_habitable_m2) {
        const estimatedPrice = medianPriceM2 * profile.building.declared.surface_habitable_m2;
        searchParams.minPrice = Math.round(estimatedPrice * 0.7);
        searchParams.maxPrice = Math.round(estimatedPrice * 1.3);
      }
    }

    if (profile.building?.declared?.surface_habitable_m2) {
      const surface = profile.building.declared.surface_habitable_m2;
      // Chercher des biens avec une surface similaire (±20%)
      searchParams.minSurface = Math.round(surface * 0.8);
      searchParams.maxSurface = Math.round(surface * 1.2);
    }

    // Rechercher d'abord les annonces (plus récentes et détaillées)
    let meloResults;
    try {
      meloResults = await searchMeloAdverts(searchParams);
    } catch (error) {
      // Si la recherche d'annonces échoue, essayer les propriétés
      try {
        meloResults = await searchMeloProperties(searchParams);
      } catch (propError) {
        // Si les deux échouent, re-lancer l'erreur
        throw error;
      }
    }

    if (!meloResults || (!meloResults.adverts?.length && !meloResults.properties?.length)) {
      console.debug('[Melo] Aucun résultat trouvé');
      return null;
    }

    // Convertir les résultats en format standardisé
    const listings: MeloMarketEnrichment['similarListings'] = [];

    // Traiter les propriétés (les adverts sont dans les properties)
    if (meloResults.properties) {
      for (const property of meloResults.properties.slice(0, limit)) {
        // Convertir chaque propriété (qui contient des adverts)
        const listing = convertMeloToPropertyListing(property, lat, lon);
        if (listing && listing.price > 0 && listing.surface > 0) {
          listings.push({
            id: listing.id,
            title: listing.title,
            price: listing.price,
            price_m2: listing.price_m2,
            surface: listing.surface,
            rooms: listing.rooms,
            bedrooms: listing.bedrooms,
            type: listing.type,
            address: listing.address,
            city: listing.city,
            postcode: listing.postcode,
            url: listing.url,
            distance_m: listing.distance_m,
            published_date: listing.published_date,
            energy_class: listing.energy_class,
            contact: listing.contact,
            picturesRemote: listing.picturesRemote,
          });
        }
      }
    }

    // Si on a des adverts séparés (format alternatif)
    if (meloResults.adverts && listings.length < limit) {
      for (const advert of meloResults.adverts.slice(0, limit - listings.length)) {
        const listing = convertMeloToPropertyListing(advert, lat, lon);
        if (listing && listing.price > 0 && listing.surface > 0) {
          listings.push({
            id: listing.id,
            title: listing.title,
            price: listing.price,
            price_m2: listing.price_m2,
            surface: listing.surface,
            rooms: listing.rooms,
            bedrooms: listing.bedrooms,
            type: listing.type,
            address: listing.address,
            city: listing.city,
            postcode: listing.postcode,
            url: listing.url,
            distance_m: listing.distance_m,
            published_date: listing.published_date,
            energy_class: listing.energy_class,
            contact: listing.contact,
            picturesRemote: listing.picturesRemote,
          });
        }
      }
    }

    // Calculer des insights de marché
    const marketInsights: MeloMarketEnrichment['marketInsights'] = {
      activeListings: listings.length,
    };

    if (listings.length > 0) {
      const pricesM2 = listings
        .map(l => l.price_m2)
        .filter((p): p is number => p !== undefined && p > 0);
      
      if (pricesM2.length > 0) {
        pricesM2.sort((a, b) => a - b);
        marketInsights.averagePriceM2 = Math.round(
          pricesM2.reduce((sum, p) => sum + p, 0) / pricesM2.length
        );
        marketInsights.priceRange = {
          min: pricesM2[0],
          max: pricesM2[pricesM2.length - 1],
        };
      }

      const surfaces = listings
        .map(l => l.surface)
        .filter((s): s is number => s > 0);
      
      if (surfaces.length > 0) {
        marketInsights.averageSurface = Math.round(
          surfaces.reduce((sum, s) => sum + s, 0) / surfaces.length
        );
      }
    }

    return {
      similarListings: listings.slice(0, limit),
      marketInsights,
      source: 'melo',
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[Melo] Erreur enrichissement marché:', error);
    return null;
  }
}

/**
 * Fusionne les données Melo avec les données de marché existantes
 */
export function mergeMeloWithMarket(
  existingMarket: HouseProfileMarket,
  meloEnrichment: MeloMarketEnrichment | null
): HouseProfileMarket {
  if (!meloEnrichment) {
    return existingMarket;
  }

  // Ajouter les annonces similaires aux données de marché
  // On peut les stocker dans une nouvelle section ou les fusionner avec les transactions DVF
  return {
    ...existingMarket,
    melo: {
      similarListings: meloEnrichment.similarListings,
      marketInsights: meloEnrichment.marketInsights,
      source: meloEnrichment.source,
      fetchedAt: meloEnrichment.fetchedAt,
    },
  };
}

