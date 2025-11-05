import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

/**
 * API Admin - Liste des utilisateurs
 */
export async function GET(req: NextRequest) {
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

    const usersSnapshot = await adminDb.collection('users')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const users = await Promise.all(
      usersSnapshot.docs.map(async (doc) => {
        const userData = doc.data();
        const creditsSnapshot = await adminDb.collection('credits').doc(doc.id).get();
        const credits = creditsSnapshot.exists ? creditsSnapshot.data()?.total || 0 : 0;

        return {
          uid: doc.id,
          email: userData.email,
          createdAt: userData.createdAt?.toMillis?.() || userData.createdAt,
          credits,
        };
      })
    );

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

