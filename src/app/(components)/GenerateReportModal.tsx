'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/app/(context)/AuthContext';
import { getUserCredits } from '@/lib/user';
import { XMarkIcon, MagnifyingGlassIcon, MapPinIcon, BoltIcon, ArrowRightIcon, HomeModernIcon, ChartBarIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';
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
  context?: string;
}

type Step = 'SEARCH' | 'ANALYZING' | 'SELECTION' | 'RESULT' | 'GENERATING' | 'SUCCESS';

export function GenerateReportModal({ isOpen, onClose, onSuccess }: GenerateReportModalProps) {
  const { firebaseUser } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const [step, setStep] = useState<Step>('SEARCH');

  // Data
  const [address, setAddress] = useState('');
  const [selectedAddress, setSelectedAddress] = useState<AddressSuggestion | null>(null);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [selectedProperty, setSelectedProperty] = useState<any>(null); // Specific property chosen from history
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [generatedReportId, setGeneratedReportId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && firebaseUser) getUserCredits(firebaseUser.uid).then(setCredits);
  }, [isOpen, firebaseUser]);

  useEffect(() => {
    if (isOpen) {
      setStep('SEARCH');
      setAddress('');
      setSelectedAddress(null);
      setSuggestions([]);
      setTerminalLogs([]);
      setSelectedProperty(null);
      setGeneratedReportId(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const searchAddresses = async () => {
      if (address.length < 3) {
        setSuggestions([]);
        return;
      }
      setIsSearching(true);
      try {
        const response = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(address)}&limit=5`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions((data.features || []).map((f: any) => ({
            label: f.properties.label,
            address: f.properties.name,
            postalCode: f.properties.postcode,
            city: f.properties.city,
            context: f.properties.context
          })));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsSearching(false);
      }
    };
    const timer = setTimeout(searchAddresses, 300);
    return () => clearTimeout(timer);
  }, [address]);

  const handleSelectAddress = async (suggestion: AddressSuggestion) => {
    setAddress(suggestion.label);
    setSelectedAddress(suggestion);
    setStep('ANALYZING');

    try {
      // Real Data Fetch
      const response = await fetch(`/api/report/preview?address=${encodeURIComponent(suggestion.label)}`);
      if (!response.ok) throw new Error('Preview failed');

      const data = await response.json();

      // Add artificial delay if analysis was too fast (for UX pacing)
      await new Promise(r => setTimeout(r, 1500));

      const history = data.market?.history || [];
      const risksCount = data.risks?.count || 0;

      setAnalysisResult({
        transactions: data.market?.transactionsCount || 0,
        risks: risksCount,
        priceM2: data.market?.averagePriceM2 || 0,
        history: history
      });

      // DECISION LOGIC: 
      // If multiple EXACT matches (history > 1), go to SELECTION.
      // Else go to RESULT directly.
      if (history.length > 1) {
        setStep('SELECTION');
      } else {
        // If 1 match, auto-select it. If 0, no selection (fallback neighborhood mode).
        if (history.length === 1) setSelectedProperty(history[0]);
        setStep('RESULT');
      }

    } catch (error) {
      console.error(error);
      // Fallback or Error state
      setStep('SEARCH');
    }
  };

  const handlePropertySelection = (property: any) => {
    setSelectedProperty(property);
    setStep('RESULT');
  };

  const isGeneratingRef = useRef(false);

  const handleStartGeneration = async () => {
    if (isGeneratingRef.current) return;
    if (!selectedAddress || !firebaseUser) return;

    isGeneratingRef.current = true;
    setStep('GENERATING');
    setTerminalLogs([]);

    try {
      const logs = ['Interrogation bases DVF...', 'Croisement Géorisques...', 'Génération PDF...'];
      for (const log of logs) {
        setTerminalLogs(prev => [...prev, log]);
        await new Promise(r => setTimeout(r, 400));
      }

      const token = await firebaseUser.getIdToken();

      const fullAddress = selectedAddress.label;
      const profileResponse = await fetch(`/api/house-profile?address=${encodeURIComponent(fullAddress)}&radius_m=1500&lang=fr`);
      const profileData = await profileResponse.json();

      setTerminalLogs(prev => [...prev, 'Finalisation...']);
      const reportResponse = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({
          address: fullAddress, postalCode: selectedAddress.postalCode, city: selectedAddress.city, profileData,
          selectedPropertyId: selectedProperty?.id // Pass specific ID if selected
        })
      });

      if (!reportResponse.ok) throw new Error('Generation failed');
      const result = await reportResponse.json();

      setGeneratedReportId(result.reportId);
      setStep('SUCCESS');
      if (onSuccess) onSuccess(result.reportId);

      setTimeout(() => {
        window.location.href = `/report/${result.reportId}`;
      }, 800);

    } catch (error) {
      console.error(error);
      setTerminalLogs(prev => [...prev, 'Erreur technique.']);
      isGeneratingRef.current = false; // Reset lock on error
    }
  };

  const variants = {
    initial: { opacity: 0, y: 10, scale: 0.99 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4 } },
    exit: { opacity: 0, y: -10, scale: 0.99, transition: { duration: 0.2 } }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/20 backdrop-blur-md" onClick={onClose}
          />

          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: "spring", damping: 40, stiffness: 400 }}
            className="relative w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl flex flex-col max-h-[90vh] sm:min-h-[500px]"
          >
            {/* Header Clean */}
            <div className="flex items-center justify-between px-8 pt-8 pb-4">
              <div className="text-sm font-semibold tracking-wide text-gray-400 uppercase">
                {credits !== null ? `${credits} CRÉDIT${credits > 1 ? 'S' : ''}` : '...'}
              </div>
              <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-900 transition-colors">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 pt-0 overflow-y-auto min-h-[400px]">
              <AnimatePresence mode='wait'>

                {/* STEP 1: SEARCH */}
                {step === 'SEARCH' && (
                  <motion.div key="search" variants={variants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full">
                    <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">Quelle adresse analyse-t-on ?</h2>
                    <div className="relative mb-8">
                      <MagnifyingGlassIcon className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 text-gray-300" />
                      <input
                        type="text" autoFocus
                        value={address} onChange={(e) => setAddress(e.target.value)}
                        placeholder="Tapez une adresse..."
                        className="w-full pl-12 py-4 text-3xl font-medium text-gray-900 placeholder-gray-300 border-none outline-none bg-transparent"
                      />
                    </div>

                    {suggestions.length > 0 && (
                      <div className="space-y-4">
                        {suggestions.map((s, i) => (
                          <motion.button
                            key={i}
                            onClick={() => handleSelectAddress(s)}
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            className="w-full text-left p-6 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all group"
                          >
                            <div className="font-bold text-lg text-gray-900 group-hover:text-black mb-1">{s.label}</div>
                            <div className="text-gray-500">{s.city} {s.postalCode}</div>
                          </motion.button>
                        ))}
                      </div>
                    )}
                    {/* Empty State */}
                    {suggestions.length === 0 && !isSearching && address.length < 3 && (
                      <div className="mt-12 opacity-30 flex justify-center">
                        <HomeModernIcon className="w-24 h-24 text-gray-300" />
                      </div>
                    )}
                  </motion.div>
                )}

                {/* STEP 2: ANALYZING (Clean Loader) */}
                {step === 'ANALYZING' && (
                  <motion.div key="analyzing" variants={variants} initial="initial" animate="animate" exit="exit" className="flex flex-col items-center justify-center h-full min-h-[300px]">
                    <div className="w-16 h-16 border-4 border-gray-100 border-t-black rounded-full animate-spin mb-8" />
                    <h3 className="text-xl font-bold text-gray-900">Analyse du quartier...</h3>
                  </motion.div>
                )}

                {/* STEP 2.5: SELECTION (New Property Selection) */}
                {step === 'SELECTION' && analysisResult && (
                  <motion.div key="selection" variants={variants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full">
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Plusieurs biens trouvés</h2>
                      <p className="text-gray-500">Pour une estimation précise, sélectionnez l'appartement ou la maison concernée.</p>
                    </div>

                    <div className="space-y-4 pb-4">
                      {analysisResult.history.map((prop: any, i: number) => {
                        const estimatedPrice = prop.price || (analysisResult.priceM2 * prop.surface);

                        return (
                          <motion.button
                            key={i}
                            variants={{
                              initial: { opacity: 0, y: 10 },
                              animate: { opacity: 1, y: 0, transition: { delay: i * 0.1 } }
                            }}
                            initial="initial"
                            whileInView="animate"
                            onClick={() => handlePropertySelection(prop)}
                            className="w-full text-left bg-white border border-gray-100 rounded-[28px] p-5 md:p-8 hover:border-black/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
                          >
                            <div className="flex justify-between items-start mb-4 md:mb-6">
                              <div className="flex items-center gap-3 md:gap-4">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors duration-300 shadow-sm border border-gray-100">
                                  <BuildingOffice2Icon className="w-5 h-5 md:w-6 md:h-6 text-gray-400 group-hover:text-white" />
                                </div>
                                <div>
                                  <div className="font-bold text-gray-900 text-sm md:text-base uppercase tracking-wider">
                                    {prop.type || 'Appartement'}
                                  </div>
                                  <div className="text-xs md:text-sm font-medium text-gray-400 mt-0.5">
                                    {prop.address || selectedAddress.city}
                                  </div>
                                </div>
                              </div>
                              <div className="px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-gray-50 border border-gray-100 text-xs md:text-sm font-bold text-gray-900 shadow-sm">
                                {new Date(prop.date).getFullYear()}
                              </div>
                            </div>

                            <div className="flex items-baseline gap-0.5 md:gap-1 mb-4 md:mb-6">
                              <span className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter">
                                {prop.surface}
                              </span>
                              <span className="text-sm md:text-lg font-bold text-gray-400 ml-1 mr-3 md:mr-6">m²</span>

                              <div className="w-px h-6 md:h-10 bg-gray-100 mr-3 md:mr-6 self-center" />

                              <span className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter">
                                {prop.rooms}
                              </span>
                              <span className="text-sm md:text-lg font-bold text-gray-400 ml-1">pièces</span>
                            </div>

                            <div className="flex items-center justify-between pt-4 md:pt-6 border-t border-gray-50">
                              <div className="flex items-center gap-2 md:gap-2.5 text-xs md:text-sm font-medium text-gray-400 group-hover:text-gray-600 transition-colors">
                                <ChartBarIcon className="w-4 h-4 md:w-5 md:h-5" />
                                <span className="tracking-wide">
                                  {prop.price
                                    ? `${prop.price.toLocaleString('fr-FR')} €`
                                    : `Est. ~${Math.round(estimatedPrice / 1000) * 1000} €`}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] md:text-xs font-black uppercase tracking-widest text-black opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0 duration-300 bg-gray-100 px-3 py-1.5 md:px-4 md:py-2 rounded-full">
                                Sélectionner <ArrowRightIcon className="w-3 h-3" />
                              </div>
                            </div>

                            {prop.lot && prop.lot !== 'None' && (
                              <div className="absolute top-4 md:top-8 right-14 md:right-20 text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity">
                                Lot {prop.lot}
                              </div>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: RESULT (Refined Layout) */}
                {step === 'RESULT' && selectedAddress && (
                  <motion.div key="result" variants={variants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full">

                    <div className="flex-1 flex flex-col justify-center">
                      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-200/50">

                        <div className="flex flex-col items-center text-center mb-8">
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-100 rounded-full mb-6">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-green-700">Bien Identifié</span>
                          </div>

                          <h2 className="text-3xl sm:text-4xl font-serif text-gray-900 leading-tight mb-2">
                            {selectedAddress.label.split(',')[0]}
                          </h2>
                          <p className="text-gray-500 font-medium text-lg">
                            {selectedAddress.postalCode} {selectedAddress.city}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-px bg-gray-100 rounded-2xl overflow-hidden border border-gray-100">
                          {selectedProperty ? (
                            // SPECIFIC PROPERTY VIEW
                            <>
                              <div className="bg-gray-50 p-6 flex flex-col items-center justify-center group hover:bg-white transition-colors">
                                <div className="text-3xl font-bold text-gray-900 group-hover:scale-110 transition-transform duration-300">
                                  {selectedProperty.surface} <span className="text-lg">m²</span>
                                </div>
                                <div className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mt-2">Surface</div>
                              </div>
                              <div className="bg-gray-50 p-6 flex flex-col items-center justify-center group hover:bg-white transition-colors">
                                <div className="text-3xl font-bold text-gray-900 group-hover:scale-110 transition-transform duration-300">
                                  {selectedProperty.rooms}
                                </div>
                                <div className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mt-2">Pièces</div>
                              </div>
                            </>
                          ) : (
                            // NEIGHBORHOOD FALLBACK VIEW
                            <>
                              <div className="bg-gray-50 p-6 flex flex-col items-center justify-center group hover:bg-white transition-colors">
                                <div className="text-3xl font-bold text-gray-900 group-hover:scale-110 transition-transform duration-300">
                                  {analysisResult.transactions}
                                </div>
                                <div className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mt-2">
                                  {analysisResult.transactions > 1 ? 'Ventes' : 'Vente'} (5 ans)
                                </div>
                              </div>
                              <div className="bg-gray-50 p-6 flex flex-col items-center justify-center group hover:bg-white transition-colors">
                                <div className="text-3xl font-bold text-gray-900 group-hover:scale-110 transition-transform duration-300">
                                  {analysisResult.risks}
                                </div>
                                <div className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mt-2">
                                  {analysisResult.risks > 1 ? 'Risques' : 'Risque'}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-8">
                      <button
                        onClick={handleStartGeneration}
                        className="w-full py-5 bg-gray-900 text-white rounded-2xl font-medium text-lg hover:bg-black hover:shadow-lg transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                      >
                        <span>Accéder au Rapport</span>
                        <ArrowRightIcon className="w-5 h-5" />
                      </button>
                      <p className="text-center text-xs text-gray-400 mt-4 font-medium">Analyse complète • 1 crédit</p>
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: TERMINAL (Clean Light Mode) */}
                {(step === 'GENERATING' || step === 'SUCCESS') && (
                  <motion.div key="terminal" variants={variants} initial="initial" animate="animate" className="h-full flex flex-col justify-center">
                    <div className="space-y-6 px-4">
                      {terminalLogs.map((log, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-4 text-lg font-medium text-gray-900"
                        >
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          {log}
                        </motion.div>
                      ))}
                      {step === 'GENERATING' && (
                        <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse ml-1" />
                      )}
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
