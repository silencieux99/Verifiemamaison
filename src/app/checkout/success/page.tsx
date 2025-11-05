'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/app/(components)/Header';
import Container from '@/app/(components)/Container';
import { CheckCircleIcon, EnvelopeIcon, UserIcon, CreditCardIcon } from '@heroicons/react/24/outline';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const email = searchParams.get('email');
  const plan = searchParams.get('plan');
  const paymentIntentId = searchParams.get('payment_intent');

  useEffect(() => {
    const processPayment = async () => {
      if (!paymentIntentId || !email || !plan) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Attendre un peu que le webhook soit traité
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const response = await fetch('/api/handle-payment-success', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentIntentId, email, sku: plan }),
        });

        if (response.ok) {
          const data = await response.json();
          setResult(data);
          
          // Envoyer l'email avec les credentials
          if (data.newAccount && data.password) {
            await fetch('/api/send-credentials-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email,
                password: data.password,
                plan: data.productName,
              }),
            });
          }
        } else {
          throw new Error('Erreur lors du traitement');
        }
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    processPayment();
  }, [paymentIntentId, email, plan]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800">
        <Header />
        <main className="py-20">
          <Container>
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Traitement en cours...</p>
            </div>
          </Container>
        </main>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800">
        <Header />
        <main className="py-20">
          <Container>
            <div className="text-center text-red-400">Erreur lors du traitement</div>
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
          <div className="max-w-2xl mx-auto">
            {/* Header de succès */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto bg-green-600 rounded-full flex items-center justify-center mb-6">
                <CheckCircleIcon className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-3">
                {result.newAccount ? 'Bienvenue !' : 'Paiement confirmé !'}
              </h1>
              <p className="text-lg text-gray-300">
                {result.newAccount 
                  ? 'Votre compte a été créé et vos crédits ont été ajoutés.'
                  : 'Vos crédits ont été ajoutés à votre compte.'
                }
              </p>
            </div>

            {/* Informations de paiement */}
            <div className="bg-gray-800 border border-purple-500/20 rounded-lg p-6 mb-6">
              <div className="flex items-center mb-6">
                <CreditCardIcon className="w-5 h-5 text-purple-400 mr-3" />
                <h2 className="text-lg font-semibold text-white">Détails de l'achat</h2>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Produit</span>
                  <span className="font-semibold text-white">{result.productName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Montant</span>
                  <span className="font-semibold text-white">{result.amount.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Crédits ajoutés</span>
                  <span className="font-semibold text-green-400">+{result.creditsAdded}</span>
                </div>
              </div>
            </div>

            {/* Informations de connexion pour nouveau compte */}
            {result.newAccount && result.password && (
              <div className="bg-gray-800 border border-purple-500/20 rounded-lg p-6 mb-6">
                <div className="flex items-center mb-6">
                  <UserIcon className="w-5 h-5 text-purple-400 mr-3" />
                  <h2 className="text-lg font-semibold text-white">Vos identifiants de connexion</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                    <div className="flex items-center justify-between bg-gray-900 rounded-lg p-3 border border-gray-700">
                      <span className="font-mono text-white text-sm">{email}</span>
                      <button 
                        onClick={() => navigator.clipboard.writeText(email || '')}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Mot de passe</label>
                    <div className="flex items-center justify-between bg-gray-900 rounded-lg p-3 border border-gray-700">
                      <span className="font-mono text-white text-sm">{result.password}</span>
                      <button 
                        onClick={() => navigator.clipboard.writeText(result.password || '')}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-6 bg-amber-500/20 border border-amber-500/30 rounded-lg p-4">
                  <p className="text-sm text-amber-300">
                    ⚠️ Conservez ces informations en sécurité. Un email avec ces identifiants vous a été envoyé.
                  </p>
                </div>
              </div>
            )}

            {/* Statut email */}
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-6 mb-6">
              <div className="flex items-center">
                <EnvelopeIcon className="w-5 h-5 text-green-400 mr-3" />
                <div>
                  <h3 className="text-base font-semibold text-white">Email envoyé</h3>
                  <p className="text-sm text-gray-300 mt-1">
                    Un email avec vos identifiants a été envoyé à <strong>{email}</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <button
                onClick={() => router.push('/generate-report')}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all text-lg"
              >
                Générer mon rapport
              </button>
              <button
                onClick={() => router.push('/account')}
                className="w-full bg-gray-700 text-white px-6 py-4 rounded-lg font-semibold hover:bg-gray-600 transition-all"
              >
                Accéder à mon compte
              </button>
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Chargement...</div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
