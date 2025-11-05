# Configuration des variables d'environnement

## Étape 1 : Créer le fichier .env.local

Créez un fichier `.env.local` à la racine du projet avec le contenu suivant :

```env
# Firebase Configuration (Client)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBfuU0ssf8WebeyTSpGE9jOv4OaGv7GW7A
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=allosupport-d0f50.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=allosupport-d0f50
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=allosupport-d0f50.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=995232743722
NEXT_PUBLIC_FIREBASE_APP_ID=1:995232743722:web:0429452e1f9b9c3d555e53
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-4EG9JJ6K9X

# Firebase Admin (Server-side)
# ⚠️ À compléter : Téléchargez le fichier de clés de service depuis Firebase Console
# Project Settings > Service Accounts > Generate new private key
FIREBASE_PROJECT_ID=allosupport-d0f50
FIREBASE_CLIENT_EMAIL=votre_client_email_ici
FIREBASE_PRIVATE_KEY="votre_private_key_ici"

# Stripe Configuration
# ⚠️ À compléter : Créez vos produits Stripe et récupérez les Price IDs
STRIPE_SECRET_KEY=sk_test_votre_cle_secrete
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_votre_cle_publique
STRIPE_WEBHOOK_SECRET=whsec_votre_webhook_secret
STRIPE_PRICE_UNITE=price_votre_price_id_unite
STRIPE_PRICE_PACK3=price_votre_price_id_pack3
STRIPE_PRICE_PACK10=price_votre_price_id_pack10

# Site Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Étape 2 : Configurer Firebase Admin

### Méthode 1 : Depuis Firebase Console (Recommandé)

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet `allosupport-d0f50`
3. Cliquez sur l'icône ⚙️ (Settings) en haut à gauche
4. Allez dans l'onglet **Project Settings**
5. Cliquez sur l'onglet **Service Accounts** en haut
6. Cliquez sur **Generate new private key**
7. Une fenêtre de confirmation s'ouvre, cliquez sur **Generate key**
8. Un fichier JSON sera téléchargé (ex: `allosupport-d0f50-firebase-adminsdk-xxxxx.json`)

### Méthode 2 : Extraire les valeurs du JSON

Ouvrez le fichier JSON téléchargé et copiez les valeurs suivantes dans votre `.env.local` :

**Exemple de fichier JSON :**
```json
{
  "type": "service_account",
  "project_id": "allosupport-d0f50",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@allosupport-d0f50.iam.gserviceaccount.com",
  "client_id": "123456789",
  ...
}
```

**Dans votre `.env.local`, ajoutez :**
```env
FIREBASE_PROJECT_ID=allosupport-d0f50
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@allosupport-d0f50.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nVOTRE_CLE_ICI\n-----END PRIVATE KEY-----\n"
```

⚠️ **IMPORTANT :**
- La `FIREBASE_PRIVATE_KEY` doit être entre guillemets doubles
- Les `\n` dans la clé privée doivent être préservés (ils représentent les retours à la ligne)
- Ne supprimez PAS les `-----BEGIN PRIVATE KEY-----` et `-----END PRIVATE KEY-----`

## Étape 3 : Configurer Stripe

1. Créez un compte sur [Stripe](https://stripe.com/)
2. Allez dans **Products** et créez 3 produits :
   - **Rapport à l'unité** : 19,99€ (paiement unique)
   - **Pack 3 rapports** : 29,99€ (paiement unique)
   - **Pack 10 rapports** : 79,99€ (paiement unique)
3. Récupérez les **Price IDs** (commencent par `price_...`)
4. Récupérez vos clés API dans **Developers** > **API keys**
5. Configurez un webhook dans **Developers** > **Webhooks**
   - URL : `http://localhost:3000/api/webhooks/stripe` (en dev)
   - Événements : `checkout.session.completed`

## Notes importantes

- Le fichier `.env.local` est dans `.gitignore` et ne sera pas commité
- Ne partagez jamais vos clés secrètes
- En production, configurez ces variables dans votre plateforme de déploiement (Vercel, etc.)

