'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, AlertTriangle, CheckCircle, XCircle, 
      Home, MapPin, TrendingUp, Zap, Leaf, DollarSign, Activity,
      Info, ChevronRight, Download, Share2,
      AlertCircle, Clock, Users, FileText, Eye, Building2,
      School, ShoppingCart, Droplets, User, Phone, Globe, GraduationCap, BookOpen, Baby
} from 'lucide-react';
import type { ReportSection, AIVerification } from '@/types/report.types';
import { 
  LineChart, Line, BarChart, Bar, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, 
  Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, Area, AreaChart 
} from 'recharts';
import * as Tabs from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

// Import dynamique de la carte Leaflet pour éviter les erreurs SSR
const MapComponent = dynamic(() => import('./MapComponent'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-gray-200 rounded-xl animate-pulse flex items-center justify-center">
      <MapPin className="w-8 h-8 text-gray-400" />
    </div>
  )
});

interface ModernReportViewProps {
  sections: ReportSection[];
  houseInfo?: any;
  ai?: AIVerification;
  reportId?: string;
  pdfUrl?: string;
  score?: number;
  address?: string;
  gpsCoordinates?: { lat: number; lon: number };
}

// Couleurs du thème principal (adapté au thème purple/pink)
const colors = {
  primary: '#9333EA', // Purple
  secondary: '#EC4899', // Pink
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
  dark: '#1F2937',
  light: '#F9FAFB',
  gradient: 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)',
};

export default function ModernReportView({ 
  sections, 
  houseInfo, 
  ai, 
  reportId, 
  pdfUrl,
  score = 75,
  address = '',
  gpsCoordinates
}: ModernReportViewProps) {
  const [activeSection, setActiveSection] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [showAIModal, setShowAIModal] = useState(false);

  // Calculer le score global du bien
  const calculateHouseScore = (): number => {
    if (score) return score;
    
    let calculatedScore = 100;
    
    // 1. Pénalités basées sur les flags
    sections.forEach(section => {
      section.items.forEach(item => {
        if (item.flag === 'risk') calculatedScore -= 15;
        if (item.flag === 'warn') calculatedScore -= 5;
      });
    });
    
    // 2. Pénalités pour DPE mauvais
    const dpeSection = sections.find(s => s.id === 'energy');
    const dpeItem = dpeSection?.items.find(i => i.label.includes('Classe énergétique'));
    if (dpeItem) {
      const dpeClass = String(dpeItem.value);
      if (['E', 'F', 'G'].includes(dpeClass)) calculatedScore -= 20;
      else if (dpeClass === 'D') calculatedScore -= 10;
    }
    
    // 3. Pénalités pour risques élevés
    const risksSection = sections.find(s => s.id === 'risks');
    if (risksSection) {
      risksSection.items.forEach(item => {
        if (item.flag === 'risk') calculatedScore -= 10;
        if (item.flag === 'warn') calculatedScore -= 5;
      });
    }
    
    // 4. Bonus pour commodités
    const amenitiesSection = sections.find(s => s.id === 'amenities');
    if (amenitiesSection && amenitiesSection.items.length > 2) {
      calculatedScore += 3;
    }
    
    return Math.max(0, Math.min(100, calculatedScore));
  };

  const houseScore = calculateHouseScore();

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 1000);
    
    // Animation du score
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setAnimatedScore(prev => {
          if (prev >= houseScore) {
            clearInterval(interval);
            return houseScore;
          }
          return prev + 2;
        });
      }, 20);
    }, 500);

    return () => clearTimeout(timer);
  }, [houseScore]);

  // Données pour les graphiques
  const riskData = [
    { name: 'Localisation', value: 85, fullMark: 100 },
    { name: 'Risques', value: 92, fullMark: 100 },
    { name: 'Énergie', value: 78, fullMark: 100 },
    { name: 'Marché', value: 100, fullMark: 100 },
    { name: 'Commodités', value: 70, fullMark: 100 },
  ];

  // Générer l'évolution du prix basée sur les données du marché
  const generatePriceEvolution = () => {
    // 1. Chercher le prix dans l'analyse IA (prioritaire)
    const aiSection = sections.find(s => s.id === 'ai_market');
    const aiPriceItem = aiSection?.items.find(i => 
      i.label.includes('Prix/m²') || i.label.includes('Valeur estimée')
    );
    
    // 2. Chercher le prix dans les données DVF
    const marketSection = sections.find(s => s.id === 'market');
    const priceItem1y = marketSection?.items.find(i => i.label.includes('Prix/m² médian (1 an)'));
    const priceItem3y = marketSection?.items.find(i => i.label.includes('Prix/m² médian (3 ans)'));
    const priceItem = priceItem1y || priceItem3y;
    
    // 3. Extraire le prix/m²
    let pricePerM2: number | null = null;
    
    // Essayer d'abord l'analyse IA
    if (aiPriceItem && aiPriceItem.value) {
      const valueStr = String(aiPriceItem.value).trim();
      // Extraire le nombre (peut être "3500€/m²" ou "3 500 €/m²")
      const match = valueStr.match(/[\d\s]+/);
      if (match) {
        const num = parseFloat(match[0].replace(/\s/g, ''));
        if (num > 500 && num < 50000) { // Prix/m² réaliste entre 500€ et 50000€
          pricePerM2 = num;
        }
      }
    }
    
    // Sinon, utiliser les données DVF
    if (!pricePerM2 && priceItem && priceItem.value) {
      const valueStr = String(priceItem.value).trim();
      // Extraire le nombre (format: "3 500 €/m²")
      const match = valueStr.match(/[\d\s]+/);
      if (match) {
        const num = parseFloat(match[0].replace(/\s/g, ''));
        if (num > 500 && num < 50000) {
          pricePerM2 = num;
        }
      }
    }
    
    // 4. Si pas de prix trouvé, utiliser une estimation par défaut basée sur la région
    // Prix/m² moyen en France: ~2500€/m² (variation selon région)
    if (!pricePerM2) {
      // Essayer de deviner la région depuis les sections
      const locationSection = sections.find(s => s.id === 'location');
      const regionItem = locationSection?.items.find(i => i.label.includes('Région'));
      const deptItem = locationSection?.items.find(i => i.label.includes('Département'));
      
      // Prix/m² par région (estimations moyennes)
      const regionPrices: Record<string, number> = {
        'Île-de-France': 4500,
        'Paris': 10000,
        'Provence-Alpes-Côte d\'Azur': 3500,
        'Auvergne-Rhône-Alpes': 2800,
        'Occitanie': 2500,
        'Nouvelle-Aquitaine': 2200,
        'Bretagne': 2300,
        'Normandie': 2000,
        'Hauts-de-France': 1800,
        'Grand Est': 1800,
        'Pays de la Loire': 2200,
        'Bourgogne-Franche-Comté': 1800,
        'Centre-Val de Loire': 2000,
        'Corse': 3000,
      };
      
      let estimatedPrice = 2500; // Par défaut
      
      if (regionItem && regionItem.value) {
        const region = String(regionItem.value);
        for (const [key, price] of Object.entries(regionPrices)) {
          if (region.includes(key)) {
            estimatedPrice = price;
            break;
          }
        }
      } else if (deptItem && deptItem.value) {
        const dept = String(deptItem.value);
        // Paris et petite couronne
        if (['75', '92', '93', '94'].includes(dept)) {
          estimatedPrice = 6000;
        } else if (['91', '77', '78', '95'].includes(dept)) {
          estimatedPrice = 3500;
        }
      }
      
      pricePerM2 = estimatedPrice;
    }
    
    // 5. Estimer la surface (si disponible dans les données, sinon utiliser une moyenne)
    let surfaceM2 = 100; // Surface moyenne par défaut (100m²)
    
    // Chercher la surface dans les sections
    const energySection = sections.find(s => s.id === 'energy');
    const surfaceItem = energySection?.items.find(i => i.label.includes('Surface'));
    if (surfaceItem && surfaceItem.value) {
      const surfaceStr = String(surfaceItem.value).trim();
      const match = surfaceStr.match(/(\d+)/);
      if (match) {
        const surface = parseFloat(match[1]);
        if (surface > 20 && surface < 500) {
          surfaceM2 = surface;
        }
      }
    }
    
    // 6. Calculer le prix total de la maison (prix/m² × surface)
    const basePrice = Math.round(pricePerM2 * surfaceM2);
    
    // 7. Évolution sur 6 mois
    const currentMonth = new Date().getMonth();
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sept', 'Oct', 'Nov', 'Déc'];
    
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      months.push(monthNames[monthIndex]);
    }
    
    // 8. Variation mensuelle basée sur la tendance du marché
    let monthlyVariation = 0.002; // 0.2% par mois par défaut (hausse légère)
    
    const trendItem = marketSection?.items.find(i => i.label.includes('Tendance'));
    if (trendItem && trendItem.value) {
      const trend = String(trendItem.value).toLowerCase();
      if (trend.includes('hausse')) {
        monthlyVariation = 0.005; // 0.5% par mois en hausse
      } else if (trend.includes('baisse')) {
        monthlyVariation = -0.003; // -0.3% par mois en baisse
      } else {
        monthlyVariation = 0.001; // 0.1% par mois stable
      }
    }
    
    // 9. Générer l'évolution (du plus ancien au plus récent)
    const evolution = months.map((month, index) => {
      // Calculer le prix il y a (5-index) mois
      const monthsAgo = 5 - index;
      const variationFactor = 1 + (monthlyVariation * monthsAgo);
      const price = Math.round(basePrice / variationFactor);
      return {
        month,
        value: price
      };
    });
    
    return evolution;
  };

  const priceEvolution = generatePriceEvolution();

  // Extraire les coordonnées GPS depuis les sections si non fournies
  const getGPSCoordinates = (): { lat: number; lon: number } | undefined => {
    if (gpsCoordinates) return gpsCoordinates;
    
    // Chercher dans les sections
    const locationSection = sections.find(s => s.id === 'location');
    const gpsItem = locationSection?.items.find(i => i.label.includes('Coordonnées GPS'));
    
    if (gpsItem && typeof gpsItem.value === 'string') {
      const match = gpsItem.value.match(/([\d.]+),\s*([\d.]+)/);
      if (match) {
        return {
          lat: parseFloat(match[1]),
          lon: parseFloat(match[2])
        };
      }
    }
    
    return undefined;
  };

  const finalGPSCoordinates = getGPSCoordinates();

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981'; // Vert
    if (score >= 60) return '#F59E0B'; // Orange
    return '#EF4444'; // Rouge
  };

  const getIconForSection = (sectionId: string) => {
    const icons: Record<string, any> = {
      location: MapPin,
      risks: Shield,
      energy: Zap,
      market: DollarSign,
      urbanism: Building2,
      education: School,
      amenities: ShoppingCart,
      air_quality: Droplets,
      safety: AlertCircle,
      pappers: User,
      pappers_cadastral: MapPin,
      pappers_owner: User,
      pappers_transactions: TrendingUp,
      pappers_building: Building2,
      pappers_dpe: Zap,
      pappers_copropriete: Home,
      pappers_occupants: Users,
      pappers_permis: FileText,
      pappers_fonds_commerce: ShoppingCart,
      recommendations: Activity,
      meta: FileText,
    };
    
    // Si c'est une section Pappers avec un index (ex: pappers_owner_0)
    if (sectionId.startsWith('pappers_owner_')) return User;
    if (sectionId.startsWith('pappers_building_')) return Building2;
    if (sectionId.startsWith('pappers_dpe_')) return Zap;
    if (sectionId.startsWith('pappers_copropriete_')) return Home;
    
    return icons[sectionId] || Info;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 pb-20 lg:pb-0">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-white shadow-xl"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-10" />
        
        <div className="relative max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Mobile */}
            <div className="flex sm:hidden flex-col items-center gap-4">
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent text-center"
              >
                Analyse Immobilière
              </motion.h1>
              
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl font-semibold text-gray-700 -mt-2 text-center"
              >
                {address || 'Bien immobilier'}
              </motion.h2>
              
              {/* Score */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 100, delay: 0.5 }}
                className="relative cursor-pointer group"
                onClick={() => setShowAIModal(true)}
              >
                <div className="relative w-36 h-36 group-hover:scale-105 transition-transform duration-300">
                  <div 
                    className="absolute inset-0 rounded-full blur-xl opacity-30"
                    style={{ backgroundColor: getScoreColor(animatedScore) }}
                  />
                  
                  <div className="relative w-full h-full rounded-full bg-gradient-to-br from-white to-gray-50 shadow-2xl border-4 border-white/50 flex flex-col items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent" />
                    
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1, type: "spring" }}
                      className="relative z-10 flex flex-col items-center"
                    >
                      <div 
                        className="text-4xl font-black tracking-tight"
                        style={{ 
                          backgroundImage: `linear-gradient(135deg, ${getScoreColor(animatedScore)} 0%, ${getScoreColor(animatedScore)}dd 100%)`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }}
                      >
                        {animatedScore}
                      </div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        /100
                      </div>
                    </motion.div>
                    
                    <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                      <circle cx="50%" cy="50%" r="45%" stroke="#E5E7EB" strokeWidth="3" fill="none" opacity="0.3" />
                      <motion.circle
                        cx="50%" cy="50%" r="45%"
                        stroke={getScoreColor(animatedScore)}
                        strokeWidth="3" fill="none" strokeLinecap="round"
                        strokeDasharray={`${animatedScore * 2.83} 283`}
                        initial={{ strokeDasharray: "0 283" }}
                        animate={{ strokeDasharray: `${animatedScore * 2.83} 283` }}
                        transition={{ duration: 2, ease: "easeOut" }}
                        style={{ filter: 'drop-shadow(0 0 6px currentColor)' }}
                      />
                    </svg>
                  </div>
                </div>
                
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.5, type: "spring" }}
                  className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg"
                  style={{ backgroundColor: getScoreColor(animatedScore) }}
                >
                  {animatedScore >= 80 ? '🌟 Excellent' : animatedScore >= 60 ? '✓ Bon' : '⚠ À vérifier'}
                </motion.div>
              </motion.div>

              {/* Cartes caractéristiques mobile */}
              <div className="grid grid-cols-2 gap-3 w-full px-4 mt-6">
                {/* DPE */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-shadow border border-gray-100"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-50 mb-3">
                    <Zap className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-xs text-gray-500 font-medium mb-1">DPE</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {(() => {
                      const dpeSection = sections.find(s => s.id === 'energy');
                      const dpeItem = dpeSection?.items.find(i => 
                        i.label.includes('Classe énergétique') || i.label.includes('DPE')
                      );
                      if (dpeItem && dpeItem.value) {
                        const value = String(dpeItem.value).trim();
                        return value || '—';
                      }
                      return '—';
                    })()}
                  </div>
                </motion.div>

                {/* Prix/m² */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.95 }}
                  className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-shadow border border-gray-100"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-50 mb-3">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-xs text-gray-500 font-medium mb-1">Prix/m²</div>
                  <div className="text-lg font-bold text-gray-900 leading-tight">
                    {(() => {
                      const marketSection = sections.find(s => s.id === 'market');
                      const priceItem = marketSection?.items.find(i => 
                        i.label.includes('Prix/m²') || i.label.includes('prix')
                      );
                      if (priceItem && priceItem.value) {
                        const priceStr = String(priceItem.value).trim();
                        // Extraire le nombre avec ou sans €
                        const match = priceStr.match(/[\d\s]+/);
                        if (match) {
                          const num = match[0].replace(/\s/g, '');
                          return num + ' €';
                        }
                        return priceStr.split('€')[0].trim() + ' €';
                      }
                      return '—';
                    })()}
                  </div>
                </motion.div>

                {/* Écoles */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.05 }}
                  className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-shadow border border-gray-100"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-50 mb-3">
                    <School className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="text-xs text-gray-500 font-medium mb-1">Écoles</div>
                  <div className="text-lg font-bold text-gray-900 leading-tight">
                    {(() => {
                      const educationSection = sections.find(s => s.id === 'education');
                      const schoolItem = educationSection?.items.find(i => 
                        i.label.includes('Nombre') || i.label.includes('école')
                      );
                      if (schoolItem && schoolItem.value) {
                        const value = String(schoolItem.value).trim();
                        // Extraire le nombre
                        const count = value.match(/\d+/);
                        if (count && count[0]) {
                          return count[0];
                        }
                        return '—';
                      }
                      return '—';
                    })()}
                  </div>
                </motion.div>
              </div>
            </div>
            
            {/* Desktop: Score + infos */}
            <div className="hidden sm:block order-first lg:order-last">
              <div className="hidden sm:flex flex-row items-center justify-center gap-6 lg:gap-8">
                {/* Score */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 100, delay: 0.5 }}
                  className="relative cursor-pointer group"
                  onClick={() => setShowAIModal(true)}
                >
                  <div className="relative w-40 h-40 lg:w-48 lg:h-48 group-hover:scale-105 transition-transform duration-300">
                    <div 
                      className="absolute inset-0 rounded-full blur-2xl opacity-30"
                      style={{ backgroundColor: getScoreColor(animatedScore) }}
                    />
                    
                    <div className="relative w-full h-full rounded-full bg-gradient-to-br from-white to-gray-50 shadow-2xl border-4 border-white/50 flex flex-col items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent" />
                      
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1, type: "spring" }}
                        className="relative z-10 flex flex-col items-center"
                      >
                        <div 
                          className="text-5xl lg:text-6xl font-black tracking-tight"
                          style={{ 
                            backgroundImage: `linear-gradient(135deg, ${getScoreColor(animatedScore)} 0%, ${getScoreColor(animatedScore)}dd 100%)`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                          }}
                        >
                          {animatedScore}
                        </div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">
                          /100
                        </div>
                      </motion.div>
                      
                      <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                        <circle
                          cx="50%"
                          cy="50%"
                          r="45%"
                          stroke="#E5E7EB"
                          strokeWidth="3"
                          fill="none"
                          opacity="0.3"
                        />
                        <motion.circle
                          cx="50%"
                          cy="50%"
                          r="45%"
                          stroke={getScoreColor(animatedScore)}
                          strokeWidth="3"
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={`${animatedScore * 2.83} 283`}
                          initial={{ strokeDasharray: "0 283" }}
                          animate={{ strokeDasharray: `${animatedScore * 2.83} 283` }}
                          transition={{ duration: 2, ease: "easeOut" }}
                          style={{ filter: 'drop-shadow(0 0 8px currentColor)' }}
                        />
                      </svg>
                    </div>
                  </div>
                  
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.5, type: "spring" }}
                    className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white shadow-lg"
                    style={{ backgroundColor: getScoreColor(animatedScore) }}
                  >
                    {animatedScore >= 80 ? '🌟 Excellent' : animatedScore >= 60 ? '✓ Bon' : '⚠ À vérifier'}
                  </motion.div>
                </motion.div>
              </div>
            </div>

            {/* Info bien (desktop) */}
            <div className="hidden sm:block lg:col-span-2">
              <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
                {/* Détails */}
                <div className="flex-1">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-1">
                      Analyse Immobilière
                    </h1>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-700 mb-6">
                      {address || 'Bien immobilier'}
                    </h2>

                    {/* Grid infos */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                      {/* DPE */}
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-shadow border border-gray-100"
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-50 mb-3">
                          <Zap className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="text-xs text-gray-500 font-medium mb-1">DPE</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {(() => {
                            const dpeSection = sections.find(s => s.id === 'energy');
                            const dpeItem = dpeSection?.items.find(i => 
                              i.label.includes('Classe énergétique') || i.label.includes('DPE')
                            );
                            if (dpeItem && dpeItem.value) {
                              const value = String(dpeItem.value).trim();
                              return value || '—';
                            }
                            return '—';
                          })()}
                        </div>
                      </motion.div>

                      {/* Prix/m² */}
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-shadow border border-gray-100"
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-50 mb-3">
                          <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="text-xs text-gray-500 font-medium mb-1">Prix/m²</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {(() => {
                            const marketSection = sections.find(s => s.id === 'market');
                            const priceItem = marketSection?.items.find(i => 
                              i.label.includes('Prix/m²') || i.label.includes('prix')
                            );
                            if (priceItem && priceItem.value) {
                              const priceStr = String(priceItem.value).trim();
                              // Extraire le nombre avec ou sans €
                              const match = priceStr.match(/[\d\s]+/);
                              if (match) {
                                const num = match[0].replace(/\s/g, '');
                                return num + ' €';
                              }
                              return priceStr.split('€')[0].trim() + ' €';
                            }
                            return '—';
                          })()}
                        </div>
                      </motion.div>

                      {/* Écoles */}
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45 }}
                        className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-shadow border border-gray-100"
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-50 mb-3">
                          <School className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div className="text-xs text-gray-500 font-medium mb-1">Écoles</div>
                        <div className="text-lg font-bold text-gray-900 leading-tight">
                          {(() => {
                            const educationSection = sections.find(s => s.id === 'education');
                            const schoolItem = educationSection?.items.find(i => 
                              i.label.includes('Nombre') || i.label.includes('école')
                            );
                            if (schoolItem && schoolItem.value) {
                              const value = String(schoolItem.value).trim();
                              // Extraire le nombre
                              const count = value.match(/\d+/);
                              if (count && count[0]) {
                                return count[0];
                              }
                              return '—';
                            }
                            return '—';
                          })()}
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Badges d'état */}
              <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap mt-4">
                {sections.find(s => s.id === 'recommendations')?.items.slice(0, 3).map((item, idx) => {
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + idx * 0.1 }}
                      className={cn(
                        "px-3 py-1.5 sm:px-4 sm:py-2 rounded-full flex items-center gap-1.5 sm:gap-2 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0",
                        item.flag === 'ok' ? "bg-green-100 text-green-700" :
                        item.flag === 'warn' ? "bg-yellow-100 text-yellow-700" :
                        item.flag === 'risk' ? "bg-red-100 text-red-700" :
                        "bg-gray-100 text-gray-600"
                      )}
                    >
                      {item.flag === 'ok' ? <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> :
                       item.flag === 'warn' ? <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> :
                       item.flag === 'risk' ? <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> :
                       <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                      <span className="truncate max-w-[150px] sm:max-w-none">{item.label}</span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Carte de localisation */}
          {finalGPSCoordinates && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-6 lg:mt-8"
            >
              <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                  Localisation du bien
                </h3>
                <div className="w-full h-64 sm:h-80 lg:h-96 rounded-xl overflow-hidden border-2 border-purple-200">
                  <MapComponent
                    lat={finalGPSCoordinates.lat}
                    lon={finalGPSCoordinates.lon}
                    address={address}
                    zoom={15}
                  />
                </div>
                {address && (
                  <p className="text-sm text-gray-600 mt-3 text-center">
                    📍 {address}
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Boutons d'action - Desktop */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="hidden lg:flex gap-3 mt-6"
          >
            {reportId && (
              <>
                {pdfUrl && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.open(pdfUrl, '_blank')}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-normal transition-colors duration-200 flex items-center gap-2 text-sm"
                  >
                    <Download className="h-4 w-4" />
                    <span>Télécharger le PDF</span>
                  </motion.button>
                )}
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(event) => {
                    const url = window.location.href;
                    if (navigator.share) {
                      navigator.share({
                        title: "Rapport immobilière PDF",
                        text: "Téléchargez ce rapport complet d'analyse immobilière en PDF",
                        url: url,
                      });
                    } else {
                      navigator.clipboard.writeText(url);
                      const button = event.currentTarget as HTMLButtonElement;
                      const span = button.querySelector('span');
                      const originalText = span?.textContent;
                      if (span) span.textContent = 'Copié !';
                      setTimeout(() => {
                        if (span) span.textContent = originalText || 'Partager';
                      }, 2000);
                    }
                  }}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md font-normal transition-colors duration-200 flex items-center gap-2 text-sm"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Partager</span>
                </motion.button>
              </>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Contenu principal avec onglets */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <Tabs.Root value={activeSection} onValueChange={setActiveSection} className="w-full">
          {/* Liste d'onglets */}
          <div className="relative -mx-4 sm:mx-0">
            <Tabs.List className="flex gap-1.5 sm:gap-2 mb-6 sm:mb-8 overflow-x-auto pb-2 px-4 sm:px-0 scrollbar-hide">
              <Tabs.Trigger
                value="overview"
                className={cn(
                  "px-3 py-2 sm:px-4 rounded-lg font-medium whitespace-nowrap transition-all flex-shrink-0 text-sm sm:text-base",
                  "active:scale-95 touch-manipulation",
                  activeSection === 'overview' 
                    ? "bg-purple-600 text-white shadow-lg" 
                    : "bg-white text-gray-600 border border-gray-200"
                )}
              >
                <Eye className="w-4 h-4 inline mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">Vue d'ensemble</span>
                <span className="sm:hidden">Général</span>
              </Tabs.Trigger>
              
              {sections.map((section) => {
                const Icon = getIconForSection(section.id);
                const mobileTitle = section.title.split(' ')[0];
                return (
                  <Tabs.Trigger
                    key={section.id}
                    value={section.id}
                    className={cn(
                      "px-3 py-2 sm:px-4 rounded-lg font-medium whitespace-nowrap transition-all flex-shrink-0 text-sm sm:text-base",
                      "active:scale-95 touch-manipulation",
                      activeSection === section.id 
                        ? "bg-purple-600 text-white shadow-lg" 
                        : "bg-white text-gray-600 border border-gray-200"
                    )}
                  >
                    <Icon className="w-4 h-4 inline mr-1.5 sm:mr-2" />
                    <span className="hidden sm:inline">{section.title}</span>
                    <span className="sm:hidden">{mobileTitle}</span>
                  </Tabs.Trigger>
                );
              })}
            </Tabs.List>
          </div>

          {/* Vue d'ensemble avec graphiques */}
          <AnimatePresence mode="wait">
            <Tabs.Content value="overview">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                {/* Radar d'évaluation */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6"
                >
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                    Évaluation globale
                  </h3>
                  <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                    <RadarChart data={riskData}>
                      <PolarGrid stroke="#E5E7EB" />
                      <PolarAngleAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 10 }} className="text-xs sm:text-sm" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 10 }} />
                      <Radar
                        name="Score"
                        dataKey="value"
                        stroke="#9333EA"
                        fill="#9333EA"
                        fillOpacity={0.6}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </motion.div>

                {/* Évolution de la valeur */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6"
                >
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                    Évolution du marché
                  </h3>
                  <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                    <AreaChart data={priceEvolution}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="month" tick={{ fill: '#6B7280' }} />
                      <YAxis 
                        tick={{ fill: '#6B7280' }} 
                        tickFormatter={(value) => {
                          if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M€`;
                          if (value >= 1000) return `${(value / 1000).toFixed(0)}k€`;
                          return `${value}€`;
                        }}
                      />
                      <Tooltip 
                        formatter={(value: number) => {
                          const formatted = new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: 'EUR',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                          }).format(value);
                          return formatted;
                        }}
                        labelFormatter={(label) => `Mois: ${label}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#10B981"
                        fillOpacity={1}
                        fill="url(#colorValue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </motion.div>

                {/* Résumé IA */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 text-white lg:col-span-2"
                >
                  <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                    Analyse complète
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                    {/* Risque général */}
                    <div className="bg-white/20 backdrop-blur rounded-lg sm:rounded-xl p-3 sm:p-4">
                      <div className="text-white/80 text-xs sm:text-sm mb-1">Risque général</div>
                      <div className="text-lg sm:text-xl font-bold capitalize">
                        {(() => {
                          const score = houseScore;
                          if (score >= 80) return '✅ Faible';
                          if (score >= 60) return '⚠️ Moyen';
                          return '❌ Élevé';
                        })()}
                      </div>
                    </div>
                    
                    {/* Valeur estimée */}
                    <div className="bg-white/20 backdrop-blur rounded-lg sm:rounded-xl p-3 sm:p-4">
                      <div className="text-white/80 text-xs sm:text-sm mb-1">Prix/m² médian</div>
                      <div className="text-base sm:text-xl font-bold break-words">
                        {(() => {
                          const marketSection = sections.find(s => s.id === 'market');
                          const priceItem = marketSection?.items.find(i => i.label.includes('Prix/m² médian'));
                          return priceItem ? String(priceItem.value) : 'Non disponible';
                        })()}
                      </div>
                    </div>
                    
                    {/* Score global */}
                    <div className="bg-white/20 backdrop-blur rounded-lg sm:rounded-xl p-3 sm:p-4 sm:col-span-2 md:col-span-1">
                      <div className="text-white/80 text-xs sm:text-sm mb-1">Score global</div>
                      <div className="text-lg sm:text-xl font-bold">
                        {houseScore}/100
                      </div>
                    </div>
                  </div>
                  
                  {/* Analyse IA Dynamique */}
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <div className="text-white/80 text-xs sm:text-sm mb-3 font-semibold flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Analyse détaillée du bien
                    </div>
                    <div className="max-h-48 sm:max-h-64 overflow-y-auto bg-white/10 rounded-lg p-3 sm:p-4 space-y-3">
                      {(() => {
                        const score = houseScore;
                        const recommendationsSection = sections.find(s => s.id === 'recommendations');
                        
                        return (
                          <>
                            {/* État général */}
                            <div>
                              <h5 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                {score >= 80 ? '✅' : score >= 60 ? '⚠️' : '❌'} État Général
                              </h5>
                              <p className="text-xs text-white/90 leading-relaxed">
                                {score >= 80 
                                  ? "Ce bien présente un excellent profil. Les données analysées indiquent peu de risques potentiels."
                                  : score >= 60
                                  ? "Le bien est dans un état correct mais nécessite une attention particulière sur certains points."
                                  : "Plusieurs éléments nécessitent une vérification approfondie avant l'achat."}
                              </p>
                            </div>

                            {/* Points forts */}
                            {score >= 60 && (
                              <div>
                                <h5 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                  💪 Points Forts
                                </h5>
                                <div className="space-y-1 text-xs text-white/85">
                                  {sections.find(s => s.id === 'connectivity')?.items.find(i => i.value?.toString().includes('Disponible')) && (
                                    <div className="flex items-start gap-2">
                                      <span className="text-white/60">•</span>
                                      <span>Fibre optique disponible</span>
                                    </div>
                                  )}
                                  {sections.find(s => s.id === 'education') && (
                                    <div className="flex items-start gap-2">
                                      <span className="text-white/60">•</span>
                                      <span>Écoles à proximité</span>
                                    </div>
                                  )}
                                  {score >= 80 && (
                                    <div className="flex items-start gap-2">
                                      <span className="text-white/60">•</span>
                                      <span>Aucun point critique détecté</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Points d'attention */}
                            {score < 80 && (
                              <div>
                                <h5 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                  ⚠️ Points d'Attention
                                </h5>
                                <div className="space-y-1 text-xs text-white/85">
                                  {sections.find(s => s.id === 'energy')?.items.find(i => ['E', 'F', 'G'].includes(String(i.value))) && (
                                    <div className="flex items-start gap-2">
                                      <span className="text-white/60">•</span>
                                      <span>DPE défavorable - prévoir travaux d'isolation</span>
                                    </div>
                                  )}
                                  {sections.find(s => s.id === 'risks')?.items.some(i => i.flag === 'risk') && (
                                    <div className="flex items-start gap-2">
                                      <span className="text-white/60">•</span>
                                      <span>Risques naturels à vérifier (inondation, sismicité)</span>
                                    </div>
                                  )}
                                  {score < 60 && (
                                    <div className="flex items-start gap-2">
                                      <span className="text-white/60">•</span>
                                      <span>Inspection professionnelle fortement recommandée</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Recommandations */}
                            <div>
                              <h5 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                💡 Recommandations
                              </h5>
                              <div className="space-y-1 text-xs text-white/85">
                                {recommendationsSection?.items.slice(0, 3).map((item, idx) => (
                                  <div key={idx} className="flex items-start gap-2">
                                    <span className="text-white/60">•</span>
                                    <span>{item.label}: {item.value}</span>
                                  </div>
                                ))}
                                {(!recommendationsSection || recommendationsSection.items.length === 0) && (
                                  <>
                                    <div className="flex items-start gap-2">
                                      <span className="text-white/60">•</span>
                                      <span>Effectuer une visite complète du bien</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <span className="text-white/60">•</span>
                                      <span>Consulter les documents PLU avant travaux</span>
                                    </div>
                                    {score < 70 && (
                                      <div className="flex items-start gap-2">
                                        <span className="text-white/60">•</span>
                                        <span>Négocier le prix en fonction des points à vérifier</span>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    <div className="text-white/60 text-xs mt-2 text-center">
                      <span className="inline-flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        Faites défiler pour voir toute l'analyse
                      </span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </Tabs.Content>

            {/* Contenu des sections */}
            {sections.map((section) => (
              <Tabs.Content key={section.id} value={section.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-2xl shadow-xl p-4 sm:p-6"
                >
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                    {React.createElement(getIconForSection(section.id), { 
                      className: "w-6 h-6 text-purple-600" 
                    })}
                    {section.title}
                  </h2>

                  {/* Section spécialisée pour les commerces de proximité */}
                  {section.id === 'amenities' && section.notes && Array.isArray(section.notes) && section.notes.length > 0 && typeof section.notes[0] === 'object' ? (
                    <>
                      {/* Statistiques */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                        {section.items.map((item, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className={cn(
                              "p-4 rounded-xl border transition-all hover:shadow-md",
                              item.flag === 'ok' ? "border-green-200 bg-green-50/50" :
                              item.flag === 'warn' ? "border-yellow-200 bg-yellow-50/50" :
                              item.flag === 'risk' ? "border-red-200 bg-red-50/50" :
                              "border-gray-200 bg-white"
                            )}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              {item.flag === 'ok' && <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />}
                              {item.flag === 'warn' && <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />}
                              {item.flag === 'risk' && <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />}
                              {!item.flag && <Info className="w-5 h-5 text-gray-600 flex-shrink-0" />}
                              <span className="text-sm font-medium text-gray-700">{item.label}</span>
                            </div>
                            <span className={cn(
                              "font-bold text-lg ml-7",
                              item.flag === 'ok' ? "text-green-700" :
                              item.flag === 'warn' ? "text-yellow-700" :
                              item.flag === 'risk' ? "text-red-700" :
                              "text-gray-900"
                            )}>
                              {String(item.value)}
                            </span>
                          </motion.div>
                        ))}
                      </div>

                      {/* Liste des commerces */}
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <ShoppingCart className="w-5 h-5 text-purple-600" />
                          Commerces et services à proximité
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(section.notes as any[]).map((amenity: any, idx: number) => {
                            // Icône selon le type de commerce
                            const getAmenityIcon = (type: string) => {
                              if (type === 'supermarket') return ShoppingCart;
                              if (type === 'transit') return Activity;
                              if (type === 'park') return Leaf;
                              return ShoppingCart;
                            };

                            // Couleur selon le type
                            const getAmenityColor = (type: string) => {
                              if (type === 'supermarket') return 'from-green-500 to-emerald-500';
                              if (type === 'transit') return 'from-blue-500 to-cyan-500';
                              if (type === 'park') return 'from-green-600 to-teal-600';
                              return 'from-gray-500 to-gray-600';
                            };

                            const AmenityIcon = getAmenityIcon(amenity.type);
                            const gradientColor = getAmenityColor(amenity.type);

                            return (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-white rounded-xl border-2 border-gray-200 hover:border-purple-300 transition-all hover:shadow-lg overflow-hidden flex flex-col"
                              >
                                {/* Contenu */}
                                <div className="p-4 flex-1 flex flex-col">
                                  <div className="flex items-start gap-4 mb-3">
                                    <div className={cn(
                                      "rounded-lg p-3 flex-shrink-0 bg-gradient-to-br",
                                      gradientColor
                                    )}>
                                      <AmenityIcon className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-bold text-gray-800 text-base sm:text-lg leading-tight break-words">{amenity.name || 'Commerce'}</h4>
                                      <div className="flex items-center gap-2 flex-wrap mt-1.5">
                                        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
                                          {amenity.category || amenity.type}
                                        </span>
                                        {amenity.transit_type && (
                                          <span className="text-xs text-gray-600 bg-blue-100 px-2 py-0.5 rounded-full font-medium">
                                            {amenity.transit_type === 'station' ? 'Gare' : 
                                             amenity.transit_type === 'bus_station' ? 'Bus' :
                                             amenity.transit_type === 'subway_entrance' ? 'Métro' : amenity.transit_type}
                                          </span>
                                        )}
                                      </div>
                                      {/* Rating Google */}
                                      {amenity.rating !== undefined && amenity.rating !== null ? (
                                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                                          <div className="flex items-center gap-0.5">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                              <svg
                                                key={star}
                                                className={cn(
                                                  "w-4 h-4",
                                                  star <= Math.round(amenity.rating) 
                                                    ? "text-yellow-400 fill-current" 
                                                    : "text-gray-300"
                                                )}
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                              >
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                              </svg>
                                            ))}
                                          </div>
                                          <span className="text-sm font-semibold text-gray-700">
                                            {typeof amenity.rating === 'number' ? amenity.rating.toFixed(1) : amenity.rating}
                                          </span>
                                          {amenity.rating_count && (
                                            <span className="text-xs text-gray-500">
                                              ({amenity.rating_count} avis)
                                            </span>
                                          )}
                                          <div className="flex items-center gap-1 ml-1">
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                            </svg>
                                            <span className="text-xs text-gray-500 font-medium">Google</span>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-2 mt-2">
                                          <div className="flex items-center gap-1">
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                            </svg>
                                            <span className="text-xs text-gray-500 font-medium">Google</span>
                                          </div>
                                          <span className="text-xs text-gray-400 italic">Note non disponible</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="space-y-3 mt-2 text-sm">
                                    {/* Distance */}
                                    {amenity.distance_m && (
                                      <div className="flex items-center gap-2 text-gray-600">
                                        <MapPin className="w-4 h-4 text-purple-600 flex-shrink-0" />
                                        <span className="font-semibold text-purple-600">
                                          {Math.round(amenity.distance_m)} m
                                        </span>
                                        <span className="text-gray-500">de distance</span>
                                      </div>
                                    )}

                                    {/* Adresse */}
                                    {amenity.address && (
                                      <div className="flex items-start gap-2 text-gray-700">
                                        <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                          <div>{amenity.address}</div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Footer avec les actions */}
                                <div className="p-4 bg-gray-50 border-t border-gray-200 mt-auto">
                                  <div className="flex flex-wrap items-center justify-start gap-x-4 gap-y-2">
                                    {amenity.phone && (
                                      <a
                                        href={`tel:${amenity.phone}`}
                                        className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-purple-600 transition-colors font-medium"
                                      >
                                        <Phone className="w-4 h-4" />
                                        <span>Appeler</span>
                                      </a>
                                    )}
                                    {amenity.website && (
                                      <a
                                        href={amenity.website.startsWith('http') ? amenity.website : `https://${amenity.website}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-purple-600 transition-colors font-medium"
                                      >
                                        <Globe className="w-4 h-4" />
                                        <span>Site web</span>
                                      </a>
                                    )}
                                    {amenity.gps && (
                                      <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${amenity.gps.lat},${amenity.gps.lon}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-purple-600 transition-colors font-medium"
                                      >
                                        <MapPin className="w-4 h-4" />
                                        <span>Carte</span>
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  ) : section.id === 'education' && section.notes && Array.isArray(section.notes) && section.notes.length > 0 && typeof section.notes[0] === 'object' ? (
                    <>
                      {/* Statistiques */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                        {section.items.map((item, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className={cn(
                              "p-4 rounded-xl border transition-all hover:shadow-md",
                              item.flag === 'ok' ? "border-green-200 bg-green-50/50" :
                              item.flag === 'warn' ? "border-yellow-200 bg-yellow-50/50" :
                              item.flag === 'risk' ? "border-red-200 bg-red-50/50" :
                              "border-gray-200 bg-white"
                            )}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              {item.flag === 'ok' && <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />}
                              {item.flag === 'warn' && <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />}
                              {item.flag === 'risk' && <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />}
                              {!item.flag && <Info className="w-5 h-5 text-gray-600 flex-shrink-0" />}
                              <span className="text-sm font-medium text-gray-700">{item.label}</span>
                            </div>
                            <span className={cn(
                              "font-bold text-lg ml-7",
                              item.flag === 'ok' ? "text-green-700" :
                              item.flag === 'warn' ? "text-yellow-700" :
                              item.flag === 'risk' ? "text-red-700" :
                              "text-gray-900"
                            )}>
                              {String(item.value)}
                            </span>
                          </motion.div>
                        ))}
                      </div>

                      {/* Liste des écoles */}
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <GraduationCap className="w-5 h-5 text-purple-600" />
                          Établissements à proximité
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(section.notes as any[]).map((school: any, idx: number) => {
                            // Icône selon le type d'école
                            const getSchoolIcon = (kind: string) => {
                              const kindLower = (kind || '').toLowerCase();
                              if (kindLower.includes('maternelle')) return Baby;
                              if (kindLower.includes('élémentaire') || kindLower.includes('primaire')) return BookOpen;
                              if (kindLower.includes('collège')) return GraduationCap;
                              if (kindLower.includes('lycée')) return School;
                              return School;
                            };

                            // Couleur selon le type
                            const getSchoolColor = (kind: string) => {
                              const kindLower = (kind || '').toLowerCase();
                              if (kindLower.includes('maternelle')) return 'from-pink-500 to-rose-500';
                              if (kindLower.includes('élémentaire') || kindLower.includes('primaire')) return 'from-blue-500 to-cyan-500';
                              if (kindLower.includes('collège')) return 'from-purple-500 to-indigo-500';
                              if (kindLower.includes('lycée')) return 'from-green-500 to-emerald-500';
                              return 'from-gray-500 to-gray-600';
                            };

                            const SchoolIcon = getSchoolIcon(school.kind);
                            const gradientColor = getSchoolColor(school.kind);
                            const isPublic = school.public_private === 'public';

                            return (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-white rounded-xl border-2 border-gray-200 hover:border-purple-300 transition-all hover:shadow-lg overflow-hidden flex flex-col"
                              >
                                {/* Contenu */}
                                <div className="p-4 flex-1 flex flex-col">
                                  <div className="flex items-start gap-4 mb-3">
                                    <div className={cn(
                                      "rounded-lg p-3 flex-shrink-0 bg-gradient-to-br",
                                      gradientColor
                                    )}>
                                      <SchoolIcon className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-bold text-gray-800 text-base sm:text-lg leading-tight break-words">{school.name || 'École'}</h4>
                                      <div className="flex items-center gap-2 flex-wrap mt-1.5">
                                        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
                                          {school.kind || 'École'}
                                        </span>
                                        <span className={cn(
                                          "text-xs px-2 py-0.5 rounded-full font-medium",
                                          isPublic ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800"
                                        )}>
                                          {isPublic ? 'Public' : 'Privé'}
                                        </span>
                                      </div>
                                      {/* Rating Google */}
                                      {school.rating !== undefined && school.rating !== null ? (
                                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                                          <div className="flex items-center gap-0.5">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                              <svg
                                                key={star}
                                                className={cn(
                                                  "w-4 h-4",
                                                  star <= Math.round(school.rating) 
                                                    ? "text-yellow-400 fill-current" 
                                                    : "text-gray-300"
                                                )}
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                              >
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                              </svg>
                                            ))}
                                          </div>
                                          <span className="text-sm font-semibold text-gray-700">
                                            {typeof school.rating === 'number' ? school.rating.toFixed(1) : school.rating}
                                          </span>
                                          {school.rating_count && (
                                            <span className="text-xs text-gray-500">
                                              ({school.rating_count} avis)
                                            </span>
                                          )}
                                          <div className="flex items-center gap-1 ml-1">
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                            </svg>
                                            <span className="text-xs text-gray-500 font-medium">Google</span>
                                          </div>
                                        </div>
                                      ) : (
                                        // Si pas de rating, afficher quand même le logo Google avec "Note non disponible"
                                        <div className="flex items-center gap-2 mt-2">
                                          <div className="flex items-center gap-1">
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                            </svg>
                                            <span className="text-xs text-gray-500 font-medium">Google</span>
                                          </div>
                                          <span className="text-xs text-gray-400 italic">Note non disponible</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="space-y-3 mt-2 text-sm">
                                    {/* Distance */}
                                    {school.distance_m && (
                                      <div className="flex items-center gap-2 text-gray-600">
                                        <MapPin className="w-4 h-4 text-purple-600 flex-shrink-0" />
                                        <span className="font-semibold text-purple-600">
                                          {Math.round(school.distance_m)} m
                                        </span>
                                        <span className="text-gray-500">de distance</span>
                                      </div>
                                    )}

                                    {/* Adresse */}
                                    {(school.address || school.postcode || school.city) && (
                                      <div className="flex items-start gap-2 text-gray-700">
                                        <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                          {school.address && <div className="mb-1">{school.address}</div>}
                                          {(school.postcode || school.city) && (
                                            <div className="text-gray-500">
                                              {school.postcode && school.city 
                                                ? `${school.postcode} ${school.city}`
                                                : school.postcode || school.city
                                              }
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Footer avec les actions */}
                                <div className="p-4 bg-gray-50 border-t border-gray-200 mt-auto">
                                  <div className="flex flex-wrap items-center justify-start gap-x-4 gap-y-2">
                                    {school.phone && (
                                      <a
                                        href={`tel:${school.phone}`}
                                        className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-purple-600 transition-colors font-medium"
                                      >
                                        <Phone className="w-4 h-4" />
                                        <span>Appeler</span>
                                      </a>
                                    )}
                                    {school.website && (
                                      <a
                                        href={school.website.startsWith('http') ? school.website : `https://${school.website}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-purple-600 transition-colors font-medium"
                                      >
                                        <Globe className="w-4 h-4" />
                                        <span>Site web</span>
                                      </a>
                                    )}
                                    {school.gps && (
                                      <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${school.gps.lat},${school.gps.lon}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-purple-600 transition-colors font-medium"
                                      >
                                        <MapPin className="w-4 h-4" />
                                        <span>Carte</span>
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Affichage standard pour les autres sections */}
                      <div className="space-y-3">
                        {section.items.map((item, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={cn(
                              "p-4 rounded-xl border transition-all hover:shadow-md",
                              item.flag === 'ok' ? "border-green-200 bg-green-50/50" :
                              item.flag === 'warn' ? "border-yellow-200 bg-yellow-50/50" :
                              item.flag === 'risk' ? "border-red-200 bg-red-50/50" :
                              "border-gray-200 bg-white"
                            )}
                          >
                            {/* Ligne item */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                              {/* Label + icône */}
                              <div className="flex items-center gap-2 min-w-0">
                                {item.flag === 'ok' && <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />}
                                {item.flag === 'warn' && <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />}
                                {item.flag === 'risk' && <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />}
                                {!item.flag && <Info className="w-5 h-5 text-gray-600 flex-shrink-0" />}
                                <span className="text-sm sm:text-base font-medium text-gray-700 truncate">{item.label}</span>
                              </div>
                              
                              {/* Valeur */}
                              <span className={cn(
                                "font-bold text-base sm:text-lg ml-7 sm:ml-0 break-words",
                                item.flag === 'ok' ? "text-green-700" :
                                item.flag === 'warn' ? "text-yellow-700" :
                                item.flag === 'risk' ? "text-red-700" :
                                "text-gray-900"
                              )}>
                                {String(item.value)}
                              </span>
                            </div>
                            
                            {/* Hint */}
                            {item.hint && (
                              <p className="mt-3 text-xs sm:text-sm text-gray-600 pl-7 leading-relaxed">
                                {item.hint}
                              </p>
                            )}
                          </motion.div>
                        ))}
                      </div>

                      {/* Notes standard (si pas d'écoles) */}
                      {section.notes && section.notes.length > 0 && typeof section.notes[0] === 'string' && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                          className="mt-6 p-4 bg-purple-50 rounded-xl border-2 border-purple-200"
                        >
                          <h4 className="font-semibold text-purple-900 mb-2">Notes additionnelles :</h4>
                          <ul className="space-y-1">
                            {section.notes.map((note, idx) => (
                              <li key={idx} className="text-sm text-purple-700 flex items-start gap-2">
                                <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>{note}</span>
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </>
                  )}
                </motion.div>
              </Tabs.Content>
            ))}
          </AnimatePresence>
        </Tabs.Root>
      </div>

      {/* Footer mobile */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="px-4 py-2 flex gap-2">
          {reportId && (
            <>
              {pdfUrl && (
                <button
                  onClick={() => window.open(pdfUrl, '_blank')}
                  className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-normal flex items-center justify-center gap-1.5 touch-manipulation min-h-[40px] transition-colors duration-150 text-xs"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>PDF</span>
                </button>
              )}
              
              <button
                onClick={(event) => {
                  const url = window.location.href;
                  if (navigator.share) {
                    navigator.share({
                      title: "Rapport immobilière PDF",
                      text: "Téléchargez ce rapport complet d'analyse immobilière en PDF",
                      url: url,
                    });
                  } else {
                    navigator.clipboard.writeText(url);
                    const button = event.currentTarget as HTMLButtonElement;
                    const span = button.querySelector('span');
                    const originalText = span?.textContent;
                    if (span) span.textContent = 'Copié !';
                    setTimeout(() => {
                      if (span) span.textContent = originalText || 'Partager';
                    }, 2000);
                  }
                }}
                className="flex-1 px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md font-normal flex items-center justify-center gap-1.5 touch-manipulation min-h-[40px] transition-colors duration-150 text-xs"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>Partager</span>
              </button>
            </>
          )}
        </div>
      </motion.div>

      {/* Modale Analyse IA */}
      <AnimatePresence>
        {showAIModal && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAIModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            
            {/* Modale */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-4xl md:max-h-[90vh] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-6">
                <button
                  onClick={() => setShowAIModal(false)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
                
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Activity className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Analyse complète</h2>
                    <p className="text-purple-100 text-sm mt-1">Évaluation détaillée du bien</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Score principal */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">Score Global</h3>
                    <div className="flex items-center gap-2">
                      <div 
                        className="text-4xl font-black"
                        style={{ 
                          backgroundImage: `linear-gradient(135deg, ${getScoreColor(animatedScore)} 0%, ${getScoreColor(animatedScore)}dd 100%)`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }}
                      >
                        {animatedScore}
                      </div>
                      <span className="text-gray-500 text-lg">/100</span>
                    </div>
                  </div>
                  
                  <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${animatedScore}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{ backgroundColor: getScoreColor(animatedScore) }}
                    />
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-3">
                    {animatedScore >= 80 ? '✅ Excellent profil. Ce bien présente peu de risques.' :
                     animatedScore >= 60 ? '⚠️ Bon profil avec quelques points d\'attention à surveiller.' :
                     '❌ Profil nécessitant une attention particulière. Plusieurs points à vérifier.'}
                  </p>
                </div>

                {/* Analyse par catégorie */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Analyse Détaillée</h3>
                  
                  {sections.map((section, index) => {
                    const riskItems = section.items.filter(i => i.flag === 'risk');
                    const warnItems = section.items.filter(i => i.flag === 'warn');
                    const okItems = section.items.filter(i => i.flag === 'ok' || !i.flag);
                    
                    // Calcul intelligent du score par section
                    let sectionScore = 100 - (riskItems.length * 15 + warnItems.length * 5);
                    
                    // Ajustements spécifiques par type de section
                    if (section.id === 'energy') {
                      const dpeItem = section.items.find(i => i.label.includes('Classe énergétique'));
                      if (dpeItem) {
                        const dpeClass = String(dpeItem.value);
                        if (['E', 'F', 'G'].includes(dpeClass)) sectionScore -= 20;
                        else if (dpeClass === 'D') sectionScore -= 10;
                      }
                    }
                    
                    if (section.id === 'risks') {
                      riskItems.forEach(() => sectionScore -= 10);
                    }
                    
                    sectionScore = Math.max(0, Math.min(100, sectionScore));
                    
                    return (
                      <motion.div
                        key={section.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900">{section.title}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-700">{sectionScore}/100</span>
                            {sectionScore >= 80 ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : sectionScore >= 60 ? (
                              <AlertTriangle className="w-5 h-5 text-yellow-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-500" />
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {riskItems.length > 0 && (
                            <div className="flex items-start gap-2 text-sm">
                              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <span className="font-medium text-red-700">Risques détectés:</span>
                                <span className="text-gray-600 ml-1">{riskItems.map(i => i.label).join(', ')}</span>
                              </div>
                            </div>
                          )}
                          
                          {warnItems.length > 0 && (
                            <div className="flex items-start gap-2 text-sm">
                              <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <span className="font-medium text-yellow-700">Points d'attention:</span>
                                <span className="text-gray-600 ml-1">{warnItems.map(i => i.label).join(', ')}</span>
                              </div>
                            </div>
                          )}
                          
                          {okItems.length > 0 && riskItems.length === 0 && warnItems.length === 0 && (
                            <div className="flex items-start gap-2 text-sm">
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-600">Tous les éléments sont conformes</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Recommandations */}
                <div className="mt-8 bg-purple-50 rounded-xl p-6 border border-purple-200">
                  <div className="flex items-start gap-3">
                    <Info className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-purple-900 mb-2">Recommandations</h4>
                      <ul className="space-y-2 text-sm text-purple-800">
                        {animatedScore < 60 && (
                          <li>• Faire inspecter le bien par un professionnel avant l'achat</li>
                        )}
                        {sections.some(s => s.items.some(i => i.flag === 'risk')) && (
                          <li>• Vérifier en priorité les points signalés comme risques</li>
                        )}
                        <li>• Consulter les documents PLU avant tout projet de travaux</li>
                        <li>• Effectuer une visite approfondie du bien</li>
                        {animatedScore >= 80 && (
                          <li>• Ce bien semble être un bon choix, procédez aux vérifications d'usage</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                <button
                  onClick={() => setShowAIModal(false)}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Fermer l'analyse
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

