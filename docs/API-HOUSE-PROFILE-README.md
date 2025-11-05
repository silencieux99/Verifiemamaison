# API House Profile - Guide d'installation et utilisation

## 🎯 Vue d'ensemble

L'API `/api/house-profile` est un agrégateur complet de données immobilières pour la France. Elle interroge **11 sources publiques différentes** et retourne un JSON unique et exhaustif.

## 📦 Installation

L'API est déjà intégrée dans le projet. Aucune installation supplémentaire n'est requise.

### Pour les tests (optionnel)

Si vous souhaitez exécuter les tests Jest :

```bash
npm install --save-dev jest @types/jest @jest/globals ts-jest
```

Puis créer un fichier `jest.config.js` :

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
};
```

## 🚀 Utilisation

### Appel basique

```bash
curl "http://localhost:3000/api/house-profile?address=11%20rue%20Barb%C3%A8s%2C%2093600%20Aulnay-sous-Bois"
```

### Avec paramètres

```bash
curl "http://localhost:3000/api/house-profile?address=11%20rue%20Barb%C3%A8s%2C%2093600%20Aulnay-sous-Bois&radius_m=2000&lang=fr&nocache=1"
```

### En JavaScript/TypeScript

```typescript
async function getHouseProfile(address: string) {
  const response = await fetch(
    `/api/house-profile?address=${encodeURIComponent(address)}&radius_m=1500`
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }
  
  return await response.json();
}

// Utilisation
const profile = await getHouseProfile('11 rue Barbès, 93600 Aulnay-sous-Bois');
console.log('DPE:', profile.energy.dpe?.class_energy);
console.log('Recommandations:', profile.recommendations.items);
```

## 📊 Structure de la réponse

La réponse contient les sections suivantes :

1. **query** : Paramètres de la requête
2. **location** : Adresse normalisée + coordonnées GPS + codes administratifs
3. **risks** : Risques naturels (inondation, sismicité, radon, argiles, etc.)
4. **urbanism** : PLU, zonage, servitudes
5. **energy** : DPE (classe énergie, GES, date)
6. **market** : Transactions DVF (prix/m², tendances)
7. **building** : Informations déclaratives (à compléter côté front)
8. **education** : Écoles à proximité
9. **connectivity** : Fibre, débits internet
10. **air_quality** : Qualité de l'air (indice ATMO)
11. **amenities** : Supermarchés, transports, parcs
12. **safety** : Sécurité/délinquance (niveau communal uniquement)
13. **recommendations** : Recommandations IA basées sur les données
14. **meta** : Métadonnées (sources, temps de traitement, avertissements)

## 🔍 Sources de données

| Source | Endpoint | Description |
|--------|----------|-------------|
| API Adresse | `api-adresse.data.gouv.fr` | Géocodage |
| GéoRisques | `georisques.gouv.fr` | Risques naturels |
| GPU | `geoportail-urbanisme.gouv.fr` | PLU |
| ADEME | `data.ademe.fr` | DPE |
| DVF | `api.cquest.org/dvf` | Transactions |
| Éducation | `data.education.gouv.fr` | Écoles |
| ARCEP | `arcep.fr` | Connectivité |
| ATMO | `api.atmo-france.org` | Qualité air |
| OSM | `overpass-api.de` | Commodités |
| SSMSI | `data.gouv.fr` | Sécurité |

## ⚙️ Configuration

### Variables d'environnement

Aucune variable d'environnement requise - toutes les APIs sont publiques.

### Timeouts

- **Par source** : 10 secondes avec retry exponentiel (max 2 tentatives)
- **Endpoint global** : 30 secondes (limite Next.js)

### Cache

- **Durée** : 15 minutes (900 secondes)
- **Clé** : Hash de `address|radius_m`
- **Max entrées** : 100
- **Désactivation** : `?nocache=1`

## 🧪 Tests

### Exécuter les tests (si Jest installé)

```bash
npm test -- house-profile-utils.test.ts
```

### Tests disponibles

- ✅ `geocodeAddress` : Renvoie citycode pour une adresse connue
- ✅ `fetchSchools` : Renvoie ≥1 établissement avec distance calculée
- ✅ `computeRecommendations` : Génère des recommandations basées sur les données
- ✅ `haversineDistance` : Calcule correctement les distances GPS

## 📝 Notes importantes

### RGPD & Données personnelles

- ✅ Aucune donnée personnelle sensible collectée
- ✅ Délinquance : niveau communal uniquement (pas d'attribution à une adresse précise)
- ✅ Toutes les sources sont publiques et accessibles

### Limitations

1. Certaines APIs peuvent être temporairement indisponibles → `meta.warnings`
2. Les données sont collectées en temps réel (pas de cache côté source)
3. Les recommandations sont basées uniquement sur les données collectées (pas de spéculation)

### Erreurs courantes

| Code | Solution |
|------|----------|
| `ADDRESS_NOT_FOUND` | Vérifier l'adresse ou utiliser un format plus complet |
| `INVALID_RADIUS` | Utiliser un rayon entre 100 et 10000 mètres |
| Timeout | Réduire `radius_m` ou réessayer plus tard |

## 🔧 Développement

### Modifier les sources

Les fonctions sont dans `src/lib/house-profile-utils.ts` :

- `geocodeAddress()` : Géocodage
- `fetchGeoRisques()` : Risques
- `fetchGPU()` : PLU
- `fetchDPE()` : DPE
- `fetchDVF()` : Transactions
- `fetchSchools()` : Écoles
- `fetchArcep()` : Connectivité
- `fetchAtmo()` : Qualité air
- `fetchOSMAmenities()` : Commodités
- `fetchSafetySSMSI()` : Sécurité

### Ajouter une nouvelle source

1. Créer une fonction dans `house-profile-utils.ts`
2. L'appeler dans `route.ts` (section `Promise.allSettled`)
3. Ajouter la source dans `meta.sources`
4. Mettre à jour les types dans `house-profile-types.ts`

## 📚 Documentation complète

Voir `docs/api-house-profile.md` pour la documentation complète avec exemples.

## 🐛 Dépannage

### L'API ne retourne pas de données

1. Vérifier les `meta.warnings` dans la réponse
2. Vérifier que les APIs sources sont accessibles
3. Vérifier les logs serveur pour les erreurs

### Performances lentes

1. Réduire `radius_m` (défaut: 1500m)
2. Utiliser le cache (ne pas mettre `?nocache=1`)
3. Vérifier la latence des APIs sources

## 📧 Support

- 📧 contact@verifiemamaison.fr
- 🌐 https://www.verifiemamaison.fr

---

**Note** : Cette API est en production et prête à être utilisée. Les tests nécessitent Jest mais ne bloquent pas l'utilisation de l'API.

