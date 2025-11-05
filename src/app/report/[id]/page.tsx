'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/app/(components)/Header';
import Container from '@/app/(components)/Container';
import { useAuth } from '@/app/(context)/AuthContext';
import { HouseReport } from '@/lib/types';

/**
 * Page d'affichage d'un rapport interactif
 */
export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const [report, setReport] = useState<HouseReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseUser) {
      router.push('/login?redirect=/report/' + params.id);
    }
  }, [firebaseUser, router, params.id]);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        if (!firebaseUser) {
          setLoading(false);
          return;
        }

        // Récupérer le token Firebase
        const token = await firebaseUser.getIdToken();

        // Récupérer le rapport depuis l'API
        const response = await fetch(`/api/reports/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            setReport(null);
          } else {
            throw new Error('Erreur lors de la récupération du rapport');
          }
        } else {
          const data = await response.json();
          setReport(data.report);
        }
      } catch (error) {
        console.error('Erreur:', error);
        setReport(null);
      } finally {
        setLoading(false);
      }
    };

    if (params.id && firebaseUser) {
      fetchReport();
    } else if (!firebaseUser) {
      setLoading(false);
    }
  }, [params.id, firebaseUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100">
        <Header />
        <main className="py-8 sm:py-12 md:py-20">
          <Container>
            <p className="text-gray-600">Chargement du rapport...</p>
          </Container>
        </main>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100">
        <Header />
        <main className="py-8 sm:py-12 md:py-20">
          <Container>
            <div className="max-w-4xl mx-auto">
              <div className="bg-white border border-red-200 rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-lg">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">Rapport non trouvé</h2>
                <p className="text-gray-600">Le rapport demandé n'existe pas ou n'est plus disponible.</p>
              </div>
            </div>
          </Container>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100">
      <Header />
      <main className="py-8 sm:py-12 md:py-20">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 sm:mb-8">
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Rapport d'analyse
              </span>
            </h1>

            {/* Score global */}
            <div className="bg-white border border-purple-200 rounded-lg sm:rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-lg">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">Score global</h2>
              <div className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">{report.score}/100</div>
              <div className="w-full bg-gray-200 rounded-full h-3 sm:h-4">
                <div
                  className={`h-3 sm:h-4 rounded-full ${
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
              <div className="bg-white border border-red-200 rounded-lg sm:rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-lg">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">⚠️ Alertes</h2>
                <ul className="space-y-2 sm:space-y-3">
                  {report.alerts.map((alert, index) => (
                    <li key={index} className="text-sm sm:text-base">
                      <span className={alert.level === 'error' ? 'text-red-600 font-semibold' : 'text-yellow-600 font-semibold'}>
                        {alert.category}: 
                      </span>
                      <span className="text-gray-700 ml-2">{alert.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Analyses détaillées */}
            <div className="bg-white border border-purple-200 rounded-lg sm:rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-lg">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">Analyses détaillées</h2>
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">🏗️ Structure</h3>
                  <p className="text-gray-700 text-sm sm:text-base">{report.analysis.structure}</p>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">🏠 Toiture</h3>
                  <p className="text-gray-700 text-sm sm:text-base">{report.analysis.roof}</p>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">🧱 Isolation</h3>
                  <p className="text-gray-700 text-sm sm:text-base">{report.analysis.insulation}</p>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">⚡ Installations</h3>
                  <p className="text-gray-700 text-sm sm:text-base">{report.analysis.installations}</p>
                </div>
              </div>
            </div>

            {/* Recommandations */}
            {report.recommendations.length > 0 && (
              <div className="bg-white border border-purple-200 rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-lg">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">💡 Recommandations</h2>
                <ul className="space-y-2 sm:space-y-3">
                  {report.recommendations.map((rec, index) => (
                    <li key={index} className="text-gray-700 flex items-start gap-2 sm:gap-3 text-sm sm:text-base">
                      <span className="text-purple-600 font-bold mt-1">•</span>
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

