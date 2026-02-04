import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

/**
 * API pour générer un token de connexion automatique après paiement
 * Utilisé par le webhook Stripe pour créer un lien d'auto-login
 */
export async function POST(request: NextRequest) {
    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        // Générer un custom token Firebase
        const customToken = await adminAuth!.createCustomToken(userId);

        return NextResponse.json({ customToken });
    } catch (error) {
        console.error('Error generating custom token:', error);
        return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
    }
}
