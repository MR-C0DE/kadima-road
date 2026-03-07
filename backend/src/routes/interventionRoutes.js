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
  cancelIntervention
} from '../controllers/interventionController.js';

const router = express.Router();

router.use(protect);

// Routes principales avec validations
router.post('/', createInterventionValidation, validate, createIntervention);
router.get('/', getUserInterventions);
router.get('/active', getActiveInterventionsValidation, validate, getActiveInterventions);
router.get('/:id', getInterventionByIdValidation, validate, getInterventionById);

// Actions sur intervention
router.put('/:id/status', updateStatusValidation, validate, updateInterventionStatus);
router.put('/:id/assign', assignHelperValidation, validate, assignHelper);
router.post('/:id/messages', addMessageValidation, validate, addMessage);
router.post('/:id/review', addReviewValidation, validate, addReview);
router.put('/:id/cancel', cancelInterventionValidation, validate, cancelIntervention);

export default router;