import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe';
import { getPlanBySku } from '@/lib/pricing';
import { PlanType } from '@/lib/types';
import Stripe from 'stripe';

/**
 * Webhook Stripe pour VerifieMaMaison
 * Gère les événements de paiement et crédite les utilisateurs
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature || !STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not initialized' }, { status: 500 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('Webhook event received:', event.type);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentSucceeded(paymentIntent);
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    const sku = paymentIntent.metadata?.sku as string;
    const customerEmail = paymentIntent.metadata?.email as string;

    if (!sku || !customerEmail) {
      console.error('Missing SKU or email in PaymentIntent metadata');
      return;
    }

    const plan = getPlanBySku(sku as PlanType);
    if (!plan) {
      console.error('Plan not found for SKU:', sku);
      return;
    }

    console.log(`Payment succeeded for ${customerEmail}, plan: ${sku}, credits: ${plan.reports}`);
    
    // Note: Les crédits sont ajoutés dans /api/handle-payment-success
    // qui est appelé côté client après le paiement
    // Le webhook sert surtout de backup et de log
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
    throw error;
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    const sku = session.metadata?.sku as string;
    if (!sku) {
      console.error('No SKU in session metadata');
      return;
    }

    const plan = getPlanBySku(sku as PlanType);
    if (!plan) {
      console.error('Plan not found for SKU:', sku);
      return;
    }

    // Récupérer l'email du client
    const customerEmail = session.customer_email || session.customer_details?.email;
    if (!customerEmail) {
      console.error('No customer email in session');
      return;
    }

    console.log(`Checkout completed for ${customerEmail}, plan: ${sku}, credits: ${plan.reports}`);
    // Note: Les crédits sont généralement ajoutés dans /api/handle-payment-success
    // Le webhook sert de backup

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
    throw error;
  }
}

