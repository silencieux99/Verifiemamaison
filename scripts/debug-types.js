
const cityCode = "93005"; // Aulnay
const sectionPrefix = "000AJ";

async function checkTypes() {
    try {
        const etalabUrl = `https://app.dvf.etalab.gouv.fr/api/mutations3/${cityCode}/${sectionPrefix}`;
        console.log(`Fetching: ${etalabUrl}`);
        const res = await fetch(etalabUrl);
        const data = await res.json();

        if (data.mutations?.length > 0) {
            const m = data.mutations[0];
            console.log("First Mutation Types:");
            console.log(`code_type_local: ${m.code_type_local} (Type: ${typeof m.code_type_local})`);
            console.log(`valeur_fonciere: ${m.valeur_fonciere} (Type: ${typeof m.valeur_fonciere})`);
            console.log(`surface_reelle_bati: ${m.surface_reelle_bati} (Type: ${typeof m.surface_reelle_bati})`);
            console.log(`nature_mutation: '${m.nature_mutation}'`);
        } else {
            console.log("No mutations found to check.");
        }
    } catch (e) {
        console.error(e);
    }
}

checkTypes();
