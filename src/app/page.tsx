import { Metadata } from "next";
import { Header } from "./(components)/Header";
import HomeHero from "./(components)/home/HomeHero";
import HowItWorks from "./(components)/home/HowItWorks";
import Pricing from "./(components)/home/Pricing";
import Testimonials from "./(components)/home/Testimonials";
import Faq from "./(components)/home/Faq";
import HomeFooter from "./(components)/home/HomeFooter";

export const metadata: Metadata = {
  title: "Rapport d'analyse de maison – Inspection immobilière en ligne | VerifieMaMaison.fr",
  description: "Obtenez en quelques minutes un rapport complet sur l'état d'un bien immobilier : structure, toiture, isolation, etc., avant de l'acheter. Fiable et instantané.",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100">
      <Header />
      <main>
        <HomeHero />
        <HowItWorks />
        <Pricing />
        <Testimonials />
        <Faq />
      </main>
      <HomeFooter />
    </div>
  );
}

