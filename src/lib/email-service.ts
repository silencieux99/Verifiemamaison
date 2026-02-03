/**
 * Service d'envoi d'emails pour VerifieMaMaison
 * Utilise Nodemailer (SMTP) comme demandé
 */

import nodemailer from 'nodemailer';
import { getWelcomeEmailTemplate, getOrderConfirmationEmailTemplate, getHouseReportEmailTemplate, WelcomeEmailVariables, OrderConfirmationVariables, HouseEmailTemplateVariables } from './email-templates';

// Initialisation du transporteur Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || '',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true pour 465, false pour les autres
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASSWORD || '',
  },
});

// Vérification de la configuration au démarrage (optionnel mais utile en dev)
if (process.env.NODE_ENV !== 'production') {
  transporter.verify(function (error, success) {
    if (error) {
      console.warn('⚠️ Erreur configuration SMTP :', error);
    } else {
      console.log('✅ Serveur SMTP prêt pour l\'envoi d\'emails');
    }
  });
}

/**
 * Envoie un email de bienvenue avec les identifiants
 */
export async function sendWelcomeEmail(variables: WelcomeEmailVariables): Promise<boolean> {
  try {
    console.log(`🚀 Envoi email de bienvenue à ${variables.email} via SMTP`);

    const { html, text, subject } = getWelcomeEmailTemplate(variables);

    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"VerifieMaMaison" <contact@verifiemamaison.fr>',
      to: variables.email,
      subject: subject,
      text: text,
      html: html,
    });

    console.log(`✅ Email de bienvenue envoyé avec succès`);
    return true;
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'envoi de l\'email de bienvenue:', error);
    // On throw pour que le webhook sache qu'il y a eu une erreur, ou on return false
    // Ici on log juste
    return false;
  }
}

/**
 * Envoie un email de confirmation de commande
 */
export async function sendOrderConfirmationEmail(variables: OrderConfirmationVariables): Promise<boolean> {
  try {
    console.log(`🚀 Envoi email de confirmation à ${variables.email} via SMTP`);

    const { html, text, subject } = getOrderConfirmationEmailTemplate(variables);

    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"VerifieMaMaison" <contact@verifiemamaison.fr>',
      to: variables.email,
      subject: subject,
      text: text,
      html: html,
    });

    console.log(`✅ Email de confirmation envoyé avec succès`);
    return true;
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'envoi de l\'email de confirmation:', error);
    return false;
  }
}

/**
 * Envoie un email avec le rapport de maison
 */
export async function sendHouseReportEmail(variables: HouseEmailTemplateVariables & { email: string }): Promise<boolean> {
  try {
    console.log(`🚀 Envoi email de rapport à ${variables.email} via SMTP`);

    const { html, text, subject } = getHouseReportEmailTemplate(variables);

    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"VerifieMaMaison" <contact@verifiemamaison.fr>',
      to: variables.email,
      subject: subject,
      text: text,
      html: html,
      // TODO: Ajouter la pièce jointe PDF ici si on a le buffer ou le path
    });

    console.log(`✅ Email de rapport envoyé avec succès`);
    return true;
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'envoi de l\'email de rapport:', error);
    return false;
  }
}
