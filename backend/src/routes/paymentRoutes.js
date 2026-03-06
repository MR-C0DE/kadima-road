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
  payHelper
} from '../controllers/paymentController.js';

const router = express.Router();

// Webhook public (pas de auth)
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// Routes protégées
router.use(protect);

router.post('/create-intent', createPaymentIntentHandler);
router.post('/confirm', confirmPaymentHandler);
router.get('/history', getPaymentHistory);
router.get('/helper', getHelperPayments);

// Routes admin
router.post('/refund', refundPayment);
router.get('/stats', getPaymentStats);
router.post('/pay-helper', payHelper);

export default router;