// backend/src/routes/paymentRoutes.js
import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import {
  createPaymentIntentHandler,
  confirmPaymentHandler,
  refundPayment,
  getPaymentHistory,
  getHelperPayments,
  getPaymentStats,
  stripeWebhook,
  payHelper,
  createCheckoutSession,
  cancelAuthorization,
  getSavedCards,
  authorizePayment,
  capturePayment,
  createSetupSession      // ⚡ AJOUTER CET IMPORT
} from '../controllers/paymentController.js';

const router = express.Router();

// Webhook public (pas de auth)
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// Routes protégées
router.use(protect);

// ⚡ NOUVELLES ROUTES POUR LE SYSTÈME DE PAIEMENT
router.get('/saved-cards', getSavedCards);
router.post('/authorize', authorizePayment);
router.post('/capture', capturePayment);
router.post('/cancel', cancelAuthorization);
router.post('/create-checkout-session', createCheckoutSession);
router.post('/setup-session', createSetupSession);  // ⚡ AJOUTER CETTE LIGNE

// Routes existantes
router.post('/create-intent', createPaymentIntentHandler);
router.post('/confirm', confirmPaymentHandler);
router.get('/history', getPaymentHistory);
router.get('/helper', getHelperPayments);

// Routes admin
router.post('/refund', refundPayment);
router.get('/stats', getPaymentStats);
router.post('/pay-helper', payHelper);

export default router;