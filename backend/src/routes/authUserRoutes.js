// backend/src/routes/authUserRoutes.js
import express from 'express';
import { 
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  changePassword 
} from '../controllers/authUserController.js';
import { registerValidation, loginValidation } from '../validations/authValidation.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Routes publiques
router.post('/register', registerValidation, validate, registerUser);
router.post('/login', loginValidation, validate, loginUser);

// Routes protégées
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/change-password', protect, changePassword);

export default router;