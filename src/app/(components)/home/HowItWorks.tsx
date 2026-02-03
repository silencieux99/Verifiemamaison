'use client';

import Container from '../Container';

export default function HowItWorks() {
  const steps = [
    {
      id: '01',
      title: 'Localisation',
      text: "Saisissez l'adresse. Notre système identifie la parcelle et agrège instantanément les données cadastrales."
    },
    {
      id: '02',
      title: 'Traitement',
      text: "L'IA croise 127 points de contrôle : risques, marché, DPE, urbanisme, voisinage et historique des ventes."
    },
    {
      id: '03',
      title: 'Restitution',
      text: "Recevez un rapport d'expertise complet, clair et actionnable pour négocier ou vous projeter."
    }
  ];

  return (
    <section className="py-32 bg-white border-t border-gray-100">
      <Container>
        <div className="flex flex-col md:flex-row justify-between items-start mb-24 gap-8">
          <div className="max-w-xl">
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-6">
              Une technologie <span className="font-serif italic text-gray-400">invisible</span>.
            </h2>
            <p className="text-gray-500 font-light leading-relaxed">
              Nous avons simplifié l'audit immobilier à l'extrême. Derrière chaque rapport se cachent des algorithmes complexes qui sécurisent votre investissement.
            </p>
          </div>
          <div className="hidden md:block">
            <div className="px-4 py-2 border border-black/5 rounded-full text-xs text-gray-500 uppercase tracking-widest bg-gray-50">
              Workflow
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-t border-gray-100">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`group py-12 pr-12 border-b md:border-b-0 border-gray-100 ${index !== 2 ? 'md:border-r' : ''} bg-transparent hover:bg-gray-50 transition-colors duration-500`}
            >
              <div className="text-xs font-mono text-gray-400 mb-8 group-hover:text-black transition-colors">
                {step.id} / PROCESS
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-4 group-hover:text-emerald-600 transition-colors">
                {step.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed font-light">
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
