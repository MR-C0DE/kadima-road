import User from '../models/User.js';
import Helper from '../models/Helper.js';
import Intervention from '../models/Intervention.js';
import { sendVerificationCode } from '../services/smsService.js';
import { sendWelcomeEmail } from '../services/emailService.js';
import logger from '../config/logger.js';
import bcrypt from 'bcrypt';

import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Obtenir tous les utilisateurs (admin only)
// @route   GET /api/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs'
      });
    }

    const users = await User.find({})
      .select('-password')
      .sort('-createdAt');

    res.json({
      success: true,
      count: users.length,
      data: users
    });

  } catch (error) {
    logger.error(`Erreur getAllUsers: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs'
    });
  }
};

// @desc    Obtenir un utilisateur par ID
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('helperProfile');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier les permissions
    const isOwnProfile = user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwnProfile && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à voir ce profil'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    logger.error(`Erreur getUserById: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'utilisateur'
    });
  }
};

// @desc    Mettre à jour un utilisateur
// @route   PUT /api/users/:id
// @access  Private
export const updateUser = async (req, res) => {
  try {
    // Vérifier que l'utilisateur modifie son propre profil ou est admin
    const isOwnProfile = req.params.id === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwnProfile && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à modifier cet utilisateur'
      });
    }

    // Champs autorisés à la modification
    const allowedUpdates = [
      'firstName',
      'lastName',
      'phone',
      'address',
      'emergencyContacts',
      'preferences',
      'vehicles'
    ];

    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Mettre à jour l'utilisateur
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Profil mis à jour',
      data: user
    });

  } catch (error) {
    logger.error(`Erreur updateUser: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil'
    });
  }
};

// @desc    Supprimer un utilisateur (admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Seuls les administrateurs peuvent supprimer des comptes'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Supprimer le profil helper associé s'il existe
    if (user.helperProfile) {
      await Helper.findByIdAndDelete(user.helperProfile);
    }

    // Supprimer l'utilisateur
    await user.deleteOne();

    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });

  } catch (error) {
    logger.error(`Erreur deleteUser: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'utilisateur'
    });
  }
};

// @desc    Ajouter un véhicule
// @route   POST /api/users/vehicles
// @access  Private
export const addVehicle = async (req, res) => {
  try {
    const { make, model, year, licensePlate, color, isDefault } = req.body;

    const user = await User.findById(req.user._id);

    // Ajouter le véhicule
    user.vehicles.push({
      make,
      model,
      year,
      licensePlate,
      color,
      isDefault: isDefault || false
    });

    // Si c'est le premier véhicule ou isDefault true, le définir comme défaut
    if (isDefault || user.vehicles.length === 1) {
      user.vehicles.forEach((v, index) => {
        v.isDefault = (index === user.vehicles.length - 1);
      });
    }

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Véhicule ajouté',
      data: user.vehicles
    });

  } catch (error) {
    logger.error(`Erreur addVehicle: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout du véhicule'
    });
  }
};

// @desc    Mettre à jour un véhicule
// @route   PUT /api/users/vehicles/:vehicleId
// @access  Private
export const updateVehicle = async (req, res) => {
  try {
    const { make, model, year, licensePlate, color, isDefault } = req.body;

    const user = await User.findById(req.user._id);
    const vehicle = user.vehicles.id(req.params.vehicleId);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Véhicule non trouvé'
      });
    }

    // Mettre à jour les champs
    if (make) vehicle.make = make;
    if (model) vehicle.model = model;
    if (year) vehicle.year = year;
    if (licensePlate) vehicle.licensePlate = licensePlate;
    if (color) vehicle.color = color;

    // Gérer le véhicule par défaut
    if (isDefault) {
      user.vehicles.forEach(v => {
        v.isDefault = false;
      });
      vehicle.isDefault = true;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Véhicule mis à jour',
      data: vehicle
    });

  } catch (error) {
    logger.error(`Erreur updateVehicle: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du véhicule'
    });
  }
};

// @desc    Supprimer un véhicule
// @route   DELETE /api/users/vehicles/:vehicleId
// @access  Private
export const deleteVehicle = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    const vehicle = user.vehicles.id(req.params.vehicleId);
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Véhicule non trouvé'
      });
    }

    // Vérifier si c'était le véhicule par défaut
    const wasDefault = vehicle.isDefault;

    // Supprimer le véhicule
    vehicle.deleteOne();

    // Si c'était le véhicule par défaut et qu'il reste des véhicules,
    // définir le premier comme défaut
    if (wasDefault && user.vehicles.length > 0) {
      user.vehicles[0].isDefault = true;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Véhicule supprimé',
      data: user.vehicles
    });

  } catch (error) {
    logger.error(`Erreur deleteVehicle: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du véhicule'
    });
  }
};

// @desc    Ajouter un contact d'urgence
// @route   POST /api/users/emergency-contacts
// @access  Private
export const addEmergencyContact = async (req, res) => {
  try {
    const { name, phone, relationship } = req.body;

    const user = await User.findById(req.user._id);

    user.emergencyContacts.push({
      name,
      phone,
      relationship
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Contact d\'urgence ajouté',
      data: user.emergencyContacts
    });

  } catch (error) {
    logger.error(`Erreur addEmergencyContact: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout du contact d\'urgence'
    });
  }
};



// @desc    Obtenir les statistiques d'un utilisateur
// @route   GET /api/users/stats/me
// @access  Private
export const getUserStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const [
      totalInterventions,
      completedInterventions,
      totalSpent,
      averageRating
    ] = await Promise.all([
      // Nombre total d'interventions
      Intervention.countDocuments({ user: userId }),
      
      // Interventions terminées
      Intervention.countDocuments({ 
        user: userId, 
        status: 'completed' 
      }),
      
      // Total dépensé
      Intervention.aggregate([
        { $match: { user: userId, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$pricing.final' } } }
      ]),
      
      // Note moyenne reçue (si utilisateur est aussi helper)
      Helper.aggregate([
        { $match: { user: userId } },
        { $unwind: '$reviews' },
        { $group: { _id: null, avgRating: { $avg: '$reviews.rating' } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalInterventions,
        completedInterventions,
        totalSpent: totalSpent[0]?.total || 0,
        averageRating: averageRating[0]?.avgRating || 0,
        memberSince: req.user.createdAt
      }
    });

  } catch (error) {
    logger.error(`Erreur getUserStats: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
};

// @desc    Vérifier le téléphone (envoyer code)
// @route   POST /api/users/verify-phone
// @access  Private
export const sendPhoneVerification = async (req, res) => {
  try {
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Sauvegarder le code dans l'utilisateur (à ajouter au modèle User)
    req.user.verificationCode = verificationCode;
    req.user.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await req.user.save();

    // Envoyer le code par SMS
    await sendVerificationCode(req.user.phone, verificationCode);

    res.json({
      success: true,
      message: 'Code de vérification envoyé'
    });

  } catch (error) {
    logger.error(`Erreur sendPhoneVerification: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi du code de vérification'
    });
  }
};

// @desc    Confirmer la vérification du téléphone
// @route   POST /api/users/confirm-phone
// @access  Private
export const confirmPhoneVerification = async (req, res) => {
  try {
    const { code } = req.body;

    if (
      req.user.verificationCode !== code ||
      req.user.verificationCodeExpires < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Code invalide ou expiré'
      });
    }

    req.user.isVerified = true;
    req.user.verificationCode = undefined;
    req.user.verificationCodeExpires = undefined;
    await req.user.save();

    res.json({
      success: true,
      message: 'Téléphone vérifié avec succès'
    });

  } catch (error) {
    logger.error(`Erreur confirmPhoneVerification: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du téléphone'
    });
  }
};

// ============================================
// PHOTO DE PROFIL
// ============================================

// @desc    Uploader une photo de profil
// @route   POST /api/users/profile/photo
// @access  Private
export const uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucune photo fournie'
      });
    }

    const user = await User.findById(req.user._id);
    
    // Optimisation de l'image avec sharp
    const optimizedFilename = `profile-${req.user._id}-${Date.now()}.jpg`;
    const optimizedPath = path.join('uploads/profiles', optimizedFilename);
    
    await sharp(req.file.path)
      .resize(400, 400, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toFile(optimizedPath);

    // Supprimer l'ancienne photo
    if (user.photo) {
      const oldPath = path.join(process.cwd(), 'uploads/profiles', path.basename(user.photo));
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    user.photo = `${baseUrl}/uploads/profiles/${optimizedFilename}`;
    await user.save();

    res.json({
      success: true,
      message: 'Photo mise à jour',
      data: { photo: user.photo }
    });

  } catch (error) {
    logger.error(`Erreur upload photo: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload'
    });
  }
};

// @desc    Supprimer la photo de profil
// @route   DELETE /api/users/profile/photo
// @access  Private
export const deleteProfilePhoto = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user.photo) {
      const oldPath = path.join(process.cwd(), 'uploads/profiles', path.basename(user.photo));
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
      user.photo = undefined;
      await user.save();
    }

    res.json({
      success: true,
      message: 'Photo supprimée'
    });

  } catch (error) {
    logger.error(`Erreur suppression photo: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression'
    });
  }
};

// ============================================
// MOT DE PASSE
// ============================================

// @desc    Changer le mot de passe
// @route   POST /api/users/change-password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);

    // Vérifier l'ancien mot de passe
    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }

    // Mettre à jour
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Mot de passe modifié'
    });

  } catch (error) {
    logger.error(`Erreur changement mot de passe: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de mot de passe'
    });
  }
};

// ============================================
// PARAMÈTRES
// ============================================

// @desc    Obtenir les paramètres
// @route   GET /api/users/settings
// @access  Private
export const getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('preferences');
    
    res.json({
      success: true,
      data: user.preferences || {
        language: 'fr',
        notifications: { email: true, push: true, sms: true },
        privacy: { shareLocation: true, shareData: false }
      }
    });

  } catch (error) {
    logger.error(`Erreur get settings: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des paramètres'
    });
  }
};

// @desc    Mettre à jour les paramètres
// @route   PUT /api/users/settings
// @access  Private
export const updateSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    user.preferences = {
      ...user.preferences,
      ...req.body
    };
    
    await user.save();

    res.json({
      success: true,
      message: 'Paramètres mis à jour',
      data: user.preferences
    });

  } catch (error) {
    logger.error(`Erreur update settings: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des paramètres'
    });
  }
};

// ============================================
// CONTACTS D'URGENCE (AMÉLIORÉ)
// ============================================

// @desc    Obtenir tous les contacts d'urgence
// @route   GET /api/users/emergency-contacts
// @access  Private
export const getEmergencyContacts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('emergencyContacts');
    
    res.json({
      success: true,
      data: user.emergencyContacts || []
    });

  } catch (error) {
    logger.error(`Erreur get contacts: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des contacts'
    });
  }
};



// @desc    Modifier un contact d'urgence
// @route   PUT /api/users/emergency-contacts/:contactId
// @access  Private
export const updateEmergencyContact = async (req, res) => {
  try {
    const { name, phone, relationship } = req.body;
    const { contactId } = req.params;

    const user = await User.findById(req.user._id);
    const contact = user.emergencyContacts.id(contactId);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact non trouvé'
      });
    }

    if (name) contact.name = name;
    if (phone) contact.phone = phone;
    if (relationship) contact.relationship = relationship;

    await user.save();

    res.json({
      success: true,
      message: 'Contact modifié',
      data: contact
    });

  } catch (error) {
    logger.error(`Erreur update contact: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification du contact'
    });
  }
};

// @desc    Supprimer un contact d'urgence
// @route   DELETE /api/users/emergency-contacts/:contactId
// @access  Private
export const deleteEmergencyContact = async (req, res) => {
  try {
    const { contactId } = req.params;

    const user = await User.findById(req.user._id);
    
    const contact = user.emergencyContacts.id(contactId);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact non trouvé'
      });
    }

    contact.deleteOne();
    await user.save();

    res.json({
      success: true,
      message: 'Contact supprimé'
    });

  } catch (error) {
    logger.error(`Erreur delete contact: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du contact'
    });
  }
};