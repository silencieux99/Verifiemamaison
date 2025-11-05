'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/app/(components)/Header';
import Container from '@/app/(components)/Container';
import { useAuth } from '@/app/(context)/AuthContext';
import { getUserCredits } from '@/lib/user';
import { GenerateReportModal } from '@/app/(components)/GenerateReportModal';
import { ReportsList } from '@/app/(components)/ReportsList';
import { motion } from 'framer-motion';
import {
  HomeIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  ArrowRightIcon,
  PlusIcon,
  ShoppingCartIcon,
  SparklesIcon,
  UserCircleIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';


/**
 * Page de compte utilisateur - Version complète et moderne
 */
export default function AccountPage() {
  const { firebaseUser, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  useEffect(() => {
    // Attendre que Firebase Auth finisse de vérifier l'état de l'utilisateur
    if (authLoading) {
      return;
    }

    // Si l'authentification est terminée et qu'il n'y a pas d'utilisateur, rediriger
    if (!firebaseUser) {
      router.push('/login');
      return;
    }

    const fetchAllData = async () => {
      try {
        // Récupérer les crédits
        const userCredits = await getUserCredits(firebaseUser.uid);
        setCredits(userCredits);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [firebaseUser, router, authLoading]);

  // Afficher un spinner pendant le chargement de l'auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!firebaseUser) {
    return null;
  }

  const userName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Utilisateur';
  const userEmail = firebaseUser.email || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <Header />
      <main className="py-4 sm:py-6 lg:py-8">
        <Container>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Header avec informations utilisateur */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 sm:mb-8"
            >
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-purple-100 p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
                      <UserCircleIcon className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                        Bonjour {userName} 👋
                      </h1>
                      <p className="text-gray-600 text-sm sm:text-base">{userEmail}</p>
                      <p className="text-gray-500 text-xs sm:text-sm mt-1">Gérez vos rapports et votre compte</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl px-4 sm:px-6 py-3 sm:py-4 shadow-lg">
                      <div className="flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        <div>
                          <div className="text-xs text-purple-100">Crédits</div>
                          <div className="text-2xl sm:text-3xl font-bold text-white">
                            {loading ? '...' : credits !== null ? credits : 0}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Section principale - Grid responsive */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              
              {/* CTA Principal - Générer un rapport */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="lg:col-span-2"
              >
                <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 rounded-2xl sm:rounded-3xl shadow-xl p-6 sm:p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold mb-2">
                          Générer un nouveau rapport
                        </h2>
                        <p className="text-purple-100 text-sm sm:text-base">
                          Analysez n'importe quel bien immobilier en quelques minutes
                        </p>
                      </div>
                      <div className="hidden sm:block">
                        <HomeIcon className="w-8 h-8 text-purple-200" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <div className="flex items-center mb-2">
                          <MapPinIcon className="h-5 w-5 text-purple-200 mr-2" />
                          <span className="font-medium text-sm">Par adresse</span>
                        </div>
                        <p className="text-purple-100 text-xs">123 rue de la République</p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <div className="flex items-center mb-2">
                          <DocumentTextIcon className="h-5 w-5 text-purple-200 mr-2" />
                          <span className="font-medium text-sm">Analyse complète</span>
                        </div>
                        <p className="text-purple-100 text-xs">11 sources de données</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowGenerateModal(true)}
                      disabled={!credits || credits <= 0}
                      className="w-full bg-white text-purple-600 hover:bg-purple-50 font-bold py-4 sm:py-5 rounded-xl shadow-xl transition-all duration-200 flex items-center justify-center gap-2 text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <PlusIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span>Générer un rapport</span>
                    </button>

                    {(!credits || credits <= 0) && (
                      <p className="text-purple-200 text-sm mt-4 text-center">
                        Vous n'avez plus de crédits. <button onClick={() => router.push('/checkout')} className="underline font-semibold">Acheter des crédits</button>
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Actions rapides et Statistiques */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-4 sm:space-y-6"
              >
                {/* Actions rapides */}
                <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Cog6ToothIcon className="w-5 h-5 text-purple-600" />
                    Actions rapides
                  </h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => router.push('/checkout')}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-purple-50 transition-colors border border-gray-200 hover:border-purple-300"
                    >
                      <div className="flex items-center gap-3">
                        <ShoppingCartIcon className="w-5 h-5 text-purple-600" />
                        <span className="font-medium text-gray-900">Acheter des crédits</span>
                      </div>
                      <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                    </button>
                    
                    <button
                      onClick={() => router.push('/account#reports')}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-purple-50 transition-colors border border-gray-200 hover:border-purple-300"
                    >
                      <div className="flex items-center gap-3">
                        <DocumentTextIcon className="w-5 h-5 text-purple-600" />
                        <span className="font-medium text-gray-900">Mes rapports</span>
                      </div>
                      <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                    </button>
                    
                    <a
                      href="mailto:support@verifiemamaison.fr"
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-purple-50 transition-colors border border-gray-200 hover:border-purple-300 block"
                    >
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium text-gray-900">Support</span>
                      </div>
                      <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                    </a>
                  </div>
                </div>

              </motion.div>
            </div>


            {/* Mes rapports */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              id="reports"
              className="mb-6 sm:mb-8"
            >
              <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 flex items-center gap-2">
                    <DocumentTextIcon className="w-6 h-6 text-purple-600" />
                    Mes rapports
                  </h2>
                  <button
                    onClick={() => setShowGenerateModal(true)}
                    className="hidden sm:flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors text-sm font-semibold"
                    disabled={!credits || credits <= 0}
                  >
                    <PlusIcon className="w-4 h-4" />
                    Nouveau
                  </button>
                </div>
                <ReportsList />
              </div>
            </motion.div>

          </div>
        </Container>
      </main>

      {/* Modale de génération de rapport */}
      <GenerateReportModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onSuccess={(reportId) => {
          setShowGenerateModal(false);
          router.push(`/report/${reportId}`);
        }}
      />
    </div>
  );
}

