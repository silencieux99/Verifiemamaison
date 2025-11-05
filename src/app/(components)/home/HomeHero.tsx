'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Container from '../Container';
import { motion } from 'framer-motion';
import TrustBadges from './TrustBadges';

/**
 * Composant Hero pour VerifieMaMaison
 * Affiche le message principal et un terminal animé style "verifiemamaison --analyse"
 */
interface ParticleStyle {
  width: number;
  height: number;
  left: string;
  top: string;
  animation: string;
  animationDelay: string;
}

interface AddressSuggestion {
  label: string;
  address: string;
  postalCode: string;
  city: string;
  coordinates?: {
    lat: number;
    lon: number;
  };
}

export default function HomeHero() {
  const router = useRouter();
  const [terminalText, setTerminalText] = useState('');
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [particles, setParticles] = useState<ParticleStyle[]>([]);
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Générer les particules uniquement côté client pour éviter l'erreur d'hydratation
  useEffect(() => {
    const particlesData: ParticleStyle[] = Array.from({ length: 50 }).map(() => ({
      width: Math.random() * 3 + 1,
      height: Math.random() * 3 + 1,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animation: `pulse-slow ${Math.random() * 3 + 2}s ease-in-out infinite`,
      animationDelay: `${Math.random() * 2}s`,
    }));
    setParticles(particlesData);
  }, []);

  useEffect(() => {
    const lines = [
      '$ verifiemamaison --analyse',
      '✓ Inspection de la charpente...',
      '✓ Analyse des installations...',
      '⚠️ 2 anomalies majeures détectées',
      '✓ Rapport généré avec succès'
    ];

    let currentLineIndex = 0;
    let currentCharIndex = 0;
    const interval = setInterval(() => {
      if (currentLineIndex < lines.length) {
        const currentLine = lines[currentLineIndex];
        if (currentCharIndex < currentLine.length) {
          setTerminalText(lines.slice(0, currentLineIndex).join('\n') + '\n' + currentLine.slice(0, currentCharIndex + 1));
          currentCharIndex++;
        } else {
          currentLineIndex++;
          currentCharIndex = 0;
          setTerminalLines(lines.slice(0, currentLineIndex));
          setTerminalText(lines.slice(0, currentLineIndex).join('\n'));
        }
      } else {
        clearInterval(interval);
      }
    }, 80);

    return () => clearInterval(interval);
  }, []);

  // Recherche d'adresses en temps réel
  useEffect(() => {
    const searchAddresses = async () => {
      if (address.length < 3) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`/api/address/search?q=${encodeURIComponent(address)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.features && data.features.length > 0) {
            const addressSuggestions: AddressSuggestion[] = data.features.slice(0, 5).map((feature: any) => ({
              label: feature.properties.label,
              address: feature.properties.name || feature.properties.housenumber || '',
              postalCode: feature.properties.postcode || '',
              city: feature.properties.city || '',
              coordinates: feature.geometry?.coordinates 
                ? {
                    lat: feature.geometry.coordinates[1],
                    lon: feature.geometry.coordinates[0],
                  }
                : undefined,
            }));
            setSuggestions(addressSuggestions);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        }
      } catch (error) {
        console.error('Erreur recherche adresse:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchAddresses, 300);
    return () => clearTimeout(debounceTimer);
  }, [address]);

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    setAddress(suggestion.address);
    setPostalCode(suggestion.postalCode);
    setCity(suggestion.city);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address || !postalCode || !city) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    // Validation basique
    if (postalCode.length !== 5 || !/^\d+$/.test(postalCode)) {
      setError('Le code postal doit contenir 5 chiffres');
      return;
    }

    setError(null);
    setShowSuggestions(false);
    
    // Rediriger vers la page d'analyse preview avec les paramètres
    router.push(`/analyse-preview?address=${encodeURIComponent(address)}&postalCode=${encodeURIComponent(postalCode)}&city=${encodeURIComponent(city)}`);
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-purple-50/30 to-gray-50 overflow-hidden pt-20 sm:pt-24 md:pt-28">
      {/* Gradient animé de fond */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-100/40 via-pink-100/40 to-purple-100/40 animate-gradient-shift"></div>
      
      {/* Grille de fond */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20"></div>
      
      {/* Particules de fond améliorées */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              ...particle,
              background: `radial-gradient(circle, rgba(${i % 2 === 0 ? '147, 51, 234' : '236, 72, 153'}, 0.15) 0%, transparent 70%)`,
              filter: 'blur(1px)',
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: parseFloat(particle.animation.split(' ')[1]),
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Orbes de lumière */}
      <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-purple-200 rounded-full blur-[128px] opacity-50 animate-pulse"></div>
      <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-pink-200 rounded-full blur-[128px] opacity-50 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <Container className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-5xl mx-auto px-4 sm:px-6"
        >
          {/* Badge d'introduction */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center mb-6"
          >
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 backdrop-blur-md px-4 py-2 rounded-full border border-purple-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600"></span>
              </span>
              <span className="text-sm text-purple-700 font-medium">IA Nouvelle Génération</span>
            </div>
          </motion.div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black mb-4 sm:mb-6 md:mb-8 leading-tight text-center">
            <motion.span 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="block bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-x"
            >
              Analysez votre bien
            </motion.span>
            <motion.span 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="block text-gray-900"
            >
              avant d'acheter
            </motion.span>
          </h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-700 mb-6 sm:mb-8 md:mb-12 max-w-3xl mx-auto leading-relaxed text-center"
          >
            Notre IA révolutionnaire analyse <span className="text-purple-600 font-semibold">127 points de contrôle</span> pour 
            détecter les vices cachés, estimer les travaux et vous protéger des mauvaises surprises.
          </motion.p>

          <TrustBadges />

          {/* Statistiques animées */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8 md:mb-12 max-w-2xl mx-auto"
          >
            <div className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1">
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">2.3M</span>
              </div>
              <div className="text-[10px] sm:text-xs md:text-sm text-gray-600">Biens analysés</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1">
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">98%</span>
              </div>
              <div className="text-[10px] sm:text-xs md:text-sm text-gray-600">Précision IA</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1">
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">45s</span>
              </div>
              <div className="text-[10px] sm:text-xs md:text-sm text-gray-600">Temps moyen</div>
            </div>
          </motion.div>

          {/* Formulaire ultra moderne */}
          <motion.form 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            onSubmit={handleSubmit} 
            className="w-full max-w-3xl mx-auto"
          >
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition duration-1000 hidden sm:block"></div>
              
              {/* Card principale */}
              <div className="relative bg-white/90 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-purple-200 p-4 sm:p-6 md:p-8 shadow-xl">
                {/* Header avec icône */}
                <div className="flex items-center justify-center mb-4 sm:mb-6 md:mb-8">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur-xl opacity-50 hidden sm:block"></div>
                    <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 p-2 sm:p-3 rounded-lg sm:rounded-xl">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Input principal d'adresse */}
                <div className="relative mb-4 sm:mb-6">
                  <label className="block text-sm sm:text-base font-medium text-purple-600 mb-2">
                    Adresse du bien
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg sm:rounded-xl blur opacity-0 group-hover:opacity-30 transition duration-300"></div>
                    <div className="relative">
                      <div className="relative">
                        <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-purple-600 z-10">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => {
                            setAddress(e.target.value);
                            setError(null);
                            setShowSuggestions(true);
                          }}
                          onFocus={() => {
                            if (suggestions.length > 0) {
                              setShowSuggestions(true);
                            }
                          }}
                          onBlur={() => {
                            setTimeout(() => setShowSuggestions(false), 200);
                          }}
                          placeholder="Tapez une adresse..."
                          className="w-full pl-9 sm:pl-12 pr-9 sm:pr-12 py-2.5 sm:py-3 md:py-4 bg-gray-50 border-2 border-gray-300 rounded-lg sm:rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:bg-white transition-all text-base sm:text-base md:text-lg"
                        />
                        {isSearching && (
                          <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-10">
                            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Suggestions améliorées */}
                  {showSuggestions && suggestions.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute z-50 w-full mt-2 bg-white/95 backdrop-blur-xl border border-purple-200 rounded-xl shadow-xl overflow-hidden"
                    >
                      {suggestions.map((suggestion, index) => (
                        <motion.button
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          type="button"
                          onClick={() => handleSelectSuggestion(suggestion)}
                          className="w-full text-left px-6 py-4 hover:bg-purple-50 transition-all duration-200 border-b border-gray-200 last:border-b-0 group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="text-purple-600 mt-0.5 group-hover:text-purple-700">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <div className="text-gray-900 font-medium group-hover:text-purple-700 transition-colors">
                                {suggestion.label}
                              </div>
                              {suggestion.postalCode && suggestion.city && (
                                <div className="text-sm text-gray-600 mt-0.5">
                                  {suggestion.postalCode} • {suggestion.city}
                                </div>
                              )}
                            </div>
                            <div className="text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </div>

                {/* Code postal et ville en grille moderne */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg sm:rounded-xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
                    <div className="relative">
                      <label className="block text-xs sm:text-sm font-medium text-purple-600 mb-1.5 sm:mb-2">
                        Code postal
                      </label>
                      <input
                        type="text"
                        value={postalCode}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                          setPostalCode(value);
                          setError(null);
                        }}
                        placeholder="75001"
                        maxLength={5}
                        className="w-full px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 bg-gray-50 border-2 border-gray-300 rounded-lg sm:rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:bg-white transition-all text-base sm:text-base"
                      />
                    </div>
                  </div>
                  
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg sm:rounded-xl blur opacity-0 group-hover:opacity-10 transition duration-300"></div>
                    <div className="relative">
                      <label className="block text-xs sm:text-sm font-medium text-purple-600 mb-1.5 sm:mb-2">
                        Ville
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => {
                          setCity(e.target.value);
                          setError(null);
                        }}
                        placeholder="Paris"
                        className="w-full px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 bg-gray-50 border-2 border-gray-300 rounded-lg sm:rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:bg-white transition-all text-base sm:text-base"
                      />
                    </div>
                  </div>
                </div>

                {/* Message d'erreur amélioré */}
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3"
                  >
                    <div className="text-red-600">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-sm text-red-700">{error}</p>
                  </motion.div>
                )}

                {/* Bouton CTA magnifique */}
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="relative group w-full overflow-hidden rounded-xl p-[2px] transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-[length:200%_100%] animate-gradient-x"></div>
                  <div className="relative flex items-center justify-center gap-2 sm:gap-3 rounded-lg sm:rounded-xl px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-5 transition-all duration-300">
                    <span className="text-base sm:text-lg md:text-xl font-bold text-white relative z-10">Analyser ce bien</span>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white transition-transform group-hover:translate-x-1 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </motion.button>

                {/* Trust badges */}
                <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Données sécurisées</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9.5H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                    </svg>
                    <span>Résultats instantanés</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                    <span>100% transparent</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.form>

          {/* Section Trust avec étoiles et avis */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-8 sm:mt-12 mb-8 w-full"
          >
            {/* Avis clients avec étoiles */}
            <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl border border-purple-200 shadow-lg p-3 sm:p-4 md:p-6 max-w-3xl mx-auto w-full">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                <div className="text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-0.5 sm:gap-1 mb-1 sm:mb-2">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="ml-1 sm:ml-2 text-gray-900 font-semibold text-sm sm:text-base">4.9/5</span>
                  </div>
                  <p className="text-gray-700 text-xs sm:text-sm">Plus de <span className="font-semibold text-gray-900">12 450</span> analyses réalisées</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                  <img src="https://avatars.githubusercontent.com/u/1?v=4" alt="Client" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-purple-300" />
                  <img src="https://avatars.githubusercontent.com/u/2?v=4" alt="Client" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-purple-300 -ml-2" />
                  <img src="https://avatars.githubusercontent.com/u/3?v=4" alt="Client" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-purple-300 -ml-2" />
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-600 flex items-center justify-center text-white text-[10px] sm:text-xs font-semibold -ml-2 border-2 border-white">
                    +99
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Logos partenaires immobiliers */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mb-6 sm:mb-8 w-full"
          >
            <p className="text-center text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4">Reconnu par les professionnels de l'immobilier</p>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 md:gap-4 lg:gap-6">
              {/* Logo FNAIM */}
              <div className="h-6 sm:h-8 md:h-10 flex items-center opacity-70 hover:opacity-100 transition-opacity">
                <img 
                  src="/logos/fnaim.jpg" 
                  alt="FNAIM" 
                  className="h-full w-auto object-contain max-w-[70px] sm:max-w-none"
                />
              </div>
              
              {/* Logo Notaires de France */}
              <div className="h-6 sm:h-8 md:h-10 flex items-center opacity-70 hover:opacity-100 transition-opacity">
                <img 
                  src="/logos/notaires.svg" 
                  alt="Notaires de France" 
                  className="h-full w-auto object-contain max-w-[70px] sm:max-w-none"
                />
              </div>
              
              {/* Logo Century 21 */}
              <div className="h-6 sm:h-8 md:h-10 flex items-center opacity-70 hover:opacity-100 transition-opacity">
                <img 
                  src="/logos/kisspng-logo-brand-trademark-font-product-go-to-image-page-5b7307819d7908.707487601534265217645.jpg" 
                  alt="Century 21" 
                  className="h-full w-auto object-contain max-w-[70px] sm:max-w-none"
                />
              </div>
              
              {/* Logo Orpi */}
              <div className="h-6 sm:h-8 md:h-10 flex items-center opacity-70 hover:opacity-100 transition-opacity">
                <img 
                  src="/logos/orpi.svg" 
                  alt="Orpi" 
                  className="h-full w-auto object-contain max-w-[50px] sm:max-w-none"
                />
              </div>
              
              {/* Logo SeLoger */}
              <div className="h-6 sm:h-8 md:h-10 flex items-center opacity-70 hover:opacity-100 transition-opacity">
                <img 
                  src="/logos/Logo_Seloger_2017.png" 
                  alt="SeLoger" 
                  className="h-full w-auto object-contain max-w-[70px] sm:max-w-none"
                />
              </div>
              
              {/* Logo leboncoin */}
              <div className="h-6 sm:h-8 md:h-10 flex items-center opacity-70 hover:opacity-100 transition-opacity">
                <img 
                  src="/logos/png-clipart-leboncoin-logo-leboncoin-logo-icons-logos-emojis-tech-companies.png" 
                  alt="leboncoin" 
                  className="h-full w-auto object-contain max-w-[70px] sm:max-w-none"
                />
              </div>
            </div>
            
          </motion.div>

          {/* Badges de confiance animés */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 lg:gap-8 w-full"
          >
            <div className="flex items-center gap-1.5 sm:gap-2 text-gray-700">
              <div className="p-1 sm:p-1.5 md:p-2 bg-purple-100 rounded-lg">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-[10px] sm:text-xs md:text-sm">Certifié par l'État</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-gray-700">
              <div className="p-1 sm:p-1.5 md:p-2 bg-purple-100 rounded-lg">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H4a1 1 0 100 2h1a1 1 0 100-2zm3 0a1 1 0 100 2h6a1 1 0 100-2H7zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H4zm3 0a1 1 0 100 2h6a1 1 0 100-2H7zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H4zm3 0a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-[10px] sm:text-xs md:text-sm">Rapport complet PDF</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-gray-700">
              <div className="p-1 sm:p-1.5 md:p-2 bg-purple-100 rounded-lg">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-[10px] sm:text-xs md:text-sm">Résultats en 45 secondes</span>
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}

