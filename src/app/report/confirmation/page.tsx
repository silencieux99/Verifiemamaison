'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useStripe } from '@stripe/react-stripe-js'; // Requires Elements wrapper? No, stripe-js loadStripe is enough for simple check or just check params.
import { CheckCircleIcon, ArrowRightIcon, EnvelopeOpenIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { motion } from 'framer-motion';

function ConfirmationContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

    // Stripe params
    const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret');
    const redirectStatus = searchParams.get('redirect_status');
    const address = searchParams.get('address');

    useEffect(() => {
        if (!paymentIntentClientSecret) {
            setStatus('error');
            return;
        }

        if (redirectStatus === 'succeeded') {
            setStatus('success');
            // Trigger API call for client-side credit update immediately (optional, webhook handles it)
            // fetch('/api/handle-payment-success?payment_intent=' + paymentIntentClientSecret)
        } else {
            setStatus('error');
        }
    }, [paymentIntentClientSecret, redirectStatus]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
                <div className="text-red-500 text-xl font-bold mb-4">Une erreur est survenue lors du paiement.</div>
                <Link href="/" className="text-sm underline">Retour à l'accueil</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-[#111] font-sans selection:bg-gray-100 flex flex-col items-center justify-center p-6">

            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "backOut" }}
                className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-8"
            >
                <CheckCircleIcon className="w-10 h-10 text-emerald-600" />
            </motion.div>

            <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-3xl md:text-4xl font-bold text-center mb-4 tracking-tight"
            >
                Paiement Confirmé
            </motion.h1>

            <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-gray-500 text-center max-w-md mb-12 text-sm leading-relaxed"
            >
                Merci pour votre confiance. Votre commande a été traitée avec succès.
                {address && <span className="block mt-1 font-medium text-gray-900">Adresse : {decodeURIComponent(address)}</span>}
            </motion.p>

            <div className="w-full max-w-md bg-gray-50 rounded-2xl p-8 mb-10 border border-gray-100">
                <div className="flex items-start gap-4 mb-6">
                    <div className="p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                        <EnvelopeOpenIcon className="w-6 h-6 text-gray-900" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-sm mb-1">Vérifiez vos emails</h3>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            Vous allez recevoir un email contenant vos <strong>identifiants de connexion</strong> ainsi que votre facture.
                        </p>
                    </div>
                </div>

                <div className="h-px bg-gray-200 w-full my-6"></div>

                <div className="text-center">
                    <p className="text-xs text-center text-gray-400 mb-6">
                        Vos crédits ont été ajoutés à votre compte.
                    </p>
                    <button
                        onClick={() => window.location.href = '/login'} // Or auto-login if token present?
                        className="w-full bg-black text-white h-12 rounded-xl text-sm font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                        Accéder à mon Espace
                        <ArrowRightIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <p className="text-[10px] text-gray-300 text-center max-w-xs">
                Si vous ne recevez pas l'email dans les 5 minutes, vérifiez vos spams ou contactez le support.
            </p>

        </div>
    );
}

export default function ConfirmationPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white" />}>
            <ConfirmationContent />
        </Suspense>
    );
}
