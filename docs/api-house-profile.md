# API House Profile - Documentation

## Vue d'ensemble

L'API `/api/house-profile` agrège des données immobilières depuis plusieurs sources publiques françaises pour une adresse donnée. Elle retourne un JSON unique et exhaustif avec toutes les informations pertinentes.

## Endpoint

```
GET /api/house-profile
```

## Paramètres

| Paramètre | Type | Requis | Défaut | Description |
|-----------|------|--------|--------|-------------|
| `address` | string | ✅ Oui | - | Adresse à analyser (ex: "11 rue Barbès, 93600 Aulnay-sous-Bois") |
| `radius_m` | number | ❌ Non | 1500 | Rayon de recherche en mètres pour écoles et commodités (100-10000) |
| `lang` | string | ❌ Non | "fr" | Langue pour les labels ("fr" ou "en") |
| `nocache` | string | ❌ Non | "0" | Ignorer le cache si "1" |

## Exemple d'appel

```bash
curl "https://www.verifiemamaison.fr/api/house-profile?address=11%20rue%20Barb%C3%A8s%2C%2093600%20Aulnay-sous-Bois&radius_m=1500&lang=fr"
```

## Réponse

La réponse est un objet JSON conforme au schéma `HouseProfile` :

```typescript
{
  query: { address: string; radius_m: number; lang: "fr"|"en" };
  location: { normalized_address, gps, admin, raw };
  risks: { flood, seismicity, radon, normalized, ... };
  urbanism: { zoning, land_servitudes, docs, raw };
  energy: { dpe: { class_energy, class_ges, date, ... } };
  market: { dvf: { transactions, summary } };
  building: { declared: { ... } };
  education: { schools: [...] };
  connectivity: { fiber_available, down_max_mbps, ... };
  air_quality: { index_today, label, raw };
  amenities: { supermarkets, transit, parks, others };
  safety: { scope, city, indicators, ... };
  recommendations: { summary, items: [...] };
  meta: { generated_at, processing_ms, sources, warnings };
}
```

## Exemple de réponse (abrégé)

```json
{
  "query": {
    "address": "11 rue Barbès, 93600 Aulnay-sous-Bois",
    "radius_m": 1500,
    "lang": "fr"
  },
  "location": {
    "normalized_address": "11 Rue Barbès, 93600 Aulnay-sous-Bois",
    "gps": {
      "lat": 48.9386,
      "lon": 2.4935
    },
    "admin": {
      "city": "Aulnay-sous-Bois",
      "postcode": "93600",
      "citycode": "93005",
      "department": "Seine-Saint-Denis",
      "region": "Île-de-France"
    }
  },
  "risks": {
    "normalized": {
      "flood_level": "moyen",
      "seismic_level": 2,
      "radon_zone": 2
    }
  },
  "energy": {
    "dpe": {
      "class_energy": "D",
      "class_ges": "E",
      "date": "2022-03-01"
    }
  },
  "market": {
    "dvf": {
      "summary": {
        "price_m2_median_1y": 4120,
        "trend_label": "hausse"
      }
    }
  },
  "education": {
    "schools": [
      {
        "name": "École Élémentaire Test",
        "kind": "élémentaire",
        "distance_m": 420
      }
    ]
  },
  "recommendations": {
    "summary": "Quartier connecté (fibre), risques environnementaux modérés, DPE moyen : prévoir amélioration isolation.",
    "items": [
      {
        "title": "Améliorer l'isolation",
        "reason": "DPE D et radon zone 2",
        "priority": 1,
        "related_sections": ["energy.dpe", "risks.radon"]
      }
    ]
  },
  "meta": {
    "generated_at": "2025-01-05T01:23:45.000Z",
    "processing_ms": 2380,
    "sources": [
      {
        "section": "location",
        "url": "https://api-adresse.data.gouv.fr/search/?q=...",
        "fetched_at": "2025-01-05T01:23:42.000Z"
      }
    ],
    "warnings": []
  }
}
```

## Codes d'erreur

| Code HTTP | Code erreur | Message | Description |
|-----------|-------------|---------|--------------|
| 400 | `MISSING_ADDRESS` | Le paramètre "address" est requis | Adresse manquante |
| 400 | `INVALID_RADIUS` | Le rayon doit être entre 100 et 10000 mètres | Rayon invalide |
| 422 | `ADDRESS_NOT_FOUND` | Adresse non trouvée | L'adresse n'a pas pu être géocodée |
| 500 | `INTERNAL_ERROR` | Erreur interne du serveur | Erreur technique |

## Sources de données

| Section | Source | URL |
|---------|--------|-----|
| Géocodage | API Adresse | https://api-adresse.data.gouv.fr |
| Risques | GéoRisques | https://www.georisques.gouv.fr |
| Urbanisme | Géoportail Urbanisme | https://www.geoportail-urbanisme.gouv.fr |
| DPE | ADEME | https://data.ademe.fr |
| Transactions | DVF (cquest) | https://api.cquest.org/dvf |
| Écoles | Éducation nationale | https://data.education.gouv.fr |
| Connectivité | ARCEP | https://www.arcep.fr |
| Qualité air | ATMO France | https://api.atmo-france.org |
| Commodités | OpenStreetMap | https://overpass-api.de |
| Sécurité | SSMSI / data.gouv | https://www.data.gouv.fr |

## Mise en cache

- **Durée** : 15 minutes (900 secondes)
- **Clé** : Hash de `address|radius_m`
- **Headers** : `X-Cache: HIT` ou `X-Cache: MISS`
- **Désactivation** : Ajouter `?nocache=1`

## Limitations

1. **Timeout** : 10 secondes par source avec retry exponentiel (max 2 tentatives)
2. **Timeout global** : 30 secondes pour l'endpoint complet
3. **Cache** : Maximum 100 entrées en mémoire
4. **Données sensibles** : Sécurité au niveau communal uniquement (pas d'attribution à une adresse précise)

## RGPD & Données personnelles

- ✅ Aucune donnée personnelle sensible collectée
- ✅ Délinquance : niveau communal uniquement
- ✅ Pas d'attribution de crime à une adresse précise
- ✅ Toutes les sources sont publiques et accessibles

## Tests

```bash
npm test -- house-profile-utils.test.ts
```

## Notes importantes

- Les données sont collectées en temps réel depuis les APIs publiques
- Certaines sources peuvent être temporairement indisponibles → `meta.warnings`
- Les recommandations sont basées uniquement sur les données collectées (pas de spéculation)
- Toutes les URLs sources sont listées dans `meta.sources`

## Exemple d'utilisation JavaScript

```javascript
async function getHouseProfile(address) {
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

## Support

Pour toute question ou problème :
- 📧 contact@verifiemamaison.fr
- 🌐 https://www.verifiemamaison.fr

