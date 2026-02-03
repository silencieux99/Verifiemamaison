'use client';

import Container from '../Container';
import { Disclosure, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

const faqs = [
  {
    question: "Quelle est la précision de l'IA ?",
    answer: "Notre IA croise les données de plus de 50 sources officielles (Notaires, Cadastre, Insee, Géorisques...). Elle atteint une précision de 98% sur les estimations de risques et de prix, bien supérieure aux estimations humaines classiques."
  },
  {
    question: "Le rapport est-il valable juridiquement ?",
    answer: "Le rapport est informatif et ne remplace pas les diagnostics obligatoires (DPE, Amiante...). Cependant, il va beaucoup plus loin en révélant des informations que les diagnostics ne couvrent pas : nuisances sonores, projets d'urbanisme à venir, évolution du quartier, criminalité..."
  },
  {
    question: "Combien de temps faut-il pour obtenir le rapport ?",
    answer: "L'analyse est instantanée. Dès que vous confirmez l'adresse, nos serveurs génèrent votre rapport complet en moins de 45 secondes."
  },
  {
    question: "Puis-je analyser un bien partout en France ?",
    answer: "Oui, nous couvrons 100% du territoire français, y compris les zones rurales et les DOM-TOM."
  }
];

export default function Faq() {
  return (
    <section className="py-24 bg-brand-950">
      <Container className="max-w-3xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Questions Fréquentes
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <Disclosure key={index} as="div" className="border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm overflow-hidden">
              {({ open }) => (
                <>
                  <Disclosure.Button className="flex w-full justify-between items-center px-6 py-5 text-left text-white hover:bg-white/5 transition-colors">
                    <span className="font-medium text-lg">{faq.question}</span>
                    <ChevronDownIcon
                      className={`${open ? 'rotate-180 transform' : ''} h-5 w-5 text-brand-400 transition-transform duration-200`}
                    />
                  </Disclosure.Button>
                  <Transition
                    enter="transition duration-100 ease-out"
                    enterFrom="transform scale-95 opacity-0"
                    enterTo="transform scale-100 opacity-100"
                    leave="transition duration-75 ease-out"
                    leaveFrom="transform scale-100 opacity-100"
                    leaveTo="transform scale-95 opacity-0"
                  >
                    <Disclosure.Panel className="px-6 pb-6 pt-2 text-gray-400 leading-relaxed">
                      {faq.answer}
                    </Disclosure.Panel>
                  </Transition>
                </>
              )}
            </Disclosure>
          ))}
        </div>
      </Container>
    </section>
  );
}
