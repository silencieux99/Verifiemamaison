
const address = "36 bis rue auguste blanqui a aulnay sous bois";
const baseUrl = "http://localhost:3000";

async function runTests() {
    console.log(`\n--- Verification Script: ${address} ---\n`);

    try {
        // 1. Test Address Search
        console.log(`[TEST 1] Searching Address...`);
        const searchRes = await fetch(`${baseUrl}/api/address/search?q=${encodeURIComponent(address)}`);
        if (!searchRes.ok) throw new Error(`Search failed: ${searchRes.statusText}`);
        const searchData = await searchRes.json();
        console.log(`✅ [OK] Found ${searchData.features?.length || 0} results.`);
        if (searchData.features?.[0]) {
            console.log(`   Label: ${searchData.features[0].properties.label} (${searchData.features[0].geometry.coordinates.join(', ')})`);
        } else {
            console.log("   Warning: No features found in search.");
        }

        // 2. Test Units (Selection)
        console.log(`\n[TEST 2] Fetching Units (Selection Step)...`);
        const unitsRes = await fetch(`${baseUrl}/api/report/units?address=${encodeURIComponent(address)}`);
        if (!unitsRes.ok) throw new Error(`Units fetch failed: ${unitsRes.statusText}`);
        const unitsData = await unitsRes.json();
        console.log(`✅ [OK] Found ${unitsData.units?.length || 0} transactions.`);
        if (unitsData.units?.length > 0) {
            const u = unitsData.units[0];
            console.log(`   First Unit: ${u.type} ${u.rooms}p ${u.surface}m2 (${u.date}) - Price: ${u.price}€`);
        } else {
            console.log("   Info: No specific units found (might be a house or no recent sales).");
        }

        // 3. Test Preview (Report)
        console.log(`\n[TEST 3] Fetching Report Preview...`);
        const previewRes = await fetch(`${baseUrl}/api/report/preview?address=${encodeURIComponent(address)}`);
        if (!previewRes.ok) throw new Error(`Preview fetch failed: ${previewRes.statusText}`);
        const previewData = await previewRes.json();
        console.log(`✅ [OK] Risks Count: ${previewData.risks?.count}`);
        console.log(`   Market Data: `);
        console.log(`      - Last Sale: ${previewData.market?.lastSale ? previewData.market.lastSale.price + '€' : 'N/A'}`);
        console.log(`      - Avg Price/m2: ${previewData.market?.averagePriceM2} €/m2`);
        console.log(`      - Transactions Count (100m): ${previewData.market?.transactionsCount}`);
        console.log(`   Has StreetView: ${!!previewData.streetViewUrl}`);

    } catch (err) {
        console.error(`\n❌ [ERROR]:`, err.message);
    }
}

runTests();
