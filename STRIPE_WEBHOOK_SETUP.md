# 🔗 Configuration Webhook Stripe - VerifieMaMaison.fr

## 📍 URL de l'endpoint webhook

**URL de production :**
```
https://www.verifiemamaison.fr/api/webhooks/stripe
```

**URL de développement (localhost) :**
```
http://localhost:3000/api/webhooks/stripe
```

## 🔧 Configuration dans Stripe Dashboard

### Étape 1 : Accéder aux Webhooks
1. Connectez-vous à votre [Stripe Dashboard](https://dashboard.stripe.com/)
2. Allez dans **Developers** > **Webhooks**
3. Cliquez sur **Add endpoint**

### Étape 2 : Configurer l'endpoint
1. **Endpoint URL** : 
   ```
   https://www.verifiemamaison.fr/api/webhooks/stripe
   ```

2. **Description** : 
   ```
   VerifieMaMaison - Webhook pour paiements et crédits
   ```

3. **Événements à écouter** :
   - ✅ `payment_intent.succeeded` - Quand un paiement est réussi
   - ✅ `checkout.session.completed` - Quand une session checkout est complétée (backup)

### Étape 3 : Récupérer le Webhook Secret
1. Après avoir créé l'endpoint, cliquez dessus
2. Dans la section **Signing secret**, cliquez sur **Reveal**
3. Copiez le secret (commence par `whsec_...`)
4. Ajoutez-le dans votre `.env.local` :
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_votre_secret_ici
   ```

## ⚙️ Événements gérés

### `payment_intent.succeeded`
- Déclenché quand un paiement via Payment Intent est réussi
- Utilisé par la modale de paiement (`PaymentModal`)
- Récupère le SKU et l'email depuis les metadata

### `checkout.session.completed`
- Déclenché quand une session Checkout est complétée
- Utilisé comme backup pour les anciens paiements
- Récupère le SKU et l'email depuis la session

## 🔐 Sécurité

Le webhook vérifie :
- ✅ La signature Stripe (`stripe-signature` header)
- ✅ Le secret webhook (`STRIPE_WEBHOOK_SECRET`)
- ✅ La validité de l'événement

## 📝 Notes importantes

1. **Double gestion** : Les crédits sont ajoutés dans `/api/handle-payment-success` (appelé côté client) ET peuvent être loggés dans le webhook comme backup.

2. **Metadata requises** :
   - `sku` : Identifiant du plan (unite, pack3, pack10)
   - `email` : Email du client (pour Payment Intent)

3. **Test en local** :
   - Utilisez [Stripe CLI](https://stripe.com/docs/stripe-cli) pour tester localement :
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

## 🚀 Vérification

Pour vérifier que le webhook fonctionne :
1. Effectuez un paiement de test
2. Vérifiez les logs dans Stripe Dashboard > Webhooks > [Votre endpoint] > Logs
3. Vérifiez que l'événement est bien reçu (status 200)

## 📚 Documentation Stripe

- [Webhooks Guide](https://stripe.com/docs/webhooks)
- [Testing Webhooks](https://stripe.com/docs/webhooks/test)
- [Webhook Security](https://stripe.com/docs/webhooks/signatures)

