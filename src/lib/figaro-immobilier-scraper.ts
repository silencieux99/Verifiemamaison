/**
 * Scraper Le Figaro Immobilier
 * Basé sur les scrapers disponibles sur Apify
 * Le Figaro Immobilier semble accessible
 */

export interface FigaroListing {
  id: string;
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
  distance_m?: number;
}

export interface FigaroSearchParams {
  address: string;
  latitude: number;
  longitude: number;
  radius_m?: number;
  propertyType?: 'appartement' | 'maison' | 'all';
  minPrice?: number;
  maxPrice?: number;
  minSurface?: number;
  maxSurface?: number;
  rooms?: number;
}

/**
 * Recherche des annonces sur Le Figaro Immobilier
 */
export async function searchFigaroImmobilier(
  params: FigaroSearchParams
): Promise<FigaroListing[]> {
  const {
    latitude,
    longitude,
    radius_m = 2000,
    propertyType = 'all',
    minPrice,
    maxPrice,
    minSurface,
    maxSurface,
    rooms,
  } = params;

  try {
    // Le Figaro Immobilier utilise une recherche par localisation
    // Format: https://immobilier.lefigaro.fr/annonces/vente
    // On peut construire une URL de recherche avec les paramètres
    
    const searchParams = new URLSearchParams();
    searchParams.set('lat', latitude.toString());
    searchParams.set('lng', longitude.toString());
    searchParams.set('radius', (radius_m / 1000).toString());
    
    if (propertyType === 'appartement') {
      searchParams.set('type', 'appartement');
    } else if (propertyType === 'maison') {
      searchParams.set('type', 'maison');
    }
    
    if (minPrice) searchParams.set('prixMin', minPrice.toString());
    if (maxPrice) searchParams.set('prixMax', maxPrice.toString());
    if (minSurface) searchParams.set('surfaceMin', minSurface.toString());
    if (maxSurface) searchParams.set('surfaceMax', maxSurface.toString());
    if (rooms) searchParams.set('pieces', rooms.toString());

    const searchUrl = `https://immobilier.lefigaro.fr/annonces/vente?${searchParams.toString()}`;
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9',
      'Referer': 'https://immobilier.lefigaro.fr/',
    };

    console.log('🔍 Recherche Le Figaro Immobilier:', searchUrl);

    const response = await fetch(searchUrl, { headers });

    if (!response.ok) {
      throw new Error(`Le Figaro Immobilier returned ${response.status}`);
    }

    const html = await response.text();
    
    // Parser le HTML pour extraire les annonces
    // Le Figaro utilise probablement des données JSON dans le HTML
    return parseFigaroHTML(html, latitude, longitude, radius_m);

  } catch (error: any) {
    console.error('Erreur lors de la recherche Le Figaro Immobilier:', error.message);
    return [];
  }
}

/**
 * Parse le HTML de Le Figaro Immobilier
 */
function parseFigaroHTML(
  html: string,
  refLat: number,
  refLon: number,
  radius_m: number
): FigaroListing[] {
  const listings: FigaroListing[] = [];

  try {
    // Chercher les données JSON dans le HTML
    // Le Figaro peut utiliser window.__INITIAL_STATE__ ou similaire
    const jsonMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({.*?});/s);
    if (jsonMatch) {
      try {
        const state = JSON.parse(jsonMatch[1]);
        if (state.listings || state.ads || state.results) {
          const ads = state.listings || state.ads || state.results || [];
          return ads.map((ad: any) => parseFigaroAd(ad, refLat, refLon));
        }
      } catch (e) {
        console.error('Erreur parsing __INITIAL_STATE__:', e);
      }
    }

    // Chercher les balises JSON-LD
    const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis;
    const jsonLdMatches = [...html.matchAll(jsonLdRegex)];
    
    for (const match of jsonLdMatches) {
      try {
        const jsonData = JSON.parse(match[1]);
        if (jsonData['@type'] === 'Product' || jsonData['@type'] === 'RealEstateListing') {
          const listing = parseFigaroAd(jsonData, refLat, refLon);
          if (listing) listings.push(listing);
        }
      } catch (e) {
        // Ignorer
      }
    }

  } catch (error: any) {
    console.error('Erreur lors du parsing HTML Le Figaro:', error.message);
  }

  return listings;
}

/**
 * Parse une annonce Le Figaro
 */
function parseFigaroAd(
  ad: any,
  refLat: number,
  refLon: number
): FigaroListing | null {
  try {
    const lat = ad.latitude || ad.lat || ad.location?.latitude;
    const lon = ad.longitude || ad.lon || ad.location?.longitude;
    
    return {
      id: `figaro-${ad.id || ad.reference || Date.now()}`,
      title: ad.title || ad.name || ad.subject || 'Annonce Le Figaro',
      price: parseFloat(ad.price || ad.prix || '0'),
      price_m2: ad.surface && ad.price ? Math.round(parseFloat(ad.price) / parseFloat(ad.surface)) : undefined,
      surface: parseFloat(ad.surface || ad.surface_m2 || '0'),
      rooms: ad.rooms || ad.pieces || ad.nb_pieces,
      bedrooms: ad.bedrooms || ad.chambres || ad.nb_chambres,
      type: ad.type === 'appartement' ? 'appartement' :
            ad.type === 'maison' ? 'maison' : 'autre',
      address: ad.address || ad.adresse || '',
      city: ad.city || ad.ville || '',
      postcode: ad.postcode || ad.code_postal || '',
      latitude: lat,
      longitude: lon,
      description: ad.description || ad.desc || '',
      images: ad.images || ad.photos || [],
      url: ad.url || ad.link || '',
      agency: ad.agency || ad.agence,
    };
  } catch (e) {
    return null;
  }
}

