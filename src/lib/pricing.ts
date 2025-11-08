import { PricingPlan } from './types';

/**
 * Configuration des plans tarifaires pour VerifieMaMaison
 * Adapté du système VerifieMaVoiture mais avec des tarifs immobiliers
 */
export const pricingPlans: readonly PricingPlan[] = [
  {
    id: 'unite',
    sku: 'unite',
    name: 'Rapport à l\'unité',
    description: 'Idéal pour une vérification unique',
    price: 4.99,
    priceLabel: '4,99 €',
    reports: 1,
    features: [
      'Rapport complet (PDF + interactif)',
      'Livraison instantanée en ligne',
      'Support client par email'
    ],
    highlight: false
  },
  {
    id: 'pack3',
    sku: 'pack3',
    name: 'Pack 3 rapports',
    description: 'Pour analyser plusieurs biens à moindre coût',
    price: 7.99,
    priceLabel: '7,99 €',
    reports: 3,
    features: [
      '3 rapports complets',
      'Économisez 47% sur le prix unitaire',
      'Validité illimitée des crédits'
    ],
    savingsNote: 'Économisez 47%',
    highlight: true,
    badge: 'POPULAIRE'
  },
  {
    id: 'pack10',
    sku: 'pack10',
    name: 'Pack 10 rapports',
    description: 'Solution pro pour agences ou investisseurs',
    price: 19.99,
    priceLabel: '19,99 €',
    reports: 10,
    features: [
      '10 rapports complets',
      'Économisez 60% sur le prix unitaire',
      'Compte rendu détaillé pour chaque bien'
    ],
    savingsNote: 'Économisez 60%',
    highlight: true,
    badge: 'MEILLEURE OFFRE'
  }
] as const;

export const getPlanBySku = (sku: string): PricingPlan | undefined => {
  return pricingPlans.find(plan => plan.sku === sku);
};

export const getHighlightedPlan = (): PricingPlan | undefined => {
  return pricingPlans.find(plan => plan.highlight);
};

export const calculateSavings = (plan: PricingPlan): number | null => {
  if (plan.sku === 'unite') return null;
  
  const unitPrice = 4.99;
  const totalUnitPrice = typeof plan.reports === 'number' ? plan.reports * unitPrice : 0;
  
  if (totalUnitPrice === 0) return null;
  
  return totalUnitPrice - plan.price;
};

