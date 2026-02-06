'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import PremiumReportView from '@/components/PremiumReportView';
import type { ReportSection } from '@/types/report.types';
import { convertHouseProfileToSections } from '@/lib/convert-house-profile-to-sections';
import { HouseProfile } from '@/lib/house-profile-types';
import { useAuth } from '@/app/(context)/AuthContext';

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
  pdfUrl?: string;
  createdAt: any;
}

const ReportHeader = () => (
  <header className="sticky top-0 z-30 flex items-center justify-between h-[60px] px-4 bg-black/80 backdrop-blur-sm border-b border-white/10">
    <Link href="/account" className="p-2 rounded-full hover:bg-white/10 inline-flex items-center justify-center">
      <ArrowLeft className="h-5 w-5 text-white" />
    </Link>
    <h1 className="text-lg font-bold text-white">Rapport Immobilier</h1>
    <div className="w-10"></div>
  </header>
);

export default function RapportInteractifPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: reportId } = use(params);
  const router = useRouter();
  const { firebaseUser, loading: authLoading } = useAuth();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Attendre que Firebase Auth finisse de vérifier l'état de l'utilisateur
    if (authLoading) {
      return;
    }

    // Si l'authentification est terminée et qu'il n'y a pas d'utilisateur, rediriger
    if (!firebaseUser) {
      router.push('/login?redirect=/report/' + reportId);
      return;
    }

    const fetchReportData = async () => {
      try {
        // Récupérer le token Firebase
        const token = await firebaseUser.getIdToken();

        const response = await fetch(`/api/reports/${reportId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Rapport non disponible');
        }

        const data = await response.json();
        const report = data.report;

        // Debug: vérifier les données Melo
        if (report?.profileData?.market?.melo) {
          console.log('[Report Page] Données Melo trouvées:', {
            listingsCount: report.profileData.market.melo.similarListings?.length || 0,
            hasInsights: !!report.profileData.market.melo.marketInsights,
          });
        } else {
          console.log('[Report Page] Pas de données Melo dans le rapport');
        }

        setReportData(report);

        // Si les données DPE sont vides, essayer de les récupérer automatiquement
        if (!report?.profileData?.energy?.dpe || !report.profileData.energy.dpe.class_energy) {
          try {
            const energyResponse = await fetch(`/api/reports/${reportId}/energy`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });

            if (energyResponse.ok) {
              const energyData = await energyResponse.json();
              if (energyData.success && energyData.energy?.dpe) {
                // Recharger le rapport avec les nouvelles données DPE
                const updatedResponse = await fetch(`/api/reports/${reportId}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                });

                if (updatedResponse.ok) {
                  const updatedData = await updatedResponse.json();
                  setReportData(updatedData.report);
                }
              }
            }
          } catch (energyError) {
            // Ignorer les erreurs de récupération DPE, ne pas bloquer l'affichage
            console.debug('Erreur récupération DPE:', energyError);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [reportId, router, firebaseUser, authLoading]);

  // Afficher le spinner pendant le chargement de l'auth ou du rapport
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0A0B0D] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen bg-[#0A0B0D] text-white">
        <ReportHeader />
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="bg-white/[0.02] backdrop-blur-xl rounded-xl shadow-sm border border-white/10 p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Rapport non disponible</h2>
            <p className="text-white/70 mb-6">{error || 'Ce rapport n\'existe pas ou n\'est pas encore généré.'}</p>
            <button
              onClick={() => router.push('/account')}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Retour au compte
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Conversion sécurisée
  let sections: any[] = [];
  try {
    if (reportData.profileData) {
      sections = convertHouseProfileToSections(reportData.profileData);
    } else {
      console.warn("Report profileData is missing in reportData", reportData);
    }
  } catch (err) {
    console.error("Error converting profile to sections:", err);
  }

  // Préparation des données pour la vue Premium
  // On passe un objet "report" conforme à l'interface de PremiumReportView
  const premiumReportData = {
    sections,
    vehicleInfo: reportData.address, // mapping address to vehicleInfo (fallback prop name)
    ai: reportData.report ? {
      score: reportData.report.score,
      summary: reportData.report.summary,
      recommendations: reportData.profileData?.recommendations?.items?.map((item: any) => `${item.title}: ${item.reason}`) || []
    } : undefined
  };

  return (
    <PremiumReportView
      report={premiumReportData}
    />
  );
}
