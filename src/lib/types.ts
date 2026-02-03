// Types pour VerifieMaMaison - Analyse de biens immobiliers

export interface HouseData {
  address: string;
  postalCode: string;
  city: string;
  yearBuilt?: number;
  surface: number; // m²
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  generalCondition: 'neuf' | 'bon_etat' | 'moyen' | 'renover' | 'ruine';
  roofCondition: 'neuf' | 'bon' | 'moyen' | 'degrade' | 'critique';
  insulation: 'aucune' | 'partielle' | 'complete' | 'excellente';
  electrical: 'conforme' | 'obsolète' | 'dangereux' | 'inconnu';
  plumbing: 'moderne' | 'acceptable' | 'obsolète' | 'critique';
  heating: 'electrique' | 'gaz' | 'fioul' | 'bois' | 'pompe_chaleur' | 'autre';
  diagnostics?: {
    plomb?: boolean;
    amiante?: boolean;
    termites?: boolean;
    dpe?: string; // A, B, C, D, E, F, G
  };
  notes?: string;
}

export interface HouseReport {
  houseData: HouseData;
  analysis: ReportAnalysis;
  score: number; // Score global sur 100
  alerts: Alert[];
  recommendations: string[];
}

export interface ReportAnalysis {
  structure: string;
  roof: string;
  insulation: string;
  installations: string;
  interior: string;
  overall: string;
}

export interface Alert {
  level: 'warning' | 'error' | 'info';
  category: string;
  message: string;
}

export type PlanType = 'unite' | 'pack4' | 'pack10';

export interface Order {
  id?: string;
  paymentIntentId: string;
  stripeSessionId?: string;
  amount: number; // en centimes
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'PROCESSING' | 'GENERATING_REPORT' | 'COMPLETE';

  customerEmail: string;
  customerUid?: string;

  sku?: PlanType;
  productName?: string;
  creditsAdded?: number;

  houseData?: HouseData;
  source?: string;

  pdfGenerated: boolean;
  pdfStoragePath?: string;
  pdfUrl?: string;

  reportData?: HouseReport;

  refundId?: string;
  refundAmount?: number;
  refundReason?: string;

  promoCode?: {
    code: string;
    type: 'fixed' | 'percentage';
    value: number;
    discount: number;
    isFreeReport: boolean;
    promoCodeId: string;
  } | null;

  createdAt: number;
  updatedAt: number;
  emailSent: boolean;
  processingLogs?: string[];
}

export interface User {
  uid: string;
  email: string;
  stripeCustomerId?: string;
  currentPlan?: PlanType;
  createdAt: number;
  updatedAt: number;
}

export interface Credits {
  uid: string;
  total: number;
  history: CreditHistoryEntry[];
  createdAt?: number;
  updatedAt?: number;
}

export interface CreditHistoryEntry {
  type: 'add' | 'consume';
  qty: number;
  source: 'unite' | 'pack4' | 'pack10';
  ts: number;
  note?: string;
}

export interface PricingPlan {
  id: string;
  sku: PlanType;
  name: string;
  description: string;
  price: number;
  priceLabel: string;
  reports: number;
  features: string[];
  highlight?: boolean;
  badge?: string;
  savingsNote?: string;
}

export interface CheckoutRequest {
  sku: PlanType;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutResponse {
  sessionId: string;
  url: string;
}

export interface UsageStats {
  currentPlan?: PlanType;
  credits: number;
  canGenerate: boolean;
}

