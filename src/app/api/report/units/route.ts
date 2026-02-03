
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
        return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    try {
        // 1. Gouv Address API (BAN)
        const addressRes = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(address)}&limit=1`);
        const addressData = await addressRes.json();

        if (!addressData.features || addressData.features.length === 0) {
            return NextResponse.json({ error: 'Address not found' }, { status: 404 });
        }

        const feature = addressData.features[0];
        const lon = feature.geometry.coordinates[0];
        const lat = feature.geometry.coordinates[1];
        const cityCode = feature.properties.citycode;

        // Extract strict address components for filtering
        // BAN format: housenumber "36", rep "bis", street "Rue Auguste Blanqui"
        const targetNumber = feature.properties.housenumber;
        const targetRep = feature.properties.rep; // e.g. "bis"
        const targetStreet = feature.properties.street;

        // 2. Official DVF Chain
        // A. IGN Section (Get Cadastral Section ID)
        const geom = JSON.stringify({ "type": "Point", "coordinates": [lon, lat] });
        const ignRes = await fetch(`https://apicarto.ign.fr/api/cadastre/division?geom=${encodeURIComponent(geom)}`);
        const ignData = await ignRes.ok ? await ignRes.json() : null;

        let transactions: any[] = [];

        if (ignData && ignData.features && ignData.features.length > 0) {
            const props = ignData.features[0].properties;
            const sectionPrefix = (props.com_abs || '000') + props.section;

            // B. Etalab DVF (Get ALL mutations in the section)
            const etalabRes = await fetch(`https://app.dvf.etalab.gouv.fr/api/mutations3/${cityCode}/${sectionPrefix}`);
            if (etalabRes.ok) {
                const etalabData = await etalabRes.json();
                const rawMutations = etalabData.mutations || [];

                rawMutations.forEach((m: any) => {
                    const nature = m.nature_mutation || '';
                    const price = parseFloat(m.valeur_fonciere);
                    const surface = parseFloat(m.surface_reelle_bati);
                    const typeLocal = parseInt(m.code_type_local);

                    // STRICT FILTERING: Match House Number and Street Name
                    // Etalab: adresse_numero (int usually), adresse_suffixe (string), adresse_nom_voie

                    // Normalize Number (Handle "36.0" from Etalab vs "36" from BAN)
                    const mNumber = m.adresse_numero ? parseFloat(m.adresse_numero) : null;
                    const tNumber = targetNumber ? parseFloat(targetNumber) : null;

                    // Normalize Suffix...

                    let isAddressMatch = false;

                    if (targetNumber) {
                        // Compare numeric values
                        if (mNumber === tNumber) {
                            // Check suffix if exists in BAN
                            // Map BAN "bis" -> "B", "ter" -> "T" etc is complex.
                            // Let's rely on Number Match + Street Name containment which is usually enough to filter out other streets in the section.

                            // Check Street Name
                            // m.adresse_nom_voie: "RUE AUGUSTE BLANQUI"
                            // targetStreet: "Rue Auguste Blanqui"
                            const mStreet = (m.adresse_nom_voie || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                            const tStreet = (targetStreet || '').toLowerCase().replace(/[^a-z0-9]/g, '');

                            if (mStreet.includes(tStreet) || tStreet.includes(mStreet)) {
                                // Suffix check? "36" vs "36 bis" are different.
                                // If BAN said "36", and Etalab has "36" with no suffix, match.
                                // If BAN said "36 bis", Etalab should have suffix.
                                // This is tricky. Let's start with Number Match matching.
                                isAddressMatch = true;
                            }
                        }
                    } else {
                        // No number in address query? Match only street? Risk of too many results.
                        // But user typically searches with number.
                        isAddressMatch = true;
                    }

                    if (
                        isAddressMatch &&
                        nature.includes('Vente') &&
                        !isNaN(price) && price > 0 &&
                        !isNaN(surface) && surface > 9 &&
                        (typeLocal === 1 || typeLocal === 2)
                    ) {
                        transactions.push({
                            id: m.id_mutation,
                            date: m.date_mutation,
                            price: price,
                            surface: surface,
                            rooms: parseInt(m.nombre_pieces_principales) || 0,
                            type: typeLocal === 1 ? 'Maison' : 'Appartement',
                            floor: null
                        });
                    }
                });
            }
        }

        // Sort by most recent
        transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return NextResponse.json({
            address: {
                label: feature.properties.label,
                city: feature.properties.city,
                coordinates: { lat, lon }
            },
            units: transactions
        });

    } catch (error) {
        console.error('Units API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
