import { NextRequest, NextResponse } from 'next/server';
import { getPropertyInfo } from '@/lib/dvf-api';
import { geocodeAddress } from '@/lib/address-api';

/**
 * API de recherche d'informations immobilières
 * Combine l'API Adresse et DVF pour obtenir des infos complètes
 */
export async function POST(req: NextRequest) {
  try {
    const { address, postalCode, city } = await req.json();
    
    if (!address || !postalCode || !city) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Géocoder l'adresse pour obtenir les coordonnées
    const geocodeResult = await geocodeAddress(address, postalCode, city);
    
    // Rechercher les informations DVF
    const dvfResult = await getPropertyInfo(address, postalCode, city);

    if (!dvfResult.success) {
      return NextResponse.json({ error: dvfResult.error || 'Property info not found' }, { status: 404 });
    }

    // Combiner les résultats
    const result = {
      address: `${address}, ${postalCode} ${city}`,
      coordinates: geocodeResult?.geometry?.coordinates 
        ? {
            lat: geocodeResult.geometry.coordinates[1],
            lon: geocodeResult.geometry.coordinates[0],
          }
        : dvfResult.data?.coordinates,
      transactions: dvfResult.data?.transactions,
      averagePrice: dvfResult.data?.averagePrice,
      pricePerM2: dvfResult.data?.pricePerM2,
      geocodeData: geocodeResult?.properties,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Property lookup error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

