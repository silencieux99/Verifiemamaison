import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * API pour envoyer un email avec les credentials
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password, plan } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured, skipping email');
      return NextResponse.json({ success: true, skipped: true });
    }

    await resend.emails.send({
      from: 'VerifieMaMaison <noreply@verifiemamaison.fr>',
      to: email,
      subject: 'Bienvenue sur VerifieMaMaison - Vos identifiants',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #9333ea;">Bienvenue sur VerifieMaMaison !</h1>
          <p>Votre compte a été créé avec succès suite à votre achat.</p>
          
          <div style="background: #1f2937; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #fff; margin-top: 0;">Vos identifiants de connexion</h2>
            <p style="color: #d1d5db;"><strong>Email :</strong> ${email}</p>
            <p style="color: #d1d5db;"><strong>Mot de passe :</strong> ${password}</p>
          </div>

          <p><strong>Pack acheté :</strong> ${plan}</p>
          
          <p style="color: #ef4444; font-weight: bold;">⚠️ Conservez ces informations en sécurité.</p>
          
          <p>Vous pouvez maintenant vous connecter et générer vos rapports d'analyse immobilière.</p>
          
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}/login" 
             style="display: inline-block; background: #9333ea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
            Me connecter
          </a>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Send email error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

