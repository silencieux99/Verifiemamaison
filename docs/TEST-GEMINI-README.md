# Test de l'analyse IA Gemini 2.5

## ⚠️ IMPORTANT : Le serveur doit être démarré

Pour tester l'analyse IA, vous devez d'abord démarrer le serveur de développement.

### Étapes :

1. **Démarrez le serveur** (dans un terminal séparé) :
   ```bash
   npm run dev
   ```

2. **Attendez que le serveur soit prêt** (vous devriez voir "Ready" dans les logs)

3. **Dans un autre terminal, lancez le test** :
   ```bash
   node scripts/test-ai-analysis.js
   ```

---

## Modèle utilisé

Le code utilise actuellement : **`gemini-2.5-pro`**

Si vous préférez une version différente, vous pouvez modifier dans `src/lib/ai-analysis.ts` :
- `gemini-2.5-pro` (modèle performant, recommandé)
- `gemini-2.5-flash` (plus rapide, si disponible)
- `gemini-2.0-flash-exp` (expérimental)

---

## Adresse testée

Le test utilise l'adresse : **6 boulevard d'indochine 75019 paris**

---

## Résultats attendus

Si tout fonctionne, vous devriez voir :
- ✅ Analyse IA présente dans le profil
- 📊 Score global (0-100)
- 📝 Synthèse du bien
- 📈 Analyse marché
- 🏘️ Analyse quartier
- ⚠️ Analyse risques
- 💼 Potentiel d'investissement
- ✅ Points forts
- ⚠️ Points faibles
- 💡 Recommandations

---

## Dépannage

### Erreur "fetch failed"
→ Le serveur n'est pas démarré. Démarrez-le avec `npm run dev`

### Erreur "GEMINI_API_KEY not configured"
→ Vérifiez que `.env.local` contient la clé et redémarrez le serveur

### Erreur API Gemini
→ Vérifiez que la clé API est valide et que vous avez des quotas disponibles

