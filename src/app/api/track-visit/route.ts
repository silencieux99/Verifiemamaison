import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

/**
 * API pour enregistrer les visites en temps réel
 * Stocke les données dans Firestore avec une structure optimisée pour les requêtes
 */
export async function POST(req: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Firebase Admin non initialisé' }, { status: 500 });
    }

    const body = await req.json();
    const {
      path,
      sessionId,
      userAgent,
      language,
      screenWidth,
      screenHeight,
      viewportWidth,
      viewportHeight,
      referrer,
      timestamp,
    } = body;

    // Validation des données
    if (!path || !sessionId || !timestamp) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    // Extraire des informations utiles de l'user agent
    const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent || '');
    const isBot = /bot|crawler|spider|crawling/i.test(userAgent || '');
    
    // Ignorer les bots pour éviter le bruit
    if (isBot) {
      return NextResponse.json({ success: true, ignored: 'bot' });
    }

    // Détecter le navigateur
    let browser = 'unknown';
    if (userAgent) {
      if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) browser = 'Chrome';
      else if (userAgent.includes('Firefox')) browser = 'Firefox';
      else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
      else if (userAgent.includes('Edg')) browser = 'Edge';
      else if (userAgent.includes('Opera')) browser = 'Opera';
    }

    // Détecter l'OS
    let os = 'unknown';
    if (userAgent) {
      if (userAgent.includes('Windows')) os = 'Windows';
      else if (userAgent.includes('Mac')) os = 'macOS';
      else if (userAgent.includes('Linux')) os = 'Linux';
      else if (userAgent.includes('Android')) os = 'Android';
      else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
    }

    // Créer un timestamp Firestore
    const visitTimestamp = new Date(timestamp);
    const year = visitTimestamp.getFullYear();
    const month = visitTimestamp.getMonth() + 1; // 1-12
    const day = visitTimestamp.getDate();
    const hour = visitTimestamp.getHours();

    // Structure de données optimisée pour les requêtes
    const visitData = {
      path,
      sessionId,
      userAgent: userAgent || 'unknown',
      language: language || 'unknown',
      browser,
      os,
      isMobile,
      screenWidth: screenWidth || 0,
      screenHeight: screenHeight || 0,
      viewportWidth: viewportWidth || 0,
      viewportHeight: viewportHeight || 0,
      referrer: referrer || 'direct',
      timestamp: Timestamp.fromDate(visitTimestamp),
      // Champs pour faciliter les requêtes
      year,
      month,
      day,
      hour,
      // Index pour les requêtes récentes (visiteurs actifs)
      isActive: true,
      lastSeen: Timestamp.fromDate(visitTimestamp),
    };

    // Enregistrer la visite dans la collection 'visits'
    const visitRef = adminDb.collection('visits').doc();
    await visitRef.set(visitData);

    // Mettre à jour la session active dans 'active_sessions'
    const sessionRef = adminDb.collection('active_sessions').doc(sessionId);
    await sessionRef.set({
      ...visitData,
      firstSeen: Timestamp.fromDate(visitTimestamp),
      pageCount: FieldValue.increment(1),
      lastPath: path,
    }, { merge: true });

    // Nettoyer les sessions inactives (plus de 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const inactiveSessions = await adminDb
      .collection('active_sessions')
      .where('lastSeen', '<', Timestamp.fromDate(thirtyMinutesAgo))
      .get();

    const batch = adminDb.batch();
    inactiveSessions.docs.forEach((doc) => {
      batch.update(doc.ref, { isActive: false });
    });
    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur tracking visite:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'enregistrement de la visite' },
      { status: 500 }
    );
  }
}

