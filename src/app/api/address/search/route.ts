import { NextRequest, NextResponse } from 'next/server';
import { searchAddress, geocodeAddress } from '@/lib/address-api';

/**
 * API de recherche d'adresse
 * Utilise l'API Adresse du gouvernement français
 */
export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get('q');
    
    if (!query) {
      return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
    }

    const result = await searchAddress(query);
    
    if (!result) {
      return NextResponse.json({ error: 'No results found' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Address search error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Géocode une adresse complète
 */
export async function POST(req: NextRequest) {
  try {
    const { address, postalCode, city } = await req.json();
    
    if (!address || !postalCode || !city) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await geocodeAddress(address, postalCode, city);
    
    if (!result) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Geocode error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

