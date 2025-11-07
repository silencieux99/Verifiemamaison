/**
 * Endpoint de test pour l'API Melo
 * Permet de vérifier que la configuration et l'intégration fonctionnent
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  isMeloConfigured, 
  searchMeloAdverts, 
  searchMeloProperties 
} from '@/lib/melo-api';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Vérifier la configuration
    const configured = isMeloConfigured();
    
    if (!configured) {
      return NextResponse.json({
        success: false,
        error: 'MELO_API_KEY non configurée',
        message: 'Ajoutez MELO_API_KEY dans votre fichier .env.local',
      }, { status: 400 });
    }

    // Récupérer les paramètres de test depuis la query string
    const searchParams = request.nextUrl.searchParams;
    const lat = parseFloat(searchParams.get('lat') || '48.8566'); // Paris par défaut
    const lon = parseFloat(searchParams.get('lon') || '2.3522');
    const radius_m = parseInt(searchParams.get('radius_m') || '2000', 10);
    const testType = searchParams.get('type') || 'adverts'; // 'adverts' ou 'properties'

    const testResults: any = {
      configured: true,
      apiKey: process.env.MELO_API_KEY ? `${process.env.MELO_API_KEY.substring(0, 8)}...` : 'non définie',
      baseUrl: process.env.MELO_API_BASE_URL || 'https://api.melo.io',
      environment: process.env.MELO_ENVIRONMENT || 'production',
      testParams: {
        latitude: lat,
        longitude: lon,
        radius_m,
        testType,
      },
    };

    // Tester la recherche
    try {
      if (testType === 'adverts') {
        const advertsResult = await searchMeloAdverts({
          latitude: lat,
          longitude: lon,
          radius_m,
          limit: 5,
        });
        
        testResults.adverts = {
          success: true,
          total: advertsResult.total || 0,
          count: advertsResult.adverts?.length || 0,
          hasMore: advertsResult.hasMore || false,
          sample: advertsResult.adverts?.slice(0, 2).map(a => ({
            id: a.id,
            title: a.title,
            price: a.price,
            surface: a.surface,
            url: a.url,
          })),
        };
      } else {
        const propertiesResult = await searchMeloProperties({
          latitude: lat,
          longitude: lon,
          radius_m,
          limit: 5,
        });
        
        testResults.properties = {
          success: true,
          total: propertiesResult.total || 0,
          count: propertiesResult.properties?.length || 0,
          hasMore: propertiesResult.hasMore || false,
          sample: propertiesResult.properties?.slice(0, 2).map(p => ({
            id: p.id,
            address: p.address,
            price: p.price,
            surface: p.surface,
          })),
        };
      }

      testResults.success = true;
      testResults.message = 'API Melo fonctionne correctement !';
    } catch (apiError: any) {
      testResults.success = false;
      testResults.apiError = {
        message: apiError.message,
        // Ne pas exposer les détails sensibles de l'erreur
        type: apiError.name || 'UnknownError',
      };
      testResults.message = 'Erreur lors de l\'appel à l\'API Melo. Vérifiez les endpoints dans melo-api.ts';
      
      // Si c'est une erreur d'authentification, donner plus de détails
      if (apiError.message?.includes('401') || apiError.message?.includes('Unauthorized')) {
        testResults.message = 'Erreur d\'authentification. Vérifiez que votre clé API est correcte.';
      } else if (apiError.message?.includes('404') || apiError.message?.includes('Not Found')) {
        testResults.message = 'Endpoint non trouvé. Les endpoints dans melo-api.ts doivent être adaptés selon la documentation Melo.';
      } else if (apiError.message?.includes('timeout')) {
        testResults.message = 'Timeout lors de l\'appel API. Vérifiez votre connexion et l\'URL de base.';
      }
    }

    return NextResponse.json(testResults, {
      status: testResults.success ? 200 : 500,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Erreur interne',
      message: error.message,
    }, { status: 500 });
  }
}

