import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "./(context)/AuthContext";
import AnalyticsTracker from "./(components)/AnalyticsTracker";
import PageTracker from "./(components)/PageTracker";

export const viewport: Viewport = {
  themeColor: "#9333ea",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  title: {
    default: "VerifieMaMaison.fr - Rapport d'Analyse Immobilière Fiable",
    template: "%s | VerifieMaMaison.fr"
  },
  description: "Sécurisez votre achat immobilier. Obtenez un rapport d'analyse complet (structure, toiture, isolation, installations) en quelques minutes pour n'importe quel bien.",
  keywords: [
    "rapport analyse maison",
    "vérification bien immobilier",
    "inspection immobilière",
    "diagnostic maison avant achat",
    "rapport structure maison",
    "vérifier bien immobilier",
    "analyse immobilière en ligne",
    "rapport maison fiable",
    "diagnostic complet maison"
  ],
  authors: [{ name: "VerifieMaMaison.fr" }],
  creator: "VerifieMaMaison.fr",
  publisher: "VerifieMaMaison.fr",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  openGraph: {
    title: "VerifieMaMaison.fr - Rapport d'analyse immobilière instantané",
    description: "Service français d'analyse de biens immobiliers. Rapport complet en quelques minutes avec score global et recommandations détaillées.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    siteName: "VerifieMaMaison.fr",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "VerifieMaMaison.fr - Rapport d'analyse immobilière",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VerifieMaMaison.fr - Rapport d'analyse immobilière instantané",
    description: "Service français d'analyse de biens immobiliers. Rapport complet en quelques minutes.",
    images: ["/api/og"],
    creator: "@VerifieMaMaison",
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
  icons: {
    icon: [
      { url: '/favicon.png', sizes: 'any' },
      { url: '/favicon.png', type: 'image/png' },
    ],
    apple: [
      { url: '/favicon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="scroll-smooth">
      <head>
        <meta name="theme-color" content="#9333ea" />
      </head>
      <body className="font-sans antialiased">
        <AuthProvider>
          <AnalyticsTracker />
          <PageTracker />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

