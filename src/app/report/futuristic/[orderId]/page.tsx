import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import FuturisticReportView from '@/components/FuturisticReportView';
import { convertHouseProfileToSections } from '@/lib/convert-house-profile-to-sections';

export const metadata: Metadata = {
  title: 'Rapport Interactif - VerifieMaMaison',
  description: 'Consultez votre rapport immobilier interactif détaillé',
};

async function getReportData(orderId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/report/interactive/${orderId}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('Erreur lors de la récupération du rapport:', error);
    return null;
  }
}

export default async function FuturisticReportPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const reportData = await getReportData(orderId);

  if (!reportData) {
    notFound();
  }

  const { sections, vehicleInfo, ai, pdfUrl } = reportData;

  return (
    <FuturisticReportView
      sections={sections}
      vehicleInfo={vehicleInfo}
      ai={ai}
      reportId={orderId}
      pdfUrl={pdfUrl}
    />
  );
}
