/**
 * Intégration avec l'API Melo pour les données immobilières on-chain
 * Documentation: https://docs.melo.io
 * 
 * Cette API permet de rechercher des propriétés et annonces immobilières
 * en temps réel pour enrichir les rapports avec des données de marché.
 */

export interface MeloProperty {
  id: string;
  address?: string;
  city?: string;
  postcode?: string;
  latitude?: number;
  longitude?: number;
  price?: number;
  surface?: number;
  rooms?: number;
  type?: string;
  energy_class?: string;
  lastCrawledAt?: string;
  raw?: any;
}

export interface MeloAdvert {
  id: string;
  propertyId: string;
  url: string;
  title?: string;
  price?: number;
  surface?: number;
  rooms?: number;
  description?: string;
  images?: string[];
  agency?: string;
  publishedAt?: string;
  updatedAt?: string;
  expiredAt?: string;
  raw?: any;
}

export interface MeloSearchParams {
  latitude: number;
  longitude: number;
  radius_m?: number; // Rayon en mètres
  minPrice?: number;
  maxPrice?: number;
  minSurface?: number;
  maxSurface?: number;
  propertyType?: 'appartement' | 'maison' | 'all';
  rooms?: number;
  limit?: number;
}

export interface MeloSearchResponse {
  properties?: MeloProperty[];
  adverts?: MeloAdvert[];
  total?: number;
  hasMore?: boolean;
  raw?: any;
}

/**
 * Configuration de l'API Melo
 */
const MELO_CONFIG = {
  // URL de base selon la documentation: https://api.notif.immo (production) ou https://preprod-api.notif.immo (sandbox)
  get baseUrl() {
    // Si une URL est explicitement définie ET qu'elle est correcte, l'utiliser
    if (process.env.MELO_API_BASE_URL && process.env.MELO_API_BASE_URL.includes('notif.immo')) {
      return process.env.MELO_API_BASE_URL;
    }
    // Sinon, utiliser l'environnement pour déterminer l'URL (par défaut production)
    const env = process.env.MELO_ENVIRONMENT || 'production';
    return env === 'sandbox' 
      ? 'https://preprod-api.notif.immo' // URL sandbox
      : 'https://api.notif.immo'; // URL production
  },
  apiKey: process.env.MELO_API_KEY,
  get environment() {
    return process.env.MELO_ENVIRONMENT || 'production'; // Par défaut production
  },
  timeout: 10000, // 10 secondes
};

/**
 * Effectue une requête à l'API Melo
 */
async function meloRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  if (!MELO_CONFIG.apiKey) {
    throw new Error('MELO_API_KEY n\'est pas configurée');
  }

  // S'assurer que l'URL de base est correcte
  let baseUrl = MELO_CONFIG.baseUrl;
  
  // FORCER la bonne URL selon l'environnement (sécurité)
  const env = MELO_CONFIG.environment;
  if (baseUrl.includes('melo.io') || !baseUrl.includes('notif.immo')) {
    console.warn(`[Melo] URL incorrecte détectée: ${baseUrl}. Correction automatique vers l'environnement ${env}.`);
    baseUrl = env === 'sandbox' 
      ? 'https://preprod-api.notif.immo'
      : 'https://api.notif.immo';
  }
  
  // Log pour débogage
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Melo] URL utilisée: ${baseUrl}${endpoint}`);
  }
  
  const url = `${baseUrl}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), MELO_CONFIG.timeout);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'X-API-KEY': MELO_CONFIG.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let errorMessage = `Melo API error: ${response.status} ${response.statusText}`;
      
      if (errorData.message) {
        errorMessage += `. ${errorData.message}`;
      }
      
      // Messages spécifiques pour les erreurs courantes
      if (response.status === 403) {
        errorMessage += ' (Vérifiez votre clé API et l\'environnement - production/sandbox)';
      } else if (response.status === 401) {
        errorMessage += ' (Clé API invalide ou expirée)';
      } else if (response.status === 404) {
        errorMessage += ' (Endpoint non trouvé - vérifiez l\'URL de base)';
      }
      
      throw new Error(errorMessage);
    }

    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Melo API timeout');
    }
    // Améliorer le message d'erreur pour les erreurs réseau
    if (error.code === 'ENOTFOUND' || error.message?.includes('getaddrinfo')) {
      throw new Error(`Melo API: Impossible de se connecter à ${baseUrl}. Vérifiez votre connexion réseau.`);
    }
    throw error;
  }
}

/**
 * Recherche des propriétés autour d'une position GPS
 * 
 * Note: Les endpoints exacts doivent être adaptés selon la documentation Melo
 * Cette fonction est une structure de base à compléter
 */
export async function searchMeloProperties(
  params: MeloSearchParams
): Promise<MeloSearchResponse> {
  try {
    // Construire les paramètres de recherche
    const searchParams = new URLSearchParams();
    
    // Coordonnées GPS
    searchParams.set('lat', params.latitude.toString());
    searchParams.set('lon', params.longitude.toString());
    
    // Rayon (convertir mètres en km si nécessaire)
    if (params.radius_m) {
      searchParams.set('radius', (params.radius_m / 1000).toString()); // ou en mètres selon l'API
    }
    
    // Filtres optionnels
    if (params.minPrice) searchParams.set('min_price', params.minPrice.toString());
    if (params.maxPrice) searchParams.set('max_price', params.maxPrice.toString());
    if (params.minSurface) searchParams.set('min_surface', params.minSurface.toString());
    if (params.maxSurface) searchParams.set('max_surface', params.maxSurface.toString());
    if (params.rooms) searchParams.set('rooms', params.rooms.toString());
    if (params.propertyType && params.propertyType !== 'all') {
      searchParams.set('property_type', params.propertyType);
    }
    if (params.limit) searchParams.set('limit', params.limit.toString());

    // Endpoint réel selon les tests: /documents/properties avec paramètres lat/lon/radius
    const endpoint = `/documents/properties?lat=${params.latitude}&lon=${params.longitude}&radius=${(params.radius_m || 2000) / 1000}${params.limit ? `&limit=${params.limit}` : ''}`;
    
    const response = await meloRequest(endpoint);
    const data = await response.json();

    // L'API retourne un format Hydra (API Platform)
    // Structure: { "@type": "hydra:Collection", "hydra:member": [...], "hydra:totalItems": ... }
    const properties = data['hydra:member'] || [];
    
    return {
      properties: properties,
      adverts: properties.flatMap((p: any) => p.adverts || []),
      total: data['hydra:totalItems'] || 0,
      hasMore: data['hydra:view']?.['hydra:next'] !== undefined,
      raw: data,
    };
  } catch (error) {
    console.error('Erreur recherche Melo:', error);
    throw error;
  }
}

/**
 * Recherche des annonces (adverts) autour d'une position GPS
 */
export async function searchMeloAdverts(
  params: MeloSearchParams
): Promise<MeloSearchResponse> {
  try {
    const searchParams = new URLSearchParams();
    searchParams.set('lat', params.latitude.toString());
    searchParams.set('lon', params.longitude.toString());
    
    if (params.radius_m) {
      searchParams.set('radius', (params.radius_m / 1000).toString());
    }
    if (params.minPrice) searchParams.set('min_price', params.minPrice.toString());
    if (params.maxPrice) searchParams.set('max_price', params.maxPrice.toString());
    if (params.minSurface) searchParams.set('min_surface', params.minSurface.toString());
    if (params.maxSurface) searchParams.set('max_surface', params.maxSurface.toString());
    if (params.rooms) searchParams.set('rooms', params.rooms.toString());
    if (params.propertyType && params.propertyType !== 'all') {
      searchParams.set('property_type', params.propertyType);
    }
    if (params.limit) searchParams.set('limit', params.limit.toString());

    // Utiliser le même endpoint que properties (les adverts sont dans les properties)
    const endpoint = `/documents/properties?lat=${params.latitude}&lon=${params.longitude}&radius=${(params.radius_m || 2000) / 1000}${params.limit ? `&limit=${params.limit}` : ''}`;
    
    const response = await meloRequest(endpoint);
    const data = await response.json();

    // Extraire les adverts de toutes les properties
    const properties = data['hydra:member'] || [];
    const adverts = properties.flatMap((p: any) => p.adverts || []);

    return {
      adverts: adverts,
      properties: properties,
      total: data['hydra:totalItems'] || 0,
      hasMore: data['hydra:view']?.['hydra:next'] !== undefined,
      raw: data,
    };
  } catch (error) {
    console.error('Erreur recherche annonces Melo:', error);
    throw error;
  }
}

/**
 * Récupère les détails d'une propriété par son ID
 */
export async function getMeloProperty(propertyId: string): Promise<MeloProperty | null> {
  try {
    const endpoint = `/documents/properties/${propertyId}`;
    const response = await meloRequest(endpoint);
    const data = await response.json();
    
    return data || null;
  } catch (error) {
    console.error('Erreur récupération propriété Melo:', error);
    return null;
  }
}

/**
 * Récupère les détails d'une annonce par son ID
 * Note: Les adverts sont accessibles via les properties
 */
export async function getMeloAdvert(advertId: string): Promise<MeloAdvert | null> {
  try {
    // Les adverts sont dans les properties, il faudrait chercher dans toutes les properties
    // ou utiliser un endpoint spécifique si disponible
    // Pour l'instant, retourner null et laisser la recherche globale gérer
    console.warn('getMeloAdvert: Les adverts doivent être récupérés via les properties');
    return null;
  } catch (error) {
    console.error('Erreur récupération annonce Melo:', error);
    return null;
  }
}

/**
 * Convertit les résultats Melo en format compatible avec PropertyListing
 * pour une intégration facile avec le système existant
 */
export function convertMeloToPropertyListing(
  meloData: MeloProperty | MeloAdvert | any, // Accepter aussi le format Hydra
  sourceLat?: number,
  sourceLon?: number
): any {
  // Gérer le format Hydra (propriété avec adverts)
  let property: any = null;
  let advert: any = null;
  
  if (meloData.adverts && Array.isArray(meloData.adverts)) {
    // C'est une propriété au format Hydra
    property = meloData;
    advert = meloData.adverts[0]; // Prendre la première annonce
  } else if ('propertyId' in meloData === false) {
    // C'est une propriété classique
    property = meloData as MeloProperty;
    advert = (meloData as any).adverts?.[0];
  } else {
    // C'est une annonce
    advert = meloData as MeloAdvert;
  }

  // Extraire les coordonnées depuis le format Hydra
  // Les coordonnées sont dans property.location.lat et property.location.lon
  let lat, lon;
  
  // Essayer différentes structures de coordonnées
  if (property?.location?.lat && property?.location?.lon) {
    // Format principal: location: { lat, lon }
    lat = property.location.lat;
    lon = property.location.lon;
  } else if (property?.coordinates && Array.isArray(property.coordinates)) {
    // Format GeoJSON [lon, lat]
    lon = property.coordinates[0];
    lat = property.coordinates[1];
  } else if (property?.location?.coordinates && Array.isArray(property.location.coordinates)) {
    lon = property.location.coordinates[0];
    lat = property.location.coordinates[1];
  } else if (property?.latitude && property?.longitude) {
    lat = property.latitude;
    lon = property.longitude;
  } else if (advert?.location?.lat && advert?.location?.lon) {
    lat = advert.location.lat;
    lon = advert.location.lon;
  } else if (advert?.coordinates && Array.isArray(advert.coordinates)) {
    lon = advert.coordinates[0];
    lat = advert.coordinates[1];
  } else if (advert?.latitude && advert?.longitude) {
    lat = advert.latitude;
    lon = advert.longitude;
  }

  // Calculer la distance si on a les coordonnées source
  let distance_m: number | undefined;
  if (sourceLat && sourceLon && lat && lon) {
    const R = 6371000; // Rayon de la Terre en mètres
    const dLat = ((lat - sourceLat) * Math.PI) / 180;
    const dLon = ((lon - sourceLon) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((sourceLat * Math.PI) / 180) *
        Math.cos((lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    distance_m = Math.round(R * c);
  }

  // Extraire les données du format Hydra
  const price = advert?.price || property?.price || 0;
  const surface = advert?.surface || property?.surface || 0;
  const pricePerMeter = advert?.pricePerMeter || (price && surface ? Math.round(price / surface) : undefined);
  const address = property?.address || advert?.address || '';
  const city = property?.city || advert?.city || '';
  const postcode = property?.postcode || advert?.postcode || '';
  
  // Déterminer le type de bien
  // propertyType peut être un nombre (1=appartement, 2=maison) ou une chaîne
  const propertyType = property?.propertyType || advert?.propertyType;
  let type: 'appartement' | 'maison' | 'autre' = 'autre';
  
  if (typeof propertyType === 'number') {
    // Format numérique: 1=appartement, 2=maison
    type = propertyType === 1 ? 'appartement' : propertyType === 2 ? 'maison' : 'autre';
  } else if (typeof propertyType === 'string') {
    // Format texte
    const propTypeLower = propertyType.toLowerCase();
    type = propTypeLower.includes('appartement') 
      ? 'appartement'
      : propTypeLower.includes('maison') || propTypeLower.includes('house')
      ? 'maison'
      : 'autre';
  }

  // Extraire les images (picturesRemote)
  const picturesRemote = advert?.picturesRemote || property?.picturesRemote || [];
  
  // Extraire le contact
  const contact = advert?.contact || property?.contact || null;
  
  return {
    id: property?.['@id']?.split('/').pop() || advert?.id || property?.id || '',
    source: 'melo' as const,
    title: advert?.title || `${type} ${address}`.trim() || 'Bien immobilier',
    price: price,
    price_m2: pricePerMeter,
    surface: surface,
    rooms: advert?.room || property?.room,
    bedrooms: advert?.bedroom || property?.bedroom,
    type: type,
    address: address,
    city: typeof city === 'object' ? city?.name || '' : city,
    postcode: postcode,
    latitude: lat,
    longitude: lon,
    description: advert?.description,
    images: advert?.images || [],
    picturesRemote: picturesRemote,
    url: advert?.url || property?.url || '',
    agency: advert?.contact?.agency || advert?.publisher?.name,
    contact: contact,
    energy_class: advert?.energyClass || property?.energyClass,
    distance_m,
    published_date: advert?.createdAt || property?.lastCrawledAt,
    raw: {
      melo: meloData,
    },
  };
}

/**
 * Vérifie si l'API Melo est configurée et disponible
 */
export function isMeloConfigured(): boolean {
  return !!MELO_CONFIG.apiKey;
}

