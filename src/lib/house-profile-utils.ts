/**
 * Utilitaires pour l'API House Profile
 * Fonctions pour interroger les différentes sources de données
 */

import { HouseProfile, HouseProfilePappers } from './house-profile-types';

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
    const dvfUrl = `https://api.cquest.org/dvf?code_commune=${citycode}&lat=${lat}&lon=${lon}&distance=1000`;
    
    try {
      const response = await fetchWithRetry(dvfUrl, {}, 1);
      if (response.ok) {
        const data = await response.json();
        market.dvf.raw = data;
        
        if (Array.isArray(data) && data.length > 0) {
          const transactions = data
            .filter((t: any) => 
              t.date_mutation && 
              t.valeur_fonciere && 
              t.surface_reelle_bati &&
              t.valeur_fonciere > 0 &&
              t.surface_reelle_bati > 0
            )
            .map((t: any) => ({
              date: t.date_mutation,
              type: t.nature_mutation === 'Vente' ? (t.type_local === 'Maison' ? 'maison' : 'appartement') : 'autre',
              surface_m2: t.surface_reelle_bati,
              price_eur: t.valeur_fonciere,
              price_m2_eur: Math.round(t.valeur_fonciere / t.surface_reelle_bati),
              address_hint: (t.adresse_numero || '') + ' ' + (t.adresse_nom_voie || ''),
              raw: t,
            }))
            .slice(0, 20);
          
          market.dvf.transactions = transactions;
          
          // Calcul du résumé
          if (transactions.length > 0) {
            const now = new Date();
            const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            const threeYearsAgo = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate());
            
            const recent1y = transactions.filter((t: any) => new Date(t.date) >= oneYearAgo);
            const recent3y = transactions.filter((t: any) => new Date(t.date) >= threeYearsAgo);
            
            const prices1y = recent1y.map((t: any) => t.price_m2_eur).filter((p: any) => p && p > 100 && p < 50000);
            const prices3y = recent3y.map((t: any) => t.price_m2_eur).filter((p: any) => p && p > 100 && p < 50000);
            
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
              
              return market; // Succès, on retourne les données DVF
            }
          }
        }
      }
    } catch (e) {
      console.log('API DVF non disponible, utilisation de l\'estimation');
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
  
  // Analyse Pappers - Propriétaires
  if (profile.pappers?.owners && profile.pappers.owners.length > 0) {
    const personneMorale = profile.pappers.owners.some((o) => o.type === 'personne_morale');
    if (personneMorale) {
      items.push({
        title: 'Vérifier le propriétaire (SCI/Promoteur)',
        reason: 'Propriétaire personne morale identifié via Pappers',
        priority: 2,
        related_sections: ['pappers'],
      });
    }
  }
  
  // Analyse Pappers - Copropriété
  if (profile.pappers?.coproprietes && profile.pappers.coproprietes.length > 0) {
    items.push({
      title: 'Consulter les règles de copropriété',
      reason: 'Copropriété identifiée via Pappers',
      priority: 2,
      related_sections: ['pappers'],
    });
  }
  
  // Analyse Pappers - Fonds de commerce
  if (profile.pappers?.fonds_de_commerce && profile.pappers.fonds_de_commerce.length > 0) {
    items.push({
      title: 'Vérifier les contraintes commerciales',
      reason: 'Local commercial / Fonds de commerce identifié',
      priority: 2,
      related_sections: ['pappers'],
    });
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

/**
 * Récupération des données Pappers Immobilier
 * API gratuite pour les données immobilières
 */
export async function fetchPappers(
  address: string,
  lat: number,
  lon: number,
  citycode: string
): Promise<HouseProfilePappers> {
  const pappers: HouseProfilePappers = {};
  
  // Clé API Pappers Immo
  const apiKey = process.env.PAPPERS_IMMO_API_KEY || '26ea0f0d8ab7efb4541df9e4fb5ed7a784400bb9df8433b4';
  
  try {
    // API Pappers Immobilier - Documentation officielle
    // URL: https://api-immobilier.pappers.fr/v1/parcelles
    // Paramètre adresse pour rechercher par adresse
    // Paramètre bases pour sélectionner les données (proprietaires, ventes, batiments, dpe, occupants, permis, fonds_de_commerce, coproprietes)
    const baseUrl = 'https://api-immobilier.pappers.fr/v1';
    const params = new URLSearchParams({
      adresse: address,
      bases: 'proprietaires,ventes,batiments,dpe,occupants,permis,fonds_de_commerce,coproprietes',
      par_page: '1', // Limiter à 1 résultat pour l'adresse exacte
      champs_supplementaires: 'adresse', // Inclure les adresses complètes
    });
    
    const url = `${baseUrl}/parcelles?${params.toString()}`;
    
    const response = await fetchWithRetry(url, {
      method: 'GET',
      headers: {
        'api-key': apiKey,
        'Accept': 'application/json',
      },
    }, 1);
    
    if (!response.ok) {
      // Si la requête échoue, on retourne un objet vide
      console.warn(`Pappers Immo API error: ${response.status} ${response.statusText}`);
      return {};
    }
    
    const data = await response.json();
    pappers.raw = data;
    
    // L'API retourne un objet avec un champ 'resultats' qui est un tableau
    // ou directement un tableau, ou un objet ParcelleFiche
    let parcelle = null;
    
    if (Array.isArray(data)) {
      parcelle = data.length > 0 ? data[0] : null;
    } else if (data.resultats && Array.isArray(data.resultats)) {
      parcelle = data.resultats.length > 0 ? data.resultats[0] : null;
    } else if (data.numero) {
      // C'est directement un objet ParcelleFiche
      parcelle = data;
    }
    
    if (!parcelle) {
      // Aucune parcelle trouvée pour cette adresse
      return {};
    }
    
    // Extraction des données selon la structure de l'API Pappers Immobilier
    // Structure basée sur la documentation OpenAPI
    
    // Informations cadastrales de base (avec toutes les données)
    if (parcelle.numero) {
      pappers.cadastral = {
        parcel: parcelle.numero,
        section: parcelle.section,
        prefixe: parcelle.prefixe,
        numero_plan: parcelle.numero_plan,
        surface_m2: parcelle.contenance,
        references: parcelle.numero ? [parcelle.numero] : [],
        autres_adresses: parcelle.autres_adresses?.map((a: any) => ({
          adresse: a.adresse,
          sources: a.sources || [],
        })),
      };
    }
    
    // TOUS les propriétaires (pas seulement le premier)
    if (parcelle.proprietaires && Array.isArray(parcelle.proprietaires) && parcelle.proprietaires.length > 0) {
      pappers.owners = parcelle.proprietaires.map((owner: any) => {
        // Extraire le nom depuis différentes sources possibles
        let name = owner.denomination || owner.nom_entreprise;
        if (!name && (owner.nom || owner.prenom)) {
          name = `${owner.prenom || ''} ${owner.nom || ''}`.trim();
        }
        
        return {
          name: name,
          type: owner.siren ? 'personne_morale' : 'personne_physique',
          company_name: owner.denomination || owner.nom_entreprise,
          siren: owner.siren,
          siret: owner.siret,
          legal_form: owner.categorie_juridique,
          address: owner.adresse || owner.siege?.adresse_ligne_1 || 
                   (owner.siege ? `${owner.siege.adresse_ligne_1 || ''} ${owner.siege.code_postal || ''} ${owner.siege.ville || ''}`.trim() : undefined),
          code_naf: owner.code_naf || owner.activite_principale,
          effectif: owner.tranche_effectif,
          raw: owner,
        };
      });
      
      // Garder aussi le premier pour compatibilité
      pappers.owner = pappers.owners[0];
    }
    
    // TOUTES les ventes / Transactions (avec tous les détails)
    if (parcelle.ventes && Array.isArray(parcelle.ventes) && parcelle.ventes.length > 0) {
      pappers.transactions = parcelle.ventes.map((v: any) => ({
        id: v.id,
        date: v.date,
        type: v.type_local || v.nature,
        price_eur: v.valeur_fonciere,
        surface_m2: v.surface_reelle_bati,
        price_m2_eur: v.valeur_fonciere && v.surface_reelle_bati 
          ? Math.round(v.valeur_fonciere / v.surface_reelle_bati) 
          : undefined,
        nature: v.nature,
        nombre_pieces: v.nombre_pieces,
        nombre_lots: v.nombre_lots,
        surface_terrain: v.surface_terrain,
        address: v.adresse,
        raw: v,
      }));
    }
    
    // TOUTES les copropriétés
    if (parcelle.coproprietes && Array.isArray(parcelle.coproprietes) && parcelle.coproprietes.length > 0) {
      pappers.coproprietes = parcelle.coproprietes.map((copro: any) => ({
        name: copro.nom,
        numero_immatriculation: copro.numero_immatriculation,
        mandat_en_cours: copro.mandat_en_cours,
        nombre_total_lots: copro.nombre_total_lots,
        nombre_lots_habitation: copro.nombre_lots_a_usage_habitation,
        type_syndic: copro.type_syndic,
        manager: copro.syndic_professionnel?.nom_entreprise,
        periode_construction: copro.periode_construction,
        adresse: copro.adresse,
        raw: copro,
      }));
      
      // Garder aussi la première pour compatibilité
      pappers.copropriete = {
        exists: true,
        name: pappers.coproprietes[0].name,
        manager: pappers.coproprietes[0].manager,
      };
    }
    
    // TOUS les permis de construire
    if (parcelle.permis && Array.isArray(parcelle.permis) && parcelle.permis.length > 0) {
      pappers.building_permits = parcelle.permis.map((p: any) => ({
        date: p.date_autorisation,
        type: p.statut,
        statut: p.statut,
        description: p.zone_operatoire || p.description,
        zone_operatoire: p.zone_operatoire,
        adresse: p.adresse,
        raw: p,
      }));
    }
    
    // TOUS les bâtiments
    if (parcelle.batiments && Array.isArray(parcelle.batiments) && parcelle.batiments.length > 0) {
      pappers.buildings = parcelle.batiments.map((b: any) => ({
        numero: b.numero,
        nature: b.nature,
        usage: b.usage,
        annee_construction: b.annee_construction,
        nombre_logements: b.nombre_logements,
        surface: b.surface,
        adresse: b.adresse,
        raw: b,
      }));
    }
    
    // TOUS les DPE
    if (parcelle.dpe && Array.isArray(parcelle.dpe) && parcelle.dpe.length > 0) {
      pappers.dpe = parcelle.dpe.map((d: any) => ({
        classe_bilan: d.classe_bilan,
        type_installation_chauffage: d.type_installation_chauffage,
        type_energie_chauffage: d.type_energie_chauffage,
        date_etablissement: d.date_etablissement,
        adresse: d.adresse,
        raw: d,
      }));
    }
    
    // TOUS les occupants
    if (parcelle.occupants && Array.isArray(parcelle.occupants) && parcelle.occupants.length > 0) {
      pappers.occupants = parcelle.occupants.map((o: any) => ({
        denomination: o.denomination,
        siren: o.siren,
        siret: o.siret,
        categorie_juridique: o.categorie_juridique,
        code_naf: o.code_naf,
        effectif: o.tranche_effectif,
        address: o.adresse,
        raw: o,
      }));
    }
    
    // TOUS les fonds de commerce
    if (parcelle.fonds_de_commerce && Array.isArray(parcelle.fonds_de_commerce) && parcelle.fonds_de_commerce.length > 0) {
      pappers.fonds_de_commerce = parcelle.fonds_de_commerce.map((fdc: any) => ({
        denomination: fdc.denomination,
        siren: fdc.siren,
        code_naf: fdc.code_naf,
        date_vente: fdc.date_vente,
        prix_vente: fdc.prix_vente,
        adresse: fdc.adresse,
        raw: fdc,
      }));
      
      // Garder aussi le premier pour compatibilité business
      const firstFdc = pappers.fonds_de_commerce[0];
      pappers.business = {
        has_business: true,
        company_name: firstFdc.denomination,
        siren: firstFdc.siren,
        activity: firstFdc.code_naf,
      };
    }
  } catch (error) {
    // En cas d'erreur, on retourne un objet vide pour ne pas bloquer l'agrégateur
    console.warn('Erreur Pappers Immo:', error);
  }
  
  return pappers;
}

