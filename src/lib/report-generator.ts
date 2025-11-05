import { HouseData, HouseReport } from './types';

/**
 * Générateur de rapports pour VerifieMaMaison
 * Cette fonction peut être étendue pour intégrer des services d'IA
 * Enrichi avec les données immobilières (DVF, géocodage, etc.)
 */

export function generateReport(houseData: HouseData, propertyData?: any): HouseReport {
  // Cette fonction sera appelée par l'API de génération de rapports
  // Pour l'instant, c'est une version simplifiée
  // À l'avenir, on pourra intégrer Gemini AI comme dans VerifieMaVoiture
  
  const score = calculateScore(houseData);
  
  return {
    houseData,
    analysis: {
      structure: generateStructureText(houseData, propertyData),
      roof: generateRoofText(houseData),
      insulation: generateInsulationText(houseData),
      installations: generateInstallationsText(houseData),
      interior: generateInteriorText(houseData, propertyData),
      overall: generateOverallText(houseData, propertyData),
    },
    score,
    alerts: generateAlerts(houseData),
    recommendations: generateRecommendations(houseData, score, propertyData),
  };
}

function calculateScore(data: HouseData): number {
  let score = 50;
  
  if (data.generalCondition === 'neuf') score += 30;
  else if (data.generalCondition === 'bon_etat') score += 20;
  else if (data.generalCondition === 'moyen') score += 10;
  else score -= 10;
  
  if (data.roofCondition === 'neuf' || data.roofCondition === 'bon') score += 10;
  else if (data.roofCondition === 'moyen') score += 5;
  else score -= 10;
  
  if (data.insulation === 'excellente') score += 10;
  else if (data.insulation === 'complete') score += 5;
  else if (data.insulation === 'partielle') score -= 5;
  else score -= 10;
  
  return Math.max(0, Math.min(100, score));
}

function generateStructureText(data: HouseData, propertyData?: any): string {
  let text = `Structure analysée basée sur l'état général: ${data.generalCondition}.`;
  if (propertyData?.transactions && propertyData.transactions.length > 0) {
    text += ` Historique des transactions: ${propertyData.transactions.length} ventes récentes détectées dans le secteur.`;
  }
  return text;
}

function generateRoofText(data: HouseData): string {
  return `Toiture: ${data.roofCondition}`;
}

function generateInsulationText(data: HouseData): string {
  return `Isolation: ${data.insulation}`;
}

function generateInstallationsText(data: HouseData): string {
  return `Installations électriques: ${data.electrical}, Plomberie: ${data.plumbing}`;
}

function generateInteriorText(data: HouseData, propertyData?: any): string {
  let text = `Intérieur: ${data.surface}m², ${data.rooms || 'N/A'} pièces`;
  if (propertyData?.pricePerM2) {
    text += `. Prix moyen au m² dans le secteur: ${propertyData.pricePerM2.toLocaleString('fr-FR')}€/m²`;
  }
  return text;
}

function generateOverallText(data: HouseData, propertyData?: any): string {
  let text = `Synthèse globale du bien situé à ${data.address}, ${data.postalCode} ${data.city}.`;
  if (propertyData?.averagePrice) {
    text += ` Prix moyen des transactions récentes dans le secteur: ${propertyData.averagePrice.toLocaleString('fr-FR')}€`;
  }
  return text;
}

function generateAlerts(data: HouseData) {
  const alerts = [];
  
  if (data.diagnostics?.amiante) {
    alerts.push({
      level: 'error' as const,
      category: 'Amiante',
      message: 'Présence suspectée d\'amiante',
    });
  }
  
  if (data.electrical === 'dangereux') {
    alerts.push({
      level: 'error' as const,
      category: 'Électricité',
      message: 'Installation électrique dangereuse',
    });
  }
  
  return alerts;
}

function generateRecommendations(data: HouseData, score: number, propertyData?: any): string[] {
  const recommendations = [];
  
  if (score < 50) {
    recommendations.push('Faire appel à un expert professionnel');
  }
  
  if (propertyData?.transactions && propertyData.transactions.length > 0) {
    recommendations.push(`Comparer avec les ${propertyData.transactions.length} transactions récentes dans le secteur`);
  }
  
  if (propertyData?.pricePerM2) {
    recommendations.push(`Vérifier que le prix demandé correspond au marché local (${propertyData.pricePerM2.toLocaleString('fr-FR')}€/m² en moyenne)`);
  }
  
  return recommendations;
}

