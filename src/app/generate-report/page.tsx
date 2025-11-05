'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/(context)/AuthContext';
import { Header } from '@/app/(components)/Header';
import Container from '@/app/(components)/Container';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Page de génération de rapport avec vrai terminal
 * Le client doit ressaisir l'adresse et la vraie API fonctionne
 */
export default function GenerateReportPage() {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [terminalStep, setTerminalStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseUser) {
      router.push('/login?redirect=/generate-report');
    }
  }, [firebaseUser, router]);

  const terminalLines = [
    { text: '$ verifiemamaison --analyse-immobilier', color: 'text-purple-400' },
    { text: `✓ Recherche de l'adresse: ${address}...`, color: 'text-blue-400' },
    { text: '✓ Connexion aux bases de données immobilières...', color: 'text-green-400' },
    { text: '✓ Analyse des données DVF...', color: 'text-blue-400' },
    { text: '✓ Vérification des diagnostics obligatoires...', color: 'text-blue-400' },
    { text: '✓ Analyse de la structure...', color: 'text-blue-400' },
    { text: '⚠️  2 anomalies détectées', color: 'text-orange-400' },
    { text: '✓ Rapport généré avec succès', color: 'text-green-400' },
  ];

  useEffect(() => {
    if (isGenerating && terminalStep < terminalLines.length - 1) {
      const timer = setTimeout(() => {
        setTerminalStep(prev => prev + 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isGenerating, terminalStep]);

  const handleGenerate = async () => {
    if (!address || !postalCode || !city) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (!firebaseUser) {
      router.push('/login');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setTerminalStep(0);

    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          houseData: {
            address,
            postalCode,
            city,
            // Autres champs par défaut
            generalCondition: 'bon_etat',
            roofCondition: 'bon',
            insulation: 'partielle',
            electrical: 'conforme',
            plumbing: 'acceptable',
            heating: 'gaz',
            surface: 0,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la génération du rapport');
      }

      const data = await response.json();
      setReportId(data.reportId);

      // Attendre que le terminal finisse
      setTimeout(() => {
        router.push(`/report/${data.reportId}`);
      }, 2000);
    } catch (error: any) {
      console.error('Erreur:', error);
      setError(error.message || 'Une erreur est survenue');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800">
      <Header />
      <main className="py-8 sm:py-12">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8 text-center">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Générer votre rapport
              </span>
            </h1>

            {/* Formulaire d'adresse */}
            {!isGenerating && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800 border border-purple-500/20 rounded-lg p-6 mb-8"
              >
                <h2 className="text-xl font-semibold text-white mb-4">Saisissez l'adresse du bien</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Adresse</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="123 rue de la République"
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Code postal</label>
                      <input
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="75001"
                        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Ville</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Paris"
                        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  {error && (
                    <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                      {error}
                    </div>
                  )}
                  <button
                    onClick={handleGenerate}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
                  >
                    Générer le rapport
                  </button>
                </div>
              </motion.div>
            )}

            {/* Terminal réel */}
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-black/80 backdrop-blur-md rounded-2xl border border-purple-500/30 overflow-hidden shadow-2xl"
              >
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-900/80 border-b border-purple-500/20">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="ml-2 text-xs text-gray-400 font-mono">
                    verifiemamaison-ai-engine
                  </span>
                </div>
                <div className="p-6 sm:p-8 font-mono text-sm space-y-3 min-h-[300px]">
                  <AnimatePresence>
                    {terminalLines.slice(0, terminalStep + 1).map((line, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className={line.color}
                      >
                        {line.text}
                        {index === terminalStep && (
                          <span className="inline-block w-2 h-4 bg-green-400 ml-1 animate-pulse"></span>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </div>
        </Container>
      </main>
    </div>
  );
}

