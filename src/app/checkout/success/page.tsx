'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Container from '@/app/(components)/Container';
import { CheckCircleIcon, EnvelopeIcon, UserIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/app/(context)/AuthContext';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  const email = searchParams.get('email');
  const plan = searchParams.get('plan');
  // Stripe redirige avec payment_intent dans l'URL après un paiement réussi
  const paymentIntentId = searchParams.get('payment_intent');

  useEffect(() => {
    const processPayment = async () => {
      // Si pas de payment_intent, on essaie quand même avec email et plan
      // (peut être appelé depuis PaymentModal directement)
      if (!email || !plan) {
        setLoading(false);
        return;
      }

      // Si pas de payment_intent, on attend un peu et on essaie quand même
      if (!paymentIntentId) {
        console.warn('No payment_intent in URL, trying to process anyway...');
      }

      try {
        setLoading(true);
        // Attendre un peu que le webhook soit traité (si payment_intent existe)
        // Réduit à 500ms pour être plus rapide
        if (paymentIntentId) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        const response = await fetch('/api/handle-payment-success', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            paymentIntentId: paymentIntentId || undefined, 
            email, 
            sku: plan 
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setResult(data);
          
          // Afficher le résultat immédiatement sans attendre les autres actions
          setLoading(false);
          
          // Connexion automatique si nouveau compte (en arrière-plan)
          if (data.newAccount && data.password && email) {
            setIsConnecting(true);
            // Faire la connexion sans attendre
            signInWithEmailAndPassword(auth, email, data.password)
              .then((userCredential) => {
                console.log('Connexion automatique réussie:', userCredential.user.uid);
                setIsConnecting(false);
              })
              .catch((error: any) => {
                console.error('Erreur lors de la connexion automatique:', error);
                setIsConnecting(false);
              });
          }
          
          // Envoyer l'email avec les credentials (en arrière-plan, sans bloquer)
          if (data.newAccount && data.password) {
            // Ne pas attendre la réponse de l'email
            fetch('/api/send-credentials-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email,
                password: data.password,
                plan: data.productName,
              }),
            }).catch((emailError) => {
              console.error('Erreur lors de l\'envoi de l\'email:', emailError);
              // On continue même si l'email échoue
            });
          }
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors du traitement');
        }
      } catch (error) {
        console.error('Erreur:', error);
        setLoading(false);
      }
    };

    processPayment();
  }, [paymentIntentId, email, plan]);

  if (loading || isConnecting) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100">
        <main className="py-8 sm:py-12 md:py-20">
          <Container>
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">
                {isConnecting ? 'Connexion en cours...' : 'Traitement en cours...'}
              </p>
            </div>
          </Container>
        </main>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100">
        <main className="py-8 sm:py-12 md:py-20">
          <Container>
            <div className="max-w-2xl mx-auto">
              <div className="bg-red-50 border border-red-200 rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-lg text-center">
                <h2 className="text-xl sm:text-2xl font-semibold text-red-900 mb-2">Erreur lors du traitement</h2>
                <p className="text-red-700">Impossible de traiter votre paiement. Veuillez contacter le support.</p>
              </div>
            </div>
          </Container>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100">
      <main className="py-8 sm:py-12 md:py-20">
        <Container>
          <div className="max-w-2xl mx-auto">
            {/* Header de succès */}
            <div className="text-center mb-6 sm:mb-8">
              <div className="w-16 sm:w-20 h-16 sm:h-20 mx-auto bg-green-600 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                <CheckCircleIcon className="w-8 sm:w-10 h-8 sm:h-10 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">
                {result.newAccount ? 'Bienvenue !' : 'Paiement confirmé !'}
              </h1>
              <p className="text-base sm:text-lg text-gray-700">
                {result.newAccount 
                  ? 'Votre compte a été créé et vos crédits ont été ajoutés.'
                  : 'Vos crédits ont été ajoutés à votre compte.'
                }
              </p>
            </div>

            {/* Informations de paiement */}
            <div className="bg-white border border-purple-200 rounded-lg sm:rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-lg">
              <div className="flex items-center mb-4 sm:mb-6">
                <CreditCardIcon className="w-5 h-5 text-purple-600 mr-3" />
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Détails de l'achat</h2>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm sm:text-base">Produit</span>
                  <span className="font-semibold text-gray-900 text-sm sm:text-base">{result.productName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm sm:text-base">Montant</span>
                  <span className="font-semibold text-gray-900 text-sm sm:text-base">{result.amount.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm sm:text-base">Crédits ajoutés</span>
                  <span className="font-semibold text-green-600 text-sm sm:text-base">+{result.creditsAdded}</span>
                </div>
              </div>
            </div>

            {/* Informations de connexion pour nouveau compte */}
            {result.newAccount && result.password && (
              <div className="bg-white border border-purple-200 rounded-lg sm:rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-lg">
                <div className="flex items-center mb-4 sm:mb-6">
                  <UserIcon className="w-5 h-5 text-purple-600 mr-3" />
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Vos identifiants de connexion</h2>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Email</label>
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-300">
                      <span className="font-mono text-gray-900 text-sm sm:text-base break-all">{email}</span>
                      <button 
                        onClick={() => navigator.clipboard.writeText(email || '')}
                        className="text-gray-600 hover:text-purple-600 transition-colors ml-2 flex-shrink-0"
                        title="Copier"
                      >
                        <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Mot de passe</label>
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-300">
                      <span className="font-mono text-gray-900 text-sm sm:text-base break-all">{result.password}</span>
                      <button 
                        onClick={() => navigator.clipboard.writeText(result.password || '')}
                        className="text-gray-600 hover:text-purple-600 transition-colors ml-2 flex-shrink-0"
                        title="Copier"
                      >
                        <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-4 sm:mt-6 bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-amber-800">
                    ⚠️ Conservez ces informations en sécurité. Un email avec ces identifiants vous a été envoyé.
                  </p>
                </div>
              </div>
            )}

            {/* Statut email */}
            <div className="bg-green-50 border border-green-200 rounded-lg sm:rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-lg">
              <div className="flex items-center">
                <EnvelopeIcon className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Email envoyé</h3>
                  <p className="text-sm sm:text-base text-gray-700 mt-1">
                    Un email avec vos identifiants a été envoyé à <strong className="text-gray-900">{email}</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 sm:space-y-4">
              <button
                onClick={() => router.push('/generate-report')}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all text-base sm:text-lg shadow-lg hover:shadow-xl"
              >
                Générer mon rapport
              </button>
              <button
                onClick={() => router.push('/account')}
                className="w-full bg-gray-200 text-gray-900 px-4 sm:px-6 py-3 sm:py-4 rounded-lg font-semibold hover:bg-gray-300 transition-all text-base sm:text-lg"
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
      <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
