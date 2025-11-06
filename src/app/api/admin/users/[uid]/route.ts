import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

/**
 * API pour récupérer les détails d'un utilisateur
 */
export async function GET(
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

    // Récupérer les données utilisateur
    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();

    // Récupérer les crédits
    const creditsDoc = await adminDb.collection('credits').doc(uid).get();
    const credits = creditsDoc.exists ? creditsDoc.data()?.total || 0 : 0;

    return NextResponse.json({
      uid,
      email: userData?.email,
      credits,
      createdAt: userData?.createdAt?.toMillis?.() || userData?.createdAt,
      admin: userData?.admin || false,
      blocked: userData?.blocked || false,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

