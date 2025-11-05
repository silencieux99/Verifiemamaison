# Instructions pour tester l'analyse IA Gemini

## ⚠️ IMPORTANT : Redémarrage du serveur requis

Les variables d'environnement sont chargées **uniquement au démarrage** du serveur Next.js.

### Étapes à suivre :

1. **Arrêtez le serveur actuel** (Ctrl+C dans le terminal où `npm run dev` tourne)

2. **Redémarrez le serveur** :
   ```bash
   npm run dev
   ```

3. **Attendez que le serveur soit prêt** (vous devriez voir "Ready" dans les logs)

4. **Relancez le test** :
   ```bash
   node scripts/test-ai-analysis.js
   ```

---

## Vérification rapide

Pour vérifier que la clé est bien chargée, regardez les logs du serveur lors de la génération d'un rapport.

Vous devriez voir :
```
🤖 Démarrage de l'analyse IA avec Gemini...
✅ Réponse Gemini reçue, parsing...
✅ Analyse IA générée avec succès (score: XX/100)
```

Si vous voyez :
```
⚠️ GEMINI_API_KEY not configured, skipping AI analysis
```

→ Le serveur n'a pas été redémarré après l'ajout de la clé.

---

## Test avec l'adresse

Une fois le serveur redémarré, testez avec :

```bash
node scripts/test-ai-analysis.js
```

L'adresse testée est : **6 boulevard d'indochine 75019 paris**

---

## Dépannage

### Le test échoue toujours

1. Vérifiez que `.env.local` contient bien :
   ```
   GEMINI_API_KEY=AIzaSyC_roi6eQ_BTh9gvQOlKF5GCgTruXHe3aY
   ```

2. Vérifiez que le serveur a été **redémarré** après avoir ajouté la clé

3. Vérifiez les logs du serveur pour voir les erreurs éventuelles

4. Vérifiez que la clé API est valide sur [Google AI Studio](https://makersuite.google.com/app/apikey)

