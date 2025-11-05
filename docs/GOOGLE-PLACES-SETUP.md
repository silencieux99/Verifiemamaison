# Configuration Google Places API pour les étoiles des écoles

## 📋 Description

Le système enrichit automatiquement les données des écoles avec les notes Google (ratings) en utilisant l'API Google Places. Cela permet d'afficher les vraies étoiles Google avec les notes et le nombre d'avis pour chaque école.

## 🔑 Configuration

### 1. Obtenir une clé API Google Places

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez l'API **Places API** (anciennement Google Places API)
4. Créez une clé API :
   - Allez dans "APIs & Services" > "Credentials"
   - Cliquez sur "Create Credentials" > "API Key"
   - Copiez la clé générée

### 2. Configurer la clé API

Ajoutez la clé API dans votre fichier `.env.local` :

```env
GOOGLE_PLACES_API_KEY=votre_cle_api_google_places
```

### 3. Redémarrer le serveur

Après avoir ajouté la clé, redémarrez votre serveur Next.js :

```bash
npm run dev
```

## 🎯 Fonctionnalités

Une fois configuré, le système :

1. **Récupère les écoles** via l'API Education nationale
2. **Enrichit chaque école** avec Google Places API pour obtenir :
   - ⭐ La note Google (rating) de 0 à 5
   - 📊 Le nombre d'avis (rating_count)
   - 📞 Le téléphone (si manquant)
   - 🌐 Le site web (si manquant)

3. **Affiche les étoiles** dans le rapport interactif :
   - Étoiles jaunes selon la note
   - Note numérique (ex: 4.5)
   - Nombre d'avis (ex: 120 avis)
   - Logo Google

## ⚠️ Limitations

- **Limite de 10 écoles** enrichies par requête (pour éviter les quotas)
- **Matching intelligent** : l'algorithme trouve automatiquement la bonne école sur Google Places en comparant :
  - La distance GPS (moins de 500m)
  - Le nom de l'établissement
- **Fallback** : Si Google Places n'est pas disponible, les écoles s'affichent sans les étoiles

## 💰 Coûts

Google Places API est payante :
- **Text Search** : $32 par 1000 requêtes
- **Place Details** : $17 par 1000 requêtes

Pour un rapport avec 10 écoles, cela coûte environ **$0.49** (Text Search + Place Details).

💡 **Conseil** : Utilisez le quota gratuit de Google Cloud ($200/mois) pour tester.

## 🔍 Vérification

Pour vérifier que tout fonctionne :

1. Vérifiez que la clé est dans `.env.local` :
   ```bash
   cat .env.local | grep GOOGLE_PLACES
   ```

2. Générez un rapport et vérifiez que les étoiles apparaissent
3. Consultez les logs du serveur pour voir les warnings éventuels

## 🐛 Dépannage

**Pas d'étoiles affichées ?**
- Vérifiez que `GOOGLE_PLACES_API_KEY` est bien configuré
- Vérifiez que l'API Places est activée dans Google Cloud Console
- Vérifiez les quotas et les limites de votre compte Google Cloud
- Consultez les logs du serveur pour voir les erreurs

**Étoiles pour certaines écoles seulement ?**
- C'est normal : certaines écoles peuvent ne pas être trouvées sur Google Places
- L'algorithme de matching peut ne pas trouver toutes les écoles

**Erreur "API key not valid" ?**
- Vérifiez que la clé est correcte
- Vérifiez que l'API Places est bien activée pour cette clé
- Vérifiez les restrictions de la clé API (IP, référents, etc.)

