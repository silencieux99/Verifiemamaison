/**
 * API Route: /api/reports/generate
 * Génère un rapport immobilière avec toutes les données agrégées
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from '@/lib/firebase-admin';
import { HouseProfile } from '@/lib/house-profile-types';
import { v4 as uuidv4 } from 'uuid';
import { enrichMarketWithMelo, mergeMeloWithMarket } from '@/lib/melo-market-enrichment';
import { enrichSafetyWithGeminiWebSearch } from '@/lib/gemini-web-search';

/**
 * POST /api/reports/generate
 * 
 * Body:
 * - address: string (adresse complète)
 * - postalCode: string
 * - city: string
 * - profileData: HouseProfile (données agrégées de house-profile API)
 */
export async function POST(request: NextRequest) {
  try {
    // Vérification de l'authentification
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let decodedToken;

    try {
      decodedToken = await adminAuth?.verifyIdToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    if (!decodedToken) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    const uid = decodedToken.uid;
    const email = decodedToken.email || '';

    // Récupération des paramètres
    const body = await request.json();
    const { address, postalCode, city, profileData } = body;

    if (!address || !postalCode || !city) {
      return NextResponse.json(
        { error: 'Missing required parameters: address, postalCode, city' },
        { status: 400 }
      );
    }

    if (!profileData || !profileData.location) {
      return NextResponse.json(
        { error: 'Missing profileData. Please call /api/house-profile first.' },
        { status: 400 }
      );
    }

    // Vérifier les crédits disponibles (SANS débiter pour l'instant)
    const creditsRef = adminDb.collection('credits').doc(uid);
    const creditsDoc = await creditsRef.get();

    if (!creditsDoc.exists) {
      return NextResponse.json(
        { error: 'No credits available' },
        { status: 402 }
      );
    }

    const credits = creditsDoc.data();
    const currentCredits = credits?.total || 0;

    if (currentCredits <= 0) {
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 402 }
      );
    }

    // Générer un ID de rapport unique
    const reportId = uuidv4();
    const orderId = `report_${reportId}`;

    // Fonction pour supprimer récursivement tous les champs 'raw' pour réduire la taille
    function removeRawFields(obj: any): any {
      if (obj === null || obj === undefined) return obj;
      if (Array.isArray(obj)) {
        return obj.map(item => removeRawFields(item));
      }
      if (typeof obj === 'object') {
        const cleaned: any = {};
        for (const key in obj) {
          if (key === 'raw') {
            // Supprimer les champs raw
            continue;
          }
          cleaned[key] = removeRawFields(obj[key]);
        }
        return cleaned;
      }
      return obj;
    }

    // Nettoyer les données en supprimant les champs raw (surtout pappers.raw qui peut être très volumineux)
    const cleanedProfileData = removeRawFields(profileData) as HouseProfile;

    // NOTE: Enrichissements (Melo, Gemini) désactivés sur demande utilisateur.
    // On utilise uniquement les données récupérées lors de la phase de "teasing" (preview).
    const enrichedProfileData = cleanedProfileData;

    /*
    // Enrichir avec l'API Melo (enrichissement optionnel, ne bloque pas si échoue)
    // ... code Melo commenté ou supprimé ...
    
    // Enrichir avec Gemini Crime Search si activé
    // ... code Gemini commenté ou supprimé ...
    */

    // Créer le rapport dans Firestore
    const reportData = {
      id: reportId,
      orderId,
      userId: uid,
      userEmail: email,
      address: {
        full: address,
        postalCode,
        city,
        normalized: profileData.location.normalized_address,
        gps: profileData.location.gps,
        admin: profileData.location.admin,
      },
      // Données agrégées nettoyées (sans raw) + enrichies avec Melo si disponible
      profileData: enrichedProfileData,
      // Données du rapport
      report: {
        generatedAt: FieldValue.serverTimestamp(),
        status: 'complete',
        // Utiliser le score IA si disponible, sinon calcul basique
        score: enrichedProfileData.ai_analysis?.score ?? calculateReportScore(enrichedProfileData),
        // Utiliser la synthèse IA si disponible, sinon génération basique
        summary: enrichedProfileData.ai_analysis?.summary ?? generateReportSummary(enrichedProfileData),
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      pdfGenerated: false,
      emailSent: false,
    };

    // Sauvegarder le rapport D'ABORD
    try {
      await adminDb.collection('reports').doc(reportId).set(reportData);

      // Créer aussi une entrée dans orders pour la cohérence
      await adminDb.collection('orders').add({
        id: orderId,
        customerUid: uid,
        customerEmail: email,
        status: 'COMPLETE',
        houseData: {
          address,
          postalCode,
          city,
        },
        reportData: reportData.report,
        reportId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        pdfGenerated: false,
        emailSent: false,
      });

      // Vérifier que le rapport est bien sauvegardé et marqué comme 'complete'
      const savedReport = await adminDb.collection('reports').doc(reportId).get();
      if (!savedReport.exists) {
        throw new Error('Rapport non sauvegardé');
      }

      const savedData = savedReport.data();
      if (savedData?.report?.status !== 'complete') {
        throw new Error('Rapport non marqué comme complet');
      }

      // MAINTENANT que le rapport est sauvegardé avec succès, débiter le crédit
      const now = Date.now();
      const historyEntry = {
        type: 'consume' as const,
        qty: 1,
        source: 'unite' as const,
        ts: now,
        note: `Génération rapport pour ${address}`,
        reportId, // Ajouter le reportId pour traçabilité
      };

      // Re-vérifier les crédits avant de débiter (protection contre les race conditions)
      const creditsDocCheck = await creditsRef.get();
      const creditsCheck = creditsDocCheck.data();
      const currentCreditsCheck = creditsCheck?.total || 0;

      if (currentCreditsCheck <= 0) {
        // Si les crédits ont été épuisés entre temps, supprimer le rapport et retourner une erreur
        await adminDb.collection('reports').doc(reportId).delete();
        return NextResponse.json(
          { error: 'Insufficient credits (credits were consumed by another process)' },
          { status: 402 }
        );
      }

      // Débiter le crédit
      await creditsRef.update({
        total: currentCreditsCheck - 1,
        history: [...(creditsCheck.history || []), historyEntry],
        updatedAt: now,
      });

      return NextResponse.json({
        success: true,
        reportId,
        orderId,
        message: 'Rapport généré avec succès',
      });
    } catch (saveError) {
      // En cas d'erreur lors de la sauvegarde, ne PAS débiter le crédit
      console.error('Erreur sauvegarde rapport:', saveError);

      // Nettoyer le rapport partiel si créé
      try {
        await adminDb.collection('reports').doc(reportId).delete();
      } catch (deleteError) {
        console.error('Erreur suppression rapport partiel:', deleteError);
      }

      // Propager l'erreur sans avoir débité le crédit
      throw saveError;
    }
  } catch (error) {
    console.error('Erreur génération rapport:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Calcule un score global basé sur les données du profil
 */
function calculateReportScore(profile: HouseProfile): number {
  let score = 100;

  // Pénalités pour risques
  if (profile.risks?.normalized?.flood_level === 'élevé') score -= 15;
  else if (profile.risks?.normalized?.flood_level === 'moyen') score -= 8;

  if (profile.risks?.normalized?.seismic_level && profile.risks.normalized.seismic_level >= 4) score -= 10;

  if (profile.risks?.normalized?.radon_zone && profile.risks.normalized.radon_zone >= 2) score -= 5;

  // Pénalités pour DPE
  if (profile.energy?.dpe?.class_energy) {
    const dpePenalty: Record<string, number> = {
      'G': 20,
      'F': 15,
      'E': 10,
      'D': 5,
      'C': 0,
      'B': 0,
      'A': 0,
    };
    score -= dpePenalty[profile.energy.dpe.class_energy] || 0;
  }

  // Bonus pour connectivité
  if (profile.connectivity?.fiber_available) score += 5;

  // Bonus pour commodités
  if (profile.amenities?.supermarkets && profile.amenities.supermarkets.length > 0) score += 3;
  if (profile.amenities?.transit && profile.amenities.transit.length > 0) score += 3;

  // Bonus pour écoles
  if (profile.education?.schools && profile.education.schools.length > 0) score += 2;

  return Math.max(0, Math.min(100, score));
}

/**
 * Génère un résumé textuel du rapport
 */
function generateReportSummary(profile: HouseProfile): string {
  const parts: string[] = [];

  if (profile.location?.admin?.city) {
    parts.push(`Bien situé à ${profile.location.admin.city}`);
  }

  if (profile.energy?.dpe?.class_energy) {
    parts.push(`DPE ${profile.energy.dpe.class_energy}`);
  }

  if (profile.risks?.normalized?.flood_level) {
    parts.push(`Risque inondation: ${profile.risks.normalized.flood_level}`);
  }

  if (profile.connectivity?.fiber_available) {
    parts.push('Fibre disponible');
  }

  if (profile.market?.dvf?.summary?.price_m2_median_1y) {
    parts.push(`Prix/m²: ~${profile.market.dvf.summary.price_m2_median_1y}€`);
  }

  return parts.length > 0 ? parts.join(' • ') : 'Rapport d\'analyse immobilière complet';
}
