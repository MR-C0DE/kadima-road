// backend/src/routes/towingRoutes.js
import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import {
  getNearbyTowing,
  getTowingById,
  createTowing,
  updateTowing,
  deleteTowing,
  addTowingReview
} from '../controllers/towingController.js';

const router = express.Router();

// ============================================
// TOUTES LES ROUTES NÉCESSITENT UNE AUTHENTIFICATION
// ============================================
router.use(protect);

// ============================================
// ROUTES PUBLIQUES (pour les utilisateurs)
// ============================================

// Recherche de services de remorquage à proximité
router.get('/nearby', getNearbyTowing);

// Détail d'un service de remorquage
router.get('/:id', getTowingById);

// Ajouter un avis sur un service de remorquage
router.post('/:id/review', addTowingReview);

// ============================================
// ROUTES ADMIN (gestion des services partenaires)
// ============================================

// Créer un service de remorquage (admin)
router.post('/', createTowing);

// Mettre à jour un service de remorquage (admin)
router.put('/:id', updateTowing);

// Supprimer un service de remorquage (admin)
router.delete('/:id', deleteTowing);

export default router;