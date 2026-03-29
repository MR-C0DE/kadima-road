// backend/src/routes/garageRoutes.js
import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import {
  getNearbyGarages,
  searchGarages,
  getGarageById,
  createGarage,
  updateGarage,
  deleteGarage,
  addGarageReview
} from '../controllers/garageController.js';

const router = express.Router();

// ============================================
// TOUTES LES ROUTES NÉCESSITENT UNE AUTHENTIFICATION
// ============================================
router.use(protect);

// ============================================
// ROUTES PUBLIQUES (pour les utilisateurs)
// ============================================

// Recherche de garages à proximité (fusion partenaires + Google)
router.get('/nearby', getNearbyGarages);

// Recherche de garages par nom ou service
router.get('/search', searchGarages);

// Détail d'un garage
router.get('/:id', getGarageById);

// Ajouter un avis sur un garage
router.post('/:id/review', addGarageReview);

// ============================================
// ROUTES ADMIN (gestion des garages partenaires)
// ============================================

// Créer un garage (admin)
router.post('/', createGarage);

// Mettre à jour un garage (admin)
router.put('/:id', updateGarage);

// Supprimer un garage (admin)
router.delete('/:id', deleteGarage);

export default router;