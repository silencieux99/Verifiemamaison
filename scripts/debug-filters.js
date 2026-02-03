
const cityCode = "93005"; // Aulnay
const sectionPrefix = "000AJ";
const targetNumber = "36";
const targetStreet = "Auguste Blanqui";

async function debugFilters() {
    console.log(`Debugging Filters: ${targetNumber} ${targetStreet}`);
    const url = `https://app.dvf.etalab.gouv.fr/api/mutations3/${cityCode}/${sectionPrefix}`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        const mutations = data.mutations || [];

        console.log(`Total Mutations in Section: ${mutations.length}`);

        // Check finding 36
        const matches = mutations.filter(m => {
            const mNum = m.adresse_numero;
            const mStreet = m.adresse_nom_voie;
            const fullAddr = `${mNum || ''} ${mStreet || ''}`;

            // Log matches for number 36
            if (mNum == 36) {
                console.log(`[CANDIDATE] Num: ${mNum}, Suffix: ${m.adresse_suffixe}, Street: ${mStreet}, Type: ${m.code_type_local}, Nature: ${m.nature_mutation}`);
            }

            return mNum == 36;
        });

        console.log(`Found ${matches.length} candidates with number 36.`);

    } catch (e) {
        console.error(e);
    }
}

debugFilters();
