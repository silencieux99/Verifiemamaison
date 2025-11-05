import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { getPlanBySku } from '@/lib/pricing';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createOrUpdateUser, addCredits, getUserCredits } from '@/lib/user';
import { FieldValue } from '@/lib/firebase-admin';

/**
 * API pour gérer le succès du paiement
 * Crée un compte automatiquement, ajoute les crédits, génère un mot de passe
 */
export async function POST(req: NextRequest) {
  try {
    const { paymentIntentId, email, sku } = await req.json();

    if (!email || !sku) {
      return NextResponse.json({ error: 'Missing required fields (email, sku)' }, { status: 400 });
    }
    
    // paymentIntentId est optionnel (peut être appelé sans si payment déjà traité)

    if (!stripe || !adminDb) {
      return NextResponse.json({ error: 'Services not initialized' }, { status: 500 });
    }

    // Vérifier le Payment Intent si fourni
    let paymentIntent;
    if (paymentIntentId) {
      try {
        paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        if (paymentIntent.status !== 'succeeded') {
          return NextResponse.json({ error: 'Payment not succeeded' }, { status: 400 });
        }
      } catch (error) {
        console.error('Error retrieving payment intent:', error);
        // On continue même si on ne peut pas récupérer le payment intent
        // (peut arriver si appelé depuis PaymentModal directement)
      }
    }

    const plan = getPlanBySku(sku);
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Générer un mot de passe aléatoire
    const password = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12).toUpperCase() + '!1';

    let userId: string;
    let isNewAccount = false;

    // Vérifier si l'utilisateur existe déjà
    try {
      const userRecord = await adminAuth?.getUserByEmail(email);
      if (userRecord) {
        userId = userRecord.uid;
      }
    } catch (error: any) {
      // Si l'utilisateur n'existe pas (auth/user-not-found), on le crée
      if (error.code === 'auth/user-not-found') {
        // Créer un nouveau compte
        try {
          const newUserRecord = await adminAuth?.createUser({
            email,
            password,
          });
          if (newUserRecord) {
            userId = newUserRecord.uid;
            isNewAccount = true;

            // Créer l'utilisateur dans Firestore
            await adminDb.collection('users').doc(userId).set({
              uid: userId,
              email,
              createdAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
        } catch (createError: any) {
          // Si l'email existe déjà (race condition), récupérer l'utilisateur
          if (createError.code === 'auth/email-already-exists') {
            const existingUser = await adminAuth?.getUserByEmail(email);
            if (existingUser) {
              userId = existingUser.uid;
            } else {
              throw createError;
            }
          } else {
            throw createError;
          }
        }
      } else {
        // Autre erreur, on la propage
        throw error;
      }
    }

    // Si userId n'est toujours pas défini (cas où l'utilisateur existe mais n'a pas été trouvé)
    if (!userId) {
      throw new Error('Impossible de créer ou récupérer l\'utilisateur');
    }

    // Ajouter les crédits
    await addCredits(userId, plan.reports, sku, `Achat ${plan.name}`);

    // Récupérer le total de crédits après l'ajout
    const totalCredits = await getUserCredits(userId);

    // Créer une commande
    await adminDb.collection('orders').add({
      paymentIntentId: paymentIntentId || null,
      amount: paymentIntent?.amount || plan.price * 100,
      currency: 'eur',
      status: 'paid',
      customerEmail: email,
      customerUid: userId,
      sku,
      productName: plan.name,
      creditsAdded: plan.reports,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      pdfGenerated: false,
      emailSent: false,
    });

    // Envoyer l'email avec les credentials (sera fait dans un autre endpoint)
    
    return NextResponse.json({
      success: true,
      userId,
      password: isNewAccount ? password : undefined,
      newAccount: isNewAccount,
      creditsAdded: plan.reports,
      totalCredits,
      productName: plan.name,
      amount: (paymentIntent?.amount || plan.price * 100) / 100,
    });
  } catch (error) {
    console.error('Handle payment success error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

