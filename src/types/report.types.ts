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

