import twilio from 'twilio';
import logger from '../config/logger.js';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

// Envoyer un SMS
export const sendSMS = async (to, message) => {
  try {
    const response = await client.messages.create({
      body: message,
      from: twilioPhone,
      to
    });

    logger.info(`SMS envoyé à ${to}: ${response.sid}`);
    return response;
  } catch (error) {
    logger.error(`Erreur envoi SMS: ${error.message}`);
    throw error;
  }
};

// Envoyer une alerte SOS par SMS
export const sendSOSAlert = async (user, location, problem) => {
  try {
    const message = `🚨 URGENCE KADIMA ROAD 🚨
    
${user.firstName} ${user.lastName} a besoin d'aide d'urgence!

Localisation: ${location.address || 'Position partagée'}
Problème: ${problem.description || 'Non spécifié'}
Gravité: ${problem.severity || 'Non spécifiée'}

Veuillez contacter les secours si nécessaire.`;

    // Envoyer aux contacts d'urgence
    const promises = user.emergencyContacts.map(contact => 
      sendSMS(contact.phone, message)
    );

    await Promise.all(promises);
    logger.info(`Alertes SOS envoyées à ${user.emergencyContacts.length} contacts`);
  } catch (error) {
    logger.error(`Erreur envoi alerte SOS: ${error.message}`);
    throw error;
  }
};

// Notifier un helper qu'une mission l'attend
export const notifyHelper = async (helper, intervention) => {
  try {
    const message = `🆕 NOUVELLE INTERVENTION KADIMA ROAD 🆕

Type: ${intervention.type}
Distance: ${intervention.distance} km
Gain estimé: ${intervention.estimatedEarnings} CAD

Client: ${intervention.user.firstName}
Problème: ${intervention.problem.description}

Cliquez pour accepter: kadimaroad.com/helper/intervention/${intervention._id}`;

    await sendSMS(helper.user.phone, message);
    logger.info(`Helper ${helper.user._id} notifié`);
  } catch (error) {
    logger.error(`Erreur notification helper: ${error.message}`);
    throw error;
  }
};

// Notifier un utilisateur que son helper arrive
export const notifyUserHelperOnWay = async (user, helper, eta) => {
  try {
    const message = `✅ VOTRE HELPER ARRIVE ✅

${helper.user.firstName} ${helper.user.lastName} est en route!

Temps estimé: ${eta} minutes
Véhicule: ${helper.vehicle || 'Non spécifié'}

Contact: ${helper.user.phone}

Suivez son arrivée sur l'application.`;

    await sendSMS(user.phone, message);
    logger.info(`Utilisateur ${user._id} notifié de l'arrivée du helper`);
  } catch (error) {
    logger.error(`Erreur notification utilisateur: ${error.message}`);
    throw error;
  }
};

// Envoyer un code de vérification
export const sendVerificationCode = async (phone, code) => {
  try {
    const message = `🔐 KADIMA ROAD - Code de vérification: ${code}. Ne partagez ce code avec personne.`;
    await sendSMS(phone, message);
    return true;
  } catch (error) {
    logger.error(`Erreur envoi code vérification: ${error.message}`);
    return false;
  }
};