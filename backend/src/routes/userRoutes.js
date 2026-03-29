import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  addEmergencyContact,
  deleteEmergencyContact,
  getUserStats,
  sendPhoneVerification,
  confirmPhoneVerification,
  getSettings,
  updateSettings,
  getEmergencyContacts,
  updateEmergencyContact,
  uploadProfilePhoto,
  deleteProfilePhoto,
  changePassword,
  searchUserByEmail,
  // ⚡ NOUVELLES FONCTIONS
  exportUserData,
  clearHistory,
  setDefaultVehicle,
  getDefaultVehicle,
  getWeather
} from '../controllers/userController.js';
import { uploadSingle } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// ============================================
// ROUTES STATS ET VÉRIFICATION
// ============================================
router.get('/stats/me', getUserStats);
router.post('/verify-phone', sendPhoneVerification);
router.post('/confirm-phone', confirmPhoneVerification);

// ============================================
// PHOTO DE PROFIL
// ============================================
router.post('/profile/photo', uploadSingle, uploadProfilePhoto);
router.delete('/profile/photo', deleteProfilePhoto);

// ============================================
// MOT DE PASSE
// ============================================
router.post('/change-password', changePassword);

// ============================================
// PARAMÈTRES
// ============================================
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

// ============================================
// CONTACTS D'URGENCE
// ============================================
router.get('/emergency-contacts', getEmergencyContacts);
router.post('/emergency-contacts', addEmergencyContact);
router.put('/emergency-contacts/:contactId', updateEmergencyContact);
router.delete('/emergency-contacts/:contactId', deleteEmergencyContact);

// ============================================
// VÉHICULE PAR DÉFAUT
// ============================================
router.get('/default-vehicle', protect, getDefaultVehicle);
router.put('/default-vehicle', protect, setDefaultVehicle);

// ============================================
// GESTION DES DONNÉES
// ============================================
router.get('/export-data', protect, exportUserData);
router.delete('/history', protect, clearHistory);

// ============================================
// ⚡ ROUTE DE RECHERCHE PAR EMAIL - DOIT ÊTRE AVANT /:id
// ============================================
router.get('/search', protect, searchUserByEmail);

// ============================================
// ⚡ MÉTÉO
// ============================================
router.get('/weather', protect, getWeather);

// ============================================
// ROUTES ADMIN SEULEMENT (AVEC PARAMÈTRES)
// ============================================
router.get('/', protect, getAllUsers);
router.get('/:id', protect, getUserById);
router.put('/:id', protect, updateUser);
router.delete('/:id', protect, deleteUser);

export default router;