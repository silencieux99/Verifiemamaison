import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession } from '@/lib/stripe';
import { PlanType } from '@/lib/types';
import { getAuth } from 'firebase-admin/auth';
import { adminAuth } from '@/lib/firebase-admin';

/**
 * API de checkout Stripe pour VerifieMaMaison
 */
export async function POST(req: NextRequest) {
  try {
    const { sku, successUrl, cancelUrl } = await req.json();

    if (!sku || !successUrl || !cancelUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

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
    const email = decodedToken.email || '';

    // Créer la session Stripe
    const session = await createCheckoutSession(
      sku as PlanType,
      undefined, // Pas de customer ID pour l'instant
      successUrl,
      cancelUrl
    );

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

