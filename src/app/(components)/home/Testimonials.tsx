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

        <div className="mt-8 sm:mt-12 text-center px-4">
          <p className="text-gray-600 text-sm sm:text-base md:text-lg">
            <span className="text-gray-900 font-bold text-xl sm:text-2xl">5 000+</span> rapports générés
            <span className="mx-2 text-gray-400">•</span>
            <span className="text-gray-900 font-bold text-xl sm:text-2xl">98%</span> de clients satisfaits
          </p>
        </div>
      </Container>
    </section>
  );
}

