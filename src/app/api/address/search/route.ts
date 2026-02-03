/**
 * API Route: /api/address/search
 * Recherche d'adresses avec autocomplétion via adresse.data.gouv.fr
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 3) {
      return NextResponse.json(
        { error: 'Query must be at least 3 characters' },
        { status: 400 }
      );
    }

    // Normalisation de la requête pour améliorer les résultats
    // Retire les compléments de noms de rue qui perturbent l'API BAN
    const normalizeQuery = (q: string): string => {
      return q
        // Retire les compléments de noms célèbres (ex: "St John Perse", "Victor Hugo", etc.)
        .replace(/\s+(St|Saint)\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)?/gi, '')
        // Nettoie les espaces multiples
        .replace(/\s+/g, ' ')
        .trim();
    };

    const normalizedQuery = normalizeQuery(query);

    // Appel à l'API adresse.data.gouv.fr
    const response = await fetch(
      `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(normalizedQuery)}&limit=5`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('BAN API Error:', response.status, errorText);
      throw new Error(`Failed to fetch addresses: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Erreur recherche adresse:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
