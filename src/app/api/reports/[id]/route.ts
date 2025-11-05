import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { HouseReport } from '@/lib/types';

/**
 * API pour récupérer un rapport par ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authToken = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Vérifier le token Firebase
    let decodedToken;
    try {
      if (!adminAuth) {
        return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
      }
      decodedToken = await adminAuth.verifyIdToken(authToken);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const uid = decodedToken.uid;
    const { id: reportId } = await params;

    if (!adminDb) {
      return NextResponse.json({ error: 'Firebase Admin DB not initialized' }, { status: 500 });
    }

    // Récupérer le rapport depuis Firestore
    const reportDoc = await adminDb.collection('reports').doc(reportId).get();

    if (!reportDoc.exists) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const reportData = reportDoc.data();

    // Vérifier que le rapport appartient à l'utilisateur
    if (reportData?.uid !== uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Retourner le rapport
    return NextResponse.json({
      report: reportData?.reportData as HouseReport,
      houseData: reportData?.houseData,
      createdAt: reportData?.createdAt,
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

