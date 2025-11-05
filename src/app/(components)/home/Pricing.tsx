'use client';

import Container from '../Container';
import { pricingPlans, calculateSavings } from '@/lib/pricing';
import { useRouter } from 'next/navigation';
import { CheckIcon } from '@heroicons/react/24/solid';

/**
 * Section Tarifs pour VerifieMaMaison
 */
export default function Pricing() {
  const router = useRouter();

  const handleSelectPlan = (sku: string) => {
    router.push(`/checkout?plan=${sku}`);
  };

  return (
    <section id="tarifs" className="py-20 bg-white">
      <Container>
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Choisissez votre formule
            </span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Des tarifs transparents adaptés à tous les besoins
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan) => {
            const savings = calculateSavings(plan);
            return (
              <div
                key={plan.id}
                className={`relative bg-white border rounded-lg p-8 shadow-lg ${
                  plan.highlight
                    ? 'border-purple-500 shadow-purple-500/20 scale-105'
                    : 'border-gray-200'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.priceLabel}</span>
                    {savings && (
                      <p className="text-green-600 text-sm mt-1">
                        {plan.savingsNote} ({savings.toFixed(2)}€)
                      </p>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm">
                    {plan.reports} rapport{plan.reports > 1 ? 's' : ''} inclus
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPlan(plan.sku)}
                  className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 ${
                    plan.highlight
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:shadow-purple-500/30'
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  }`}
                >
                  Choisir cette offre
                </button>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

