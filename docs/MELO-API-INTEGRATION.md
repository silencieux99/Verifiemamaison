# Intégration API Melo

## 📋 Vue d'ensemble

L'API Melo permet d'enrichir les rapports immobiliers avec des données d'annonces en temps réel. Cette intégration complète les données DVF (transactions historiques) avec des annonces actives sur le marché.

**Documentation officielle:** https://docs.melo.io

## 🔑 Configuration

### 1. Obtenir une clé API

1. Créer un compte sur [melo.io](https://www.melo.io)
2. Accéder aux paramètres de votre compte
3. Générer une clé API
4. Noter la clé API (elle ne sera affichée qu'une seule fois)

### 2. Variables d'environnement

Ajouter les variables suivantes dans votre fichier `.env.local` :

```env
# API Melo
MELO_API_KEY=233ab4cc0d64d6c4b1ca01bf385e56bb
MELO_API_BASE_URL=https://api.melo.io  # Optionnel, URL par défaut
MELO_ENVIRONMENT=sandbox  # 'production' ou 'sandbox'
```

**Note:** La clé fournie est une clé sandbox (environnement de test). Pour la production, obtenez votre propre clé sur [melo.io](https://www.melo.io) et changez `MELO_ENVIRONMENT=production`.

**Environnement Sandbox :** L'environnement sandbox utilise des données statiques et peut ne pas représenter des ensembles de données en temps réel ou complets. Pour obtenir des résultats significatifs, envisagez d'effectuer des requêtes plus larges.

**URL Sandbox :** L'URL sandbox est `https://preprod-api.notif.immo` (différente de la production). Le code l'utilise automatiquement si `MELO_ENVIRONMENT=sandbox`.

### 3. Vérification de la configuration

L'intégration vérifie automatiquement si l'API Melo est configurée. Si la clé API n'est pas définie, l'enrichissement Melo sera ignoré silencieusement.

## 🚀 Utilisation

### Enrichissement automatique des rapports

L'enrichissement Melo peut être intégré dans le processus de génération de rapport :

```typescript
import { enrichMarketWithMelo, mergeMeloWithMarket } from '@/lib/melo-market-enrichment';

// Dans votre fonction de génération de rapport
const meloEnrichment = await enrichMarketWithMelo(profile, {
  radius_m: 2000, // Rayon de recherche en mètres
  limit: 20,      // Nombre maximum d'annonces
  propertyType: 'all', // 'appartement', 'maison', ou 'all'
});

if (meloEnrichment) {
  profile.market = mergeMeloWithMarket(profile.market, meloEnrichment);
}
```

### Recherche manuelle

Vous pouvez également utiliser directement les fonctions de l'API Melo :

```typescript
import { searchMeloAdverts, searchMeloProperties } from '@/lib/melo-api';

// Rechercher des annonces
const adverts = await searchMeloAdverts({
  latitude: 48.8566,
  longitude: 2.3522,
  radius_m: 1500,
  minPrice: 200000,
  maxPrice: 500000,
  propertyType: 'appartement',
  limit: 10,
});

// Rechercher des propriétés
const properties = await searchMeloProperties({
  latitude: 48.8566,
  longitude: 2.3522,
  radius_m: 2000,
});
```

## 📊 Données disponibles

L'API Melo fournit :

- **Annonces actives** : Liste des annonces en cours sur le marché
- **Propriétés** : Informations sur les biens immobiliers
- **Prix et surfaces** : Données détaillées pour comparaison
- **Localisation** : Coordonnées GPS et adresses
- **Métadonnées** : Dates de publication, mises à jour, etc.

## ✅ Endpoints confirmés

Les endpoints ont été testés et fonctionnent correctement :

### Endpoint de recherche

```typescript
GET /documents/properties?lat={latitude}&lon={longitude}&radius={radius_km}&limit={limit}
```

**Paramètres :**
- `lat` : Latitude (requis)
- `lon` : Longitude (requis)
- `radius` : Rayon en kilomètres (défaut: 2)
- `limit` : Nombre maximum de résultats (optionnel)

**Format de réponse :** Hydra (API Platform)
- Les résultats sont dans `hydra:member`
- Le total est dans `hydra:totalItems`
- Chaque propriété contient un tableau `adverts` avec les annonces

**Exemple :**
```bash
curl -X GET "https://preprod-api.notif.immo/documents/properties?lat=48.8566&lon=2.3522&radius=2&limit=10" \
  -H "X-API-KEY: votre_cle_api"
```

## 🔄 Intégration dans le flux de génération

### Option 1: Enrichissement après génération du profil

```typescript
// Dans src/app/api/reports/generate/route.ts
import { enrichMarketWithMelo, mergeMeloWithMarket } from '@/lib/melo-market-enrichment';

// Après avoir généré le profil de base
const profile = await generateHouseProfile(address);

// Enrichir avec Melo (en parallèle ou après)
const meloEnrichment = await enrichMarketWithMelo(profile, {
  radius_m: 2000,
  limit: 20,
});

if (meloEnrichment) {
  profile.market = mergeMeloWithMarket(profile.market, meloEnrichment);
}
```

### Option 2: Enrichissement à la demande

Créer un endpoint dédié pour enrichir un rapport existant :

```typescript
// src/app/api/reports/[id]/melo/route.ts
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  // Récupérer le rapport
  // Enrichir avec Melo
  // Mettre à jour le rapport
}
```

## 📝 Structure des données

Les données Melo sont stockées dans `profile.market.melo` :

```typescript
{
  market: {
    dvf: { /* données DVF existantes */ },
    melo: {
      similarListings: [
        {
          id: string;
          title: string;
          price: number;
          price_m2?: number;
          surface: number;
          rooms?: number;
          type: string;
          address: string;
          url: string;
          distance_m?: number;
          published_date?: string;
          energy_class?: string;
        }
      ],
      marketInsights: {
        averagePriceM2?: number;
        priceRange?: { min: number; max: number };
        activeListings?: number;
        averageSurface?: number;
      },
      source: 'melo';
      fetchedAt: string;
    }
  }
}
```

## ⚠️ Limitations et bonnes pratiques

1. **Rate limiting** : Respecter les limites de l'API Melo
2. **Cache** : Considérer la mise en cache des résultats Melo (données qui changent fréquemment)
3. **Gestion d'erreurs** : L'enrichissement Melo ne doit pas bloquer la génération du rapport
4. **Coûts** : Vérifier les tarifs de l'API Melo selon votre usage

## 🧪 Tests

### Endpoint de test

Un endpoint de test est disponible pour vérifier la configuration :

```bash
# Test basique (Paris par défaut)
GET /api/test/melo

# Test avec paramètres personnalisés
GET /api/test/melo?lat=48.8566&lon=2.3522&radius_m=2000&type=adverts
```

**Paramètres disponibles :**
- `lat` : Latitude (défaut: 48.8566 - Paris)
- `lon` : Longitude (défaut: 2.3522 - Paris)
- `radius_m` : Rayon en mètres (défaut: 2000)
- `type` : Type de recherche - `adverts` ou `properties` (défaut: `adverts`)

**Exemple de réponse :**
```json
{
  "success": true,
  "configured": true,
  "apiKey": "233ab4cc...",
  "baseUrl": "https://api.melo.io",
  "environment": "production",
  "adverts": {
    "success": true,
    "total": 15,
    "count": 5,
    "hasMore": true,
    "sample": [...]
  },
  "message": "API Melo fonctionne correctement !"
}
```

### Test dans le code

```typescript
import { isMeloConfigured, searchMeloAdverts } from '@/lib/melo-api';

// Vérifier la configuration
if (isMeloConfigured()) {
  // Tester une recherche
  const results = await searchMeloAdverts({
    latitude: 48.8566, // Paris
    longitude: 2.3522,
    radius_m: 1000,
    limit: 5,
  });
  console.log('Résultats Melo:', results);
}
```

## 📚 Ressources

- [Documentation Melo](https://docs.melo.io)
- [FAQ Melo](https://docs.melo.io/api-reference/faq)
- [Intégration Make.com](https://www.make.com/en/register?pc=virus)
- [Intégration Zapier](https://zapier.com/apps/melo/integrations)

