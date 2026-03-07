import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import {
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
  getHelperReviews
} from '../controllers/helperController.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// Routes pour tous les utilisateurs
router.get('/nearby', getNearbyHelpers);
router.get('/stats/:id', getHelperStats);
router.get('/reviews/:id', getHelperReviews);
router.get('/:id', getHelperById);

// Routes pour les helpers uniquement
router.post('/register', registerAsHelper);
router.get('/profile/me', getHelperProfile);
router.put('/profile/me', updateHelperProfile);
router.put('/availability', updateAvailability);
router.post('/services', addService);
router.delete('/services/:serviceId', removeService);
router.post('/documents', uploadDocument);

// Routes admin seulement
router.get('/', getAllHelpers);
router.put('/verify/:id', verifyHelper);

export default router;