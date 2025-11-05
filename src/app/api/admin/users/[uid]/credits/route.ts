import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from '@/lib/firebase-admin';

/**
 * API Admin - Ajouter des crédits à un utilisateur
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;
    const authToken = req.headers.get('Authorization')?.split('Bearer ')[1];
    
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
    }

    // Vérifier que l'utilisateur est admin
    const decodedToken = await adminAuth.verifyIdToken(authToken);
    if (!decodedToken.admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Lire le body
    const body = await req.json();
    const { quantity, note } = body;

    if (!quantity || typeof quantity !== 'number' || quantity <= 0) {
      return NextResponse.json(
        { error: 'Invalid quantity. Must be a positive number.' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur existe
    try {
      await adminAuth.getUser(uid);
    } catch (error) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Ajouter les crédits
    const creditsRef = adminDb.collection('credits').doc(uid);
    const creditsDoc = await creditsRef.get();

    const now = Date.now();
    const historyEntry = {
      type: 'add' as const,
      qty: quantity,
      source: 'admin' as const,
      ts: now,
      note: note || `Ajout manuel par administrateur (${decodedToken.email || 'admin'})`,
    };

    if (!creditsDoc.exists) {
      await creditsRef.set({
        uid,
        total: quantity,
        history: [historyEntry],
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      const credits = creditsDoc.data();
      const existingHistory = credits?.history || [];
      await creditsRef.update({
        total: (credits?.total || 0) + quantity,
        history: [...existingHistory, historyEntry],
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    // Récupérer le nouveau total
    const updatedCreditsDoc = await creditsRef.get();
    const newTotal = updatedCreditsDoc.data()?.total || quantity;

    return NextResponse.json({
      success: true,
      message: `${quantity} crédit${quantity > 1 ? 's' : ''} ajouté${quantity > 1 ? 's' : ''} avec succès`,
      totalCredits: newTotal,
      creditsAdded: quantity,
    });
  } catch (error) {
    console.error('Admin add credits error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

