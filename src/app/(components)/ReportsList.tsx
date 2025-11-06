'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/(context)/AuthContext';
import { useRouter } from 'next/navigation';
import { HomeIcon, MapPinIcon, CalendarIcon, EyeIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';

interface Report {
  id: string;
  reportId: string;
  orderId: string;
  createdAt: any;
  address: {
    full?: string;
    normalized?: string;
    city?: string;
    postalCode?: string;
  };
  formattedDate: string;
  status: string;
  score: number;
  summary: string;
  city: string;
  postalCode: string;
  normalizedAddress: string;
  pdfUrl: string | null;
  pdfGenerated: boolean;
}

interface ReportsListProps {
  className?: string;
}

export function ReportsList({ className = '' }: ReportsListProps) {
  const { firebaseUser } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<{[key: string]: 'downloading' | 'success' | 'error'}>({});

  const fetchReports = async (force = false) => {
    if (!firebaseUser) return;
    
    if (!force && reports.length > 0 && !loading) return; // Éviter les appels inutiles
    
    setLoading(true);
    setError(null);
    
    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/user-reports', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erreur de parsing' }));
        throw new Error(errorData.error || 'Erreur lors du chargement des rapports');
      }
      
      const data = await response.json();
      setReports(data.reports || []);
    } catch (err) {
      console.error('Erreur fetchReports:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (firebaseUser) {
      fetchReports();
    }
  }, [firebaseUser]);

  const handleDownload = async (report: Report) => {
    if (!report.pdfUrl) {
      setDownloadStatus(prev => ({ ...prev, [report.id]: 'error' }));
      setTimeout(() => {
        setDownloadStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[report.id];
          return newStatus;
        });
      }, 3000);
      return;
    }

    setDownloadStatus(prev => ({ ...prev, [report.id]: 'downloading' }));
    
    try {
      const response = await fetch(report.pdfUrl);
      if (!response.ok) throw new Error('Erreur lors du téléchargement');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport-${report.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setDownloadStatus(prev => ({ ...prev, [report.id]: 'success' }));
      
      setTimeout(() => {
        setDownloadStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[report.id];
          return newStatus;
        });
      }, 3000);
    } catch (err) {
      console.error('Download error:', err);
      setDownloadStatus(prev => ({ ...prev, [report.id]: 'error' }));
      
      setTimeout(() => {
        setDownloadStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[report.id];
          return newStatus;
        });
      }, 3000);
    }
  };

  const getReportDisplayName = (report: Report): string => {
    if (report.normalizedAddress) {
      return report.normalizedAddress;
    }
    if (report.address?.full) {
      return report.address.full;
    }
    if (report.city && report.postalCode) {
      return `${report.city} ${report.postalCode}`;
    }
    return 'Adresse inconnue';
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-16">
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchReports(true)}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {reports.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <HomeIcon className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-900 font-medium mb-1">Aucun rapport</p>
          <p className="text-sm text-gray-500">Générez votre premier rapport pour commencer</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {reports.map((report) => (
            <div 
              key={report.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 hover:bg-gray-50 transition-colors group gap-3 sm:gap-0"
            >
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <HomeIcon className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {getReportDisplayName(report)}
                  </h3>
                  <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-500 mt-0.5 sm:mt-1 flex-wrap">
                    <span className="whitespace-nowrap">{report.formattedDate}</span>
                    {report.score > 0 && (
                      <>
                        <span className="hidden sm:inline">•</span>
                        <span className="whitespace-nowrap">Score: <span className="font-medium text-gray-700">{report.score}/100</span></span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0 sm:self-auto self-end">
                <button
                  onClick={() => router.push(`/report/${report.reportId || report.id}`)}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2"
                >
                  <EyeIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Ouvrir</span>
                  <span className="sm:hidden">Voir</span>
                </button>
                
                {report.pdfUrl && (
                  <button
                    onClick={() => handleDownload(report)}
                    disabled={downloadStatus[report.id] === 'downloading'}
                    className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm font-medium flex items-center justify-center ${
                      downloadStatus[report.id] === 'success' 
                        ? 'bg-green-50 text-green-700 hover:bg-green-100' 
                        : downloadStatus[report.id] === 'error'
                        ? 'bg-red-50 text-red-700 hover:bg-red-100'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title="Télécharger le PDF"
                  >
                    {downloadStatus[report.id] === 'downloading' ? (
                      <>
                        <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </>
                    ) : downloadStatus[report.id] === 'success' ? (
                      <>
                        <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </>
                    ) : downloadStatus[report.id] === 'error' ? (
                      <>
                        <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </>
                    ) : (
                      <DocumentArrowDownIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

