'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { PlanType } from '@/lib/types';

// Initialiser Stripe uniquement si la clé existe
const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

if (!stripeKey) {
    console.error("⚠️ La clé Stripe (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) est manquante ! Le paiement ne fonctionnera pas.");
}

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    plan: PlanType | null;
    price: number; // en centimes
    address: string;
}

export default function CheckoutModal({ isOpen, onClose, plan, price, address }: CheckoutModalProps) {
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [email, setEmail] = useState('');

    // Body scroll lock
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    // Fetch Payment Intent
    useEffect(() => {
        if (isOpen && plan) {
            setClientSecret(null);
            fetch('/api/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sku: plan,
                    amount: price,
                    email: email || 'guest@verifiemamaison.fr'
                }),
            })
                .then(res => res.json())
                .then(data => {
                    setClientSecret(data.clientSecret);
                })
                .catch(err => console.error(err));
        }
    }, [isOpen, plan, price]);

    if (!isOpen) return null;

    return (
        <div className="relative z-[9999]" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            {/* Background overlay */}
            <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-[9999] backdrop-blur-sm"
                onClick={onClose}
            ></div>

            <div className="fixed inset-0 z-[10000] overflow-y-auto">
                <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                    {/* Modal Panel */}
                    <div
                        className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
                    >
                        {/* Header */}
                        <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-between items-center border-b border-gray-100">
                            <h3 className="text-base font-semibold leading-6 text-gray-900" id="modal-title">
                                Paiement Sécurisé
                            </h3>
                            <button
                                type="button"
                                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                                onClick={onClose}
                            >
                                <span className="sr-only">Fermer</span>
                                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="px-4 py-6 sm:p-6">
                            <div className="mb-6">
                                <p className="text-sm text-gray-500 mb-1">Commande pour :</p>
                                <p className="font-medium text-gray-900 truncate">{address}</p>
                                <div className="mt-2 text-2xl font-bold text-gray-900">
                                    {(price / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                </div>
                            </div>

                            {!stripePromise ? (
                                <div className="text-center py-8 text-red-500 text-sm">
                                    Erreur de configuration Stripe (Clé manquante).
                                </div>
                            ) : clientSecret ? (
                                <Elements stripe={stripePromise} options={{
                                    clientSecret,
                                    appearance: { theme: 'stripe', variables: { colorPrimary: '#000000' } },
                                    locale: 'fr'
                                }}>
                                    <CheckoutForm clientSecret={clientSecret} plan={plan} address={address} price={price} />
                                </Elements>
                            ) : (
                                <div className="flex justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CheckoutForm({ clientSecret, plan, address, price }: { clientSecret: string, plan: PlanType | null, address: string, price: number }) {
    const stripe = useStripe();
    const elements = useElements();
    const [message, setMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) return;

        setIsLoading(true);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/report/confirmation?address=${encodeURIComponent(address)}&plan=${plan}`,
                receipt_email: email,
                payment_method_data: {
                    billing_details: {
                        email: email
                    }
                }
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
        <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse Email
                </label>
                <input
                    type="email"
                    id="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-3 border"
                />
                <p className="text-[10px] text-gray-400 mt-1">Vos identifiants seront envoyés à cette adresse.</p>
            </div>

            <PaymentElement id="payment-element" options={{ layout: "tabs" }} />

            {message && <div id="payment-message" className="text-red-500 text-sm">{message}</div>}

            <button
                disabled={isLoading || !stripe || !elements || !email}
                id="submit"
                className="w-full bg-black text-white rounded-xl py-3 text-sm font-bold hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
                {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Traitement...
                    </span>
                ) : (
                    `Payer ${(price / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`
                )}
            </button>
            <div className="flex justify-center gap-4 opacity-50 grayscale pb-2">
                <img src="/payment-icons/visa.svg" alt="" className="h-4" />
                <img src="/payment-icons/mastercard.svg" alt="" className="h-4" />
            </div>
        </form>
    );
}
