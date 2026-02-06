import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  TrendingUp,
  AlertTriangle,
  Zap,
  School,
  ShoppingCart,
  Shield,
  Home,
  Brain,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Info,
  CheckCircle2,
  XCircle,
  Clock,
  EuroIcon,
  Search,
  Menu,
  X,
  Share2,
  Download,
  Calendar,
  DollarSign,
  Activity,
  Navigation,
  Star,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
interface PremiumReportViewProps {
  report: any;
}

// --- Components ---

const PremiumCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
}> = ({ children, className = '', delay = 0, hover = false }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className={cn(
        'relative overflow-hidden rounded-[24px] md:rounded-[32px]',
        'bg-white',
        'border border-gray-100',
        'shadow-[0_2px_40px_-12px_rgba(0,0,0,0.05)]', // Softer shadow
        hover && 'transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)]',
        className
      )}
    >
      <div className="relative z-10 h-full">{children}</div>
    </motion.div>
  );
};

const PremiumGauge: React.FC<{
  value: number;
  label: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ value, label, size = 'md' }) => {
  const radius = 36; // Slightly smaller to fix "zoomed" feeling
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  // Responsive sizing classes
  const sizeClass = {
    sm: 'w-20 h-20 md:w-24 md:h-24',
    md: 'w-24 h-24 md:w-32 md:h-32',
    lg: 'w-32 h-32 md:w-40 md:h-40',
  }[size];

  const fontSize = {
    sm: 'text-xl md:text-2xl',
    md: 'text-2xl md:text-3xl',
    lg: 'text-3xl md:text-4xl',
  }[size];

  const getColor = () => {
    if (value >= 80) return '#10b981'; // Emerald
    if (value >= 60) return '#2563eb'; // Blue
    if (value >= 40) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };

  const color = getColor();

  return (
    <div className="relative inline-flex flex-col items-center">
      <div className={cn('relative', sizeClass)}>
        <svg className="w-full h-full transform -rotate-90">
          {/* Background Circle */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke="#f3f4f6"
            strokeWidth="6"
            fill="transparent"
          />
          {/* Progress Circle */}
          <motion.circle
            initial={{ strokeDashoffset: circumference }}
            whileInView={{ strokeDashoffset }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            cx="50%"
            cy="50%"
            r={radius}
            stroke={color}
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={circumference}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-bold text-gray-900 tracking-tighter', fontSize)}>{value}</span>
          <span className="text-[10px] md:text-xs text-gray-400 font-medium font-mono">/100</span>
        </div>
      </div>
      <span className="mt-3 text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">{label}</span>
    </div>
  );
};

// --- Main Component ---

export default function PremiumReportView({ report }: PremiumReportViewProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [scrolled, setScrolled] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setActiveTab(id);
    const element = document.getElementById(id);
    if (element) {
      const offset = 140; // Adjusted for header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!report) return null;

  const { sections = [], vehicleInfo, ai } = report;
  const globalScore = ai?.score || 75;

  const navigationTabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: Home },
    { id: 'market', label: 'Marché & Prix', icon: TrendingUp },
    { id: 'risks', label: 'Risques', icon: Shield },
    { id: 'rental_yield', label: 'Investissement', icon: DollarSign },
    { id: 'location', label: 'Quartier', icon: MapPin },
    { id: 'education', label: 'Écoles', icon: School },
    { id: 'amenities', label: 'Commerces', icon: ShoppingCart },
    { id: 'ai', label: 'Expertise IA', icon: Brain },
  ];

  const address = sections.find((s: any) => s.id === 'location')?.notes?.address || 'Adresse inconnue';
  const city = sections.find((s: any) => s.id === 'location')?.items?.find((i: any) => i.label === 'Ville')?.value || '';

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-900 font-sans selection:bg-black selection:text-white pb-20">

      {/* --- Sticky Header (Premium Glass) --- */}
      <header
        className={cn(
          "sticky top-0 z-50 transition-all duration-300 border-b border-transparent",
          scrolled ? "bg-white/80 backdrop-blur-xl border-gray-100/50 shadow-sm supports-[backdrop-filter]:bg-white/60" : "bg-transparent"
        )}
      >
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Brand */}
            <div className="flex items-center gap-3 md:gap-4">
              <div className="bg-black text-white p-2 rounded-lg md:rounded-xl">
                <Search className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-sm md:text-base font-bold text-gray-900 leading-none tracking-tight">
                  Verifiemamaison
                </h1>
                <p className="text-[10px] text-gray-500 font-medium tracking-wide uppercase mt-0.5">Rapport Premium</p>
              </div>
            </div>

            {/* Title / Actions */}
            <div className="flex items-center gap-3">
              <span className="hidden md:block text-xs font-semibold text-gray-400 uppercase tracking-wider mr-4">
                {city}
              </span>
              <button
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors shadow-lg shadow-black/5 font-bold text-xs uppercase tracking-wider"
                onClick={() => window.print()}
              >
                <Download className="w-3 h-3 md:w-4 md:h-4" />
                <span>PDF</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* --- Navigation Bar (Sticky beneath header) --- */}
      <div className="sticky top-16 md:top-20 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12">
          <div
            className="flex items-center gap-2 overflow-x-auto py-3 no-scrollbar mask-gradient-x"
            ref={scrollContainerRef}
          >
            {navigationTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => scrollToSection(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all whitespace-nowrap select-none border",
                    isActive
                      ? "bg-black text-white border-black shadow-md"
                      : "bg-white text-gray-600 border-gray-100 hover:border-gray-300 hover:text-black"
                  )}
                >
                  <Icon className={cn("w-3.5 h-3.5", isActive ? "text-white" : "text-gray-400")} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* --- Content Area (Grand Angle) --- */}
      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12 py-8 md:py-12">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 md:gap-12">

          <div className="xl:col-span-12 space-y-8 md:space-y-12">

            {/* --- Overview Section (Hero) --- */}
            {activeTab === 'overview' && (
              <div id="overview" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <PremiumCard className="p-6 md:p-10 bg-white">
                  <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-center lg:items-start">

                    {/* Left: Score & Address */}
                    <div className="flex flex-col items-center text-center lg:text-left lg:items-start flex-1">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-100 rounded-full mb-6">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-green-700">Rapport Généré</span>
                      </div>

                      <h2 className="text-2xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight leading-tight">
                        {address.split(',')[0]}
                      </h2>
                      <p className="text-gray-500 text-lg md:text-xl font-medium mb-8">
                        {address.split(',').slice(1).join(',')}
                      </p>

                      <div className="flex flex-wrap justify-center lg:justify-start gap-4 md:gap-6">
                        <div className="flex flex-col items-center lg:items-start px-6 py-3 bg-gray-50 rounded-2xl border border-gray-100">
                          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Prix m² (Est.)</span>
                          <span className="text-lg md:text-2xl font-bold text-gray-900">{ai?.market_analysis?.estimated_value_m2 || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col items-center lg:items-start px-6 py-3 bg-gray-50 rounded-2xl border border-gray-100">
                          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Risques</span>
                          <div className="flex items-center gap-2">
                            <span className="text-lg md:text-2xl font-bold text-gray-900">2</span>
                            <span className="w-2 h-2 rounded-full bg-red-500" />
                          </div>
                        </div>
                        <div className="flex flex-col items-center lg:items-start px-6 py-3 bg-gray-50 rounded-2xl border border-gray-100">
                          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">DPE</span>
                          <div className="flex items-center gap-2">
                            <span className="text-lg md:text-2xl font-bold text-gray-900">C</span>
                            <span className="w-2 h-2 rounded-full bg-yellow-500" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Gauge */}
                    <div className="flex-shrink-0 bg-gray-50 p-8 rounded-[40px] border border-gray-100/50">
                      <PremiumGauge value={globalScore} label="Confiance" size="lg" />
                    </div>

                  </div>

                  {ai?.summary && (
                    <div className="mt-10 p-6 md:p-8 bg-blue-50/50 rounded-3xl border border-blue-100/50">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-blue-100 rounded-xl">
                          <Brain className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-2">L'avis de l'IA</h3>
                          <p className="text-gray-700 leading-relaxed text-sm md:text-base font-medium">
                            {ai.summary}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </PremiumCard>
              </div>
            )}

            {/* --- Market Section --- */}
            {activeTab === 'market' && (
              <div id="market" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Marché Immobilier</h3>
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold uppercase tracking-wider text-gray-500">Données temps réel</span>
                </div>

                <PremiumCard className="p-6 md:p-8">
                  {/* Market Stats Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                    {sections.find((s: any) => s.id === 'market')?.items.map((item: any, index: number) => (
                      <div key={index} className="bg-gray-50 p-5 rounded-2xl border border-gray-100 transition-colors hover:bg-white hover:shadow-sm">
                        <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">{item.label}</p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* AI Market Comment */}
                  {ai?.market_analysis?.market_comment && (
                    <div className="mb-10 text-center max-w-3xl mx-auto">
                      <Sparkles className="w-6 h-6 text-black mx-auto mb-4" />
                      <p className="text-base md:text-xl font-medium text-gray-900 leading-relaxed">
                        "{ai.market_analysis.market_comment}"
                      </p>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-4">Analyse de marché IA</p>
                    </div>
                  )}

                  {/* Transactions Table */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Dernières transactions DVF</h4>
                    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden overflow-x-auto">
                      <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase tracking-wider">
                          <tr>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Prix</th>
                            <th className="px-6 py-4">Surface</th>
                            <th className="px-6 py-4 text-right">Prix m²</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {[1, 2, 3, 4, 5].map((_, i) => (
                            <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-4 text-gray-600 font-medium">12/03/2024</td>
                              <td className="px-6 py-4 font-bold text-gray-900">450 000 €</td>
                              <td className="px-6 py-4 text-gray-600">85 m²</td>
                              <td className="px-6 py-4 text-gray-900 font-bold text-right">5 294 €</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </PremiumCard>
              </div>
            )}

            {/* --- Risks Section --- */}
            {activeTab === 'risks' && (
              <div id="risks" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-red-50 rounded-lg"><AlertTriangle className="w-5 h-5 text-red-600" /></div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Cahier des Risques</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sections.find((s: any) => s.id === 'risks')?.items.map((item: any, index: number) => {
                    // Modern flag styling
                    const isRisk = item.flag === 'risk';
                    const isWarn = item.flag === 'warn';

                    return (
                      <PremiumCard key={index} className={cn("p-6 md:p-8 flex flex-col justify-between h-full border-t-4", isRisk ? "border-t-red-500" : isWarn ? "border-t-amber-500" : "border-t-emerald-500")}>
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <h4 className="font-bold text-gray-900 text-sm md:text-base">{item.label}</h4>
                            <span className={cn("text-[10px] font-bold uppercase px-2 py-1 rounded-md tracking-wider",
                              isRisk ? "bg-red-50 text-red-600" : isWarn ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                            )}>
                              {isRisk ? 'Critique' : isWarn ? 'Attention' : 'OK'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 leading-relaxed">
                            {item.value || "Aucun risque majeur détecté."}
                          </p>
                        </div>
                        {item.hint && (
                          <div className="mt-4 pt-4 border-t border-gray-50 text-xs text-gray-400 font-medium flex items-center gap-1">
                            <Info className="w-3 h-3" /> {item.hint}
                          </div>
                        )}
                      </PremiumCard>
                    );
                  })}
                </div>
              </div>
            )}

            {/* --- Rental Yield --- */}
            {activeTab === 'rental_yield' && (
              <div id="rental_yield" className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <PremiumCard className="p-8 bg-black text-white">
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-bold mb-1">Rentabilité Brut</h3>
                      <p className="text-gray-400 text-sm">Projection sur 1 an</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-gray-600" />
                  </div>
                  <div className="text-6xl md:text-7xl font-bold tracking-tighter mb-4">
                    5.8<span className="text-2xl text-gray-500 ml-2">%</span>
                  </div>
                  <div className="w-full bg-gray-800 h-1.5 rounded-full mb-8 overflow-hidden">
                    <div className="h-full bg-white w-[58%]" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Loyer estimé</p>
                      <p className="text-xl font-bold">1 250 €</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Cashflow</p>
                      <p className="text-xl font-bold text-green-400">+ 120 €</p>
                    </div>
                  </div>
                </PremiumCard>

                <div className="grid grid-cols-1 gap-6">
                  {sections.find((s: any) => s.id === 'rental_yield')?.items.map((item: any, idx: number) => (
                    <PremiumCard key={idx} className="p-6 flex items-center justify-between">
                      <span className="text-gray-500 text-sm font-medium">{item.label}</span>
                      <span className="text-gray-900 font-bold text-lg">{item.value}</span>
                    </PremiumCard>
                  ))}
                </div>
              </div>
            )}

            {/* --- Other Sections (Generic Grid) --- */}
            {(activeTab === 'education' || activeTab === 'amenities' || activeTab === 'location') && (
              <div id="generic" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {activeTab === 'education' ? <School className="w-5 h-5" /> :
                      activeTab === 'amenities' ? <ShoppingCart className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
                    {navigationTabs.find(t => t.id === activeTab)?.label}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {/* Map items based on section */}
                  {sections.find((s: any) => s.id === activeTab)?.items.map((item: any, i: number) => (
                    <PremiumCard key={i} className="p-6">
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">{item.label}</p>
                      <p className="text-lg font-semibold text-gray-900 line-clamp-2">{item.value}</p>
                      {item.hint && <p className="text-xs text-gray-400 mt-2">{item.hint}</p>}
                    </PremiumCard>
                  ))}
                  {/* Specific handling for notes if needed (like school lists) can be added here */}
                </div>
              </div>
            )}

            {/* --- AI Analysis (Textual) --- */}
            {activeTab === 'ai' && (
              <div id="ai" className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <PremiumCard className="p-8 md:p-12">
                  <div className="flex items-center gap-4 mb-8">
                    <Brain className="w-10 h-10 text-black" />
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Expertise Artificielle</h2>
                  </div>

                  <div className="prose prose-lg prose-gray max-w-none">
                    <p className="leading-relaxed text-gray-600">
                      {ai?.summary || "L'analyse détaillée est en cours de génération."}
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8 mt-12">
                    <div>
                      <h4 className="font-bold text-green-600 mb-4 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" /> Points Forts
                      </h4>
                      <ul className="space-y-3">
                        {ai?.pros?.map((p: string, i: number) => (
                          <li key={i} className="text-sm font-medium text-gray-700 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" /> {p}
                          </li>
                        )) || (
                            <li className="text-sm text-gray-400 italic">Aucun point fort spécifique identifié.</li>
                          )}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-bold text-red-600 mb-4 flex items-center gap-2">
                        <XCircle className="w-5 h-5" /> Vigilance
                      </h4>
                      <ul className="space-y-3">
                        {ai?.cons?.map((c: string, i: number) => (
                          <li key={i} className="text-sm font-medium text-gray-700 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" /> {c}
                          </li>
                        )) || (
                            <li className="text-sm text-gray-400 italic">Aucun point de vigilance majeur.</li>
                          )}
                      </ul>
                    </div>
                  </div>
                </PremiumCard>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* --- Footer --- */}
      <footer className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12 py-12 border-t border-gray-200 mt-12 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-xs text-gray-400 font-medium">
          © 2024 Verifiemamaison.fr • Données fournies par Etalab, DVF et nos partenaires.
        </p>
        <div className="flex gap-6">
          <a href="#" className="text-xs font-bold text-gray-900 uppercase tracking-wider hover:text-black">Support</a>
          <a href="#" className="text-xs font-bold text-gray-900 uppercase tracking-wider hover:text-black">CGV</a>
        </div>
      </footer>
    </div>
  );
}
