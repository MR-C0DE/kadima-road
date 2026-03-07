import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  addVehicle,
  updateVehicle,
  deleteVehicle,
  addEmergencyContact,
  deleteEmergencyContact,
  getUserStats,
  sendPhoneVerification,
  confirmPhoneVerification
} from '../controllers/userController.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// Routes de base
router.get('/stats/me', getUserStats);
router.post('/verify-phone', sendPhoneVerification);
router.post('/confirm-phone', confirmPhoneVerification);

// Routes pour les véhicules
router.post('/vehicles', addVehicle);
router.put('/vehicles/:vehicleId', updateVehicle);
router.delete('/vehicles/:vehicleId', deleteVehicle);

// Routes pour les contacts d'urgence
router.post('/emergency-contacts', addEmergencyContact);
router.delete('/emergency-contacts/:contactId', deleteEmergencyContact);

// Routes admin seulement
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;