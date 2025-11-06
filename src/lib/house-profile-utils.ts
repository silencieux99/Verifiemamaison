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
  
  // Endpoints GéoRisques
  const baseUrl = 'https://www.georisques.gouv.fr/api/v1';
  
  try {
    // 1. Inondation (PPRI)
    try {
      const floodUrl = `${baseUrl}/georisques/inondation?lat=${lat}&lon=${lon}`;
      const floodResponse = await fetchWithRetry(floodUrl, {}, 1);
      if (floodResponse.ok) {
        const floodData = await floodResponse.json();
        risks.flood = floodData;
        // Normalisation
        if (floodData?.alea) {
          const alea = floodData.alea.toLowerCase();
          risks.normalized.flood_level = alea.includes('élevé') ? 'élevé' : alea.includes('moyen') ? 'moyen' : 'faible';
        }
      }
    } catch (e) {
      // Ignore si endpoint indisponible
    }
    
    // 2. Sismicité (niveau 0-5)
    try {
      const seismicUrl = `https://www.georisques.gouv.fr/api/v1/georisques/sismicite?lat=${lat}&lon=${lon}`;
      const seismicResponse = await fetchWithRetry(seismicUrl, {}, 1);
      if (seismicResponse.ok) {
        const seismicData = await seismicResponse.json();
        risks.seismicity = seismicData;
        risks.normalized.seismic_level = seismicData?.niveau || seismicData?.zone || 0;
      }
    } catch (e) {
      // Ignore
    }
    
    // 3. Radon (zone 1, 2 ou 3)
    try {
      const radonUrl = `https://www.georisques.gouv.fr/api/v1/georisques/radon?lat=${lat}&lon=${lon}`;
      const radonResponse = await fetchWithRetry(radonUrl, {}, 1);
      if (radonResponse.ok) {
        const radonData = await radonResponse.json();
        risks.radon = radonData;
        risks.normalized.radon_zone = radonData?.zone || radonData?.potentiel || undefined;
      }
    } catch (e) {
      // Ignore
    }
    
    // 4. Retrait-gonflement des argiles
    try {
      const clayUrl = `${baseUrl}/georisques/retrait-gonflement?lat=${lat}&lon=${lon}`;
      const clayResponse = await fetchWithRetry(clayUrl, {}, 1);
      if (clayResponse.ok) {
        const clayData = await clayResponse.json();
        risks.clay_shrink_swell = clayData;
      }
    } catch (e) {
      // Ignore
    }
    
    // 5. Mouvements de terrain
    try {
      const groundUrl = `${baseUrl}/georisques/mouvements-terrain?lat=${lat}&lon=${lon}`;
      const groundResponse = await fetchWithRetry(groundUrl, {}, 1);
      if (groundResponse.ok) {
        const groundData = await groundResponse.json();
        risks.ground_movements = groundData;
      }
    } catch (e) {
      // Ignore
    }
    
    // 6. Cavités souterraines
    try {
      const cavitiesUrl = `${baseUrl}/georisques/cavites?lat=${lat}&lon=${lon}`;
      const cavitiesResponse = await fetchWithRetry(cavitiesUrl, {}, 1);
      if (cavitiesResponse.ok) {
        const cavitiesData = await cavitiesResponse.json();
        risks.cavities = cavitiesData;
      }
    } catch (e) {
      // Ignore
    }
    
    // 7. Feu de forêt
    try {
      const wildfireUrl = `${baseUrl}/georisques/feu-foret?lat=${lat}&lon=${lon}`;
      const wildfireResponse = await fetchWithRetry(wildfireUrl, {}, 1);
      if (wildfireResponse.ok) {
        const wildfireData = await wildfireResponse.json();
        risks.wildfire = wildfireData;
      }
    } catch (e) {
      // Ignore
    }
    
    // 8. Terres polluées (BASOL/BASIAS)
    try {
      const pollutedUrl = `${baseUrl}/georisques/polluted-lands?lat=${lat}&lon=${lon}`;
      const pollutedResponse = await fetchWithRetry(pollutedUrl, {}, 1);
      if (pollutedResponse.ok) {
        const pollutedData = await pollutedResponse.json();
        risks.polluted_lands = pollutedData;
      }
    } catch (e) {
      // Ignore
    }
    
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
 * Récupération du DPE via API ADEME et autres sources
 */
export async function fetchDPE(
  address: string,
  citycode: string
): Promise<HouseProfile['energy']> {
  const energy: HouseProfile['energy'] = {};
  
  try {
    // 1. Essayer API ADEME DPE (source officielle)
    try {
      const dpeUrl = `https://data.ademe.fr/data-fair/api/v1/datasets/dpe-v2-logements-existants/lines?q=${encodeURIComponent(address)}&limit=1`;
      const response = await fetchWithRetry(dpeUrl, {}, 1);
      if (response.ok) {
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          const dpe = data.results[0];
          energy.dpe = {
            id: dpe.id_dpe,
            class_energy: dpe.classe_consommation_energie || dpe.classe_consommation,
            class_ges: dpe.classe_emission_ges || dpe.classe_ges,
            date: dpe.date_etablissement_dpe || dpe.date_etablissement,
            surface_m2: dpe.surface_habitable_logement || dpe.surface_habitable,
            housing_type: dpe.type_batiment || dpe.type_logement,
            raw: dpe,
          };
          return energy;
        }
      }
    } catch (e) {
      // Continue vers la source suivante
    }
    
    // 2. Essayer API GeoRisques (peut avoir des données DPE)
    try {
      const georisquesUrl = `https://www.georisques.gouv.fr/api/v1/dpe?address=${encodeURIComponent(address)}`;
      const response = await fetchWithRetry(georisquesUrl, {}, 1);
      if (response.ok) {
        const data = await response.json();
        if (data?.dpe) {
          energy.dpe = {
            id: data.dpe.id,
            class_energy: data.dpe.classe_energie || data.dpe.class_energy,
            class_ges: data.dpe.classe_ges || data.dpe.class_ges,
            date: data.dpe.date,
            surface_m2: data.dpe.surface,
            housing_type: data.dpe.type,
            raw: data.dpe,
          };
          return energy;
        }
      }
    } catch (e) {
      // Continue
    }
    
  } catch (error) {
    // Continue
  }
  
  // Si aucune donnée trouvée, retourner un objet vide
  return energy;
}

/**
 * Récupération des transactions DVF et estimation du prix au m²
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
    // Tentative 1: API DVF de Christian Quest
    // Stratégie: rayon adaptatif et filtrage robuste des ventes
    const distances = [800, 1200, 2000];

    // Helpers locaux
    const median = (arr: number[]) => {
      if (!arr.length) return null as any;
      const a = [...arr].sort((x, y) => x - y);
      const mid = Math.floor(a.length / 2);
      return a.length % 2 ? a[mid] : Math.round((a[mid - 1] + a[mid]) / 2);
    };
    const quantile = (arr: number[], q: number) => {
      if (!arr.length) return null as any;
      const a = [...arr].sort((x, y) => x - y);
      const pos = (a.length - 1) * q;
      const base = Math.floor(pos);
      const rest = pos - base;
      if (a[base + 1] !== undefined) {
        return a[base] + rest * (a[base + 1] - a[base]);
      }
      return a[base];
    };

    let bestTransactions: any[] = [];
    for (const dist of distances) {
      const dvfUrl = `https://api.cquest.org/dvf?code_commune=${citycode}&lat=${lat}&lon=${lon}&distance=${dist}`;
      try {
        const response = await fetchWithRetry(dvfUrl, {}, 1);
        if (!response.ok) continue;
        const data = await response.json();
        market.dvf.raw = data; // garder le dernier brut
        if (!Array.isArray(data) || data.length === 0) continue;

        // Mapper et filtrer: uniquement les Ventes avec valeur/surface valides
        const mapped = data
          .filter((t: any) =>
            t.nature_mutation === 'Vente' &&
            t.date_mutation &&
            t.valeur_fonciere > 0 &&
            t.surface_reelle_bati > 0
          )
          .map((t: any) => ({
            date: t.date_mutation,
            type: t.type_local === 'Maison' ? 'maison' : (t.type_local === 'Appartement' ? 'appartement' : 'autre'),
            surface_m2: t.surface_reelle_bati,
            price_eur: t.valeur_fonciere,
            price_m2_eur: Math.round(t.valeur_fonciere / t.surface_reelle_bati),
            address_hint: (t.adresse_numero || '') + ' ' + (t.adresse_nom_voie || ''),
            raw: t,
          }));

        // Fenêtres temporelles
        const now = new Date();
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        const threeYearsAgo = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate());

        const recent3y = mapped.filter((t: any) => new Date(t.date) >= threeYearsAgo);
        const recent1y = recent3y.filter((t: any) => new Date(t.date) >= oneYearAgo);

        // Si on a assez d'échantillons 1 an, on s'arrête; sinon on continue avec un rayon plus grand
        if (recent1y.length >= 12 || (recent3y.length >= 24 && bestTransactions.length === 0)) {
          bestTransactions = mapped; // conserver l'ensemble pour stats
          break;
        } else if (recent3y.length > bestTransactions.length) {
          bestTransactions = mapped; // garder le meilleur trouvé jusque-là
        }
      } catch (e) {
        // essayer le rayon suivant
      }
    }

    if (bestTransactions.length > 0) {
      // Utiliser toutes les transactions mappées (pas de tranche à 20)
      market.dvf.transactions = bestTransactions;

      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      const threeYearsAgo = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate());

      const recent1y = bestTransactions.filter((t: any) => new Date(t.date) >= oneYearAgo);
      const recent3y = bestTransactions.filter((t: any) => new Date(t.date) >= threeYearsAgo);

      // Extraire prix/m² et supprimer valeurs aberrantes (p10-p90)
      const filterOutliers = (vals: number[]) => {
        const v = vals.filter(p => p && p > 200 && p < 50000);
        if (v.length < 5) return v; // pas assez pour quantiles
        const p10 = quantile(v, 0.10) as number;
        const p90 = quantile(v, 0.90) as number;
        return v.filter(x => x >= p10 && x <= p90);
      };

      const prices1y = filterOutliers(recent1y.map((t: any) => t.price_m2_eur));
      const prices3y = filterOutliers(recent3y.map((t: any) => t.price_m2_eur));

      if (prices1y.length > 0) {
        const med1y = median(prices1y) as number;
        market.dvf.summary = {
          price_m2_median_1y: med1y,
          volume_3y: recent3y.length,
        };

        if (prices3y.length > 0) {
          const med3y = median(prices3y) as number;
          market.dvf.summary.price_m2_median_3y = med3y;

          // Tendance simple sur 3 ans (moitié ancienne vs moitié récente)
          const sorted3y = [...prices3y].sort((a, b) => a - b);
          const half = Math.floor(sorted3y.length / 2);
          const oldMedian = median(sorted3y.slice(0, half)) as number;
          const newMedian = median(sorted3y.slice(half)) as number;
          if (oldMedian && newMedian) {
            if (newMedian > oldMedian * 1.05) market.dvf.summary.trend_label = 'hausse';
            else if (newMedian < oldMedian * 0.95) market.dvf.summary.trend_label = 'baisse';
            else market.dvf.summary.trend_label = 'stable';
          }
        }

        return market; // Succès DVF
      }
    }

    // Fallback: Estimation basée sur la localisation
    // Si pas de données DVF, on estime selon la région/ville
    const estimatedPrice = estimatePriceM2ByLocation(citycode, lat, lon);
    
    if (estimatedPrice) {
      market.dvf.summary = {
        price_m2_median_1y: estimatedPrice,
        volume_3y: 0,
        trend_label: "stable",
        estimated: true // Indiquer que c'est une estimation
      };
    }
    
  } catch (error) {
    console.error('Erreur fetchDVF:', error);
  }
  
  return market;
}

/**
 * Estime le prix au m² basé sur la localisation
 * Utilise les codes INSEE et coordonnées GPS pour estimer
 */
function estimatePriceM2ByLocation(citycode: string, lat: number, lon: number): number | null {
  // Départements (2 premiers chiffres du code commune)
  const dept = citycode.substring(0, 2);
  
  // Paris et petite couronne (75, 92, 93, 94)
  if (dept === '75') return 10000; // Paris
  if (['92', '93', '94'].includes(dept)) return 5000; // Petite couronne
  
  // Grande couronne (77, 78, 91, 95)
  if (['77', '78', '91', '95'].includes(dept)) return 3500;
  
  // Grandes métropoles
  const bigCities: Record<string, number> = {
    '69': 5500, // Lyon
    '13': 4500, // Marseille
    '06': 5000, // Nice
    '31': 4000, // Toulouse
    '33': 4500, // Bordeaux
    '44': 4000, // Nantes
    '59': 3500, // Lille
    '67': 3800, // Strasbourg
    '34': 3800, // Montpellier
    '35': 3500, // Rennes
  };
  
  if (bigCities[dept]) return bigCities[dept];
  
  // Villes moyennes et zones rurales
  return 2500;
}

/**
 * Enrichit une école avec les données Google Places (rating, etc.)
 */
async function enrichSchoolWithGooglePlaces(school: any): Promise<any> {
  // Utiliser GOOGLE_PLACES_API_KEY ou GEMINI_API_KEY comme fallback
  const googleApiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!googleApiKey || !school.gps) {
    return school; // Pas de clé API ou pas de coordonnées GPS
  }
  
  try {
    // Recherche textuelle de l'école avec type "school"
    const searchQuery = `${school.name} ${school.city || ''} ${school.postcode || ''} school`.trim();
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${googleApiKey}&language=fr&type=school`;
    
    const searchResponse = await fetchWithRetry(searchUrl, {}, 1);
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      
      if (searchData.results && searchData.results.length > 0) {
        // Prioriser les résultats avec rating
        const resultsWithRating = searchData.results.filter((r: any) => r.rating);
        const resultsToCheck = resultsWithRating.length > 0 ? resultsWithRating : searchData.results;
        
        // Trouver le résultat le plus proche (par distance)
        let bestMatch = resultsToCheck[0];
        let minDistance = Infinity;
        let bestScore = -1;
        
        for (const result of resultsToCheck) {
          if (result.geometry && school.gps) {
            const distance = haversineDistance(
              school.gps.lat,
              school.gps.lon,
              result.geometry.location.lat,
              result.geometry.location.lng
            );
            
            // Score de matching basé sur la distance et le nom
            const schoolNameLower = school.name.toLowerCase();
            const resultNameLower = result.name.toLowerCase();
            
            // Vérifier la correspondance du nom
            const nameWords = schoolNameLower.split(/\s+/).filter(w => w.length > 3);
            let nameScore = 0;
            for (const word of nameWords) {
              if (resultNameLower.includes(word)) {
                nameScore += word.length;
              }
            }
            
            // Score combiné : distance (plus petit = mieux) + correspondance nom
            // Prioriser les résultats avec rating
            const ratingBonus = result.rating ? 1000 : 0;
            const score = ratingBonus + nameScore * 10 - (distance / 10);
            
            // Accepter si distance < 500m ou nom correspond bien
            if ((distance < 500 || nameScore > 0) && score > bestScore) {
              minDistance = distance;
              bestMatch = result;
              bestScore = score;
            }
          }
        }
        
        // Si on a trouvé un match raisonnable (moins de 500m ou nom similaire)
        if (minDistance < 500 || bestMatch.name.toLowerCase().includes(school.name.toLowerCase().substring(0, 10)) || 
            school.name.toLowerCase().includes(bestMatch.name.toLowerCase().substring(0, 10))) {
          // Récupérer les détails si on a un place_id
          if (bestMatch.place_id) {
            const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${bestMatch.place_id}&fields=rating,user_ratings_total,formatted_phone_number,website&key=${googleApiKey}&language=fr`;
            
            try {
              const detailsResponse = await fetchWithRetry(detailsUrl, {}, 1);
              if (detailsResponse.ok) {
                const detailsData = await detailsResponse.json();
                
                if (detailsData.result) {
                  // Enrichir avec les données Google Places
                  return {
                    ...school,
                    rating: detailsData.result.rating,
                    rating_count: detailsData.result.user_ratings_total,
                    phone: school.phone || detailsData.result.formatted_phone_number,
                    website: school.website || detailsData.result.website,
                  };
                }
              }
            } catch (e) {
              // Si les détails échouent, utiliser au moins les données de la recherche
              console.warn('Erreur récupération détails Google Places:', e);
            }
          }
          
          // Utiliser au moins les données de la recherche (rating peut être disponible)
          if (bestMatch.rating !== undefined) {
            return {
              ...school,
              rating: bestMatch.rating,
              rating_count: bestMatch.user_ratings_total,
            };
          }
        }
      }
    }
  } catch (error) {
    // Ignore les erreurs Google Places (peut être quota, clé invalide, etc.)
    console.warn('Erreur Google Places pour école:', school.name, error);
  }
  
  return school;
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
        const schools = data.records.map((record: any) => {
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
        
        // Enrichir avec Google Places si la clé API est disponible
        const googleApiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GEMINI_API_KEY;
        if (googleApiKey) {
          // Enrichir les écoles en parallèle (avec limite pour éviter les quotas)
          const enrichedSchools = await Promise.all(
            schools.slice(0, 10).map(school => enrichSchoolWithGooglePlaces(school))
          );
          
          // Ajouter les écoles restantes sans enrichissement
          education.schools = [...enrichedSchools, ...schools.slice(10)];
        } else {
          education.schools = schools;
        }
      }
    }
  } catch (error) {
    // Continue même si indisponible
  }
  
  return education;
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
