import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from '@/lib/firebase-admin';

/**
 * API pour créer un compte administrateur
 * Nécessite un code secret pour la sécurité
 * 
 * ⚠️ Cette route est temporaire et devrait être supprimée après création du premier admin
 */
export async function POST(req: NextRequest) {
  try {
    const { email, userId, secret } = await req.json();

    if (!email || !userId || !secret) {
      return NextResponse.json(
        { error: 'Missing required fields (email, userId, secret)' },
        { status: 400 }
      );
    }

    // Vérifier le code secret (à définir dans .env.local)
    const expectedSecret = process.env.ADMIN_REGISTER_SECRET;
    if (!expectedSecret) {
      return NextResponse.json(
        { error: 'Admin registration is not configured. Please set ADMIN_REGISTER_SECRET in .env.local' },
        { status: 500 }
      );
    }

    if (secret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Code secret incorrect' },
        { status: 403 }
      );
    }

    if (!adminAuth || !adminDb) {
      return NextResponse.json(
        { error: 'Firebase Admin not initialized' },
        { status: 500 }
      );
    }

    // Vérifier que l'utilisateur existe
    let userRecord;
    try {
      userRecord = await adminAuth.getUser(userId);
    } catch (error) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Vérifier que l'email correspond
    if (userRecord.email !== email) {
      return NextResponse.json(
        { error: 'Email does not match user ID' },
        { status: 400 }
      );
    }

    // Attribuer le rôle admin
    await adminAuth.setCustomUserClaims(userId, { admin: true });

    // Créer ou mettre à jour le document utilisateur dans Firestore
    await adminDb.collection('users').doc(userId).set({
      uid: userId,
      email,
      displayName: email.split('@')[0],
      admin: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return NextResponse.json({
      success: true,
      message: 'Admin account created successfully',
      userId,
      email,
    });
  } catch (error) {
    console.error('Admin register error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

