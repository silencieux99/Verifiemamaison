import Stripe from "stripe";
import { PlanType } from "./types";

const key = process.env.STRIPE_SECRET_KEY || "";
if (!key && process.env.NODE_ENV !== "production") {
  console.warn("STRIPE_SECRET_KEY absente. Les routes Stripe ne fonctionneront pas en dev.");
}

export const stripe = key
  ? new Stripe(key, { apiVersion: "2025-08-27.basil" })
  : null;

// Prix unitaire pour un rapport (en EUR) - VerifieMaMaison
export const PRICE_EUR = 4.99;

// Configuration des prix Stripe
export const STRIPE_PRICES = {
  unite: process.env.STRIPE_PRICE_UNITE || '',
  pack3: process.env.STRIPE_PRICE_PACK3 || '',
  pack10: process.env.STRIPE_PRICE_PACK10 || '',
} as const;

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

/**
 * Obtient le price ID Stripe pour un SKU donné
 */
export function getStripePriceId(sku: PlanType): string {
  const priceId = STRIPE_PRICES[sku];
  if (!priceId) {
    throw new Error(`Price ID not found for SKU: ${sku}`);
  }
  return priceId;
}

/**
 * Crée une session de checkout Stripe
 */
export async function createCheckoutSession(
  sku: PlanType,
  customerId?: string,
  successUrl: string = `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success`,
  cancelUrl: string = `${process.env.NEXT_PUBLIC_BASE_URL}/tarifs`
): Promise<Stripe.Checkout.Session> {
  if (!stripe) {
    throw new Error('Stripe not initialized');
  }

  const priceId = getStripePriceId(sku);

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'payment', // Pas d'abonnement pour VerifieMaMaison
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      sku,
    },
  };

  // Ajouter le customer ID si fourni
  if (customerId) {
    sessionParams.customer = customerId;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  return session;
}

