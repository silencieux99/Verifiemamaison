/**
 * Types TypeScript pour l'API House Profile
 * Schéma contractuel strict pour l'agrégation de données immobilières
 */

export interface HouseProfileQuery {
  address: string;
  radius_m?: number;
  lang?: "fr" | "en";
}

export interface HouseProfileLocation {
  normalized_address: string;
  gps: {
    lat: number;
    lon: number;
  };
  admin: {
    city: string;
    postcode: string;
    citycode: string;
    department?: string;
    region?: string;
    iris?: string;
  };
  raw?: any;
}

export interface HouseProfileRisks {
  flood?: any;
  seismicity?: any;
  clay_shrink_swell?: any;
  radon?: any;
  ground_movements?: any;
  cavities?: any;
  wildfire?: any;
  polluted_lands?: any; // BASOL/BASIAS/SIS
  normalized: {
    flood_level?: "faible" | "moyen" | "élevé" | "inconnu";
    seismic_level?: number;
    radon_zone?: 1 | 2 | 3;
    notes?: string[];
  };
}

export interface HouseProfileUrbanism {
  zoning?: Array<{
    code: string;
    label: string;
    doc_url?: string;
  }>;
  land_servitudes?: Array<{
    code: string;
    label: string;
    doc_url?: string;
  }>;
  docs?: Array<{
    title: string;
    url: string;
  }>;
  raw?: any;
}

export interface HouseProfileEnergy {
  dpe?: {
    id?: string;
    class_energy?: "A" | "B" | "C" | "D" | "E" | "F" | "G";
    class_ges?: string;
    date?: string;
    surface_m2?: number;
    housing_type?: string;
    raw?: any;
  };
}

export interface HouseProfileMarket {
  dvf: {
    transactions?: Array<{
      id?: string;
      date: string;
      type: "maison" | "appartement" | "autre" | string;
      surface_m2?: number;
      price_eur?: number;
      price_m2_eur?: number;
      address_hint?: string;
      address?: string;
      latitude?: number;
      longitude?: number;
      lat?: number;
      lon?: number;
      raw?: any;
    }>;
    summary?: {
      price_m2_median_1y?: number;
      price_m2_median_3y?: number;
      volume_3y?: number;
      trend_label?: "hausse" | "baisse" | "stable" | null;
      estimated?: boolean; // Indique si le prix est estimé (pas de données DVF réelles)
    };
    raw?: any;
  };
  melo?: {
    similarListings?: Array<{
      id: string;
      title: string;
      price: number;
      price_m2?: number;
      surface: number;
      rooms?: number;
      type: string;
      address: string;
      url: string;
      distance_m?: number;
      published_date?: string;
      energy_class?: string;
    }>;
    marketInsights?: {
      averagePriceM2?: number;
      priceRange?: {
        min: number;
        max: number;
      };
      activeListings?: number;
      averageSurface?: number;
    };
    source: 'melo';
    fetchedAt: string;
  };
}


export interface HouseProfileBuilding {
  declared?: {
    property_type?: "maison" | "appartement" | "immeuble" | string;
    surface_habitable_m2?: number;
    rooms?: number;
    floors?: number;
    year_built?: number;
    roof_type?: string;
    insulation?: string;
    electrical?: string;
    plumbing?: string;
  };
}

export interface HouseProfileEducation {
  schools: Array<{
    name: string;
    kind: "maternelle" | "élémentaire" | "collège" | "lycée" | string;
    public_private?: "public" | "privé" | string;
    address?: string;
    postcode?: string;
    city?: string;
    phone?: string;
    website?: string;
    gps?: {
      lat: number;
      lon: number;
    };
    distance_m?: number;
    rating?: number; // Note Google (0-5)
    rating_count?: number; // Nombre d'avis
    raw?: any;
  }>;
}

export interface HouseProfileConnectivity {
  fiber_available?: boolean;
  down_max_mbps?: number;
  up_max_mbps?: number;
  technologies?: string[];
  operators?: string[];
  raw?: any;
}

export interface HouseProfileAirQuality {
  index_today?: number | string;
  label?: string;
  raw?: any;
}

export interface HouseProfileAmenity {
  name?: string;
  distance_m: number;
  gps: {
    lat: number;
    lon: number;
  };
  raw?: any;
}

export interface HouseProfileAmenities {
  supermarkets?: Array<HouseProfileAmenity>;
  transit?: Array<HouseProfileAmenity & { type?: string }>;
  parks?: Array<HouseProfileAmenity>;
  others?: Array<HouseProfileAmenity & { category: string }>;
}

export interface HouseProfileSafety {
  scope: "commune";
  city: string;
  citycode: string;
  period: {
    from: string;
    to: string;
  };
  indicators: Array<{
    category: string;
    total_10y?: number;
    rate_local_per_10k?: number;
    rate_national_per_10k?: number;
    level_vs_national?: "faible" | "moyen" | "élevé" | null;
    series?: Array<{
      year: number;
      value: number;
    }>;
  }>;
  notes?: string[];
  raw?: any;
}

export interface HouseProfileRecommendations {
  summary: string;
  items: Array<{
    title: string;
    reason: string;
    priority: 1 | 2 | 3;
    related_sections: string[];
  }>;
}

export interface HouseProfileMeta {
  generated_at: string;
  processing_ms: number;
  sources: Array<{
    section: string;
    url: string;
    fetched_at: string;
  }>;
  warnings?: string[];
}

export interface HouseProfileAIAnalysis {
  score: number; // Score global sur 100
  summary: string; // Synthèse générale du bien
  market_analysis: {
    estimated_value_m2?: number;
    market_trend?: 'hausse' | 'baisse' | 'stable';
    market_comment?: string;
    price_comparison?: string;
  };
  neighborhood_analysis: {
    shops_analysis?: string;
    amenities_score?: number;
    transport_score?: number;
    quality_of_life?: string;
  };
  risks_analysis: {
    overall_risk_level?: 'faible' | 'moyen' | 'élevé';
    main_risks?: string[];
    risk_comment?: string;
  };
  investment_potential?: {
    score?: number;
    comment?: string;
    recommendations?: string[];
  };
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
}

export interface HouseProfile {
  query: HouseProfileQuery;
  location: HouseProfileLocation;
  risks: HouseProfileRisks;
  urbanism: HouseProfileUrbanism;
  energy: HouseProfileEnergy;
  market: HouseProfileMarket;
  building: HouseProfileBuilding;
  education: HouseProfileEducation;
  connectivity?: HouseProfileConnectivity;
  air_quality: HouseProfileAirQuality;
  amenities: HouseProfileAmenities;
  safety: HouseProfileSafety;
  recommendations: HouseProfileRecommendations;
  ai_analysis?: HouseProfileAIAnalysis;
  meta: HouseProfileMeta;
}

