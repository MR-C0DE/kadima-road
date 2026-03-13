// controllers/documentController.js
import Helper from '../models/Helper.js';
import logger from '../config/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Uploader ou remplacer un document
// @route   POST /api/documents/:type
// @access  Private
export const uploadDocument = async (req, res) => {
    try {
      const { type } = req.params; // license, insurance, certification
      
      if (!['license', 'insurance', 'certification'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Type de document invalide'
        });
      }
  
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Aucun fichier fourni'
        });
      }
  
      const helper = await Helper.findOne({ user: req.user._id });
  
      if (!helper) {
        // Nettoyer le fichier uploadé
        fs.unlinkSync(req.file.path);
        return res.status(404).json({
          success: false,
          message: 'Helper non trouvé'
        });
      }
  
      // Construire l'URL
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const fileUrl = `${baseUrl}/uploads/documents/${req.file.filename}`;
  
      // Vérifier si le document existe déjà
      const existingDocIndex = helper.documents.findIndex(doc => doc.type === type);
  
      const docData = {
        type, // ← IMPORTANT : on ajoute le type ici !
        url: fileUrl,
        verified: false,
        status: 'pending',
        uploadedAt: new Date(),
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      };
  
      if (existingDocIndex !== -1) {
        // Supprimer l'ancien fichier
        const oldDoc = helper.documents[existingDocIndex];
        if (oldDoc.url) {
          const oldFilePath = path.join(__dirname, '../../', oldDoc.url.replace(baseUrl, ''));
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
        
        // Remplacer
        helper.documents[existingDocIndex] = docData;
      } else {
        // Ajouter
        helper.documents.push(docData);
      }
  
      await helper.save();
  
      res.json({
        success: true,
        message: 'Document uploadé avec succès',
        data: docData
      });
  
    } catch (error) {
      logger.error(`Erreur uploadDocument: ${error.message}`);
      if (req.file) fs.unlinkSync(req.file.path);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'upload'
      });
    }
  };

// @desc    Supprimer un document (seulement si non vérifié)
// @route   DELETE /api/helpers/documents/:type
// @access  Private
export const deleteDocument = async (req, res) => {
  try {
    const { type } = req.params;

    const helper = await Helper.findOne({ user: req.user._id });

    if (!helper) {
      return res.status(404).json({
        success: false,
        message: 'Helper non trouvé'
      });
    }

    const docIndex = helper.documents.findIndex(doc => doc.type === type);

    if (docIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé'
      });
    }

    const doc = helper.documents[docIndex];

    // Empêcher la suppression si vérifié
    if (doc.verified) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer un document vérifié'
      });
    }

    // Supprimer le fichier physique
    if (doc.url) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const filePath = path.join(__dirname, '../../', doc.url.replace(baseUrl, ''));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Supprimer l'entrée
    helper.documents.splice(docIndex, 1);
    await helper.save();

    res.json({
      success: true,
      message: 'Document supprimé'
    });

  } catch (error) {
    logger.error(`Erreur deleteDocument: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression'
    });
  }
};

// @desc    Obtenir tous les documents
// @route   GET /api/documents
// @access  Private
export const getDocuments = async (req, res) => {
    try {
      const helper = await Helper.findOne({ user: req.user._id });
  
      if (!helper) {
        return res.status(404).json({
          success: false,
          message: 'Helper non trouvé'
        });
      }
  
      // Organiser les documents par type
      const documents = {
        license: helper.documents.find(d => d.type === 'license') || { type: 'license', status: 'missing' },
        insurance: helper.documents.find(d => d.type === 'insurance') || { type: 'insurance', status: 'missing' },
        certification: helper.documents.find(d => d.type === 'certification') || { type: 'certification', status: 'missing' }
      };
  
      res.json({
        success: true,
        data: documents
      });
  
    } catch (error) {
      logger.error(`Erreur getDocuments: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des documents'
      });
    }
  };

// @desc    Vérifier un document (admin only)
// @route   PUT /api/helpers/documents/:type/verify
// @access  Private/Admin
export const verifyDocument = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs'
      });
    }

    const { type } = req.params;
    const { helperId, verified, rejectionReason } = req.body;

    const helper = await Helper.findById(helperId);

    if (!helper) {
      return res.status(404).json({
        success: false,
        message: 'Helper non trouvé'
      });
    }

    const doc = helper.documents.find(d => d.type === type);

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé'
      });
    }

    doc.verified = verified;
    doc.status = verified ? 'verified' : 'rejected';
    doc.reviewedAt = new Date();
    doc.reviewedBy = req.user._id;
    
    if (rejectionReason) {
      doc.rejectionReason = rejectionReason;
    }

    await helper.save();

    res.json({
      success: true,
      message: verified ? 'Document vérifié' : 'Document rejeté',
      data: doc
    });

  } catch (error) {
    logger.error(`Erreur verifyDocument: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification'
    });
  }
};