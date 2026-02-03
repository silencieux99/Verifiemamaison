
const lat = 48.936905;
const lon = 2.501362;
const cityCode = "93005"; // Aulnay

async function testChain() {
    console.log("Testing Chain for [No Mock] - Final Check");

    try {
        const geom = JSON.stringify({ "type": "Point", "coordinates": [lon, lat] });
        const ignUrl = `https://apicarto.ign.fr/api/cadastre/division?geom=${encodeURIComponent(geom)}`;
        const ignRes = await fetch(ignUrl);
        const ignData = await ignRes.json();

        if (!ignData.features || ignData.features.length === 0) throw new Error("No section");

        const props = ignData.features[0].properties;
        console.log(`[IGN] Section: ${props.section}, Prefix: ${props.com_abs}`);

        const sectionFull = (props.com_abs || '000') + props.section;
        console.log(`[ETALAB] Target Section: ${sectionFull}`);

        const etalabUrl = `https://app.dvf.etalab.gouv.fr/api/mutations3/${cityCode}/${sectionFull}`;
        console.log(`[ETALAB] Fetching: ${etalabUrl}`);

        const dvfRes = await fetch(etalabUrl);
        if (!dvfRes.ok) throw new Error(`Etalab Failed: ${dvfRes.status}`);

        const dvfData = await dvfRes.json();
        console.log(`[ETALAB] Success! Found ${dvfData.mutations?.length} mutations.`);

        // Check if we have our demo transaction 
        if (dvfData.mutations?.length > 0) {
            console.log("Sample:", dvfData.mutations[0]);
        }

    } catch (e) {
        console.error("❌ Error:", e.message);
    }
}

testChain();
