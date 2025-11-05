'use client';

import Container from '../Container';

/**
 * Section Témoignages pour VerifieMaMaison
 */
export default function Testimonials() {
  const testimonials = [
    {
      name: "Jean D.",
      location: "Paris",
      text: "Grâce à VerifieMaMaison, j'ai découvert des problèmes dans la maison que je comptais acheter et j'ai pu éviter une mauvaise affaire !",
      rating: 5
    },
    {
      name: "Marie L.",
      location: "Lyon",
      text: "Le rapport est très détaillé et m'a permis de négocier le prix avec le vendeur. Excellent investissement.",
      rating: 5
    },
    {
      name: "Pierre M.",
      location: "Marseille",
      text: "Service rapide et professionnel. Le rapport interactif est très pratique pour partager avec mon notaire.",
      rating: 5
    }
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gray-50">
      <Container>
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Ce que disent nos clients
            </span>
          </h2>
          <p className="text-gray-600 text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-4">
            Déjà des milliers de rapports générés avec satisfaction
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white border border-purple-200 rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center gap-1 mb-3 sm:mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <span key={i} className="text-yellow-500 text-sm sm:text-base">★</span>
                ))}
              </div>
              <p className="text-gray-700 mb-3 sm:mb-4 italic text-sm sm:text-base">"{testimonial.text}"</p>
              <div className="text-xs sm:text-sm text-gray-600">
                <p className="font-semibold text-gray-900">{testimonial.name}</p>
                <p>{testimonial.location}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Section statistiques améliorée */}
        <div className="mt-8 sm:mt-12 md:mt-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 border border-purple-200 shadow-lg relative">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 items-center relative">
                {/* Statistique 1 - Rapports générés */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 text-center sm:text-left relative z-10">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-1">
                      <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        5 000+
                      </span>
                    </div>
                    <p className="text-sm sm:text-base text-gray-600 font-medium">
                      Rapports générés
                    </p>
                  </div>
                </div>

                {/* Séparateur vertical pour desktop */}
                <div className="hidden sm:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-20 bg-gradient-to-b from-transparent via-purple-300 to-transparent z-0"></div>

                {/* Statistique 2 - Satisfaction */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 text-center sm:text-left relative z-10">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-1">
                      <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        98%
                      </span>
                    </div>
                    <p className="text-sm sm:text-base text-gray-600 font-medium">
                      Clients satisfaits
                    </p>
                  </div>
                </div>
              </div>

              {/* Badge de confiance en bas */}
              <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-purple-200">
                <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Garantie qualité</span>
                  </div>
                  <div className="hidden sm:block w-1 h-1 rounded-full bg-gray-400"></div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9.5H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Résultats instantanés</span>
                  </div>
                  <div className="hidden sm:block w-1 h-1 rounded-full bg-gray-400"></div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Données sécurisées</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

