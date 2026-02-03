'use client';

import Container from '../Container';

export default function Testimonials() {
  return (
    <section className="py-32 bg-gray-50">
      <Container>
        <div className="border-l-2 border-emerald-500 pl-8 md:pl-12 py-4 relative">

          <blockquote className="text-2xl md:text-4xl font-light leading-snug text-gray-900 max-w-4xl">
            "J'ai failli acheter une maison avec un risque de retrait-gonflement des argiles critique. VerifieMaMaison m'a permis d'éviter <span className="text-emerald-600 font-normal">un cauchemar financier</span>."
          </blockquote>

          <div className="mt-12 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-sm font-medium text-gray-900">
              PL
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">Pierre Lefebvre</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Investisseur Immobilier • Bordeaux</div>
            </div>
          </div>
        </div>

        {/* Simple Stats Line */}
        <div className="mt-32 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-gray-200 pt-12">
          <div>
            <div className="text-3xl font-light text-gray-900 mb-1">2.3M€</div>
            <div className="text-xs text-gray-500 uppercase tracking-widest">Économisés par nos clients</div>
          </div>
          <div>
            <div className="text-3xl font-light text-gray-900 mb-1">127</div>
            <div className="text-xs text-gray-500 uppercase tracking-widest">Points de contrôle</div>
          </div>
          <div>
            <div className="text-3xl font-light text-gray-900 mb-1">&lt; 1min</div>
            <div className="text-xs text-gray-500 uppercase tracking-widest">Temps d'analyse</div>
          </div>
          <div>
            <div className="text-3xl font-light text-gray-900 mb-1">98%</div>
            <div className="text-xs text-gray-500 uppercase tracking-widest">Satisfaction</div>
          </div>
        </div>
      </Container>
    </section>
  );
}
