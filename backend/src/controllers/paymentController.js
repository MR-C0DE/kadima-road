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