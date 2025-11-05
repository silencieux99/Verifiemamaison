'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/app/(components)/Header';
import Container from '@/app/(components)/Container';
import { useAuth } from '@/app/(context)/AuthContext';
import { getUserCredits } from '@/lib/user';

/**
 * Page de compte utilisateur
 */
export default function AccountPage() {
  const { firebaseUser } = useAuth();
  const router = useRouter();
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800">
      <Header />
      <main className="py-20">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-8">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Mon compte
              </span>
            </h1>

            <div className="bg-gray-800 border border-purple-500/20 rounded-lg p-6 mb-6">
              <h2 className="text-2xl font-semibold text-white mb-4">Mes crédits</h2>
              {loading ? (
                <p className="text-gray-400">Chargement...</p>
              ) : (
                <p className="text-3xl font-bold text-white">
                  {credits !== null ? `${credits} rapport${credits > 1 ? 's' : ''} disponible${credits > 1 ? 's' : ''}` : '0 rapport disponible'}
                </p>
              )}
              <button
                onClick={() => router.push('/checkout')}
                className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-200"
              >
                Acheter des crédits
              </button>
            </div>

            <div className="bg-gray-800 border border-purple-500/20 rounded-lg p-6 mb-6">
              <h2 className="text-2xl font-semibold text-white mb-4">Mes rapports</h2>
              <p className="text-gray-400 mb-4">Vos rapports générés apparaîtront ici.</p>
            </div>

            <div className="bg-gray-800 border border-purple-500/20 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-white mb-4">Générer un rapport</h2>
              <button
                onClick={() => router.push('/generate-report')}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                Générer un nouveau rapport
              </button>
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}

