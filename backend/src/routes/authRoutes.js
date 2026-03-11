import express from 'express';
import { 
  registerUser,
  registerHelper,
  login, 
  getMe, 
  updateProfile, 
  changePassword 
} from '../controllers/authController.js';
import { registerValidation, loginValidation } from '../validations/authValidation.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Routes publiques
router.post('/register/user', registerValidation, validate, registerUser);   // ← Pour Kadima Road
router.post('/register/helper', registerValidation, validate, registerHelper); // ← Pour Kadima Helpers
router.post('/login', loginValidation, validate, login);

// Routes protégées (nécessitent authentification)
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/change-password', protect, changePassword);

export default router;