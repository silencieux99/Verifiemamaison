
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface AddressSuggestion {
  label: string;
  address: string;
  postalCode: string;
  city: string;
}

export default function HomeHero() {
  const router = useRouter();
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Recherche d'adresse simplifiée (mock pour l'UI, à connecter)
  useEffect(() => {
    if (address.length > 3) {
      const search = async () => {
        try {
          const response = await fetch(`/api/address/search?q=${encodeURIComponent(address)}`);
          if (response.ok) {
            const data = await response.json();
            if (data.features) {
              setSuggestions(data.features.slice(0, 4).map((f: any) => ({
                label: f.properties.label,
                address: f.properties.name,
                postalCode: f.properties.postcode,
                city: f.properties.city
              })));
              setShowSuggestions(true);
            }
          }
        } catch (e) {
          console.error(e);
        }
      };
      const timer = setTimeout(search, 300);
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [address]);

  const handleSelect = (s: AddressSuggestion) => {
    setAddress(s.label);
    setPostalCode(s.postalCode);
    setCity(s.city);
    setShowSuggestions(false);
    // Auto-submit immediately
    router.push(`/report/select?address=${encodeURIComponent(s.label)}&postalCode=${encodeURIComponent(s.postalCode)}&city=${encodeURIComponent(s.city)}`);
  };

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;
    router.push(`/report/select?address=${encodeURIComponent(address)}&postalCode=${encodeURIComponent(postalCode)}&city=${encodeURIComponent(city)}`);
  };

  return (
    <section className="relative min-h-[80vh] flex flex-col pt-32 md:pt-0 md:justify-center items-center bg-white selection:bg-black selection:text-white">
      {/* Background Layer - Clipped for overflow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Grid Background - Ultra subtle */}
        <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#f5f5f5_1px,transparent_1px),linear-gradient(to_bottom,#f5f5f5_1px,transparent_1px)] bg-[size:6rem_4rem] opacity-60"></div>

        {/* Subtle Glow - Lower z-index */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-emerald-50 opacity-[0.4] blur-[100px] rounded-full"></div>
      </div>

      <div className="relative z-20 w-full max-w-5xl px-4 md:px-8 text-center flex flex-col items-center">

        {/* Badge Redesigned */}
        <div className="flex flex-col items-center gap-4 mb-8 md:mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="px-4 py-1.5 rounded-full border border-gray-200 bg-white/50 backdrop-blur-md text-[10px] md:text-xs font-semibold tracking-[0.2em] uppercase text-gray-500 shadow-sm">
              Intelligence Immobilière
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-2"
          >
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-gray-300"></div>
            <span className="text-[10px] md:text-[11px] font-medium text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="text-amber-500/80">★</span> Distinction Excellence 2025
            </span>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-gray-300"></div>
          </motion.div>
        </div>

        {/* Hero Title - Larger & Cleaner */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-black leading-[0.9] md:leading-[1.1] mb-6 md:mb-8"
        >
          Achetez au <br className="md:hidden" />
          <span className="text-gray-400 font-serif italic font-light ml-2 md:ml-4">vrai prix.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-base md:text-xl text-gray-400 max-w-lg mx-auto font-light leading-relaxed mb-12 md:mb-16"
        >
          L'outil d'analyse le plus puissant pour négocier votre futur bien.
        </motion.p>

        {/* Improved Input Section - Force High Z-Index on Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-2xl relative z-50"
        >
          <div className={`
             relative flex items-center bg-white transition-all duration-300 rounded-2xl md:rounded-3xl
             ${isFocused
              ? 'shadow-[0_20px_40px_-10px_rgba(0,0,0,0.12)] border border-gray-400 ring-4 ring-gray-100'
              : 'shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-200 hover:border-gray-300 hover:shadow-lg'
            }
          `}>
            {/* Search Icon */}
            <div className="pl-5 md:pl-8 text-gray-400">
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>

            <form onSubmit={handleAnalyze} className="flex-1 w-full">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onFocus={() => { setIsFocused(true); if (suggestions.length > 0) setShowSuggestions(true); }}
                onBlur={() => { setIsFocused(false); setTimeout(() => setShowSuggestions(false), 200); }}
                placeholder="Quelle adresse analyser ?"
                className="w-full h-16 md:h-20 bg-transparent text-gray-900 placeholder:text-gray-300 px-4 md:px-6 focus:outline-none text-base md:text-xl font-medium tracking-tight rounded-2xl md:rounded-3xl"
              />
            </form>

            <div className="pr-2 md:pr-3">
              <button
                onClick={handleAnalyze}
                className="h-12 w-12 md:w-auto md:h-14 md:px-8 bg-black hover:bg-gray-800 text-white rounded-xl md:rounded-2xl transition-all flex items-center justify-center gap-2 group active:scale-95"
              >
                <span className="hidden md:inline font-medium text-sm md:text-base">Analyser</span>
                <svg className="w-5 h-5 md:w-4 md:h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
            </div>
          </div>

          {/* Suggestions Dropdown - Clean & Modern */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 right-0 mt-3 md:mt-4 p-2 bg-white/90 backdrop-blur-xl border border-gray-100 rounded-2xl shadow-2xl z-[100] origin-top max-h-[250px] overflow-y-auto scrollbar-hide"
                // Prevent touch events from bubbling or closing immediately (though onMouseDown handles click)
                onTouchStart={(e) => e.stopPropagation()}
              >
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onMouseDown={(e) => e.preventDefault()} // CRITICAL: Prevent blur before click
                    onClick={() => handleSelect(s)}
                    className="w-full text-left px-4 md:px-6 py-3 md:py-4 hover:bg-gray-50/80 rounded-xl transition-all flex items-center justify-between group"
                  >
                    <div className="flex flex-col">
                      <span className="text-gray-900 text-sm md:text-base font-medium group-hover:text-black transition-colors">{s.label}</span>
                      <span className="text-gray-400 text-xs md:text-sm font-light mt-0.5">{s.city} ({s.postalCode})</span>
                    </div>
                    <svg className="w-4 h-4 text-gray-300 group-hover:text-black -translate-x-2 group-hover:translate-x-0 transition-all opacity-0 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" /></svg>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Helper Tags - SEPARATED CONTAINER, LOW Z-INDEX */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative z-0 mt-8 flex flex-wrap justify-center gap-4 md:gap-8 opacity-60"
        >
          {['Données notariées', 'Mise à jour J+1', 'Analyse IA'].map((tag, i) => (
            <div key={i} className="flex items-center gap-2 text-[10px] md:text-xs uppercase tracking-widest text-gray-500 font-medium">
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              {tag}
            </div>
          ))}
        </motion.div>

      </div>

      {/* Decorative Footer Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none z-10"></div>
    </section>
  );
}
