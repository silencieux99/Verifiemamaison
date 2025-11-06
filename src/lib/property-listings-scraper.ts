/**
 * Scraper multi-sources pour les annonces immobilières
 * Supporte: SeLoger (avec limitations), Leboncoin, PAP
 * 
 * Note: SeLoger utilise DataDome qui bloque les scrapers automatiques.
 * Pour un usage en production, considérer:
 * - Utiliser un service de proxy résidentiel
 * - Utiliser des APIs officielles si disponibles
 * - Implémenter un système de rotation d'IPs
 */

export interface PropertyListing {
  id: string;
  source: 'seloger' | 'leboncoin' | 'pap' | 'other';
  title: string;
  price: number;
  price_m2?: number;
  surface: number;
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
  agency?: string;
  energy_class?: string;
  ges_class?: string;
  distance_m?: number; // Distance depuis l'adresse de référence
  published_date?: string;
}

export interface PropertySearchParams {
  address: string;
  latitude: number;
  longitude: number;
  radius_m?: number; // Rayon de recherche en mètres (défaut: 1000m)
  propertyType?: 'appartement' | 'maison' | 'all';
  minPrice?: number;
  maxPrice?: number;
  minSurface?: number;
  maxSurface?: number;
  rooms?: number;
  sources?: ('seloger' | 'leboncoin' | 'pap')[]; // Sources à utiliser
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
 * Recherche des annonces sur Leboncoin
 * Leboncoin a une API publique plus accessible
 */
async function searchLeboncoin(
  params: PropertySearchParams
): Promise<PropertyListing[]> {
  const { latitude, longitude, radius_m = 1000, propertyType, minPrice, maxPrice, minSurface, maxSurface, rooms } = params;

  try {
    // Leboncoin utilise une API de recherche géolocalisée
    // Format: https://api.leboncoin.fr/finder/search
    const searchParams = new URLSearchParams();
    searchParams.set('category', '9'); // Immobilier
    searchParams.set('location', `${latitude},${longitude}`);
    searchParams.set('radius', (radius_m / 1000).toString()); // En km
    
    if (propertyType === 'appartement') {
      searchParams.set('real_estate_type', '1'); // Appartement
    } else if (propertyType === 'maison') {
      searchParams.set('real_estate_type', '2'); // Maison
    }
    
    if (minPrice) searchParams.set('price_min', minPrice.toString());
    if (maxPrice) searchParams.set('price_max', maxPrice.toString());
    if (minSurface) searchParams.set('square_min', minSurface.toString());
    if (maxSurface) searchParams.set('square_max', maxSurface.toString());
    if (rooms) searchParams.set('rooms', rooms.toString());

    const apiUrl = `https://api.leboncoin.fr/finder/search?${searchParams.toString()}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`Leboncoin API returned ${response.status}`);
      return [];
    }

    const data = await response.json();
    
    if (!data.ads || !Array.isArray(data.ads)) {
      return [];
    }

    return data.ads.map((ad: any) => {
      const lat = ad.location?.latitude || ad.lat;
      const lon = ad.location?.longitude || ad.lon;
      const distance = lat && lon ? haversineDistance(latitude, longitude, lat, lon) : undefined;

      return {
        id: `leboncoin-${ad.list_id || ad.id}`,
        source: 'leboncoin',
        title: ad.subject || ad.title || 'Annonce Leboncoin',
        price: parseFloat(ad.price?.[0] || ad.price || '0'),
        price_m2: ad.square && ad.price ? Math.round(parseFloat(ad.price?.[0] || ad.price) / parseFloat(ad.square)) : undefined,
        surface: parseFloat(ad.square || ad.surface || '0'),
        rooms: ad.rooms || ad.nb_rooms,
        bedrooms: ad.bedrooms || ad.nb_bedrooms,
        type: ad.real_estate_type === 1 || ad.type === 'appartement' ? 'appartement' :
              ad.real_estate_type === 2 || ad.type === 'maison' ? 'maison' : 'autre',
        address: ad.location?.address || ad.address || '',
        city: ad.location?.city || ad.city || '',
        postcode: ad.location?.zipcode || ad.postcode || '',
        latitude: lat,
        longitude: lon,
        description: ad.body || ad.description,
        images: ad.images || [],
        url: ad.url || `https://www.leboncoin.fr/${ad.category_name}/${ad.list_id || ad.id}.htm`,
        published_date: ad.first_publication_date || ad.date,
        distance_m: distance,
      };
    });

  } catch (error: any) {
    console.error('Erreur lors de la recherche Leboncoin:', error.message);
    return [];
  }
}

/**
 * Recherche des annonces sur PAP (Particulier à Particulier)
 */
async function searchPAP(
  params: PropertySearchParams
): Promise<PropertyListing[]> {
  const { latitude, longitude, radius_m = 1000, propertyType, minPrice, maxPrice, minSurface, maxSurface, rooms } = params;

  try {
    // PAP utilise une recherche par code postal et ville
    // Format: https://www.pap.fr/annonces/vente-{type}-{ville}-{code-postal}
    // Ou API: https://www.pap.fr/api/search
    
    // Extraire le code postal depuis l'adresse
    const postcodeMatch = params.address.match(/\b(\d{5})\b/);
    const postcode = postcodeMatch ? postcodeMatch[1] : '';
    
    if (!postcode) {
      return [];
    }

    // Construire l'URL de recherche PAP
    const typeParam = propertyType === 'appartement' ? 'appartements' :
                      propertyType === 'maison' ? 'maisons' : 'appartements-maisons';
    
    const searchUrl = `https://www.pap.fr/api/search?type=${typeParam}&location=${postcode}&radius=${radius_m / 1000}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`PAP API returned ${response.status}`);
      return [];
    }

    const data = await response.json();
    
    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    return data.results.map((result: any) => {
      const lat = result.latitude || result.lat;
      const lon = result.longitude || result.lon;
      const distance = lat && lon ? haversineDistance(latitude, longitude, lat, lon) : undefined;

      return {
        id: `pap-${result.id || result.reference}`,
        source: 'pap',
        title: result.title || result.name || 'Annonce PAP',
        price: parseFloat(result.price || '0'),
        price_m2: result.surface && result.price ? Math.round(parseFloat(result.price) / parseFloat(result.surface)) : undefined,
        surface: parseFloat(result.surface || result.surface_m2 || '0'),
        rooms: result.rooms || result.nb_pieces,
        bedrooms: result.bedrooms || result.nb_chambres,
        type: result.type === 'appartement' ? 'appartement' :
              result.type === 'maison' ? 'maison' : 'autre',
        address: result.address || '',
        city: result.city || result.ville || '',
        postcode: result.postcode || result.code_postal || postcode,
        latitude: lat,
        longitude: lon,
        description: result.description || result.desc,
        images: result.images || result.photos || [],
        url: result.url || `https://www.pap.fr/annonces/${result.id}`,
        published_date: result.date || result.published_date,
        distance_m: distance,
      };
    });

  } catch (error: any) {
    console.error('Erreur lors de la recherche PAP:', error.message);
    return [];
  }
}

/**
 * Recherche principale - agrège les résultats de toutes les sources
 */
export async function searchPropertyListings(
  params: PropertySearchParams
): Promise<PropertyListing[]> {
  const sources = params.sources || ['leboncoin', 'pap']; // Par défaut, éviter SeLoger à cause de DataDome
  
  const results: PropertyListing[] = [];

  // Rechercher sur chaque source en parallèle
  const searchPromises: Promise<PropertyListing[]>[] = [];

  if (sources.includes('leboncoin')) {
    searchPromises.push(searchLeboncoin(params));
  }

  if (sources.includes('pap')) {
    searchPromises.push(searchPAP(params));
  }

  // Note: SeLoger est exclu par défaut à cause de DataDome
  // Pour l'activer, il faudrait utiliser Puppeteer avec des techniques avancées de contournement

  const allResults = await Promise.allSettled(searchPromises);
  
  allResults.forEach((result) => {
    if (result.status === 'fulfilled') {
      results.push(...result.value);
    } else {
      console.warn('Erreur lors de la recherche:', result.reason);
    }
  });

  // Trier par distance et limiter au rayon
  return results
    .filter(listing => !listing.distance_m || listing.distance_m <= (params.radius_m || 1000))
    .sort((a, b) => (a.distance_m || Infinity) - (b.distance_m || Infinity))
    .slice(0, 50); // Limiter à 50 résultats
}

