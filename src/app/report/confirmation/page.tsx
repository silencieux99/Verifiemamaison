'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowRightIcon, SparklesIcon, KeyIcon } from '@heroicons/react/24/outline';
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
    const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret');
    const redirectStatus = searchParams.get('redirect_status');
    const address = searchParams.get('address');

    useEffect(() => {
        if (!paymentIntentClientSecret) {
            setStatus('error');
            return;
        }

        if (redirectStatus === 'succeeded') {
            handleSuccessfulPayment();
        } else {
            setStatus('error');
        }
    }, [paymentIntentClientSecret, redirectStatus]);

    const handleSuccessfulPayment = async () => {
        try {
            const paymentIntentId = paymentIntentClientSecret!.split('_secret_')[0];
            console.log('🔍 Confirmation : Récupération du compte...', paymentIntentId);

            // Polling via API (pour éviter les problèmes de droits Firestore client)
            let tokenData: AuthTokenData | null = null;
            let attempts = 0;
            const maxAttempts = 20; // 20 tentatives * 1.5s = 30 secondes

            while (attempts < maxAttempts) {
                try {
                    console.log(`[Confirmation] Tentative ${attempts + 1}/${maxAttempts}...`);
                    const response = await fetch(`/api/auth/get-token?paymentIntentId=${paymentIntentId}`);
                    if (response.ok) {
                        tokenData = await response.json();
                        break;
                    }
                } catch (e) {
                    console.error('Fetch error:', e);
                }
                attempts++;
                await new Promise(resolve => setTimeout(resolve, 1500)); // Attendre 1.5s entre chaque essai
            }

            if (tokenData) {
                console.log('✅ Compte récupéré !');
                if (tokenData.isNewUser && tokenData.password) {
                    setCredentials({ email: tokenData.email, password: tokenData.password });
                    setIsNewUser(true);
                }

                setIsLoggingIn(true);
                try {
                    await signInWithCustomToken(auth, tokenData.customToken);
                    console.log('✅ Auto-login réussi');
                } catch (e) {
                    console.error('Auto-login failed:', e);
                }
            } else {
                console.warn('🕒 Timeout : Le compte sera prêt dans quelques instants.');
            }

            setStatus('success');
            setIsLoggingIn(false);
        } catch (error) {
            console.error('Confirmation error:', error);
            setStatus('success');
        }
    };

    const handleAccessAccount = () => {
        router.push('/account');
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Finalisation de votre commande...</p>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA] p-6 text-center">
                <div className="text-red-500 text-xl font-bold mb-4 uppercase tracking-tighter">Erreur de paiement</div>
                <p className="text-gray-500 text-sm mb-8">Le paiement n'a pas pu être validé ou a été annulé.</p>
                <Link href="/" className="px-8 py-4 bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest">Retour à l'accueil</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-[#111] font-sans flex flex-col items-center justify-center p-6">

            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "backOut" }}
                className="w-20 h-20 bg-black rounded-full flex items-center justify-center mb-8 shadow-2xl"
            >
                <SparklesIcon className="w-10 h-10 text-white" />
            </motion.div>

            <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-3xl md:text-4xl font-black text-center mb-4 tracking-tight uppercase"
            >
                Succès !
            </motion.h1>

            <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-gray-500 text-center max-w-md mb-12 text-sm leading-relaxed"
            >
                {isNewUser ? 'Votre compte a été créé avec succès.' : 'Vos crédits ont été ajoutés à votre compte.'}
                {address && <span className="block mt-2 font-black text-gray-900 text-[10px] uppercase tracking-widest">Adresse : {decodeURIComponent(address)}</span>}
            </motion.p>

            {credentials && (
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="w-full max-w-md bg-white rounded-[32px] p-8 mb-8 border border-gray-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)]"
                >
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-gray-50 rounded-xl">
                            <KeyIcon className="w-5 h-5 text-black" />
                        </div>
                        <h3 className="font-black text-gray-900 text-xs uppercase tracking-widest">Vos Identifiants</h3>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Email</label>
                            <div className="bg-gray-50 border border-gray-100 rounded-xl px-5 py-4 font-mono text-sm text-gray-900 overflow-hidden text-ellipsis">
                                {credentials.email}
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Mot de passe provisoire</label>
                            <div className="bg-gray-50 border border-gray-100 rounded-xl px-5 py-4 font-mono text-sm text-gray-900">
                                {credentials.password}
                            </div>
                        </div>
                    </div>

                    <p className="text-[10px] font-bold text-gray-400 mt-6 text-center uppercase tracking-tighter">
                        Utilisez ces accès pour vos futures connexions.
                    </p>
                </motion.div>
            )}

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: credentials ? 0.5 : 0.4 }}
                className="w-full max-w-md"
            >
                <button
                    onClick={handleAccessAccount}
                    disabled={isLoggingIn}
                    className="w-full bg-black text-white h-16 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-black/20"
                >
                    {isLoggingIn ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Connexion...
                        </>
                    ) : (
                        <>
                            Accéder à mon Espace
                            <ArrowRightIcon className="w-5 h-5" />
                        </>
                    )}
                </button>

                {!credentials && (
                    <p className="text-[10px] font-bold text-gray-400 text-center mt-6 uppercase tracking-widest">
                        Vous êtes maintenant connecté.
                    </p>
                )}
            </motion.div>

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
