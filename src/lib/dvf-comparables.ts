/**
 * Module pour utiliser les données DVF comme comparables/annonces
 * Les données DVF sont des transactions réelles, très utiles pour comparer
 * C'est une alternative légale et fiable aux scrapers d'annonces
 */

import { HouseProfile } from './house-profile-types';

export interface DVFComparable {
  id: string;
  date: string;
  price: number;
  price_m2: number;
  surface: number;
  type: string;
  address: string;
  distance_m?: number;
  latitude?: number;
  longitude?: number;
}

/**
 * Extrait les comparables DVF depuis un HouseProfile
 * Les transactions DVF sont déjà dans profile.market.dvf.transactions
 */
export function extractDVFComparables(
  profile: HouseProfile,
  refLat: number,
  refLon: number,
  maxDistance_m: number = 2000
): DVFComparable[] {
  const comparables: DVFComparable[] = [];

  if (!profile.market?.dvf?.transactions || !Array.isArray(profile.market.dvf.transactions)) {
    return comparables;
  }

  // Calculer la distance pour chaque transaction
  profile.market.dvf.transactions.forEach((tx, index) => {
    if (!tx.price_eur || !tx.surface_m2) {
      return; // Ignorer les transactions sans prix ou surface
    }

    const lat = tx.latitude || tx.lat;
    const lon = tx.longitude || tx.lon;
    
    let distance_m: number | undefined;
    if (lat && lon) {
      distance_m = haversineDistance(refLat, refLon, lat, lon);
      
      // Filtrer par distance
      if (distance_m > maxDistance_m) {
        return;
      }
    }

    comparables.push({
      id: `dvf-${tx.id || index}`,
      date: tx.date || '',
      price: tx.price_eur,
      price_m2: tx.price_m2_eur || Math.round(tx.price_eur / tx.surface_m2),
      surface: tx.surface_m2,
      type: tx.type || 'vente',
      address: tx.address_hint || tx.address || '',
      distance_m,
      latitude: lat,
      longitude: lon,
    });
  });

  // Trier par date (plus récentes en premier) puis par distance
  return comparables.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    if (dateB !== dateA) {
      return dateB - dateA; // Plus récentes en premier
    }
    return (a.distance_m || Infinity) - (b.distance_m || Infinity);
  });
}

/**
 * Calcule la distance Haversine entre deux points GPS
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
 * Enrichit les comparables DVF avec des statistiques
 */
export function enrichDVFComparables(comparables: DVFComparable[]) {
  if (comparables.length === 0) {
    return {
      count: 0,
      avgPrice: 0,
      avgPriceM2: 0,
      minPrice: 0,
      maxPrice: 0,
      minPriceM2: 0,
      maxPriceM2: 0,
      avgSurface: 0,
      avgDistance: 0,
    };
  }

  const prices = comparables.map(c => c.price).filter(p => p > 0);
  const pricesM2 = comparables.map(c => c.price_m2).filter(p => p > 0);
  const surfaces = comparables.map(c => c.surface).filter(s => s > 0);
  const distances = comparables.map(c => c.distance_m).filter(d => d !== undefined) as number[];

  return {
    count: comparables.length,
    avgPrice: prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0,
    avgPriceM2: pricesM2.length > 0 ? Math.round(pricesM2.reduce((a, b) => a + b, 0) / pricesM2.length) : 0,
    minPrice: prices.length > 0 ? Math.min(...prices) : 0,
    maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
    minPriceM2: pricesM2.length > 0 ? Math.min(...pricesM2) : 0,
    maxPriceM2: pricesM2.length > 0 ? Math.max(...pricesM2) : 0,
    avgSurface: surfaces.length > 0 ? Math.round(surfaces.reduce((a, b) => a + b, 0) / surfaces.length) : 0,
    avgDistance: distances.length > 0 ? Math.round(distances.reduce((a, b) => a + b, 0) / distances.length) : 0,
  };
}

