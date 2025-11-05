'use client';

import Container from '../Container';
import { HomeIcon, CreditCardIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

/**
 * Section "Comment ça marche" pour VerifieMaMaison
 */
export default function HowItWorks() {
  const steps = [
    {
      icon: HomeIcon,
      title: 'Remplissez le formulaire',
      description: 'Décrivez votre bien immobilier en détail (état général, toiture, isolation, installations, etc.)'
    },
    {
      icon: CreditCardIcon,
      title: 'Achetez votre rapport',
      description: 'Choisissez votre pack (1, 3 ou 10 rapports) et payez en ligne de manière sécurisée'
    },
    {
      icon: DocumentTextIcon,
      title: 'Recevez votre rapport',
      description: 'Obtenez instantanément votre rapport complet (PDF + version interactive en ligne)'
    }
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-white">
      <Container>
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Comment ça marche ?
            </span>
          </h2>
          <p className="text-gray-600 text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-4">
            En 3 étapes simples, obtenez un rapport d'analyse complet sur n'importe quel bien immobilier
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="bg-white border border-purple-200 rounded-lg sm:rounded-xl p-6 sm:p-8 text-center hover:border-purple-500 hover:shadow-lg transition-all duration-200 shadow-md"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full mb-4 sm:mb-6">
                  <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">{step.title}</h3>
                <p className="text-sm sm:text-base text-gray-600">{step.description}</p>
                <div className="mt-4 sm:mt-6 text-purple-600 font-bold text-xl sm:text-2xl">
                  {index + 1}
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

