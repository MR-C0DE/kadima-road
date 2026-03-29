import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import {
  createVehicle,
  getUserVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  transferVehicle,
  updateMileage,
  addVehicleNote,
  getVehicleLogs,
  analyzeVehicle,
  getVehicleStats
} from '../controllers/vehicleController.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// ============================================
// ROUTES PRINCIPALES
// ============================================

// Statistiques des véhicules
router.get('/stats', getVehicleStats);

// CRUD de base
router.route('/')
  .get(getUserVehicles)
  .post(createVehicle);

router.route('/:id')
  .get(getVehicleById)
  .put(updateVehicle)
  .delete(deleteVehicle);

// ============================================
// ROUTES SPÉCIFIQUES
// ============================================

// Transfert de propriété
router.post('/:id/transfer', transferVehicle);

// Kilométrage
router.put('/:id/mileage', updateMileage);

// Notes
router.post('/:id/notes', addVehicleNote);

// Journal
router.get('/:id/logs', getVehicleLogs);

// Analyse IA
router.post('/:id/analyze', analyzeVehicle);

export default router;