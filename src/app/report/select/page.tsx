
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckBadgeIcon, Square2StackIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import LoadingScreen from '@/app/(components)/ui/LoadingScreen';

interface Unit {
    id: string;
    date: string;
    price: number | null;
    surface: number;
    rooms: number;
    type: string;
    floor: number | null;
}

function SelectContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const addressQuery = searchParams.get('address');

    const [loading, setLoading] = useState(true);
    const [units, setUnits] = useState<Unit[]>([]);
    const [addressLabel, setAddressLabel] = useState<string>('');

    useEffect(() => {
        if (addressQuery) {
            const minDelay = new Promise(resolve => setTimeout(resolve, 4000));
            const fetchData = fetch(`/api/report/units?address=${encodeURIComponent(addressQuery)}`).then(res => res.json());

            Promise.all([fetchData, minDelay])
                .then(([data]) => {
                    if (data.units) {
                        setUnits(data.units);
                        setAddressLabel(data.address.label);
                    }
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [addressQuery, router]);

    const handleSelect = (unit: Unit | null) => {
        // Si unit est null, c'est "Je ne trouve pas mon bien -> Rapport Général"
        // Si unit est sélectionné, on passe ses infos (surface, prix)
        const params = new URLSearchParams();
        params.set('address', addressQuery || '');
        if (unit) {
            params.set('ref_surface', unit.surface.toString());
            params.set('ref_rooms', unit.rooms.toString());
        }
        router.push(`/report/teasing?${params.toString()}`);
    };

    if (loading) {
        return <LoadingScreen />;
    }

    // Formatters
    const formatPrice = (price: number | null) => price ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price) : 'N/C';
    const formatDate = (dateStr: string) => new Date(dateStr).getFullYear();

    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-emerald-100 flex flex-col">
            <nav className="w-full px-6 md:px-8 py-4 md:py-6 flex justify-between items-center border-b border-gray-100 bg-white">
                <Link href="/" className="text-sm tracking-widest uppercase font-semibold text-gray-900 hover:opacity-70 transition-opacity">
                    VerifieMaMaison<span className="text-emerald-500">.</span>
                </Link>
                <div className="text-xs text-gray-500 font-mono hidden md:block">STEP 2/3 • SÉLECTION</div>
            </nav>

            <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 max-w-4xl mx-auto w-full">

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    {units.length > 0 ? (
                        <>
                            <div className="inline-block px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] tracking-[0.2em] font-medium uppercase mb-4 rounded-full">
                                {units.length > 1 ? 'Plusieurs biens trouvés' : 'Bien trouvé'}
                            </div>
                            <h1 className="text-2xl md:text-4xl font-light text-gray-900 mb-4">
                                Précisez votre recherche <br />
                                <span className="text-gray-400 font-serif italic text-xl md:text-3xl block mt-2">{addressLabel}</span>
                            </h1>
                            <p className="text-gray-500 font-light max-w-lg mx-auto">
                                Nous avons trouvé {units.length} transaction{units.length > 1 ? 's' : ''} à cette adresse. Sélectionnez celle qui correspond à votre bien pour affiner l'analyse.
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="inline-block px-3 py-1 bg-gray-50 border border-gray-200 text-gray-500 text-[10px] tracking-[0.2em] font-medium uppercase mb-4 rounded-full">
                                Aucune transaction trouvée
                            </div>
                            <h1 className="text-2xl md:text-4xl font-light text-gray-900 mb-4">
                                Analyse de l'adresse <br />
                                <span className="text-gray-400 font-serif italic text-xl md:text-3xl block mt-2">{addressLabel}</span>
                            </h1>
                            <p className="text-gray-500 font-light max-w-lg mx-auto">
                                Aucune vente récente trouvée pour cette adresse. Nous allons analyser le quartier et les données disponibles.
                            </p>
                        </>
                    )}
                </motion.div>


                {units.length > 0 ? (
                    <>
                        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            {units.map((unit, index) => (
                                <motion.button
                                    key={index}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => handleSelect(unit)}
                                    className="group flex items-center justify-between p-6 bg-white border border-gray-100 hover:border-emerald-500 hover:bg-emerald-50/10 rounded-xl transition-all shadow-sm hover:shadow-md text-left"
                                >
                                    <div>
                                        <div className="text-lg font-medium text-gray-900 mb-1">
                                            {unit.type} {unit.rooms} pièces • {unit.surface} m²
                                        </div>
                                        <div className="text-xs text-gray-500 font-mono uppercase tracking-wide">
                                            Vendu en {formatDate(unit.date)} • {formatPrice(unit.price)}
                                        </div>
                                    </div>
                                    <ArrowRightIcon className="w-5 h-5 text-gray-300 group-hover:text-emerald-500 transition-colors" />
                                </motion.button>
                            ))}
                        </div>

                        <div className="w-full border-t border-gray-100 pt-8 flex justify-center">
                            <button
                                onClick={() => handleSelect(null)}
                                className="text-sm text-gray-500 hover:text-black transition-colors underline decoration-gray-300 underline-offset-4"
                            >
                                Je ne vois pas mon bien dans la liste • Continuer avec le rapport général
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="w-full flex justify-center">
                        <motion.button
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={() => handleSelect(null)}
                            className="px-8 py-4 bg-black hover:bg-gray-800 text-white rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-3 group"
                        >
                            <span className="font-medium">Continuer l'analyse</span>
                            <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </motion.button>
                    </div>
                )}


            </main>
        </div>
    );
}

export default function SelectPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white" />}>
            <SelectContent />
        </Suspense>
    );
}
