import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, isFirebaseAdminInitialized } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // Vérifier que Firebase Admin est initialisé
    if (!isFirebaseAdminInitialized() || !adminAuth || !adminDb) {
      console.error('❌ Firebase Admin non initialisé');
      return NextResponse.json(
        {
          error: 'Firebase Admin not initialized',
          message: 'Server configuration error. Please check Firebase Admin credentials.'
        },
        { status: 500 }
      );
    }

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
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (error: any) {
      console.error('❌ Erreur vérification token:', error);
      return NextResponse.json(
        {
          error: 'Invalid authentication token',
          details: error.message
        },
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
      let reportsSnapshot;

      try {
        // Tentative 1: Requête optimisée avec index (Tri par date DESC)
        reportsSnapshot = await adminDb.collection('reports')
          .where('userId', '==', uid)
          .orderBy('createdAt', 'desc')
          .limit(100)
          .get();
      } catch (queryError: any) {
        // Si erreur d'index (code 9 ou message explicite), on bascule sur le fallback
        if (queryError.code === 9 || queryError.message?.toString().toLowerCase().includes('index')) {
          console.warn('⚠️ [UserReports] Index manquant, basculement sur le tri en mémoire.');

          // Tentative 2: Requête simple sans tri (fallback)
          reportsSnapshot = await adminDb.collection('reports')
            .where('userId', '==', uid)
            .limit(100)
            .get();

          // Si on a des docs, on devra les trier manuellement plus bas
          // Note: Snapshot n'est pas un tableau, donc on triera le tableau `reports` final
        } else {
          // Autre erreur réelle -> on la remonte
          throw queryError;
        }
      }

      console.log(`📊 Trouvé ${reportsSnapshot.docs.length} rapports pour ${uid}`);

      const reports = [];

      for (const doc of reportsSnapshot.docs) {
        const reportData = doc.data();

        // Formater la date pour l'affichage
        let formattedDate = 'Date inconnue';
        let timestamp = reportData.createdAt;

        if (timestamp) {
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
          createdAt: timestamp, // Garder l'objet original pour le tri éventuel
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

      // Tri en mémoire de sécurité (si le tri DB a échoué ou n'a pas été fait)
      reports.sort((a, b) => {
        const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
        const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
        return dateB - dateA; // Plus récent en premier
      });

      console.log(`✅ ${reports.length} rapports récupérés et triés pour ${uid}`);

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

      // En cas d'erreur fatale, retourner une liste vide pour ne pas casser l'UI
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

