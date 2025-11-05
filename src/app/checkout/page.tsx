'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/app/(components)/Header';
import Container from '@/app/(components)/Container';
import { pricingPlans } from '@/lib/pricing';
import { useAuth } from '@/app/(context)/AuthContext';

/**
 * Contenu interne de la page checkout (utilise useSearchParams)
 */
function CheckoutContentInner() {
  const searchParams = useSearchParams();
  const { firebaseUser } = useAuth();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const plan = searchParams.get('plan');
    if (plan) {
      setSelectedPlan(plan);
    }
  }, [searchParams]);

  const handleCheckout = async (sku: string) => {
    if (!firebaseUser) {
      router.push('/login?redirect=/checkout');
      return;
    }

    setLoading(true);
    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          sku,
          successUrl: `${window.location.origin}/checkout/success`,
          cancelUrl: `${window.location.origin}/checkout`,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création de la session de paiement');
      }

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100">
      <Header />
      <main className="py-8 sm:py-12 md:py-20">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 sm:mb-8 text-center">
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Choisissez votre formule
              </span>
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {pricingPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`bg-white border rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-lg ${
                    selectedPlan === plan.sku || plan.highlight
                      ? 'border-purple-500 shadow-xl shadow-purple-500/20 scale-105'
                      : 'border-gray-200'
                  }`}
                >
                  {plan.badge && (
                    <div className="text-center mb-3 sm:mb-4">
                      <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4">{plan.description}</p>
                  <div className="mb-3 sm:mb-4">
                    <span className="text-2xl sm:text-3xl font-bold text-gray-900">{plan.priceLabel}</span>
                  </div>

                  <button
                    onClick={() => handleCheckout(plan.sku)}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2.5 sm:py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-200 disabled:opacity-50 text-sm sm:text-base"
                  >
                    {loading ? 'Chargement...' : 'Choisir cette offre'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}

/**
 * Wrapper avec Suspense pour useSearchParams
 */
function CheckoutContent() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100">
        <Header />
        <main className="py-8 sm:py-12 md:py-20">
          <Container>
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement...</p>
            </div>
          </Container>
        </main>
      </div>
    }>
      <CheckoutContentInner />
    </Suspense>
  );
}

export default function CheckoutPage() {
  return <CheckoutContent />;
}

