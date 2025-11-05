'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/app/(components)/Header';
import Container from '@/app/(components)/Container';
import { useAuth } from '@/app/(context)/AuthContext';
import { HouseProfile } from '@/lib/house-profile-types';
import { ArrowLeftIcon, MapPinIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface ReportData {
  id: string;
  orderId: string;
  userId: string;
  address: {
    full: string;
    postalCode: string;
    city: string;
    normalized: string;
    gps: { lat: number; lon: number };
    admin: {
      city: string;
      postcode: string;
      citycode: string;
      department?: string;
      region?: string;
    };
  };
  profileData: HouseProfile;
  report: {
    generatedAt: any;
    status: string;
    score: number;
    summary: string;
  };
  createdAt: any;
}

/**
 * Page d'affichage d'un rapport interactif avec toutes les données agrégées
 */
export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseUser) {
      router.push('/login?redirect=/report/' + params.id);
      return;
    }

    const fetchReport = async () => {
      try {
        const token = await firebaseUser.getIdToken();
        const response = await fetch(`/api/reports/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            setError('Rapport non trouvé');
          } else {
            setError('Erreur lors de la récupération du rapport');
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        setReport(data.report);
      } catch (error) {
        console.error('Erreur:', error);
        setError('Erreur lors du chargement du rapport');
      } finally {
        setLoading(false);
      }
    };

    if (params.id && firebaseUser) {
      fetchReport();
    } else if (!firebaseUser) {
      setLoading(false);
    }
  }, [params.id, firebaseUser, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100">
        <Header />
        <main className="py-8 sm:py-12 md:py-20">
          <Container>
            <div className="max-w-6xl mx-auto">
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <p className="mt-4 text-gray-600">Chargement du rapport...</p>
              </div>
            </div>
          </Container>
        </main>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100">
        <Header />
        <main className="py-8 sm:py-12 md:py-20">
          <Container>
            <div className="max-w-4xl mx-auto">
              <div className="bg-white border border-red-200 rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-lg">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">Rapport non trouvé</h2>
                <p className="text-gray-600 mb-4">{error || 'Le rapport demandé n\'existe pas ou n\'est plus disponible.'}</p>
                <Link
                  href="/account"
                  className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                  Retour à mon compte
                </Link>
              </div>
            </div>
          </Container>
        </main>
      </div>
    );
  }

  const profile = report.profileData;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100">
      <Header />
      <main className="py-8 sm:py-12 md:py-20">
        <Container>
          <div className="max-w-6xl mx-auto">
            {/* Header avec retour */}
            <div className="mb-6">
              <Link
                href="/account"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                <span>Retour à mon compte</span>
              </Link>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2">
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Rapport d'analyse
                </span>
              </h1>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPinIcon className="h-5 w-5" />
                <span>{report.address.normalized || report.address.full}</span>
              </div>
            </div>

            {/* Score global */}
            <div className="bg-white border border-purple-200 rounded-xl p-6 mb-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-gray-900">Score global</h2>
                <div className="text-5xl font-bold text-gray-900">{report.report.score}/100</div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full transition-all ${
                    report.report.score >= 70 ? 'bg-green-500' :
                    report.report.score >= 50 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${report.report.score}%` }}
                />
              </div>
              <p className="text-gray-600 mt-4">{report.report.summary}</p>
            </div>

            {/* Recommandations */}
            {profile.recommendations && profile.recommendations.items.length > 0 && (
              <div className="bg-white border border-purple-200 rounded-xl p-6 mb-6 shadow-lg">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">💡 Recommandations IA</h2>
                <p className="text-gray-700 mb-4">{profile.recommendations.summary}</p>
                <div className="space-y-3">
                  {profile.recommendations.items.map((item, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-l-4 ${
                        item.priority === 1 ? 'bg-red-50 border-red-500' :
                        item.priority === 2 ? 'bg-yellow-50 border-yellow-500' :
                        'bg-blue-50 border-blue-500'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {item.priority === 1 && <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />}
                        {item.priority === 2 && <InformationCircleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />}
                        {item.priority === 3 && <InformationCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />}
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                          <p className="text-sm text-gray-700">{item.reason}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Localisation */}
            <div className="bg-white border border-purple-200 rounded-xl p-6 mb-6 shadow-lg">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">📍 Localisation</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Adresse normalisée</p>
                  <p className="font-medium text-gray-900">{profile.location.normalized_address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Coordonnées GPS</p>
                  <p className="font-medium text-gray-900">{profile.location.gps.lat.toFixed(6)}, {profile.location.gps.lon.toFixed(6)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Commune</p>
                  <p className="font-medium text-gray-900">{profile.location.admin.city} ({profile.location.admin.postcode})</p>
                </div>
                {profile.location.admin.department && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Département</p>
                    <p className="font-medium text-gray-900">{profile.location.admin.department}</p>
                  </div>
                )}
                {profile.location.admin.region && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Région</p>
                    <p className="font-medium text-gray-900">{profile.location.admin.region}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Risques */}
            {profile.risks && (
              <div className="bg-white border border-purple-200 rounded-xl p-6 mb-6 shadow-lg">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">⚠️ Risques naturels et technologiques</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.risks.normalized.flood_level && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Risque inondation</p>
                      <p className="font-semibold text-gray-900 capitalize">{profile.risks.normalized.flood_level}</p>
                    </div>
                  )}
                  {profile.risks.normalized.seismic_level !== undefined && (
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Sismicité</p>
                      <p className="font-semibold text-gray-900">Niveau {profile.risks.normalized.seismic_level}/5</p>
                    </div>
                  )}
                  {profile.risks.normalized.radon_zone && (
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Zone radon</p>
                      <p className="font-semibold text-gray-900">Zone {profile.risks.normalized.radon_zone}/3</p>
                    </div>
                  )}
                </div>
                {profile.risks.normalized.notes && profile.risks.normalized.notes.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Notes importantes:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                      {profile.risks.normalized.notes.map((note, index) => (
                        <li key={index}>{note}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Énergie / DPE */}
            {profile.energy?.dpe && (
              <div className="bg-white border border-purple-200 rounded-xl p-6 mb-6 shadow-lg">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">⚡ Performance énergétique</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.energy.dpe.class_energy && (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Classe énergétique</p>
                      <p className="text-3xl font-bold text-gray-900">{profile.energy.dpe.class_energy}</p>
                    </div>
                  )}
                  {profile.energy.dpe.class_ges && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Classe GES</p>
                      <p className="text-3xl font-bold text-gray-900">{profile.energy.dpe.class_ges}</p>
                    </div>
                  )}
                  {profile.energy.dpe.date && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Date du DPE</p>
                      <p className="font-medium text-gray-900">{new Date(profile.energy.dpe.date).toLocaleDateString('fr-FR')}</p>
                    </div>
                  )}
                  {profile.energy.dpe.surface_m2 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Surface</p>
                      <p className="font-medium text-gray-900">{profile.energy.dpe.surface_m2} m²</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Marché immobilier */}
            {profile.market?.dvf && (
              <div className="bg-white border border-purple-200 rounded-xl p-6 mb-6 shadow-lg">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">💰 Marché immobilier (DVF)</h2>
                {profile.market.dvf.summary && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {profile.market.dvf.summary.price_m2_median_1y && (
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Prix/m² médian (1 an)</p>
                        <p className="text-2xl font-bold text-gray-900">{profile.market.dvf.summary.price_m2_median_1y.toLocaleString('fr-FR')} €</p>
                      </div>
                    )}
                    {profile.market.dvf.summary.price_m2_median_3y && (
                      <div className="p-4 bg-pink-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Prix/m² médian (3 ans)</p>
                        <p className="text-2xl font-bold text-gray-900">{profile.market.dvf.summary.price_m2_median_3y.toLocaleString('fr-FR')} €</p>
                      </div>
                    )}
                    {profile.market.dvf.summary.trend_label && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Tendance</p>
                        <p className="text-xl font-semibold text-gray-900 capitalize">{profile.market.dvf.summary.trend_label}</p>
                      </div>
                    )}
                  </div>
                )}
                {profile.market.dvf.transactions && profile.market.dvf.transactions.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">{profile.market.dvf.transactions.length} transaction(s) trouvée(s) à proximité</p>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {profile.market.dvf.transactions.slice(0, 10).map((transaction, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg text-sm">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">{transaction.type}</p>
                              {transaction.price_eur && (
                                <p className="text-gray-600">{transaction.price_eur.toLocaleString('fr-FR')} €</p>
                              )}
                            </div>
                            {transaction.date && (
                              <p className="text-gray-500">{new Date(transaction.date).getFullYear()}</p>
                            )}
                          </div>
                          {transaction.surface_m2 && transaction.price_m2_eur && (
                            <p className="text-gray-600 mt-1">{transaction.surface_m2} m² • {transaction.price_m2_eur.toLocaleString('fr-FR')} €/m²</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Écoles */}
            {profile.education?.schools && profile.education.schools.length > 0 && (
              <div className="bg-white border border-purple-200 rounded-xl p-6 mb-6 shadow-lg">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">🏫 Écoles à proximité</h2>
                <div className="space-y-3">
                  {profile.education.schools.slice(0, 10).map((school, index) => (
                    <div key={index} className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-900">{school.name}</p>
                          <p className="text-sm text-gray-600 capitalize">{school.kind}</p>
                          {school.public_private && (
                            <p className="text-xs text-gray-500 capitalize">{school.public_private}</p>
                          )}
                        </div>
                        {school.distance_m && (
                          <p className="text-sm font-medium text-gray-700">{Math.round(school.distance_m)} m</p>
                        )}
                      </div>
                      {school.address && (
                        <p className="text-sm text-gray-600 mt-2">{school.address}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Connectivité */}
            {profile.connectivity && (
              <div className="bg-white border border-purple-200 rounded-xl p-6 mb-6 shadow-lg">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">🌐 Connectivité Internet</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {profile.connectivity.fiber_available !== undefined && (
                    <div className={`p-4 rounded-lg ${profile.connectivity.fiber_available ? 'bg-green-50' : 'bg-red-50'}`}>
                      <p className="text-sm text-gray-600 mb-1">Fibre optique</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {profile.connectivity.fiber_available ? '✅ Disponible' : '❌ Non disponible'}
                      </p>
                    </div>
                  )}
                  {profile.connectivity.down_max_mbps && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Débit descendant max</p>
                      <p className="text-xl font-semibold text-gray-900">{profile.connectivity.down_max_mbps} Mbps</p>
                    </div>
                  )}
                  {profile.connectivity.up_max_mbps && (
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Débit montant max</p>
                      <p className="text-xl font-semibold text-gray-900">{profile.connectivity.up_max_mbps} Mbps</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Commodités */}
            {(profile.amenities?.supermarkets?.length || profile.amenities?.transit?.length || profile.amenities?.parks?.length) && (
              <div className="bg-white border border-purple-200 rounded-xl p-6 mb-6 shadow-lg">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">🏪 Commodités</h2>
                <div className="space-y-4">
                  {profile.amenities.supermarkets && profile.amenities.supermarkets.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Supermarchés</h3>
                      <div className="space-y-2">
                        {profile.amenities.supermarkets.slice(0, 5).map((supermarket, index) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg text-sm">
                            <p className="font-medium text-gray-900">{supermarket.name || 'Supermarché'}</p>
                            <p className="text-gray-600">{Math.round(supermarket.distance_m)} m</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {profile.amenities.transit && profile.amenities.transit.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Transports</h3>
                      <div className="space-y-2">
                        {profile.amenities.transit.slice(0, 5).map((transit, index) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg text-sm">
                            <p className="font-medium text-gray-900">{transit.name || transit.type || 'Transport'}</p>
                            <p className="text-gray-600">{Math.round(transit.distance_m)} m</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Métadonnées */}
            {profile.meta && (
              <div className="bg-white border border-purple-200 rounded-xl p-6 shadow-lg">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">📊 Informations techniques</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 mb-1">Généré le</p>
                    <p className="font-medium text-gray-900">
                      {profile.meta.generated_at ? new Date(profile.meta.generated_at).toLocaleString('fr-FR') : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Temps de traitement</p>
                    <p className="font-medium text-gray-900">{profile.meta.processing_ms} ms</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-gray-600 mb-2">Sources consultées: {profile.meta.sources.length}</p>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {profile.meta.sources.map((source, index) => (
                        <div key={index} className="text-xs text-gray-500">
                          <span className="font-medium">{source.section}:</span> {source.url}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Container>
      </main>
    </div>
  );
}
