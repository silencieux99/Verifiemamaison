# Résultats des Tests API Melo

## ✅ Tests réussis

### Configuration
- **URL Sandbox:** `https://preprod-api.notif.immo`
- **URL Production:** `https://api.notif.immo`
- **Endpoint:** `/documents/properties`
- **Format de réponse:** Hydra (API Platform)

### Test avec Paris Centre (48.8566, 2.3522)

**Résultat:** ✅ Succès - Propriétés trouvées

**Données retournées:**
- Format: Collection Hydra avec `hydra:member` contenant les propriétés
- Chaque propriété contient:
  - `@id`: Identifiant unique
  - `adverts`: Tableau d'annonces associées
  - `coordinates`: [longitude, latitude]
  - `address`, `city`, `postcode`
  - `surface`, `price`, `pricePerMeter`
  - `propertyType`: Type de bien
  - `lastCrawledAt`: Date de dernière mise à jour

**Exemple de données d'annonce:**
```json
{
  "bedroom": 5,
  "price": 1980000,
  "pricePerMeter": 10102.04,
  "surface": 196,
  "room": 5,
  "description": "BELLE MAISON TRADITIONNELLE...",
  "contact": {
    "name": "Léon Blum",
    "email": "leon@blum.com",
    "phone": "0120304050"
  },
  "createdAt": "2025-11-02T10:10:05+01:00",
  "events": [...]
}
```

### Test avec Aulnay-sous-Bois (48.9368, 2.5014)

**Résultat:** ✅ Succès - Aucune propriété trouvée (normal pour le sandbox)

**Réponse:**
```json
{
  "hydra:member": [],
  "hydra:totalItems": 0
}
```

## 📋 Structure des données

### Propriété (Property)
- `@id`: `/documents/properties/{uuid}`
- `coordinates`: [lon, lat]
- `address`, `city`, `postcode`
- `surface`, `propertyType`
- `adverts`: Tableau d'annonces

### Annonce (Advert)
- `price`, `pricePerMeter`, `priceExcludingFees`
- `surface`, `room`, `bedroom`
- `description`
- `contact`: { name, email, phone, agency }
- `createdAt`, `lastCrawledAt`
- `events`: Historique des modifications
- `publisher`: Informations sur la source

## 🔧 Paramètres de recherche

L'endpoint `/documents/properties` accepte:
- `lat`: Latitude (requis)
- `lon`: Longitude (requis)
- `radius`: Rayon en kilomètres (défaut: 2km)
- `limit`: Nombre maximum de résultats

**Exemple:**
```
GET /documents/properties?lat=48.8566&lon=2.3522&radius=2&limit=10
```

## ⚠️ Notes importantes

1. **Format Hydra:** L'API utilise le format Hydra (API Platform), donc:
   - Les résultats sont dans `hydra:member`
   - Le total est dans `hydra:totalItems`
   - La pagination est dans `hydra:view`

2. **Sandbox:** L'environnement sandbox peut avoir des données limitées ou statiques

3. **Adverts dans Properties:** Les annonces sont imbriquées dans les propriétés, pas dans un endpoint séparé

4. **Coordonnées:** Format GeoJSON `[longitude, latitude]` (attention à l'ordre!)

## 🚀 Prochaines étapes

1. ✅ Intégration fonctionnelle avec le bon endpoint
2. ✅ Parsing du format Hydra
3. ✅ Conversion vers le format PropertyListing
4. ⏳ Tester l'enrichissement dans un rapport réel
5. ⏳ Gérer la pagination si nécessaire

