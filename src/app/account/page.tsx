'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/app/(components)/Header';
import Container from '@/app/(components)/Container';
import { useAuth } from '@/app/(context)/AuthContext';
import { getUserCredits } from '@/lib/user';
import { GenerateReportModal } from '@/app/(components)/GenerateReportModal';
import { ReportsList } from '@/app/(components)/ReportsList';
import { motion } from 'framer-motion';
import {
  PlusIcon,
  SparklesIcon,
  DocumentTextIcon,
  ShoppingCartIcon,
  ArrowRightIcon,
  UserIcon,
  BoltIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';

/**
 * Page de compte utilisateur - Design Premium & Épuré
 */
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
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!firebaseUser) {
    return null;
  }

  const userName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Utilisateur';
  const userEmail = firebaseUser.email || '';
  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Header />
      <main className="pt-8 sm:pt-12 pb-16">
        <Container>
          <div className="max-w-6xl mx-auto">

            {/* Header minimaliste */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 sm:mb-16"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center text-white font-black text-sm shadow-xl">
                    {initials}
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight uppercase">{userName}</h1>
                    <p className="text-sm font-medium text-gray-400">{userEmail}</p>
                  </div>
                </div>

                {/* Badge crédits - Style émeraude premium */}
                <div className="flex items-center gap-3 px-5 py-2.5 bg-white rounded-2xl border border-gray-100 shadow-sm self-start sm:self-auto">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <SparklesIcon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Solde actuel</p>
                    <span className="text-base font-black text-gray-900">
                      {loading ? '...' : credits !== null ? credits : 0} CREDIT{credits !== 1 ? 'S' : ''}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* CTA Principal - Carte Premium */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-12"
            >
              <div className="bg-white rounded-[32px] border border-gray-100 p-8 sm:p-12 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
                  <BoltIcon className="w-48 h-48 text-black" />
                </div>

                <div className="relative z-10 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-widest mb-6">
                    Prêt à l'emploi
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4 tracking-tighter uppercase">
                    Nouveau rapport
                  </h2>
                  <p className="text-base sm:text-lg text-gray-500 mb-10 font-medium">
                    Obtenez une analyse complète et impartiale de n'importe quel bien immobilier en quelques instants.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => setShowGenerateModal(true)}
                      disabled={!credits || credits <= 0}
                      className="inline-flex items-center justify-center gap-3 bg-black text-white hover:bg-gray-800 font-black py-5 px-10 rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-black/10 group uppercase text-sm tracking-wide"
                    >
                      <PlusIcon className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                      Générer le rapport
                    </button>

                    {(!credits || credits <= 0) && (
                      <button
                        onClick={() => router.push('/checkout')}
                        className="inline-flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold py-5 px-8 rounded-2xl transition-all duration-300 shadow-sm text-sm uppercase tracking-wide"
                      >
                        Acheter des crédits
                        <ArrowRightIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Liste des rapports - Colonne de gauche (large) */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-sm font-black text-gray-900 flex items-center gap-3 uppercase tracking-widest">
                    <div className="w-2 h-2 rounded-full bg-black"></div>
                    Mes derniers rapports
                  </h2>
                </div>
                <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                  <ReportsList />
                </div>
              </div>

              {/* Sidebar Actions - Colonne de droite */}
              <div className="space-y-6">
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-8">
                  Actions rapides
                </h2>

                <button
                  onClick={() => router.push('/checkout')}
                  className="w-full flex items-center justify-between p-6 rounded-2xl bg-white border border-gray-100 hover:border-black transition-all group shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-black transition-colors">
                      <ShoppingCartIcon className="w-6 h-6 text-gray-900 group-hover:text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-black text-gray-900 text-sm uppercase">Boutique</p>
                      <p className="text-xs text-gray-400 font-medium">Prendre plus de crédits</p>
                    </div>
                  </div>
                  <ArrowRightIcon className="w-5 h-5 text-gray-300 group-hover:text-black group-hover:translate-x-1 transition-all" />
                </button>

                <a
                  href="mailto:support@verifiemamaison.fr"
                  className="w-full flex items-center justify-between p-6 rounded-2xl bg-white border border-gray-100 hover:border-black transition-all group shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-black transition-colors">
                      <QuestionMarkCircleIcon className="w-6 h-6 text-gray-900 group-hover:text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-black text-gray-900 text-sm uppercase">Support</p>
                      <p className="text-xs text-gray-400 font-medium">Une question ?</p>
                    </div>
                  </div>
                  <ArrowRightIcon className="w-5 h-5 text-gray-300 group-hover:text-black group-hover:translate-x-1 transition-all" />
                </a>

                <div className="p-8 bg-black rounded-[32px] text-white overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <SparklesIcon className="w-20 h-20" />
                  </div>
                  <h3 className="text-lg font-black uppercase mb-2 tracking-tight">Besoin d'aide ?</h3>
                  <p className="text-sm text-gray-400 mb-6 font-medium">Notre équipe est là pour vous accompagner dans vos projets immobiliers.</p>
                  <Link href="/legal/contact" className="text-xs font-black uppercase tracking-widest hover:underline flex items-center gap-2">
                    Nous contacter
                    <ArrowRightIcon className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </Container>
      </main>

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
