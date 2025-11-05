/**
 * API d'adresse française (data.gouv.fr)
 * Utilise l'API Adresse du gouvernement français pour géocoder les adresses
 */

export interface AddressResult {
  type: string;
  version: string;
  features: AddressFeature[];
  attribution: string;
  licence: string;
  query: string;
  limit: number;
}

export interface AddressFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: [number, number];
  };
  properties: {
    label: string;
    score: number;
    housenumber?: string;
    id: string;
    type: string;
    name: string;
    postcode: string;
    citycode: string;
    x: number;
    y: number;
    city: string;
    context: string;
    importance: number;
    street?: string;
  };
}

/**
 * Recherche d'adresse via l'API Adresse du gouvernement français
 * Documentation: https://adresse.data.gouv.fr/api-doc/adresse
 */
export async function searchAddress(query: string): Promise<AddressResult | null> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://api-adresse.data.gouv.fr/search/?q=${encodedQuery}&limit=5`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Erreur lors de la recherche d\'adresse');
    }

    const data: AddressResult = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur recherche adresse:', error);
    return null;
  }
}

/**
 * Géocode une adresse complète (adresse + code postal + ville)
 */
export async function geocodeAddress(address: string, postalCode: string, city: string): Promise<AddressFeature | null> {
  try {
    const query = `${address}, ${postalCode} ${city}`;
    const result = await searchAddress(query);
    
    if (result && result.features.length > 0) {
      // Retourner le premier résultat (le plus pertinent)
      return result.features[0];
    }
    
    return null;
  } catch (error) {
    console.error('Erreur géocodage:', error);
    return null;
  }
}

/**
 * Récupère les informations détaillées d'une adresse à partir de ses coordonnées
 */
export async function reverseGeocode(lat: number, lon: number): Promise<AddressFeature | null> {
  try {
    const url = `https://api-adresse.data.gouv.fr/reverse/?lat=${lat}&lon=${lon}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Erreur lors du reverse geocoding');
    }

    const data: AddressResult = await response.json();
    if (data.features.length > 0) {
      return data.features[0];
    }
    
    return null;
  } catch (error) {
    console.error('Erreur reverse geocoding:', error);
    return null;
  }
}

