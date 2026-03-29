import Payment from '../models/Payment.js';
import Intervention from '../models/Intervention.js';
import User from '../models/User.js';
import Helper from '../models/Helper.js';
import {
  createPaymentIntent,
  confirmPayment,
  createRefund,
  createTransfer,
  calculatePlatformFee,
  handleWebhook
} from '../services/stripeService.js';
import { sendInvoice } from '../services/emailService.js';
import logger from '../config/logger.js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// @desc    Créer une intention de paiement
// @route   POST /api/payments/create-intent
// @access  Private
export const createPaymentIntentHandler = async (req, res) => {
  try {
    const { interventionId, amount, currency = 'cad' } = req.body;

    // Vérifier que l'intervention existe
    const intervention = await Intervention.findById(interventionId);
    if (!intervention) {
      return res.status(404).json({
        success: false,
        message: 'Intervention non trouvée'
      });
    }

    // Vérifier que l'utilisateur est bien celui de l'intervention
    if (intervention.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    // Créer le paiement dans Stripe
    const paymentIntent = await createPaymentIntent(
      amount || intervention.pricing?.final || 0,
      currency,
      {
        interventionId: intervention._id.toString(),
        userId: req.user._id.toString()
      }
    );

    // Sauvegarder le paiement dans notre base
    const payment = await Payment.create({
      user: req.user._id,
      intervention: intervention._id,
      helper: intervention.helper,
      amount: amount || intervention.pricing?.final || 0,
      currency,
      status: 'pending',
      paymentMethod: 'card',
      stripeDetails: {
        paymentIntentId: paymentIntent.paymentIntentId,
        clientSecret: paymentIntent.clientSecret
      }
    });

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.clientSecret,
        paymentId: payment._id
      }
    });

  } catch (error) {
    logger.error(`Erreur création paiement: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du paiement'
    });
  }
};

// @desc    Confirmer un paiement
// @route   POST /api/payments/confirm
// @access  Private
export const confirmPaymentHandler = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    // Vérifier le paiement dans Stripe
    const confirmed = await confirmPayment(paymentIntentId);

    if (!confirmed) {
      return res.status(400).json({
        success: false,
        message: 'Paiement non confirmé'
      });
    }

    // Mettre à jour notre base
    const payment = await Payment.findOne({
      'stripeDetails.paymentIntentId': paymentIntentId
    });

    if (payment) {
      payment.status = 'completed';
      payment.stripeDetails.chargeId = `ch_${Date.now()}`; // À remplacer par vrai chargeId
      payment.paidAt = new Date();
      await payment.save();

      // Mettre à jour l'intervention
      await Intervention.findByIdAndUpdate(payment.intervention, {
        'payment.status': 'completed',
        'payment.paidAt': new Date()
      });

      // Envoyer la facture par email
      const user = await User.findById(payment.user);
      const intervention = await Intervention.findById(payment.intervention)
        .populate('helper');
      
      await sendInvoice(user, intervention, payment);
    }

    res.json({
      success: true,
      message: 'Paiement confirmé'
    });

  } catch (error) {
    logger.error(`Erreur confirmation paiement: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la confirmation du paiement'
    });
  }
};

// @desc    Rembourser un paiement
// @route   POST /api/payments/refund
// @access  Private (admin ou helper)
export const refundPayment = async (req, res) => {
  try {
    const { paymentId, amount } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Paiement non trouvé'
      });
    }

    // Vérifier les permissions (admin seulement pour l'instant)
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Seuls les administrateurs peuvent effectuer des remboursements'
      });
    }

    const refund = await createRefund(
      payment.stripeDetails.paymentIntentId,
      amount
    );

    payment.status = 'refunded';
    payment.refund = {
      isRefunded: true,
      amount: amount || payment.amount,
      reason: req.body.reason,
      refundedAt: new Date(),
      refundId: refund.id
    };
    await payment.save();

    res.json({
      success: true,
      message: 'Remboursement effectué',
      data: refund
    });

  } catch (error) {
    logger.error(`Erreur remboursement: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du remboursement'
    });
  }
};

// @desc    Obtenir l'historique des paiements d'un utilisateur
// @route   GET /api/payments/history
// @access  Private
export const getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .populate('intervention')
      .populate('helper')
      .sort('-createdAt');

    res.json({
      success: true,
      count: payments.length,
      data: payments
    });

  } catch (error) {
    logger.error(`Erreur historique paiements: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'historique'
    });
  }
};

// @desc    Obtenir les paiements d'un helper
// @route   GET /api/payments/helper
// @access  Private (helper)
export const getHelperPayments = async (req, res) => {
  try {
    const helper = await Helper.findOne({ user: req.user._id });
    if (!helper) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas un helper'
      });
    }

    const payments = await Payment.find({ helper: helper._id })
      .populate('user')
      .populate('intervention')
      .sort('-createdAt');

    // Calculer les totaux
    const totalEarned = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);

    const platformFees = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (p.fees?.platformFee || 0), 0);

    res.json({
      success: true,
      stats: {
        totalEarned,
        platformFees,
        netEarned: totalEarned - platformFees,
        transactionCount: payments.filter(p => p.status === 'completed').length
      },
      data: payments
    });

  } catch (error) {
    logger.error(`Erreur paiements helper: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des paiements'
    });
  }
};

// @desc    Obtenir les statistiques de paiement (admin)
// @route   GET /api/payments/stats
// @access  Private (admin)
export const getPaymentStats = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs'
      });
    }

    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);

    const [
      totalPayments,
      monthlyPayments,
      yearlyPayments,
      recentPayments
    ] = await Promise.all([
      // Total général
      Payment.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      
      // Mois en cours
      Payment.aggregate([
        { 
          $match: { 
            status: 'completed',
            createdAt: { $gte: firstDayOfMonth }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      
      // Année en cours
      Payment.aggregate([
        { 
          $match: { 
            status: 'completed',
            createdAt: { $gte: firstDayOfYear }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      
      // Derniers paiements
      Payment.find({ status: 'completed' })
        .populate('user', 'firstName lastName email')
        .populate('intervention')
        .sort('-createdAt')
        .limit(10)
    ]);

    res.json({
      success: true,
      data: {
        total: totalPayments[0] || { total: 0, count: 0 },
        monthly: monthlyPayments[0] || { total: 0, count: 0 },
        yearly: yearlyPayments[0] || { total: 0, count: 0 },
        recent: recentPayments
      }
    });

  } catch (error) {
    logger.error(`Erreur stats paiements: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
};

// @desc    Webhook Stripe
// @route   POST /api/payments/webhook
// @access  Public
export const stripeWebhook = async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    const event = await handleWebhook(req.body, signature);

    res.json({ received: true });

  } catch (error) {
    logger.error(`Erreur webhook: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Payer un helper (transfert)
// @route   POST /api/payments/pay-helper
// @access  Private (admin)
export const payHelper = async (req, res) => {
  try {
    const { helperId, amount, interventionId } = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs'
      });
    }

    const helper = await Helper.findById(helperId).populate('user');
    if (!helper || !helper.stripeAccountId) {
      return res.status(400).json({
        success: false,
        message: 'Helper n\'a pas de compte Stripe connecté'
      });
    }

    // Effectuer le transfert
    const transfer = await createTransfer(
      amount,
      helper.stripeAccountId,
      { interventionId, helperId }
    );

    // Enregistrer le paiement
    const payment = await Payment.create({
      user: helper.user._id,
      intervention: interventionId,
      helper: helperId,
      amount,
      currency: 'cad',
      status: 'completed',
      paymentMethod: 'transfer',
      stripeDetails: {
        chargeId: transfer.id
      }
    });

    res.json({
      success: true,
      message: 'Paiement effectué',
      data: { transfer, payment }
    });

  } catch (error) {
    logger.error(`Erreur paiement helper: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du paiement du helper'
    });
  }
};

// backend/src/controllers/paymentController.js
// Ajoute ces fonctions après les existantes

// @desc    Créer une session de checkout Stripe (pour WebView)
// @route   POST /api/payments/create-checkout-session
// @access  Private
export const createCheckoutSession = async (req, res) => {
  try {
    const { amount, currency = 'cad', customer_email } = req.body;
    
    console.log(`💳 Création session Stripe - Montant: ${amount} ${currency} - Email: ${customer_email}`);
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Montant invalide'
      });
    }
    
    // Créer la session de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: 'Assistance routière Kadima Road',
              description: 'Autorisation de paiement pour intervention SOS',
              images: ['https://kadimaroad.com/logo.png']
            },
            unit_amount: Math.round(amount * 100), // Stripe utilise les cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      payment_intent_data: {
        capture_method: 'manual', // Autorisation seulement, pas de débit immédiat
      },
      success_url: 'kadima://payment/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'kadima://payment/cancel',
      customer_email: customer_email,
      metadata: {
        type: 'sos_authorization',
        userId: req.user._id.toString()
      }
    });
    
    console.log(`✅ Session créée: ${session.id}`);
    
    res.json({
      success: true,
      data: {
        sessionUrl: session.url,
        sessionId: session.id,
        paymentIntentId: session.payment_intent
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur création session Stripe:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la création de la session de paiement'
    });
  }
};

// @desc    Créer une intention de paiement avec carte enregistrée
// @route   POST /api/payments/setup-intent
// @access  Private
export const createSetupIntent = async (req, res) => {
  try {
    const { paymentMethodId } = req.body;
    
    // 1. Créer ou récupérer le client Stripe
    let stripeCustomerId = req.user.stripeCustomerId;
    
    if (!stripeCustomerId) {
      // Créer un nouveau client Stripe
      const customer = await stripe.customers.create({
        email: req.user.email,
        name: `${req.user.firstName} ${req.user.lastName}`,
        metadata: {
          userId: req.user._id.toString()
        }
      });
      stripeCustomerId = customer.id;
      
      // Sauvegarder l'ID client dans la base
      await User.findByIdAndUpdate(req.user._id, { stripeCustomerId });
    }
    
    // 2. Si un paymentMethodId est fourni, l'attacher au client
    if (paymentMethodId) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomerId,
      });
    }
    
    // 3. Créer un SetupIntent pour enregistrer la carte
    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      usage: 'off_session', // Pour les paiements futurs
    });
    
    res.json({
      success: true,
      data: {
        clientSecret: setupIntent.client_secret,
        customerId: stripeCustomerId
      }
    });
    
  } catch (error) {
    console.error('Erreur création SetupIntent:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Récupérer les cartes enregistrées de l'utilisateur
// @route   GET /api/payments/saved-cards
// @access  Private
export const getSavedCards = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user.stripeCustomerId) {
      return res.json({ success: true, data: [] });
    }
    
    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: 'card',
    });
    
    const cards = paymentMethods.data.map(method => ({
      id: method.id,
      brand: method.card.brand,
      last4: method.card.last4,
      expMonth: method.card.exp_month,
      expYear: method.card.exp_year,
      isDefault: method.id === user.defaultPaymentMethodId
    }));
    
    res.json({ success: true, data: cards });
    
  } catch (error) {
    console.error('Erreur récupération cartes:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Créer une autorisation de paiement (capture manuelle)
// @route   POST /api/payments/authorize
// @access  Private
export const authorizePayment = async (req, res) => {
  try {
    const { amount, paymentMethodId, saveCard = false } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (!user.stripeCustomerId) {
      return res.status(400).json({
        success: false,
        message: 'Aucune carte enregistrée'
      });
    }
    
    // Créer l'intention de paiement avec capture manuelle
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'cad',
      customer: user.stripeCustomerId,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
      capture_method: 'manual', // ← PAS DE DÉBIT IMMÉDIAT
      metadata: {
        userId: req.user._id.toString(),
        type: 'sos_authorization'
      }
    });
    
    // Sauvegarder dans la base
    const payment = await Payment.create({
      user: req.user._id,
      amount,
      currency: 'cad',
      status: 'authorized',
      stripeDetails: {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret
      }
    });
    
    // Si l'utilisateur veut sauvegarder cette carte comme par défaut
    if (saveCard) {
      await User.findByIdAndUpdate(req.user._id, {
        defaultPaymentMethodId: paymentMethodId
      });
    }
    
    res.json({
      success: true,
      data: {
        paymentIntentId: paymentIntent.id,
        paymentId: payment._id,
        status: paymentIntent.status
      }
    });
    
  } catch (error) {
    console.error('Erreur autorisation:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Capturer le paiement après intervention
// @route   POST /api/payments/capture
// @access  Private
export const capturePayment = async (req, res) => {
  try {
    const { paymentIntentId, finalAmount } = req.body;
    
    // Capturer le montant réel
    const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId, {
      amount_to_capture: Math.round(finalAmount * 100)
    });
    
    // Mettre à jour dans la base
    const payment = await Payment.findOne({
      'stripeDetails.paymentIntentId': paymentIntentId
    });
    
    if (payment) {
      payment.status = 'captured';
      payment.finalAmount = finalAmount;
      payment.platformFee = finalAmount * 0.10;
      payment.helperEarnings = finalAmount * 0.90;
      payment.capturedAt = new Date();
      await payment.save();
    }
    
    res.json({
      success: true,
      data: { status: paymentIntent.status }
    });
    
  } catch (error) {
    console.error('Erreur capture:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Annuler l'autorisation
// @route   POST /api/payments/cancel
// @access  Private
export const cancelAuthorization = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    
    const canceledIntent = await stripe.paymentIntents.cancel(paymentIntentId);
    
    await Payment.findOneAndUpdate(
      { 'stripeDetails.paymentIntentId': paymentIntentId },
      { status: 'cancelled' }
    );
    
    res.json({
      success: true,
      data: { status: canceledIntent.status }
    });
    
  } catch (error) {
    console.error('Erreur annulation:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// backend/src/controllers/paymentController.js

// @desc    Créer une session pour ajouter une carte
// @route   POST /api/payments/setup-session
// @access  Private
export const createSetupSession = async (req, res) => {
  try {
    const { customer_email } = req.body;
    
    // Créer ou récupérer le client Stripe
    let stripeCustomerId = req.user.stripeCustomerId;
    
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: customer_email || req.user.email,
        name: `${req.user.firstName} ${req.user.lastName}`,
        metadata: {
          userId: req.user._id.toString()
        }
      });
      stripeCustomerId = customer.id;
      
      await User.findByIdAndUpdate(req.user._id, { stripeCustomerId });
    }
    
    // Créer une session de checkout pour ajouter une carte
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'setup',
      customer: stripeCustomerId,
      success_url: 'kadima://card/success',
      cancel_url: 'kadima://card/cancel',
      setup_intent_data: {
        metadata: {
          userId: req.user._id.toString()
        }
      }
    });
    
    res.json({
      success: true,
      data: {
        sessionUrl: session.url,
        sessionId: session.id
      }
    });
    
  } catch (error) {
    console.error('Erreur création setup session:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};