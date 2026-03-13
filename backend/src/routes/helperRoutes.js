import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import {
  // Routes de base
  registerAsHelper,
  getHelperProfile,
  updateHelperProfile,
  getHelperById,
  getAllHelpers,
  updateAvailability,
  addService,
  removeService,
  getNearbyHelpers,
  getHelperStats,
  verifyHelper,
  uploadDocument,
  getHelperReviews,
  
  // Routes pour les missions
  getCurrentMissions,
  getMissionHistory,
  updateMissionStatus,
  
  // Routes pour les gains
  getEarningsStats,
  getEarningsTransactions
} from '../controllers/helperController.js';

import { uploadProfilePhoto, deleteProfilePhoto } from '../controllers/helperController.js';
import { uploadSingle } from '../middlewares/uploadMiddleware.js';
import { uploadDocument as uploadDocumentMiddleware } from '../middlewares/documentUploadMiddleware.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// ============================================
// ROUTES PUBLIQUES (pour tous les utilisateurs)
// ============================================

// Recherche de helpers à proximité
router.get('/nearby', getNearbyHelpers);

// Statistiques d'un helper
router.get('/stats/:id', getHelperStats);

// Avis d'un helper
router.get('/reviews/:id', getHelperReviews);

// Détail d'un helper par ID
router.get('/:id', getHelperById);

// ============================================
// ROUTES POUR LES HELPERS (profil et gestion)
// ============================================

// Inscription comme helper
router.post('/register', registerAsHelper);

// Profil du helper connecté
router.get('/profile/me', getHelperProfile);
router.put('/profile/me', updateHelperProfile);

// Gestion de la disponibilité
router.put('/availability', updateAvailability);

// Gestion des services
router.post('/services', addService);
router.delete('/services/:serviceId', removeService);

// Gestion des documents
router.post('/documents', uploadDocument);

// ============================================
// ROUTES POUR LES MISSIONS
// ============================================

// Missions en cours
router.get('/missions/current', getCurrentMissions);

// Historique des missions
router.get('/missions/history', getMissionHistory);

// Mise à jour du statut d'une mission
router.put('/missions/:id/status', updateMissionStatus);

// ============================================
// ROUTES POUR LES GAINS
// ============================================

// Statistiques de gains
router.get('/earnings/stats', getEarningsStats);

// Transactions avec filtre période
router.get('/earnings/transactions', getEarningsTransactions);

// ============================================
// ROUTES ADMIN SEULEMENT
// ============================================

// Liste de tous les helpers (admin only)
router.get('/', getAllHelpers);

// Vérification d'un helper (admin only)
router.put('/verify/:id', verifyHelper);

// Upload photo de profil
router.post('/profile/photo', uploadSingle, uploadProfilePhoto);

// Supprimer photo de profil
router.delete('/profile/photo', deleteProfilePhoto);

router.post('/documents', uploadDocumentMiddleware, uploadDocument);

export default router;