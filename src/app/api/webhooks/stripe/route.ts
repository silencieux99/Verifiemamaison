import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe';
import { getPlanBySku } from '@/lib/pricing';
import { PlanType } from '@/lib/types';
import Stripe from 'stripe';
import { adminAuth, adminDb, FieldValue } from '@/lib/firebase-admin';
import { sendWelcomeEmail, sendOrderConfirmationEmail } from '@/lib/email-service';

/**
 * Webhook Stripe : Cœur de l'automatisation post-achat
 * 1. Vérifie/Crée l'utilisateur
 * 2. Ajoute les crédits (sécurisé)
 * 3. Envoie notif Telegram
 * 4. Envoie email (Bienvenue+Credentials ou Confirmation)
 */
export async function POST(request: NextRequest) {
  console.log('🚀 [Stripe-Webhook] Request received at endpoint');

  if (!STRIPE_WEBHOOK_SECRET) {
    console.error('❌ [Stripe-Webhook] STRIPE_WEBHOOK_SECRET is missing in environment variables');
  }

  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature || !STRIPE_WEBHOOK_SECRET) {
      console.error('⚠️ [Stripe-Webhook] Missing signature or webhook secret');
      return NextResponse.json({ error: 'Config error' }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe!.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('❌ [Stripe-Webhook] Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`🔔 [Stripe-Webhook] Event received: ${event.type} [${event.id}]`);

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`[Stripe-Webhook] Processing payment_intent.succeeded: ${paymentIntent.id}`);

      const { sku, email: metaEmail } = paymentIntent.metadata;
      const email = metaEmail || paymentIntent.receipt_email;

      await handlePaymentSuccess({
        id: paymentIntent.id,
        email: email || '',
        sku: sku as string,
        amount: paymentIntent.amount,
        customerId: typeof paymentIntent.customer === 'string' ? paymentIntent.customer : null,
        metadata: paymentIntent.metadata
      });
    }
    else if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`[Stripe-Webhook] Processing checkout.session.completed: ${session.id}`);

      if (session.payment_status === 'paid') {
        const { sku, email: metaEmail } = session.metadata || {};
        const email = metaEmail || session.customer_details?.email || session.customer_email;

        await handlePaymentSuccess({
          id: session.id,
          email: email || '',
          sku: sku as string,
          amount: session.amount_total || 0,
          customerId: typeof session.customer === 'string' ? session.customer : null,
          metadata: session.metadata || {}
        });
      } else {
        console.log(`[Stripe-Webhook] Session ${session.id} not paid yet, skipping.`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ [Stripe-Webhook] Internal server error:', error);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }
}

interface PaymentData {
  id: string;
  email: string;
  sku: string;
  amount: number;
  customerId: string | null;
  metadata: Record<string, any>;
}

async function handlePaymentSuccess(data: PaymentData) {
  const { id, email, sku, amount, customerId } = data;
  console.log(`[Stripe-Webhook] handlePaymentSuccess started for ${id} (${email})`);

  if (!sku || !email) {
    console.error('⚠️ Manque SKU ou Email dans le paiement', id);
    return;
  }

  console.log(`Processing payment for ${email} - SKU: ${sku}`);

  // 1. Déterminer les crédits
  const plan = getPlanBySku(sku as PlanType);
  if (!plan) {
    console.error('⚠️ Plan inconnu:', sku);
    return;
  }
  const creditsToAdd = plan.reports;

  try {
    // 2. Gestion Utilisateur (Admin SDK)
    let userId = '';
    let isNewUser = false;
    let password = ''; // Seulement si nouveau

    try {
      const userRecord = await adminAuth!.getUserByEmail(email);
      userId = userRecord.uid;
      console.log('✅ Utilisateur existant trouvé:', userId);
    } catch (e) {
      // Utilisateur n'existe pas -> Création
      console.log('✨ Création nouvel utilisateur pour:', email);
      isNewUser = true;
      password = Math.random().toString(36).slice(-10) + 'A1!'; // Simple random pass

      const newUser = await adminAuth!.createUser({
        email: email,
        password: password,
        emailVerified: true,
        displayName: email.split('@')[0]
      });
      userId = newUser.uid;

      // Créer doc user dans Firestore
      await adminDb!.collection('users').doc(userId).set({
        email,
        uid: userId,
        createdAt: Date.now(),
        stripeCustomerId: customerId,
        role: 'user'
      });
    }

    // 3. Ajout Crédits (Transaction non bloquante ici, simple update)
    const creditRef = adminDb!.collection('credits').doc(userId);
    const creditDoc = await creditRef.get();

    const historyEntry = {
      type: 'add',
      qty: creditsToAdd,
      source: sku,
      amount: amount,
      ts: Date.now(),
      paymentIntentId: id
    };

    if (!creditDoc.exists) {
      await creditRef.set({
        uid: userId,
        total: creditsToAdd,
        history: [historyEntry],
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    } else {
      await creditRef.update({
        total: FieldValue.increment(creditsToAdd),
        history: FieldValue.arrayUnion(historyEntry),
        updatedAt: Date.now()
      });
    }
    console.log(`💰 ${creditsToAdd} crédits ajoutés pour ${userId}`);

    // 4. Notifications Telegram
    await sendTelegramNotification({
      email,
      amount: amount / 100,
      pack: sku,
      credits: creditsToAdd,
      isNew: isNewUser
    });

    // 5. Générer un token d'auto-login et le stocker temporairement
    try {
      console.log(`[Stripe-Webhook] Generating auto-login token for user ${userId}`);
      const customToken = await adminAuth!.createCustomToken(userId);

      // Stocker le token temporairement dans Firestore (expire après 1h)
      console.log(`[Stripe-Webhook] Saving token to authTokens/${id}`);
      await adminDb!.collection('authTokens').doc(id).set({
        userId,
        customToken,
        email,
        password: isNewUser ? password : null,
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000, // 1 heure
        isNewUser
      });
      console.log('🔑 [Stripe-Webhook] Token d\'auto-login créé avec succès');
    } catch (tokenError) {
      console.error('[Stripe-Webhook] Error during token creation/storage:', tokenError);
    }

    // 6. Email Confirmation / Bienvenue
    if (isNewUser) {
      await sendWelcomeEmail({
        email,
        password,
        plan: plan.name
      });
      console.log('📧 Email Bienvenue + Credentials envoyé');
    } else {
      // Envoyer confirmation commande simple
      /* await sendOrderConfirmationEmail({
         email,
         orderId: paymentIntent.id,
         planName: plan.title,
         amount: amount / 100,
         date: new Date().toLocaleDateString('fr-FR')
      }); */
      // Note: User asked specific "credentials" email logic. 
      // If existing user, maybe simply specific notif? Or nothing logic wise for now on creds.
      // Usually just "You have received credits".
      console.log('📧 Email confirmation (utilisateur existant) - TODO');
    }

  } catch (error) {
    console.error('❌ Erreur critique traitement post-paiement:', error);
    // On ne throw pas pour ne pas faire retry Stripe "à l'infini" si c'est logique métier
    // Mais on log severement.
  }
}

async function sendTelegramNotification({ email, amount, pack, credits, isNew }: any) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn('⚠️ Telegram non configuré via variables d\'env');
    return;
  }

  const message = `
💰 **Nouveau Paiement Reçu !**

👤 **Client**: ${email}
📦 **Pack**: ${pack}
💶 **Montant**: ${amount}€
💎 **Crédits**: +${credits}
🆕 **Nouveau Client**: ${isNew ? 'OUI ✅' : 'NON 🔁'}

_VerifieMaMaison Bot_
    `.trim();

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      })
    });
    console.log('✈️ Notif Telegram envoyée');
  } catch (e) {
    console.error('Erreur Telegram', e);
  }
}

