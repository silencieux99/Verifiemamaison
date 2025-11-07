'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Container from '@/app/(components)/Container';
import PaymentModal from '@/app/(components)/PaymentModal';

function AnalysePreviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [terminalStep, setTerminalStep] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const handleUnlockClick = useRef(false);

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
    }, 3500);
  }, []);

  const terminalLines = [
    { text: `$ verifiemamaison --analyse "${fullAddress}"`, color: 'text-purple-400' },
    { text: '✓ Collecte des données immobilières...', color: 'text-green-400' },
    { text: '✓ Analyse des informations disponibles...', color: 'text-blue-400' },
    { text: '⚠️  2 anomalies détectées', color: 'text-orange-400' },
    { text: '✓ Rapport généré avec succès', color: 'text-green-400' },
  ];

  const openModal = () => {
    if (handleUnlockClick.current) {
      return;
    }
    handleUnlockClick.current = true;
    setIsPaymentModalOpen(true);
    setTimeout(() => {
      handleUnlockClick.current = false;
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="py-8 sm:py-12 md:py-16">
        <Container>
          {/* Terminal de simulation */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="bg-gray-900 rounded-lg overflow-hidden shadow-lg">
              {/* Barre de fenêtre */}
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
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
                {terminalLines.slice(0, terminalStep + 1).map((line, index) => (
                  <div
                    key={index}
                    className={line.color}
                  >
                    {line.text}
                    {index === terminalStep && (
                      <span className="inline-block w-2 h-4 bg-green-400 ml-1"></span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section "Votre rapport est prêt" */}
          {showReport && (
            <div className="max-w-4xl mx-auto">
              {/* Titre */}
              <div className="text-center mb-8 sm:mb-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4 sm:mb-6">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
                  Votre rapport est prêt
                </h1>
                <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
                  Débloquez-le maintenant pour découvrir tous les détails
                </p>
              </div>

              {/* Previews floutées du rapport */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
                {/* Preview 1 - Score global */}
                <div className="relative group">
                  <div className="bg-white border border-gray-200 rounded-xl p-6 relative overflow-hidden shadow-lg">
                    <div className="opacity-70 blur-sm">
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
                              strokeDashoffset={2 * Math.PI * 56 * (1 - 0.58)}
                              className="text-red-500"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-4xl font-bold text-red-500">58</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">État général</span>
                          <span className="text-red-600 font-bold">⚠️ ATTENTION</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Anomalies critiques</span>
                          <span className="text-red-600 font-bold">3 détectées</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Risques financiers</span>
                          <span className="text-orange-600 font-bold">Élevés</span>
                        </div>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                        <div className="text-xs text-red-700 font-semibold mb-1">🚨 ALERTE</div>
                        <div className="text-xs text-red-600">Vérifications urgentes requises avant achat</div>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl mb-3">🔒</div>
                        <button 
                          type="button"
                          onClick={openModal}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg"
                          style={{
                            WebkitTapHighlightColor: 'transparent',
                            touchAction: 'manipulation',
                            cursor: 'pointer',
                            WebkitAppearance: 'none',
                          }}
                        >
                          Débloquer le rapport
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview 2 - Structure */}
                <div className="relative group">
                  <div className="bg-white border border-gray-200 rounded-xl p-6 relative overflow-hidden shadow-lg">
                    <div className="opacity-70 blur-sm">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">État de la structure</h3>
                      <div className="space-y-3 mb-3">
                        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                          <div>
                            <div className="text-sm text-gray-600">Fissures structurelles</div>
                            <div className="text-lg font-bold text-red-900">Détectées</div>
                          </div>
                          <span className="text-red-600 text-2xl">🔴</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                          <div>
                            <div className="text-sm text-gray-600">Humidité</div>
                            <div className="text-lg font-bold text-orange-900">Traces suspectes</div>
                          </div>
                          <span className="text-orange-600 text-2xl">⚠️</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div>
                            <div className="text-sm text-gray-600">Isolation</div>
                            <div className="text-lg font-bold text-gray-900">Absente</div>
                          </div>
                          <span className="text-yellow-600 text-2xl">⚠️</span>
                        </div>
                      </div>
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 mt-2">
                        <div className="text-xs text-orange-700 font-semibold">💸 Coût travaux estimé: 25,000€+</div>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl mb-3">🔒</div>
                        <button 
                          type="button"
                          onClick={openModal}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg"
                          style={{
                            WebkitTapHighlightColor: 'transparent',
                            touchAction: 'manipulation',
                            cursor: 'pointer',
                            WebkitAppearance: 'none',
                          }}
                        >
                          Débloquer le rapport
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview 3 - Installations */}
                <div className="relative group">
                  <div className="bg-white border border-gray-200 rounded-xl p-6 relative overflow-hidden shadow-lg">
                    <div className="opacity-70 blur-sm">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Installations & Risques</h3>
                      <div className="space-y-3 mb-3">
                        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">⚡</span>
                            <div className="flex-1">
                              <div className="font-bold text-red-900">Électricité non conforme</div>
                              <div className="text-sm text-red-600">Risque d'incendie identifié</div>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">🔧</span>
                            <div className="flex-1">
                              <div className="font-bold text-orange-900">Plomberie vétuste</div>
                              <div className="text-sm text-orange-600">Fuite suspecte détectée</div>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">🏠</span>
                            <div className="flex-1">
                              <div className="font-bold text-gray-900">Charpente</div>
                              <div className="text-sm text-yellow-600">Affaissement possible</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                        <div className="text-xs text-red-700 font-semibold">⚠️ Diagnostic complet requis</div>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl mb-3">🔒</div>
                        <button 
                          type="button"
                          onClick={openModal}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg"
                          style={{
                            WebkitTapHighlightColor: 'transparent',
                            touchAction: 'manipulation',
                            cursor: 'pointer',
                            WebkitAppearance: 'none',
                          }}
                        >
                          Débloquer le rapport
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview 4 - Recommandations */}
                <div className="relative group">
                  <div className="bg-white border border-gray-200 rounded-xl p-6 relative overflow-hidden shadow-lg">
                    <div className="opacity-70 blur-sm">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Analyse Financière</h3>
                      <div className="space-y-3 mb-3">
                        <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                          <span className="text-sm text-gray-700">Prix au m²</span>
                          <span className="text-red-600 font-bold">+15% marché</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                          <span className="text-sm text-gray-700">Travaux urgents</span>
                          <span className="text-orange-600 font-bold">3 critiques</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                          <span className="text-sm text-gray-700">Budget travaux</span>
                          <span className="text-yellow-600 font-bold">45,000€+</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-700">Rentabilité locative</span>
                          <span className="text-gray-600 font-bold">Faible</span>
                        </div>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-2 mt-2">
                        <div className="text-xs text-red-700 font-semibold mb-1">💡 Conseil expert</div>
                        <div className="text-xs text-red-600">Négociation recommandée avant engagement</div>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl mb-3">🔒</div>
                        <button 
                          type="button"
                          onClick={openModal}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg"
                          style={{
                            WebkitTapHighlightColor: 'transparent',
                            touchAction: 'manipulation',
                            cursor: 'pointer',
                            WebkitAppearance: 'none',
                          }}
                        >
                          Débloquer le rapport
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA principal */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={openModal}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-12 py-5 rounded-2xl text-xl font-bold shadow-2xl hover:shadow-3xl transition-all"
                  style={{
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                    cursor: 'pointer',
                    WebkitAppearance: 'none',
                  }}
                >
                  🔓 Débloquer votre rapport complet
                </button>
                <p className="text-sm text-gray-600 mt-4">
                  ✓ Paiement sécurisé • ✓ Rapport instantané • ✓ Garantie satisfait ou remboursé
                </p>
              </div>
            </div>
          )}
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
