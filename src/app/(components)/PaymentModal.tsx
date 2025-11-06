'use client';

import { Fragment, useState, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useRouter } from 'next/navigation';
import { pricingPlans } from '@/lib/pricing';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || '');

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState(pricingPlans.find(p => p.highlight) || pricingPlans[0]);
  const [showPayment, setShowPayment] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const intentCreatedRef = useRef(false); // Protection contre les doubles créations de PaymentIntent

  const handlePlanSelect = (plan: typeof pricingPlans[0]) => {
    setSelectedPlan(plan);
  };

  const handleContinueToPayment = async () => {
    if (!customerEmail || !customerEmail.includes('@')) {
      alert('Veuillez entrer une adresse email valide');
      return;
    }

    // Protection contre les doubles clics
    if (loading || intentCreatedRef.current) {
      console.log('Création de PaymentIntent déjà en cours');
      return;
    }

    intentCreatedRef.current = true;
    setLoading(true);
    
    try {
      // Créer un Payment Intent côté serveur
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: selectedPlan.sku,
          email: customerEmail,
          amount: Math.round(selectedPlan.price * 100), // Convertir en centimes
        }),
      });

      const data = await response.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setShowPayment(true);
      } else {
        throw new Error(data.error || 'Erreur lors de la création du paiement');
      }
    } catch (error: any) {
      console.error('Erreur:', error);
      alert(error.message || 'Une erreur est survenue');
      intentCreatedRef.current = false; // Réinitialiser en cas d'erreur
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    router.push(`/checkout/success?email=${encodeURIComponent(customerEmail)}&plan=${selectedPlan.sku}`);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-full sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-full sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform rounded-t-3xl sm:rounded-2xl bg-white text-left align-middle shadow-2xl transition-all max-h-[95vh] overflow-y-auto flex flex-col">
                {/* Header */}
                <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 z-10">
                  <div className="flex items-center justify-between">
                    <Dialog.Title as="h3" className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                      {showPayment ? 'Paiement sécurisé' : 'Choisissez votre pack'}
                    </Dialog.Title>
                    <button
                      onClick={onClose}
                      className="text-gray-600 hover:text-gray-900 transition-colors p-1"
                    >
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Contenu */}
                <div className="px-4 sm:px-6 py-4 sm:py-6 flex-1 overflow-y-auto">
                  {!showPayment ? (
                    <>
                      {/* Sélection du pack */}
                      <div className="text-center mb-4 sm:mb-6">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">Choisissez votre formule</h3>
                        <p className="text-xs sm:text-sm text-gray-600">Analysez plusieurs biens et économisez</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                        {pricingPlans.map((plan) => (
                          <div
                            key={plan.id}
                            onClick={() => handlePlanSelect(plan)}
                            className={`cursor-pointer rounded-lg sm:rounded-xl p-3 sm:p-4 border-2 transition-all ${
                              selectedPlan.id === plan.id
                                ? 'border-purple-500 bg-purple-50 shadow-lg'
                                : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                            }`}
                          >
                            {plan.badge && (
                              <div className="text-center mb-2">
                                <span className="text-[10px] sm:text-xs bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 py-1 rounded-full font-semibold">
                                  {plan.badge}
                                </span>
                              </div>
                            )}
                            <h4 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">{plan.name}</h4>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">{plan.priceLabel}</p>
                            <p className="text-[10px] sm:text-xs text-gray-600">{plan.reports} rapport{plan.reports > 1 ? 's' : ''}</p>
                          </div>
                        ))}
                      </div>

                      {/* Saisie email */}
                      <div className="mb-4 sm:mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                          Adresse email
                        </label>
                        <input
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="votre@email.com"
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:bg-white transition-all text-base"
                        />
                        <p className="text-xs text-gray-500 mt-1.5">
                          Un compte sera créé automatiquement avec cet email
                        </p>
                      </div>

                      {/* Bouton continuer */}
                      <button
                        onClick={handleContinueToPayment}
                        disabled={loading || !customerEmail || intentCreatedRef.current}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 sm:px-6 py-3 sm:py-3.5 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                      >
                        {loading ? (
                          <>
                            <span className="inline-block animate-spin mr-2">⏳</span>
                            Préparation du paiement...
                          </>
                        ) : (
                          `Continuer vers le paiement - ${selectedPlan.priceLabel}`
                        )}
                      </button>
                    </>
                  ) : clientSecret ? (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <CheckoutForm
                        onSuccess={handlePaymentSuccess}
                        onCancel={() => setShowPayment(false)}
                        email={customerEmail}
                        plan={selectedPlan}
                      />
                    </Elements>
                  ) : (
                    <div className="text-center text-gray-600">Chargement du formulaire de paiement...</div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

function CheckoutForm({ onSuccess, onCancel, email, plan }: { onSuccess: () => void; onCancel: () => void; email: string; plan: any }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const processingRef = useRef(false); // Protection contre les doubles clics

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    // Protection contre les doubles clics
    if (processingRef.current) {
      console.log('Paiement déjà en cours, ignore le clic');
      return;
    }

    processingRef.current = true;
    setLoading(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success?email=${encodeURIComponent(email)}&plan=${plan.sku}`,
        },
        redirect: 'if_required', // Éviter la redirection automatique sauf pour 3DS
      });

      if (error) {
        console.error('Erreur paiement:', error);
        alert(error.message);
        processingRef.current = false;
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Paiement réussi
        onSuccess();
      } else if (paymentIntent && paymentIntent.status === 'requires_action') {
        // 3D Secure en cours - Stripe gère automatiquement
        console.log('3D Secure authentication required');
        // Ne pas réinitialiser processingRef ici car le paiement est toujours en cours
      } else {
        processingRef.current = false;
      }
    } catch (err) {
      console.error('Erreur lors du paiement:', err);
      processingRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <div className="max-h-[400px] overflow-y-auto">
        <PaymentElement />
      </div>
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 sm:py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm sm:text-base"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={!stripe || loading || processingRef.current}
          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2.5 sm:py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
        >
          {loading ? (
            <>
              <span className="inline-block animate-spin mr-2">⏳</span>
              Traitement en cours...
            </>
          ) : (
            `Payer ${plan.priceLabel}`
          )}
        </button>
      </div>
    </form>
  );
}

