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
    <section className="py-20 bg-gray-900">
      <Container>
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Comment ça marche ?
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            En 3 étapes simples, obtenez un rapport d'analyse complet sur n'importe quel bien immobilier
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="bg-gray-800/50 border border-purple-500/20 rounded-lg p-8 text-center hover:border-purple-500/40 transition-all duration-200"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full mb-6">
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">{step.title}</h3>
                <p className="text-gray-400">{step.description}</p>
                <div className="mt-6 text-purple-400 font-bold text-2xl">
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

