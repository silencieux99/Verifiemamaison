import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { consumeCredit } from '@/lib/user';
import { HouseData, HouseReport, ReportAnalysis, Alert } from '@/lib/types';
import { FieldValue } from '@/lib/firebase-admin';

/**
 * API de génération de rapport pour VerifieMaMaison
 */
export async function POST(req: NextRequest) {
  try {
    const authToken = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Vérifier le token Firebase
    let decodedToken;
    try {
      if (!adminAuth) {
        return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
      }
      decodedToken = await adminAuth.verifyIdToken(authToken);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const uid = decodedToken.uid;
    const { houseData } = await req.json();

    if (!houseData) {
      return NextResponse.json({ error: 'House data is required' }, { status: 400 });
    }

    // Vérifier et consommer un crédit
    const hasCredit = await consumeCredit(uid, 'unite', 'Génération rapport maison');
    if (!hasCredit) {
      return NextResponse.json({ error: 'No credits available' }, { status: 403 });
    }

    // Enrichir avec les données immobilières (API Adresse + DVF)
    let propertyData = null;
    if (houseData.address && houseData.postalCode && houseData.city) {
      try {
        const propertyResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/property/lookup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: houseData.address,
            postalCode: houseData.postalCode,
            city: houseData.city,
          }),
        });
        if (propertyResponse.ok) {
          propertyData = await propertyResponse.json();
        }
      } catch (error) {
        console.error('Erreur récupération données immobilières:', error);
      }
    }

    // Générer le rapport (enrichi avec les données immobilières)
    const report = generateHouseReport(houseData as HouseData, propertyData);

    // Sauvegarder le rapport en base
    if (!adminDb) {
      return NextResponse.json({ error: 'Firebase Admin DB not initialized' }, { status: 500 });
    }

    const reportRef = await adminDb.collection('reports').add({
      uid,
      houseData,
      propertyData, // Données enrichies de l'API
      reportData: report,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      pdfGenerated: false,
      emailSent: false,
    });

    return NextResponse.json({
      reportId: reportRef.id,
      report,
    });
  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Génère un rapport d'analyse de maison basé sur les données fournies
 * Enrichi avec les données immobilières (DVF, géocodage, etc.)
 */
function generateHouseReport(houseData: HouseData, propertyData?: any): HouseReport {
  const analysis: ReportAnalysis = {
    structure: generateStructureAnalysis(houseData, propertyData),
    roof: generateRoofAnalysis(houseData),
    insulation: generateInsulationAnalysis(houseData),
    installations: generateInstallationsAnalysis(houseData),
    interior: generateInteriorAnalysis(houseData, propertyData),
    overall: generateOverallAnalysis(houseData, propertyData),
  };

  const score = calculateScore(houseData);
  const alerts = generateAlerts(houseData);
  const recommendations = generateRecommendations(houseData, score, alerts, propertyData);

  return {
    houseData,
    analysis,
    score,
    alerts,
    recommendations,
  };
}

function generateStructureAnalysis(data: HouseData, propertyData?: any): string {
  let text = '';
  if (data.generalCondition === 'neuf') {
    text = 'Bien en excellent état, structure récente et solide. Aucun problème structurel détecté.';
  } else if (data.generalCondition === 'bon_etat') {
    text = 'Bien en bon état général. Structure solide, quelques travaux d\'entretien mineurs à prévoir.';
  } else if (data.generalCondition === 'moyen') {
    text = 'Bien nécessitant des travaux de rénovation. Structure globale acceptable mais attention aux points d\'usure.';
  } else {
    text = 'Bien nécessitant des travaux importants. Structure à surveiller, recommandation d\'expertise approfondie.';
  }
  
  if (propertyData?.transactions && propertyData.transactions.length > 0) {
    text += ` Historique des transactions: ${propertyData.transactions.length} ventes récentes détectées dans le secteur.`;
  }
  
  return text;
}

function generateRoofAnalysis(data: HouseData): string {
  if (data.roofCondition === 'neuf' || data.roofCondition === 'bon') {
    return 'Toiture en bon état, pas de travaux urgents à prévoir.';
  } else if (data.roofCondition === 'moyen') {
    return 'Toiture présentant des signes d\'usure. Surveillance recommandée, travaux à prévoir dans les 5-10 ans.';
  } else {
    return 'Toiture dégradée nécessitant des travaux urgents. Risque de fuites et d\'infiltrations.';
  }
}

function generateInsulationAnalysis(data: HouseData): string {
  if (data.insulation === 'excellente') {
    return 'Isolation excellente, performance énergétique optimale.';
  } else if (data.insulation === 'complete') {
    return 'Isolation complète, bonne performance énergétique.';
  } else if (data.insulation === 'partielle') {
    return 'Isolation partielle, amélioration possible pour réduire les coûts de chauffage.';
  } else {
    return 'Absence d\'isolation, travaux importants à prévoir pour améliorer la performance énergétique.';
  }
}

function generateInstallationsAnalysis(data: HouseData): string {
  const parts: string[] = [];
  
  if (data.electrical === 'dangereux') {
    parts.push('Installation électrique dangereuse, mise aux normes urgente requise.');
  } else if (data.electrical === 'obsolète') {
    parts.push('Installation électrique obsolète, mise aux normes recommandée.');
  }
  
  if (data.plumbing === 'critique') {
    parts.push('Plomberie en mauvais état, risques de fuites élevés.');
  } else if (data.plumbing === 'obsolète') {
    parts.push('Plomberie obsolète, rénovation recommandée.');
  }
  
  return parts.length > 0 ? parts.join(' ') : 'Installations en bon état, conformes aux normes.';
}

function generateInteriorAnalysis(data: HouseData, propertyData?: any): string {
  let text = `Bien de ${data.surface}m²${data.rooms ? ` avec ${data.rooms} pièces` : ''}${data.yearBuilt ? `, construit en ${data.yearBuilt}` : ''}. État général: ${data.generalCondition}.`;
  if (propertyData?.pricePerM2) {
    text += ` Prix moyen au m² dans le secteur: ${propertyData.pricePerM2.toLocaleString('fr-FR')}€/m²`;
  }
  return text;
}

function generateOverallAnalysis(data: HouseData, propertyData?: any): string {
  let text = `Synthèse globale du bien situé ${data.address}, ${data.postalCode} ${data.city}. Analyse complète des différents aspects structurels et installations.`;
  if (propertyData?.averagePrice) {
    text += ` Prix moyen des transactions récentes dans le secteur: ${propertyData.averagePrice.toLocaleString('fr-FR')}€`;
  }
  return text;
}

function calculateScore(data: HouseData): number {
  let score = 50; // Score de base
  
  // État général
  if (data.generalCondition === 'neuf') score += 30;
  else if (data.generalCondition === 'bon_etat') score += 20;
  else if (data.generalCondition === 'moyen') score += 10;
  else if (data.generalCondition === 'renover') score -= 10;
  else score -= 20;
  
  // Toiture
  if (data.roofCondition === 'neuf' || data.roofCondition === 'bon') score += 10;
  else if (data.roofCondition === 'moyen') score += 5;
  else score -= 10;
  
  // Isolation
  if (data.insulation === 'excellente') score += 10;
  else if (data.insulation === 'complete') score += 5;
  else if (data.insulation === 'partielle') score -= 5;
  else score -= 10;
  
  // Installations
  if (data.electrical === 'conforme') score += 5;
  else if (data.electrical === 'obsolète') score -= 5;
  else score -= 15;
  
  if (data.plumbing === 'moderne') score += 5;
  else if (data.plumbing === 'acceptable') score += 0;
  else if (data.plumbing === 'obsolète') score -= 5;
  else score -= 15;
  
  return Math.max(0, Math.min(100, score));
}

function generateAlerts(data: HouseData): Alert[] {
  const alerts: Alert[] = [];
  
  if (data.diagnostics?.amiante) {
    alerts.push({
      level: 'error',
      category: 'Amiante',
      message: 'Présence suspectée d\'amiante. Expertise professionnelle obligatoire.',
    });
  }
  
  if (data.electrical === 'dangereux') {
    alerts.push({
      level: 'error',
      category: 'Installation électrique',
      message: 'Installation électrique dangereuse. Mise aux normes urgente requise.',
    });
  }
  
  if (data.roofCondition === 'critique' || data.roofCondition === 'degrade') {
    alerts.push({
      level: 'warning',
      category: 'Toiture',
      message: 'Toiture dégradée. Risque de fuites et d\'infiltrations.',
    });
  }
  
  if (data.insulation === 'aucune') {
    alerts.push({
      level: 'warning',
      category: 'Isolation',
      message: 'Absence d\'isolation. Coûts de chauffage élevés à prévoir.',
    });
  }
  
  return alerts;
}

function generateRecommendations(data: HouseData, score: number, alerts: Alert[], propertyData?: any): string[] {
  const recommendations: string[] = [];
  
  if (score < 50) {
    recommendations.push('Faire appel à un expert professionnel pour une inspection approfondie avant achat.');
  }
  
  if (alerts.some(a => a.level === 'error')) {
    recommendations.push('Négocier le prix en tenant compte des travaux urgents à prévoir.');
  }
  
  if (data.insulation === 'aucune' || data.insulation === 'partielle') {
    recommendations.push('Prévoir des travaux d\'isolation pour améliorer la performance énergétique.');
  }
  
  if (data.roofCondition === 'moyen' || data.roofCondition === 'degrade') {
    recommendations.push('Surveiller l\'état de la toiture et prévoir des travaux dans les prochaines années.');
  }
  
  if (data.electrical === 'obsolète' || data.electrical === 'dangereux') {
    recommendations.push('Mise aux normes de l\'installation électrique recommandée.');
  }
  
  if (propertyData?.transactions && propertyData.transactions.length > 0) {
    recommendations.push(`Comparer avec les ${propertyData.transactions.length} transactions récentes dans le secteur`);
  }
  
  if (propertyData?.pricePerM2) {
    recommendations.push(`Vérifier que le prix demandé correspond au marché local (${propertyData.pricePerM2.toLocaleString('fr-FR')}€/m² en moyenne)`);
  }
  
  return recommendations;
}

