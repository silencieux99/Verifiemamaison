/**
 * Templates d'email pour VerifieMaMaison
 * Inspirés de VerifieMaVoiture mais adaptés pour l'immobilier
 */

export interface HouseEmailTemplateVariables {
  address?: string;
  postalCode?: string;
  city?: string;
  reportUrl?: string;
  logo?: string;
}

export interface WelcomeEmailVariables {
  email: string;
  password: string;
  plan?: string;
  creditsAdded?: number;
  totalCredits?: number;
}

export interface OrderConfirmationVariables {
  email: string;
  orderId: string;
  productName: string;
  amount: number;
  credits: number;
  totalCredits?: number;
  connectedUser?: boolean;
}

// Template email de bienvenue avec credentials
export function getWelcomeEmailTemplate(variables: WelcomeEmailVariables): { html: string; text: string; subject: string } {
  const subject = '🎉 Bienvenue sur VerifieMaMaison.fr - Vos identifiants de connexion';
  
  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue - VerifieMaMaison.fr</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Roboto', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f7fa;
    }
    
    .container {
      max-width: 650px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
      position: relative;
    }
    
    .header-title {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 10px;
    }
    
    .header-subtitle {
      font-size: 18px;
      font-weight: 300;
      opacity: 0.9;
    }
    
    .content {
      padding: 50px 40px;
    }
    
    .welcome-message {
      background: linear-gradient(135deg, #e8f5e8 0%, #f0f9ff 100%);
      border-left: 5px solid #10b981;
      padding: 25px;
      border-radius: 8px;
      margin-bottom: 35px;
    }
    
    .welcome-message h2 {
      color: #059669;
      font-size: 24px;
      margin-bottom: 10px;
    }
    
    .welcome-message p {
      color: #047857;
      font-size: 16px;
      line-height: 1.7;
    }
    
    .credentials-box {
      background: #f8fafc;
      border-radius: 12px;
      padding: 30px;
      margin: 30px 0;
      border: 2px solid #e2e8f0;
    }
    
    .credentials-title {
      font-size: 20px;
      color: #1e293b;
      font-weight: 600;
      margin-bottom: 20px;
      text-align: center;
    }
    
    .credential-item {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 15px;
      border: 1px solid #e2e8f0;
    }
    
    .credential-label {
      font-size: 13px;
      color: #64748b;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    
    .credential-value {
      font-size: 18px;
      color: #1e293b;
      font-weight: 600;
      font-family: monospace;
      word-break: break-all;
    }
    
    .warning-box {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-left: 5px solid #f59e0b;
      padding: 20px;
      border-radius: 8px;
      margin: 25px 0;
    }
    
    .warning-box p {
      color: #92400e;
      font-size: 14px;
      line-height: 1.6;
      margin: 0;
    }
    
    .cta-section {
      text-align: center;
      margin: 40px 0;
    }
    
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%);
      color: white;
      padding: 18px 35px;
      text-decoration: none;
      border-radius: 50px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 8px 25px rgba(147, 51, 234, 0.3);
      margin: 0 10px 10px 0;
    }
    
    .footer {
      background: #1e293b;
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    
    .footer-title {
      font-size: 24px;
      font-weight: 700;
      color: #a78bfa;
      margin-bottom: 10px;
    }
    
    .footer-subtitle {
      font-size: 16px;
      color: #94a3b8;
      margin-bottom: 25px;
    }
    
    .footer-contact {
      display: flex;
      justify-content: center;
      gap: 30px;
      margin-bottom: 25px;
      flex-wrap: wrap;
    }
    
    .contact-item {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #cbd5e1;
      font-size: 14px;
    }
    
    .contact-item a {
      color: #a78bfa;
      text-decoration: none;
      font-weight: 500;
    }
    
    .footer-note {
      font-size: 12px;
      color: #64748b;
      margin-top: 25px;
      opacity: 0.8;
    }
    
    @media (max-width: 768px) {
      .container {
        margin: 10px;
        border-radius: 8px;
      }
      
      .header {
        padding: 30px 20px;
      }
      
      .header-title {
        font-size: 28px;
      }
      
      .content {
        padding: 30px 20px;
      }
      
      .footer-contact {
        flex-direction: column;
        gap: 15px;
      }
      
      .cta-button {
        padding: 15px 25px;
        font-size: 14px;
        display: block;
        margin: 10px 0;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="header-title">VerifieMaMaison.fr</div>
      <div class="header-subtitle">Bienvenue ! Votre compte a été créé</div>
    </div>
    
    <!-- Content -->
    <div class="content">
      <!-- Welcome Message -->
      <div class="welcome-message">
        <h2>🎉 Félicitations !</h2>
        <p>
          Votre compte VerifieMaMaison.fr a été créé avec succès suite à votre achat. 
          Vous pouvez maintenant accéder à votre espace personnel et générer vos rapports d'analyse immobilière.
        </p>
      </div>
      
      <!-- Credentials Box -->
      <div class="credentials-box">
        <div class="credentials-title">🔐 Vos identifiants de connexion</div>
        
        <div class="credential-item">
          <div class="credential-label">Adresse e-mail</div>
          <div class="credential-value">${variables.email}</div>
        </div>
        
        <div class="credential-item">
          <div class="credential-label">Mot de passe</div>
          <div class="credential-value">${variables.password}</div>
        </div>
      </div>
      
      ${variables.creditsAdded ? `
      <div class="welcome-message">
        <h3 style="color: #059669; font-size: 20px; margin-bottom: 10px;">💰 Vos crédits</h3>
        <p style="color: #047857; font-size: 16px;">
          <strong>${variables.creditsAdded} crédit${variables.creditsAdded > 1 ? 's' : ''}</strong> ${variables.plan ? `pour le pack "${variables.plan}"` : ''} ont été ajoutés à votre compte.
          ${variables.totalCredits ? `Vous disposez maintenant de <strong>${variables.totalCredits} crédit${variables.totalCredits > 1 ? 's' : ''}</strong> au total.` : ''}
        </p>
      </div>
      ` : ''}
      
      <!-- Warning Box -->
      <div class="warning-box">
        <p>
          <strong>⚠️ Important :</strong> Conservez ces identifiants en sécurité. 
          Nous vous recommandons de changer votre mot de passe après votre première connexion.
        </p>
      </div>
      
      <!-- CTA Section -->
      <div class="cta-section">
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.verifiemamaison.fr'}/login" class="cta-button">
          🔑 Me connecter maintenant
        </a>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.verifiemamaison.fr'}/account" class="cta-button">
          🏠 Accéder à mon compte
        </a>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <div class="footer-title">VerifieMaMaison.fr</div>
      <div class="footer-subtitle">Le spécialiste français de l'analyse immobilière</div>
      
      <div class="footer-contact">
        <div class="contact-item">
          <span>📧</span>
          <a href="mailto:contact@verifiemamaison.fr">contact@verifiemamaison.fr</a>
        </div>
        <div class="contact-item">
          <span>🌐</span>
          <a href="https://www.verifiemamaison.fr">www.verifiemamaison.fr</a>
        </div>
      </div>
      
      <div class="footer-note">
        Merci de votre confiance. Cet email a été envoyé automatiquement suite à votre achat. 
        Si vous avez des questions, notre équipe support est à votre disposition.
      </div>
    </div>
  </div>
</body>
</html>`;

  const text = `
VERIFIEMAMAISON.FR - BIENVENUE !

🎉 Félicitations !

Votre compte VerifieMaMaison.fr a été créé avec succès suite à votre achat.

VOS IDENTIFIANTS DE CONNEXION :
Email : ${variables.email}
Mot de passe : ${variables.password}

${variables.creditsAdded ? `
VOS CRÉDITS :
${variables.creditsAdded} crédit${variables.creditsAdded > 1 ? 's' : ''} ${variables.plan ? `pour le pack "${variables.plan}"` : ''} ont été ajoutés à votre compte.
${variables.totalCredits ? `Vous disposez maintenant de ${variables.totalCredits} crédit${variables.totalCredits > 1 ? 's' : ''} au total.` : ''}
` : ''}

⚠️ IMPORTANT : Conservez ces identifiants en sécurité. 
Nous vous recommandons de changer votre mot de passe après votre première connexion.

LIENS UTILES :
• Connexion : ${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.verifiemamaison.fr'}/login
• Mon compte : ${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.verifiemamaison.fr'}/account

Merci de votre confiance !

L'équipe VerifieMaMaison.fr
📧 contact@verifiemamaison.fr
🌐 www.verifiemamaison.fr

Cet email a été envoyé automatiquement suite à votre achat.
  `;

  return { html, text, subject };
}

// Template email de confirmation de commande
export function getOrderConfirmationEmailTemplate(variables: OrderConfirmationVariables): { html: string; text: string; subject: string } {
  const subject = variables.connectedUser 
    ? '✅ Crédits ajoutés à votre compte - VerifieMaMaison.fr'
    : '✅ Confirmation de commande - VerifieMaMaison.fr';
  
  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation - VerifieMaMaison.fr</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Roboto', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f7fa; }
    .container { max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); color: white; padding: 40px 30px; text-align: center; }
    .header-title { font-size: 32px; font-weight: 700; margin-bottom: 10px; }
    .header-subtitle { font-size: 18px; font-weight: 300; opacity: 0.9; }
    .content { padding: 50px 40px; }
    .success-message { background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-left: 5px solid #10b981; padding: 25px; border-radius: 8px; margin-bottom: 35px; }
    .success-message h2 { color: #059669; font-size: 24px; margin-bottom: 10px; }
    .success-message p { color: #047857; font-size: 16px; line-height: 1.7; }
    .order-details { background: #f8fafc; border-radius: 12px; padding: 30px; margin: 30px 0; border: 1px solid #e2e8f0; }
    .order-title { font-size: 20px; color: #1e293b; font-weight: 600; margin-bottom: 20px; text-align: center; }
    .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #64748b; font-size: 14px; }
    .detail-value { color: #1e293b; font-size: 14px; font-weight: 600; }
    .cta-section { text-align: center; margin: 40px 0; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); color: white; padding: 18px 35px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 8px 25px rgba(147, 51, 234, 0.3); margin: 0 10px 10px 0; }
    .footer { background: #1e293b; color: white; padding: 40px 30px; text-align: center; }
    .footer-title { font-size: 24px; font-weight: 700; color: #a78bfa; margin-bottom: 10px; }
    .footer-subtitle { font-size: 16px; color: #94a3b8; margin-bottom: 25px; }
    .footer-contact { display: flex; justify-content: center; gap: 30px; margin-bottom: 25px; flex-wrap: wrap; }
    .contact-item { display: flex; align-items: center; gap: 8px; color: #cbd5e1; font-size: 14px; }
    .contact-item a { color: #a78bfa; text-decoration: none; font-weight: 500; }
    .footer-note { font-size: 12px; color: #64748b; margin-top: 25px; opacity: 0.8; }
    @media (max-width: 768px) {
      .container { margin: 10px; border-radius: 8px; }
      .header { padding: 30px 20px; }
      .content { padding: 30px 20px; }
      .footer-contact { flex-direction: column; gap: 15px; }
      .cta-button { display: block; margin: 10px 0; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-title">${variables.connectedUser ? '✅ Crédits ajoutés !' : '✅ Commande confirmée !'}</div>
      <div class="header-subtitle">${variables.connectedUser ? 'Vos crédits ont été ajoutés à votre compte' : 'Votre commande a été traitée avec succès'}</div>
    </div>
    
    <div class="content">
      <div class="success-message">
        <h2>${variables.connectedUser ? 'Merci pour votre achat !' : 'Merci pour votre commande !'}</h2>
        <p>
          ${variables.connectedUser 
            ? `Votre paiement a été traité avec succès. ${variables.credits} crédit${variables.credits > 1 ? 's ont' : ' a'} été ajouté${variables.credits > 1 ? 's' : ''} à votre compte.${variables.totalCredits ? ` Vous disposez maintenant de ${variables.totalCredits} crédit${variables.totalCredits > 1 ? 's' : ''} au total.` : ''}`
            : 'Votre commande a été traitée avec succès. Vous pouvez maintenant utiliser vos crédits pour générer des rapports d\'analyse immobilière.'}
        </p>
      </div>
      
      <div class="order-details">
        <div class="order-title">📋 Détails de votre commande</div>
        <div class="detail-row">
          <span class="detail-label">Numéro de commande</span>
          <span class="detail-value">#${variables.orderId}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Produit</span>
          <span class="detail-value">${variables.productName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Montant</span>
          <span class="detail-value">${variables.amount.toFixed(2)} €</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date</span>
          <span class="detail-value">${new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        ${variables.credits ? `
        <div class="detail-row">
          <span class="detail-label">Crédits ajoutés</span>
          <span class="detail-value" style="color: #10b981;">${variables.credits} crédit${variables.credits > 1 ? 's' : ''}</span>
        </div>
        ` : ''}
        ${variables.connectedUser && variables.totalCredits ? `
        <div class="detail-row">
          <span class="detail-label">Solde total</span>
          <span class="detail-value" style="color: #9333ea; font-weight: 700;">${variables.totalCredits} crédit${variables.totalCredits > 1 ? 's' : ''}</span>
        </div>
        ` : ''}
      </div>
      
      <div class="cta-section">
        ${variables.connectedUser ? `
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.verifiemamaison.fr'}/account" class="cta-button">👤 Mon compte</a>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.verifiemamaison.fr'}/generate-report" class="cta-button">📊 Générer un rapport</a>
        ` : `
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.verifiemamaison.fr'}/create-account?orderId=${variables.orderId}&email=${encodeURIComponent(variables.email)}" class="cta-button">👤 Créer mon compte</a>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.verifiemamaison.fr'}/generate-report" class="cta-button">📊 Générer un rapport</a>
        `}
      </div>
    </div>
    
    <div class="footer">
      <div class="footer-title">VerifieMaMaison.fr</div>
      <div class="footer-subtitle">Le spécialiste français de l'analyse immobilière</div>
      <div class="footer-contact">
        <div class="contact-item">
          <span>📧</span>
          <a href="mailto:contact@verifiemamaison.fr">contact@verifiemamaison.fr</a>
        </div>
        <div class="contact-item">
          <span>🌐</span>
          <a href="https://www.verifiemamaison.fr">www.verifiemamaison.fr</a>
        </div>
      </div>
      <div class="footer-note">
        Cet email a été envoyé automatiquement suite à votre commande.
      </div>
    </div>
  </div>
</body>
</html>`;

  const text = `
VERIFIEMAMAISON.FR - ${variables.connectedUser ? 'CRÉDITS AJOUTÉS À VOTRE COMPTE' : 'CONFIRMATION DE COMMANDE'}

Bonjour,

${variables.connectedUser 
  ? `Votre paiement a été traité avec succès. ${variables.credits} crédit${variables.credits > 1 ? 's ont' : ' a'} été ajouté${variables.credits > 1 ? 's' : ''} à votre compte.${variables.totalCredits ? ` Vous disposez maintenant de ${variables.totalCredits} crédit${variables.totalCredits > 1 ? 's' : ''} au total.` : ''}`
  : 'Votre commande a été traitée avec succès !'
}

DÉTAILS DE VOTRE COMMANDE :
Numéro de commande : #${variables.orderId}
Produit : ${variables.productName}
Montant : ${variables.amount.toFixed(2)} €
Date : ${new Date().toLocaleDateString('fr-FR')}
${variables.credits ? `Crédits ajoutés : ${variables.credits} crédit${variables.credits > 1 ? 's' : ''}` : ''}
${variables.connectedUser && variables.totalCredits ? `Solde total : ${variables.totalCredits} crédit${variables.totalCredits > 1 ? 's' : ''}` : ''}

LIENS UTILES :
${variables.connectedUser ? `
• Mon compte : ${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.verifiemamaison.fr'}/account
• Générer un rapport : ${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.verifiemamaison.fr'}/generate-report
` : `
• Créer mon compte : ${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.verifiemamaison.fr'}/create-account?orderId=${variables.orderId}&email=${encodeURIComponent(variables.email)}
• Générer un rapport : ${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.verifiemamaison.fr'}/generate-report
`}

Merci de votre confiance !

L'équipe VerifieMaMaison.fr
📧 contact@verifiemamaison.fr
🌐 www.verifiemamaison.fr

Cet email a été envoyé automatiquement suite à votre commande.
  `;

  return { html, text, subject };
}

// Template email pour le rapport de maison (quand il sera généré)
export function getHouseReportEmailTemplate(variables: HouseEmailTemplateVariables): { html: string; text: string; subject: string } {
  const subject = '📄 Votre rapport d\'analyse immobilière est prêt - VerifieMaMaison.fr';
  
  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport prêt - VerifieMaMaison.fr</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Roboto', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f7fa; }
    .container { max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); color: white; padding: 40px 30px; text-align: center; }
    .header-title { font-size: 32px; font-weight: 700; margin-bottom: 10px; }
    .header-subtitle { font-size: 18px; font-weight: 300; opacity: 0.9; }
    .content { padding: 50px 40px; }
    .success-message { background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-left: 5px solid #10b981; padding: 25px; border-radius: 8px; margin-bottom: 35px; }
    .success-message h2 { color: #059669; font-size: 24px; margin-bottom: 10px; }
    .house-details { background: #f8fafc; border-radius: 12px; padding: 30px; margin: 30px 0; border: 1px solid #e2e8f0; }
    .house-title { font-size: 20px; color: #1e293b; font-weight: 600; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
    .detail-item { padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
    .detail-item:last-child { border-bottom: none; }
    .detail-label { color: #64748b; font-size: 14px; font-weight: 500; }
    .detail-value { color: #1e293b; font-size: 16px; font-weight: 600; margin-top: 4px; }
    .pdf-section { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 35px; text-align: center; margin: 35px 0; border: 2px solid #f59e0b; }
    .pdf-icon { font-size: 60px; margin-bottom: 20px; display: block; }
    .pdf-title { font-size: 22px; font-weight: 700; color: #92400e; margin-bottom: 10px; }
    .pdf-description { font-size: 16px; color: #a16207; line-height: 1.6; }
    .cta-section { text-align: center; margin: 40px 0; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); color: white; padding: 18px 35px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 8px 25px rgba(147, 51, 234, 0.3); margin: 0 10px 10px 0; }
    .footer { background: #1e293b; color: white; padding: 40px 30px; text-align: center; }
    .footer-title { font-size: 24px; font-weight: 700; color: #a78bfa; margin-bottom: 10px; }
    .footer-subtitle { font-size: 16px; color: #94a3b8; margin-bottom: 25px; }
    .footer-contact { display: flex; justify-content: center; gap: 30px; margin-bottom: 25px; flex-wrap: wrap; }
    .contact-item { display: flex; align-items: center; gap: 8px; color: #cbd5e1; font-size: 14px; }
    .contact-item a { color: #a78bfa; text-decoration: none; font-weight: 500; }
    .footer-note { font-size: 12px; color: #64748b; margin-top: 25px; opacity: 0.8; }
    @media (max-width: 768px) {
      .container { margin: 10px; border-radius: 8px; }
      .header { padding: 30px 20px; }
      .content { padding: 30px 20px; }
      .footer-contact { flex-direction: column; gap: 15px; }
      .cta-button { display: block; margin: 10px 0; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-title">VerifieMaMaison.fr</div>
      <div class="header-subtitle">Votre rapport d'analyse est prêt !</div>
    </div>
    
    <div class="content">
      <div class="success-message">
        <h2>🎉 Félicitations !</h2>
        <p>
          Nous avons le plaisir de vous informer que votre rapport d'analyse immobilière complet a été généré avec succès. 
          Toutes les informations disponibles ont été compilées dans un document PDF professionnel.
        </p>
      </div>
      
      ${variables.address ? `
      <div class="house-details">
        <div class="house-title">
          <span>🏠</span>
          <span>Informations du bien</span>
        </div>
        <div class="detail-item">
          <div class="detail-label">Adresse</div>
          <div class="detail-value">${variables.address}</div>
        </div>
        ${variables.postalCode && variables.city ? `
        <div class="detail-item">
          <div class="detail-label">Code postal / Ville</div>
          <div class="detail-value">${variables.postalCode} ${variables.city}</div>
        </div>
        ` : ''}
      </div>
      ` : ''}
      
      <div class="pdf-section">
        <span class="pdf-icon">📄</span>
        <div class="pdf-title">Rapport PDF Complet Disponible</div>
        <div class="pdf-description">
          Le rapport détaillé en format PDF est disponible dans votre espace personnel. 
          Il contient l'analyse complète du bien, les points de contrôle, les recommandations, et bien plus encore.
        </div>
      </div>
      
      <div class="cta-section">
        ${variables.reportUrl ? `
        <a href="${variables.reportUrl}" class="cta-button">📊 Consulter mon rapport</a>
        ` : ''}
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.verifiemamaison.fr'}/account" class="cta-button">🏠 Mon compte</a>
      </div>
    </div>
    
    <div class="footer">
      <div class="footer-title">VerifieMaMaison.fr</div>
      <div class="footer-subtitle">Le spécialiste français de l'analyse immobilière</div>
      <div class="footer-contact">
        <div class="contact-item">
          <span>📧</span>
          <a href="mailto:contact@verifiemamaison.fr">contact@verifiemamaison.fr</a>
        </div>
        <div class="contact-item">
          <span>🌐</span>
          <a href="https://www.verifiemamaison.fr">www.verifiemamaison.fr</a>
        </div>
      </div>
      <div class="footer-note">
        Merci de votre confiance. Cet email a été envoyé automatiquement suite à la génération de votre rapport.
      </div>
    </div>
  </div>
</body>
</html>`;

  const text = `
VERIFIEMAMAISON.FR - RAPPORT D'ANALYSE PRÊT !

🎉 Félicitations !

Nous avons le plaisir de vous informer que votre rapport d'analyse immobilière complet a été généré avec succès.

${variables.address ? `
INFORMATIONS DU BIEN :
Adresse : ${variables.address}
${variables.postalCode && variables.city ? `Code postal / Ville : ${variables.postalCode} ${variables.city}` : ''}
` : ''}

📄 RAPPORT PDF COMPLET DISPONIBLE
Le rapport détaillé en format PDF est disponible dans votre espace personnel.
Il contient l'analyse complète du bien, les points de contrôle, les recommandations, et bien plus encore.

LIENS UTILES :
${variables.reportUrl ? `• Consulter mon rapport : ${variables.reportUrl}` : ''}
• Mon compte : ${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.verifiemamaison.fr'}/account

Merci de votre confiance !

L'équipe VerifieMaMaison.fr
📧 contact@verifiemamaison.fr
🌐 www.verifiemamaison.fr

Cet email a été envoyé automatiquement suite à la génération de votre rapport.
  `;

  return { html, text, subject };
}

