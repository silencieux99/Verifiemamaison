'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/(context)/AuthContext';
import { useRouter } from 'next/navigation';
import { HomeIcon, MapPinIcon, CalendarIcon, EyeIcon, DocumentArrowDownIcon, SparklesIcon } from '@heroicons/react/24/outline';

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
  const [downloadStatus, setDownloadStatus] = useState<{ [key: string]: 'downloading' | 'success' | 'error' }>({});

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
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-5 hover:bg-gray-50 transition-all group gap-4"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:bg-black transition-colors">
                  <HomeIcon className="h-6 w-6 text-gray-900 group-hover:text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-black text-gray-900 truncate uppercase tracking-tight">
                    {getReportDisplayName(report)}
                  </h3>
                  <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" />
                      {report.formattedDate}
                    </span>
                    {report.score > 0 && (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <SparklesIcon className="w-3 h-3" />
                        Score: {report.score}/100
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0 sm:self-auto self-end">
                <button
                  onClick={() => router.push(`/report/${report.reportId || report.id}`)}
                  className="px-6 py-2.5 bg-black text-white rounded-xl hover:bg-gray-800 transition-all text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-black/5"
                >
                  <EyeIcon className="h-4 w-4" />
                  Ouvrir
                </button>

                {report.pdfUrl && (
                  <button
                    onClick={() => handleDownload(report)}
                    disabled={downloadStatus[report.id] === 'downloading'}
                    className={`p-2.5 rounded-xl transition-all border ${downloadStatus[report.id] === 'success'
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                      : downloadStatus[report.id] === 'error'
                        ? 'bg-red-50 border-red-100 text-red-700'
                        : 'bg-white border-gray-100 text-gray-400 hover:text-black hover:border-black'
                      } disabled:opacity-50 disabled:cursor-not-allowed shadow-sm`}
                    title="Télécharger le PDF"
                  >
                    {downloadStatus[report.id] === 'downloading' ? (
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
                    ) : downloadStatus[report.id] === 'success' ? (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <DocumentArrowDownIcon className="h-4 w-4" />
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

