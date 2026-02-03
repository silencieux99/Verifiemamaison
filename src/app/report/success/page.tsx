'use client';

import Link from 'next/link';
import { CheckCircleIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

export default function SuccessPage() {
    return (
        <div className="min-h-screen bg-[#030303] flex items-center justify-center p-6 text-white text-center selection:bg-emerald-500/30">
            <div className="max-w-md w-full space-y-12">

                <div className="flex justify-center">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)]">
                        <CheckCircleIcon className="w-10 h-10 text-emerald-500" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-light tracking-tight">
                        C'est tout bon.
                    </h1>
                    <p className="text-gray-500 text-lg font-light leading-relaxed">
                        Votre transaction a été validée. <br />
                        Le rapport d'expertise est prêt à être téléchargé.
                    </p>
                </div>

                <div className="pt-8 border-t border-white/5">
                    <button className="w-full group relative bg-white text-black h-16 rounded-sm font-medium text-lg hover:bg-emerald-400 transition-colors flex items-center justify-center gap-3">
                        <ArrowDownTrayIcon className="w-5 h-5" />
                        <span>TÉLÉCHARGER LE PDF</span>
                        <span className="absolute right-4 text-xs font-mono opacity-50 group-hover:opacity-80">24MB</span>
                    </button>
                    <p className="mt-4 text-xs text-gray-600">
                        Une copie a également été envoyée par email.
                    </p>
                </div>

                <div className="pt-12">
                    <Link href="/" className="text-sm text-gray-500 hover:text-white transition-colors underline underline-offset-4">
                        Retour à l'accueil
                    </Link>
                </div>

            </div>
        </div>
    );
}
