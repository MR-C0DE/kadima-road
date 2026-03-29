import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import {
  startDiagnostic,
  getDiagnosticResult,
  quickDiagnostic,
  getTutorials
} from '../controllers/diagnosticController.js';
// ⚡ NOUVEAU : middleware pour charger le contexte véhicule
import { loadVehicleContext } from '../middlewares/vehicleContextMiddleware.js';

const router = express.Router();

router.use(protect);

// ⚡ AJOUT du middleware loadVehicleContext pour charger l'historique du véhicule
router.post('/start', loadVehicleContext, startDiagnostic);
router.post('/result', loadVehicleContext, getDiagnosticResult);
router.post('/quick', loadVehicleContext, quickDiagnostic);
router.get('/tutorials/:type', getTutorials);

export default router;