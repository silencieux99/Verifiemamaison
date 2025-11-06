/**
 * Scraper Bien'ici - Site d'annonces immobilières
 * Basé sur le scraper GitHub: https://github.com/lobstrio/bieniciscraper
 * Bien'ici semble moins protégé que SeLoger/Leboncoin
 */

export interface BieniciListing {
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
  distance_m?: number;
}

export interface BieniciSearchParams {
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
 * Recherche des annonces sur Bien'ici
 */
export async function searchBienici(
  params: BieniciSearchParams
): Promise<BieniciListing[]> {
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
    // Bien'ici utilise une API de recherche
    // Format: https://www.bienici.com/recherche/achat
    // On peut aussi utiliser leur API interne
    
    // Construire l'URL de recherche
    const searchParams = new URLSearchParams();
    searchParams.set('latitude', latitude.toString());
    searchParams.set('longitude', longitude.toString());
    searchParams.set('radius', (radius_m / 1000).toString()); // En km
    
    if (propertyType === 'appartement') {
      searchParams.set('propertyType', 'apartment');
    } else if (propertyType === 'maison') {
      searchParams.set('propertyType', 'house');
    }
    
    if (minPrice) searchParams.set('minPrice', minPrice.toString());
    if (maxPrice) searchParams.set('maxPrice', maxPrice.toString());
    if (minSurface) searchParams.set('minSurface', minSurface.toString());
    if (maxSurface) searchParams.set('maxSurface', maxSurface.toString());
    if (rooms) searchParams.set('rooms', rooms.toString());

    // Essayer l'API interne de Bien'ici
    const apiUrl = `https://api.bienici.com/search?${searchParams.toString()}`;
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'fr-FR,fr;q=0.9',
      'Referer': 'https://www.bienici.com/',
    };

    console.log('🔍 Recherche Bien\'ici:', apiUrl);

    const response = await fetch(apiUrl, { headers });

    if (!response.ok) {
      // Si l'API ne fonctionne pas, essayer le scraping HTML
      console.log('⚠️ API Bien\'ici non accessible, tentative scraping HTML...');
      return searchBieniciHTML(params);
    }

    const data = await response.json();
    
    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    return data.results.map((item: any) => ({
      id: `bienici-${item.id || item.reference}`,
      title: item.title || item.name || 'Annonce Bien\'ici',
      price: parseFloat(item.price || '0'),
      price_m2: item.surface && item.price ? Math.round(parseFloat(item.price) / parseFloat(item.surface)) : undefined,
      surface: parseFloat(item.surface || '0'),
      rooms: item.rooms || item.nb_rooms,
      bedrooms: item.bedrooms || item.nb_bedrooms,
      type: item.type === 'apartment' || item.type === 'appartement' ? 'appartement' :
            item.type === 'house' || item.type === 'maison' ? 'maison' : 'autre',
      address: item.address || '',
      city: item.city || '',
      postcode: item.postcode || '',
      latitude: item.latitude || item.lat,
      longitude: item.longitude || item.lon,
      description: item.description || '',
      images: item.images || item.photos || [],
      url: item.url || `https://www.bienici.com/annonce/${item.id}`,
      agency: item.agency || item.agence,
      energy_class: item.energy_class || item.classe_energie,
    }));

  } catch (error: any) {
    console.error('Erreur lors de la recherche Bien\'ici:', error.message);
    // Fallback vers scraping HTML
    return searchBieniciHTML(params);
  }
}

/**
 * Scraping HTML de Bien'ici (fallback)
 */
async function searchBieniciHTML(
  params: BieniciSearchParams
): Promise<BieniciListing[]> {
  // Cette fonction serait implémentée avec Puppeteer si nécessaire
  // Pour l'instant, retourner un tableau vide
  console.log('⚠️ Scraping HTML Bien\'ici non implémenté');
  return [];
}

