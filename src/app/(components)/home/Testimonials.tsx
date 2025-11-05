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
    <section className="py-20 bg-gray-800">
      <Container>
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Ce que disent nos clients
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Déjà des milliers de rapports générés avec satisfaction
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-gray-900 border border-purple-500/20 rounded-lg p-6"
            >
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <span key={i} className="text-yellow-400">★</span>
                ))}
              </div>
              <p className="text-gray-300 mb-4 italic">"{testimonial.text}"</p>
              <div className="text-sm text-gray-400">
                <p className="font-semibold text-white">{testimonial.name}</p>
                <p>{testimonial.location}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-400 text-lg">
            <span className="text-white font-bold text-2xl">5 000+</span> rapports générés
            <span className="mx-2">•</span>
            <span className="text-white font-bold text-2xl">98%</span> de clients satisfaits
          </p>
        </div>
      </Container>
    </section>
  );
}

