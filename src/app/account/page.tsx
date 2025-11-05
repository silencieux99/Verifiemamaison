'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/app/(components)/Header';
import Container from '@/app/(components)/Container';
import { useAuth } from '@/app/(context)/AuthContext';
import { getUserCredits } from '@/lib/user';
import { GenerateReportModal } from '@/app/(components)/GenerateReportModal';

/**
 * Page de compte utilisateur
 */
export default function AccountPage() {
  const { firebaseUser } = useAuth();
  const router = useRouter();
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  useEffect(() => {
    if (!firebaseUser) {
      router.push('/login');
      return;
    }

    const fetchCredits = async () => {
      try {
        const userCredits = await getUserCredits(firebaseUser.uid);
        setCredits(userCredits);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();
  }, [firebaseUser, router]);

  if (!firebaseUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100">
      <Header />
      <main className="py-8 sm:py-12 md:py-20">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 sm:mb-8">
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Mon compte
              </span>
            </h1>

            <div className="bg-white border border-purple-200 rounded-lg sm:rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-lg">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">Mes crédits</h2>
              {loading ? (
                <p className="text-gray-600">Chargement...</p>
              ) : (
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                  {credits !== null ? `${credits} rapport${credits > 1 ? 's' : ''} disponible${credits > 1 ? 's' : ''}` : '0 rapport disponible'}
                </p>
              )}
              <button
                onClick={() => router.push('/checkout')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-200 text-sm sm:text-base"
              >
                Acheter des crédits
              </button>
            </div>

            <div className="bg-white border border-purple-200 rounded-lg sm:rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-lg">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">Mes rapports</h2>
              <p className="text-gray-600 mb-4">Vos rapports générés apparaîtront ici.</p>
              {/* TODO: Liste des rapports générés */}
            </div>

            <div className="bg-white border border-purple-200 rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-lg">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">Générer un rapport</h2>
              <button
                onClick={() => setShowGenerateModal(true)}
                disabled={!credits || credits <= 0}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 sm:px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Générer un nouveau rapport
              </button>
              {(!credits || credits <= 0) && (
                <p className="text-gray-600 text-sm mt-3 text-center">
                  Vous n'avez plus de crédits. <button onClick={() => router.push('/checkout')} className="text-purple-600 hover:underline">Acheter des crédits</button>
                </p>
              )}
            </div>
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

