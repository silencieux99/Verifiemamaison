/**
 * Scraper Leboncoin - Utilise l'API interne de Leboncoin
 * Basé sur les recherches GitHub et l'analyse de l'API Leboncoin
 * 
 * Note: Leboncoin utilise des protections anti-bot. Ce scraper utilise
 * l'API interne de Leboncoin qui est plus accessible que le scraping HTML.
 */

export interface LeboncoinListing {
  id: string;
  list_id: number;
  title: string;
  price: number;
  price_m2?: number;
  surface?: number;
  rooms?: number;
  bedrooms?: number;
  type: 'appartement' | 'maison' | 'autre';
  address: string;
  city: string;
  postcode: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  images?: string[];
  url: string;
  published_date?: string;
  distance_m?: number;
  category_id?: number;
  category_name?: string;
}

export interface LeboncoinSearchParams {
  query?: string; // Texte de recherche
  locations?: Array<{
    locationType: 'city' | 'department' | 'region';
    label: string;
    city?: string;
    zipcode?: string;
    department?: string;
    region?: string;
    latitude?: number;
    longitude?: number;
    radius?: number; // En km
  }>;
  filters?: {
    category?: {
      id: number; // 9 = Immobilier
    };
    enums?: {
      ad_type?: string[]; // ['offer'] pour vente
      real_estate_type?: number[]; // 1=appartement, 2=maison
      square?: { min?: number; max?: number };
      price?: { min?: number; max?: number };
      rooms?: number[];
    };
  };
  limit?: number;
  offset?: number;
}

/**
 * Recherche des annonces sur Leboncoin via l'API interne
 */
export async function searchLeboncoin(
  params: LeboncoinSearchParams
): Promise<LeboncoinListing[]> {
  try {
    // L'API interne de Leboncoin utilise un endpoint spécifique
    // Format: https://api.leboncoin.fr/finder/search
    const apiUrl = 'https://api.leboncoin.fr/finder/search';

    // Construire le payload de la requête
    const payload: any = {
      limit: params.limit || 35,
      offset: params.offset || 0,
      filters: {
        category: params.filters?.category || { id: 9 }, // Immobilier
        enums: {
          ad_type: ['offer'], // Offres (ventes)
          ...params.filters?.enums,
        },
        keywords: params.query ? {
          text: params.query,
        } : undefined,
        location: params.locations ? {
          locations: params.locations.map(loc => ({
            locationType: loc.locationType,
            label: loc.label,
            city: loc.city,
            zipcode: loc.zipcode,
            department: loc.department,
            region: loc.region,
            latitude: loc.latitude,
            longitude: loc.longitude,
            radius: loc.radius || 10, // Rayon par défaut 10km
          })),
        } : undefined,
        ranges: {
          square: params.filters?.enums?.square ? {
            min: params.filters.enums.square.min,
            max: params.filters.enums.square.max,
          } : undefined,
          price: params.filters?.enums?.price ? {
            min: params.filters.enums.price.min,
            max: params.filters.enums.price.max,
          } : undefined,
        },
      },
    };

    // Nettoyer les valeurs undefined
    const cleanPayload = JSON.parse(JSON.stringify(payload));

    console.log('🔍 Recherche Leboncoin:', JSON.stringify(cleanPayload, null, 2).substring(0, 500));

    // Headers pour simuler une requête depuis le navigateur
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
      'Content-Type': 'application/json',
      'Origin': 'https://www.leboncoin.fr',
      'Referer': 'https://www.leboncoin.fr/',
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(cleanPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Leboncoin API error ${response.status}:`, errorText.substring(0, 500));
      throw new Error(`Leboncoin API returned ${response.status}: ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    
    if (!data.ads || !Array.isArray(data.ads)) {
      console.warn('⚠️ Pas d\'annonces dans la réponse Leboncoin');
      return [];
    }

    console.log(`✅ ${data.ads.length} annonce(s) trouvée(s) sur Leboncoin`);

    // Transformer les annonces au format standard
    return data.ads.map((ad: any) => {
      const location = ad.location || {};
      const coordinates = ad.coordinates || {};
      
      return {
        id: `leboncoin-${ad.list_id || ad.id}`,
        list_id: ad.list_id || ad.id,
        title: ad.subject || ad.title || 'Annonce Leboncoin',
        price: parseFloat(ad.price?.[0] || ad.price || '0'),
        price_m2: ad.square && ad.price ? 
          Math.round(parseFloat(ad.price?.[0] || ad.price) / parseFloat(ad.square)) : 
          undefined,
        surface: ad.square ? parseFloat(ad.square) : undefined,
        rooms: ad.rooms || ad.nb_rooms,
        bedrooms: ad.bedrooms || ad.nb_bedrooms,
        type: ad.real_estate_type === 1 || ad.real_estate_type === '1' ? 'appartement' :
              ad.real_estate_type === 2 || ad.real_estate_type === '2' ? 'maison' : 
              ad.type === 'appartement' ? 'appartement' :
              ad.type === 'maison' ? 'maison' : 'autre',
        address: location.address || ad.address || '',
        city: location.city || ad.city || '',
        postcode: location.zipcode || ad.zipcode || ad.postcode || '',
        latitude: coordinates.lat || location.latitude || ad.latitude,
        longitude: coordinates.lng || location.longitude || ad.longitude,
        description: ad.body || ad.description || '',
        images: ad.images || ad.photos || [],
        url: ad.url || `https://www.leboncoin.fr/${ad.category_name || 'annonces'}/${ad.list_id || ad.id}.htm`,
        published_date: ad.first_publication_date || ad.date || ad.published_date,
        category_id: ad.category_id || ad.category?.id,
        category_name: ad.category_name || ad.category?.name,
      };
    });

  } catch (error: any) {
    console.error('❌ Erreur lors de la recherche Leboncoin:', error.message);
    throw error;
  }
}

/**
 * Recherche simplifiée par coordonnées GPS
 */
export async function searchLeboncoinByLocation(
  latitude: number,
  longitude: number,
  radius_km: number = 10,
  options?: {
    propertyType?: 'appartement' | 'maison' | 'all';
    minPrice?: number;
    maxPrice?: number;
    minSurface?: number;
    maxSurface?: number;
    rooms?: number;
    limit?: number;
  }
): Promise<LeboncoinListing[]> {
  const locations = [{
    locationType: 'city' as const,
    label: 'Recherche géolocalisée',
    latitude,
    longitude,
    radius: radius_km,
  }];

  const enums: any = {
    ad_type: ['offer'],
  };

  if (options?.propertyType === 'appartement') {
    enums.real_estate_type = [1];
  } else if (options?.propertyType === 'maison') {
    enums.real_estate_type = [2];
  } else {
    enums.real_estate_type = [1, 2]; // Appartements et maisons
  }

  if (options?.minSurface || options?.maxSurface) {
    enums.square = {
      min: options.minSurface,
      max: options.maxSurface,
    };
  }

  if (options?.minPrice || options?.maxPrice) {
    enums.price = {
      min: options.minPrice,
      max: options.maxPrice,
    };
  }

  if (options?.rooms) {
    enums.rooms = [options.rooms];
  }

  return searchLeboncoin({
    locations,
    filters: {
      category: { id: 9 }, // Immobilier
      enums,
    },
    limit: options?.limit || 35,
  });
}

/**
 * Calcule la distance entre deux points GPS (Haversine)
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Rayon de la Terre en mètres
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Ajoute la distance depuis un point de référence
 */
export function addDistanceToListings(
  listings: LeboncoinListing[],
  refLat: number,
  refLon: number
): LeboncoinListing[] {
  return listings.map(listing => {
    if (listing.latitude && listing.longitude) {
      return {
        ...listing,
        distance_m: haversineDistance(refLat, refLon, listing.latitude, listing.longitude),
      };
    }
    return listing;
  });
}

