import express from 'express';
import { 
  registerHelper,
  loginHelper,
  getHelperProfile,
  updateHelperProfile
} from '../controllers/authHelperController.js';
import { registerValidation, loginValidation } from '../validations/authValidation.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Routes publiques (pour Kadima Helpers)
router.post('/register', registerValidation, validate, registerHelper);
router.post('/login', loginValidation, validate, loginHelper);

// Routes protégées (profil helper)
router.get('/profile', protect, getHelperProfile);
router.put('/profile', protect, updateHelperProfile);

export default router;