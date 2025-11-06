import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Générer un Rapport d'Analyse Immobilière | VerifieMaMaison.fr",
  description: "Générez un rapport complet d'analyse immobilière en quelques minutes. Entrez l'adresse du bien et obtenez un rapport détaillé avec risques, DPE, marché, écoles et recommandations.",
  robots: {
    index: false, // Page nécessite authentification
    follow: false,
  },
};

export default function GenerateReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

