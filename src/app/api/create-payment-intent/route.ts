import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { PlanType } from '@/lib/types';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

/**
 * API pour créer un Payment Intent Stripe (popup/modal)
 * Protection contre les doubles clics : réutilise les PaymentIntents existants
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

    // Récupérer l'utilisateur si authentifié (via header Authorization)
    let userId: string | null = null;
    let customerId: string | null = null;
    
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decodedToken = await adminAuth.verifyIdToken(token);
        userId = decodedToken.uid;
        
        // Récupérer le customer Stripe de l'utilisateur
        if (adminDb && userId) {
          const userDoc = await adminDb.collection('users').doc(userId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            customerId = userData.stripeCustomerId || null;
          }
        }
      } catch (error) {
        // Pas d'authentification, continuer en mode guest
        console.log('No auth token, proceeding as guest');
      }
    }

    // Si utilisateur authentifié, chercher un PaymentIntent existant
    if (customerId) {
      const existingIntents = await stripe.paymentIntents.list({
        customer: customerId,
        limit: 5,
      });

      // Chercher un PaymentIntent existant non payé avec le même montant et SKU
      const reusableIntent = existingIntents.data.find(
        (intent) =>
          intent.status === 'requires_payment_method' &&
          intent.amount === amount &&
          intent.metadata.sku === sku
      );

      if (reusableIntent) {
        // Réutiliser le PaymentIntent existant
        console.log('Réutilisation du PaymentIntent existant:', reusableIntent.id);
        return NextResponse.json({
          clientSecret: reusableIntent.client_secret,
        });
      }
    }

    // Créer un nouveau PaymentIntent avec une clé d'idempotence
    const idempotencyKey = userId 
      ? `${userId}-${sku}-${Math.floor(Date.now() / 1000)}` // Arrondir à la seconde pour éviter les doublons
      : `${email}-${sku}-${Math.floor(Date.now() / 1000)}`;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // en centimes
      currency: 'eur',
      customer: customerId || undefined,
      metadata: {
        sku,
        email,
        ...(userId && { firebase_uid: userId }),
      },
      receipt_email: email,
      automatic_payment_methods: {
        enabled: true,
      },
    }, {
      idempotencyKey: idempotencyKey,
    });

    console.log('Nouveau PaymentIntent créé:', paymentIntent.id);

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

