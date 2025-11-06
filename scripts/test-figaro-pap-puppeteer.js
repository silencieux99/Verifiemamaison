/**
 * Test des scrapers Le Figaro Immobilier et PAP avec Puppeteer
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const address = '36 rue auguste blanqui a aulnay sous bois';

async function testFigaroAndPAP() {
  console.log('🏠 Test des scrapers Le Figaro et PAP avec Puppeteer');
  console.log('📍 Adresse:', address);
  console.log('');

  try {
    // Géocoder l'adresse
    const geocodeUrl = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(address)}&limit=1`;
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();
    const feature = geocodeData.features[0];
    const [lon, lat] = feature.geometry.coordinates;
    const normalizedAddress = feature.properties.label;
    const postcode = normalizedAddress.match(/\b(\d{5})\b/)?.[1] || '93600';

    console.log('✅ Coordonnées:', lat, lon);
    console.log('');

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      // Test 1: Le Figaro Immobilier
      console.log('🔍 Test 1: Le Figaro Immobilier...');
      const page1 = await browser.newPage();
      await page1.setViewport({ width: 1920, height: 1080 });
      
      const figaroUrl = `https://immobilier.lefigaro.fr/annonces/vente?lat=${lat}&lng=${lon}&radius=2`;
      console.log('   URL:', figaroUrl);
      
      await page1.goto(figaroUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const figaroHTML = await page1.content();
      console.log(`   📄 HTML: ${figaroHTML.length} caractères`);
      
      // Chercher des annonces
      const figaroData = await page1.evaluate(() => {
        const listings = [];
        
        // Chercher les éléments d'annonces
        const adElements = document.querySelectorAll('[class*="annonce"], [class*="listing"], [class*="property"], article');
        
        adElements.forEach((el, i) => {
          if (i < 10) { // Limiter à 10 pour le test
            const listing = {
              index: i + 1,
              html: el.outerHTML.substring(0, 200),
            };
            
            const titleEl = el.querySelector('h2, h3, [class*="title"]');
            if (titleEl) listing.title = titleEl.textContent?.trim();
            
            const priceEl = el.querySelector('[class*="price"], [class*="prix"]');
            if (priceEl) listing.price = priceEl.textContent?.trim();
            
            listings.push(listing);
          }
        });
        
        return {
          listings,
          hasInitialState: !!window.__INITIAL_STATE__,
          hasNextData: !!window.__NEXT_DATA__,
          title: document.title,
        };
      });
      
      console.log(`   ✅ ${figaroData.listings.length} élément(s) trouvé(s)`);
      console.log(`   📋 Titre: ${figaroData.title}`);
      console.log(`   🔍 __INITIAL_STATE__: ${figaroData.hasInitialState ? '✅' : '❌'}`);
      console.log(`   🔍 __NEXT_DATA__: ${figaroData.hasNextData ? '✅' : '❌'}`);
      
      if (figaroData.listings.length > 0) {
        console.log('   Exemples:');
        figaroData.listings.slice(0, 3).forEach((l, i) => {
          console.log(`      ${i + 1}. ${l.title || 'Sans titre'}`);
          if (l.price) console.log(`         Prix: ${l.price}`);
        });
      }
      
      await page1.close();
      console.log('');

      // Test 2: PAP
      console.log('🔍 Test 2: PAP (Particulier à Particulier)...');
      const page2 = await browser.newPage();
      await page2.setViewport({ width: 1920, height: 1080 });
      
      const papUrl = `https://www.pap.fr/annonces/vente-${postcode}`;
      console.log('   URL:', papUrl);
      
      await page2.goto(papUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const papHTML = await page2.content();
      console.log(`   📄 HTML: ${papHTML.length} caractères`);
      
      // Chercher des annonces
      const papData = await page2.evaluate(() => {
        const listings = [];
        
        // Chercher les éléments d'annonces PAP
        const adElements = document.querySelectorAll('[class*="annonce"], [class*="ad"], [class*="listing"], article, .property-card');
        
        adElements.forEach((el, i) => {
          if (i < 10) {
            const listing = {
              index: i + 1,
              html: el.outerHTML.substring(0, 200),
            };
            
            const titleEl = el.querySelector('h2, h3, h4, [class*="title"], [class*="titre"]');
            if (titleEl) listing.title = titleEl.textContent?.trim();
            
            const priceEl = el.querySelector('[class*="price"], [class*="prix"]');
            if (priceEl) listing.price = priceEl.textContent?.trim();
            
            const surfaceEl = el.querySelector('[class*="surface"], [class*="m2"]');
            if (surfaceEl) listing.surface = surfaceEl.textContent?.trim();
            
            listings.push(listing);
          }
        });
        
        return {
          listings,
          hasInitialState: !!window.__INITIAL_STATE__,
          hasNextData: !!window.__NEXT_DATA__,
          title: document.title,
          bodyClasses: document.body?.className || '',
        };
      });
      
      console.log(`   ✅ ${papData.listings.length} élément(s) trouvé(s)`);
      console.log(`   📋 Titre: ${papData.title}`);
      console.log(`   🔍 __INITIAL_STATE__: ${papData.hasInitialState ? '✅' : '❌'}`);
      console.log(`   🔍 __NEXT_DATA__: ${papData.hasNextData ? '✅' : '❌'}`);
      console.log(`   🏷️ Classes body: ${papData.bodyClasses.substring(0, 100)}`);
      
      if (papData.listings.length > 0) {
        console.log('   Exemples:');
        papData.listings.slice(0, 3).forEach((l, i) => {
          console.log(`      ${i + 1}. ${l.title || 'Sans titre'}`);
          if (l.price) console.log(`         Prix: ${l.price}`);
          if (l.surface) console.log(`         Surface: ${l.surface}`);
        });
      }
      
      await page2.close();
      console.log('');

      // Résumé
      console.log('📊 Résumé:');
      console.log(`   - Le Figaro: ${figaroData.listings.length > 0 ? '✅ Annonces trouvées' : '❌ Aucune annonce'}`);
      console.log(`   - PAP: ${papData.listings.length > 0 ? '✅ Annonces trouvées' : '❌ Aucune annonce'}`);
      console.log('');
      
      if (figaroData.listings.length > 0 || papData.listings.length > 0) {
        console.log('✅ Au moins une source fonctionne!');
        console.log('💡 Prochaine étape: Implémenter le parsing complet');
      } else {
        console.log('⚠️ Aucune annonce trouvée');
        console.log('💡 Les sites peuvent utiliser un chargement dynamique');
        console.log('   Essayer d\'attendre plus longtemps ou chercher les APIs internes');
      }

      await browser.close();

    } catch (error) {
      await browser.close();
      throw error;
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

testFigaroAndPAP();

