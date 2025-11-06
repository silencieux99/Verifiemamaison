/**
 * Script de test pour le scraper Leboncoin
 * Teste la recherche d'annonces autour d'une adresse
 * Utilise Puppeteer Extra avec Stealth Plugin pour contourner DataDome
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Ajouter le plugin Stealth
puppeteer.use(StealthPlugin());

const address = '36 rue auguste blanqui a aulnay sous bois';

async function testLeboncoinScraper() {
  console.log('🏠 Test du scraper Leboncoin');
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
    const postcode = normalizedAddress.match(/\b(\d{5})\b/)?.[1] || '93600';

    console.log('✅ Adresse géocodée:');
    console.log('   - Coordonnées:', lat, lon);
    console.log('   - Adresse normalisée:', normalizedAddress);
    console.log('');

    // 2. Rechercher les annonces Leboncoin avec Puppeteer
    console.log('🔍 Étape 2: Recherche des annonces Leboncoin avec Puppeteer...');
    console.log('   Rayon: 2 km');
    console.log('');

    // Utiliser Puppeteer Extra avec Stealth pour contourner DataDome
    // Essayer en mode non-headless pour paraître plus humain
    console.log('🌐 Lancement de Puppeteer Extra (mode Stealth, non-headless)...');
    const browser = await puppeteer.launch({
      headless: false, // Mode visible pour paraître plus humain
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--window-size=1920,1080',
        '--start-maximized',
      ],
    });

    try {
      const page = await browser.newPage();
      
      // Configurer le viewport et user agent (Stealth le fait déjà, mais on peut personnaliser)
      await page.setViewport({ width: 1920, height: 1080 });
      
      // Ajouter des headers supplémentaires pour paraître plus humain
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      });
      
      // Éviter la détection d'automatisation
      await page.evaluateOnNewDocument(() => {
        // Masquer webdriver
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false,
        });
        
        // Modifier les plugins pour paraître plus humain
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5],
        });
        
        // Modifier les langues
        Object.defineProperty(navigator, 'languages', {
          get: () => ['fr-FR', 'fr', 'en-US', 'en'],
        });
        
        // Modifier permissions
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) => (
          parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification.permission }) :
            originalQuery(parameters)
        );
      });
      
      // Intercepter les requêtes réseau pour capturer les appels API
      const apiCalls = [];
      const apiResponses = [];
      
      page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('api.leboncoin.fr') || url.includes('finder/search') || url.includes('/search')) {
          apiCalls.push({
            url,
            status: response.status(),
          });
          
          // Essayer de capturer la réponse JSON
          try {
            if (response.status() === 200 && url.includes('api')) {
              const data = await response.json();
              apiResponses.push({ url, data });
            }
          } catch (e) {
            // Ignorer les erreurs de parsing
          }
        }
      });

      // Construire l'URL de recherche Leboncoin
      // Format: https://www.leboncoin.fr/recherche?category=9&locations=Aulnay-sous-Bois_93600__48.936849_2.50141_2
      const cityName = normalizedAddress.match(/\d{5}\s+(.+)/)?.[1] || 'Aulnay-sous-Bois';
      const searchUrl = `https://www.leboncoin.fr/recherche?category=9&locations=${encodeURIComponent(cityName)}_${postcode}__${lat}_${lon}_2&real_estate_type=1,2&ad_type=offer`;
      
      console.log('📡 Navigation vers Leboncoin...');
      console.log('   URL:', searchUrl);
      console.log('');

      console.log('📡 Navigation vers Leboncoin (avec Stealth)...');
      
      // Aller d'abord sur la page d'accueil pour établir une session
      console.log('   🏠 Passage par la page d\'accueil pour établir une session...');
      await page.goto('https://www.leboncoin.fr', {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Maintenant aller sur la page de recherche
      await page.goto(searchUrl, {
        waitUntil: 'networkidle2',
        timeout: 60000,
      });

      // Vérifier si on est bloqué par un captcha
      const pageContent = await page.content();
      const isBlocked = pageContent.includes('captcha-delivery.com') || pageContent.includes('DataDome');
      
      if (isBlocked) {
        console.log('   ⚠️ DataDome détecté, attente longue (30s)...');
        console.log('   💡 En mode non-headless, vous pouvez voir la page dans le navigateur');
        await new Promise(resolve => setTimeout(resolve, 30000));
        
        // Vérifier à nouveau
        const newContent = await page.content();
        if (newContent.includes('captcha-delivery.com')) {
          console.log('   ❌ Toujours bloqué par DataDome');
          console.log('   💡 Solution: Utiliser un proxy résidentiel ou attendre manuellement');
        }
      } else {
        console.log('   ✅ Pas de captcha détecté!');
      }

      // Attendre que les annonces se chargent
      console.log('⏳ Attente du chargement des annonces...');
      await new Promise(resolve => setTimeout(resolve, 8000));
      
      // Faire défiler la page pour déclencher le chargement lazy
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2);
      });
      await new Promise(resolve => setTimeout(resolve, 2000));
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Essayer d'attendre les éléments d'annonces
      try {
        await page.waitForSelector('[data-qa-id="aditem_container"], .aditem, [class*="aditem"]', { timeout: 10000 });
        console.log('   ✅ Éléments d\'annonces détectés');
      } catch (e) {
        console.log('   ⚠️ Aucun élément d\'annonce trouvé, continuation...');
      }

      // Sauvegarder le HTML pour analyse
      const html = await page.content();
      const fs = require('fs');
      const path = require('path');
      const outputPath = path.join(__dirname, 'leboncoin-test-output.html');
      fs.writeFileSync(outputPath, html, 'utf8');
      console.log('💾 HTML sauvegardé dans:', outputPath);
      console.log('   Taille:', html.length, 'caractères');
      console.log('');

      // Analyser la structure de la page
      const pageStructure = await page.evaluate(() => {
        return {
          title: document.title,
          url: window.location.href,
          hasInitialState: !!window.__INITIAL_STATE__,
          hasNextData: !!window.__NEXT_DATA__,
          bodyClasses: document.body?.className || '',
          allDataAttributes: Array.from(document.querySelectorAll('[data-qa-id]')).map(el => el.getAttribute('data-qa-id')).filter(Boolean).slice(0, 20),
          allClasses: Array.from(document.querySelectorAll('[class]')).map(el => el.className).filter(c => c.includes('ad') || c.includes('item') || c.includes('card')).slice(0, 20),
        };
      });

      console.log('📊 Structure de la page:');
      console.log('   Titre:', pageStructure.title);
      console.log('   URL:', pageStructure.url);
      console.log('   __INITIAL_STATE__:', pageStructure.hasInitialState ? '✅' : '❌');
      console.log('   __NEXT_DATA__:', pageStructure.hasNextData ? '✅' : '❌');
      console.log('   Classes body:', pageStructure.bodyClasses);
      if (pageStructure.allDataAttributes.length > 0) {
        console.log('   Data attributes trouvés:', pageStructure.allDataAttributes.slice(0, 10).join(', '));
      }
      if (pageStructure.allClasses.length > 0) {
        console.log('   Classes pertinentes:', pageStructure.allClasses.slice(0, 10).join(', '));
      }
      console.log('');

      // Extraire les annonces depuis la page
      const data = await page.evaluate(() => {
        const listings = [];
        
        // Chercher les annonces par différents sélecteurs
        const adSelectors = [
          '[data-qa-id="aditem_container"]',
          '.aditem',
          '[class*="aditem"]',
          '[class*="AdItem"]',
          'article[data-qa-id]',
        ];

        let adElements = [];
        for (const selector of adSelectors) {
          adElements = Array.from(document.querySelectorAll(selector));
          if (adElements.length > 0) break;
        }

        adElements.forEach((el, index) => {
          try {
            const listing = {
              index: index + 1,
              id: el.getAttribute('data-qa-id') || el.getAttribute('data-ad-id') || `ad-${index}`,
            };

            // Extraire le titre
            const titleEl = el.querySelector('[data-qa-id="aditem_title"], .aditem_title, h2, h3');
            if (titleEl) listing.title = titleEl.textContent?.trim();

            // Extraire le prix
            const priceEl = el.querySelector('[data-qa-id="aditem_price"], .aditem_price, [class*="price"]');
            if (priceEl) {
              const priceText = priceEl.textContent?.trim();
              listing.price = priceText ? parseFloat(priceText.replace(/[^\d]/g, '')) : null;
            }

            // Extraire la surface
            const surfaceEl = el.querySelector('[data-qa-id="aditem_surface"], [class*="surface"]');
            if (surfaceEl) {
              const surfaceText = surfaceEl.textContent?.trim();
              listing.surface = surfaceText ? parseFloat(surfaceText.replace(/[^\d]/g, '')) : null;
            }

            // Extraire les pièces
            const roomsEl = el.querySelector('[data-qa-id="aditem_rooms"], [class*="rooms"], [class*="pieces"]');
            if (roomsEl) {
              const roomsText = roomsEl.textContent?.trim();
              listing.rooms = roomsText ? parseInt(roomsText.replace(/[^\d]/g, '')) : null;
            }

            // Extraire l'adresse
            const addressEl = el.querySelector('[data-qa-id="aditem_location"], [class*="location"], [class*="address"]');
            if (addressEl) listing.address = addressEl.textContent?.trim();

            // Extraire le lien
            const linkEl = el.querySelector('a[href]') || el.closest('a[href]');
            if (linkEl) {
              const href = linkEl.getAttribute('href');
              listing.url = href?.startsWith('http') ? href : `https://www.leboncoin.fr${href}`;
            }

            // Extraire les images
            const imgEls = el.querySelectorAll('img[src]');
            listing.images = Array.from(imgEls).map(img => img.getAttribute('src')).filter(Boolean);

            listings.push(listing);
          } catch (e) {
            // Ignorer les erreurs
          }
        });

        // Chercher aussi dans window.__INITIAL_STATE__ ou données JSON
        const pageData = {};
        if (window.__INITIAL_STATE__) {
          pageData.initialState = window.__INITIAL_STATE__;
        }
        if (window.__NEXT_DATA__) {
          pageData.nextData = window.__NEXT_DATA__;
        }

        return { listings, pageData };
      });

      console.log(`✅ ${data.listings.length} annonce(s) trouvée(s) via Puppeteer`);
      
      if (apiCalls.length > 0) {
        console.log(`   📡 ${apiCalls.length} appel(s) API détecté(s):`);
        apiCalls.forEach((call, i) => {
          console.log(`      ${i + 1}. ${call.url} (${call.status})`);
        });
      }
      
      if (apiResponses.length > 0) {
        console.log(`   🎯 ${apiResponses.length} réponse(s) API capturée(s)!`);
        apiResponses.forEach((resp, i) => {
          console.log(`      ${i + 1}. ${resp.url}`);
          if (resp.data.ads && Array.isArray(resp.data.ads)) {
            console.log(`         ✅ ${resp.data.ads.length} annonce(s) dans la réponse API!`);
            // Ajouter ces annonces aux résultats
            resp.data.ads.forEach(ad => {
              if (!data.listings.find(l => l.id === `api-${ad.list_id || ad.id}`)) {
                data.listings.push({
                  id: `api-${ad.list_id || ad.id}`,
                  title: ad.subject || ad.title || 'Annonce',
                  price: ad.price ? (Array.isArray(ad.price) ? parseFloat(ad.price[0]) : parseFloat(ad.price)) : null,
                  surface: ad.square ? parseFloat(ad.square) : null,
                  rooms: ad.rooms,
                  address: ad.location ? `${ad.location.address || ''} ${ad.location.city || ''}`.trim() : '',
                  url: ad.url || `https://www.leboncoin.fr/annonces/${ad.list_id || ad.id}`,
                });
              }
            });
          }
        });
        console.log(`   📊 Total après capture API: ${data.listings.length} annonce(s)`);
      }

      await browser.close();
      if (data.pageData.initialState) {
        console.log('   ✅ Trouvé window.__INITIAL_STATE__');
        const state = data.pageData.initialState;
        if (state.ads || state.listings) {
          const ads = state.ads || state.listings || [];
          console.log(`   📦 ${ads.length} annonce(s) dans l'état initial`);
          // Ajouter les annonces de l'état initial
          if (Array.isArray(ads)) {
            ads.forEach(ad => {
              if (!data.listings.find(l => l.id === `ad-${ad.id || ad.list_id}`)) {
                data.listings.push({
                  id: `ad-${ad.id || ad.list_id}`,
                  title: ad.subject || ad.title,
                  price: ad.price ? (Array.isArray(ad.price) ? parseFloat(ad.price[0]) : parseFloat(ad.price)) : null,
                  surface: ad.square ? parseFloat(ad.square) : null,
                  rooms: ad.rooms,
                  address: ad.location ? `${ad.location.address || ''} ${ad.location.city || ''}`.trim() : '',
                  url: ad.url || `https://www.leboncoin.fr/annonces/${ad.id || ad.list_id}`,
                });
              }
            });
          }
        }
      }

      console.log('');

      // Afficher les premières annonces
      if (data.listings.length > 0) {
        console.log('📋 Exemples d\'annonces:');
        console.log('');
        
        data.listings.slice(0, 5).forEach((ad, i) => {
          console.log(`   ${i + 1}. ${ad.title || 'Annonce'}`);
          if (ad.price) {
            console.log(`      💰 Prix: ${ad.price.toLocaleString('fr-FR')} €`);
          }
          if (ad.surface) {
            console.log(`      📐 Surface: ${ad.surface} m²`);
            if (ad.price) {
              const priceM2 = Math.round(ad.price / ad.surface);
              console.log(`      💵 Prix/m²: ${priceM2.toLocaleString('fr-FR')} €/m²`);
            }
          }
          if (ad.rooms) console.log(`      🚪 Pièces: ${ad.rooms}`);
          if (ad.address) console.log(`      📍 ${ad.address}`);
          if (ad.url) console.log(`      🔗 ${ad.url}`);
          if (ad.id) console.log(`      🆔 ID: ${ad.id}`);
          console.log('');
        });

        // Statistiques
        const withPrice = data.listings.filter(ad => ad.price).length;
        const withSurface = data.listings.filter(ad => ad.surface).length;
        
        console.log('📊 Statistiques:');
        console.log(`   - Total: ${data.listings.length}`);
        console.log(`   - Avec prix: ${withPrice}/${data.listings.length}`);
        console.log(`   - Avec surface: ${withSurface}/${data.listings.length}`);
        console.log('');
      } else {
        console.log('⚠️ Aucune annonce trouvée');
        console.log('   Cela peut être dû à:');
        console.log('   - Aucune annonce dans la zone');
        console.log('   - Protection anti-bot active');
        console.log('   - Structure HTML différente');
        console.log('');
      }

      console.log('✅ Test terminé avec succès!');

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
testLeboncoinScraper();

