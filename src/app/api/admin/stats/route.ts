import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

/**
 * API Admin - Statistiques globales
 */
export async function GET(req: NextRequest) {
  try {
    const authToken = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!adminAuth) {
      return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
    }

    const decodedToken = await adminAuth.verifyIdToken(authToken);
    if (!decodedToken.admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Firebase Admin DB not initialized' }, { status: 500 });
    }

    // Récupérer les statistiques
    const [reportsSnapshot, usersSnapshot, ordersSnapshot] = await Promise.all([
      adminDb.collection('reports').get(),
      adminDb.collection('users').get(),
      adminDb.collection('orders').get(),
    ]);

    const totalReports = reportsSnapshot.size;
    const totalUsers = usersSnapshot.size;
    
    let totalRevenue = 0;
    let completedReports = 0;

    ordersSnapshot.forEach((doc) => {
      const order = doc.data();
      if (order.status === 'paid' && order.amount) {
        totalRevenue += order.amount / 100; // Convertir centimes en euros
      }
    });

    reportsSnapshot.forEach((doc) => {
      const report = doc.data();
      if (report.pdfGenerated || report.status === 'COMPLETE') {
        completedReports++;
      }
    });

    return NextResponse.json({
      totalReports,
      totalRevenue,
      totalUsers,
      completedReports,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

