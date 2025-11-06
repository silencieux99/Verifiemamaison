/**
 * Scraper SeLoger pour récupérer les annonces immobilières dans un quartier
 * Utilise l'API interne de SeLoger (plus fiable que le scraping HTML)
 */

export interface SeLogerListing {
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
  energy_class?: string;
  ges_class?: string;
  distance_m?: number; // Distance depuis l'adresse de référence
}

export interface SeLogerSearchParams {
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
 * Recherche des annonces SeLoger autour d'une adresse
 */
export async function searchSeLogerListings(
  params: SeLogerSearchParams
): Promise<SeLogerListing[]> {
  const {
    latitude,
    longitude,
    radius_m = 1000,
    propertyType = 'all',
    minPrice,
    maxPrice,
    minSurface,
    maxSurface,
    rooms,
  } = params;

  try {
    // SeLoger utilise une API interne pour les recherches
    // On va utiliser leur endpoint de recherche avec des paramètres de géolocalisation
    
    // Construction de l'URL de recherche SeLoger
    // Format: https://www.seloger.com/list.htm?types=1,2&projects=2&enterprise=0&qsVersion=1.0&LISTING-LISTpg=1
    // types: 1=appartement, 2=maison, 3=terrain, 4=local, 5=parking
    // projects: 2=vente
    
    const types = propertyType === 'appartement' ? '1' : 
                  propertyType === 'maison' ? '2' : 
                  '1,2'; // Tous les types
    
    // On va utiliser l'API de recherche géolocalisée de SeLoger
    // Note: SeLoger n'a pas d'API publique, on doit utiliser leur interface de recherche
    // On va faire une requête vers leur endpoint de recherche avec les coordonnées
    
    const searchUrl = new URL('https://www.seloger.com/list.htm');
    searchUrl.searchParams.set('types', types);
    searchUrl.searchParams.set('projects', '2'); // Vente
    searchUrl.searchParams.set('enterprise', '0');
    searchUrl.searchParams.set('qsVersion', '1.0');
    searchUrl.searchParams.set('LISTING-LISTpg', '1');
    
    // Coordonnées GPS (SeLoger utilise un format spécifique)
    // On va utiliser leur système de recherche par coordonnées
    searchUrl.searchParams.set('latitude', latitude.toString());
    searchUrl.searchParams.set('longitude', longitude.toString());
    searchUrl.searchParams.set('radius', (radius_m / 1000).toString()); // En km
    
    if (minPrice) searchUrl.searchParams.set('priceMin', minPrice.toString());
    if (maxPrice) searchUrl.searchParams.set('priceMax', maxPrice.toString());
    if (minSurface) searchUrl.searchParams.set('surfaceMin', minSurface.toString());
    if (maxSurface) searchUrl.searchParams.set('surfaceMax', maxSurface.toString());
    if (rooms) searchUrl.searchParams.set('rooms', rooms.toString());

    // Headers pour simuler un navigateur
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
      'Referer': 'https://www.seloger.com/',
    };

    console.log('🔍 Recherche SeLoger:', searchUrl.toString());

    // Tentative 1: Utiliser l'API JSON interne de SeLoger (si disponible)
    try {
      const apiUrl = `https://api.seloger.com/search/list?latitude=${latitude}&longitude=${longitude}&radius=${radius_m / 1000}&types=${types}&projects=2`;
      const apiResponse = await fetch(apiUrl, {
        headers: {
          'User-Agent': headers['User-Agent'],
          'Accept': 'application/json',
        },
      });

      if (apiResponse.ok) {
        const apiData = await apiResponse.json();
        if (apiData.listings && Array.isArray(apiData.listings)) {
          return parseSeLogerAPIResponse(apiData.listings, latitude, longitude);
        }
      }
    } catch (e) {
      console.log('⚠️ API JSON non disponible, utilisation du scraping HTML');
    }

    // Tentative 2: Scraping HTML (fallback)
    const response = await fetch(searchUrl.toString(), { headers });
    
    if (!response.ok) {
      throw new Error(`SeLoger returned ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    return parseSeLogerHTML(html, latitude, longitude, radius_m);

  } catch (error: any) {
    console.error('❌ Erreur lors de la recherche SeLoger:', error.message);
    throw new Error(`Impossible de récupérer les annonces SeLoger: ${error.message}`);
  }
}

/**
 * Parse la réponse JSON de l'API SeLoger (si disponible)
 */
function parseSeLogerAPIResponse(
  listings: any[],
  refLat: number,
  refLon: number
): SeLogerListing[] {
  return listings.map((item: any) => {
    const lat = item.latitude || item.lat;
    const lon = item.longitude || item.lon;
    const distance = lat && lon ? haversineDistance(refLat, refLon, lat, lon) : undefined;

    return {
      id: item.id?.toString() || item.reference || `seloger-${Date.now()}-${Math.random()}`,
      title: item.title || item.name || 'Annonce immobilière',
      price: item.price || item.prix || 0,
      price_m2: item.price_m2 || item.prix_m2 || (item.price && item.surface ? Math.round(item.price / item.surface) : undefined),
      surface: item.surface || item.surface_m2 || 0,
      rooms: item.rooms || item.pieces || item.nb_pieces,
      bedrooms: item.bedrooms || item.chambres || item.nb_chambres,
      type: item.type === 'appartement' || item.type === '1' ? 'appartement' :
            item.type === 'maison' || item.type === '2' ? 'maison' : 'autre',
      address: item.address || item.adresse || '',
      city: item.city || item.ville || '',
      postcode: item.postcode || item.code_postal || '',
      latitude: lat,
      longitude: lon,
      description: item.description || item.desc,
      images: item.images || item.photos || [],
      url: item.url || item.link || `https://www.seloger.com/annonces/${item.id}`,
      agency: item.agency || item.agence,
      energy_class: item.energy_class || item.classe_energie,
      ges_class: item.ges_class || item.classe_ges,
      distance_m: distance,
    };
  });
}

/**
 * Parse le HTML de la page de résultats SeLoger
 */
function parseSeLogerHTML(
  html: string,
  refLat: number,
  refLon: number,
  radius_m: number
): SeLogerListing[] {
  const listings: SeLogerListing[] = [];

  try {
    // SeLoger utilise des balises JSON-LD ou des data-attributes
    // On cherche les données structurées dans le HTML
    
    // Méthode 1: Chercher les balises script avec type="application/ld+json"
    const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis;
    const jsonLdMatches = [...html.matchAll(jsonLdRegex)];
    
    for (const match of jsonLdMatches) {
      try {
        const jsonData = JSON.parse(match[1]);
        if (jsonData['@type'] === 'Product' || jsonData['@type'] === 'RealEstateAgent') {
          // Extraire les données de l'annonce
          const listing = extractListingFromJSONLD(jsonData, refLat, refLon);
          if (listing) listings.push(listing);
        }
      } catch (e) {
        // Ignorer les erreurs de parsing JSON
      }
    }

    // Méthode 2: Chercher les data-attributes dans les divs d'annonces
    // Format SeLoger: <div class="c-pa-link" data-listing-id="..." data-price="..." ...>
    const listingRegex = /<div[^>]*class=["'][^"']*c-pa-link[^"']*["'][^>]*>(.*?)<\/div>/gis;
    const listingMatches = [...html.matchAll(listingRegex)];
    
    for (const match of listingMatches) {
      const listing = extractListingFromHTML(match[0], refLat, refLon);
      if (listing) listings.push(listing);
    }

    // Méthode 3: Chercher les scripts avec window.__INITIAL_STATE__ ou similaire
    const initialStateRegex = /window\.__INITIAL_STATE__\s*=\s*({.*?});/s;
    const initialStateMatch = html.match(initialStateRegex);
    if (initialStateMatch) {
      try {
        const state = JSON.parse(initialStateMatch[1]);
        if (state.listings || state.results) {
          const apiListings = state.listings || state.results;
          const parsed = parseSeLogerAPIResponse(apiListings, refLat, refLon);
          listings.push(...parsed);
        }
      } catch (e) {
        console.error('Erreur parsing __INITIAL_STATE__:', e);
      }
    }

    // Trier par distance et limiter au rayon
    return listings
      .filter(listing => !listing.distance_m || listing.distance_m <= radius_m)
      .sort((a, b) => (a.distance_m || Infinity) - (b.distance_m || Infinity))
      .slice(0, 20); // Limiter à 20 résultats

  } catch (error: any) {
    console.error('Erreur lors du parsing HTML SeLoger:', error.message);
    return listings;
  }
}

/**
 * Extrait une annonce depuis JSON-LD
 */
function extractListingFromJSONLD(
  data: any,
  refLat: number,
  refLon: number
): SeLogerListing | null {
  try {
    const offer = data.offers || data;
    const geo = data.geo || {};
    
    const lat = parseFloat(geo.latitude || geo.lat || '');
    const lon = parseFloat(geo.longitude || geo.lon || '');
    const distance = lat && lon ? haversineDistance(refLat, refLon, lat, lon) : undefined;

    return {
      id: data.id || data['@id'] || `seloger-${Date.now()}`,
      title: data.name || data.title || 'Annonce immobilière',
      price: parseFloat(offer.price || offer.priceValue || '0'),
      surface: parseFloat(data.floorSize?.value || data.surface || '0'),
      type: data.propertyType?.toLowerCase().includes('appartement') ? 'appartement' :
            data.propertyType?.toLowerCase().includes('maison') ? 'maison' : 'autre',
      address: data.address?.streetAddress || data.address || '',
      city: data.address?.addressLocality || '',
      postcode: data.address?.postalCode || '',
      latitude: lat || undefined,
      longitude: lon || undefined,
      url: data.url || data['@id'] || '',
      distance_m: distance,
    };
  } catch (e) {
    return null;
  }
}

/**
 * Extrait une annonce depuis un élément HTML
 */
function extractListingFromHTML(
  html: string,
  refLat: number,
  refLon: number
): SeLogerListing | null {
  try {
    // Extraire les data-attributes
    const idMatch = html.match(/data-listing-id=["']([^"']+)["']/);
    const priceMatch = html.match(/data-price=["']([^"']+)["']/);
    const surfaceMatch = html.match(/data-surface=["']([^"']+)["']/);
    const latMatch = html.match(/data-lat=["']([^"']+)["']/);
    const lonMatch = html.match(/data-lon=["']([^"']+)["']/);
    const urlMatch = html.match(/href=["']([^"']+)["']/);
    const titleMatch = html.match(/<h2[^>]*>(.*?)<\/h2>/i) || html.match(/<a[^>]*>(.*?)<\/a>/i);

    const id = idMatch?.[1] || `seloger-${Date.now()}`;
    const price = parseFloat(priceMatch?.[1]?.replace(/[^\d]/g, '') || '0');
    const surface = parseFloat(surfaceMatch?.[1]?.replace(/[^\d]/g, '') || '0');
    const lat = latMatch?.[1] ? parseFloat(latMatch[1]) : undefined;
    const lon = lonMatch?.[1] ? parseFloat(lonMatch[1]) : undefined;
    const url = urlMatch?.[1] ? (urlMatch[1].startsWith('http') ? urlMatch[1] : `https://www.seloger.com${urlMatch[1]}`) : '';
    const title = titleMatch?.[1]?.replace(/<[^>]+>/g, '').trim() || 'Annonce immobilière';

    const distance = lat && lon && refLat && refLon ? haversineDistance(refLat, refLon, lat, lon) : undefined;

    return {
      id,
      title,
      price,
      price_m2: surface > 0 ? Math.round(price / surface) : undefined,
      surface,
      type: 'autre',
      address: '',
      city: '',
      postcode: '',
      latitude: lat,
      longitude: lon,
      url,
      distance_m: distance,
    };
  } catch (e) {
    return null;
  }
}

