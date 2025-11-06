import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  
  return {
    title: `Rapport d'Analyse Immobilière #${id}`,
    description: "Consultez votre rapport complet d'analyse immobilière avec risques naturels, DPE, marché immobilier, écoles, commodités et recommandations IA.",
    robots: {
      index: false, // Rapports privés, pas d'indexation
      follow: false,
    },
    openGraph: {
      title: `Rapport d'Analyse Immobilière | VerifieMaMaison.fr`,
      description: "Rapport complet d'analyse immobilière avec données détaillées.",
      type: "website",
    },
  };
}

export default function ReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

