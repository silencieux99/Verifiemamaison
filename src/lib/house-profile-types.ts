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
      date: string;
      type: "maison" | "appartement" | "autre" | string;
      surface_m2?: number;
      price_eur?: number;
      price_m2_eur?: number;
      address_hint?: string;
      raw?: any;
    }>;
    summary?: {
      price_m2_median_1y?: number;
      price_m2_median_3y?: number;
      volume_3y?: number;
      trend_label?: "hausse" | "baisse" | "stable" | null;
    };
    raw?: any;
  };
}

export interface HouseProfilePappers {
  owners?: Array<{
    name?: string;
    type?: "personne_physique" | "personne_morale" | string;
    company_name?: string;
    siren?: string;
    siret?: string;
    legal_form?: string;
    address?: string;
    code_naf?: string;
    effectif?: string;
    raw?: any;
  }>;
  owner?: {
    name?: string;
    type?: "personne_physique" | "personne_morale" | string;
    company_name?: string;
    siren?: string;
    siret?: string;
    legal_form?: string;
    address?: string;
  };
  transactions?: Array<{
    id?: string;
    date?: string;
    type?: string;
    price_eur?: number;
    surface_m2?: number;
    price_m2_eur?: number;
    nature?: string;
    nombre_pieces?: number;
    nombre_lots?: number;
    surface_terrain?: number;
    address?: string;
    raw?: any;
  }>;
  cadastral?: {
    parcel?: string;
    section?: string;
    prefixe?: string;
    numero_plan?: string;
    surface_m2?: number;
    references?: string[];
    autres_adresses?: Array<{
      adresse: string;
      sources: string[];
    }>;
  };
  coproprietes?: Array<{
    name?: string;
    numero_immatriculation?: string;
    mandat_en_cours?: string;
    nombre_total_lots?: number;
    nombre_lots_habitation?: number;
    type_syndic?: string;
    manager?: string;
    periode_construction?: string;
    adresse?: string;
    raw?: any;
  }>;
  copropriete?: {
    exists?: boolean;
    name?: string;
    manager?: string;
  };
  building_permits?: Array<{
    date?: string;
    type?: string;
    statut?: string;
    description?: string;
    zone_operatoire?: string;
    adresse?: string;
    raw?: any;
  }>;
  buildings?: Array<{
    numero?: string;
    nature?: string;
    usage?: string;
    annee_construction?: number;
    nombre_logements?: number;
    surface?: number;
    adresse?: string;
    raw?: any;
  }>;
  dpe?: Array<{
    classe_bilan?: string;
    type_installation_chauffage?: string;
    type_energie_chauffage?: string;
    date_etablissement?: string;
    adresse?: string;
    raw?: any;
  }>;
  occupants?: Array<{
    denomination?: string;
    siren?: string;
    siret?: string;
    categorie_juridique?: string;
    code_naf?: string;
    effectif?: string;
    address?: string;
    raw?: any;
  }>;
  business?: {
    has_business?: boolean;
    company_name?: string;
    siren?: string;
    activity?: string;
  };
  fonds_de_commerce?: Array<{
    denomination?: string;
    siren?: string;
    code_naf?: string;
    date_vente?: string;
    prix_vente?: number;
    adresse?: string;
    raw?: any;
  }>;
  raw?: any;
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
    raw?: any;
  }>;
}

export interface HouseProfileConnectivity {
  fiber_available?: boolean;
  down_max_mbps?: number;
  up_max_mbps?: number;
  technologies?: string[];
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
  connectivity: HouseProfileConnectivity;
  air_quality: HouseProfileAirQuality;
  amenities: HouseProfileAmenities;
  safety: HouseProfileSafety;
  pappers?: HouseProfilePappers;
  recommendations: HouseProfileRecommendations;
  ai_analysis?: HouseProfileAIAnalysis;
  meta: HouseProfileMeta;
}

