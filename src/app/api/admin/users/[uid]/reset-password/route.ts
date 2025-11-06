import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

/**
 * API pour réinitialiser le mot de passe d'un utilisateur et envoyer un email
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
    const { sendEmail } = await req.json();

    // Générer un nouveau mot de passe temporaire
    const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12).toUpperCase() + '!1';

    // Réinitialiser le mot de passe
    await adminAuth.updateUser(uid, {
      password: tempPassword,
    });

    // Si sendEmail est true, envoyer l'email (à implémenter avec votre service d'email)
    if (sendEmail) {
      const user = await adminAuth.getUser(uid);
      // TODO: Envoyer l'email avec le mot de passe temporaire
      // await sendPasswordResetEmail(user.email, tempPassword);
    }

    return NextResponse.json({ 
      success: true,
      password: sendEmail ? undefined : tempPassword, // Ne pas renvoyer le mot de passe si email envoyé
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

