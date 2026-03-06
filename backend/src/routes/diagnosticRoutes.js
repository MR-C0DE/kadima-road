import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import {
  startDiagnostic,
  getDiagnosticResult,
  quickDiagnostic,
  getTutorials
} from '../controllers/diagnosticController.js';

const router = express.Router();

router.use(protect);

router.post('/start', startDiagnostic);
router.post('/result', getDiagnosticResult);
router.post('/quick', quickDiagnostic);
router.get('/tutorials/:type', getTutorials);

export default router;