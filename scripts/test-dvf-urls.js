
const urls = [
    "https://api.dvf.etalab.gouv.fr/v2/mutations?lat=48.85&lon=2.35&dist=100",
    "https://app.dvf.etalab.gouv.fr/api/mutations?lat=48.85&lon=2.35&dist=100",
    "https://apidvf.etalab.gouv.fr/api/mutations?lat=48.85&lon=2.35&dist=100",
    "http://api.cquest.org/dvf?lat=48.85&lon=2.35&dist=100"
];

async function testUrls() {
    console.log("Testing DVF URLs...");
    for (const url of urls) {
        try {
            console.log(`Testing: ${url}`);
            const start = Date.now();
            const res = await fetch(url);
            const time = Date.now() - start;
            if (res.ok) {
                console.log(`✅ SUCCESS (${time}ms): ${url}`);
                const data = await res.json();
                console.log(`   Data keys: ${Object.keys(data).join(', ')}`);
                console.log(`   Features count: ${data.features?.length}`);
            } else {
                console.log(`❌ FAILED (${res.status}): ${url}`);
            }
        } catch (err) {
            console.log(`❌ ERROR: ${url} - ${err.message}`);
        }
    }
}

testUrls();
