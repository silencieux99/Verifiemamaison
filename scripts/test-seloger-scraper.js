/**
 * Script de test pour le scraper SeLoger
 * Teste la recherche d'annonces autour d'une adresse
 * Utilise Puppeteer pour contourner les protections anti-bot
 */

const puppeteer = require('puppeteer');
const address = '36 rue auguste blanqui a aulnay sous bois';

async function testSeLogerScraper() {
  console.log('🏠 Test du scraper SeLoger');
  console.log('📍 Adresse:', address);
  console.log('');

  try {
    // 1. Géocoder l'adresse pour obtenir les coordonnées
    console.log('🔍 Étape 1: Géocodage de l\'adresse...');
    const geocodeUrl = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(address)}&limit=1`;
    const geocodeResponse = await fetch(geocodeUrl);
    
    if (!geocodeResponse.ok) {
      throw new Error(`Géocodage échoué: ${geocodeResponse.status}`);
    }

    const geocodeData = await geocodeResponse.json();
    
    if (!geocodeData.features || geocodeData.features.length === 0) {
      throw new Error('Adresse non trouvée');
    }

    const feature = geocodeData.features[0];
    const [lon, lat] = feature.geometry.coordinates;
    const normalizedAddress = feature.properties.label;

    console.log('✅ Adresse géocodée:');
    console.log('   - Coordonnées:', lat, lon);
    console.log('   - Adresse normalisée:', normalizedAddress);
    console.log('');

    // 2. Rechercher les annonces SeLoger
    console.log('🔍 Étape 2: Recherche des annonces SeLoger...');
    
    // Construire l'URL de recherche SeLoger
    // Utiliser une recherche par ville/code postal plutôt que GPS pour éviter DataDome
    const city = normalizedAddress.match(/(\d{5})\s+(.+)/);
    const postcode = city ? city[1] : '93600';
    const cityName = city ? city[2] : 'Aulnay-sous-Bois';
    
    // Format SeLoger: recherche par ville
    const searchParams = new URLSearchParams();
    searchParams.set('types', '1,2'); // Appartements et maisons
    searchParams.set('projects', '2'); // Vente
    searchParams.set('LISTING-LISTpg', '1');
    // Recherche par ville plutôt que GPS
    searchParams.set('ci', postcode); // Code postal
    searchParams.set('idtt', '2'); // Type de transaction: vente
    searchParams.set('idtypebien', '1,2'); // Type de bien: appartement, maison

    const selogerUrl = `https://www.seloger.com/list.htm?${searchParams.toString()}`;
    console.log('   URL de recherche:', selogerUrl);
    console.log('');

    // Utiliser Puppeteer pour simuler un vrai navigateur
    console.log('🌐 Lancement de Puppeteer...');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      
      // Configurer les headers et le viewport
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Intercepter les requêtes pour détecter DataDome
      page.on('response', response => {
        if (response.url().includes('captcha-delivery.com') || response.url().includes('datadome')) {
          console.log('   ⚠️ DataDome détecté:', response.url());
        }
      });

      console.log('📡 Navigation vers SeLoger...');
      await page.goto(selogerUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      // Vérifier si on est bloqué par DataDome
      const pageUrl = page.url();
      if (pageUrl.includes('captcha') || pageUrl.includes('datadome')) {
        console.log('   ⚠️ Bloqué par DataDome, tentative de contournement...');
        // Attendre un peu et réessayer
        await new Promise(resolve => setTimeout(resolve, 5000));
        await page.goto(selogerUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      }

      // Attendre que les annonces se chargent
      console.log('⏳ Attente du chargement des annonces...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Attendre qu'au moins un élément d'annonce soit présent (ou timeout après 15s)
      try {
        await page.waitForSelector('.c-pa-link, [data-listing-id], .c-pa-slider, .c-pa-list, .listing', { timeout: 15000 });
        console.log('   ✅ Éléments d\'annonces détectés');
      } catch (e) {
        console.log('   ⚠️ Aucun élément d\'annonce trouvé, continuation...');
      }

      // Récupérer le HTML
      const html = await page.content();
      console.log('✅ Page HTML reçue (', html.length, 'caractères)');
      console.log('');

      // Vérifier si on est toujours sur une page de captcha
      const currentUrl = page.url();
      const pageTitle = await page.title();
      console.log('   URL actuelle:', currentUrl);
      console.log('   Titre:', pageTitle);
      
      if (currentUrl.includes('captcha') || pageTitle.toLowerCase().includes('captcha')) {
        console.log('   ❌ Toujours bloqué par DataDome/Captcha');
        console.log('   💡 Solution: Utiliser une approche différente ou attendre manuellement');
        await browser.close();
        return;
      }

      // Essayer de trouver les annonces dans la page
      const listings = await page.evaluate(() => {
        const results = [];
        
        // Chercher les éléments d'annonces (sélecteurs SeLoger courants)
        // SeLoger utilise plusieurs classes possibles
        const selectors = [
          '.c-pa-link',
          '[data-listing-id]',
          '.c-pa-slider',
          '.c-pa-list .c-pa-link',
          '.listing-card',
          '[class*="listing"]',
          '[class*="annonce"]',
        ];

        // Chercher les annonces par différents sélecteurs
        const listingElements = document.querySelectorAll('.c-pa-link, [data-listing-id], .c-pa-slider, .listing-card, [class*="listing"]');
        
        listingElements.forEach((el, index) => {
          try {
            const listing = {
              index: index + 1,
              id: el.getAttribute('data-listing-id') || el.getAttribute('id') || `listing-${index}`,
              html: el.outerHTML.substring(0, 200),
            };
            
            // Extraire le prix
            const priceEl = el.querySelector('.c-pa-price, [data-price]');
            if (priceEl) {
              listing.price = priceEl.textContent?.trim() || priceEl.getAttribute('data-price');
            }
            
            // Extraire l'adresse
            const addressEl = el.querySelector('.c-pa-city, .c-pa-address');
            if (addressEl) {
              listing.address = addressEl.textContent?.trim();
            }
            
            // Extraire la surface
            const surfaceEl = el.querySelector('[data-surface], .c-pa-surface');
            if (surfaceEl) {
              listing.surface = surfaceEl.textContent?.trim() || surfaceEl.getAttribute('data-surface');
            }
            
            // Extraire le lien
            const linkEl = el.querySelector('a') || el.closest('a');
            if (linkEl) {
              listing.url = linkEl.href;
            }
            
            results.push(listing);
          } catch (e) {
            // Ignorer les erreurs
          }
        });

        return results;
      });

      console.log(`✅ ${listings.length} annonce(s) trouvée(s) via Puppeteer`);
      if (listings.length > 0) {
        console.log('');
        console.log('📋 Exemples d\'annonces:');
        listings.slice(0, 3).forEach((listing, i) => {
          console.log(`   ${i + 1}. ID: ${listing.id}`);
          if (listing.price) console.log(`      Prix: ${listing.price}`);
          if (listing.address) console.log(`      Adresse: ${listing.address}`);
          if (listing.surface) console.log(`      Surface: ${listing.surface}`);
          if (listing.url) console.log(`      URL: ${listing.url}`);
        });
        console.log('');
      }

      // Chercher window.__INITIAL_STATE__ ou données JSON
      const pageData = await page.evaluate(() => {
        const data = {};
        
        // Chercher __INITIAL_STATE__
        if (window.__INITIAL_STATE__) {
          data.initialState = window.__INITIAL_STATE__;
        }
        
        // Chercher d'autres variables globales
        if (window.__NEXT_DATA__) {
          data.nextData = window.__NEXT_DATA__;
        }
        
        // Chercher les scripts JSON-LD
        const jsonLdScripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
        data.jsonLd = jsonLdScripts.map(script => {
          try {
            return JSON.parse(script.textContent);
          } catch (e) {
            return null;
          }
        }).filter(Boolean);
        
        return data;
      });

      if (pageData.initialState) {
        console.log('✅ Trouvé window.__INITIAL_STATE__');
        console.log('   Clés:', Object.keys(pageData.initialState));
      }
      
      if (pageData.nextData) {
        console.log('✅ Trouvé window.__NEXT_DATA__');
      }
      
      if (pageData.jsonLd && pageData.jsonLd.length > 0) {
        console.log(`✅ Trouvé ${pageData.jsonLd.length} balise(s) JSON-LD`);
      }

      // Sauvegarder le HTML
      const fs = require('fs');
      const path = require('path');
      const outputPath = path.join(__dirname, 'seloger-test-output.html');
      fs.writeFileSync(outputPath, html, 'utf8');
      console.log('');
      console.log('💾 HTML sauvegardé dans:', outputPath);

      await browser.close();

      console.log('');
      console.log('✅ Test terminé!');
      console.log('');
      console.log('📝 Prochaines étapes:');
      console.log('   1. Analyser le fichier HTML sauvegardé');
      console.log('   2. Identifier la structure exacte des annonces');
      console.log('   3. Adapter le parser en conséquence');

    } catch (error) {
      if (browser) {
        await browser.close();
      }
      throw error;
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Exécuter le test
testSeLogerScraper();

