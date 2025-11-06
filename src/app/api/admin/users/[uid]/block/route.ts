import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * API pour bloquer/débloquer un utilisateur
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const authToken = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
    }

    const decodedToken = await adminAuth.verifyIdToken(authToken);
    if (!decodedToken.admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { uid } = await params;
    const { blocked } = await req.json();

    // Mettre à jour le statut dans Firestore
    await adminDb.collection('users').doc(uid).update({
      blocked: blocked === true,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Désactiver le compte Firebase si bloqué
    if (blocked) {
      await adminAuth.updateUser(uid, {
        disabled: true,
      });
    } else {
      await adminAuth.updateUser(uid, {
        disabled: false,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Block user error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

