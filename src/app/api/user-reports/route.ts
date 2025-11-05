import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
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
    const userEmail = decodedToken.email;

    console.log(`🔍 Recherche des rapports pour l'utilisateur: ${uid} (${userEmail})`);

    try {
      // Récupérer les rapports de l'utilisateur depuis la collection 'reports'
      const reportsSnapshot = await adminDb.collection('reports')
        .where('userId', '==', uid)
        .orderBy('createdAt', 'desc')
        .limit(100)
        .get();

      console.log(`📊 Trouvé ${reportsSnapshot.docs.length} rapports pour ${uid}`);

      const reports = [];

      for (const doc of reportsSnapshot.docs) {
        const reportData = doc.data();
        
        // Formater la date pour l'affichage
        let formattedDate = 'Date inconnue';
        if (reportData.createdAt) {
          const timestamp = reportData.createdAt;
          // Convertir Firestore Timestamp en Date
          const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
          formattedDate = date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        }

        reports.push({
          id: doc.id,
          reportId: reportData.id || doc.id,
          orderId: reportData.orderId || doc.id,
          createdAt: reportData.createdAt,
          address: reportData.address || {},
          formattedDate: formattedDate,
          status: reportData.report?.status || 'complete',
          score: reportData.report?.score || 0,
          summary: reportData.report?.summary || '',
          // Informations supplémentaires
          city: reportData.address?.city || '',
          postalCode: reportData.address?.postalCode || '',
          normalizedAddress: reportData.address?.normalized || reportData.address?.full || '',
          pdfUrl: reportData.pdfUrl || null,
          pdfGenerated: reportData.pdfGenerated || false
        });
      }

      console.log(`✅ ${reports.length} rapports formatés pour ${uid}`);

      return NextResponse.json({
        success: true,
        reports,
        total: reports.length,
        userId: uid,
        userEmail: userEmail,
        message: reports.length > 0 
          ? `${reports.length} rapport${reports.length > 1 ? 's' : ''} trouvé${reports.length > 1 ? 's' : ''}`
          : 'Aucun rapport trouvé'
      });

    } catch (error: any) {
      console.error('❌ [UserReports] Erreur Firestore:', error);
      
      // Si c'est une erreur d'index, la propager
      if (error.code === 9 || error.message?.includes('index')) {
        console.error('🚨 [UserReports] INDEX MANQUANT');
        return NextResponse.json(
          { 
            error: 'Firestore index required',
            code: error.code,
            message: error.message,
            details: 'This query requires a Firestore index. Check the console for the index creation link.'
          },
          { status: 400 }
        );
      }
      
      // En cas d'autre erreur, retourner une liste vide
      return NextResponse.json({
        success: true,
        reports: [],
        total: 0,
        userId: uid,
        userEmail: userEmail,
        message: 'Erreur lors de la récupération des rapports.'
      });
    }

  } catch (error: any) {
    console.error('❌ [UserReports] Erreur API globale:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

