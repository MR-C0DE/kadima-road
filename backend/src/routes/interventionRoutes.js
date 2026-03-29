// backend/src/routes/interventionRoutes.js
import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import {
  createInterventionValidation,
  updateStatusValidation,
  assignHelperValidation,
  addMessageValidation,
  addReviewValidation,
  cancelInterventionValidation,
  getInterventionByIdValidation,
  getActiveInterventionsValidation,
  getHelperStatsValidation
} from '../validations/interventionValidation.js';
import {
  createIntervention,
  getUserInterventions,
  getInterventionById,
  updateInterventionStatus,
  assignHelper,
  addMessage,
  addReview,
  getActiveInterventions,
  cancelIntervention,
  // ⚡ NOUVEAU : Récupérer la position du helper
  getHelperLocation
} from '../controllers/interventionController.js';

const router = express.Router();

router.use(protect);

// ============================================
// ROUTES PRINCIPALES
// ============================================

// Créer une intervention
router.post('/', createInterventionValidation, validate, createIntervention);

// Récupérer toutes les interventions de l'utilisateur
router.get('/', getUserInterventions);

// Récupérer les interventions actives
router.get('/active', getActiveInterventionsValidation, validate, getActiveInterventions);

// ⚡ NOUVEAU : Récupérer la position du helper
router.get('/:id/helper-location', getHelperLocation);

// Récupérer une intervention par ID
router.get('/:id', getInterventionByIdValidation, validate, getInterventionById);

// ============================================
// ACTIONS SUR INTERVENTION
// ============================================

// Mettre à jour le statut
router.put('/:id/status', updateStatusValidation, validate, updateInterventionStatus);

// Assigner un helper
router.put('/:id/assign', assignHelperValidation, validate, assignHelper);

// Ajouter un message
router.post('/:id/messages', addMessageValidation, validate, addMessage);

// Ajouter une évaluation
router.post('/:id/review', addReviewValidation, validate, addReview);

// Annuler une intervention
router.put('/:id/cancel', cancelInterventionValidation, validate, cancelIntervention);

export default router;