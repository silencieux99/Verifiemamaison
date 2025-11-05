# Templates d'Email - VerifieMaMaison

## Vue d'ensemble

Les templates d'email ont été créés en s'inspirant de VerifieMaVoiture, mais adaptés pour l'immobilier. Ils utilisent un design professionnel avec des couleurs purple/pink (thème VerifieMaMaison).

## Structure

### Fichiers

1. **`src/lib/email-templates.ts`** : Contient tous les templates HTML et texte
2. **`src/lib/email-service.ts`** : Service d'envoi utilisant Resend
3. **`src/app/api/send-credentials-email/route.ts`** : API pour envoyer les emails de bienvenue

### Templates disponibles

#### 1. Email de bienvenue avec credentials
- **Template** : `getWelcomeEmailTemplate()`
- **Service** : `sendWelcomeEmail()`
- **Utilisation** : Envoyé après un achat avec création de compte automatique
- **Variables** :
  - `email` : Adresse email de l'utilisateur
  - `password` : Mot de passe généré
  - `plan` : Nom du pack acheté (optionnel)
  - `creditsAdded` : Nombre de crédits ajoutés (optionnel)
  - `totalCredits` : Total de crédits après l'ajout (optionnel)

#### 2. Email de confirmation de commande
- **Template** : `getOrderConfirmationEmailTemplate()`
- **Service** : `sendOrderConfirmationEmail()`
- **Utilisation** : Pour confirmer un achat (utilisateur connecté ou non)
- **Variables** :
  - `email` : Adresse email
  - `orderId` : ID de la commande
  - `productName` : Nom du produit
  - `amount` : Montant payé
  - `credits` : Nombre de crédits ajoutés
  - `totalCredits` : Total de crédits (optionnel)
  - `connectedUser` : Si l'utilisateur était déjà connecté

#### 3. Email de rapport de maison
- **Template** : `getHouseReportEmailTemplate()`
- **Service** : `sendHouseReportEmail()`
- **Utilisation** : Quand un rapport est généré (à implémenter)
- **Variables** :
  - `email` : Adresse email
  - `address` : Adresse du bien (optionnel)
  - `postalCode` : Code postal (optionnel)
  - `city` : Ville (optionnel)
  - `reportUrl` : URL du rapport (optionnel)

## Configuration

### Variables d'environnement

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_BASE_URL=https://www.verifiemamaison.fr
```

### Resend

Le service utilise **Resend** en priorité pour l'envoi d'emails. Si Resend n'est pas configuré, l'API retourne un succès mais ne bloque pas le flux utilisateur (l'email est simplement ignoré).

## Design

Les templates utilisent :
- **Couleurs** : Purple (#9333ea) et Pink (#ec4899) pour le thème VerifieMaMaison
- **Police** : Roboto (Google Fonts)
- **Responsive** : Adapté mobile et desktop
- **Style** : Moderne avec gradients et ombres

## Utilisation

### Exemple : Envoyer un email de bienvenue

```typescript
import { sendWelcomeEmail } from '@/lib/email-service';

await sendWelcomeEmail({
  email: 'user@example.com',
  password: 'generatedPassword123',
  plan: 'Pack 3 rapports',
  creditsAdded: 3,
  totalCredits: 3,
});
```

### Exemple : Envoyer un email de confirmation

```typescript
import { sendOrderConfirmationEmail } from '@/lib/email-service';

await sendOrderConfirmationEmail({
  email: 'user@example.com',
  orderId: 'order-123',
  productName: 'Pack 3 rapports',
  amount: 29.97,
  credits: 3,
  totalCredits: 6,
  connectedUser: true,
});
```

## Notes

- Les emails sont envoyés de manière asynchrone pour ne pas bloquer le flux utilisateur
- En cas d'erreur, le flux continue (pas d'erreur bloquante)
- Les templates sont en français et adaptés au marché français
- Les emails incluent des liens vers le site et des CTAs clairs

