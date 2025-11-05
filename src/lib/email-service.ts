/**
 * Service d'envoi d'emails pour VerifieMaMaison
 * Utilise Resend en priorité, avec fallback SMTP si nécessaire
 */

import { Resend } from 'resend';
import { getWelcomeEmailTemplate, getOrderConfirmationEmailTemplate, getHouseReportEmailTemplate, WelcomeEmailVariables, OrderConfirmationVariables, HouseEmailTemplateVariables } from './email-templates';

// Initialisation de Resend
let resend: Resend | null = null;

try {
  if (process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
    console.log('✅ Resend configuré pour VerifieMaMaison');
  }
} catch (error) {
  console.warn('⚠️ Resend non disponible:', error);
}

/**
 * Envoie un email de bienvenue avec les identifiants
 */
export async function sendWelcomeEmail(variables: WelcomeEmailVariables): Promise<boolean> {
  try {
    if (!resend) {
      throw new Error('Resend non configuré. Veuillez ajouter RESEND_API_KEY dans .env.local');
    }

    console.log(`🚀 Envoi email de bienvenue à ${variables.email}`);

    const { html, text, subject } = getWelcomeEmailTemplate(variables);

    const result = await resend.emails.send({
      from: 'VerifieMaMaison.fr <contact@verifiemamaison.fr>',
      to: [variables.email],
      subject: subject,
      html: html,
      text: text,
    });

    if (result.error) {
      throw new Error(result.error.message || 'Erreur lors de l\'envoi de l\'email');
    }

    console.log(`✅ Email de bienvenue envoyé avec succès via Resend${result.data?.id ? ` (ID: ${result.data.id})` : ''}`);
    return true;
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'envoi de l\'email de bienvenue:', error);
    throw error;
  }
}

/**
 * Envoie un email de confirmation de commande
 */
export async function sendOrderConfirmationEmail(variables: OrderConfirmationVariables): Promise<boolean> {
  try {
    if (!resend) {
      throw new Error('Resend non configuré. Veuillez ajouter RESEND_API_KEY dans .env.local');
    }

    console.log(`🚀 Envoi email de confirmation à ${variables.email}`);

    const { html, text, subject } = getOrderConfirmationEmailTemplate(variables);

    const result = await resend.emails.send({
      from: 'VerifieMaMaison.fr <contact@verifiemamaison.fr>',
      to: [variables.email],
      subject: subject,
      html: html,
      text: text,
    });

    if (result.error) {
      throw new Error(result.error.message || 'Erreur lors de l\'envoi de l\'email');
    }

    console.log(`✅ Email de confirmation envoyé avec succès via Resend${result.data?.id ? ` (ID: ${result.data.id})` : ''}`);
    return true;
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'envoi de l\'email de confirmation:', error);
    throw error;
  }
}

/**
 * Envoie un email avec le rapport de maison
 */
export async function sendHouseReportEmail(variables: HouseEmailTemplateVariables & { email: string }): Promise<boolean> {
  try {
    if (!resend) {
      throw new Error('Resend non configuré. Veuillez ajouter RESEND_API_KEY dans .env.local');
    }

    console.log(`🚀 Envoi email de rapport à ${variables.email}`);

    const { html, text, subject } = getHouseReportEmailTemplate(variables);

    const result = await resend.emails.send({
      from: 'VerifieMaMaison.fr <contact@verifiemamaison.fr>',
      to: [variables.email],
      subject: subject,
      html: html,
      text: text,
    });

    if (result.error) {
      throw new Error(result.error.message || 'Erreur lors de l\'envoi de l\'email');
    }

    console.log(`✅ Email de rapport envoyé avec succès via Resend${result.data?.id ? ` (ID: ${result.data.id})` : ''}`);
    return true;
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'envoi de l\'email de rapport:', error);
    throw error;
  }
}

