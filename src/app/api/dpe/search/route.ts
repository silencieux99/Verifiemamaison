/**
 * API Route: /api/dpe/search
 * Recherche de DPE (Diagnostic de Performance Énergétique) via l'API ADEME
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const address = searchParams.get('address');

        if (!address) {
            return NextResponse.json(
                { error: 'Address is required' },
                { status: 400 }
            );
        }

        // Appel à l'API DPE France (ADEME)
        const response = await fetch(
            `https://data.ademe.fr/data-fair/api/v1/datasets/dpe-france/lines?q=${encodeURIComponent(address)}&size=5`,
            {
                headers: {
                    'Accept': 'application/json',
                },
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('DPE API Error:', response.status, errorText);
            return NextResponse.json({ found: false, results: [] });
        }

        const data = await response.json();

        // Si aucun résultat
        if (!data.results || data.results.length === 0) {
            return NextResponse.json({ found: false, results: [] });
        }

        // Filtrer les résultats avec un bon score de matching (>= 0.5)
        const goodMatches = data.results.filter((r: any) => {
            const score = parseFloat(r.geo_score || 0);
            return score >= 0.5;
        });

        if (goodMatches.length === 0) {
            return NextResponse.json({ found: false, results: [] });
        }

        // Prendre le meilleur résultat (score le plus élevé)
        const bestMatch = goodMatches.reduce((best: any, current: any) => {
            const bestScore = parseFloat(best.geo_score || 0);
            const currentScore = parseFloat(current.geo_score || 0);
            return currentScore > bestScore ? current : best;
        }, goodMatches[0]);

        // Formater la réponse
        return NextResponse.json({
            found: true,
            classe_energie: bestMatch.classe_consommation_energie || null,
            classe_ges: bestMatch.classe_estimation_ges || null,
            consommation_energie: bestMatch.consommation_energie ? parseInt(bestMatch.consommation_energie) : null,
            estimation_ges: bestMatch.estimation_ges ? parseInt(bestMatch.estimation_ges) : null,
            annee_construction: bestMatch.annee_construction ? parseInt(bestMatch.annee_construction) : null,
            surface: bestMatch.surface_thermique_lot ? parseInt(bestMatch.surface_thermique_lot) : null,
            type_batiment: bestMatch.tr002_type_batiment_description || null,
            date_etablissement: bestMatch.date_etablissement_dpe || null,
            numero_dpe: bestMatch.numero_dpe || null,
            geo_score: parseFloat(bestMatch.geo_score || 0),
            adresse_dpe: bestMatch.geo_adresse || null,
        });

    } catch (error) {
        console.error('DPE Search Error:', error);
        return NextResponse.json(
            { found: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
