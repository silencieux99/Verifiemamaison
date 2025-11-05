'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/app/(components)/Header';
import Container from '@/app/(components)/Container';
import { pricingPlans } from '@/lib/pricing';
import { useAuth } from '@/app/(context)/AuthContext';
import { useRouter } from 'next/navigation';

/**
 * Page de checkout pour VerifieMaMaison
 */
export default function CheckoutPage() {
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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800">
      <Header />
      <main className="py-20">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-8 text-center">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Choisissez votre formule
              </span>
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {pricingPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`bg-gray-800 border rounded-lg p-6 ${
                    selectedPlan === plan.sku || plan.highlight
                      ? 'border-purple-500 shadow-lg shadow-purple-500/20'
                      : 'border-gray-700'
                  }`}
                >
                  {plan.badge && (
                    <div className="text-center mb-4">
                      <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-white">{plan.priceLabel}</span>
                  </div>

                  <button
                    onClick={() => handleCheckout(plan.sku)}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-200 disabled:opacity-50"
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

