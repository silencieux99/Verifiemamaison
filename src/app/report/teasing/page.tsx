'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    HomeModernIcon,
    DocumentMagnifyingGlassIcon,
    BoltIcon,
    LockClosedIcon,
    CurrencyEuroIcon,
    ClockIcon,
    ShieldExclamationIcon,
    AcademicCapIcon,
    WifiIcon,
    HandRaisedIcon,
    BuildingStorefrontIcon,
    MapIcon,
    ArrowRightIcon,
    CheckIcon,
    PlusIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import LoadingScreen from '@/app/(components)/ui/LoadingScreen';
import dynamic from 'next/dynamic';
import InlineCheckout from '@/app/(components)/home/InlineCheckout'; // NEW COMPONENT
import { PlanType } from '@/lib/types';

const PropertyMap = dynamic(() => import('@/app/(components)/ui/PropertyMap'), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-gray-200 animate-pulse" />
});

interface DPEData {
    found: boolean;
    classe_energie?: string;
    classe_ges?: string;
    consommation_energie?: number;
    estimation_ges?: number;
    annee_construction?: number;
    surface?: number;
    type_batiment?: string;
    date_etablissement?: string;
    numero_dpe?: string;
    geo_score?: number;
    adresse_dpe?: string;
}

interface ReportPreviewData {
    address: {
        label: string;
        city: string;
        zipCode: string;
        coordinates?: {
            lat: number;
            lon: number;
        };
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
    dpe: DPEData;
    hasDvfData: boolean;
}

function TeasingContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const addressQuery = searchParams.get('address');

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<ReportPreviewData | null>(null);

    // Checkout State
    const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
    const [selectedPrice, setSelectedPrice] = useState(0);
    const checkoutRef = useRef<HTMLDivElement | null>(null); // Ref for scrolling

    useEffect(() => {
        if (!addressQuery) return;

        const minDelay = new Promise(resolve => setTimeout(resolve, 3000)); // Teasing delay
        const fetchData = fetch(`/api/report/preview?address=${encodeURIComponent(addressQuery)}`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch data');
                return res.json();
            });

        Promise.all([fetchData, minDelay])
            .then(([data]) => {
                setData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Preview fetch error:", err);
                setData(null);
                setLoading(false);
            });
    }, [addressQuery]);

    const openCheckout = (plan: PlanType, priceCents: number) => {
        console.log("Selecting plan:", plan);
        setSelectedPlan(plan);
        setSelectedPrice(priceCents);

        // Scroll to checkout section smoothly
        setTimeout(() => {
            checkoutRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    if (loading) {
        return <LoadingScreen />;
    }

    if (!data || !data.address) {
        return (
            <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center text-sm font-medium text-gray-400 p-6 text-center">
                <p className="mb-4">Désolé, nous n'avons pas trouvé de données suffisantes pour cette adresse.</p>
                <div className="flex gap-4">
                    <button
                        onClick={() => router.push('/')}
                        className="px-4 py-2 bg-gray-100 text-gray-900 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors"
                    >
                        Retour
                    </button>
                    {addressQuery && (
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-black text-white rounded-lg text-xs font-bold hover:bg-gray-900 transition-colors"
                        >
                            Réessayer
                        </button>
                    )}
                </div>
            </div>
        );
    }

    const formatPrice = (price: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price);
    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' });

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-[#111] font-sans selection:bg-gray-200">
            <nav className="fixed top-0 w-full z-50 px-6 py-6 flex justify-between items-center bg-[#FAFAFA]/80 backdrop-blur-md transition-colors">
                <div className="text-xs font-bold tracking-[0.2em] uppercase">VerifieMaMaison</div>
            </nav>

            <main className="max-w-2xl mx-auto pt-32 pb-32 px-6">

                {/* 1. Header Section */}
                <div className="mb-12">
                    <h1 className="text-2xl md:text-3xl font-semibold mb-2 tracking-tight">
                        Rapport disponible pour <br />
                        <span className="text-gray-400">{data.address.label}</span>
                    </h1>
                    <p className="text-sm text-gray-500 mt-2 font-medium">
                        {data.address.city}, {data.address.zipCode}
                    </p>
                </div>

                {/* 2. Map */}
                <div className="relative w-full aspect-video bg-gray-100 mb-16 grayscale-[10%] hover:grayscale-0 transition-all duration-700">
                    {data.address.coordinates ? (
                        <PropertyMap
                            lat={data.address.coordinates.lat}
                            lon={data.address.coordinates.lon}
                            address={data.address.label}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">Carte masquée</div>
                    )}
                    <div className="absolute inset-0 ring-1 ring-inset ring-black/5 pointer-events-none"></div>
                </div>

                {/* 3. Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-12 gap-x-8 mb-20 border-t border-gray-100 pt-10">
                    <div className="col-span-2 md:col-span-1">
                        <div className="text-[10px] uppercase tracking-wider font-medium text-gray-400 mb-2">Dernière Vente</div>
                        <div className="text-2xl font-semibold tracking-tight">
                            {data.market.lastSale ? formatPrice(data.market.lastSale.price) : 'N/C'}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                            {data.market.lastSale ? formatDate(data.market.lastSale.date) : '-'}
                        </div>
                    </div>
                    <div>
                        <div className="text-[10px] uppercase tracking-wider font-medium text-gray-400 mb-2">Prix Quartier</div>
                        <div className="text-xl font-medium text-gray-900">
                            {data.market.averagePriceM2 > 0 ? formatPrice(data.market.averagePriceM2) : '-'}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1">/ m² moyen</div>
                    </div>
                    <div>
                        <div className="text-[10px] uppercase tracking-wider font-medium text-gray-400 mb-2">Points de Vigilance</div>
                        <div className={`text-xl font-medium ${data.risks.count > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                            {data.risks.count} détectés
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1">sur l'adresse</div>
                    </div>
                </div>

                {/* 4. Locked Content List */}
                <div className="mb-24">
                    <div className="flex items-center gap-4 mb-8">
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-900">Contenu du rapport</span>
                        <div className="h-px bg-gray-100 flex-1"></div>
                    </div>

                    <div className="space-y-0">
                        {[
                            { icon: DocumentMagnifyingGlassIcon, label: "Historique des Transactions", sub: "2014 - 2024", locked: true },
                            { icon: HandRaisedIcon, label: "Délinquance & Criminologie", sub: "Données locales", locked: true },
                            { icon: AcademicCapIcon, label: "Établissements Scolaires", sub: "Carte scolaire", locked: true },
                            { icon: WifiIcon, label: "Couverture Fibre & Internet", sub: "Débits réels", locked: true },
                            { icon: BuildingStorefrontIcon, label: "Commerces de proximité", sub: "Services", locked: true },
                            { icon: MapIcon, label: "Transports en commun", sub: "Lignes & Arrêts", locked: true },
                            { icon: PlusIcon, label: "Et 100+ autres points", sub: "Analysés par nos algorithmes", locked: true },
                        ].map((item, i) => (
                            <div key={i} className="group flex items-center justify-between py-5 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors -mx-4 px-4 cursor-default">
                                <div className="flex items-center gap-4">
                                    <item.icon className="w-5 h-5 text-gray-400 stroke-[1.5]" />
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">{item.label}</div>
                                        <div className="text-[11px] text-gray-400">{item.sub}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">Masqué</span>
                                    <LockClosedIcon className="w-4 h-4 text-gray-300" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 5. DPE - Redesigned Minimal & Elegant */}
                <div className="mb-24">
                    <div className="flex items-center gap-4 mb-6">
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-900">Performance Énergétique</span>
                        <div className="h-px bg-gray-100 flex-1"></div>
                    </div>

                    {data.dpe.found ? (
                        <div className="py-2">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className={`text-6xl font-black tracking-tighter ${data.dpe.classe_energie === 'A' ? 'text-emerald-500' :
                                        data.dpe.classe_energie === 'B' ? 'text-lime-500' :
                                            data.dpe.classe_energie === 'C' ? 'text-yellow-400' :
                                                data.dpe.classe_energie === 'D' ? 'text-yellow-500' :
                                                    data.dpe.classe_energie === 'E' ? 'text-orange-400' :
                                                        data.dpe.classe_energie === 'F' ? 'text-orange-600' : 'text-red-500'
                                        }`}>
                                        {data.dpe.classe_energie}
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <div className="text-sm font-semibold text-gray-900">
                                            {data.dpe.consommation_energie} <span className="text-xs text-gray-400 font-normal">kWh/m²</span>
                                        </div>
                                        {data.dpe.annee_construction && data.dpe.annee_construction > 1000 && (
                                            <div className="text-[10px] uppercase tracking-wide text-gray-400 mt-0.5">
                                                Bâti {data.dpe.annee_construction}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {data.dpe.classe_ges && (
                                    <div className="text-right">
                                        <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">GES</div>
                                        <div className="text-xl font-bold text-gray-900">{data.dpe.classe_ges}</div>
                                    </div>
                                )}
                            </div>

                            <div className="relative h-1.5 w-full bg-gray-100 rounded-full overflow-hidden flex">
                                {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((letter) => {
                                    const colors: Record<string, string> = {
                                        'A': 'bg-emerald-500', 'B': 'bg-lime-500', 'C': 'bg-yellow-400',
                                        'D': 'bg-yellow-500', 'E': 'bg-orange-400', 'F': 'bg-orange-600', 'G': 'bg-red-500'
                                    };
                                    const isCurrent = data.dpe.classe_energie === letter;
                                    return (
                                        <div key={letter} className={`flex-1 ${colors[letter]} ${isCurrent ? 'opacity-100' : 'opacity-20'} transition-opacity`} />
                                    );
                                })}
                            </div>

                            <div className="flex justify-between mt-2 px-1">
                                {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((letter) => (
                                    <div key={letter} className={`text-[9px] font-bold w-4 text-center ${data.dpe.classe_energie === letter ? 'text-gray-900' : 'text-gray-300'}`}>
                                        {letter}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="py-6 text-center">
                            <div className="inline-flex items-center justify-center w-10 h-10 bg-gray-50 rounded-full mb-3">
                                <BoltIcon className="w-5 h-5 text-gray-300" />
                            </div>
                            <p className="text-xs text-gray-400 italic">Données de performance énergétique non disponibles.</p>
                        </div>
                    )}
                </div>

                {/* 6. Why */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-24 pt-12 border-t border-gray-100">
                    {[
                        { title: "Négociez", desc: "Le prix au m² réel est votre meilleur argument." },
                        { title: "Sécurisez", desc: "Découvrez les vices cachés avant de signer." },
                        { title: "Gagnez du temps", desc: "Plus de 100 points de contrôle en 1 clic." }
                    ].map((item, i) => (
                        <div key={i}>
                            <h3 className="text-sm font-bold text-gray-900 mb-2">{item.title}</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>

                {/* 7. Reviews */}
                <div className="mb-32">
                    <div className="text-center mb-8">
                        <div className="flex justify-center gap-1 text-[#111] mb-4">
                            {[1, 2, 3, 4, 5].map(s => <StarIconSolid key={s} className="w-3 h-3" />)}
                        </div>
                        <p className="text-lg font-medium text-gray-900 italic max-w-lg mx-auto leading-relaxed">
                            "Le rapport m'a évité d'acheter une maison en zone inondable. Les 19€ les mieux investis de mon projet."
                        </p>
                        <div className="mt-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                            Sophie D. — Acheteuse
                        </div>
                    </div>
                </div>

                {/* 8. Pricing - High-End, Light & Square */}
                <div id="pricing" className="mb-32 pt-16 border-t border-gray-100">
                    <div className="flex items-center justify-center mb-16">
                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Sélectionnez votre offre</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Pack 1 - Unitaire */}
                        <div
                            onClick={() => openCheckout('unite', 1999)}
                            className="group relative flex flex-col p-8 rounded-3xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300 cursor-pointer min-h-[400px]"
                        >
                            <div className="text-center mb-6">
                                <span className="inline-block px-3 py-1 mb-4 rounded-full bg-gray-50 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                                    Découverte
                                </span>
                                <div className="text-3xl font-black text-gray-900 mb-1">19,99€</div>
                                <div className="text-xs text-gray-400 font-medium">pour 1 rapport</div>
                            </div>

                            <div className="flex-1 space-y-3 mb-8">
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <CheckIcon className="w-4 h-4 text-emerald-500" />
                                    <span>Rapport complet PDF</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <CheckIcon className="w-4 h-4 text-emerald-500" />
                                    <span>Accès immédiat</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <CheckIcon className="w-4 h-4 text-emerald-500" />
                                    <span>Mises à jour (30j)</span>
                                </div>
                            </div>

                            <button
                                onClick={(e) => { e.stopPropagation(); openCheckout('unite', 1999); }}
                                className="w-full h-10 bg-gray-900 text-white rounded-xl text-xs font-bold uppercase tracking-wide transition-colors relative z-20"
                            >
                                Choisir
                            </button>
                        </div>

                        {/* Pack 2 - Smart (Popular) */}
                        <div
                            onClick={() => openCheckout('pack4', 2999)}
                            className="group relative flex flex-col p-8 rounded-3xl bg-white border-2 border-gray-900 shadow-2xl transition-all duration-300 cursor-pointer transform md:-translate-y-4 min-h-[400px] z-10"
                        >
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full text-center">
                                <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-widest">
                                    Recommandé
                                </span>
                            </div>
                            <div className="text-center mb-6 mt-4">
                                <div className="text-4xl font-black text-gray-900 mb-1">29,99€</div>
                                <div className="text-xs text-gray-400 font-medium mb-2">pour 4 rapports</div>
                                <div className="inline-block bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded">
                                    2 + 2 Offerts
                                </div>
                            </div>

                            <div className="flex-1 space-y-3 mb-8">
                                <div className="flex items-center gap-3 text-sm text-gray-900 font-medium">
                                    <CheckIcon className="w-4 h-4 text-emerald-500" />
                                    <span>Tout du pack Découverte</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-900 font-medium">
                                    <CheckIcon className="w-4 h-4 text-emerald-500" />
                                    <span>Valable 1 an</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-900 font-medium">
                                    <CheckIcon className="w-4 h-4 text-emerald-500" />
                                    <span>Soit 7,50€ / rapport</span>
                                </div>
                            </div>

                            <button
                                onClick={(e) => { e.stopPropagation(); openCheckout('pack4', 2999); }}
                                className="w-full bg-black text-white h-10 px-6 rounded-xl text-xs font-bold uppercase tracking-wide transition-colors relative z-20 shadow-lg"
                            >
                                Choisir
                            </button>
                        </div>

                        {/* Pack 3 - Investor */}
                        <div
                            onClick={() => openCheckout('pack10', 3999)}
                            className="group relative flex flex-col p-8 rounded-3xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300 cursor-pointer min-h-[400px]"
                        >
                            <div className="text-center mb-6">
                                <span className="inline-block px-3 py-1 mb-4 rounded-full bg-gray-50 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                                    Expert
                                </span>
                                <div className="text-3xl font-black text-gray-900 mb-1">39,99€</div>
                                <div className="text-xs text-gray-400 font-medium">pour 10 rapports</div>
                            </div>

                            <div className="flex-1 space-y-3 mb-8">
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <CheckIcon className="w-4 h-4 text-emerald-500" />
                                    <span>Idéal Investisseurs</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <CheckIcon className="w-4 h-4 text-emerald-500" />
                                    <span>Valable à vie</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <CheckIcon className="w-4 h-4 text-emerald-500" />
                                    <span>Soit 3,99€ / rapport</span>
                                </div>
                            </div>

                            <button
                                onClick={(e) => { e.stopPropagation(); openCheckout('pack10', 3999); }}
                                className="w-full h-10 bg-gray-900 text-white rounded-xl text-xs font-bold uppercase tracking-wide transition-colors relative z-20"
                            >
                                Choisir
                            </button>
                        </div>
                    </div>

                    {/* Reassurance Footer with Color Logos */}
                    <div className="mt-16 flex flex-col items-center justify-center opacity-80">
                        <div className="flex items-center gap-6 mb-4 grayscale-[0%] transition-all duration-500">
                            {/* SVG Icons from public folder */}
                            <img src="/payment-icons/visa.svg" alt="Visa" className="h-6 w-auto" />
                            <img src="/payment-icons/mastercard.svg" alt="Mastercard" className="h-6 w-auto" />
                            <img src="/payment-icons/american_express.svg" alt="Amex" className="h-6 w-auto" />
                            <img src="/payment-icons/paypal.svg" alt="PayPal" className="h-5 w-auto" />
                        </div>
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">
                            Paiement 100% Sécurisé & Crypté SSL
                        </p>
                    </div>
                </div>

                {/* INLINE CHECKOUT SECTION MOVED OUTSIDE MAIN */}
            </main>

            {/* INLINE CHECKOUT SECTION - Full Width Container */}
            <div className="w-full bg-[#FAFAFA] pb-32">
                 <InlineCheckout
                    targetRef={checkoutRef}
                    plan={selectedPlan}
                    price={selectedPrice}
                    address={data.address.label}
                />
            </div>
        </div>
            );
}

            export default function TeasingPage() {
    return (
            <Suspense fallback={<div className="min-h-screen bg-[#FAFAFA]" />}>
                <TeasingContent />
            </Suspense>
            );
}
