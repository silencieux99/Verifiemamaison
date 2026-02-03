import { Metadata } from "next";
import { Header } from "./(components)/Header";
import HomeHero from "./(components)/home/HomeHero";
import HowItWorks from "./(components)/home/HowItWorks";
import Testimonials from "./(components)/home/Testimonials";
import Faq from "./(components)/home/Faq";
import HomeFooter from "./(components)/home/HomeFooter";

export const metadata: Metadata = {
  title: "Analyse Immobilière Complète en Ligne - Rapport Instantané | VerifieMaMaison.fr",
  description: "Analysez n'importe quel bien immobilier en quelques minutes. Rapport complet avec rentabilité locative, établissements scolaires, commodités, sécurité et criminalité, prix du marché, historique des transactions DVF, risques naturels (inondation, sismicité), DPE, qualité de l'air, et recommandations IA. Tout ce dont vous devez savoir sur votre bien immobilier.",
  keywords: [
    "analyse immobilière en ligne",
    "rapport maison complet",
    "diagnostic bien immobilier",
    "rentabilité locative calcul",
    "rendement locatif estimation",
    "écoles proximité bien immobilier",
    "établissements scolaires quartier",
    "commodités services proximité",
    "sécurité quartier criminalité",
    "taux criminalité immobilier",
    "prix marché immobilier",
    "prix au m² estimation",
    "historique transactions DVF",
    "risques naturels maison",
    "inondation sismicité radon",
    "DPE diagnostic énergétique",
    "marché immobilier analyse",
    "transactions immobilières",
    "qualité air immobilier",
    "rapport IA immobilier",
    "vérifier maison avant achat",
    "analyse quartier complet",
    "tout savoir bien immobilier"
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
    <div className="min-h-screen bg-brand-950 text-white selection:bg-brand-500/30">
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

