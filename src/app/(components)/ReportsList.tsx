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
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de vos rapports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-8">
          <div className="w-12 h-12 text-yellow-500 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchReports(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <span className="text-sm text-gray-500">{reports.length} rapport{reports.length > 1 ? 's' : ''}</span>
          <button 
            onClick={() => fetchReports(true)} 
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Actualiser la liste"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-8">
          <HomeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Aucun rapport trouvé</p>
          <p className="text-gray-500 text-sm">Générez votre premier rapport pour le voir apparaître ici</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div 
              key={report.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  <HomeIcon className="h-5 w-5 text-purple-600" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {getReportDisplayName(report)}
                  </h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {report.formattedDate}
                    </span>
                    {report.score > 0 && (
                      <>
                        <span className="hidden sm:inline">•</span>
                        <span className="flex items-center gap-1">
                          Score: <span className="font-semibold">{report.score}/100</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => router.push(`/report/${report.reportId || report.id}`)}
                  className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 text-sm"
                  title="Voir le rapport interactif"
                >
                  <EyeIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Voir</span>
                </button>
                
                {report.pdfUrl && (
                  <button
                    onClick={() => handleDownload(report)}
                    disabled={downloadStatus[report.id] === 'downloading'}
                    className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm ${
                      downloadStatus[report.id] === 'success' 
                        ? 'bg-green-600 text-white hover:bg-green-700' 
                        : downloadStatus[report.id] === 'error'
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-gray-600 text-white hover:bg-gray-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {downloadStatus[report.id] === 'downloading' ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="hidden sm:inline">Téléchargement...</span>
                      </>
                    ) : downloadStatus[report.id] === 'success' ? (
                      <>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="hidden sm:inline">Téléchargé !</span>
                      </>
                    ) : downloadStatus[report.id] === 'error' ? (
                      <>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="hidden sm:inline">Erreur</span>
                      </>
                    ) : (
                      <>
                        <DocumentArrowDownIcon className="h-4 w-4" />
                        <span className="hidden sm:inline">PDF</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {reports.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            💡 Astuce : Cliquez sur "Voir" pour consulter le rapport interactif ou sur "PDF" pour télécharger
          </p>
        </div>
      )}
    </div>
  );
}

