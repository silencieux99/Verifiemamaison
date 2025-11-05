# Dépannage Firebase Admin - Erreur UNAUTHENTICATED

## Problème

Erreur lors de l'appel à Firestore :
```
Error: 16 UNAUTHENTICATED: Request had invalid authentication credentials.
Expected OAuth 2 access token, login cookie or other valid authentication credential.
```

## Causes possibles

### 1. **Credentials Firebase Admin manquants ou incorrects**
Les variables d'environnement `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, et `FIREBASE_PRIVATE_KEY` ne sont pas correctement configurées.

### 2. **Clé privée mal formatée**
La `FIREBASE_PRIVATE_KEY` contient des `\n` littéraux au lieu de vrais retours à la ligne.

### 3. **Firebase Admin initialisé avec de mauvais credentials**
En mode développement Next.js, les modules peuvent être rechargés et Firebase Admin peut être initialisé avec des credentials par défaut au lieu du service account.

### 4. **Service account sans permissions**
Le service account n'a pas les permissions nécessaires dans Firebase.

## Solutions

### ✅ Solution 1 : Vérifier les credentials

Exécutez le script de vérification :
```bash
node scripts/check-firebase-admin.js
```

Ce script vérifie :
- ✅ Présence des variables d'environnement
- ✅ Initialisation de Firebase Admin
- ✅ Connexion à Firestore
- ✅ Connexion à Firebase Auth

### ✅ Solution 2 : Télécharger une nouvelle clé de service

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet
3. Allez dans **Paramètres du projet** > **Comptes de service**
4. Cliquez sur **Générer une nouvelle clé privée**
5. Téléchargez le fichier JSON

### ✅ Solution 3 : Configurer les variables d'environnement

Dans votre fichier `.env.local` :

```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=votre-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@votre-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhki...\n-----END PRIVATE KEY-----\n"
```

**Important** : 
- La `FIREBASE_PRIVATE_KEY` doit être entre guillemets
- Les `\n` doivent être des retours à la ligne littéraux (pas échappés)
- Vous pouvez copier-coller directement depuis le fichier JSON téléchargé

### ✅ Solution 4 : Vérifier les permissions du service account

Dans Firebase Console :
1. Allez dans **IAM et administration** > **IAM**
2. Trouvez votre service account (`firebase-adminsdk-xxxxx@...`)
3. Vérifiez qu'il a le rôle **Firebase Admin SDK Administrator Service Agent**

### ✅ Solution 5 : Redémarrer le serveur Next.js

Après avoir modifié `.env.local`, redémarrez complètement le serveur :

```bash
# Arrêter le serveur (Ctrl+C)
# Puis relancer
npm run dev
```

## Code modifié

Les fichiers suivants ont été améliorés pour mieux gérer les erreurs :

### `src/lib/firebase-admin.ts`
- ✅ Meilleure vérification des credentials
- ✅ Logs détaillés lors de l'initialisation
- ✅ Gestion des apps déjà initialisées
- ✅ Helper `isFirebaseAdminInitialized()`

### `src/app/api/user-reports/route.ts`
- ✅ Vérification que Firebase Admin est initialisé
- ✅ Meilleurs messages d'erreur
- ✅ Gestion des erreurs d'authentification

## Vérification finale

Après avoir appliqué les solutions, vérifiez que tout fonctionne :

```bash
# 1. Vérifier les credentials
node scripts/check-firebase-admin.js

# 2. Redémarrer le serveur
npm run dev

# 3. Tester l'API
# Connectez-vous sur le site et vérifiez que vos rapports s'affichent
```

## Logs à surveiller

Lors du démarrage du serveur, vous devriez voir :

```
🔧 Initialisation Firebase Admin...
  - Project ID: votre-project-id
  - Client Email: firebase-adminsdk-xxxxx@...
✅ Firebase Admin initialisé avec succès
```

Si vous voyez :
```
❌ Firebase Admin: Variables d'environnement manquantes
```

Alors vérifiez votre fichier `.env.local`.

## Support

Si le problème persiste :
1. Vérifiez que Firestore est activé dans votre projet Firebase
2. Vérifiez que vous n'êtes pas en Alsace-Moselle (région non couverte par certaines APIs)
3. Vérifiez les quotas de votre projet Firebase
4. Consultez les logs Firebase Console pour plus de détails
