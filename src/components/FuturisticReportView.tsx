'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { 
  Shield, AlertTriangle, CheckCircle, XCircle,
  Home, MapPin, TrendingUp, Zap, Leaf, DollarSign, Activity,
  Info, ChevronRight, Download, Share2, Menu, X,
  AlertCircle, Clock, Users, FileText, Eye, Building2,
  School, ShoppingCart, Droplets, User, Phone, Globe, 
  GraduationCap, BookOpen, Baby, Sparkles, Cpu, 
  Gauge, Navigation, Calendar, Settings, Star, Heart,
  ChevronLeft, ChevronDown, ArrowRight, ExternalLink
} from 'lucide-react';
import type { ReportSection, AIVerification } from '@/types/report.types';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  Radar, ResponsiveContainer, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar
} from 'recharts';
import * as Tabs from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

// Types
interface FuturisticReportViewProps {
  sections: ReportSection[];
  vehicleInfo?: any;
  ai?: AIVerification;
  reportId: string;
  pdfUrl?: string;
}

// Composant de gauge circulaire animée
const CircularGauge: React.FC<{ value: number; label: string; color?: string }> = ({ 
  value, 
  label, 
  color = '#00ff88' 
}) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative w-32 h-32">
      {/* Effet de glow */}
      <div 
        className="absolute inset-0 rounded-full blur-xl opacity-50"
        style={{ backgroundColor: color }}
      />
      
      {/* SVG Gauge */}
      <svg className="w-full h-full transform -rotate-90">
        {/* Cercle de fond */}
        <circle
          cx="64"
          cy="64"
          r={radius}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="8"
          fill="none"
        />
        
        {/* Cercle de progression */}
        <motion.circle
          cx="64"
          cy="64"
          r={radius}
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      
      {/* Valeur centrale */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div 
          className="text-3xl font-bold text-white"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
        >
          {value}%
        </motion.div>
        <div className="text-xs text-gray-400 uppercase tracking-wider">{label}</div>
      </div>
    </div>
  );
};

// Composant de carte glassmorphism
const GlassCard: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  delay?: number;
  glow?: string;
}> = ({ children, className = "", delay = 0, glow }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className={cn(
        "relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6",
        "shadow-2xl shadow-black/20",
        className
      )}
    >
      {/* Effet de glow optionnel */}
      {glow && (
        <div 
          className="absolute -inset-0.5 rounded-2xl blur-xl opacity-30"
          style={{ background: glow }}
        />
      )}
      
      {/* Reflet supérieur */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      
      {/* Contenu */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

// Composant de badge néon
const NeonBadge: React.FC<{ 
  children: React.ReactNode; 
  color?: string;
  icon?: React.ReactNode;
}> = ({ children, color = '#00ff88', icon }) => {
  return (
    <div className="relative inline-flex items-center gap-2 px-4 py-2">
      {/* Effet de glow */}
      <div 
        className="absolute inset-0 rounded-full blur-lg opacity-50"
        style={{ backgroundColor: color }}
      />
      
      {/* Badge */}
      <div 
        className="relative flex items-center gap-2 px-4 py-2 rounded-full border"
        style={{ 
          borderColor: color,
          background: `linear-gradient(135deg, ${color}10, ${color}05)`
        }}
      >
        {icon && <span className="text-white">{icon}</span>}
        <span className="text-white font-medium text-sm">{children}</span>
      </div>
    </div>
  );
};

// Composant principal
export default function FuturisticReportView({
  sections,
  vehicleInfo,
  ai,
  reportId,
  pdfUrl
}: FuturisticReportViewProps) {
  const [activeSection, setActiveSection] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: containerRef });
  
  // Animation de la barre de progression
  const progressWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  
  // Couleurs néon thématiques
  const colors = {
    primary: '#00ff88',
    secondary: '#00d4ff',
    accent: '#ff00ff',
    warning: '#ffaa00',
    danger: '#ff0055',
    success: '#00ff88',
    info: '#00d4ff'
  };

  // Calcul du score global
  const calculateScore = () => {
    let score = 70; // Score de base
    
    sections.forEach(section => {
      section.items.forEach(item => {
        if (item.flag === 'ok') score += 5;
        if (item.flag === 'warn') score -= 2;
        if (item.flag === 'risk') score -= 10;
      });
    });
    
    return Math.max(0, Math.min(100, score));
  };

  const globalScore = calculateScore();

  // Navigation par sections
  const sectionNavigation = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: <Gauge className="w-4 h-4" /> },
    { id: 'location', label: 'Localisation', icon: <MapPin className="w-4 h-4" /> },
    { id: 'risks', label: 'Risques', icon: <Shield className="w-4 h-4" /> },
    { id: 'energy', label: 'Énergie', icon: <Zap className="w-4 h-4" /> },
    { id: 'market', label: 'Marché', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'education', label: 'Éducation', icon: <School className="w-4 h-4" /> },
    { id: 'amenities', label: 'Commodités', icon: <ShoppingCart className="w-4 h-4" /> },
    { id: 'ai', label: 'Analyse IA', icon: <Cpu className="w-4 h-4" /> }
  ];

  // Gestion du swipe sur mobile
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && activeSection < sectionNavigation.length - 1) {
      setActiveSection(activeSection + 1);
    }
    if (isRightSwipe && activeSection > 0) {
      setActiveSection(activeSection - 1);
    }
  };

  // Fonction de partage
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/report/interactive/${reportId}`;
    
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
      navigator.clipboard.writeText(shareUrl);
      alert('Lien copié dans le presse-papier !');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Fond animé */}
      <div className="fixed inset-0 z-0">
        {/* Gradient animé */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-cyan-900/20" />
        
        {/* Particules/étoiles */}
        <div className="stars absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0.2, 1, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Grille cyberpunk */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(${colors.primary}40 1px, transparent 1px),
              linear-gradient(90deg, ${colors.primary}40 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Header fixe */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/50 border-b border-white/10">
        {/* Barre de progression */}
        <motion.div 
          className="absolute top-0 left-0 h-0.5 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500"
          style={{ width: progressWidth }}
        />

        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo/Titre */}
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center"
              >
                <Home className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                  Rapport Immobilier
                </h1>
                <p className="text-xs text-gray-400">ID: {reportId}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Bouton partage */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShareMenuOpen(!shareMenuOpen)}
                className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </motion.button>

              {/* Bouton PDF */}
              {pdfUrl && (
                <motion.a
                  href={pdfUrl}
                  download
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <Download className="w-5 h-5" />
                </motion.a>
              )}

              {/* Menu burger mobile */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors lg:hidden"
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation mobile (menu burger) */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed right-0 top-16 bottom-0 w-80 z-40 backdrop-blur-xl bg-black/90 border-l border-white/10 lg:hidden"
          >
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4 text-cyan-400">Navigation</h3>
              <div className="space-y-2">
                {sectionNavigation.map((nav, index) => (
                  <motion.button
                    key={nav.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setActiveSection(index);
                      setMenuOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                      activeSection === index
                        ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/50"
                        : "bg-white/5 border border-white/10 hover:bg-white/10"
                    )}
                  >
                    <span className={cn(
                      activeSection === index ? "text-cyan-400" : "text-gray-400"
                    )}>
                      {nav.icon}
                    </span>
                    <span className={cn(
                      "font-medium",
                      activeSection === index ? "text-white" : "text-gray-300"
                    )}>
                      {nav.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contenu principal */}
      <main 
        ref={containerRef}
        className="relative z-10 pt-20 pb-24"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Navigation desktop (tabs) */}
          <div className="hidden lg:block mb-8">
            <div className="flex gap-2 p-2 backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10">
              {sectionNavigation.map((nav, index) => (
                <motion.button
                  key={nav.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveSection(index)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all",
                    activeSection === index
                      ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/50"
                      : "hover:bg-white/5"
                  )}
                >
                  <span className={cn(
                    activeSection === index ? "text-cyan-400" : "text-gray-400"
                  )}>
                    {nav.icon}
                  </span>
                  <span className={cn(
                    "font-medium text-sm",
                    activeSection === index ? "text-white" : "text-gray-300"
                  )}>
                    {nav.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Indicateur de section mobile */}
          <div className="flex justify-center gap-2 mb-6 lg:hidden">
            {sectionNavigation.map((_, index) => (
              <motion.div
                key={index}
                className={cn(
                  "h-1 rounded-full transition-all",
                  activeSection === index 
                    ? "w-8 bg-gradient-to-r from-cyan-400 to-purple-500" 
                    : "w-2 bg-white/20"
                )}
              />
            ))}
          </div>

          {/* Contenu des sections */}
          <AnimatePresence mode="wait">
            {activeSection === 0 && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Hero avec score global */}
                <GlassCard glow="linear-gradient(135deg, #00ff88, #00d4ff)">
                  <div className="text-center py-8">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.2 }}
                      className="inline-block mb-6"
                    >
                      <CircularGauge 
                        value={globalScore} 
                        label="Score Global"
                        color={globalScore > 70 ? colors.success : globalScore > 40 ? colors.warning : colors.danger}
                      />
                    </motion.div>
                    
                    <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                      Analyse Complète du Bien
                    </h2>
                    
                    <p className="text-gray-400 max-w-2xl mx-auto">
                      Découvrez tous les aspects de ce bien immobilier à travers notre analyse détaillée 
                      basée sur des données officielles et une intelligence artificielle avancée.
                    </p>

                    {/* Badges de statut */}
                    <div className="flex flex-wrap justify-center gap-3 mt-6">
                      <NeonBadge color={colors.success} icon={<CheckCircle className="w-4 h-4" />}>
                        Données vérifiées
                      </NeonBadge>
                      <NeonBadge color={colors.info} icon={<Sparkles className="w-4 h-4" />}>
                        Analyse IA
                      </NeonBadge>
                      <NeonBadge color={colors.accent} icon={<Calendar className="w-4 h-4" />}>
                        {new Date().toLocaleDateString('fr-FR')}
                      </NeonBadge>
                    </div>
                  </div>
                </GlassCard>

                {/* Grille de métriques clés */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Prix au m² */}
                  <GlassCard delay={0.1}>
                    <div className="flex items-center justify-between mb-2">
                      <DollarSign className="w-5 h-5 text-green-400" />
                      <span className="text-xs text-gray-400">Prix/m²</span>
                    </div>
                    <div className="text-2xl font-bold text-green-400">
                      {sections.find(s => s.id === 'market')?.items.find(i => i.label.includes('Prix'))?.value || 'N/A'}
                    </div>
                  </GlassCard>

                  {/* DPE */}
                  <GlassCard delay={0.2}>
                    <div className="flex items-center justify-between mb-2">
                      <Zap className="w-5 h-5 text-yellow-400" />
                      <span className="text-xs text-gray-400">DPE</span>
                    </div>
                    <div className="text-2xl font-bold text-yellow-400">
                      {sections.find(s => s.id === 'energy')?.items.find(i => i.label.includes('DPE'))?.value || 'N/A'}
                    </div>
                  </GlassCard>

                  {/* Risques */}
                  <GlassCard delay={0.3}>
                    <div className="flex items-center justify-between mb-2">
                      <Shield className="w-5 h-5 text-red-400" />
                      <span className="text-xs text-gray-400">Risques</span>
                    </div>
                    <div className="text-2xl font-bold text-red-400">
                      {sections.find(s => s.id === 'risks')?.items.filter(i => i.flag === 'risk').length || 0}
                    </div>
                  </GlassCard>

                  {/* Écoles */}
                  <GlassCard delay={0.4}>
                    <div className="flex items-center justify-between mb-2">
                      <School className="w-5 h-5 text-blue-400" />
                      <span className="text-xs text-gray-400">Écoles</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-400">
                      {sections.find(s => s.id === 'education')?.items.length || 0}
                    </div>
                  </GlassCard>
                </div>

                {/* Graphique radar des critères */}
                <GlassCard delay={0.5}>
                  <h3 className="text-lg font-bold mb-4 text-cyan-400">Analyse Multi-Critères</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={[
                      { subject: 'Prix', value: 75 },
                      { subject: 'Localisation', value: 85 },
                      { subject: 'Énergie', value: 60 },
                      { subject: 'Risques', value: 90 },
                      { subject: 'Commodités', value: 70 },
                      { subject: 'Éducation', value: 80 }
                    ]}>
                      <PolarGrid stroke="rgba(255,255,255,0.1)" />
                      <PolarAngleAxis dataKey="subject" stroke="rgba(255,255,255,0.5)" />
                      <PolarRadiusAxis stroke="rgba(255,255,255,0.1)" />
                      <Radar 
                        name="Score" 
                        dataKey="value" 
                        stroke="#00ff88" 
                        fill="#00ff88" 
                        fillOpacity={0.3} 
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </GlassCard>
              </motion.div>
            )}

            {activeSection === 1 && (
              <motion.div
                key="location"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Section Localisation */}
                <GlassCard glow="linear-gradient(135deg, #00d4ff, #0099ff)">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
                      <MapPin className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Localisation</h3>
                      <p className="text-sm text-gray-400">Informations géographiques</p>
                    </div>
                  </div>

                  {sections.find(s => s.id === 'location')?.items.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
                    >
                      <span className="text-gray-400">{item.label}</span>
                      <span className="text-white font-medium">{item.value}</span>
                    </motion.div>
                  ))}
                </GlassCard>
              </motion.div>
            )}

            {/* Section Risques */}
            {activeSection === 2 && (
              <motion.div
                key="risks"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <GlassCard glow="linear-gradient(135deg, #ff0055, #ff5500)">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30">
                      <Shield className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Risques</h3>
                      <p className="text-sm text-gray-400">Analyse des risques naturels et technologiques</p>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    {sections.find(s => s.id === 'risks')?.items.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={cn(
                          "p-4 rounded-xl border",
                          item.flag === 'risk' 
                            ? "bg-red-500/10 border-red-500/30" 
                            : item.flag === 'warn'
                            ? "bg-yellow-500/10 border-yellow-500/30"
                            : "bg-green-500/10 border-green-500/30"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          {item.flag === 'risk' && <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />}
                          {item.flag === 'warn' && <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />}
                          {item.flag === 'ok' && <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />}
                          <div className="flex-1">
                            <div className="font-medium text-white mb-1">{item.label}</div>
                            <div className="text-sm text-gray-400">{item.value}</div>
                            {item.hint && <div className="text-xs text-gray-500 mt-1">{item.hint}</div>}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {/* Section Énergie */}
            {activeSection === 3 && (
              <motion.div
                key="energy"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <GlassCard glow="linear-gradient(135deg, #ffaa00, #ff6600)">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
                      <Zap className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Performance Énergétique</h3>
                      <p className="text-sm text-gray-400">DPE et diagnostics</p>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    {sections.find(s => s.id === 'energy')?.items.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
                      >
                        <span className="text-gray-400">{item.label}</span>
                        <span className="text-white font-medium">{item.value}</span>
                      </motion.div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {/* Section Marché */}
            {activeSection === 4 && (
              <motion.div
                key="market"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <GlassCard glow="linear-gradient(135deg, #00ff88, #00aa55)">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
                      <TrendingUp className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Marché Immobilier</h3>
                      <p className="text-sm text-gray-400">Prix et tendances</p>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    {sections.find(s => s.id === 'market')?.items.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4"
                      >
                        <div className="text-sm text-gray-400 mb-1">{item.label}</div>
                        <div className="text-2xl font-bold text-green-400">{item.value}</div>
                        {item.hint && <div className="text-xs text-gray-500 mt-1">{item.hint}</div>}
                      </motion.div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {/* Section Éducation */}
            {activeSection === 5 && (
              <motion.div
                key="education"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <GlassCard glow="linear-gradient(135deg, #0099ff, #0066cc)">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30">
                      <School className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Éducation</h3>
                      <p className="text-sm text-gray-400">Établissements scolaires à proximité</p>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {sections.find(s => s.id === 'education')?.items.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300 text-sm">{item.label}</span>
                          <span className="text-white font-medium text-sm">{item.value}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {/* Section Commodités */}
            {activeSection === 6 && (
              <motion.div
                key="amenities"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <GlassCard glow="linear-gradient(135deg, #ff00ff, #aa00ff)">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                      <ShoppingCart className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Commodités</h3>
                      <p className="text-sm text-gray-400">Services et commerces</p>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {sections.find(s => s.id === 'amenities')?.items.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                      >
                        <span className="text-gray-400 text-sm">{item.label}</span>
                        <span className="text-white font-medium text-sm">{item.value}</span>
                      </motion.div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {/* Section Analyse IA */}
            {activeSection === 7 && ai && (
              <motion.div
                key="ai"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <GlassCard glow="linear-gradient(135deg, #00ffff, #ff00ff)">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30">
                      <Cpu className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Analyse par Intelligence Artificielle</h3>
                      <p className="text-sm text-gray-400">Synthèse et recommandations</p>
                    </div>
                  </div>

                  {/* Score IA */}
                  <div className="text-center mb-6">
                    <CircularGauge 
                      value={ai.score || 0} 
                      label="Score IA"
                      color={colors.info}
                    />
                  </div>

                  {/* Résumé */}
                  {ai.summary && (
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
                      <div className="text-sm text-gray-400 mb-2">Synthèse</div>
                      <div className="text-white leading-relaxed">{ai.summary}</div>
                    </div>
                  )}

                  {/* Recommandations */}
                  {ai.recommendations && ai.recommendations.length > 0 && (
                    <div>
                      <div className="text-sm text-gray-400 mb-3">Recommandations</div>
                      <div className="space-y-2">
                        {ai.recommendations.map((rec, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-start gap-3 backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-3"
                          >
                            <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-300">{rec}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Bouton flottant d'actions */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleShare}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 shadow-2xl shadow-purple-500/50 flex items-center justify-center"
        >
          <Share2 className="w-6 h-6 text-white" />
        </motion.button>
      </motion.div>
    </div>
  );
}
