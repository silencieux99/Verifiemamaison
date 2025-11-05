'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/app/(components)/Header';
import Container from '@/app/(components)/Container';
import { useAuth } from '@/app/(context)/AuthContext';
import { HouseReport } from '@/lib/types';

/**
 * Page d'affichage d'un rapport interactif
 */
export default function ReportPage() {
  const params = useParams();
  const { firebaseUser } = useAuth();
  const [report, setReport] = useState<HouseReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        // TODO: Implémenter la récupération du rapport depuis Firestore
        // const response = await fetch(`/api/reports/${params.id}`);
        // const data = await response.json();
        // setReport(data.report);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchReport();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800">
        <Header />
        <main className="py-20">
          <Container>
            <p className="text-gray-400">Chargement du rapport...</p>
          </Container>
        </main>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800">
        <Header />
        <main className="py-20">
          <Container>
            <p className="text-gray-400">Rapport non trouvé</p>
          </Container>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800">
      <Header />
      <main className="py-20">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-8">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Rapport d'analyse
              </span>
            </h1>

            {/* Score global */}
            <div className="bg-gray-800 border border-purple-500/20 rounded-lg p-6 mb-6">
              <h2 className="text-2xl font-semibold text-white mb-4">Score global</h2>
              <div className="text-5xl font-bold text-white mb-2">{report.score}/100</div>
              <div className="w-full bg-gray-700 rounded-full h-4">
                <div
                  className={`h-4 rounded-full ${
                    report.score >= 70 ? 'bg-green-500' :
                    report.score >= 50 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${report.score}%` }}
                />
              </div>
            </div>

            {/* Alertes */}
            {report.alerts.length > 0 && (
              <div className="bg-gray-800 border border-red-500/30 rounded-lg p-6 mb-6">
                <h2 className="text-2xl font-semibold text-white mb-4">Alertes</h2>
                <ul className="space-y-2">
                  {report.alerts.map((alert, index) => (
                    <li key={index} className="text-gray-300">
                      <span className={alert.level === 'error' ? 'text-red-400' : 'text-yellow-400'}>
                        ⚠️ {alert.category}: {alert.message}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Analyses détaillées */}
            <div className="bg-gray-800 border border-purple-500/20 rounded-lg p-6 mb-6">
              <h2 className="text-2xl font-semibold text-white mb-4">Analyses détaillées</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Structure</h3>
                  <p className="text-gray-300">{report.analysis.structure}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Toiture</h3>
                  <p className="text-gray-300">{report.analysis.roof}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Isolation</h3>
                  <p className="text-gray-300">{report.analysis.insulation}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Installations</h3>
                  <p className="text-gray-300">{report.analysis.installations}</p>
                </div>
              </div>
            </div>

            {/* Recommandations */}
            {report.recommendations.length > 0 && (
              <div className="bg-gray-800 border border-purple-500/20 rounded-lg p-6">
                <h2 className="text-2xl font-semibold text-white mb-4">Recommandations</h2>
                <ul className="space-y-2">
                  {report.recommendations.map((rec, index) => (
                    <li key={index} className="text-gray-300 flex items-start gap-2">
                      <span className="text-purple-400">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Container>
      </main>
    </div>
  );
}

