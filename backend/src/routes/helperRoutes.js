// backend/src/routes/helperRoutes.js
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
  getAvailableSOS,
  acceptSOSMission,
  // Routes pour les missions
  getCurrentMissions,
  getMissionHistory,
  updateMissionStatus,
  getMissionById,
  // ⚡ NOUVEAU : Mise à jour de la position
  updateHelperLocation,
  
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
// ROUTES SPÉCIFIQUES (SANS PARAMÈTRES DYNAMIQUES)
// DOIVENT ÊTRE AVANT LES ROUTES AVEC /:id
// ============================================

// ✅ Profil du helper connecté
router.get('/profile/me', getHelperProfile);
router.put('/profile/me', updateHelperProfile);

// ✅ Recherche de helpers à proximité
router.get('/nearby', getNearbyHelpers);

// ✅ SOS disponibles (NOUVEAU - À METTRE AVANT /:id)
router.get('/available-sos', getAvailableSOS);

// ✅ Accepter un SOS
router.post('/accept-sos/:sosId', acceptSOSMission);

// ✅ Missions
router.get('/missions/current', getCurrentMissions);
router.get('/missions/history', getMissionHistory);
router.put('/missions/:id/status', updateMissionStatus);
router.get('/missions/:id', getMissionById);

// ⚡ NOUVEAU : Mise à jour de la position du helper pour une mission
router.put('/missions/:id/location', updateHelperLocation);

// ✅ Gains
router.get('/earnings/stats', getEarningsStats);
router.get('/earnings/transactions', getEarningsTransactions);

// ✅ Disponibilité
router.put('/availability', updateAvailability);

// ✅ Services
router.post('/services', addService);
router.delete('/services/:serviceId', removeService);

// ✅ Documents
router.post('/documents', uploadDocument);

// ✅ Photo de profil
router.post('/profile/photo', uploadSingle, uploadProfilePhoto);
router.delete('/profile/photo', deleteProfilePhoto);

// ✅ Inscription comme helper
router.post('/register', registerAsHelper);

// ============================================
// ROUTES AVEC PARAMÈTRES (IDs)
// DOIVENT ÊTRE APRÈS LES ROUTES SPÉCIFIQUES
// ============================================

// ✅ Statistiques d'un helper
router.get('/stats/:id', getHelperStats);

// ✅ Avis d'un helper
router.get('/reviews/:id', getHelperReviews);

// ⚠️ Détail d'un helper par ID - DOIT ÊTRE EN DERNIER
router.get('/:id', getHelperById);

// ============================================
// ROUTES ADMIN SEULEMENT (À GARDER À LA FIN)
// ============================================

// ✅ Liste de tous les helpers (admin only)
router.get('/', getAllHelpers);

// ✅ Vérification d'un helper (admin only)
router.put('/verify/:id', verifyHelper);

// ✅ Upload document avec middleware spécifique
router.post('/documents', uploadDocumentMiddleware, uploadDocument);

export default router;