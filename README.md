# VerifieMaMaison.fr

Service en ligne d'analyse de biens immobiliers. Inspiré de VerifieMaVoiture, adapté pour l'immobilier.

## 🚀 Installation

```bash
npm install
```

## ⚙️ Configuration

Créez un fichier `.env.local` avec les variables suivantes :

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (côté serveur)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_UNITE=price_...
STRIPE_PRICE_PACK3=price_...
STRIPE_PRICE_PACK10=price_...

# Site
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 📦 Tarifs

- **Unité** : 4,99€ (1 rapport)
- **Pack 3** : 7,99€ (3 rapports)
- **Pack 10** : 19,99€ (10 rapports)

## 🛠️ Développement

```bash
npm run dev
```

Le site sera accessible sur [http://localhost:3000](http://localhost:3000)

## 🏗️ Build

```bash
npm run build
npm start
```

## 📝 Structure

```
src/
├── app/
│   ├── (components)/     # Composants réutilisables
│   ├── (context)/         # Contextes React
│   ├── api/              # Routes API
│   ├── account/          # Page compte utilisateur
│   ├── checkout/         # Page paiement
│   ├── legal/            # Mentions légales
│   ├── report/           # Pages de rapports
│   └── page.tsx          # Page d'accueil
├── lib/
│   ├── pricing.ts        # Configuration des tarifs
│   ├── firebase.ts       # Firebase client
│   ├── firebase-admin.ts # Firebase admin
│   ├── stripe.ts         # Stripe
│   ├── user.ts           # Gestion utilisateurs
│   └── types.ts          # Types TypeScript
```

## 🔐 Sécurité

- Authentification Firebase
- Paiements sécurisés via Stripe
- Règles Firestore pour protéger les données

## 📄 Licence

Private project

