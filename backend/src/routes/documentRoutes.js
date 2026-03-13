// routes/documentRoutes.js
import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { uploadDocument as uploadMiddleware } from '../middlewares/documentUploadMiddleware.js';
import {
  uploadDocument,
  deleteDocument,
  getDocuments,
  verifyDocument
} from '../controllers/documentController.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// Obtenir tous les documents
router.get('/', getDocuments);

// Upload/remplacer un document
router.post('/:type', uploadMiddleware, uploadDocument);

// Supprimer un document
router.delete('/:type', deleteDocument);

// Vérifier un document (admin only)
router.put('/:type/verify', verifyDocument);

export default router;