import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion - VerifieMaMaison.fr",
  description: "Connectez-vous à votre compte VerifieMaMaison.fr pour accéder à vos rapports d'analyse immobilière.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

