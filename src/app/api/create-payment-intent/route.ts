import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { PlanType } from '@/lib/types';

/**
 * API pour créer un Payment Intent Stripe (popup/modal)
 */
export async function POST(req: NextRequest) {
  try {
    const { sku, email, amount } = await req.json();

    if (!sku || !email || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not initialized' }, { status: 500 });
    }

    // Créer un Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // en centimes
      currency: 'eur',
      metadata: {
        sku,
        email,
      },
      receipt_email: email,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Payment Intent error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

