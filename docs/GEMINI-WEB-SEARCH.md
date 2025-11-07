# Gemini Web Search - Recherche d'informations en temps réel

## 🌐 Vue d'ensemble

Cette fonctionnalité utilise **Gemini API avec Google Search Grounding** pour rechercher des informations immobilières **en temps réel sur internet** via Google.

### Ce que Gemini peut rechercher :

✅ **Prix au m²** selon la commune/quartier (données récentes 2024-2025)  
✅ **Tendance du marché** (hausse, baisse, stable)  
✅ **Ventes récentes similaires** avec prix, surface, date  
✅ **Informations sur le quartier** et son attractivité  
✅ **Comparaisons de marché** avec d'autres biens similaires  
✅ **Sources fiables** (SeLoger, PAP, Bien'ici, etc.)

## 🔧 Configuration

### 1. Obtenir une clé API Gemini

1. Allez sur [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Connectez-vous avec votre compte Google
3. Cliquez sur "Create API Key"
4. Copiez la clé générée

### 2. Configurer dans `.env.local`

```env
# Clé API Gemini
GEMINI_API_KEY=votre_cle_api_ici

# Activer la recherche web (par défaut: true)
GEMINI_WEB_SEARCH_ENABLED=true

# Modèle Gemini à utiliser (gemini-1.5-pro supporte la recherche web)
GEMINI_MODEL=gemini-1.5-pro
```

### 3. Redémarrer le serveur

```bash
# Arrêtez le serveur (Ctrl+C)
# Puis relancez :
npm run dev
```

## 🚀 Utilisation

### Automatique lors de la génération de rapport

La recherche web Gemini s'active **automatiquement** lors de la génération d'un rapport si :
- `GEMINI_API_KEY` est configurée
- `GEMINI_WEB_SEARCH_ENABLED` n'est pas `false`

Les données trouvées sont **prioritaires** sur les autres sources :
1. **Priorité 1** : Données de recherche web Gemini (les plus récentes)
2. **Priorité 2** : Données DVF (historiques)
3. **Priorité 3** : Estimations par défaut selon la région

### Test manuel

```bash
# Test avec une adresse par défaut
node scripts/test-gemini-web-search.js

# Test avec une adresse personnalisée
node scripts/test-gemini-web-search.js "123 rue de la paix" "Paris" "75001"
```

## 📊 Données récupérées

La recherche web Gemini retourne :

```typescript
{
  price_m2: number;              // Prix moyen au m²
  price_m2_range: {              // Fourchette de prix
    min: number;
    max: number;
  };
  market_trend: 'hausse' | 'baisse' | 'stable';
  market_comment: string;        // Commentaire détaillé
  neighborhood_info: string;      // Infos sur le quartier
  recent_sales: [                 // Ventes récentes similaires
    {
      price_m2: number;
      surface: number;
      date?: string;
      address?: string;
    }
  ];
  sources: string[];              // Sources utilisées
}
```

## 🔍 Comment ça fonctionne

1. **Recherche Google** : Gemini effectue des recherches Google en temps réel
2. **Extraction de données** : Les informations sont extraites des sites immobiliers
3. **Analyse et structuration** : Les données sont analysées et structurées en JSON
4. **Intégration** : Les données sont intégrées dans l'analyse IA du rapport

## ⚙️ Modèles supportés

- ✅ **gemini-1.5-pro** (recommandé) - Supporte Google Search Grounding
- ✅ **gemini-1.5-flash** - Plus rapide, supporte aussi la recherche web
- ⚠️ **gemini-2.0-flash-exp** - Expérimental, peut supporter la recherche web

## 💡 Avantages

### Données récentes
- Informations à jour (2024-2025)
- Pas de données historiques obsolètes

### Précision locale
- Prix au m² par quartier/commune
- Tendances du marché local

### Sources multiples
- Agrége plusieurs sources (SeLoger, PAP, etc.)
- Compare et valide les données

### Automatique
- Aucune configuration supplémentaire
- S'intègre transparent dans le flux existant

## ⚠️ Limitations

- **Coût** : Chaque recherche web consomme des tokens Gemini
- **Latence** : Les recherches web prennent plus de temps (5-15 secondes)
- **Quotas** : Respectez les quotas de l'API Gemini
- **Disponibilité** : Dépend de la disponibilité de Google Search

## 🔒 Sécurité

- La clé API est stockée dans `.env.local` (non commitée)
- Les recherches sont effectuées côté serveur uniquement
- Aucune donnée personnelle n'est transmise à Google

## 📝 Logs

Les logs montrent :
```
🔍 [Gemini] Recherche d'informations web en temps réel...
✅ [Gemini] Données web trouvées: prix/m²=8500€
✅ [Gemini] Utilisation du prix/m² trouvé via recherche web: 8500€
```

## 🐛 Dépannage

### Erreur "GEMINI_API_KEY not configured"
→ Vérifiez que la clé est dans `.env.local` et redémarrez le serveur

### Erreur "401 Unauthorized"
→ Vérifiez que la clé API est valide

### Erreur "Model not found"
→ Vérifiez que le modèle spécifié dans `GEMINI_MODEL` est disponible

### Pas de données trouvées
→ C'est normal si l'adresse est très récente ou peu connue. Le système utilisera les données DVF en fallback.

## 📚 Documentation

- [Gemini API Documentation](https://ai.google.dev/docs)
- [Google Search Grounding](https://ai.google.dev/docs/grounding)
- [Google AI Studio](https://makersuite.google.com)

