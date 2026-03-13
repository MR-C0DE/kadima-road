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
  confirmPhoneVerification,
  // NOUVEAUX IMPORTS
  getSettings,
  updateSettings,
  getEmergencyContacts,
  updateEmergencyContact,
  uploadProfilePhoto,
  deleteProfilePhoto,
  changePassword
} from '../controllers/userController.js';
import { uploadSingle } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// Routes stats et vérification
router.get('/stats/me', getUserStats);
router.post('/verify-phone', sendPhoneVerification);
router.post('/confirm-phone', confirmPhoneVerification);

// ============================================
// NOUVELLES ROUTES
// ============================================

// Photo de profil
router.post('/profile/photo', uploadSingle, uploadProfilePhoto);
router.delete('/profile/photo', deleteProfilePhoto);

// Mot de passe
router.post('/change-password', changePassword);

// Paramètres
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

// Contacts d'urgence
router.get('/emergency-contacts', getEmergencyContacts);
router.post('/emergency-contacts', addEmergencyContact);
router.put('/emergency-contacts/:contactId', updateEmergencyContact);
router.delete('/emergency-contacts/:contactId', deleteEmergencyContact);

// Routes pour les véhicules
router.post('/vehicles', addVehicle);
router.put('/vehicles/:vehicleId', updateVehicle);
router.delete('/vehicles/:vehicleId', deleteVehicle);

// Routes admin seulement
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;