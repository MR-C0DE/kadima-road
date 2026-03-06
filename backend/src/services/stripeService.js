import Stripe from 'stripe';
import logger from '../config/logger.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Créer un paiement
export const createPaymentIntent = async (amount, currency = 'cad', metadata = {}) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // En cents
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true
      }
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    };
  } catch (error) {
    logger.error(`Erreur création payment intent: ${error.message}`);
    throw error;
  }
};

// Confirmer un paiement
export const confirmPayment = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent.status === 'succeeded';
  } catch (error) {
    logger.error(`Erreur confirmation paiement: ${error.message}`);
    throw error;
  }
};

// Créer un remboursement
export const createRefund = async (paymentIntentId, amount = null) => {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined
    });

    return refund;
  } catch (error) {
    logger.error(`Erreur création remboursement: ${error.message}`);
    throw error;
  }
};

// Créer un compte connecté pour un helper (Stripe Connect)
export const createConnectedAccount = async (helper) => {
  try {
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'CA',
      email: helper.user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      },
      business_type: 'individual',
      individual: {
        first_name: helper.user.firstName,
        last_name: helper.user.lastName,
        email: helper.user.email,
        phone: helper.user.phone
      },
      metadata: {
        helperId: helper._id.toString(),
        userId: helper.user._id.toString()
      }
    });

    return account;
  } catch (error) {
    logger.error(`Erreur création compte connecté: ${error.message}`);
    throw error;
  }
};

// Créer un lien de connexion pour le compte connecté
export const createAccountLink = async (accountId, refreshUrl, returnUrl) => {
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding'
    });

    return accountLink.url;
  } catch (error) {
    logger.error(`Erreur création account link: ${error.message}`);
    throw error;
  }
};

// Effectuer un transfert vers un helper
export const createTransfer = async (amount, destinationAccountId, metadata = {}) => {
  try {
    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 100),
      currency: 'cad',
      destination: destinationAccountId,
      metadata
    });

    return transfer;
  } catch (error) {
    logger.error(`Erreur création transfert: ${error.message}`);
    throw error;
  }
};

// Calculer les frais de plateforme
export const calculatePlatformFee = (amount) => {
  const platformFeePercentage = 0.10; // 10%
  return Math.round(amount * platformFeePercentage * 100) / 100;
};

// Webhook handler pour les événements Stripe
export const handleWebhook = async (payload, signature) => {
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object);
        break;
      case 'account.updated':
        await handleAccountUpdate(event.data.object);
        break;
    }

    return event;
  } catch (error) {
    logger.error(`Erreur webhook Stripe: ${error.message}`);
    throw error;
  }
};

// Handlers internes
const handlePaymentSuccess = async (paymentIntent) => {
  logger.info(`Paiement réussi: ${paymentIntent.id}`);
  // Mettre à jour l'intervention, envoyer email, etc.
};

const handlePaymentFailure = async (paymentIntent) => {
  logger.warn(`Paiement échoué: ${paymentIntent.id}`);
  // Notifier l'utilisateur
};

const handleAccountUpdate = async (account) => {
  logger.info(`Compte mis à jour: ${account.id}`);
  // Mettre à jour le statut du helper
};