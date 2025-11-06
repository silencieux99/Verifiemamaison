# Optimisation SEO - VerifieMaMaison.fr

## ✅ Fichiers créés

### 1. robots.txt
- **Fichier statique** : `public/robots.txt`
- **Fichier dynamique** : `src/app/robots.ts` (Next.js 13+)
- **Fonctionnalités** :
  - Autorise l'indexation des pages publiques
  - Bloque les pages privées (account, admin, API)
  - Configuration spécifique pour Googlebot et Bingbot
  - Référence au sitemap

### 2. sitemap.xml
- **Fichier** : `src/app/sitemap.ts`
- **Fonctionnalités** :
  - Génération automatique du sitemap
  - Liste des pages publiques principales
  - Priorités et fréquences de mise à jour configurées

### 3. Données structurées (JSON-LD)
- **Fichier** : `src/app/(components)/StructuredData.tsx`
- **Schemas implémentés** :
  - Organization (Schema.org)
  - Service (Schema.org)
  - WebSite avec SearchAction (Schema.org)

## 📊 Améliorations SEO

### Meta Tags améliorés

#### Layout principal (`src/app/layout.tsx`)
- ✅ Titre optimisé avec mots-clés
- ✅ Description détaillée (160+ caractères)
- ✅ Keywords pertinents
- ✅ Open Graph complet
- ✅ Twitter Cards
- ✅ Verification tags (Google, Yandex, Yahoo)
- ✅ Canonical URLs

#### Page d'accueil (`src/app/page.tsx`)
- ✅ Titre spécifique et optimisé
- ✅ Description enrichie avec détails du service
- ✅ Keywords ciblés
- ✅ Open Graph et Twitter Cards

### Pages avec metadata
- ✅ `/` - Page d'accueil (indexée)
- ✅ `/generate-report` - Génération (non indexée, privée)
- ✅ `/report/[id]` - Rapports individuels (non indexés, privés)
- ✅ `/login` - Connexion (non indexée)
- ✅ `/create-account` - Inscription (non indexée)
- ✅ `/checkout` - Paiement (non indexée)

## 🔍 Optimisations techniques

### 1. Robots.txt
```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /account
Disallow: /login
Disallow: /create-account
Disallow: /checkout/
Disallow: /report/*/pdf
Disallow: /_next/
Disallow: /static/
```

### 2. Sitemap
- URL principale : `/` (priorité 1.0, daily)
- Génération de rapport : `/generate-report` (priorité 0.9, weekly)

### 3. Structured Data
- **Organization** : Informations sur l'entreprise
- **Service** : Description du service d'analyse
- **WebSite** : Action de recherche pour Google

## 📈 Prochaines étapes recommandées

### 1. Google Search Console
- Soumettre le sitemap : `https://www.verifiemamaison.fr/sitemap.xml`
- Vérifier la propriété avec `GOOGLE_SITE_VERIFICATION` dans `.env.local`
- Surveiller l'indexation

### 2. Variables d'environnement
Ajouter dans `.env.local` :
```env
NEXT_PUBLIC_SITE_URL=https://www.verifiemamaison.fr
GOOGLE_SITE_VERIFICATION=votre_code_verification
```

### 3. Image Open Graph
Créer une image OG optimisée :
- Dimensions : 1200x630px
- Format : JPG ou PNG
- Nom : `og-image.jpg`
- Emplacement : `public/og-image.jpg`

### 4. Améliorations futures
- [ ] Ajouter des breadcrumbs (Schema.org BreadcrumbList)
- [ ] Créer des pages de contenu SEO (blog/articles)
- [ ] Ajouter des FAQ avec Schema.org FAQPage
- [ ] Optimiser les images avec alt text
- [ ] Ajouter des liens internes stratégiques
- [ ] Créer un fichier `humans.txt`

## 🎯 Mots-clés ciblés

### Principaux
- analyse immobilière
- rapport maison
- vérification bien immobilier
- diagnostic immobilier en ligne

### Longue traîne
- analyse bien avant achat
- rapport complet maison
- risques naturels immobilier
- DPE diagnostic performance énergétique
- marché immobilier analyse
- écoles proximité
- commodités quartier

## 📝 Checklist SEO

- [x] robots.txt créé
- [x] sitemap.xml créé
- [x] Meta tags optimisés
- [x] Open Graph configuré
- [x] Twitter Cards configuré
- [x] Structured Data (JSON-LD)
- [x] Canonical URLs
- [x] Langue définie (fr)
- [x] Viewport optimisé
- [ ] Image OG créée
- [ ] Google Search Console configuré
- [ ] Analytics configuré (déjà fait)

