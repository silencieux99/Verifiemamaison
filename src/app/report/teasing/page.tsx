
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    CheckBadgeIcon,
    ArrowDownTrayIcon,
    ShieldCheckIcon,
    HomeModernIcon,
    ChartBarIcon,
    MapPinIcon,
    DocumentMagnifyingGlassIcon,
    BoltIcon,
    LockClosedIcon,
    StarIcon,
    CurrencyEuroIcon,
    ClockIcon,
    ShieldExclamationIcon,
    ChevronDownIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import Image from 'next/image';
import LoadingScreen from '@/app/(components)/ui/LoadingScreen';

interface ReportPreviewData {
    address: {
        label: string;
        city: string;
        zipCode: string;
    };
    streetViewUrl: string | null;
    risks: {
        count: number;
        summary: string[];
    };
    market: {
        lastSale: {
            price: number;
            date: string;
            surface: number;
        } | null;
        averagePriceM2: number;
        transactionsCount: number;
        history: any[];
    };
    hasDvfData: boolean;
}

function TeasingContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const addressQuery = searchParams.get('address');

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<ReportPreviewData | null>(null);

    useEffect(() => {
        if (addressQuery) {
            const minDelay = new Promise(resolve => setTimeout(resolve, 4000));
            const fetchData = fetch(`/api/report/preview?address=${encodeURIComponent(addressQuery)}`).then(res => res.json());

            Promise.all([fetchData, minDelay])
                .then(([data]) => {
                    setData(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [addressQuery]);

    const handlePayment = async () => {
        window.location.href = `/api/checkout?plan=report_one_shot&address=${encodeURIComponent(addressQuery || '')}`;
    };

    if (loading) {
        return <LoadingScreen />;
    }

    if (!data) {
        return <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center text-gray-900 font-light">Données indisponibles.</div>;
    }

    // Formatters
    const formatPrice = (price: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price);
    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' });

    // Mock Data for UI
    const reviews = [
        { name: "Thomas M.", role: "Acheteur à Lyon", text: "Le rapport m'a permis de négocier 15k€ en montrant les prix réels du quartier. Rentabilisé x1000.", stars: 5 },
        { name: "Sarah L.", role: "Investisseur", text: "Indispensable pour vérifier si le DPE colle avec l'année de construction. J'ai évité une passoire thermique.", stars: 5 },
        { name: "Marc D.", role: "Primo-accédant", text: "Simple, clair et immédiat. 19€ pour éviter une erreur à 300 000€, c'est vite vu.", stars: 5 }
    ];

    const faqs = [
        { q: "D'où viennent les données ?", a: "Nous agrégeons les données officielles de l'État : DVF (Notaires), Géorisques, Cadastre, et l'INSEE." },
        { q: "Est-ce que je reçois le rapport tout de suite ?", a: "Oui, instantanément. Une fois le paiement validé, le PDF complet est généré et envoyé sur votre email." },
        { q: "Et si le rapport est vide ?", a: "Si nous ne trouvons aucune donnée pertinente pour votre adresse, nous vous remboursons intégralement votre commande." }
    ];

    return (
        <div className="min-h-screen bg-[#F5F5F7] text-gray-900 font-sans pb-32 md:pb-0">
            {/* Header Compact - Slight border reinforcement */}
            <nav className="fixed top-0 w-full z-40 px-4 py-3 flex justify-between items-center bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
                <div className="text-[10px] tracking-[0.2em] uppercase font-bold text-gray-900">VerifieMaMaison<span className="text-emerald-500">.</span></div>
                <div className="text-[9px] text-gray-400 font-mono hidden md:block">PREVIEW MODE</div>
            </nav>

            <main className="max-w-5xl mx-auto pt-16 md:pt-24 px-4 md:px-8">

                {/* 1. Hero Card - More Compact on Mobile */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative w-full aspect-video md:aspect-[21/9] rounded-2xl overflow-hidden shadow-xl mb-6 group border border-gray-200"
                >
                    {data.streetViewUrl ? (
                        <Image
                            src={data.streetViewUrl}
                            alt="Property View"
                            layout="fill"
                            objectFit="cover"
                            className="scale-105 group-hover:scale-110 transition-transform duration-[3s] ease-out"
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-[10px] tracking-widest uppercase">Image Satellite</div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

                    <div className="absolute bottom-0 left-0 p-4 md:p-8 text-white w-full">
                        <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-full mb-2 border border-white/10">
                            <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></div>
                            <span className="text-[9px] font-semibold tracking-widest uppercase">Rapport Prêt</span>
                        </div>
                        <h1 className="text-xl md:text-3xl font-medium tracking-tight leading-snug truncate">
                            {data.address.label}
                        </h1>
                        <p className="text-white/70 text-xs md:text-sm mt-1 font-light">{data.address.city} ({data.address.zipCode})</p>
                    </div>
                </motion.div>

                {/* 2. Denser Grid Layout - Cards with stronger contrast borders */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">

                    {/* KEY METRIC: Last Sale */}
                    <div className="col-span-2 bg-white p-4 md:p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-gray-500">
                                <HomeModernIcon className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Valeur Actée</span>
                            </div>
                            <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border border-emerald-100">Officiel</span>
                        </div>
                        <div className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                            {data.market.lastSale ? formatPrice(data.market.lastSale.price) : 'N/C'}
                        </div>
                        <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                            {data.market.lastSale ? `Le ${formatDate(data.market.lastSale.date)}` : 'Pas de vente récente'}
                            {data.market.lastSale && <span className="text-gray-300">•</span>}
                            {data.market.lastSale && <span>{data.market.lastSale.surface} m²</span>}
                        </div>
                    </div>

                    {/* METRIC: Price M2 */}
                    <div className="col-span-1 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-center">
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Prix Quartier</div>
                        <div className="text-lg md:text-xl font-semibold text-gray-900">
                            {data.market.averagePriceM2 > 0 ? formatPrice(data.market.averagePriceM2) : '-'}
                        </div>
                        <div className="text-[9px] text-gray-400">/ m² moyen</div>
                    </div>

                    {/* METRIC: Risks */}
                    <div className="col-span-1 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-center">
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Risques</div>
                        <div className="flex items-center gap-2">
                            <span className={`text-lg md:text-xl font-semibold ${data.risks.count > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                {data.risks.count > 0 ? data.risks.count : '0'}
                            </span>
                            <span className="text-[9px] text-gray-400">identifiés</span>
                        </div>
                    </div>
                </div>

                {/* 3. Locked Content Preview - Darker Headers */}
                <div className="space-y-3 mb-16">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1 ml-1">Ce que contient le rapport complet</h3>

                    {/* Locked Row: History */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden relative">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div className="flex items-center gap-2">
                                <DocumentMagnifyingGlassIcon className="w-4 h-4 text-gray-600" />
                                <span className="text-xs font-semibold text-gray-800">Historique des Ventes (2014-2024)</span>
                            </div>
                            <LockClosedIcon className="w-3 h-3 text-gray-400" />
                        </div>
                        <div className="p-4 space-y-3 opacity-50 blur-[2px] select-none pointer-events-none">
                            <div className="flex justify-between text-xs"><span className="w-20 h-3 bg-gray-200 rounded"></span> <span className="w-12 h-3 bg-gray-200 rounded"></span></div>
                            <div className="flex justify-between text-xs"><span className="w-24 h-3 bg-gray-200 rounded"></span> <span className="w-16 h-3 bg-gray-200 rounded"></span></div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="px-3 py-1 bg-white/90 backdrop-blur border border-gray-200 rounded-full text-[10px] font-medium shadow-sm text-gray-600">
                                3 transactions masquées
                            </div>
                        </div>
                    </div>

                    {/* Locked Row: DPE & Energy */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden relative">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div className="flex items-center gap-2">
                                <BoltIcon className="w-4 h-4 text-emerald-600" />
                                <span className="text-xs font-semibold text-gray-800">Performance Énergétique (DPE)</span>
                            </div>
                            <LockClosedIcon className="w-3 h-3 text-gray-400" />
                        </div>
                        <div className="p-4 flex gap-2 overflow-hidden opacity-40 blur-[3px]">
                            {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(l => (
                                <div key={l} className="flex-1 h-8 bg-gray-100 rounded flex items-center justify-center text-[10px] font-bold text-gray-300">{l}</div>
                            ))}
                        </div>
                    </div>

                    {/* Locked Row: Cadastre */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden relative pointer-events-none">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div className="flex items-center gap-2">
                                <MapPinIcon className="w-4 h-4 text-blue-600" />
                                <span className="text-xs font-semibold text-gray-800">Plan Cadastral & Bornage</span>
                            </div>
                            <LockClosedIcon className="w-3 h-3 text-gray-400" />
                        </div>
                        <div className="h-24 bg-gray-100 w-full relative overflow-hidden">
                            {/* Mock Map Pattern */}
                            <div className="absolute inset-0 bg-[linear-gradient(45deg,#00000005_1px,transparent_1px)] bg-[size:10px_10px]"></div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 bg-white shadow-sm rounded border border-gray-200 text-[9px] text-gray-500">
                                Section AB-124
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Value Proposition - Distinct Background? No, keep it flowing but with darker icons */}
                <div className="mb-16">
                    <h3 className="text-center text-xs font-bold text-gray-500 uppercase tracking-widest mb-8">Pourquoi Vérifier ?</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { icon: CurrencyEuroIcon, title: "Négociez le prix", desc: "Utilisez les ventes réelles du quartier comme levier de négociation." },
                            { icon: ShieldExclamationIcon, title: "Évitez les risques", desc: "Inondations,  sécheresse... ne découvrez pas les problèmes après avoir signé." },
                            { icon: ClockIcon, title: "Rapport Instantané", desc: "Ne perdez pas des heures à chercher. Tout est agrégé en 2 minutes." }
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col items-center text-center p-4">
                                <div className="w-10 h-10 bg-white border border-gray-200 shadow-sm rounded-full flex items-center justify-center mb-4 text-gray-900">
                                    <item.icon className="w-5 h-5" />
                                </div>
                                <h4 className="font-semibold text-sm text-gray-900 mb-2">{item.title}</h4>
                                <p className="text-xs text-gray-500 max-w-[200px]">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 5. Social Proof - More Distinct Card */}
                <div className="mb-16 bg-white -mx-4 md:mx-0 p-6 md:p-8 md:rounded-3xl border-y md:border border-gray-200 shadow-sm">
                    <h3 className="text-center text-xs font-bold text-gray-500 uppercase tracking-widest mb-8">Ils ont économisé</h3>
                    <div className="space-y-6 md:space-y-0 md:grid md:grid-cols-3 md:gap-6">
                        {reviews.map((review, i) => (
                            <div key={i} className="flex flex-col gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="flex text-yellow-400 gap-0.5">
                                    {[1, 2, 3, 4, 5].map(s => <StarIconSolid key={s} className="w-3 h-3" />)}
                                </div>
                                <p className="text-sm text-gray-700 italic">"{review.text}"</p>
                                <div>
                                    <div className="text-xs font-semibold text-gray-900">{review.name}</div>
                                    <div className="text-[10px] text-gray-400">{review.role}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 6. FAQ Section */}
                <div className="mb-24 md:mb-32">
                    <h3 className="text-center text-xs font-bold text-gray-500 uppercase tracking-widest mb-8">Questions Fréquentes</h3>
                    <div className="space-y-3 max-w-2xl mx-auto">
                        {faqs.map((faq, i) => (
                            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">{faq.q}</h4>
                                <p className="text-xs text-gray-500 leading-relaxed">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>

            </main>

            {/* Sticky Mobile CTA */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-gray-200 z-50 md:hidden pb-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <button
                    onClick={handlePayment}
                    className="w-full bg-[#111] text-white h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-transform"
                >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    Débloquer le Rapport Complet (19€)
                </button>
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:block fixed bottom-8 right-8 z-50">
                <button
                    onClick={handlePayment}
                    className="bg-[#111] text-white px-6 py-3 rounded-xl font-medium text-sm flex items-center gap-2 shadow-2xl hover:bg-gray-800 transition-all hover:-translate-y-1"
                >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    Télécharger le Rapport
                </button>
            </div>
        </div>
    );
}

export default function TeasingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white" />}>
            <TeasingContent />
        </Suspense>
    );
}
