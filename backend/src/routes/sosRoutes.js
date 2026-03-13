import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import {
  createSOSAlert,
  getNearbySOS,
  acceptSOS,
  updateStatus,
  callEmergency,
  getSOSById,
  cancelSOS
} from '../controllers/sosController.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// Créer une alerte SOS
router.post('/', createSOSAlert);

// Chercher les SOS autour (pour helpers)
router.get('/nearby', getNearbySOS);

// Accepter une alerte (helper)
router.post('/:id/accept', acceptSOS);

// Mettre à jour le statut d'une intervention
router.put('/:id/status', updateStatus);

// Contacter les secours
router.post('/:id/emergency', callEmergency);

// src/routes/sosRoutes.js - AJOUTER
router.get('/:id', protect, getSOSById);
router.put('/:id/cancel', protect, cancelSOS);

export default router;