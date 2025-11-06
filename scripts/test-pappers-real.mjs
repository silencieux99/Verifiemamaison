#!/usr/bin/env node

/**
 * Test réel de l'API Pappers
 * Récupère les données complètes pour une adresse
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Charger les variables d'environnement
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ Fichier .env.local non trouvé');
    process.exit(1);
  }
  
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    // Ignorer les lignes vides et les commentaires
    if (!line.trim() || line.trim().startsWith('#')) return;
    
    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) return;
    
    const key = line.substring(0, eqIndex).trim();
    let value = line.substring(eqIndex + 1).trim();
    
    // Supprimer les guillemets si présents
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    
    if (key) {
      env[key] = value;
    }
  });
  
  return env;
}

async function testPappersAPI() {
  console.log('🧪 Test réel de l\'API Pappers\n');
  console.log('='.repeat(60));
  
  const env = loadEnv();
  const apiKey = env.PAPPERS_API_KEY;
  
  if (!apiKey) {
    console.error('❌ PAPPERS_API_KEY non trouvée dans .env.local');
    process.exit(1);
  }
  
  console.log('✅ Clé API Pappers trouvée\n');
  
  // Adresse de test
  const testAddress = '36 bis rue auguste blanqui aulnay sous bois 93600';
  
  console.log(`📍 Adresse testée: ${testAddress}\n`);
  console.log('='.repeat(60));
  
  try {
    // Helpers
    const prettyKey = `${apiKey.slice(0, 4)}...${apiKey.slice(-6)}`;
    console.log(`🔑 Utilisation de la clé: ${prettyKey}`);

    // 1) Requête par adresse avec header api-key
    const baseUrl = 'https://api-immobilier.pappers.fr/v1/parcelles';
    const query = `adresse=${encodeURIComponent(testAddress)}&par_page=1&bases=proprietaires,ventes,batiments,dpe`;

    async function tryRequest(desc, url, headers) {
      console.log(`\n📡 ${desc}`);
      console.log(`URL: ${url}`);
      if (headers) console.log(`Headers: ${JSON.stringify(headers)}`);
      const res = await fetch(url, { headers });
      const text = await res.text();
      if (!res.ok) {
        console.log(`❌ HTTP ${res.status} ${res.statusText}`);
        console.log(`Body: ${text}`);
        return null;
      }
      try { return JSON.parse(text); } catch { return text; }
    }

    let data = null;
    data = await tryRequest('Essai #1 (header api-key + adresse)', `${baseUrl}?${query}`, { 'api-key': apiKey });
    if (!data) {
      // 2) Essai avec header x-api-key
      data = await tryRequest('Essai #2 (header x-api-key + adresse)', `${baseUrl}?${query}`, { 'x-api-key': apiKey });
    }
    if (!data) {
      // 3) Essai avec api_token en query (déconseillé mais utile pour debug)
      data = await tryRequest('Essai #3 (api_token en query + adresse)', `${baseUrl}?${query}&api_token=${apiKey}`);
    }
    if (!data) {
      // 4) Essai par coordonnées (géocoder d'abord via API Adresse)
      console.log('\n🗺️ Géocodage via api-adresse.data.gouv.fr ...');
      const geo = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(testAddress)}&limit=1`).then(r=>r.json()).catch(()=>null);
      const [lon, lat] = geo?.features?.[0]?.geometry?.coordinates || [];
      if (lat && lon) {
        const geoQuery = `latitude=${lat}&longitude=${lon}&distance=25&par_page=1&bases=proprietaires,ventes,batiments,dpe`;
        data = await tryRequest('Essai #4 (header api-key + lat/lon)', `${baseUrl}?${geoQuery}`, { 'api-key': apiKey });
        if (!data) {
          data = await tryRequest('Essai #5 (api_token + lat/lon)', `${baseUrl}?${geoQuery}&api_token=${apiKey}`);
        }
      } else {
        console.log('⚠️ Géocodage impossible');
      }
    }

    if (!data) {
      throw new Error('Toutes les tentatives ont échoué. Vérifier droits/clé/produit.');
    }

    console.log('✅ Réponse reçue!\n');
    console.log('='.repeat(60));
    
    // Afficher les résultats
    if (data.results && data.results.length > 0) {
      console.log(`\n📊 RÉSULTATS (${data.results.length} trouvé(s)):\n`);
      
      data.results.forEach((result, idx) => {
        console.log(`\n🏠 RÉSULTAT ${idx + 1}:`);
        console.log('-'.repeat(60));
        
        // Informations de base
        console.log('\n📋 INFORMATIONS DE BASE:');
        console.log(`  • SIRET: ${result.siret || 'N/A'}`);
        console.log(`  • SIREN: ${result.siren || 'N/A'}`);
        console.log(`  • Nom: ${result.name || 'N/A'}`);
        console.log(`  • Adresse: ${result.address || 'N/A'}`);
        console.log(`  • Ville: ${result.city || 'N/A'}`);
        console.log(`  • Code postal: ${result.postcode || 'N/A'}`);
        console.log(`  • Type: ${result.type || 'N/A'}`);
        console.log(`  • Statut: ${result.status || 'N/A'}`);
        console.log(`  • Latitude: ${result.latitude || 'N/A'}`);
        console.log(`  • Longitude: ${result.longitude || 'N/A'}`);
        console.log(`  • Date création: ${result.creation_date || 'N/A'}`);
        console.log(`  • Dernière mise à jour: ${result.last_update || 'N/A'}`);
        
        // Propriétaire
        if (result.owner) {
          console.log('\n👤 PROPRIÉTAIRE:');
          console.log(`  • Nom: ${result.owner.name || 'N/A'}`);
          console.log(`  • Type: ${result.owner.type || 'N/A'}`);
          console.log(`  • Adresse: ${result.owner.address || 'N/A'}`);
          console.log(`  • SIREN: ${result.owner.siren || 'N/A'}`);
          console.log(`  • SIRET: ${result.owner.siret || 'N/A'}`);
          console.log(`  • Forme juridique: ${result.owner.legal_form || 'N/A'}`);
          console.log(`  • Code NAF: ${result.owner.code_naf || 'N/A'}`);
          console.log(`  • Effectif: ${result.owner.effectif || 'N/A'}`);
        }
        
        // Cadastral
        if (result.cadastral) {
          console.log('\n🏛️ CADASTRAL:');
          console.log(`  • Parcelle: ${result.cadastral.parcel || 'N/A'}`);
          console.log(`  • Section: ${result.cadastral.section || 'N/A'}`);
          console.log(`  • Surface (m²): ${result.cadastral.surface_m2 || 'N/A'}`);
          console.log(`  • Références: ${result.cadastral.references?.join(', ') || 'N/A'}`);
          if (result.cadastral.autres_adresses) {
            console.log(`  • Autres adresses: ${result.cadastral.autres_adresses.length}`);
            result.cadastral.autres_adresses.forEach(addr => {
              console.log(`    - ${addr.adresse} (${addr.sources?.join(', ') || 'N/A'})`);
            });
          }
        }
        
        // Transactions
        if (result.transactions && result.transactions.length > 0) {
          console.log(`\n💰 TRANSACTIONS (${result.transactions.length}):`);
          result.transactions.forEach((t, i) => {
            console.log(`  ${i + 1}. ${t.date || 'N/A'}`);
            console.log(`     • Prix: ${t.price_eur ? t.price_eur.toLocaleString('fr-FR') + '€' : 'N/A'}`);
            console.log(`     • Surface: ${t.surface_m2 || 'N/A'} m²`);
            console.log(`     • Prix/m²: ${t.price_m2_eur ? t.price_m2_eur.toLocaleString('fr-FR') + '€' : 'N/A'}`);
            console.log(`     • Type: ${t.type || 'N/A'}`);
            console.log(`     • Nature: ${t.nature || 'N/A'}`);
            console.log(`     • Pièces: ${t.nombre_pieces || 'N/A'}`);
            console.log(`     • Surface terrain: ${t.surface_terrain || 'N/A'} m²`);
          });
        }
        
        // DPE
        if (result.dpe && result.dpe.length > 0) {
          console.log(`\n⚡ DPE (${result.dpe.length}):`);
          result.dpe.forEach((d, i) => {
            console.log(`  ${i + 1}. ${d.date_etablissement || 'N/A'}`);
            console.log(`     • Classe énergie: ${d.classe_bilan || 'N/A'}`);
            console.log(`     • Classe GES: ${d.classe_emission_ges || 'N/A'}`);
            console.log(`     • Type chauffage: ${d.type_installation_chauffage || 'N/A'}`);
            console.log(`     • Énergie chauffage: ${d.type_energie_chauffage || 'N/A'}`);
            console.log(`     • Adresse: ${d.adresse || 'N/A'}`);
          });
        }
        
        // Permis de construire
        if (result.building_permits && result.building_permits.length > 0) {
          console.log(`\n📋 PERMIS DE CONSTRUIRE (${result.building_permits.length}):`);
          result.building_permits.forEach((p, i) => {
            console.log(`  ${i + 1}. ${p.date || 'N/A'}`);
            console.log(`     • Type: ${p.type || 'N/A'}`);
            console.log(`     • Statut: ${p.statut || 'N/A'}`);
            console.log(`     • Description: ${p.description || 'N/A'}`);
            console.log(`     • Zone opératoire: ${p.zone_operatoire || 'N/A'}`);
          });
        }
        
        // Bâtiments
        if (result.buildings && result.buildings.length > 0) {
          console.log(`\n🏢 BÂTIMENTS (${result.buildings.length}):`);
          result.buildings.forEach((b, i) => {
            console.log(`  ${i + 1}. ${b.numero || 'N/A'}`);
            console.log(`     • Nature: ${b.nature || 'N/A'}`);
            console.log(`     • Usage: ${b.usage || 'N/A'}`);
            console.log(`     • Année construction: ${b.annee_construction || 'N/A'}`);
            console.log(`     • Nombre logements: ${b.nombre_logements || 'N/A'}`);
            console.log(`     • Surface: ${b.surface || 'N/A'} m²`);
          });
        }
        
        // Copropriété
        if (result.copropriete) {
          console.log('\n🏘️ COPROPRIÉTÉ:');
          console.log(`  • Existe: ${result.copropriete.exists ? 'Oui' : 'Non'}`);
          console.log(`  • Nom: ${result.copropriete.name || 'N/A'}`);
          console.log(`  • Manager: ${result.copropriete.manager || 'N/A'}`);
        }
        
        // Activité commerciale
        if (result.business) {
          console.log('\n🏪 ACTIVITÉ COMMERCIALE:');
          console.log(`  • Existe: ${result.business.has_business ? 'Oui' : 'Non'}`);
          console.log(`  • Nom: ${result.business.company_name || 'N/A'}`);
          console.log(`  • SIREN: ${result.business.siren || 'N/A'}`);
          console.log(`  • Activité: ${result.business.activity || 'N/A'}`);
        }
        
        // Occupants
        if (result.occupants && result.occupants.length > 0) {
          console.log(`\n👥 OCCUPANTS (${result.occupants.length}):`);
          result.occupants.forEach((o, i) => {
            console.log(`  ${i + 1}. ${o.denomination || 'N/A'}`);
            console.log(`     • SIREN: ${o.siren || 'N/A'}`);
            console.log(`     • Catégorie juridique: ${o.categorie_juridique || 'N/A'}`);
            console.log(`     • Code NAF: ${o.code_naf || 'N/A'}`);
            console.log(`     • Effectif: ${o.effectif || 'N/A'}`);
          });
        }
      });
      
    } else {
      console.log('⚠️  Aucun résultat trouvé pour cette adresse');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Test terminé avec succès\n');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('\n💡 Vérifications:');
    console.error('  • Votre clé API Pappers est-elle valide?');
    console.error('  • Avez-vous des requêtes restantes?');
    console.error('  • L\'adresse testée existe-t-elle dans la base Pappers?');
    process.exit(1);
  }
}

testPappersAPI();
