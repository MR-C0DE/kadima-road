import sgMail from '@sendgrid/mail';
import logger from '../config/logger.js';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const fromEmail = process.env.EMAIL_FROM || 'noreply@kadimaroad.com';

// Envoyer un email
export const sendEmail = async (to, subject, html, text = '') => {
  try {
    const msg = {
      to,
      from: fromEmail,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''),
      html
    };

    const response = await sgMail.send(msg);
    logger.info(`Email envoyé à ${to}`);
    return response;
  } catch (error) {
    logger.error(`Erreur envoi email: ${error.message}`);
    throw error;
  }
};

// Email de bienvenue
export const sendWelcomeEmail = async (user) => {
  try {
    const html = `
      <h1>Bienvenue sur Kadima Road, ${user.firstName} !</h1>
      <p>Nous sommes ravis de vous compter parmi notre communauté.</p>
      <p>Avec Kadima Road, vous pouvez :</p>
      <ul>
        <li>🚗 Obtenir un diagnostic IA de votre panne</li>
        <li>🆘 Envoyer une alerte SOS en 1 clic</li>
        <li>👥 Trouver des helpers près de chez vous</li>
      </ul>
      <p>Téléchargez l'application mobile pour commencer.</p>
      <p>L'équipe Kadima Road</p>
    `;

    await sendEmail(user.email, 'Bienvenue sur Kadima Road', html);
  } catch (error) {
    logger.error(`Erreur email bienvenue: ${error.message}`);
  }
};

// Email de confirmation d'intervention
export const sendInterventionConfirmation = async (user, intervention, helper) => {
  try {
    const html = `
      <h1>Intervention confirmée, ${user.firstName} !</h1>
      <p>Votre helper <strong>${helper.user.firstName} ${helper.user.lastName}</strong> est en route.</p>
      
      <h2>Détails de l'intervention :</h2>
      <ul>
        <li>🕒 Heure estimée d'arrivée : ${intervention.eta} minutes</li>
        <li>📍 Localisation : ${intervention.location.address}</li>
        <li>🔧 Problème : ${intervention.problem.description}</li>
        <li>💰 Prix estimé : ${intervention.estimatedPrice} CAD</li>
      </ul>
      
      <p>Contact helper : ${helper.user.phone}</p>
      <p>Suivez l'intervention en temps réel sur l'application.</p>
    `;

    await sendEmail(user.email, 'Intervention confirmée - Kadima Road', html);
  } catch (error) {
    logger.error(`Erreur email confirmation: ${error.message}`);
  }
};

// Email de facture
export const sendInvoice = async (user, intervention, payment) => {
  try {
    const html = `
      <h1>Facture Kadima Road</h1>
      <p>Merci d'avoir utilisé Kadima Road, ${user.firstName}.</p>
      
      <h2>Détails :</h2>
      <ul>
        <li>📅 Date : ${new Date().toLocaleDateString()}</li>
        <li>🔧 Intervention : ${intervention.type}</li>
        <li>👤 Helper : ${intervention.helper?.user?.firstName} ${intervention.helper?.user?.lastName}</li>
        <li>💰 Montant total : ${payment.amount} CAD</li>
        <li>💳 Mode de paiement : ${payment.method}</li>
        <li>🆔 Transaction : ${payment.stripeDetails?.chargeId || 'N/A'}</li>
      </ul>
      
      <p>À bientôt sur Kadima Road !</p>
    `;

    await sendEmail(user.email, `Facture Kadima Road #${intervention._id}`, html);
  } catch (error) {
    logger.error(`Erreur email facture: ${error.message}`);
  }
};

// Email de réinitialisation de mot de passe
export const sendPasswordResetEmail = async (user, resetToken) => {
  try {
    const resetUrl = `https://kadimaroad.com/reset-password?token=${resetToken}`;
    
    const html = `
      <h1>Réinitialisation de votre mot de passe</h1>
      <p>Bonjour ${user.firstName},</p>
      <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
      <p>Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>Ce lien expirera dans 1 heure.</p>
      <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
    `;

    await sendEmail(user.email, 'Réinitialisation mot de passe - Kadima Road', html);
  } catch (error) {
    logger.error(`Erreur email reset password: ${error.message}`);
  }
};