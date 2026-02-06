'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    CheckIcon,
    EnvelopeIcon,
    LockClosedIcon,
    ArrowRightIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthTokenData {
    userId: string;
    customToken: string;
    email: string;
    password: string | null;
    isNewUser: boolean;
    createdAt: number;
    expiresAt: number;
}

function ConfirmationContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);
    const [isNewUser, setIsNewUser] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    // Stripe params
    const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret') || searchParams.get('payment_intent_client_secret');
    const redirectStatus = searchParams.get('redirect_status');
    const address = searchParams.get('address');

    useEffect(() => {
        if (!paymentIntentClientSecret && !searchParams.get('session_id')) {
            if (searchParams.get('session_id')) {
                setStatus('success');
                return;
            }
            setStatus('error');
            return;
        }

        if (redirectStatus === 'succeeded' || searchParams.get('session_id')) {
            handleSuccessfulPayment();
        } else {
            setStatus('error');
        }
    }, [paymentIntentClientSecret, redirectStatus, searchParams]);

    const handleSuccessfulPayment = async () => {
        try {
            const paymentIntentId = paymentIntentClientSecret?.split('_secret_')[0] || searchParams.get('session_id');
            if (!paymentIntentId) {
                setStatus('success');
                return;
            }

            let tokenData: AuthTokenData | null = null;
            let attempts = 0;
            const maxAttempts = 15;

            while (attempts < maxAttempts) {
                try {
                    const response = await fetch(`/api/auth/get-token?paymentIntentId=${paymentIntentId}`);
                    if (response.ok) {
                        tokenData = await response.json();
                        break;
                    }
                } catch (e) { console.error(e); }
                attempts++;
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            if (tokenData) {
                if (tokenData.isNewUser && tokenData.password) {
                    setCredentials({ email: tokenData.email, password: tokenData.password });
                    setIsNewUser(true);
                }

                setIsLoggingIn(true);
                try {
                    await signInWithCustomToken(auth, tokenData.customToken);
                } catch (e) { console.error(e); }
            }

            setStatus('success');
            setIsLoggingIn(false);
        } catch (error) {
            console.error(error);
            setStatus('success');
        }
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-6">
                <div className="w-12 h-12 border-2 border-gray-100 border-t-black rounded-full animate-spin mb-6" />
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 animate-pulse">Validation de votre commande</p>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-8">
                    <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Erreur de paiement</h1>
                <p className="text-gray-500 text-sm mb-10 max-w-xs">La validation de votre transaction a échoué. Veuillez contacter notre support si le débit a eu lieu.</p>
                <Link href="/" className="px-10 py-5 bg-black text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-black/10 transition-transform active:scale-95">Retour à l'accueil</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-[#111] font-sans selection:bg-black selection:text-white">
            <nav className="fixed top-0 w-full z-50 px-8 py-8 flex justify-between items-center bg-[#FAFAFA]/80 backdrop-blur-md transition-colors">
                <div className="text-[10px] font-bold tracking-[0.2em] uppercase">VerifieMaMaison</div>
                <div className="h-px bg-gray-100 flex-1 mx-8 hidden sm:block" />
                <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400">Succès</div>
            </nav>

            <main className="max-w-screen-xl mx-auto px-6 sm:px-12 lg:px-20 pt-40 pb-32">
                <div className="flex flex-col lg:flex-row gap-20 lg:gap-32 items-center lg:items-start">

                    {/* Left : Message & Confirmation */}
                    <div className="flex-1 max-w-2xl text-center lg:text-left">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-10 lg:mb-16"
                        >
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-black text-white mb-10 shadow-lg">
                                <CheckIcon className="w-7 h-7" />
                            </div>
                            <h1 className="text-4xl md:text-6xl lg:text-8xl font-bold tracking-tighter text-gray-900 leading-[0.95] mb-8">
                                Paiement <br className="hidden md:block" /> bien reçu.
                            </h1>
                            <p className="text-lg md:text-2xl text-gray-400 font-medium leading-relaxed mb-12 max-w-xl">
                                {isNewUser
                                    ? "Votre espace est désormais prêt. Vos rapports vous attendent à l'intérieur."
                                    : "Vos nouveaux crédits ont été ajoutés instantanément à votre espace membre."}
                            </p>

                            {address && (
                                <div className="inline-block px-4 py-2 bg-gray-100 rounded-lg">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mr-3">Dossier :</span>
                                    <span className="text-xs font-bold text-gray-900">{decodeURIComponent(address)}</span>
                                </div>
                            )}
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            <button
                                onClick={() => router.push('/account')}
                                disabled={isLoggingIn}
                                className="group relative inline-flex items-center justify-between w-full sm:w-80 px-8 h-20 bg-black text-white rounded-3xl overflow-hidden shadow-2xl shadow-black/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                            >
                                <span className="text-[11px] font-bold uppercase tracking-widest relative z-10">
                                    {isLoggingIn ? "Activation de l'accès..." : "Accéder à mes rapports"}
                                </span>
                                <ArrowRightIcon className="w-5 h-5 relative z-10 transition-transform group-hover:translate-x-1" />
                            </button>
                            <div className="mt-8 flex items-center justify-center lg:justify-start gap-3 opacity-30 text-[10px] font-bold uppercase tracking-widest">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                Connexion sécurisée active
                            </div>
                        </motion.div>
                    </div>

                    {/* Right : Credentials / Details */}
                    {credentials && isNewUser && (
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="w-full max-w-md lg:mt-12"
                        >
                            <div className="bg-white border border-gray-100 rounded-[40px] p-10 md:p-14 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.06)] relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-bl-full opacity-50" />

                                <div className="relative">
                                    <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-gray-300 mb-12">Accès Personnel</h2>

                                    <div className="space-y-12 mb-16">
                                        <div>
                                            <div className="flex items-center gap-3 mb-4">
                                                <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Email</span>
                                            </div>
                                            <div className="text-lg font-bold text-gray-900 break-all">{credentials.email}</div>
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-3 mb-4">
                                                <LockClosedIcon className="w-4 h-4 text-gray-400" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Mot de passe temporaire</span>
                                            </div>
                                            <div className="text-2xl font-mono font-bold text-black bg-gray-50 px-5 py-4 rounded-2xl border border-gray-100 select-all tracking-wider font-mono">
                                                {credentials.password}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-gray-50">
                                        <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                                            Ces informations vous servent de laissez-passer pour vos futures connexions. Conservez-les précieusement.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </main>

            <footer className="fixed bottom-0 w-full py-10 px-10 text-center lg:text-left text-[10px] font-bold uppercase tracking-[0.4em] text-gray-300 pointer-events-none">
                VerifieMaMaison © 2024
            </footer>
        </div>
    );
}

export default function ConfirmationPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#FAFAFA]" />}>
            <ConfirmationContent />
        </Suspense>
    );
}
