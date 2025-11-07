# Test Complet du Site - Rapport Détaillé

## Adresse testée
**36 bis rue auguste blanqui, 93600 Aulnay-sous-Bois**

## Instructions pour tester

### Option 1: Via l'interface web (Recommandé)

1. **Démarrer le serveur** :
   ```bash
   npm run dev
   ```

2. **Se connecter** à l'application

3. **Générer un rapport** pour l'adresse :
   - Aller sur la page d'accueil
   - Entrer l'adresse : `36 bis rue auguste blanqui, 93600 Aulnay-sous-Bois`
   - Générer le rapport

4. **Consulter le rapport interactif** qui contiendra toutes les données :
   - Vue d'ensemble
   - Risques naturels
   - Performance énergétique (DPE)
   - Marché immobilier (DVF + Gemini)
   - **Marché en temps réel (Gemini)** ⭐ NOUVEAU
   - Écoles
   - Commodités
   - **Criminalité (Gemini)** ⭐ NOUVEAU
   - Analyse IA

### Option 2: Test manuel des APIs Gemini

#### Test Gemini Marché
```bash
node scripts/test-gemini-web-search.js "36 bis rue auguste blanqui" "Aulnay-sous-Bois" "93600"
```

#### Test Gemini Criminalité
```bash
node scripts/test-gemini-crime.js "36 bis rue auguste blanqui" "Aulnay-sous-Bois" "93600"
```

## Données attendues dans le rapport

### 1. Informations de base
- ✅ Géolocalisation (GPS, adresse normalisée)
- ✅ Commune, code postal, département

### 2. Risques naturels (GeoRisques)
- ✅ Niveau d'inondation
- ✅ Niveau sismique
- ✅ Zone radon

### 3. Performance énergétique (DPE)
- ✅ Classe énergétique (A-G)
- ✅ Classe GES
- ✅ Consommation énergétique
- ✅ Émissions GES

### 4. Marché immobilier

#### DVF (Données Fiscales)
- ✅ Prix/m² médian (1 an, 3 ans)
- ✅ Transactions récentes
- ✅ Tendance du marché

#### Gemini - Marché en temps réel ⭐
- ✅ Prix/m² trouvé via recherche web
- ✅ Fourchette de prix
- ✅ Tendance (hausse/baisse/stable)
- ✅ Commentaire détaillé sur le marché
- ✅ Ventes récentes similaires
- ✅ Sources (SeLoger, PAP, etc.)

### 5. Criminalité & Sécurité (Gemini) ⭐ NOUVEAU
- ✅ Score de sécurité (0-100)
- ✅ Taux de criminalité (faible/moyen/élevé)
- ✅ Tendance (hausse/baisse/stable)
- ✅ Types de crimes principaux
- ✅ Crimes récents (2024-2025)
- ✅ Analyse de sécurité détaillée
- ✅ Comparaison avec autres quartiers
- ✅ Sources

### 6. Écoles
- ✅ Liste des écoles à proximité
- ✅ Type (maternelle, élémentaire, collège, lycée)
- ✅ Distance
- ✅ Note Google (si disponible)

### 7. Commodités
- ✅ Supermarchés
- ✅ Transports (métro, bus, gares)
- ✅ Parcs

### 8. Analyse IA
- ✅ Score global (0-100)
- ✅ Synthèse détaillée
- ✅ Analyse marché (avec données Gemini)
- ✅ Points forts
- ✅ Points faibles
- ✅ Recommandations

## Configuration requise

### Variables d'environnement (.env.local)
```env
# Gemini API (pour marché + criminalité)
GEMINI_API_KEY=votre_cle_gemini
GEMINI_WEB_SEARCH_ENABLED=true
GEMINI_MODEL=gemini-2.0-flash-lite

# OpenAI (pour analyse IA)
OPENAI_API_KEY=votre_cle_openai

# Melo (optionnel, actuellement désactivé)
MELO_ENABLED=false
```

## Résultat attendu

Le rapport interactif devrait afficher :

1. **Prix au m²** en haut (priorité Gemini → Melo → DVF)
2. **Section "Marché en temps réel"** avec toutes les données Gemini marché
3. **Section "Criminalité"** avec toutes les données Gemini criminalité
4. Toutes les autres sections (risques, énergie, écoles, commodités, etc.)

## Vérification

Après génération du rapport, vérifier dans l'onglet "Criminalité" :
- Score de sécurité affiché
- Taux de criminalité avec couleur (vert/jaune/rouge)
- Crimes récents listés
- Analyse de sécurité détaillée

Dans l'onglet "Marché" :
- Section "Marché en temps réel - Gemini AI" en haut
- Prix/m², tendance, fourchette
- Commentaire marché détaillé

