import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const paymentIntentId = searchParams.get('paymentIntentId');

        console.log(`[GET-TOKEN] Request for ID: ${paymentIntentId}`);

        if (!paymentIntentId) {
            return NextResponse.json({ error: 'ID de paiement manquant' }, { status: 400 });
        }

        if (!adminDb) {
            console.error('[GET-TOKEN] adminDb is NULL! Check your Firebase Admin env vars.');
            return NextResponse.json({ error: 'Config error' }, { status: 500 });
        }

        const tokenDoc = await adminDb.collection('authTokens').doc(paymentIntentId).get();

        if (!tokenDoc.exists) {
            console.log(`[GET-TOKEN] No token found yet for ${paymentIntentId}`);
            return NextResponse.json({ error: 'Token non trouvé' }, { status: 404 });
        }

        const tokenData = tokenDoc.data();
        console.log('[GET-TOKEN] Token detected!', tokenData?.email);

        if (tokenData?.expiresAt < Date.now()) {
            console.log('[GET-TOKEN] Token expired');
            await adminDb.collection('authTokens').doc(paymentIntentId).delete();
            return NextResponse.json({ error: 'Token expiré' }, { status: 410 });
        }

        return NextResponse.json(tokenData);
    } catch (error) {
        console.error('Erreur get-token:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
