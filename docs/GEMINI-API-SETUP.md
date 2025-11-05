# Configuration de l'API Google Gemini

## 📍 Où ajouter la clé API Gemini

### 1. Fichier `.env.local` (à la racine du projet)

Ajoutez la ligne suivante dans votre fichier `.env.local` :

```env
GEMINI_API_KEY=votre_cle_api_gemini_ici
```

**Exemple :**
```env
GEMINI_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. Vérification du fichier

Le fichier `.env.local` doit être à la racine du projet, au même niveau que `package.json`.

Structure attendue :
```
Verifiemamaison/
├── .env.local          ← Ajoutez GEMINI_API_KEY ici
├── package.json
├── src/
└── ...
```

### 3. Obtenir une clé API Gemini

1. Allez sur [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Connectez-vous avec votre compte Google
3. Cliquez sur "Create API Key"
4. Copiez la clé générée
5. Ajoutez-la dans `.env.local`

### 4. Redémarrer le serveur

Après avoir ajouté la clé, **redémarrez votre serveur de développement** :

```bash
# Arrêtez le serveur (Ctrl+C)
# Puis relancez :
npm run dev
```

### 5. Vérification

L'analyse IA sera automatiquement activée si la clé est correctement configurée.

Si la clé n'est pas configurée, l'API continuera de fonctionner mais sans l'analyse IA (un avertissement sera ajouté aux métadonnées).

---

## 🔒 Sécurité

⚠️ **IMPORTANT :**
- Ne commitez JAMAIS le fichier `.env.local` dans Git
- Le fichier `.env.local` est déjà dans `.gitignore`
- Ne partagez jamais votre clé API publiquement

---

## 📊 Fonctionnalités de l'analyse IA

L'analyse IA génère automatiquement :

1. **Score global** (0-100)
2. **Synthèse** du bien
3. **Analyse du marché** :
   - Valeur estimée au m²
   - Tendance du marché (hausse/baisse/stable)
   - Commentaire sur le marché
   - Comparaison des prix
4. **Analyse du quartier** :
   - Analyse des commerces à proximité
   - Score commodités (0-100)
   - Score transports (0-100)
   - Qualité de vie
5. **Analyse des risques** :
   - Niveau de risque global
   - Principaux risques identifiés
   - Commentaire sur les risques
6. **Potentiel d'investissement** :
   - Score investissement (0-100)
   - Commentaire
   - Recommandations
7. **Points forts et faibles**
8. **Recommandations générales**

Toutes ces analyses sont ajoutées automatiquement au rapport interactif dans des sections dédiées.

---

## 🛠️ Dépannage

### L'analyse IA ne fonctionne pas

1. Vérifiez que la clé est bien dans `.env.local` (pas `.env`)
2. Vérifiez que le nom de la variable est exactement `GEMINI_API_KEY`
3. Redémarrez le serveur après avoir ajouté la clé
4. Vérifiez les logs de la console pour voir les erreurs éventuelles

### Erreur "API key not valid"

- Vérifiez que la clé est complète et correcte
- Vérifiez que vous avez activé l'API Gemini dans votre compte Google Cloud
- Vérifiez les quotas de votre compte Google

---

## 📝 Notes

- L'analyse IA est optionnelle : si la clé n'est pas configurée, l'API fonctionne normalement sans analyse IA
- L'analyse IA peut prendre quelques secondes supplémentaires
- Les résultats sont mis en cache avec le reste des données

