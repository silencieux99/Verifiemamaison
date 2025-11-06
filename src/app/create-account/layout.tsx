import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Créer un Compte - VerifieMaMaison.fr",
  description: "Créez votre compte VerifieMaMaison.fr pour générer des rapports d'analyse immobilière complets.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CreateAccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

