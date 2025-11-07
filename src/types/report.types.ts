export interface ReportItem {
  label: string;
  value: string | number | boolean;
  flag?: 'ok' | 'warn' | 'risk';
  hint?: string;
}

export interface ReportSection {
  id: string;
  title: string;
  items: ReportItem[];
  notes?: string[];
}

export interface AIVerification {
  score?: number;
  summary?: string;
  recommendations?: string[];
  risks?: string[];
  market_analysis?: {
    estimated_value_m2?: number;
    market_trend?: 'hausse' | 'baisse' | 'stable';
    market_comment?: string;
    price_comparison?: string;
  };
  neighborhood_analysis?: {
    shops_analysis?: string;
    amenities_score?: number;
    transport_score?: number;
    quality_of_life?: string;
  };
  risks_analysis?: {
    overall_risk_level?: 'faible' | 'moyen' | 'élevé';
    main_risks?: string[];
    risk_comment?: string;
  };
  investment_potential?: {
    score?: number;
    comment?: string;
    recommendations?: string[];
  };
  rental_yield_analysis?: {
    estimated_rent_monthly?: number;
    estimated_rent_yearly?: number;
    yield_percentage?: number;
    yield_rating?: 'excellent' | 'bon' | 'moyen' | 'faible';
    market_rent_comparison?: string;
    rental_demand?: 'forte' | 'moyenne' | 'faible';
    rental_comment?: string;
    rental_recommendations?: string[];
  };
  strengths?: string[];
  weaknesses?: string[];
}

export interface ReportDoc {
  id?: string;
  uid?: string;
  status: 'processing' | 'completed' | 'failed';
  sections: ReportSection[];
  ai?: AIVerification;
  pdfUrl?: string;
  createdAt?: number;
  updatedAt?: number;
}

