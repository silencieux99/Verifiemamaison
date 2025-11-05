/**
 * Liste tous les modèles Gemini disponibles via l'API
 */

const fs = require('fs');
const path = require('path');

// Charger la clé depuis .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ Fichier .env.local non trouvé');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const geminiLine = envContent.split('\n').find(line => line.trim().startsWith('GEMINI_API_KEY'));
if (!geminiLine) {
  console.error('❌ GEMINI_API_KEY non trouvée dans .env.local');
  process.exit(1);
}

const apiKey = geminiLine.match(/GEMINI_API_KEY\s*=\s*(.+)/)?.[1]?.trim();
if (!apiKey) {
  console.error('❌ Clé API vide');
  process.exit(1);
}

console.log('🔍 LISTE DES MODÈLES GEMINI DISPONIBLES');
console.log('='.repeat(60));
console.log(`🔑 Clé API: ${apiKey.substring(0, 10)}...\n`);

async function listModels() {
  // Tester différentes versions d'API
  const apiVersions = ['v1', 'v1beta'];
  
  for (const version of apiVersions) {
    console.log(`\n📡 Test avec API ${version}...\n`);
    
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/${version}/models?key=${apiKey}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`   ❌ API ${version}: ${response.status}`);
        try {
          const error = JSON.parse(errorText);
          console.log(`   Message: ${error.error?.message || errorText}`);
        } catch {
          console.log(`   Erreur: ${errorText}`);
        }
        continue;
      }

      const data = await response.json();
      
      if (data.models && data.models.length > 0) {
        console.log(`   ✅ ${data.models.length} modèle(s) trouvé(s) avec API ${version}:\n`);
        
        // Filtrer les modèles qui supportent generateContent
        const generateContentModels = data.models.filter(model => 
          model.supportedGenerationMethods && 
          model.supportedGenerationMethods.includes('generateContent')
        );
        
        console.log(`   📊 Modèles supportant generateContent: ${generateContentModels.length}\n`);
        
        generateContentModels.forEach((model, index) => {
          console.log(`   ${index + 1}. ${model.name}`);
          console.log(`      - Display Name: ${model.displayName || 'N/A'}`);
          console.log(`      - Description: ${model.description || 'N/A'}`);
          if (model.inputTokenLimit) {
            console.log(`      - Input Token Limit: ${model.inputTokenLimit.toLocaleString()}`);
          }
          if (model.outputTokenLimit) {
            console.log(`      - Output Token Limit: ${model.outputTokenLimit.toLocaleString()}`);
          }
          console.log('');
        });
        
        // Afficher aussi les modèles qui ne supportent pas generateContent (pour info)
        const otherModels = data.models.filter(model => 
          !model.supportedGenerationMethods || 
          !model.supportedGenerationMethods.includes('generateContent')
        );
        
        if (otherModels.length > 0) {
          console.log(`   ℹ️  Autres modèles (${otherModels.length}) ne supportant pas generateContent:\n`);
          otherModels.slice(0, 5).forEach((model, index) => {
            console.log(`   ${index + 1}. ${model.name}`);
            if (model.supportedGenerationMethods) {
              console.log(`      - Méthodes supportées: ${model.supportedGenerationMethods.join(', ')}`);
            }
            console.log('');
          });
          if (otherModels.length > 5) {
            console.log(`   ... et ${otherModels.length - 5} autres\n`);
          }
        }
        
        // Retourner le premier modèle disponible pour test
        if (generateContentModels.length > 0) {
          const firstModel = generateContentModels[0];
          const modelName = firstModel.name.split('/').pop(); // Extraire juste le nom du modèle
          console.log('='.repeat(60));
          console.log(`\n💡 Modèle recommandé pour le test: ${modelName}`);
          console.log(`   Utilisez: GEMINI_MODEL=${modelName} dans .env.local\n`);
          return;
        }
      } else {
        console.log(`   ⚠️  Aucun modèle trouvé avec API ${version}`);
      }
    } catch (error) {
      console.error(`   ❌ Erreur avec API ${version}:`, error.message);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n❌ Aucun modèle disponible trouvé');
}

listModels();

