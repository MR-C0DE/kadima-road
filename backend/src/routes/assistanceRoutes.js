// backend/src/routes/assistanceRoutes.js
import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import {
  createAssistanceRequest,
  getActiveRequests,
  getRequestById,
  updateRequestStatus,
  cancelRequest,
  addMessage
} from '../controllers/assistanceRequestController.js';

const router = express.Router();

// ============================================
// TOUTES LES ROUTES NÉCESSITENT UNE AUTHENTIFICATION
// ============================================
router.use(protect);

// ============================================
// ROUTES POUR LES DEMANDES D'ASSISTANCE
// ============================================

// Créer une nouvelle demande
router.post('/request', createAssistanceRequest);

// Récupérer les demandes actives de l'utilisateur
router.get('/active', getActiveRequests);

// Détail d'une demande
router.get('/:id', getRequestById);

// Mettre à jour le statut d'une demande (prestataire ou système)
router.put('/:id/status', updateRequestStatus);

// Annuler une demande (utilisateur uniquement)
router.put('/:id/cancel', cancelRequest);

// Ajouter un message dans le chat
router.post('/:id/messages', addMessage);

export default router;