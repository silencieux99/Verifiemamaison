import { Metadata } from 'next';
import { Header } from '@/app/(components)/Header';
import Container from '@/app/(components)/Container';
import HomeFooter from '@/app/(components)/home/HomeFooter';

export const metadata: Metadata = {
  title: "Mentions légales - VerifieMaMaison.fr",
  description: "Mentions légales, politique de confidentialité et crédits de VerifieMaMaison.fr",
};

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800">
      <Header />
      <main className="py-20">
        <Container>
          <div className="max-w-4xl mx-auto prose prose-invert">
            <h1 className="text-4xl font-bold mb-8">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Mentions légales
              </span>
            </h1>

            <section id="about" className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">À propos</h2>
              <p className="text-gray-300 mb-4">
                VerifieMaMaison.fr est un service en ligne d'analyse de biens immobiliers. 
                Notre mission est d'aider les acheteurs immobiliers à prendre des décisions éclairées 
                en fournissant des rapports d'analyse complets et détaillés.
              </p>
              <p className="text-gray-300">
                Ce service est fortement inspiré de VerifieMaVoiture, adapté au secteur immobilier.
              </p>
            </section>

            <section id="credits" className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">Crédits</h2>
              <p className="text-gray-300 mb-4">
                VerifieMaMaison.fr s'inspire de la structure et du design de VerifieMaVoiture.fr.
              </p>
              <p className="text-gray-300 mb-4">
                Technologies utilisées :
              </p>
              <ul className="text-gray-300 list-disc list-inside space-y-2">
                <li>Next.js - Framework React</li>
                <li>Firebase - Authentification et base de données</li>
                <li>Stripe - Paiements en ligne</li>
                <li>Tailwind CSS - Styles</li>
                <li>TypeScript - Langage de programmation</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">Politique de confidentialité</h2>
              <p className="text-gray-300 mb-4">
                Vos données sont sécurisées et ne sont jamais partagées avec des tiers. 
                Nous utilisons Firebase pour l'authentification et le stockage des données.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Contact</h2>
              <p className="text-gray-300">
                Pour toute question, contactez-nous à :{' '}
                <a href="mailto:contact@verifiemamaison.fr" className="text-purple-400 hover:underline">
                  contact@verifiemamaison.fr
                </a>
              </p>
            </section>
          </div>
        </Container>
      </main>
      <HomeFooter />
    </div>
  );
}

