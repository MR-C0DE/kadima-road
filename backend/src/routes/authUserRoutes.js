import express from 'express';
import { 
  registerUser,
  loginUser
} from '../controllers/authUserController.js';
import { registerValidation, loginValidation } from '../validations/authValidation.js';
import { validate } from '../middlewares/validationMiddleware.js';

const router = express.Router();

// Routes pour utilisateurs (Kadima Road)
router.post('/register', registerValidation, validate, registerUser);
router.post('/login', loginValidation, validate, loginUser);

export default router;