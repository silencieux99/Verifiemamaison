import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "./(context)/AuthContext";
import AnalyticsTracker from "./(components)/AnalyticsTracker";
import PageTracker from "./(components)/PageTracker";
import StructuredData from "./(components)/StructuredData";

export const viewport: Viewport = {
  themeColor: "#9333ea",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: {
    default: "VerifieMaMaison.fr - Analyse Immobilière Complète en Ligne | Rapport Instantané",
    template: "%s | VerifieMaMaison.fr"
  },
  description: "Analysez n'importe quel bien immobilier en quelques minutes. Rapport complet avec risques naturels, DPE, marché immobilier, écoles, commodités, et recommandations IA. Service français fiable et instantané.",
  keywords: [
    "analyse immobilière",
    "rapport maison",
    "vérification bien immobilier",
    "diagnostic immobilier en ligne",
    "analyse bien avant achat",
    "rapport complet maison",
    "risques naturels immobilier",
    "DPE diagnostic performance énergétique",
    "marché immobilier analyse",
    "écoles proximité",
    "commodités quartier",
    "rapport immobilière IA",
    "vérifier maison avant achat",
    "analyse quartier immobilier",
    "rapport détaillé bien immobilier"
  ],
  authors: [{ name: "VerifieMaMaison.fr" }],
  creator: "VerifieMaMaison.fr",
  publisher: "VerifieMaMaison.fr",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.verifiemamaison.fr"),
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
    title: "VerifieMaMaison.fr - Analyse Immobilière Complète en Ligne",
    description: "Analysez n'importe quel bien immobilier en quelques minutes. Rapport complet avec risques naturels, DPE, marché immobilier, écoles, commodités, et recommandations IA.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.verifiemamaison.fr",
    siteName: "VerifieMaMaison.fr",
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.verifiemamaison.fr"}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "VerifieMaMaison.fr - Analyse Immobilière Complète",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VerifieMaMaison.fr - Analyse Immobilière Complète en Ligne",
    description: "Analysez n'importe quel bien immobilier en quelques minutes. Rapport complet avec risques, DPE, marché, écoles et recommandations IA.",
    images: [`${process.env.NEXT_PUBLIC_SITE_URL || "https://www.verifiemamaison.fr"}/og-image.jpg`],
    creator: "@VerifieMaMaison",
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
    yahoo: process.env.YAHOO_VERIFICATION,
  },
  category: "Immobilier",
  classification: "Service d'analyse immobilière",
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
    <html lang="fr" className="scroll-smooth" style={{ colorScheme: 'dark' }}>
      <head>
        <meta name="theme-color" content="#0A0B0D" />
        <meta name="color-scheme" content="dark" />
      </head>
      <body className="font-sans antialiased bg-[#0A0B0D] text-white">
        <StructuredData />
        <AuthProvider>
          <AnalyticsTracker />
          <PageTracker />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

