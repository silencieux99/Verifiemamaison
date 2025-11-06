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

    // Gérer les FormData (pour sendBeacon) et JSON
    let body: any;
    const contentType = req.headers.get('content-type');
    if (contentType?.includes('multipart/form-data')) {
      const formData = await req.formData();
      body = {
        sessionId: formData.get('sessionId'),
        isLeaving: formData.get('isLeaving') === 'true',
      };
    } else {
      body = await req.json();
    }
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
      isHeartbeat,
      isLeaving,
    } = body;

    // Validation des données (relaxée pour les heartbeats et déconnexions)
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID manquant' }, { status: 400 });
    }

    // Si c'est une déconnexion, marquer la session comme inactive
    if (isLeaving) {
      const sessionRef = adminDb.collection('active_sessions').doc(sessionId);
      await sessionRef.update({
        isActive: false,
        lastSeen: Timestamp.now(),
      });
      return NextResponse.json({ success: true, action: 'session_inactive' });
    }

    // Pour les heartbeats, on a besoin seulement de sessionId et timestamp
    if (isHeartbeat) {
      const heartbeatTimestamp = timestamp ? new Date(timestamp) : new Date();
      const sessionRef = adminDb.collection('active_sessions').doc(sessionId);
      const sessionDoc = await sessionRef.get();
      
      // Si la session existe, mettre à jour seulement lastSeen
      if (sessionDoc.exists) {
        await sessionRef.update({
          lastSeen: Timestamp.fromDate(heartbeatTimestamp),
          isActive: true,
        });
        return NextResponse.json({ success: true, action: 'heartbeat' });
      }
      // Si la session n'existe pas, créer une nouvelle session (cas rare)
      // Mais on a besoin de path pour créer une session complète
      if (!path) {
        return NextResponse.json({ error: 'Path manquant pour nouvelle session' }, { status: 400 });
      }
    }

    // Validation complète pour les nouvelles visites
    if (!path || !timestamp) {
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
    const sessionDoc = await sessionRef.get();
    
    if (sessionDoc.exists) {
      // Session existante : mettre à jour
      await sessionRef.update({
        ...visitData,
        pageCount: FieldValue.increment(isHeartbeat ? 0 : 1),
        lastPath: path,
        lastSeen: Timestamp.fromDate(visitTimestamp),
        isActive: true,
      });
    } else {
      // Nouvelle session : créer
      await sessionRef.set({
        ...visitData,
        firstSeen: Timestamp.fromDate(visitTimestamp),
        pageCount: 1,
        lastPath: path,
        isActive: true,
      });
    }

    // Nettoyer les sessions inactives (plus de 2 minutes sans activité)
    // Réduit à 2 minutes pour un tracking plus précis
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const inactiveSessions = await adminDb
      .collection('active_sessions')
      .where('lastSeen', '<', Timestamp.fromDate(twoMinutesAgo))
      .where('isActive', '==', true)
      .get();

    if (inactiveSessions.docs.length > 0) {
      const batch = adminDb.batch();
      inactiveSessions.docs.forEach((doc) => {
        batch.update(doc.ref, { isActive: false });
      });
      await batch.commit();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur tracking visite:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'enregistrement de la visite' },
      { status: 500 }
    );
  }
}

