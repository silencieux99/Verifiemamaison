import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email-service';

/**
 * API pour envoyer un email avec les credentials
 * Utilise le template professionnel de bienvenue
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password, plan, creditsAdded, totalCredits } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Si Resend n'est pas configuré, on retourne un succès (pas d'erreur bloquante)
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured, skipping email');
      return NextResponse.json({ success: true, skipped: true });
    }

    try {
      // Utiliser le service d'email avec le template professionnel
      await sendWelcomeEmail({
        email,
        password,
        plan,
        creditsAdded: creditsAdded || undefined,
        totalCredits: totalCredits || undefined,
      });

      return NextResponse.json({ success: true });
    } catch (emailError: any) {
      // Si l'erreur vient du service d'email, on log mais on ne fait pas échouer la requête
      console.error('Email service error:', emailError);
      // On retourne quand même un succès pour ne pas bloquer le flux utilisateur
      return NextResponse.json({ 
        success: true, 
        skipped: true,
        error: emailError.message || 'Email service unavailable'
      });
    }
  } catch (error) {
    console.error('Send email error:', error);
    // Même en cas d'erreur, on retourne un succès pour ne pas bloquer
    return NextResponse.json({ 
      success: true, 
      skipped: true,
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}

