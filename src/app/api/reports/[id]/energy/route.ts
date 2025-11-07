/**
 * API Route: /api/reports/[id]/energy
 * Récupère et met à jour les données DPE/énergie pour un rapport existant
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from '@/lib/firebase-admin';
import { fetchDPE } from '@/lib/house-profile-utils';

/**
 * GET /api/reports/[id]/energy
 * Récupère les données DPE pour un rapport et les met à jour
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id: reportId } = await params;

    // Récupérer le rapport
    const reportDoc = await adminDb.collection('reports').doc(reportId).get();

    if (!reportDoc.exists) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    const reportData = reportDoc.data();

    // Vérifier que le rapport appartient à l'utilisateur
    if (reportData?.userId !== uid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Extraire l'adresse du rapport
    const address = reportData?.address?.full || reportData?.address?.normalized;
    const citycode = reportData?.address?.admin?.citycode;

    if (!address) {
      return NextResponse.json(
        { error: 'Address not found in report' },
        { status: 400 }
      );
    }

    if (!citycode) {
      return NextResponse.json(
        { error: 'City code not found in report' },
        { status: 400 }
      );
    }

    // Récupérer les coordonnées GPS si disponibles
    const lat = reportData?.address?.gps?.lat;
    const lon = reportData?.address?.gps?.lon;
    
    // Récupérer les données DPE
    const energyData = await fetchDPE(address, citycode, lat, lon);

    // Si des données DPE ont été trouvées, mettre à jour le rapport
    if (energyData?.dpe) {
      const reportRef = adminDb.collection('reports').doc(reportId);
      const currentProfileData = reportData?.profileData || {};
      
      // Mettre à jour les données d'énergie dans le profileData
      const updatedProfileData = {
        ...currentProfileData,
        energy: {
          ...currentProfileData.energy,
          ...energyData,
        },
      };

      // Mettre à jour le rapport
      await reportRef.update({
        profileData: updatedProfileData,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return NextResponse.json({
        success: true,
        energy: energyData,
        message: 'Données DPE mises à jour avec succès',
      });
    } else {
      return NextResponse.json({
        success: false,
        energy: {},
        message: 'Aucune donnée DPE trouvée pour cette adresse',
      });
    }
  } catch (error) {
    console.error('Erreur récupération données DPE:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

