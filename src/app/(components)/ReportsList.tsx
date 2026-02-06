'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/(context)/AuthContext';
import { useRouter } from 'next/navigation';
import { HomeIcon, MapPinIcon, CalendarIcon, EyeIcon, DocumentArrowDownIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence, Variants } from 'framer-motion';

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

const containerVars: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVars: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 50, damping: 20 } }
};

export function ReportsList({ className = '' }: ReportsListProps) {
  const { firebaseUser } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<{ [key: string]: 'downloading' | 'success' | 'error' }>({});

  const fetchReports = async (force = false) => {
    if (!firebaseUser) return;

    if (!force && reports.length > 0 && !loading) return;

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
          <div className="w-8 h-8 border-2 border-gray-100 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[10px] uppercase tracking-widest text-gray-400">Chargement...</p>
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
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20"
        >
          <div className="w-20 h-20 rounded-[32px] bg-gray-50 flex items-center justify-center mx-auto mb-6">
            <HomeIcon className="h-8 w-8 text-gray-300" />
          </div>
          <p className="text-gray-900 font-bold mb-2">Aucun rapport</p>
          <p className="text-sm text-gray-400 max-w-xs mx-auto">Lancez votre première analyse pour voir apparaître votre historique ici.</p>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVars}
          initial="hidden"
          animate="show"
          className="divide-y divide-gray-100"
        >
          <AnimatePresence>
            {reports.map((report) => (
              <motion.div
                key={report.id}
                variants={itemVars}
                className="flex flex-col p-6 hover:bg-gray-50/80 transition-colors group gap-6 cursor-default relative overflow-hidden"
                whileHover={{ x: 4 }}
              >
                <div className="flex items-start gap-5 w-full">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:bg-white group-hover:shadow-md transition-all duration-300 border border-transparent group-hover:border-gray-100">
                    <HomeIcon className="h-5 w-5 text-gray-400 group-hover:text-black transition-colors" />
                  </div>

                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="text-sm font-bold text-gray-900 leading-tight uppercase tracking-tight group-hover:text-black transition-colors break-words">
                      {getReportDisplayName(report)}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest">
                      <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-0.5 rounded-md whitespace-nowrap">
                        <CalendarIcon className="w-3 h-3" />
                        {report.formattedDate}
                      </span>
                      {report.score > 0 && (
                        <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md whitespace-nowrap">
                          <SparklesIcon className="w-3 h-3" />
                          Score: {report.score}/100
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto sm:self-end">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push(`/report/${report.reportId || report.id}`)}
                    className="flex-1 sm:flex-none px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition-colors text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-black/5"
                  >
                    <EyeIcon className="h-3.5 w-3.5" />
                    Ouvrir
                  </motion.button>

                  {report.pdfUrl && (
                    <motion.button
                      whileHover={{ scale: 1.05, borderColor: '#000', color: '#000' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDownload(report)}
                      disabled={downloadStatus[report.id] === 'downloading'}
                      className={`p-3 rounded-xl transition-all border ${downloadStatus[report.id] === 'success'
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                        : downloadStatus[report.id] === 'error'
                          ? 'bg-red-50 border-red-100 text-red-700'
                          : 'bg-white border-gray-100 text-gray-400'
                        } disabled:opacity-50 disabled:cursor-not-allowed shadow-sm`}
                      title="Télécharger le PDF"
                    >
                      {downloadStatus[report.id] === 'downloading' ? (
                        <div className="w-4 h-4 border-2 border-gray-200 border-t-black rounded-full animate-spin"></div>
                      ) : downloadStatus[report.id] === 'success' ? (
                        <CheckIcon className="h-4 w-4" />
                      ) : (
                        <DocumentArrowDownIcon className="h-4 w-4" />
                      )}
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

