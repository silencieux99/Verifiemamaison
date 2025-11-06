'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { 
  Home, MapPin, Shield, Zap, TrendingUp, School, ShoppingCart,
  Brain, Download, Share2, ChevronLeft, ChevronRight, Menu, X,
  CheckCircle, AlertCircle, AlertTriangle, Info, Calendar,
  Clock, Users, Building2, Droplets, Phone, Globe, Heart,
  Star, ArrowUp, ArrowDown, Minus, ExternalLink, Copy,
  FileText, Camera, Navigation, Gauge, Activity, Sparkles
} from 'lucide-react';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  Radar, ResponsiveContainer, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar
} from 'recharts';
import { cn } from '@/lib/utils';
import type { ReportSection, AIVerification } from '@/types/report.types';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
            
            <div className="hidden md:flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleShare}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                {copied ? <Copy className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                <span className="text-sm">{copied ? 'Copié!' : 'Partager'}</span>
              </motion.button>
              
              {pdfUrl && (
                <motion.a
                  href={pdfUrl}
                  download
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span className="text-sm">PDF</span>
                </motion.a>
              )}
            </div>
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-white/5 border border-white/10"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>
      
      <div className="hidden md:block sticky top-16 z-40 backdrop-blur-xl bg-black/30 border-b border-white/[0.08]">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 py-2 overflow-x-auto scrollbar-hide">
            {navigationTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap',
                    activeTab === tab.id
                      ? 'bg-white/10 text-white border border-white/20'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-16 z-40 md:hidden backdrop-blur-xl bg-black/95 border-b border-white/[0.08]"
          >
            <div className="container mx-auto px-4 py-4">
              <div className="grid grid-cols-2 gap-2">
                {navigationTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setMobileMenuOpen(false);
                      }}
                      className={cn(
                        'flex items-center gap-2 px-3 py-3 rounded-xl transition-all',
                        activeTab === tab.id
                          ? 'bg-white/10 text-white border border-white/20'
                          : 'text-white/60 bg-white/5'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
              
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleShare}
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="text-sm">Partager</span>
                </button>
                {pdfUrl && (
                  <a
                    href={pdfUrl}
                    download
                    className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-sm">PDF</span>
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
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
                    
                    <div className="flex flex-col md:flex-row gap-8 items-center">
                      <PremiumGauge value={globalScore} label="Score Global" size="lg" />
                      
                      <div className="flex-1 space-y-4">
                        {ai.summary && (
                          <div className="prose prose-invert max-w-none">
                            <p className="text-white/80 leading-relaxed">{ai.summary}</p>
                          </div>
                        )}
                        
                        <div className="flex flex-wrap gap-2">
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
                    </div>
                  </PremiumCard>
                )}
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <PremiumCard className="p-4" delay={0.1}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-green-400" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold">
                      {sections.find(s => s.id === 'market')?.items.find(i => i.label.includes('Prix'))?.value || 'N/A'}
                    </div>
                    <div className="text-xs text-white/50 mt-1">Prix au m²</div>
                  </PremiumCard>
                </div>
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sections.find(s => s.id === 'market')?.items.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="backdrop-blur-xl bg-white/[0.02] border border-white/[0.08] rounded-xl p-4"
                      >
                        <div className="text-sm text-white/60 mb-2 truncate">{item.label}</div>
                        <div className="text-2xl font-bold text-green-400 break-words">{item.value}</div>
                        {item.hint && <div className="text-xs text-white/50 mt-2 line-clamp-2 break-words">{item.hint}</div>}
                      </motion.div>
                    ))}
                  </div>
                </PremiumCard>

                {/* Transactions récentes (DVF) */}
                {(() => {
                  const txSection = sections.find(s => s.id === 'market_transactions');
                  if (!txSection || !txSection.items || txSection.items.length === 0) return null;
                  return (
                    <PremiumCard className="p-6 md:p-8">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center flex-shrink-0">
                          <TrendingUp className="w-6 h-6 text-green-400" />
                        </div>
                        <div className="flex-1">
                          <h2 className="text-xl font-semibold mb-1">Transactions récentes (DVF)</h2>
                          <p className="text-sm text-white/60">Ventes comparables autour de l'adresse</p>
                        </div>
                      </div>
                      <div className="divide-y divide-white/10 rounded-xl border border-white/10">
                        {txSection.items.map((t, idx) => (
                          <div key={idx} className="flex flex-col gap-1 p-3">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-white/60 truncate max-w-[50%]">{t.label}</span>
                              <span className="ml-auto text-white font-medium truncate max-w-[50%] text-right">{String(t.value)}</span>
                            </div>
                            {t.hint && (
                              <div className="text-xs text-white/50 line-clamp-2 break-words">{t.hint}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </PremiumCard>
                  );
                })()}
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
