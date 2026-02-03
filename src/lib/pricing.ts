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
    price: 19.99,
    priceLabel: '19,99 €',
    reports: 1,
    features: [
      'Rapport complet (PDF + interactif)',
      'Livraison instantanée en ligne',
      'Support client par email'
    ],
    highlight: false
  },
  {
    id: 'pack4',
    sku: 'pack4',
    name: 'Pack 4 rapports',
    description: 'Pour analyser plusieurs biens à moindre coût',
    price: 29.99,
    priceLabel: '29,99 €',
    reports: 4,
    features: [
      '4 rapports complets (2 achetés + 2 offerts)',
      'Économisez sur le prix unitaire',
      'Validité 1 an'
    ],
    savingsNote: '2+2 Offerts',
    highlight: true,
    badge: 'POPULAIRE'
  },
  {
    id: 'pack10',
    sku: 'pack10',
    name: 'Pack 10 rapports',
    description: 'Solution pro pour agences ou investisseurs',
    price: 39.99,
    priceLabel: '39,99 €',
    reports: 10,
    features: [
      '10 rapports complets (5 achetés + 5 offerts)',
      'Prix imbattable au rapport',
      'Validité à vie'
    ],
    savingsNote: '5+5 Offerts',
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

