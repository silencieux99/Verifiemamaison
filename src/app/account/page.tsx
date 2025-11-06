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
  Plus, 
  Sparkles, 
  FileText, 
  ShoppingCart,
  ArrowRight,
  User,
  Zap
} from 'lucide-react';

/**
 * Page de compte utilisateur - Style startup épuré et moderne
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
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
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-8 pb-16">
        <Container>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Header minimaliste */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-semibold text-sm">
                    {initials}
                  </div>
                  <div>
                    <h1 className="text-2xl font-semibold text-gray-900">{userName}</h1>
                    <p className="text-sm text-gray-500">{userEmail}</p>
                  </div>
                </div>
                
                {/* Badge crédits */}
                <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full border border-purple-100">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-semibold text-purple-900">
                    {loading ? '...' : credits !== null ? credits : 0} crédit{credits !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* CTA Principal - Style startup */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-12"
            >
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
                <div className="relative bg-white rounded-2xl border border-gray-200 p-8 hover:border-gray-300 transition-colors">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                        Nouveau rapport
                      </h2>
                      <p className="text-gray-600">
                        Analysez un bien immobilier en quelques minutes
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  <button
                    onClick={() => setShowGenerateModal(true)}
                    disabled={!credits || credits <= 0}
                    className="w-full bg-gray-900 text-white hover:bg-gray-800 font-medium py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    <span>Générer un rapport</span>
                  </button>

                  {(!credits || credits <= 0) && (
                    <div className="mt-4 text-center">
                      <button 
                        onClick={() => router.push('/checkout')}
                        className="text-sm text-purple-600 hover:text-purple-700 font-medium inline-flex items-center gap-1"
                      >
                        Acheter des crédits
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Actions rapides - Style minimaliste */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-12"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => router.push('/checkout')}
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5 text-purple-600" />
                    </div>
                    <span className="font-medium text-gray-900">Acheter des crédits</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                </button>
                
                <a
                  href="mailto:support@verifiemamaison.fr"
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="font-medium text-gray-900">Support</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                </a>
              </div>
            </motion.div>

            {/* Mes rapports - Style épuré */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              id="reports"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-400" />
                  Mes rapports
                </h2>
                {credits && credits > 0 && (
                  <button
                    onClick={() => setShowGenerateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Nouveau
                  </button>
                )}
              </div>
              
              <div className="bg-white rounded-xl border border-gray-200">
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
