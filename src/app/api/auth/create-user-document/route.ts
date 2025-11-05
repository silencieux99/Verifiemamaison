import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from '@/lib/firebase-admin';

/**
 * API pour créer un document utilisateur dans Firestore
 */
export async function POST(req: NextRequest) {
  try {
    const { uid, email, displayName } = await req.json();

    if (!uid || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Firebase Admin DB not initialized' }, { status: 500 });
    }

    // Vérifier si l'utilisateur existe déjà
    const userDoc = await adminDb.collection('users').doc(uid).get();

    if (userDoc.exists) {
      // Mettre à jour si nécessaire
      await adminDb.collection('users').doc(uid).update({
        updatedAt: FieldValue.serverTimestamp(),
        email: email,
        ...(displayName && { displayName }),
      });
    } else {
      // Créer le document utilisateur
      await adminDb.collection('users').doc(uid).set({
        uid,
        email,
        displayName: displayName || email.split('@')[0],
        credits: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating user document:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

