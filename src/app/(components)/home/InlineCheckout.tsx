'use client';

import { useState, useEffect, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { LockClosedIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { PlanType } from '@/lib/types';

// Initialiser Stripe - Supporte les deux variantes de nom de clé
const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

if (!stripeKey && typeof window !== 'undefined') {
    console.error("⚠️ La clé Stripe publique est manquante ! Vérifiez NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ou NEXT_PUBLIC_STRIPE_PUBLIC_KEY dans .env.local");
}

interface InlineCheckoutProps {
    plan: PlanType | null;
    price: number;
    address: string;
    targetRef: React.RefObject<HTMLDivElement | null>;
}

export default function InlineCheckout({ plan, price, address, targetRef }: InlineCheckoutProps) {
    const [email, setEmail] = useState('');
    const [step, setStep] = useState<'email' | 'payment'>('email');
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset state if plan changes
    useEffect(() => {
        if (plan) {
            setStep('email');
            setClientSecret(null);
            setError(null);
            // Auto scroll is handled by parent, but we could do it here too if needed
        }
    }, [plan]);

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !email.includes('@')) {
            setError('Veuillez entrer une adresse email valide.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sku: plan,
                    amount: price,
                    email: email
                }),
            });

            const data = await res.json();

            if (data.clientSecret) {
                setClientSecret(data.clientSecret);
                setStep('payment');
            } else {
                setError('Erreur lors de l\'initialisation du paiement.');
            }
        } catch (err) {
            console.error(err);
            setError('Impossible de contacter le serveur de paiement.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!plan) return null;

    return (
        <div ref={targetRef} className="w-full max-w-5xl mx-auto mt-12 md:mt-24 mb-24 md:mb-48 px-4 md:px-6">
            <div className={`transition-all duration-1000 ease-out ${plan ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>

                {/* Main Container - seamless on mobile, card on desktop */}
                <div className="md:bg-white md:rounded-[32px] md:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] md:overflow-hidden md:ring-1 md:ring-black/5">

                    <div className="py-10 md:p-16 lg:p-20">

                        {/* Title & Price - Ultra Clean */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
                            <div>
                                <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-gray-900 mb-2">
                                    Finaliser la commande
                                </h2>
                                <p className="text-gray-400 font-medium text-lg">
                                    Dernière étape pour recevoir votre rapport.
                                </p>
                            </div>
                            <div className="text-left md:text-right">
                                <div className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">
                                    {(price / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                </div>
                                <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-2">
                                    {plan === 'unite' ? 'Pack Découverte' : plan === 'pack4' ? 'Pack Recommandé' : 'Pack Expert'}
                                </div>
                            </div>
                        </div>

                        {/* STEP 1: EMAIL */}
                        {step === 'email' && (
                            <form onSubmit={handleEmailSubmit} className="fade-in max-w-xl">
                                <div className="mb-12">
                                    <label htmlFor="email-checkout" className="block text-xs font-bold text-gray-900 uppercase tracking-widest mb-4">
                                        Adresse Email
                                    </label>
                                    <input
                                        type="email"
                                        id="email-checkout"
                                        required
                                        autoCapitalize="none"
                                        autoComplete="email"
                                        autoCorrect="off"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="votre@email.com"
                                        className="block w-full text-2xl md:text-3xl font-medium text-gray-900 placeholder:text-gray-300 border-0 border-b-2 border-gray-200 focus:border-black focus:ring-0 bg-transparent px-0 py-4 transition-all rounded-none"
                                    />
                                </div>

                                {error && (
                                    <div className="mb-8 text-red-600 font-medium bg-red-50 p-4 rounded-xl">
                                        {error}
                                    </div>
                                )}

                                <div className="flex flex-col md:flex-row items-center gap-8">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full md:w-auto px-12 h-16 bg-black text-white rounded-full font-bold text-lg hover:scale-105 active:scale-95 transition-all duration-300 shadow-xl shadow-black/10 flex items-center justify-center gap-3"
                                    >
                                        {isLoading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                Continuer
                                                <ArrowRightIcon className="w-5 h-5" />
                                            </>
                                        )}
                                    </button>

                                    <div className="flex gap-4 opacity-30 grayscale transition-opacity hover:opacity-60">
                                        <img src="/payment-icons/visa.svg" alt="" className="h-6" />
                                        <img src="/payment-icons/mastercard.svg" alt="" className="h-6" />
                                        <img src="/payment-icons/american_express.svg" alt="" className="h-6" />
                                    </div>
                                </div>
                            </form>
                        )}

                        {/* STEP 2: STRIPE */}
                        {step === 'payment' && clientSecret && (
                            <div className="fade-in">
                                {!stripePromise ? (
                                    <div className="p-8 text-center bg-red-50 border border-red-100 rounded-2xl">
                                        <p className="text-red-600 font-medium">
                                            Configuration de paiement incomplète.
                                            <br />
                                            <span className="text-sm opacity-80">Clé Stripe manquante (NEXT_PUBLIC_STRIPE_PUBLIC_KEY)</span>
                                        </p>
                                    </div>
                                ) : (
                                    <Elements stripe={stripePromise} options={{
                                        clientSecret,
                                        appearance: {
                                            theme: 'stripe',
                                            variables: {
                                                colorPrimary: '#000000',
                                                borderRadius: '12px',
                                                fontFamily: 'system-ui, -apple-system, sans-serif',
                                                colorText: '#111827',
                                                colorBackground: '#f9fafb',
                                                spacingUnit: '5px',
                                                gridRowSpacing: '20px'
                                            },
                                            rules: {
                                                '.Input': {
                                                    borderColor: '#e5e7eb',
                                                    backgroundColor: '#f9fafb',
                                                    padding: '16px',
                                                    fontSize: '16px',
                                                    boxShadow: 'none',
                                                },
                                                '.Input:focus': {
                                                    borderColor: '#000000',
                                                    backgroundColor: '#ffffff',
                                                    boxShadow: 'none',
                                                },
                                                '.Label': {
                                                    fontWeight: '600',
                                                    textTransform: 'uppercase',
                                                    fontSize: '11px',
                                                    letterSpacing: '0.05em',
                                                    color: '#9ca3af',
                                                    marginBottom: '8px'
                                                }
                                            }
                                        },
                                        locale: 'fr'
                                    }}>
                                        <InlineStripeForm address={address} plan={plan} email={email} />
                                    </Elements>
                                )}
                            </div>
                        )}

                    </div>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-300">
                        Sécurisé par Stripe • Données chiffrées
                    </p>
                </div>

            </div>
        </div>
    );
}

function InlineStripeForm({ address, plan, email }: { address: string, plan: PlanType, email: string }) {
    const stripe = useStripe();
    const elements = useElements();
    const [message, setMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setIsLoading(true);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/report/confirmation?address=${encodeURIComponent(address)}&plan=${plan}`,
                receipt_email: email,
            },
        });

        if (error.type === "card_error" || error.type === "validation_error") {
            setMessage(error.message || "Une erreur est survenue");
        } else {
            setMessage("Une erreur inattendue est survenue.");
        }
        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">

            <div className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                        <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0 flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Email validé</span>
                        <div className="text-base font-medium text-gray-900 truncate">
                            {email}
                        </div>
                    </div>
                </div>
            </div>

            <div className="min-h-[280px]">
                <PaymentElement id="payment-element" options={{ layout: "tabs" }} />
            </div>

            {message && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
                    {message}
                </div>
            )}

            <button
                disabled={isLoading || !stripe || !elements}
                className="w-full bg-black text-white h-16 rounded-2xl font-black text-lg hover:scale-[1.01] active:scale-[0.99] transition-all shadow-2xl shadow-black/20"
            >
                {isLoading ? 'Paiement en cours...' : `Confirmer le paiement`}
            </button>
        </form>
    );
}
// Helper icons
import { ArrowRightIcon } from '@heroicons/react/24/outline';
