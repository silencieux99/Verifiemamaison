# Configuration de l'API OpenAI ChatGPT

## 📍 Où ajouter la clé API OpenAI

### 1. Fichier `.env.local` (à la racine du projet)

Ajoutez la ligne suivante dans votre fichier `.env.local` :

```env
OPENAI_API_KEY=votre_cle_api_openai_ici
```

**Exemple :**
```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. Modèle utilisé (optionnel)

Par défaut, le code utilise `gpt-4o`. Vous pouvez changer le modèle en ajoutant :

```env
OPENAI_MODEL=gpt-4o
```

**Modèles disponibles :**
- `gpt-4o` (recommandé) - Modèle le plus performant et récent
- `gpt-4o-mini` - Plus rapide et moins cher, très bon rapport qualité/prix
- `gpt-4-turbo` - Version turbo de GPT-4
- `gpt-3.5-turbo` - Plus économique mais moins performant

### 3. Obtenir une clé API OpenAI

1. Allez sur [OpenAI Platform](https://platform.openai.com/)
2. Connectez-vous avec votre compte OpenAI
3. Allez dans "API keys" → "Create new secret key"
4. Copiez la clé générée (commence par `sk-`)
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
- Les clés OpenAI commencent par `sk-` ou `sk-proj-`

---

## 💰 Coûts

Les appels à l'API OpenAI sont facturés selon :
- Le modèle utilisé
- Le nombre de tokens (entrée + sortie)

**Estimation par analyse :**
- `gpt-4o` : ~$0.01-0.05 par analyse
- `gpt-4o-mini` : ~$0.001-0.005 par analyse
- `gpt-4-turbo` : ~$0.01-0.03 par analyse

Consultez les [tarifs OpenAI](https://openai.com/api/pricing/) pour plus de détails.

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
2. Vérifiez que le nom de la variable est exactement `OPENAI_API_KEY`
3. Redémarrez le serveur après avoir ajouté la clé
4. Vérifiez les logs de la console pour voir les erreurs éventuelles

### Erreur "API key not valid"

- Vérifiez que la clé est complète et correcte
- Vérifiez que vous avez des crédits disponibles sur votre compte OpenAI
- Vérifiez que la clé n'a pas été révoquée

### Erreur "Insufficient quota"

- Vérifiez vos crédits sur [OpenAI Platform](https://platform.openai.com/account/billing)
- Ajoutez des crédits si nécessaire

---

## 📝 Notes

- L'analyse IA est optionnelle : si la clé n'est pas configurée, l'API fonctionne normalement sans analyse IA
- L'analyse IA peut prendre quelques secondes supplémentaires
- Les résultats sont mis en cache avec le reste des données
- Le modèle utilise `response_format: { type: 'json_object' }` pour garantir un format JSON valide

