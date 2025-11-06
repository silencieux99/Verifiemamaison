import { Metadata } from "next";
import { Header } from "./(components)/Header";
import HomeHero from "./(components)/home/HomeHero";
import HowItWorks from "./(components)/home/HowItWorks";
import Testimonials from "./(components)/home/Testimonials";
import Faq from "./(components)/home/Faq";
import HomeFooter from "./(components)/home/HomeFooter";

export const metadata: Metadata = {
  title: "Analyse Immobilière Complète en Ligne - Rapport Instantané | VerifieMaMaison.fr",
  description: "Analysez n'importe quel bien immobilier en quelques minutes. Rapport complet avec risques naturels (inondation, sismicité), DPE, marché immobilier (prix au m², transactions DVF), écoles, commodités, qualité de l'air, et recommandations IA. Service français fiable.",
  keywords: [
    "analyse immobilière en ligne",
    "rapport maison complet",
    "diagnostic bien immobilier",
    "risques naturels maison",
    "DPE diagnostic énergétique",
    "marché immobilier analyse",
    "prix immobilier quartier",
    "transactions DVF",
    "écoles proximité",
    "commodités quartier",
    "qualité air immobilier",
    "rapport IA immobilier",
    "vérifier maison avant achat",
    "analyse quartier complet"
  ],
  openGraph: {
    title: "Analyse Immobilière Complète en Ligne - VerifieMaMaison.fr",
    description: "Analysez n'importe quel bien immobilier en quelques minutes. Rapport complet avec risques, DPE, marché, écoles et recommandations IA.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Analyse Immobilière Complète en Ligne - VerifieMaMaison.fr",
    description: "Rapport complet d'analyse immobilière en quelques minutes. Risques, DPE, marché, écoles, commodités.",
  },
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100">
      <Header />
      <main>
        <HomeHero />
        <HowItWorks />
        <Testimonials />
        <Faq />
      </main>
      <HomeFooter />
    </div>
  );
}

