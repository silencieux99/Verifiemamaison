# Configuration Firebase Admin - Guide détaillé

## 📋 Vue d'ensemble

Firebase Admin SDK est utilisé côté serveur pour :
- Vérifier les tokens d'authentification
- Gérer les utilisateurs (définir des admins, etc.)
- Accéder à Firestore avec des permissions élevées
- Gérer les webhooks Stripe

## 🔧 Configuration étape par étape

### Étape 1 : Accéder à Firebase Console

1. Ouvrez [Firebase Console](https://console.firebase.google.com/)
2. Connectez-vous avec votre compte Google
3. Sélectionnez le projet **allosupport-d0f50**

### Étape 2 : Générer la clé de service

1. Cliquez sur l'icône ⚙️ (Settings) en haut à gauche
2. Cliquez sur **Project Settings**
3. Allez dans l'onglet **Service Accounts** (en haut de la page)
4. Vous verrez une section "Firebase Admin SDK"
5. Cliquez sur **Generate new private key**
6. Une popup s'affiche, cliquez sur **Generate key**
7. Un fichier JSON sera téléchargé automatiquement

### Étape 3 : Extraire les informations

Le fichier JSON téléchargé ressemble à ceci :

```json
{
  "type": "service_account",
  "project_id": "allosupport-d0f50",
  "private_key_id": "abc123def456...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@allosupport-d0f50.iam.gserviceaccount.com",
  "client_id": "123456789012345678901",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

### Étape 4 : Ajouter dans .env.local

Ouvrez votre fichier `.env.local` et ajoutez/modifiez ces lignes :

```env
# Firebase Admin (Server-side)
FIREBASE_PROJECT_ID=allosupport-d0f50
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@allosupport-d0f50.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nVOTRE_CLE_COMPLETE_ICI\n-----END PRIVATE KEY-----\n"
```

**⚠️ Points importants :**

1. **FIREBASE_PROJECT_ID** : Copiez la valeur de `project_id` du JSON
2. **FIREBASE_CLIENT_EMAIL** : Copiez la valeur de `client_email` du JSON
3. **FIREBASE_PRIVATE_KEY** : 
   - Copiez TOUTE la valeur de `private_key` du JSON (avec les `-----BEGIN...` et `-----END...`)
   - Mettez-la entre **guillemets doubles**
   - Les `\n` dans la clé sont importants - ne les supprimez pas
   - La clé doit être sur une seule ligne dans le fichier .env

### Exemple complet

Voici un exemple de ce à quoi devrait ressembler votre `.env.local` :

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
FIREBASE_PROJECT_ID=allosupport-d0f50
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-abc123@allosupport-d0f50.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_UNITE=price_...
STRIPE_PRICE_PACK3=price_...
STRIPE_PRICE_PACK10=price_...

# Site Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## ✅ Vérification

Pour vérifier que Firebase Admin est bien configuré :

1. Redémarrez votre serveur de développement :
   ```bash
   npm run dev
   ```

2. Essayez de vous connecter à l'admin : `/admin/login`

3. Si vous voyez une erreur, vérifiez :
   - Que les 3 variables sont bien définies dans `.env.local`
   - Que `FIREBASE_PRIVATE_KEY` est entre guillemets doubles
   - Que la clé privée contient bien les `-----BEGIN...` et `-----END...`
   - Que les `\n` sont présents dans la clé

## 🔒 Sécurité

- ⚠️ **NE COMMITEZ JAMAIS** le fichier `.env.local` dans Git
- ⚠️ **NE PARTAGEZ JAMAIS** votre clé privée Firebase
- ⚠️ Le fichier `.env.local` est dans `.gitignore` pour votre protection
- En production, utilisez les variables d'environnement de votre plateforme (Vercel, etc.)

## 🆘 Problèmes courants

### Erreur : "Firebase Admin not initialized"
- Vérifiez que les 3 variables sont définies
- Vérifiez que `FIREBASE_PRIVATE_KEY` est entre guillemets

### Erreur : "Invalid private key"
- Vérifiez que la clé privée contient les lignes `-----BEGIN PRIVATE KEY-----` et `-----END PRIVATE KEY-----`
- Vérifiez que les `\n` sont présents

### Erreur : "Permission denied"
- Vérifiez que l'email du client correspond bien à celui dans Firebase Console
- Vérifiez que le projet ID est correct

