# Documentation des Endpoints API Melo

## 🔗 URLs de base

- **Production:** `https://api.notif.immo`
- **Sandbox:** `https://preprod-api.notif.immo`

## 📋 Endpoints identifiés

### 1. `/documents/properties/{id}`
- **Méthode:** GET
- **Description:** Récupère les détails d'une propriété spécifique par son ID
- **Exemple:** `GET https://api.notif.immo/documents/properties/{id}`
- **Headers requis:**
  - `X-API-KEY: votre_cle_api`
  - `Content-Type: application/json`

### 2. Endpoints de recherche (à confirmer)

Selon la documentation, l'API Melo utilise le concept de "Search" (recherche sauvegardée) pour récupérer des propriétés. Les endpoints exacts pour la recherche géographique doivent être confirmés dans la documentation complète.

## 🔍 Recherche de propriétés

L'API Melo fonctionne avec le concept de "Search" - une recherche sauvegardée qui permet de récupérer des propriétés en temps réel selon des critères spécifiques (localisation, prix, type, etc.).

### Approche recommandée

1. **Créer une Search** avec les critères de recherche
2. **Récupérer les résultats** de cette Search
3. **Utiliser les webhooks** pour être notifié des nouveaux résultats

## ⚠️ Notes importantes

- L'endpoint `/documents/properties` sans ID retourne un 401 (nécessite probablement un ID)
- Les endpoints de recherche directe (`/api/v1/properties/search`) n'existent pas
- Il faut probablement utiliser le système de "Search" de l'API

## 📚 Prochaines étapes

1. Consulter la documentation complète pour les endpoints de Search
2. Tester la création d'une Search avec critères géographiques
3. Récupérer les résultats de la Search créée

