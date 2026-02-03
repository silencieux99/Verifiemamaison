
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
        return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    try {
        // 1. BAN
        const addressRes = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(address)}&limit=1`);
        const addressData = await addressRes.json();

        if (!addressData.features || addressData.features.length === 0) {
            return NextResponse.json({ error: 'Address not found' }, { status: 404 });
        }

        const feature = addressData.features[0];
        const coordinates = feature.geometry.coordinates; // [lon, lat]
        const lon = coordinates[0];
        const lat = coordinates[1];
        const cityCode = feature.properties.citycode;

        // Target Address filter
        const targetNumber = feature.properties.housenumber ? parseFloat(feature.properties.housenumber) : null;
        const targetStreetToken = feature.properties.street ? feature.properties.street.toLowerCase().replace(/[^a-z0-9]/g, '') : '';

        let cleanTransactions: any[] = []; // Neighborhood
        let exactMatches: any[] = []; // Specific Property

        let totalPriceM2 = 0;
        let countM2 = 0;

        try {
            // 2. Official Chain
            const geom = JSON.stringify({ "type": "Point", "coordinates": [lon, lat] });
            const ignRes = await fetch(`https://apicarto.ign.fr/api/cadastre/division?geom=${encodeURIComponent(geom)}`);
            const ignData = await ignRes.ok ? await ignRes.json() : null;

            if (ignData && ignData.features && ignData.features.length > 0) {
                const props = ignData.features[0].properties;
                const sectionPrefix = (props.com_abs || '000') + props.section;

                const etalabRes = await fetch(`https://app.dvf.etalab.gouv.fr/api/mutations3/${cityCode}/${sectionPrefix}`);
                if (etalabRes.ok) {
                    const etalabData = await etalabRes.json();
                    const rawMutations = etalabData.mutations || [];

                    rawMutations.forEach((m: any) => {
                        const nature = m.nature_mutation || '';
                        const price = parseFloat(m.valeur_fonciere);
                        const surface = parseFloat(m.surface_reelle_bati);
                        const typeLocal = parseInt(m.code_type_local);

                        const mNumber = m.adresse_numero ? parseFloat(m.adresse_numero) : null;
                        const mStreet = m.adresse_nom_voie ? m.adresse_nom_voie.toLowerCase().replace(/[^a-z0-9]/g, '') : '';

                        if (
                            nature.includes('Vente') &&
                            !isNaN(price) && price > 0 &&
                            !isNaN(surface) && surface > 9
                        ) {
                            const transaction = {
                                date: m.date_mutation,
                                price: price,
                                surface: surface,
                                address: m.adresse_nom_voie ? `${m.adresse_numero || ''} ${m.adresse_nom_voie}` : 'Adresse non précisée',
                                id: m.id_mutation
                            };

                            // Neighborhood Data (Price M2)
                            const priceM2 = price / surface;
                            if (priceM2 > 500 && priceM2 < 30000) {
                                totalPriceM2 += priceM2;
                                countM2++;
                                cleanTransactions.push(transaction);
                            }

                            // Exact Match Data (Last Sale, History)
                            if (targetNumber && mNumber === targetNumber) {
                                // Match Number. Optional: Match Street too if needed, but in same Section usually OK.
                                // Adding partial street match for safety
                                if (!targetStreetToken || mStreet.includes(targetStreetToken) || targetStreetToken.includes(mStreet)) {
                                    exactMatches.push(transaction);
                                }
                            } else if (!targetNumber && (!targetStreetToken || mStreet.includes(targetStreetToken))) {
                                // Fallback if no number
                                exactMatches.push(transaction);
                            }
                        }
                    });
                }
            }
        } catch (e) {
            console.error("Official DVF Chain Error:", e);
        }

        cleanTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        exactMatches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const averagePriceM2 = countM2 > 0 ? Math.round(totalPriceM2 / countM2) : 0;

        // IMPORTANT: Last Sale must be the property itself, not the neighbor!
        // BUT: If no exact match, use most recent neighborhood sale as estimate
        const lastSale = exactMatches.length > 0
            ? exactMatches[0]
            : (cleanTransactions.length > 0 ? cleanTransactions[0] : null);

        const risksRes = await fetch(`https://georisques.gouv.fr/api/v1/gaspar/risques?latlon=${lon},${lat}`);
        const risksData = await risksRes.ok ? await risksRes.json() : { data: [] };
        const relevantRisks = new Set<string>();
        const riskKeywords = ['inondation', 'terrain', 'industriel', 'seisme', 'radon'];
        if (risksData.data) {
            risksData.data.forEach((r: any) => {
                const label = (r.libelle_risque_long || '').toLowerCase();
                if (riskKeywords.some(k => label.includes(k))) {
                    relevantRisks.add(r.libelle_risque_long);
                }
            });
        }

        const googleApiKey = process.env.GOOGLE_MAPS_API_KEY || '';
        const streetViewUrl = googleApiKey
            ? `https://maps.googleapis.com/maps/api/streetview?size=800x600&location=${lat},${lon}&key=${googleApiKey}`
            : null;

        // DPE (Diagnostic de Performance Énergétique)
        let dpeData = { found: false };
        try {
            const dpeRes = await fetch(`http://localhost:3000/api/dpe/search?address=${encodeURIComponent(address)}`);
            if (dpeRes.ok) {
                dpeData = await dpeRes.json();
            }
        } catch (dpeError) {
            console.error('DPE API Error:', dpeError);
            // Continue sans DPE si erreur
        }


        return NextResponse.json({
            address: {
                label: feature.properties.label,
                street: feature.properties.name,
                city: feature.properties.city,
                zipCode: feature.properties.postcode,
                coordinates: { lat, lon }
            },
            streetViewUrl,
            risks: {
                count: relevantRisks.size,
                summary: Array.from(relevantRisks)
            },
            market: {
                lastSale, // EXACT MATCH
                averagePriceM2, // NEIGHBORHOOD AVG
                transactionsCount: cleanTransactions.length, // NEIGHBORHOOD VOLUME
                history: exactMatches.slice(0, 5) // EXACT MATCH HISTORY
            },
            dpe: dpeData, // DPE DATA
            hasDvfData: exactMatches.length > 0 // Flag if we found the property
        });

    } catch (error) {
        console.error('Preview API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
