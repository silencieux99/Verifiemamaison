'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/app/(context)/AuthContext';
import { getUserCredits } from '@/lib/user';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

interface GenerateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (reportId: string) => void;
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

export function GenerateReportModal({ isOpen, onClose, onSuccess }: GenerateReportModalProps) {
  const { firebaseUser } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(true);
  
  // États pour la saisie d'adresse
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // États pour le terminal
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReportId, setGeneratedReportId] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Charger les crédits
  useEffect(() => {
    if (isOpen && firebaseUser) {
      const loadCredits = async () => {
        try {
          const userCredits = await getUserCredits(firebaseUser.uid);
          setCredits(userCredits);
        } catch (error) {
          console.error('Erreur chargement crédits:', error);
        } finally {
          setLoadingCredits(false);
        }
      };
      loadCredits();
    }
  }, [isOpen, firebaseUser]);

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

  const handleSelectSuggestion = (suggestion: AddressSuggestion, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    setAddress(suggestion.label);
    setPostalCode(suggestion.postalCode);
    setCity(suggestion.city);
    setSuggestions([]);
    setShowSuggestions(false);
    setError(null);
  };

  const handleGenerateReport = async () => {
    if (!address || !postalCode || !city) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (!firebaseUser) {
      setError('Vous devez être connecté');
      return;
    }

    if (!credits || credits <= 0) {
      setError('Vous n\'avez pas assez de crédits');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setShowTerminal(true);
    setTerminalLogs([]);
    setGeneratedReportId(null);

    try {
      // Étape 1: Démarrage
      setTerminalLogs(prev => [...prev, '🚀 Démarrage du traitement...']);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Étape 2: Vérification des crédits
      setTerminalLogs(prev => [...prev, '💳 Vérification des crédits...']);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const token = await firebaseUser.getIdToken();

      // Étape 3: Appel API house-profile
      setTerminalLogs(prev => [...prev, '📡 Collecte des données immobilières...']);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const fullAddress = `${address}, ${postalCode} ${city}`;
      const profileResponse = await fetch(`/api/house-profile?address=${encodeURIComponent(fullAddress)}&radius_m=1500&lang=fr`);
      
      if (!profileResponse.ok) {
        throw new Error('Erreur lors de la collecte des données');
      }
      
      const profileData = await profileResponse.json();
      setTerminalLogs(prev => [...prev, `✅ ${profileData.meta.sources.length} sources consultées`]);
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Étape 4: Génération du rapport
      setTerminalLogs(prev => [...prev, '🧠 Analyse intelligente en cours...']);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setTerminalLogs(prev => [...prev, '📊 Traitement des données...']);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Appel API pour créer le rapport
      const reportResponse = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          address: fullAddress,
          postalCode,
          city,
          profileData, // Envoyer toutes les données agrégées
        }),
      });

      if (!reportResponse.ok) {
        throw new Error('Erreur lors de la génération du rapport');
      }

      const reportResult = await reportResponse.json();
      setTerminalLogs(prev => [...prev, '✅ Rapport généré']);
      
      // Étape 5: Finalisation
      setTerminalLogs(prev => [...prev, '📄 Préparation de l\'affichage...']);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setTerminalLogs(prev => [...prev, '🎉 Rapport prêt !']);
      
      setGeneratedReportId(reportResult.reportId);
      
      // Rafraîchir les crédits (le crédit a été débité par l'API)
      const updatedCredits = await getUserCredits(firebaseUser.uid);
      setCredits(updatedCredits);

      // Appeler le callback de succès
      if (onSuccess && reportResult.reportId) {
        onSuccess(reportResult.reportId);
      }

      // Redirection automatique après 2 secondes
      setTimeout(() => {
        window.location.href = `/report/${reportResult.reportId}`;
      }, 2000);

    } catch (error: any) {
      console.error('Erreur génération rapport:', error);
      setTerminalLogs(prev => [...prev, `❌ Erreur: ${error.message || 'Erreur inconnue'}`]);
      setError(error.message || 'Erreur lors de la génération du rapport');
      
      // Rembourser le crédit si erreur après débit
      if (firebaseUser && credits !== null) {
        try {
          // TODO: Implémenter remboursement crédit si nécessaire
        } catch (refundError) {
          console.error('Erreur remboursement:', refundError);
        }
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    if (!isGenerating) {
      setAddress('');
      setPostalCode('');
      setCity('');
      setError(null);
      setShowTerminal(false);
      setTerminalLogs([]);
      setGeneratedReportId(null);
      setSuggestions([]);
      setShowSuggestions(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div 
        className="absolute inset-0" 
        onClick={handleClose}
      />
      
      <div className="relative w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl transform transition-transform duration-300 ease-out max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-center pt-3 pb-2 sm:hidden">
          <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
        </div>

        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Générer un rapport
              </h3>
              <p className="text-sm text-gray-500">
                Analyse immobilière complète
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={isGenerating}
              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors disabled:opacity-50"
            >
              <XMarkIcon className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="px-6 py-4 space-y-5 overflow-y-auto flex-1">
          {/* Terminal de génération */}
          {showTerminal && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-900 rounded-lg p-4 font-mono text-sm"
            >
              <div className="flex items-center mb-3">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <span className="text-gray-400 ml-3">Terminal</span>
              </div>
              <div className="space-y-1 min-h-[200px]">
                <AnimatePresence>
                  {terminalLogs.map((log, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-green-400"
                    >
                      <span className="text-gray-500">$</span> {log}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {isGenerating && (
                  <div className="text-green-400">
                    <span className="text-gray-500">$</span> <span className="animate-pulse">▋</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Affichage du succès */}
          {generatedReportId && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-50 border border-green-200 rounded-lg p-4"
            >
              <div className="flex items-start">
                <div className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0">
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-green-900">
                    Rapport généré avec succès !
                  </h4>
                  <p className="text-sm text-green-700 mt-1">
                    Redirection en cours...
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Formulaire de saisie - seulement si pas de terminal */}
          {!showTerminal && (
            <>
              {/* Champ d'adresse avec autocomplétion */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Adresse du bien
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-600 z-10 pointer-events-none">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <input
                    ref={inputRef}
                    type="text"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      setError(null);
                      if (e.target.value.length >= 3) {
                        setShowSuggestions(true);
                      } else {
                        setShowSuggestions(false);
                      }
                    }}
                    onFocus={() => {
                      if (suggestions.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                    onBlur={(e) => {
                      const relatedTarget = e.relatedTarget as HTMLElement;
                      if (!relatedTarget || !relatedTarget.closest('.address-suggestions')) {
                        setTimeout(() => setShowSuggestions(false), 250);
                      }
                    }}
                    placeholder="Tapez une adresse..."
                    className="w-full pl-10 pr-10 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                      <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                
                {/* Suggestions */}
                <AnimatePresence>
                  {showSuggestions && suggestions.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="address-suggestions absolute z-[9999] w-full mt-2 bg-white backdrop-blur-xl border border-purple-200 rounded-xl shadow-2xl overflow-hidden max-h-[300px] overflow-y-auto"
                    >
                      {suggestions.map((suggestion, index) => (
                        <motion.button
                          key={`${suggestion.label}-${index}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectSuggestion(suggestion, e);
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            handleSelectSuggestion(suggestion, e);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-purple-50 active:bg-purple-100 transition-all duration-200 border-b border-gray-200 last:border-b-0 group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="text-purple-600 mt-0.5 group-hover:text-purple-700 flex-shrink-0">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-gray-900 font-medium group-hover:text-purple-700 transition-colors truncate">
                                {suggestion.label}
                              </div>
                              {suggestion.postalCode && suggestion.city && (
                                <div className="text-xs text-gray-600 mt-0.5">
                                  {suggestion.postalCode} • {suggestion.city}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Code postal et ville */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
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
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
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
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Message d'erreur */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <svg className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {/* Informations crédits */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="flex items-start">
                  <svg className="h-4 w-4 text-purple-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-purple-900">
                      Coût du rapport
                    </h4>
                    <p className="text-sm text-purple-700 mt-1">
                      1 crédit de votre compte
                    </p>
                    {loadingCredits ? (
                      <p className="text-xs text-purple-600 mt-1">Chargement...</p>
                    ) : credits !== null && (
                      <p className="text-xs text-purple-600 mt-1 font-medium">
                        Restant: {credits} crédit{credits > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Boutons fixes en bas - seulement si pas de terminal */}
        {!showTerminal && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                disabled={isGenerating}
                className="flex-1 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleGenerateReport}
                disabled={isGenerating || !address.trim() || !postalCode || !city || !credits || credits <= 0}
                className="flex-1 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Génération...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Générer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

