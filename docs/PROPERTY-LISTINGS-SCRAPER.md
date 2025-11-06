# Scraper d'Annonces Immobilières

## 📋 Vue d'ensemble

Ce module permet de rechercher des annonces immobilières autour d'une adresse en interrogeant plusieurs sources :
- **SeLoger** : Site principal d'annonces immobilières (bloqué par DataDome)
- **Leboncoin** : Plateforme de petites annonces
- **PAP** : Particulier à Particulier

## ⚠️ Limitations importantes

### Protection anti-bot

Toutes les plateformes utilisent des systèmes de protection anti-bot :
- **SeLoger** : DataDome (détection très stricte)
- **Leboncoin** : Protection Cloudflare/anti-bot
- **PAP** : Protection anti-scraping

### Solutions recommandées

Pour un usage en production, considérer :

1. **Services de proxy résidentiels**
   - Rotation d'IPs
   - Proxies résidentiels (non-datacenter)
   - Services comme Bright Data, Oxylabs, Smartproxy

2. **Puppeteer avec techniques avancées**
   - Mode stealth (puppeteer-extra-plugin-stealth)
   - Rotation d'user agents
   - Délais aléatoires entre requêtes
   - Cookies et sessions persistantes

3. **APIs officielles** (si disponibles)
   - Certaines plateformes proposent des APIs payantes
   - Partenariats avec les plateformes

## 🚀 Utilisation

### Installation

Le module est déjà intégré dans le projet. Pour utiliser Puppeteer, assurez-vous qu'il est installé :

```bash
npm install puppeteer
```

### Exemple d'utilisation

```typescript
import { searchPropertyListings } from '@/lib/property-listings-scraper';

const listings = await searchPropertyListings({
  address: '36 rue auguste blanqui a aulnay sous bois',
  latitude: 48.936849,
  longitude: 2.50141,
  radius_m: 1000,
  propertyType: 'all',
  sources: ['leboncoin', 'pap'], // Éviter 'seloger' à cause de DataDome
});
```

### Paramètres

- `address`: Adresse de référence
- `latitude` / `longitude`: Coordonnées GPS
- `radius_m`: Rayon de recherche en mètres (défaut: 1000m)
- `propertyType`: Type de bien ('appartement', 'maison', 'all')
- `minPrice` / `maxPrice`: Fourchette de prix
- `minSurface` / `maxSurface`: Fourchette de surface
- `rooms`: Nombre de pièces
- `sources`: Sources à utiliser (défaut: ['leboncoin', 'pap'])

### Format de retour

```typescript
interface PropertyListing {
  id: string;
  source: 'seloger' | 'leboncoin' | 'pap' | 'other';
  title: string;
  price: number;
  price_m2?: number;
  surface: number;
  rooms?: number;
  bedrooms?: number;
  type: 'appartement' | 'maison' | 'autre';
  address: string;
  city: string;
  postcode: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  images?: string[];
  url: string;
  agency?: string;
  energy_class?: string;
  ges_class?: string;
  distance_m?: number;
  published_date?: string;
}
```

## 🔧 Améliorations futures

1. **Intégration Puppeteer avancée**
   - Mode stealth
   - Gestion des captchas
   - Rotation d'IPs

2. **Cache et rate limiting**
   - Éviter les requêtes répétées
   - Respecter les limites des plateformes

3. **Support d'autres sources**
   - Logic-immo
   - Century 21
   - Orpi
   - etc.

4. **API endpoint**
   - Créer `/api/property-listings` pour exposer la fonctionnalité

## 📝 Notes légales

⚠️ **Important** : Le scraping de sites web peut violer les conditions d'utilisation des plateformes. Assurez-vous de :
- Respecter les robots.txt
- Ne pas surcharger les serveurs
- Respecter les droits d'auteur
- Obtenir les autorisations nécessaires pour un usage commercial

