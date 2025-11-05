'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Container from '@/app/(components)/Container';
import PaymentModal from '@/app/(components)/PaymentModal';

function AnalysePreviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [terminalStep, setTerminalStep] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [showInfoBox, setShowInfoBox] = useState(false);

  // Récupérer l'adresse depuis les paramètres URL
  const address = searchParams.get('address') || '';
  const postalCode = searchParams.get('postalCode') || '';
  const city = searchParams.get('city') || '';
  const fullAddress = address && postalCode && city 
    ? `${address}, ${postalCode} ${city}` 
    : 'bien immobilier';

  // Simulation du terminal (3-4 secondes)
  useEffect(() => {
    const steps = [
      { delay: 0, step: 0 },
      { delay: 800, step: 1 },
      { delay: 1600, step: 2 },
      { delay: 2400, step: 3 },
      { delay: 3200, step: 4 },
    ];

    steps.forEach(({ delay, step }) => {
      setTimeout(() => setTerminalStep(step), delay);
    });

    // Afficher le rapport après 3.5 secondes
    setTimeout(() => {
      setShowReport(true);
      setShowInfoBox(Math.random() < 0.7);
    }, 3500);
  }, []);

  const terminalLines = [
    { text: `$ verifiemamaison --analyse "${fullAddress}"`, color: 'text-purple-400' },
    { text: '✓ Collecte des données immobilières...', color: 'text-green-400' },
    { text: '✓ Analyse des informations disponibles...', color: 'text-blue-400' },
    { text: '⚠️  2 anomalies détectées', color: 'text-orange-400' },
    { text: '✓ Rapport généré avec succès', color: 'text-green-400' },
  ];

  const handleUnlockClick = () => {
    setIsPaymentModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100">
      <main className="py-8 sm:py-12">
        <Container>
          {/* Terminal de simulation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto mb-12"
          >
            <div className="bg-gray-900/95 backdrop-blur-md rounded-2xl border border-purple-200 overflow-hidden shadow-2xl">
              {/* Barre de fenêtre */}
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-800/80 border-b border-purple-200">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="ml-2 text-xs text-gray-300 font-mono">
                  verifiemamaison-ai-engine
                </span>
              </div>

              {/* Contenu du terminal */}
              <div className="p-6 sm:p-8 font-mono text-sm space-y-3 min-h-[200px]">
                {address && postalCode && city && (
                  <div className="text-gray-300 mb-4">
                    Analyse de: {fullAddress}
                  </div>
                )}
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
            </div>
          </motion.div>

          {/* Section "Votre rapport est prêt" */}
          <AnimatePresence>
            {showReport && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-4xl mx-auto"
              >
                {/* Titre */}
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4"
                  >
                    <span className="text-3xl">✓</span>
                  </motion.div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                    Votre rapport est prêt !
                  </h1>
                  <p className="text-lg text-gray-700">
                    Débloquez-le maintenant pour découvrir tous les détails
                  </p>
                </div>

                {/* Info box */}
                {showInfoBox && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-6 text-center">
                    <p className="text-blue-900 text-sm">
                      👁️ Des acheteurs ont déjà consulté ce bien
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Conseil: vérifiez les antécédents avant tout déplacement ou acompte
                    </p>
                  </div>
                )}

                {/* Previews floutées du rapport */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {/* Preview 1 - Score global */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="relative group cursor-pointer"
                    onClick={handleUnlockClick}
                  >
                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-200 relative overflow-hidden shadow-lg">
                      <div className="blur-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Score global du bien</h3>
                        <div className="flex items-center justify-center mb-4">
                          <div className="relative w-32 h-32">
                            <svg className="transform -rotate-90 w-32 h-32">
                              <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                className="text-gray-700"
                              />
                              <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray={2 * Math.PI * 56}
                                strokeDashoffset={2 * Math.PI * 56 * (1 - 0.65)}
                                className="text-yellow-500"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-4xl font-bold text-yellow-500">65</span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">État général</span>
                            <span className="text-yellow-600 font-bold">MOYEN</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Anomalies détectées</span>
                            <span className="text-orange-600 font-bold">2</span>
                          </div>
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/70 to-transparent flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-4xl mb-3">🔒</div>
                          <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform">
                            Débloquer le rapport
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Preview 2 - Structure */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="relative group cursor-pointer"
                    onClick={handleUnlockClick}
                  >
                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-200 relative overflow-hidden shadow-lg">
                      <div className="blur-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">État de la structure</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            <div>
                              <div className="text-sm text-gray-600">Toiture</div>
                              <div className="text-lg font-bold text-gray-900">État moyen</div>
                            </div>
                            <span className="text-yellow-600 text-2xl">⚠️</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                            <div>
                              <div className="text-sm text-gray-600">Isolation</div>
                              <div className="text-lg font-bold text-gray-900">Partielle</div>
                            </div>
                            <span className="text-orange-600 text-2xl">⚠️</span>
                          </div>
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/70 to-transparent flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-4xl mb-3">🔒</div>
                          <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform">
                            Débloquer le rapport
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Preview 3 - Installations */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="relative group cursor-pointer"
                    onClick={handleUnlockClick}
                  >
                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-200 relative overflow-hidden shadow-lg">
                      <div className="blur-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Installations</h3>
                        <div className="space-y-3">
                          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-2xl">⚡</span>
                              <div>
                                <div className="font-bold text-gray-900">Électricité</div>
                                <div className="text-sm text-gray-600">Conforme</div>
                              </div>
                            </div>
                          </div>
                          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-2xl">🔧</span>
                              <div>
                                <div className="font-bold text-gray-900">Plomberie</div>
                                <div className="text-sm text-gray-600">À surveiller</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/70 to-transparent flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-4xl mb-3">🔒</div>
                          <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform">
                            Débloquer le rapport
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Preview 4 - Recommandations */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="relative group cursor-pointer"
                    onClick={handleUnlockClick}
                  >
                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-200 relative overflow-hidden shadow-lg">
                      <div className="blur-md">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Recommandations</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Travaux urgents</span>
                            <span className="text-gray-900 font-semibold">2</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Travaux recommandés</span>
                            <span className="text-gray-900 font-semibold">5</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Budget estimé</span>
                            <span className="text-gray-900 font-semibold">XXXXX €</span>
                          </div>
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-white/98 via-white/80 to-white/50 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-4xl mb-3">🔒</div>
                          <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform">
                            Débloquer le rapport
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* CTA principal */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="text-center"
                >
                  <button
                    onClick={handleUnlockClick}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-12 py-5 rounded-2xl text-xl font-bold shadow-2xl hover:scale-105 transition-transform"
                  >
                    🔓 Débloquer votre rapport complet
                  </button>
                  <p className="text-sm text-gray-600 mt-4">
                    ✓ Paiement sécurisé • ✓ Rapport instantané • ✓ Garantie satisfait ou remboursé
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </Container>
      </main>

      {/* Modale de paiement */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
      />
    </div>
  );
}

export default function AnalysePreviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-900">Chargement...</div>
      </div>
    }>
      <AnalysePreviewContent />
    </Suspense>
  );
}

