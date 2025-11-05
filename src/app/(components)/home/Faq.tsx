'use client';

import { useState } from 'react';
import Container from '../Container';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

/**
 * Section FAQ pour VerifieMaMaison
 */
export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "Que contient précisément le rapport VerifieMaMaison ?",
      answer: "Le rapport comprend une analyse complète de la structure, de la toiture, de l'isolation, des installations électriques et plomberie, un score global de l'état du bien, des alertes sur les problèmes majeurs détectés, et des recommandations personnalisées. Tout cela basé sur les informations que vous fournissez."
    },
    {
      question: "En combien de temps vais-je recevoir le rapport ?",
      answer: "Le rapport est généré automatiquement en quelques minutes après la soumission du formulaire et le paiement. Vous recevrez à la fois un PDF téléchargeable et un lien vers la version interactive en ligne."
    },
    {
      question: "Mes informations sont-elles confidentielles ?",
      answer: "Absolument. Toutes vos données sont sécurisées et cryptées. Nous ne partageons aucune information avec des tiers. Vos rapports sont uniquement accessibles depuis votre compte utilisateur."
    },
    {
      question: "Que faire si le rapport signale un problème sérieux ?",
      answer: "Si des anomalies majeures sont détectées, nous vous recommandons de faire appel à un expert professionnel pour une inspection approfondie. Le rapport peut vous aider à négocier le prix ou à demander des travaux avant l'achat."
    },
    {
      question: "Quelle est la source des données utilisées ?",
      answer: "Le rapport est principalement basé sur les informations que vous fournissez dans le formulaire. À l'avenir, nous pourrions intégrer des données publiques (risques naturels, diagnostics obligatoires, etc.) pour enrichir l'analyse."
    },
    {
      question: "Puis-je utiliser un rapport pour plusieurs biens ?",
      answer: "Non, chaque rapport correspond à un bien spécifique. Si vous souhaitez analyser plusieurs biens, nous vous recommandons d'acheter un pack (3 ou 10 rapports) qui vous permet d'économiser sur le prix unitaire."
    }
  ];

  return (
    <section id="faq" className="py-20 bg-gray-900">
      <Container>
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Questions fréquentes
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Tout ce que vous devez savoir sur VerifieMaMaison
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-gray-800/50 border border-purple-500/20 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-800 transition-colors"
              >
                <span className="text-white font-semibold pr-4">{faq.question}</span>
                <ChevronDownIcon
                  className={`h-5 w-5 text-purple-400 flex-shrink-0 transition-transform ${
                    openIndex === index ? 'transform rotate-180' : ''
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-6 py-4 border-t border-purple-500/20">
                  <p className="text-gray-300">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

