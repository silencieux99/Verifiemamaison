import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * API pour récupérer l'historique des visiteurs jusqu'à un an
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

    const searchParams = req.nextUrl.searchParams;
    const timeRange = searchParams.get('range') || 'year'; // year, month, week, day
    const limitCount = parseInt(searchParams.get('limit') || '1000');

    // Calculer la date de début selon la période
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
      default:
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }

    const startTimestamp = Timestamp.fromDate(startDate);

    // Récupérer les visites depuis la collection 'visits'
    const visitsSnapshot = await adminDb
      .collection('visits')
      .where('timestamp', '>=', startTimestamp)
      .orderBy('timestamp', 'desc')
      .limit(limitCount)
      .get();

    const visits = visitsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toMillis?.() || data.timestamp,
      };
    });

    // Calculer les statistiques
    const stats = {
      total: visits.length,
      uniqueSessions: new Set(visits.map((v: any) => v.sessionId)).size,
      mobile: visits.filter((v: any) => v.isMobile).length,
      desktop: visits.filter((v: any) => !v.isMobile).length,
      browsers: {} as { [key: string]: number },
      os: {} as { [key: string]: number },
      pages: {} as { [key: string]: number },
      languages: {} as { [key: string]: number },
      hourly: {} as { [key: number]: number },
      daily: {} as { [key: string]: number },
    };

    visits.forEach((visit: any) => {
      // Browsers
      stats.browsers[visit.browser] = (stats.browsers[visit.browser] || 0) + 1;
      
      // OS
      stats.os[visit.os] = (stats.os[visit.os] || 0) + 1;
      
      // Pages
      stats.pages[visit.path] = (stats.pages[visit.path] || 0) + 1;
      
      // Languages
      stats.languages[visit.language] = (stats.languages[visit.language] || 0) + 1;
      
      // Hourly distribution
      if (visit.timestamp) {
        const date = new Date(visit.timestamp);
        const hour = date.getHours();
        stats.hourly[hour] = (stats.hourly[hour] || 0) + 1;
        
        // Daily distribution
        const dayKey = date.toISOString().split('T')[0];
        stats.daily[dayKey] = (stats.daily[dayKey] || 0) + 1;
      }
    });

    return NextResponse.json({
      visits,
      stats,
      timeRange,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
    });
  } catch (error) {
    console.error('Erreur récupération historique visiteurs:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'historique' },
      { status: 500 }
    );
  }
}

