'use client';

import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { 
  Home, MapPin, Shield, Zap, TrendingUp, School, ShoppingCart,
  Brain, Download, Share2, CheckCircle, AlertCircle, AlertTriangle, Info, Calendar,
  Camera, Copy, Sparkles, Star, Navigation, ExternalLink, Phone, Activity
} from 'lucide-react';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  Radar, ResponsiveContainer, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar
} from 'recharts';
import { cn } from '@/lib/utils';
import type { ReportSection, AIVerification } from '@/types/report.types';
import { enrichDVFComparables } from '@/lib/dvf-comparables';

// Configuration du thème
const theme = {
  colors: {
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    accent: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#06B6D4',
    background: '#0A0B0D',
    surface: '#1A1B1E',
    surfaceLight: '#2A2B2E',
    border: 'rgba(255, 255, 255, 0.08)',
    borderLight: 'rgba(255, 255, 255, 0.12)',
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    textMuted: 'rgba(255, 255, 255, 0.5)',
  }
};

interface PremiumReportViewProps {
  sections: ReportSection[];
  vehicleInfo?: any;
  ai?: AIVerification;
  reportId: string;
  pdfUrl?: string;
}

// Carte premium avec glassmorphism
const PremiumCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
}> = ({ children, className = '', delay = 0, hover = true }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      whileHover={hover ? { y: -2, transition: { duration: 0.2 } } : undefined}
      className={cn(
        'relative overflow-hidden rounded-2xl',
        'backdrop-blur-xl bg-white/[0.02]',
        'border border-white/[0.08]',
        'shadow-2xl shadow-black/20',
        hover && 'transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.03]',
        className
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};

// Gauge circulaire premium
const PremiumGauge: React.FC<{
  value: number;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  showAnimation?: boolean;
}> = ({ value, label, size = 'md', showAnimation = true }) => {
  const sizes = {
    sm: { width: 100, height: 100, strokeWidth: 6, fontSize: 'text-2xl' },
    md: { width: 140, height: 140, strokeWidth: 8, fontSize: 'text-3xl' },
    lg: { width: 180, height: 180, strokeWidth: 10, fontSize: 'text-4xl' },
  };
  
  const config = sizes[size];
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  
  const getColor = () => {
    if (value >= 80) return theme.colors.accent;
    if (value >= 60) return theme.colors.primary;
    if (value >= 40) return theme.colors.warning;
    return theme.colors.danger;
  };
  
  const color = getColor();
  
  return (
    <div className="relative inline-flex flex-col items-center">
      <div className="relative" style={{ width: config.width, height: config.height }}>
        <div 
          className="absolute inset-0 rounded-full opacity-20 blur-xl"
          style={{ backgroundColor: color }}
        />
        
        <svg className="transform -rotate-90" width={config.width} height={config.height}>
          <circle
            cx={config.width / 2}
            cy={config.height / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth={config.strokeWidth}
            fill="none"
          />
          
          <motion.circle
            cx={config.width / 2}
            cy={config.height / 2}
            r={radius}
            stroke={color}
            strokeWidth={config.strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={showAnimation ? { strokeDashoffset: circumference } : { strokeDashoffset }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div 
            className={cn(config.fontSize, 'font-bold text-white')}
            initial={showAnimation ? { scale: 0 } : { scale: 1 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
          >
            {value}
          </motion.div>
          <div className="text-xs text-white/50 font-medium">/ 100</div>
        </div>
      </div>
      
      <div className="mt-3 text-sm font-medium text-white/70">{label}</div>
    </div>
  );
};

// Badge de statut
const StatusBadge: React.FC<{
  type: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  children: React.ReactNode;
  icon?: React.ReactNode;
}> = ({ type, children, icon }) => {
  const styles = {
    success: 'bg-green-500/10 border-green-500/20 text-green-400',
    warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    danger: 'bg-red-500/10 border-red-500/20 text-red-400',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    neutral: 'bg-white/5 border-white/10 text-white/70',
  };
  
  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium',
      styles[type]
    )}>
      {icon && <span className="w-3 h-3">{icon}</span>}
      {children}
    </div>
  );
};

// Composant principal
export default function PremiumReportView({
  sections,
  vehicleInfo,
  ai,
  reportId,
  pdfUrl
}: PremiumReportViewProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: containerRef });
  
  const navigationTabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: Home },
    { id: 'location', label: 'Localisation', icon: MapPin },
    { id: 'risks', label: 'Risques', icon: Shield },
    { id: 'energy', label: 'Énergie', icon: Zap },
    { id: 'market', label: 'Marché', icon: TrendingUp },
    { id: 'education', label: 'Éducation', icon: School },
    { id: 'amenities', label: 'Commodités', icon: ShoppingCart },
    { id: 'ai', label: 'Analyse IA', icon: Brain },
  ];
  
  const globalScore = useMemo(() => {
    let score = 70;
    sections.forEach(section => {
      section.items.forEach(item => {
        if (item.flag === 'ok') score += 3;
        if (item.flag === 'warn') score -= 2;
        if (item.flag === 'risk') score -= 5;
      });
    });
    return Math.max(0, Math.min(100, score));
  }, [sections]);
  
  const [touchStart, setTouchStart] = useState(0);
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    
    // Augmenter le seuil à 120px pour éviter les changements accidentels
    if (Math.abs(diff) > 120) {
      const currentIndex = navigationTabs.findIndex(t => t.id === activeTab);
      if (diff > 0 && currentIndex < navigationTabs.length - 1) {
        setActiveTab(navigationTabs[currentIndex + 1].id);
      } else if (diff < 0 && currentIndex > 0) {
        setActiveTab(navigationTabs[currentIndex - 1].id);
      }
    }
  };
  
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/report/${reportId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mon Rapport VerifieMaMaison',
          text: 'Consultez mon rapport immobilier détaillé',
          url: shareUrl,
        });
      } catch (err) {
        console.log('Partage annulé');
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const getStatusIcon = (flag?: string) => {
    switch (flag) {
      case 'ok': return <CheckCircle className="w-4 h-4" />;
      case 'warn': return <AlertCircle className="w-4 h-4" />;
      case 'risk': return <AlertTriangle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };
  
  return (
    <div className="min-h-screen bg-[#0A0B0D] text-white">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5" />
      </div>
      
      {/* Header simplifié sans menu hamburger */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/50 border-b border-white/[0.08]">
        <motion.div 
          className="absolute top-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"
          style={{ width: useTransform(scrollYProgress, [0, 1], ['0%', '100%']) }}
        />
        
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Rapport Immobilier</h1>
                <p className="text-xs text-white/50">ID: {reportId}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleShare}
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                {copied ? <Copy className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                <span className="text-sm hidden sm:inline">{copied ? 'Copié!' : 'Partager'}</span>
              </motion.button>
              
              {pdfUrl && (
                <motion.a
                  href={pdfUrl}
                  download
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span className="text-sm hidden sm:inline">PDF</span>
                </motion.a>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Navigation horizontale scrollable - visible sur tous les écrans */}
      <div className="sticky top-16 z-40 backdrop-blur-xl bg-black/30 border-b border-white/[0.08]">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 py-3 overflow-x-auto scrollbar-hide">
            {navigationTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex-shrink-0',
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-500/30 shadow-lg shadow-blue-500/10'
                      : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      
      <main 
        ref={containerRef}
        className="relative z-10 pb-20"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {ai && (
                  <PremiumCard className="p-6 md:p-8">
                    <div className="flex items-start gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <Brain className="w-6 h-6 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold mb-1">Analyse par Intelligence Artificielle</h2>
                        <p className="text-sm text-white/60">Synthèse générée par notre IA avancée</p>
                      </div>
                    </div>
                    
                    {/* Score et Prix au m² en haut */}
                    <div className="flex flex-col md:flex-row gap-6 items-center md:items-start mb-8">
                      <PremiumGauge value={globalScore} label="Score Global" size="lg" />
                      
                      {/* Badge Prix au m² */}
                      <PremiumCard className="p-6 flex-shrink-0" delay={0.1}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-green-400" />
                          </div>
                          <div className="text-xs text-white/50 uppercase tracking-wider">Prix au m²</div>
                        </div>
                        <div className="text-3xl font-bold text-green-400">
                          {(() => {
                            const marketPrice = sections.find(s => s.id === 'market')?.items.find(i => i.label.includes('Prix'))?.value;
                            if (marketPrice) return marketPrice;
                            
                            const estimatedPrice = ai.market_analysis?.estimated_value_m2;
                            if (estimatedPrice && typeof estimatedPrice === 'number') {
                              return `${Math.round(estimatedPrice).toLocaleString('fr-FR')} €/m²`;
                            }
                            
                            return 'N/A';
                          })()}
                        </div>
                        {ai.market_analysis?.market_trend && (
                          <div className="text-xs text-white/50 mt-2 flex items-center gap-1">
                            <TrendingUp className={cn(
                              "w-3 h-3",
                              ai.market_analysis.market_trend === 'hausse' ? "text-green-400" :
                              ai.market_analysis.market_trend === 'baisse' ? "text-red-400" :
                              "text-gray-400"
                            )} />
                            <span>Tendance: {ai.market_analysis.market_trend}</span>
                          </div>
                        )}
                      </PremiumCard>
                    </div>
                    
                    {/* Synthèse IA détaillée */}
                    <div className="space-y-4">
                      {ai.summary && (
                        <div className="prose prose-invert max-w-none">
                          <div className="text-white/90 leading-relaxed text-base whitespace-pre-line">
                            {ai.summary}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
                        <StatusBadge type="success" icon={<CheckCircle className="w-3 h-3" />}>
                          Données vérifiées
                        </StatusBadge>
                        <StatusBadge type="info" icon={<Sparkles className="w-3 h-3" />}>
                          Analyse IA complète
                        </StatusBadge>
                        <StatusBadge type="neutral" icon={<Calendar className="w-3 h-3" />}>
                          {new Date().toLocaleDateString('fr-FR')}
                        </StatusBadge>
                      </div>
                    </div>
                  </PremiumCard>
                )}
              </motion.div>
            )}
            
            {/* Section Localisation */}
            {activeTab === 'location' && (
              <motion.div
                key="location"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Image du bien avec Google Street View */}
                <PremiumCard className="p-0 overflow-hidden" delay={0}>
                  <div 
                    className="relative w-full h-96 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center"
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
                  >
                    {/* Image si disponible */}
                    {vehicleInfo?.image ? (
                      <img
                        src={vehicleInfo.image}
                        alt="Photo du bien"
                        className="w-full h-full object-cover"
                      />
                    ) : vehicleInfo?.gps && process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ? (
                      // Google Maps Static API - Image satellite propre
                      <img
                        src={`https://maps.googleapis.com/maps/api/staticmap?center=${vehicleInfo.gps.lat},${vehicleInfo.gps.lon}&zoom=18&size=1200x600&maptype=satellite&markers=color:red%7C${vehicleInfo.gps.lat},${vehicleInfo.gps.lon}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}`}
                        alt="Image satellite du bien"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : vehicleInfo?.gps ? (
                      // Fallback: Google Street View si pas de clé API
                      <img
                        src={`https://maps.googleapis.com/maps/api/streetview?size=1200x600&location=${vehicleInfo.gps.lat},${vehicleInfo.gps.lon}&heading=0&pitch=0&fov=90`}
                        alt="Vue Street View du bien"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      // Placeholder si pas d'image et pas de GPS
                      <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                          <Camera className="w-8 h-8 text-blue-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1">Photo du bien</h3>
                          <p className="text-sm text-white/60">Aucune image disponible pour le moment</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Overlay avec infos */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-white">Localisation du bien</div>
                          <div className="text-xs text-white/60 mt-1">
                            {sections.find(s => s.id === 'location')?.items.find(i => i.label === 'Adresse')?.value ||
                             sections.find(s => s.id === 'location')?.items.find(i => i.label === 'Commune')?.value ||
                             'Adresse non disponible'}
                          </div>
                        </div>
                        {vehicleInfo?.gps && (
                          <a
                            href={`https://www.google.com/maps?q=${vehicleInfo.gps.lat},${vehicleInfo.gps.lon}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors flex items-center gap-2 text-sm"
                          >
                            <MapPin className="w-4 h-4" />
                            Maps
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </PremiumCard>
                
                {/* Informations de localisation */}
                <PremiumCard className="p-6 md:p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold mb-1">Localisation</h2>
                      <p className="text-sm text-white/60">Informations géographiques du bien</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {sections.find(s => s.id === 'location')?.items.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
                      >
                        <span className="text-white/70">{item.label}</span>
                        <span className="text-white font-medium">{item.value}</span>
                      </motion.div>
                    ))}
                  </div>
                </PremiumCard>
              </motion.div>
            )}
            
            {/* Section Risques */}
            {activeTab === 'risks' && (
              <motion.div
                key="risks"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* En-tête */}
                <PremiumCard className="p-6 md:p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-6 h-6 text-red-400" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-semibold mb-2">Analyse des Risques</h2>
                      <p className="text-sm text-white/60">Risques naturels, technologiques et environnementaux</p>
                    </div>
                  </div>
                </PremiumCard>
                
                {/* Grille de risques */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sections.find(s => s.id === 'risks')?.items.map((item, index) => {
                    const getRiskColor = () => {
                      if (item.flag === 'risk') return { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', icon: 'text-red-400' };
                      if (item.flag === 'warn') return { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', icon: 'text-yellow-400' };
                      return { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', icon: 'text-green-400' };
                    };
                    const colors = getRiskColor();
                    
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          'relative overflow-hidden rounded-2xl border p-6',
                          'backdrop-blur-xl bg-white/[0.02]',
                          colors.bg,
                          colors.border,
                          'transition-all hover:bg-white/[0.04]'
                        )}
                      >
                        {/* Reflet en haut */}
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                        
                        {/* Contenu */}
                        <div className="relative z-10 space-y-3">
                          {/* Icône et titre */}
                          <div className="flex items-start gap-3">
                            <div className={cn('p-2 rounded-lg bg-white/5', colors.icon)}>
                              {item.flag === 'risk' && <AlertTriangle className="w-5 h-5" />}
                              {item.flag === 'warn' && <AlertCircle className="w-5 h-5" />}
                              {item.flag === 'ok' && <CheckCircle className="w-5 h-5" />}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-white">{item.label}</h3>
                            </div>
                          </div>
                          
                          {/* Valeur */}
                          <div className="pl-11">
                            <p className="text-sm text-white/80">{item.value}</p>
                            {item.hint && (
                              <p className="text-xs text-white/50 mt-2 italic">{item.hint}</p>
                            )}
                          </div>
                          
                          {/* Badge de statut */}
                          <div className="pl-11 pt-2">
                            <span className={cn(
                              'inline-block px-3 py-1 rounded-full text-xs font-medium',
                              item.flag === 'risk' ? 'bg-red-500/20 text-red-300' :
                              item.flag === 'warn' ? 'bg-yellow-500/20 text-yellow-300' :
                              'bg-green-500/20 text-green-300'
                            )}>
                              {item.flag === 'risk' ? '⚠️ Risque détecté' :
                               item.flag === 'warn' ? '⚡ À vérifier' :
                               '✅ Aucun risque'}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                
                {/* Résumé des risques */}
                {sections.find(s => s.id === 'risks')?.items && sections.find(s => s.id === 'risks')?.items.length > 0 && (
                  <PremiumCard className="p-6 md:p-8">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-blue-400" />
                      Résumé des risques
                    </h3>
                    
                    <div className="space-y-3">
                      {(() => {
                        const risks = sections.find(s => s.id === 'risks')?.items || [];
                        const riskCount = risks.filter(r => r.flag === 'risk').length;
                        const warnCount = risks.filter(r => r.flag === 'warn').length;
                        const okCount = risks.filter(r => r.flag === 'ok').length;
                        
                        return (
                          <>
                            {riskCount > 0 && (
                              <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                              >
                                <span className="text-white/80">Risques détectés</span>
                                <span className="text-red-400 font-semibold">{riskCount}</span>
                              </motion.div>
                            )}
                            {warnCount > 0 && (
                              <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg"
                              >
                                <span className="text-white/80">Points à vérifier</span>
                                <span className="text-yellow-400 font-semibold">{warnCount}</span>
                              </motion.div>
                            )}
                            {okCount > 0 && (
                              <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg"
                              >
                                <span className="text-white/80">Éléments sécurisés</span>
                                <span className="text-green-400 font-semibold">{okCount}</span>
                              </motion.div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </PremiumCard>
                )}
              </motion.div>
            )}
            
            {/* Section Énergie */}
            {activeTab === 'energy' && (
              <motion.div
                key="energy"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <PremiumCard className="p-6 md:p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold mb-1">Performance Énergétique</h2>
                      <p className="text-sm text-white/60">DPE et diagnostics énergétiques</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {sections.find(s => s.id === 'energy')?.items.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
                      >
                        <span className="text-white/70">{item.label}</span>
                        <span className="text-white font-medium">{item.value}</span>
                      </motion.div>
                    ))}
                  </div>
                </PremiumCard>
              </motion.div>
            )}

            {/* Section Marché */}
            {activeTab === 'market' && (
              <motion.div
                key="market"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <PremiumCard className="p-6 md:p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-6 h-6 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold mb-1">Marché Immobilier</h2>
                      <p className="text-sm text-white/60">Prix et tendances du marché</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {sections.find(s => s.id === 'market')?.items.map((item, index) => {
                      const isPrice = item.label.includes('Prix');
                      const isTrend = item.label.includes('Tendance');
                      const isVolume = item.label.includes('Volume') || item.label.includes('Nombre');
                      
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className={cn(
                            "backdrop-blur-xl border rounded-xl p-4",
                            isPrice ? "bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30" :
                            isTrend ? "bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30" :
                            "bg-white/[0.02] border-white/[0.08]"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            {isPrice && <TrendingUp className="w-4 h-4 text-green-400" />}
                            {isTrend && (
                              <TrendingUp className={cn(
                                "w-4 h-4",
                                item.flag === 'ok' ? "text-green-400" :
                                item.flag === 'warn' ? "text-red-400" :
                                "text-gray-400"
                              )} />
                            )}
                            {isVolume && <Activity className="w-4 h-4 text-blue-400" />}
                            <div className="text-xs text-white/50 uppercase tracking-wider truncate">{item.label}</div>
                          </div>
                          <div className={cn(
                            "text-xl md:text-2xl font-bold break-words",
                            isPrice ? "text-green-400" :
                            isTrend ? (item.flag === 'ok' ? "text-green-400" : item.flag === 'warn' ? "text-red-400" : "text-gray-400") :
                            "text-white"
                          )}>
                            {item.value}
                          </div>
                          {item.hint && (
                            <div className="text-xs text-white/50 mt-2 line-clamp-2 break-words flex items-start gap-1">
                              <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              <span>{item.hint}</span>
                            </div>
                          )}
                          {item.flag && (
                            <div className="mt-2">
                              <StatusBadge 
                                type={item.flag === 'ok' ? 'success' : item.flag === 'warn' ? 'warning' : 'neutral'}
                              >
                                {item.flag === 'ok' ? '✅ Positif' : item.flag === 'warn' ? '⚠️ Attention' : 'ℹ️ Info'}
                              </StatusBadge>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </PremiumCard>

                {/* Comparables DVF - Section améliorée avec statistiques */}
                {(() => {
                  const txSection = sections.find(s => s.id === 'market_transactions');
                  if (!txSection || !txSection.items || txSection.items.length === 0) return null;
                  
                  // Parser les données des transactions depuis le format actuel
                  const parseTransaction = (item: any) => {
                    const valueStr = String(item.value || '');
                    const parts = valueStr.split(' • ');
                    const dateStr = item.label?.replace('Vente ', '').split(' - ')[1] || '';
                    
                    // Extraire les valeurs numériques
                    const surfaceMatch = parts[1]?.match(/(\d+)\s*m²/);
                    const priceMatch = parts[2]?.match(/([\d\s]+)\s*€/);
                    const priceM2Match = parts[3]?.match(/([\d\s]+)\s*€\/m²/);
                    
                    return {
                      date: dateStr,
                      type: parts[0] || '',
                      surface: surfaceMatch ? parseInt(surfaceMatch[1]) : null,
                      surfaceStr: parts[1] || '',
                      price: priceMatch ? parseInt(priceMatch[1].replace(/\s/g, '')) : null,
                      priceStr: parts[2] || '',
                      priceM2: priceM2Match ? parseInt(priceM2Match[1].replace(/\s/g, '')) : null,
                      priceM2Str: parts[3] || '',
                      address: item.hint || ''
                    };
                  };
                  
                  // Parser toutes les transactions
                  const transactions = txSection.items.map(parseTransaction).filter(tx => tx.priceM2 !== null);
                  
                  // Calculer les statistiques
                  const stats = enrichDVFComparables(
                    transactions.map((tx, idx) => ({
                      id: `tx-${idx}`,
                      date: tx.date,
                      price: tx.price || 0,
                      price_m2: tx.priceM2 || 0,
                      surface: tx.surface || 0,
                      type: tx.type,
                      address: tx.address,
                    }))
                  );
                  
                  return (
                    <div className="space-y-6">
                      {/* Statistiques des comparables */}
                      <PremiumCard className="p-6 md:p-8">
                        <div className="flex items-start gap-4 mb-6">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center flex-shrink-0">
                            <TrendingUp className="w-6 h-6 text-green-400" />
                          </div>
                          <div className="flex-1">
                            <h2 className="text-xl font-semibold mb-1">Comparables DVF</h2>
                            <p className="text-sm text-white/60">Transactions réelles autour de l'adresse</p>
                          </div>
                        </div>
                        
                        {/* Grille de statistiques */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                            className="backdrop-blur-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-4"
                          >
                            <div className="text-xs text-white/50 mb-2 uppercase tracking-wider">Nombre</div>
                            <div className="text-2xl font-bold text-green-400">{stats.count}</div>
                            <div className="text-xs text-white/50 mt-1">transaction{stats.count > 1 ? 's' : ''}</div>
                          </motion.div>
                          
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.15 }}
                            className="backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-4"
                          >
                            <div className="text-xs text-white/50 mb-2 uppercase tracking-wider">Prix médian</div>
                            <div className="text-2xl font-bold text-blue-400">
                              {stats.avgPriceM2 > 0 ? `${stats.avgPriceM2.toLocaleString('fr-FR')} €/m²` : 'N/A'}
                            </div>
                            <div className="text-xs text-white/50 mt-1">au m²</div>
                          </motion.div>
                          
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="backdrop-blur-xl bg-white/[0.02] border border-white/[0.08] rounded-xl p-4"
                          >
                            <div className="text-xs text-white/50 mb-2 uppercase tracking-wider">Prix min</div>
                            <div className="text-xl font-bold text-white">
                              {stats.minPriceM2 > 0 ? `${stats.minPriceM2.toLocaleString('fr-FR')} €/m²` : 'N/A'}
                            </div>
                          </motion.div>
                          
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.25 }}
                            className="backdrop-blur-xl bg-white/[0.02] border border-white/[0.08] rounded-xl p-4"
                          >
                            <div className="text-xs text-white/50 mb-2 uppercase tracking-wider">Prix max</div>
                            <div className="text-xl font-bold text-white">
                              {stats.maxPriceM2 > 0 ? `${stats.maxPriceM2.toLocaleString('fr-FR')} €/m²` : 'N/A'}
                            </div>
                          </motion.div>
                        </div>
                        
                        {/* Info badge */}
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                          <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                          <div className="text-xs text-white/70">
                            <strong>Données DVF :</strong> Transactions réelles enregistrées par l'administration fiscale. 
                            Données publiques et fiables pour comparer les prix du marché.
                          </div>
                        </div>
                      </PremiumCard>
                      
                      {/* Liste des transactions */}
                      <PremiumCard className="p-6 md:p-8">
                        <h3 className="text-lg font-semibold mb-4">Détail des transactions</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {transactions.map((tx, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="backdrop-blur-xl bg-white/[0.02] border border-white/[0.08] rounded-xl p-5 hover:border-white/[0.15] transition-all group"
                            >
                              <div className="flex items-start justify-between gap-3 mb-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                      <span className="text-xs font-bold text-green-400">#{idx + 1}</span>
                                    </div>
                                    <div className="text-sm font-semibold text-white">{tx.date}</div>
                                  </div>
                                  {tx.address && (
                                    <div className="text-xs text-white/60 mb-2 flex items-start gap-1.5">
                                      <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-white/40" />
                                      <span className="line-clamp-2">{tx.address}</span>
                                    </div>
                                  )}
                                </div>
                                {tx.type && (
                                  <span className={cn(
                                    "text-xs px-2.5 py-1 rounded-full border flex-shrink-0",
                                    tx.type === 'maison' 
                                      ? "bg-orange-500/20 text-orange-300 border-orange-500/30"
                                      : tx.type === 'appartement'
                                      ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                                      : "bg-gray-500/20 text-gray-300 border-gray-500/30"
                                  )}>
                                    {tx.type === 'maison' ? '🏠 Maison' : tx.type === 'appartement' ? '🏢 Appartement' : tx.type}
                                  </span>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
                                {tx.surface && (
                                  <div>
                                    <div className="text-xs text-white/50 mb-1">Surface</div>
                                    <div className="text-sm font-semibold text-white">{tx.surface} m²</div>
                                  </div>
                                )}
                                {tx.price && (
                                  <div>
                                    <div className="text-xs text-white/50 mb-1">Prix total</div>
                                    <div className="text-sm font-semibold text-green-400">
                                      {tx.price.toLocaleString('fr-FR')} €
                                    </div>
                                  </div>
                                )}
                                {tx.priceM2 && (
                                  <div className="col-span-3">
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                                      <div>
                                        <div className="text-xs text-white/50 mb-1">Prix au m²</div>
                                        <div className="text-lg font-bold text-green-400">
                                          {tx.priceM2.toLocaleString('fr-FR')} €/m²
                                        </div>
                                      </div>
                                      <TrendingUp className="w-5 h-5 text-green-400/50" />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </PremiumCard>
                    </div>
                  );
                })()}
              </motion.div>
            )}

            {/* Section Éducation */}
            {activeTab === 'education' && (
              <motion.div
                key="education"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <PremiumCard className="p-6 md:p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center flex-shrink-0">
                      <School className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold mb-1">Établissements Scolaires</h2>
                      <p className="text-sm text-white/60">Écoles à proximité du bien</p>
                    </div>
                  </div>
                  
                  {/* Statistiques générales */}
                  {sections.find(s => s.id === 'education')?.items && sections.find(s => s.id === 'education')!.items.length > 0 && (
                    <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                      {sections.find(s => s.id === 'education')!.items.slice(0, 4).map((item, index) => (
                        <div key={index} className="backdrop-blur-xl bg-white/[0.02] border border-white/[0.08] rounded-lg p-3">
                          <div className="text-xs text-white/50 mb-1">{item.label}</div>
                          <div className="text-sm font-semibold text-white">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Cartes des écoles style Google Maps */}
                  <div className="space-y-4">
                    {(() => {
                      const educationSection = sections.find(s => s.id === 'education');
                      const schoolsData = educationSection?.notes as any[] || [];
                      
                      if (schoolsData.length === 0) {
                        return (
                          <div className="text-center py-8 text-white/50">
                            <School className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Aucune école trouvée à proximité</p>
                          </div>
                        );
                      }
                      
                      return schoolsData.map((school, index) => {
                        const getSchoolTypeLabel = (kind: string) => {
                          const labels: Record<string, string> = {
                            'maternelle': 'École maternelle',
                            'élémentaire': 'École élémentaire',
                            'collège': 'Collège',
                            'lycée': 'Lycée',
                            'autre': 'Établissement'
                          };
                          return labels[kind] || kind.charAt(0).toUpperCase() + kind.slice(1);
                        };
                        
                        const formatDistance = (distance_m?: number) => {
                          if (!distance_m) return '';
                          if (distance_m < 1000) return `${Math.round(distance_m)} m`;
                          return `${(distance_m / 1000).toFixed(1)} km`;
                        };
                        
                        const getMapImageUrl = (gps?: { lat: number; lon: number }) => {
                          if (!gps) return null;
                          const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
                          if (apiKey) {
                            return `https://maps.googleapis.com/maps/api/staticmap?center=${gps.lat},${gps.lon}&zoom=16&size=400x200&maptype=roadmap&markers=color:blue%7C${gps.lat},${gps.lon}&key=${apiKey}`;
                          }
                          return null;
                        };
                        
                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="backdrop-blur-xl bg-white/[0.02] border border-white/[0.08] rounded-xl overflow-hidden hover:border-white/[0.15] transition-all"
                          >
                            <div className="flex flex-col md:flex-row">
                              {/* Image/Photo style Google Maps */}
                              <div className="relative w-full md:w-48 h-32 md:h-auto bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex-shrink-0">
                                {getMapImageUrl(school.gps) ? (
                                  <img
                                    src={getMapImageUrl(school.gps)!}
                                    alt={school.name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <School className="w-12 h-12 text-blue-400/30" />
                                  </div>
                                )}
                                {school.distance_m && (
                                  <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-black/70 backdrop-blur-sm text-xs font-medium text-white">
                                    {formatDistance(school.distance_m)}
                                  </div>
                                )}
                              </div>
                              
                              {/* Contenu de la carte */}
                              <div className="flex-1 p-4 md:p-5">
                                <div className="flex items-start justify-between gap-3 mb-2">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-semibold text-white mb-1 truncate">
                                      {school.name}
                                    </h3>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                        {getSchoolTypeLabel(school.kind)}
                                      </span>
                                      {school.public_private && (
                                        <span className={cn(
                                          "text-xs px-2 py-1 rounded-full border",
                                          school.public_private === 'public'
                                            ? "bg-green-500/20 text-green-300 border-green-500/30"
                                            : "bg-purple-500/20 text-purple-300 border-purple-500/30"
                                        )}>
                                          {school.public_private === 'public' ? 'Public' : 'Privé'}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Note Google avec étoiles */}
                                  {school.rating && (
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <div className="flex items-center gap-0.5">
                                        {[...Array(5)].map((_, i) => {
                                          const starValue = i + 1;
                                          const rating = school.rating || 0;
                                          const isFull = starValue <= Math.floor(rating);
                                          const isHalf = !isFull && starValue - 0.5 <= rating;
                                          
                                          return (
                                            <div key={i} className="relative w-4 h-4">
                                              {/* Étoile de fond (vide) */}
                                              <Star className="absolute inset-0 w-4 h-4 text-gray-500/40 fill-gray-500/20" />
                                              {/* Étoile pleine ou demi */}
                                              {isFull ? (
                                                <Star className="absolute inset-0 w-4 h-4 text-yellow-400 fill-yellow-400" />
                                              ) : isHalf ? (
                                                <div className="absolute inset-0 overflow-hidden">
                                                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" style={{ clipPath: 'inset(0 50% 0 0)' }} />
                                                </div>
                                              ) : null}
                                            </div>
                                          );
                                        })}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <span className="text-sm font-semibold text-white">
                                          {school.rating.toFixed(1)}
                                        </span>
                                        {school.rating_count && (
                                          <span className="text-xs text-white/50">
                                            ({school.rating_count.toLocaleString('fr-FR')})
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Adresse */}
                                {(school.address || school.postcode || school.city) && (
                                  <div className="flex items-start gap-2 mb-3">
                                    <MapPin className="w-4 h-4 text-white/50 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-white/70">
                                      {school.address && <div>{school.address}</div>}
                                      <div>
                                        {school.postcode && school.city 
                                          ? `${school.postcode} ${school.city}`
                                          : school.postcode 
                                          ? school.postcode
                                          : school.city || ''}
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Actions */}
                                <div className="flex items-center gap-2 mt-4 flex-wrap">
                                  {school.gps && (
                                    <motion.a
                                      href={`https://www.google.com/maps?q=${school.gps.lat},${school.gps.lon}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-500/30 hover:from-blue-500/30 hover:to-indigo-500/30 transition-all text-xs font-medium text-white flex items-center gap-2 shadow-lg shadow-blue-500/10"
                                    >
                                      <Navigation className="w-4 h-4" />
                                      <span>Maps</span>
                                    </motion.a>
                                  )}
                                  {school.website && (
                                    <motion.a
                                      href={school.website.startsWith('http') ? school.website : `https://${school.website}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-500/30 hover:from-blue-500/30 hover:to-indigo-500/30 transition-all text-xs font-medium text-white flex items-center gap-2 shadow-lg shadow-blue-500/10"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                      <span>Site web</span>
                                    </motion.a>
                                  )}
                                  {school.phone && (
                                    <motion.a
                                      href={`tel:${school.phone}`}
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-500/30 hover:from-blue-500/30 hover:to-indigo-500/30 transition-all text-xs font-medium text-white flex items-center gap-2 shadow-lg shadow-blue-500/10"
                                    >
                                      <Phone className="w-4 h-4" />
                                      <span>Appeler</span>
                                    </motion.a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      });
                    })()}
                  </div>
                </PremiumCard>
              </motion.div>
            )}

            {/* Section Commodités */}
            {activeTab === 'amenities' && (
              <motion.div
                key="amenities"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <PremiumCard className="p-6 md:p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0">
                      <ShoppingCart className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold mb-1">Commodités</h2>
                      <p className="text-sm text-white/60">Services et commerces à proximité</p>
                    </div>
                  </div>
                  
                  {/* Statistiques générales */}
                  {sections.find(s => s.id === 'amenities')?.items && sections.find(s => s.id === 'amenities')!.items.length > 0 && (
                    <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                      {sections.find(s => s.id === 'amenities')!.items.slice(0, 4).map((item, index) => (
                        <div key={index} className="backdrop-blur-xl bg-white/[0.02] border border-white/[0.08] rounded-lg p-3">
                          <div className="text-xs text-white/50 mb-1">{item.label}</div>
                          <div className="text-sm font-semibold text-white">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Cartes des commodités style Google Maps */}
                  <div className="space-y-4">
                    {(() => {
                      const amenitiesSection = sections.find(s => s.id === 'amenities');
                      const amenitiesData = amenitiesSection?.notes as any[] || [];
                      
                      if (amenitiesData.length === 0) {
                        return (
                          <div className="text-center py-8 text-white/50">
                            <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Aucune commodité trouvée à proximité</p>
                          </div>
                        );
                      }
                      
                      return amenitiesData.map((amenity, index) => {
                        const getCategoryIcon = (type: string, category?: string) => {
                          if (type === 'supermarket') return ShoppingCart;
                          if (type === 'transit') return Navigation;
                          if (type === 'park') return Activity;
                          return ShoppingCart;
                        };
                        
                        const getCategoryLabel = (type: string, category?: string, transitType?: string) => {
                          if (type === 'supermarket') return category || 'Supermarché';
                          if (type === 'transit') {
                            if (transitType === 'station') return 'Gare';
                            if (transitType === 'bus_station') return 'Arrêt de bus';
                            if (transitType === 'subway_entrance') return 'Métro';
                            return category || 'Transport';
                          }
                          if (type === 'park') return category || 'Parc';
                          return category || 'Commerce';
                        };
                        
                        const getCategoryColor = (type: string) => {
                          if (type === 'supermarket') return { bg: 'from-green-500/20 to-emerald-500/20', border: 'border-green-500/30', text: 'text-green-300', icon: 'text-green-400' };
                          if (type === 'transit') return { bg: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/30', text: 'text-blue-300', icon: 'text-blue-400' };
                          if (type === 'park') return { bg: 'from-emerald-500/20 to-teal-500/20', border: 'border-emerald-500/30', text: 'text-emerald-300', icon: 'text-emerald-400' };
                          return { bg: 'from-purple-500/20 to-pink-500/20', border: 'border-purple-500/30', text: 'text-purple-300', icon: 'text-purple-400' };
                        };
                        
                        const formatDistance = (distance_m?: number) => {
                          if (!distance_m) return '';
                          if (distance_m < 1000) return `${Math.round(distance_m)} m`;
                          return `${(distance_m / 1000).toFixed(1)} km`;
                        };
                        
                        const getMapImageUrl = (gps?: { lat: number; lon: number }) => {
                          if (!gps) return null;
                          const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
                          if (apiKey) {
                            return `https://maps.googleapis.com/maps/api/staticmap?center=${gps.lat},${gps.lon}&zoom=16&size=400x200&maptype=roadmap&markers=color:purple%7C${gps.lat},${gps.lon}&key=${apiKey}`;
                          }
                          return null;
                        };
                        
                        const CategoryIcon = getCategoryIcon(amenity.type, amenity.category);
                        const colors = getCategoryColor(amenity.type);
                        
                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="backdrop-blur-xl bg-white/[0.02] border border-white/[0.08] rounded-xl overflow-hidden hover:border-white/[0.15] transition-all"
                          >
                            <div className="flex flex-col md:flex-row">
                              {/* Image/Photo style Google Maps */}
                              <div className="relative w-full md:w-48 h-32 md:h-auto bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex-shrink-0">
                                {getMapImageUrl(amenity.gps) ? (
                                  <img
                                    src={getMapImageUrl(amenity.gps)!}
                                    alt={amenity.name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <CategoryIcon className={`w-12 h-12 ${colors.icon} opacity-30`} />
                                  </div>
                                )}
                                {amenity.distance_m && (
                                  <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-black/70 backdrop-blur-sm text-xs font-medium text-white">
                                    {formatDistance(amenity.distance_m)}
                                  </div>
                                )}
                              </div>
                              
                              {/* Contenu de la carte */}
                              <div className="flex-1 p-4 md:p-5">
                                <div className="flex items-start justify-between gap-3 mb-2">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-semibold text-white mb-1 truncate">
                                      {amenity.name}
                                    </h3>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={cn(
                                        "text-xs px-2 py-1 rounded-full border",
                                        `bg-gradient-to-r ${colors.bg} ${colors.border} ${colors.text}`
                                      )}>
                                        {getCategoryLabel(amenity.type, amenity.category, amenity.transit_type)}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {/* Note Google avec étoiles */}
                                  {amenity.rating && (
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <div className="flex items-center gap-0.5">
                                        {[...Array(5)].map((_, i) => {
                                          const starValue = i + 1;
                                          const rating = amenity.rating || 0;
                                          const isFull = starValue <= Math.floor(rating);
                                          const isHalf = !isFull && starValue - 0.5 <= rating;
                                          
                                          return (
                                            <div key={i} className="relative w-4 h-4">
                                              {/* Étoile de fond (vide) */}
                                              <Star className="absolute inset-0 w-4 h-4 text-gray-500/40 fill-gray-500/20" />
                                              {/* Étoile pleine ou demi */}
                                              {isFull ? (
                                                <Star className="absolute inset-0 w-4 h-4 text-yellow-400 fill-yellow-400" />
                                              ) : isHalf ? (
                                                <div className="absolute inset-0 overflow-hidden">
                                                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" style={{ clipPath: 'inset(0 50% 0 0)' }} />
                                                </div>
                                              ) : null}
                                            </div>
                                          );
                                        })}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <span className="text-sm font-semibold text-white">
                                          {amenity.rating.toFixed(1)}
                                        </span>
                                        {amenity.rating_count && (
                                          <span className="text-xs text-white/50">
                                            ({amenity.rating_count.toLocaleString('fr-FR')})
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Adresse */}
                                {amenity.address && (
                                  <div className="flex items-start gap-2 mb-3">
                                    <MapPin className="w-4 h-4 text-white/50 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-white/70">
                                      {amenity.address}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Actions */}
                                <div className="flex items-center gap-2 mt-4 flex-wrap">
                                  {amenity.gps && (
                                    <motion.a
                                      href={`https://www.google.com/maps?q=${amenity.gps.lat},${amenity.gps.lon}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-500/30 hover:from-blue-500/30 hover:to-indigo-500/30 transition-all text-xs font-medium text-white flex items-center gap-2 shadow-lg shadow-blue-500/10"
                                    >
                                      <Navigation className="w-4 h-4" />
                                      <span>Maps</span>
                                    </motion.a>
                                  )}
                                  {amenity.website && (
                                    <motion.a
                                      href={amenity.website.startsWith('http') ? amenity.website : `https://${amenity.website}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-500/30 hover:from-blue-500/30 hover:to-indigo-500/30 transition-all text-xs font-medium text-white flex items-center gap-2 shadow-lg shadow-blue-500/10"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                      <span>Site web</span>
                                    </motion.a>
                                  )}
                                  {amenity.phone && (
                                    <motion.a
                                      href={`tel:${amenity.phone}`}
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-500/30 hover:from-blue-500/30 hover:to-indigo-500/30 transition-all text-xs font-medium text-white flex items-center gap-2 shadow-lg shadow-blue-500/10"
                                    >
                                      <Phone className="w-4 h-4" />
                                      <span>Appeler</span>
                                    </motion.a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      });
                    })()}
                  </div>
                </PremiumCard>
              </motion.div>
            )}

            {/* Section Analyse IA */}
            {activeTab === 'ai' && ai && (
              <motion.div
                key="ai"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <PremiumCard className="p-6 md:p-8">
                  <div className="flex items-start gap-4 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <Brain className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold mb-1">Analyse par Intelligence Artificielle</h2>
                      <p className="text-sm text-white/60">Synthèse et recommandations</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-8 items-center mb-8">
                    <PremiumGauge value={ai.score || 0} label="Score IA" size="md" />
                    
                    {ai.summary && (
                      <div className="flex-1">
                        <p className="text-white/80 leading-relaxed">{ai.summary}</p>
                      </div>
                    )}
                  </div>
                  
                  {ai.recommendations && ai.recommendations.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Recommandations</h3>
                      <div className="space-y-2">
                        {ai.recommendations.map((rec, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-start gap-3 p-3 backdrop-blur-xl bg-white/[0.02] border border-white/[0.08] rounded-lg"
                          >
                            <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-white/80">{rec}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </PremiumCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
