/**
 * Utilitaires pour l'API House Profile
 * Fonctions pour interroger les différentes sources de données
 */

import { HouseProfile } from './house-profile-types';

// Cache simple en mémoire (LRU-like)
const cache = new Map<string, { data: HouseProfile; timestamp: number }>();
const CACHE_TTL = 900000; // 15 minutes en ms

// Timeout par source
const SOURCE_TIMEOUT = 10000; // 10 secondes

/**
 * Retry avec backoff exponentiel
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = 2
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), SOURCE_TIMEOUT);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok && response.status >= 500 && attempt < maxRetries) {
        // Retry sur erreur serveur
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      return response;
    } catch (error: any) {
      lastError = error;
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error(`Failed to fetch ${url} after ${maxRetries + 1} attempts`);
}

/**
 * Calcul de distance Haversine entre deux points GPS
 */
export function haversineDistance(
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
  return Math.round(R * c);
}

/**
 * Géocodage d'une adresse via API Adresse
 */
export async function geocodeAddress(
  address: string
): Promise<{
  normalized_address: string;
  lat: number;
  lon: number;
  city: string;
  postcode: string;
  citycode: string;
  department?: string;
  region?: string;
  raw?: any;
}> {
  const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(address)}&limit=1`;
  
  try {
    const response = await fetchWithRetry(url);
    const data = await response.json();
    
    if (!data.features || data.features.length === 0) {
      throw new Error('Adresse non trouvée');
    }
    
    const feature = data.features[0];
    const props = feature.properties;
    const coords = feature.geometry.coordinates;
    
    return {
      normalized_address: props.label,
      lat: coords[1],
      lon: coords[0],
      city: props.city || props.name,
      postcode: props.postcode,
      citycode: props.citycode,
      department: props.context?.split(',')[0]?.trim(),
      region: props.context?.split(',')[1]?.trim(),
      raw: feature,
    };
  } catch (error) {
    throw new Error(`Erreur géocodage: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Récupération des risques GéoRisques
 */
export async function fetchGeoRisques(
  lat: number,
  lon: number
): Promise<HouseProfile['risks']> {
  const risks: HouseProfile['risks'] = {
    normalized: {},
  };
  
  // Endpoints GéoRisques (simplifiés - à adapter selon disponibilité réelle)
  const baseUrl = 'https://www.georisques.gouv.fr/api/v1';
  
  try {
    // Inondation (simplifié)
    try {
      const floodUrl = `${baseUrl}/georisques/inondation?lat=${lat}&lon=${lon}`;
      const floodResponse = await fetchWithRetry(floodUrl, {}, 1);
      if (floodResponse.ok) {
        const floodData = await floodResponse.json();
        risks.flood = floodData;
        // Normalisation simplifiée
        risks.normalized.flood_level = floodData?.niveau || "inconnu";
      }
    } catch (e) {
      // Ignore si endpoint indisponible
    }
    
    // Sismicité (niveau 1-5)
    try {
      const seismicUrl = `https://www.georisques.gouv.fr/api/v1/georisques/sismicite?lat=${lat}&lon=${lon}`;
      const seismicResponse = await fetchWithRetry(seismicUrl, {}, 1);
      if (seismicResponse.ok) {
        const seismicData = await seismicResponse.json();
        risks.seismicity = seismicData;
        risks.normalized.seismic_level = seismicData?.niveau || undefined;
      }
    } catch (e) {
      // Ignore
    }
    
    // Radon (zone 1, 2 ou 3)
    try {
      const radonUrl = `https://www.georisques.gouv.fr/api/v1/georisques/radon?lat=${lat}&lon=${lon}`;
      const radonResponse = await fetchWithRetry(radonUrl, {}, 1);
      if (radonResponse.ok) {
        const radonData = await radonResponse.json();
        risks.radon = radonData;
        risks.normalized.radon_zone = radonData?.zone || undefined;
      }
    } catch (e) {
      // Ignore
    }
    
    // Note: Les autres risques (argiles, cavités, etc.) suivent le même pattern
    // Ici on fait une version simplifiée pour la démo
    
  } catch (error) {
    // Continue même si certaines sources échouent
  }
  
  return risks;
}

/**
 * Récupération du PLU via Géoportail de l'Urbanisme
 */
export async function fetchGPU(
  citycode: string,
  lat: number,
  lon: number
): Promise<HouseProfile['urbanism']> {
  const urbanism: HouseProfile['urbanism'] = {};
  
  try {
    // API Géoportail de l'Urbanisme (simplifié)
    const gpuUrl = `https://www.geoportail-urbanisme.gouv.fr/api/communes/${citycode}/plu`;
    
    try {
      const response = await fetchWithRetry(gpuUrl, {}, 1);
      if (response.ok) {
        const data = await response.json();
        urbanism.raw = data;
        
        // Extraction du zonage (simplifié)
        if (data.zonage) {
          urbanism.zoning = data.zonage.map((zone: any) => ({
            code: zone.code || zone.type,
            label: zone.libelle || zone.nom,
            doc_url: zone.doc_url || zone.url,
          }));
        }
      }
    } catch (e) {
      // Ignore si indisponible
    }
  } catch (error) {
    // Continue
  }
  
  return urbanism;
}

/**
 * Récupération du DPE via API ADEME (simplifié)
 */
export async function fetchDPE(
  address: string,
  citycode: string
): Promise<HouseProfile['energy']> {
  const energy: HouseProfile['energy'] = {};
  
  try {
    // API ADEME DPE (exemple - à adapter selon l'API réelle)
    // Note: L'API publique DPE peut nécessiter des recherches par adresse ou coordonnées
    const dpeUrl = `https://data.ademe.fr/data-fair/api/v1/datasets/dpe-v2-logements-existants/lines?q=${encodeURIComponent(address)}&limit=1`;
    
    try {
      const response = await fetchWithRetry(dpeUrl, {}, 1);
      if (response.ok) {
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          const dpe = data.results[0];
          energy.dpe = {
            id: dpe.id_dpe,
            class_energy: dpe.classe_consommation_energie,
            class_ges: dpe.classe_emission_ges,
            date: dpe.date_etablissement_dpe,
            surface_m2: dpe.surface_habitable_logement,
            housing_type: dpe.type_batiment,
            raw: dpe,
          };
        }
      }
    } catch (e) {
      // Ignore si indisponible
    }
  } catch (error) {
    // Continue
  }
  
  return energy;
}

/**
 * Récupération des transactions DVF
 */
export async function fetchDVF(
  lat: number,
  lon: number,
  citycode: string
): Promise<HouseProfile['market']> {
  const market: HouseProfile['market'] = {
    dvf: {},
  };
  
  try {
    // API DVF (simplifié - peut nécessiter des coordonnées ou code INSEE)
    // Note: L'API DVF réelle peut avoir des limitations
    const dvfUrl = `https://api.cquest.org/dvf?code_commune=${citycode}&lat=${lat}&lon=${lon}&distance=500`;
    
    try {
      const response = await fetchWithRetry(dvfUrl, {}, 1);
      if (response.ok) {
        const data = await response.json();
        market.dvf.raw = data;
        
        if (Array.isArray(data)) {
          const transactions = data
            .filter((t: any) => t.date_mutation && t.valeur_fonciere && t.surface_reelle_bati)
            .map((t: any) => ({
              date: t.date_mutation,
              type: t.nature_mutation === 'Vente' ? (t.type_local === 'Maison' ? 'maison' : 'appartement') : 'autre',
              surface_m2: t.surface_reelle_bati,
              price_eur: t.valeur_fonciere,
              price_m2_eur: Math.round(t.valeur_fonciere / t.surface_reelle_bati),
              address_hint: t.adresse_numero + ' ' + t.adresse_nom_voie,
              raw: t,
            }))
            .slice(0, 20); // Limiter à 20 transactions
          
          market.dvf.transactions = transactions;
          
          // Calcul du résumé
          if (transactions.length > 0) {
            const now = new Date();
            const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            const threeYearsAgo = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate());
            
            const recent1y = transactions.filter((t: any) => new Date(t.date) >= oneYearAgo);
            const recent3y = transactions.filter((t: any) => new Date(t.date) >= threeYearsAgo);
            
            const prices1y = recent1y.map((t: any) => t.price_m2_eur).filter((p: any) => p);
            const prices3y = recent3y.map((t: any) => t.price_m2_eur).filter((p: any) => p);
            
            if (prices1y.length > 0) {
              prices1y.sort((a, b) => a - b);
              market.dvf.summary = {
                price_m2_median_1y: prices1y[Math.floor(prices1y.length / 2)],
                volume_3y: recent3y.length,
              };
              
              if (prices3y.length > 0) {
                prices3y.sort((a, b) => a - b);
                market.dvf.summary.price_m2_median_3y = prices3y[Math.floor(prices3y.length / 2)];
                
                // Tendance simple
                const oldPrices = prices3y.slice(0, Math.floor(prices3y.length / 2));
                const newPrices = prices3y.slice(Math.floor(prices3y.length / 2));
                if (oldPrices.length > 0 && newPrices.length > 0) {
                  const oldMedian = oldPrices[Math.floor(oldPrices.length / 2)];
                  const newMedian = newPrices[Math.floor(newPrices.length / 2)];
                  if (newMedian > oldMedian * 1.05) {
                    market.dvf.summary.trend_label = "hausse";
                  } else if (newMedian < oldMedian * 0.95) {
                    market.dvf.summary.trend_label = "baisse";
                  } else {
                    market.dvf.summary.trend_label = "stable";
                  }
                }
              }
            }
          }
        }
      }
    } catch (e) {
      // Ignore si indisponible
    }
  } catch (error) {
    // Continue
  }
  
  return market;
}

/**
 * Récupération des écoles via API Education nationale
 */
export async function fetchSchools(
  lat: number,
  lon: number,
  radius_m: number
): Promise<HouseProfile['education']> {
  const education: HouseProfile['education'] = {
    schools: [],
  };
  
  try {
    const url = `https://data.education.gouv.fr/api/records/1.0/search/?dataset=fr-en-annuaire-education&geofilter.distance=${lat},${lon},${radius_m}&rows=10`;
    
    const response = await fetchWithRetry(url, {}, 1);
    if (response.ok) {
      const data = await response.json();
      
      if (data.records && Array.isArray(data.records)) {
        education.schools = data.records.map((record: any) => {
          const fields = record.fields || {};
          const geo = record.geometry?.coordinates || [];
          
          return {
            name: fields.appellation_officielle || fields.nom_etablissement || 'École',
            kind: fields.type_etablissement?.toLowerCase() || 'autre',
            public_private: fields.statut_public_prive?.toLowerCase() || undefined,
            address: fields.adresse_1 || fields.adresse_2,
            postcode: fields.code_postal,
            city: fields.commune,
            phone: fields.telephone,
            website: fields.web,
            gps: geo.length >= 2 ? { lat: geo[1], lon: geo[0] } : undefined,
            distance_m: geo.length >= 2 ? haversineDistance(lat, lon, geo[1], geo[0]) : undefined,
            raw: record,
          };
        });
      }
    }
  } catch (error) {
    // Continue même si indisponible
  }
  
  return education;
}

/**
 * Récupération de la connectivité ARCEP
 */
export async function fetchArcep(
  lat: number,
  lon: number
): Promise<HouseProfile['connectivity']> {
  const connectivity: HouseProfile['connectivity'] = {};
  
  try {
    // API ARCEP "Ma Connexion Internet" (simplifié)
    const arcepUrl = `https://www.arcep.fr/api/ma-connexion-internet?lat=${lat}&lon=${lon}`;
    
    try {
      const response = await fetchWithRetry(arcepUrl, {}, 1);
      if (response.ok) {
        const data = await response.json();
        connectivity.raw = data;
        
        // Normalisation
        connectivity.fiber_available = data.fibre_ftth || data.fibre_ftte || false;
        connectivity.down_max_mbps = data.debit_max || data.debit_descendant_max;
        connectivity.up_max_mbps = data.debit_remontant_max;
        connectivity.technologies = data.technologies || [];
      }
    } catch (e) {
      // Ignore si indisponible
    }
  } catch (error) {
    // Continue
  }
  
  return connectivity;
}

/**
 * Récupération de la qualité de l'air ATMO
 */
export async function fetchAtmo(
  citycode: string
): Promise<HouseProfile['air_quality']> {
  const airQuality: HouseProfile['air_quality'] = {};
  
  try {
    // API ATMO (simplifié - peut nécessiter des coordonnées)
    const atmoUrl = `https://api.atmo-france.org/api/indices/${citycode}`;
    
    try {
      const response = await fetchWithRetry(atmoUrl, {}, 1);
      if (response.ok) {
        const data = await response.json();
        airQuality.raw = data;
        
        airQuality.index_today = data.indice || data.valeur;
        airQuality.label = data.qualificatif || data.libelle;
      }
    } catch (e) {
      // Ignore si indisponible
    }
  } catch (error) {
    // Continue
  }
  
  return airQuality;
}

/**
 * Récupération des commodités via Overpass (OpenStreetMap)
 */
export async function fetchOSMAmenities(
  lat: number,
  lon: number,
  radius_m: number
): Promise<HouseProfile['amenities']> {
  const amenities: HouseProfile['amenities'] = {};
  
  try {
    // Overpass API query
    const overpassUrl = 'https://overpass-api.de/api/interpreter';
    const query = `
      [out:json][timeout:25];
      (
        node["shop"="supermarket"](around:${radius_m},${lat},${lon});
        node["amenity"="bus_station"](around:${radius_m},${lat},${lon});
        node["amenity"="subway_entrance"](around:${radius_m},${lat},${lon});
        node["railway"="station"](around:${radius_m},${lat},${lon});
        node["leisure"="park"](around:${radius_m},${lat},${lon});
      );
      out;
    `;
    
    try {
      const response = await fetchWithRetry(overpassUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
      }, 1);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.elements && Array.isArray(data.elements)) {
          const supermarkets: any[] = [];
          const transit: any[] = [];
          const parks: any[] = [];
          
          data.elements.forEach((element: any) => {
            const tags = element.tags || {};
            const item = {
              name: tags.name || tags['name:fr'],
              distance_m: haversineDistance(lat, lon, element.lat, element.lon),
              gps: { lat: element.lat, lon: element.lon },
              raw: element,
            };
            
            if (tags.shop === 'supermarket') {
              supermarkets.push(item);
            } else if (tags.amenity === 'bus_station' || tags.amenity === 'subway_entrance' || tags.railway === 'station') {
              transit.push({ ...item, type: tags.railway || tags.amenity });
            } else if (tags.leisure === 'park') {
              parks.push(item);
            }
          });
          
          amenities.supermarkets = supermarkets.slice(0, 5).sort((a, b) => a.distance_m - b.distance_m);
          amenities.transit = transit.slice(0, 5).sort((a, b) => a.distance_m - b.distance_m);
          amenities.parks = parks.slice(0, 5).sort((a, b) => a.distance_m - b.distance_m);
        }
      }
    } catch (e) {
      // Ignore si indisponible
    }
  } catch (error) {
    // Continue
  }
  
  return amenities;
}

/**
 * Récupération des données de sécurité SSMSI (niveau communal)
 */
export async function fetchSafetySSMSI(
  citycode: string
): Promise<HouseProfile['safety']> {
  const safety: HouseProfile['safety'] = {
    scope: 'commune',
    city: '',
    citycode,
    period: { from: '2015', to: new Date().getFullYear().toString() },
    indicators: [],
    notes: [
      'Données au niveau communal uniquement. Ne pas attribuer à une adresse précise.',
      'Comparaison avec taux national à titre indicatif.',
    ],
  };
  
  try {
    // API SSMSI / data.gouv (simplifié - à adapter selon disponibilité réelle)
    // Note: Les données de sécurité peuvent nécessiter des APIs spécifiques
    const ssmsiUrl = `https://www.data.gouv.fr/api/1/datasets/securite-commune-${citycode}`;
    
    try {
      const response = await fetchWithRetry(ssmsiUrl, {}, 1);
      if (response.ok) {
        const data = await response.json();
        safety.raw = data;
        
        // Extraction simplifiée (à adapter selon structure réelle)
        if (data.indicators) {
          safety.indicators = data.indicators.map((ind: any) => ({
            category: ind.categorie,
            total_10y: ind.total_10ans,
            rate_local_per_10k: ind.taux_local,
            rate_national_per_10k: ind.taux_national,
            level_vs_national: 
              ind.taux_local < ind.taux_national * 0.75 ? 'faible' :
              ind.taux_local > ind.taux_national * 1.25 ? 'élevé' : 'moyen',
            series: ind.series,
          }));
        }
      }
    } catch (e) {
      // Ignore si indisponible - on retourne quand même la structure
    }
  } catch (error) {
    // Continue
  }
  
  return safety;
}

/**
 * Génération des recommandations basées sur les données collectées
 */
export function computeRecommendations(profile: Partial<HouseProfile>): HouseProfile['recommendations'] {
  const items: HouseProfile['recommendations']['items'] = [];
  const reasons: string[] = [];
  
  // Analyse DPE
  if (profile.energy?.dpe?.class_energy) {
    const dpeClass = profile.energy.dpe.class_energy;
    if (['D', 'E', 'F', 'G'].includes(dpeClass)) {
      items.push({
        title: 'Améliorer l\'isolation',
        reason: `DPE ${dpeClass} - Performance énergétique à améliorer`,
        priority: 1,
        related_sections: ['energy.dpe'],
      });
      reasons.push(`DPE ${dpeClass}`);
    }
  }
  
  // Analyse radon
  if (profile.risks?.normalized?.radon_zone && profile.risks.normalized.radon_zone >= 2) {
    items.push({
      title: 'Vérifier le radon',
      reason: `Zone radon ${profile.risks.normalized.radon_zone} - Mesure recommandée`,
      priority: 1,
      related_sections: ['risks.radon'],
    });
    reasons.push('risque radon');
  }
  
  // Analyse inondation
  if (profile.risks?.normalized?.flood_level === 'élevé') {
    items.push({
      title: 'Vérifier l\'assurance inondation',
      reason: 'Risque inondation élevé dans la zone',
      priority: 1,
      related_sections: ['risks.flood'],
    });
    reasons.push('risque inondation');
  }
  
  // Analyse PLU
  if (profile.urbanism?.zoning && profile.urbanism.zoning.length > 0) {
    items.push({
      title: 'Consulter le PLU avant travaux',
      reason: 'Zonage PLU spécifique identifié',
      priority: 2,
      related_sections: ['urbanism'],
    });
  }
  
  // Analyse connectivité
  if (profile.connectivity?.fiber_available === false) {
    items.push({
      title: 'Vérifier les options internet',
      reason: 'Fibre non disponible - alternatives à considérer',
      priority: 2,
      related_sections: ['connectivity'],
    });
  }
  
  // Analyse marché
  if (profile.market?.dvf?.summary?.trend_label === 'hausse') {
    reasons.push('marché en hausse');
  }
  
  const summary = reasons.length > 0
    ? `Quartier avec ${reasons.join(', ')}. ${items.length > 0 ? 'Vérifications recommandées: ' + items.map(i => i.title).join(', ') : ''}`
    : 'Bien analysé - aucune recommandation prioritaire basée sur les données disponibles.';
  
  return {
    summary,
    items: items.slice(0, 5), // Limiter à 5 recommandations
  };
}

/**
 * Hash pour la clé de cache
 */
function cacheKey(address: string, radius_m: number): string {
  return `${address.toLowerCase().trim()}|${radius_m}`;
}

/**
 * Vérification du cache
 */
export function getCachedProfile(
  address: string,
  radius_m: number
): HouseProfile | null {
  const key = cacheKey(address, radius_m);
  const cached = cache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  if (cached) {
    cache.delete(key);
  }
  
  return null;
}

/**
 * Mise en cache d'un profil
 */
export function setCachedProfile(
  address: string,
  radius_m: number,
  profile: HouseProfile
): void {
  const key = cacheKey(address, radius_m);
  cache.set(key, {
    data: profile,
    timestamp: Date.now(),
  });
  
  // Nettoyer le cache si trop grand (max 100 entrées)
  if (cache.size > 100) {
    const firstKey = cache.keys().next().value;
    if (firstKey) {
      cache.delete(firstKey);
    }
  }
}

