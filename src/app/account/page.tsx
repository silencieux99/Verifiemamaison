'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/app/(components)/Header';
import { useAuth } from '@/app/(context)/AuthContext';
import { getUserCredits } from '@/lib/user';
import { GenerateReportModal } from '@/app/(components)/GenerateReportModal';
import { ReportsList } from '@/app/(components)/ReportsList';
import { motion, Variants } from 'framer-motion';
import {
  PlusIcon,
  SparklesIcon,
  ShoppingCartIcon,
  ArrowRightIcon,
  QuestionMarkCircleIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

/**
 * Page de compte utilisateur - V4 Mobile Optimized & Polished
 * Expérience animée, fluide et optimisée mobile (Grand Angle).
 */

const pageVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 40, damping: 20 } }
};

export default function AccountPage() {
  const { firebaseUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!firebaseUser) {
      router.push('/login');
      return;
    }

    const fetchAllData = async () => {
      try {
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-100 border-t-black rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!firebaseUser) return null;

  const userName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Utilisateur';
  const userEmail = firebaseUser.email || '';

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-900 font-sans selection:bg-black selection:text-white overflow-x-hidden">
      <Header />

      <motion.main
        variants={pageVariants}
        initial="hidden"
        animate="show"
        className="pt-32 md:pt-40 pb-20 md:pb-32"
      >
        <div className="max-w-screen-xl mx-auto px-4 sm:px-10 lg:px-16">

          {/* Header de profil Panorama */}
          <motion.header
            variants={sectionVariants}
            className="mb-16 md:mb-24 flex flex-col md:flex-row md:items-center justify-between gap-8 md:gap-12 border-b border-gray-100 pb-12 md:pb-16"
          >
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 md:gap-8 text-center sm:text-left">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-200 shadow-sm overflow-hidden"
              >
                <UserCircleIcon className="w-full h-full p-2" />
              </motion.div>
              <div>
                <h1 className="text-4xl md:text-7xl font-bold tracking-tighter text-gray-900 leading-[0.9] mb-3 md:mb-4">
                  Votre espace, <br />
                  <span className="text-gray-300">{userName}.</span>
                </h1>
                <p className="text-xs md:text-sm font-bold text-gray-400 tracking-[0.2em] uppercase">{userEmail}</p>
              </div>
            </div>

            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white border border-gray-100 p-6 md:p-10 rounded-[32px] md:rounded-[40px] shadow-sm flex flex-col items-center md:items-end w-full md:w-auto min-w-[200px] md:min-w-[240px] transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-3 mb-2 md:mb-3">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-300">Solde rapport</span>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="text-4xl md:text-5xl font-bold tracking-tighter text-gray-900 flex items-baseline gap-2">
                {loading ? '...' : credits !== null ? credits : 0}
                <span className="text-[10px] md:text-xs uppercase tracking-widest text-gray-300 font-black">Credits</span>
              </div>
            </motion.div>
          </motion.header>

          <div className="flex flex-col gap-12 md:gap-24">

            {/* Hero Banner Large */}
            <motion.section
              variants={sectionVariants}
              className="relative overflow-hidden bg-white border border-gray-100 rounded-[32px] md:rounded-[48px] p-6 md:p-24 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.03)] group"
            >
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-50 rounded-full blur-[100px] opacity-40 -mr-32 -mt-32 transition-transform duration-1000 group-hover:scale-110 pointer-events-none" />

              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-3 mb-6 md:mb-10 px-4 py-2 bg-black text-white rounded-full">
                  <PlusIcon className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Prêt pour l'analyse</span>
                </div>

                <h2 className="text-3xl md:text-6xl font-bold tracking-tighter text-gray-900 mb-6 md:mb-8 leading-[0.95]">
                  Obtenez votre prochain <br className="hidden md:block" /> rapport en 2 minutes.
                </h2>

                <p className="text-base md:text-xl text-gray-400 font-medium leading-relaxed mb-10 md:mb-16 max-w-xl">
                  Bénéficiez d'une expertise totale : DVF, risques, écoles et analyse IA pour n'importe quelle adresse en France.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 md:gap-6">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowGenerateModal(true)}
                    disabled={!credits || credits <= 0}
                    className="h-16 md:h-20 px-8 md:px-12 bg-black text-white text-[10px] md:text-[11px] font-bold uppercase tracking-[0.3em] rounded-2xl md:rounded-3xl flex items-center justify-center gap-4 transition-colors hover:bg-gray-900 disabled:opacity-30 shadow-2xl shadow-black/20"
                  >
                    Générer maintenant
                    <ArrowRightIcon className="w-5 h-5" />
                  </motion.button>

                  {(!credits || credits <= 0) && (
                    <Link href="/checkout">
                      <motion.div
                        whileHover={{ scale: 1.02, backgroundColor: '#F9FAFB' }}
                        whileTap={{ scale: 0.98 }}
                        className="h-16 md:h-20 px-8 md:px-12 bg-white border border-gray-200 text-gray-900 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.3em] rounded-2xl md:rounded-3xl flex items-center justify-center gap-4 transition-colors shadow-sm"
                      >
                        Acheter des crédits
                      </motion.div>
                    </Link>
                  )}
                </div>
              </div>
            </motion.section>

            {/* Reports & Actions Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-16">

              {/* Reports List - Expanded Area */}
              <motion.div variants={sectionVariants} className="lg:col-span-8 order-2 lg:order-1">
                <div className="flex items-center gap-6 mb-8 md:mb-12">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-300">Historique des rapports</h3>
                  <div className="h-px bg-gray-100 flex-1" />
                </div>
                <div className="bg-white border border-gray-100 rounded-[32px] md:rounded-[40px] overflow-hidden shadow-sm">
                  <ReportsList />
                </div>
              </motion.div>

              {/* Sidebar Quick Actions */}
              <motion.div variants={sectionVariants} className="lg:col-span-4 flex flex-col gap-8 md:gap-12 order-1 lg:order-2">
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-300 mb-6 md:mb-8 px-4">Menu Rapide</h3>
                  <div className="space-y-4">
                    <Link href="/checkout" className="no-underline">
                      <motion.div
                        whileHover={{ x: 5, borderColor: '#E5E7EB' }}
                        className="group flex items-center justify-between p-6 md:p-10 bg-white border border-gray-50 rounded-[24px] md:rounded-[32px] transition-all shadow-sm"
                      >
                        <div className="flex items-center gap-4 md:gap-6">
                          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white transition-all duration-300">
                            <ShoppingCartIcon className="w-5 h-5 md:w-6 md:h-6" />
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase tracking-widest text-gray-900">Boutique</p>
                            <p className="text-[10px] font-medium text-gray-400 mt-1 uppercase tracking-wider">Acheter des packs</p>
                          </div>
                        </div>
                        <ArrowRightIcon className="w-5 h-5 text-gray-200 group-hover:text-black group-hover:translate-x-1 transition-all" />
                      </motion.div>
                    </Link>

                    <a href="mailto:support@verifiemamaison.fr" className="no-underline">
                      <motion.div
                        whileHover={{ x: 5, borderColor: '#E5E7EB' }}
                        className="group flex items-center justify-between p-6 md:p-10 bg-white border border-gray-50 rounded-[24px] md:rounded-[32px] transition-all shadow-sm"
                      >
                        <div className="flex items-center gap-4 md:gap-6">
                          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white transition-all duration-300">
                            <QuestionMarkCircleIcon className="w-5 h-5 md:w-6 md:h-6" />
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase tracking-widest text-gray-900">Aide VIP</p>
                            <p className="text-[10px] font-medium text-gray-400 mt-1 uppercase tracking-wider">Expertise Immobilière</p>
                          </div>
                        </div>
                        <ArrowRightIcon className="w-5 h-5 text-gray-200 group-hover:text-black group-hover:translate-x-1 transition-all" />
                      </motion.div>
                    </a>
                  </div>
                </div>

                <div className="p-8 md:p-12 bg-gray-100 rounded-[32px] md:rounded-[48px] relative overflow-hidden group hover:bg-gray-200/50 transition-colors duration-500 cursor-default">
                  <div className="absolute bottom-0 right-0 p-8 opacity-5 transition-transform duration-700 group-hover:-rotate-12 group-hover:scale-125">
                    <SparklesIcon className="w-24 h-24 md:w-32 md:h-32" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold tracking-tight text-gray-900 mb-3 md:mb-4">Un besoin spécifique ?</h3>
                  <p className="text-xs md:text-sm text-gray-500 leading-relaxed mb-8 md:mb-10 font-medium">
                    Nos experts analysent vos dossiers complexes sous 24h. Profitez d'un accompagnement personnalisé.
                  </p>
                  <Link href="/legal/contact" className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-900 inline-flex items-center gap-2 hover:opacity-60 transition-opacity no-underline">
                    Nous écrire <ArrowRightIcon className="w-3 h-3" />
                  </Link>
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </motion.main>

      <GenerateReportModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onSuccess={(reportId) => {
          setShowGenerateModal(false);
          router.push(`/report/${reportId}`);
        }}
      />

      <footer className="py-20 text-center border-t border-gray-50">
        <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-gray-200">VerifieMaMaison.fr — Propriété Intellectuelle 2024</p>
      </footer>
    </div>
  );
}
