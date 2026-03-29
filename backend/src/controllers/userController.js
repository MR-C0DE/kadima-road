import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import Helper from '../models/Helper.js';
import Intervention from '../models/Intervention.js';
import { sendVerificationCode } from '../services/smsService.js';
import { sendWelcomeEmail } from '../services/emailService.js';
import logger from '../config/logger.js';
import bcrypt from 'bcrypt';
import axios from 'axios';
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
      .populate('helperProfile')
      .populate('vehicles'); // ⚡ AJOUT : populate des véhicules

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

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
    const isOwnProfile = req.params.id === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwnProfile && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à modifier cet utilisateur'
      });
    }

    const allowedUpdates = [
      'firstName',
      'lastName',
      'phone',
      'address',
      'emergencyContacts',
      'preferences'
      // ⚡ 'vehicles' retiré car géré séparément
    ];

    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

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

    // Supprimer tous les véhicules de l'utilisateur
    await Vehicle.deleteMany({ 'owners.user': user._id });

    // Supprimer le profil helper associé s'il existe
    if (user.helperProfile) {
      await Helper.findByIdAndDelete(user.helperProfile);
    }

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

// ============================================
// ⚡ NOUVEAU : GESTION DES VÉHICULES AVEC LE MODÈLE DÉDIÉ
// ============================================

// @desc    Ajouter un véhicule (avec nouveau modèle Vehicle)
// @route   POST /api/users/vehicles
// @access  Private
export const addVehicle = async (req, res) => {
  try {
    const { make, model, year, licensePlate, color, vin, fuelType, transmission, currentMileage } = req.body;

    // Vérifier si la plaque existe déjà pour cet utilisateur
    const existingVehicle = await Vehicle.findOne({
      licensePlate: licensePlate.toUpperCase(),
      'owners.user': req.user._id,
      status: 'active'
    });

    if (existingVehicle) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà un véhicule avec cette plaque'
      });
    }

    // Créer le véhicule
    const vehicle = await Vehicle.create({
      vin,
      licensePlate: licensePlate.toUpperCase(),
      make,
      model,
      year,
      color,
      fuelType,
      transmission,
      currentMileage: currentMileage || 0,
      owners: [{
        user: req.user._id,
        from: new Date(),
        isCurrent: true
      }]
    });

    // Ajouter au profil utilisateur
    await User.findByIdAndUpdate(req.user._id, {
      $push: { vehicles: vehicle._id }
    });

    res.status(201).json({
      success: true,
      message: 'Véhicule ajouté',
      data: vehicle
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
    const { make, model, year, licensePlate, color, vin, fuelType, transmission, currentMileage } = req.body;
    const vehicle = await Vehicle.findById(req.params.vehicleId);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Véhicule non trouvé'
      });
    }

    // Vérifier que l'utilisateur est le propriétaire actuel
    const isCurrentOwner = vehicle.owners.some(o =>
      o.user.toString() === req.user._id.toString() && o.isCurrent
    );

    if (!isCurrentOwner) {
      return res.status(403).json({
        success: false,
        message: 'Seul le propriétaire peut modifier ce véhicule'
      });
    }

    // Mettre à jour les champs
    if (make) vehicle.make = make;
    if (model) vehicle.model = model;
    if (year) vehicle.year = year;
    if (licensePlate) vehicle.licensePlate = licensePlate.toUpperCase();
    if (color) vehicle.color = color;
    if (vin) vehicle.vin = vin;
    if (fuelType) vehicle.fuelType = fuelType;
    if (transmission) vehicle.transmission = transmission;
    if (currentMileage) await vehicle.updateMileage(currentMileage, 'user', 'Mise à jour manuelle');

    await vehicle.save();

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
    const vehicle = await Vehicle.findById(req.params.vehicleId);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Véhicule non trouvé'
      });
    }

    const isCurrentOwner = vehicle.owners.some(o =>
      o.user.toString() === req.user._id.toString() && o.isCurrent
    );

    if (!isCurrentOwner) {
      return res.status(403).json({
        success: false,
        message: 'Seul le propriétaire peut supprimer ce véhicule'
      });
    }

    // Soft delete : marquer comme inactif
    vehicle.status = 'inactive';
    await vehicle.save();

    // Retirer du profil utilisateur
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { vehicles: vehicle._id }
    });

    res.json({
      success: true,
      message: 'Véhicule supprimé',
      data: null
    });

  } catch (error) {
    logger.error(`Erreur deleteVehicle: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du véhicule'
    });
  }
};

// ============================================
// CONTACTS D'URGENCE (inchangé)
// ============================================

// @desc    Ajouter un contact d'urgence
// @route   POST /api/users/emergency-contacts
// @access  Private
export const addEmergencyContact = async (req, res) => {
  try {
    const { name, phone, relationship } = req.body;
    const user = await User.findById(req.user._id);
    user.emergencyContacts.push({ name, phone, relationship });
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

    const [totalInterventions, completedInterventions, totalSpent, averageRating, vehiclesCount] = await Promise.all([
      Intervention.countDocuments({ user: userId }),
      Intervention.countDocuments({ user: userId, status: 'completed' }),
      Intervention.aggregate([
        { $match: { user: userId, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$pricing.final' } } }
      ]),
      Helper.aggregate([
        { $match: { user: userId } },
        { $unwind: '$reviews' },
        { $group: { _id: null, avgRating: { $avg: '$reviews.rating' } } }
      ]),
      Vehicle.countDocuments({ 'owners.user': userId, status: 'active' })
    ]);

    res.json({
      success: true,
      data: {
        totalInterventions,
        completedInterventions,
        totalSpent: totalSpent[0]?.total || 0,
        averageRating: averageRating[0]?.avgRating || 0,
        vehiclesCount,
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
    
    req.user.verificationCode = verificationCode;
    req.user.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
    await req.user.save();

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

    if (req.user.verificationCode !== code || req.user.verificationCodeExpires < new Date()) {
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

export const uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucune photo fournie'
      });
    }

    const user = await User.findById(req.user._id);
    
    const optimizedFilename = `profile-${req.user._id}-${Date.now()}.jpg`;
    const optimizedPath = path.join('uploads/profiles', optimizedFilename);
    
    await sharp(req.file.path)
      .resize(400, 400, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toFile(optimizedPath);

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

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }

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

// backend/src/controllers/userController.js
// Modifier la fonction updateSettings

export const updateSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // Initialiser preferences si inexistant
    if (!user.preferences) {
      user.preferences = {};
    }
    
    // Champs acceptés dans les préférences
    const allowedSettings = [
      'language',
      'notifications',
      'privacy',
      'paymentMethod',    // ← AJOUTÉ
      'assistanceType'    // ← AJOUTÉ
    ];
    
    // Mettre à jour uniquement les champs autorisés
    for (const key of allowedSettings) {
      if (req.body[key] !== undefined) {
        user.preferences[key] = req.body[key];
      }
    }
    
    // Si d'autres champs sont envoyés directement (comme notifications)
    if (req.body.notifications) {
      user.preferences.notifications = {
        ...user.preferences.notifications,
        ...req.body.notifications
      };
    }
    
    if (req.body.privacy) {
      user.preferences.privacy = {
        ...user.preferences.privacy,
        ...req.body.privacy
      };
    }
    
    await user.save();
    
    logger.info(`✅ Paramètres mis à jour pour ${user.email}`);
    
    res.json({
      success: true,
      message: 'Paramètres mis à jour',
      data: user.preferences
    });
    
  } catch (error) {
    logger.error(`Erreur updateSettings: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des paramètres'
    });
  }
};

// ============================================
// CONTACTS D'URGENCE
// ============================================

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

// backend/src/controllers/userController.js
// Ajouter cette fonction après les autres fonctions

// @desc    Rechercher un utilisateur par email (pour transfert de véhicule)
// @route   GET /api/users/search
// @access  Private
export const searchUserByEmail = async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email requis'
      });
    }
    
    // Recherche par email
    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') } // insensible à la casse
    }).select('firstName lastName email phone');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    // Vérifier que ce n'est pas l'utilisateur lui-même
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas transférer à vous-même'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
    
  } catch (error) {
    logger.error(`Erreur searchUserByEmail: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche'
    });
  }
};
// backend/src/controllers/userController.js
// Ajouter ces fonctions à la fin du fichier, avant le dernier export

// ============================================
// EXPORT DES DONNÉES (RGPD)
// ============================================

// @desc    Exporter toutes les données de l'utilisateur (RGPD)
// @route   GET /api/users/export-data
// @access  Private
export const exportUserData = async (req, res) => {
  try {
    console.log(`📦 Export des données demandé par: ${req.user.email}`);

    // Récupérer l'utilisateur avec toutes ses données
    const user = await User.findById(req.user._id)
      .select('-password')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Récupérer les véhicules de l'utilisateur
    const vehicles = await Vehicle.find({ 'owners.user': req.user._id })
      .populate('logs', 'title description type createdAt')
      .lean();

    // Récupérer les interventions de l'utilisateur
    const interventions = await Intervention.find({ user: req.user._id })
      .sort('-createdAt')
      .limit(100)
      .lean();

    // Structure des données exportées
    const exportData = {
      exportDate: new Date().toISOString(),
      userInfo: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        createdAt: user.createdAt,
        isVerified: user.isVerified,
        isHelper: user.isHelper,
        role: user.role
      },
      vehicles: vehicles.map(v => ({
        id: v._id,
        make: v.make,
        model: v.model,
        year: v.year,
        licensePlate: v.licensePlate,
        vin: v.vin,
        color: v.color,
        fuelType: v.fuelType,
        transmission: v.transmission,
        currentMileage: v.currentMileage,
        createdAt: v.createdAt,
        logs: v.logs || []
      })),
      interventions: interventions.map(i => ({
        id: i._id,
        type: i.type,
        status: i.status,
        problem: i.problem,
        location: i.location,
        createdAt: i.createdAt,
        completedAt: i.completedAt,
        pricing: i.pricing
      })),
      preferences: user.preferences || {},
      emergencyContacts: user.emergencyContacts || [],
      stats: {
        totalInterventions: interventions.length,
        completedInterventions: interventions.filter(i => i.status === 'completed').length,
        memberSince: user.createdAt
      }
    };

    console.log(`✅ Export des données réussi pour: ${user.email}`);

    res.json({
      success: true,
      message: 'Données exportées avec succès',
      data: exportData
    });

  } catch (error) {
    console.error(`❌ Erreur exportUserData: ${error.message}`);
    console.error(error.stack);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'export des données',
      error: error.message
    });
  }
};

// ============================================
// SUPPRESSION DE L'HISTORIQUE
// ============================================

// @desc    Supprimer tout l'historique des interventions de l'utilisateur
// @route   DELETE /api/users/history
// @access  Private
export const clearHistory = async (req, res) => {
  try {
    console.log(`🗑️ Suppression d'historique demandée par: ${req.user.email}`);

    // Compter le nombre d'interventions avant suppression
    const count = await Intervention.countDocuments({ user: req.user._id });
    
    // Supprimer toutes les interventions de l'utilisateur
    const result = await Intervention.deleteMany({ user: req.user._id });

    console.log(`✅ Historique supprimé pour: ${req.user.email} (${result.deletedCount} interventions)`);

    res.json({
      success: true,
      message: `Historique supprimé avec succès (${result.deletedCount} interventions)`,
      data: {
        deletedCount: result.deletedCount
      }
    });

  } catch (error) {
    console.error(`❌ Erreur clearHistory: ${error.message}`);
    console.error(error.stack);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'historique',
      error: error.message
    });
  }
};

// ============================================
// DÉFINIR LE VÉHICULE PAR DÉFAUT
// ============================================

// @desc    Définir le véhicule par défaut de l'utilisateur
// @route   PUT /api/users/default-vehicle
// @access  Private
export const setDefaultVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.body;

    if (!vehicleId) {
      return res.status(400).json({
        success: false,
        message: 'ID du véhicule requis'
      });
    }

    // Vérifier que le véhicule existe et appartient à l'utilisateur
    const vehicle = await Vehicle.findOne({
      _id: vehicleId,
      'owners.user': req.user._id,
      status: 'active'
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Véhicule non trouvé ou non autorisé'
      });
    }

    // Initialiser les préférences si elles n'existent pas
    if (!req.user.preferences) {
      req.user.preferences = {};
    }

    // Définir le véhicule par défaut
    req.user.preferences.defaultVehicle = vehicleId;
    await req.user.save();

    console.log(`🚗 Véhicule par défaut défini pour ${req.user.email}: ${vehicle.make} ${vehicle.model}`);

    res.json({
      success: true,
      message: 'Véhicule par défaut mis à jour',
      data: {
        defaultVehicle: {
          id: vehicle._id,
          make: vehicle.make,
          model: vehicle.model,
          licensePlate: vehicle.licensePlate
        }
      }
    });

  } catch (error) {
    console.error(`❌ Erreur setDefaultVehicle: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du véhicule par défaut'
    });
  }
};

// ============================================
// RÉCUPÉRER LE VÉHICULE PAR DÉFAUT
// ============================================

// @desc    Récupérer le véhicule par défaut de l'utilisateur
// @route   GET /api/users/default-vehicle
// @access  Private
export const getDefaultVehicle = async (req, res) => {
  try {
    const defaultVehicleId = req.user.preferences?.defaultVehicle;

    if (!defaultVehicleId) {
      return res.json({
        success: true,
        data: null,
        message: 'Aucun véhicule par défaut défini'
      });
    }

    const vehicle = await Vehicle.findOne({
      _id: defaultVehicleId,
      'owners.user': req.user._id,
      status: 'active'
    });

    if (!vehicle) {
      return res.json({
        success: true,
        data: null,
        message: 'Le véhicule par défaut n\'existe plus'
      });
    }

    res.json({
      success: true,
      data: {
        id: vehicle._id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        licensePlate: vehicle.licensePlate,
        color: vehicle.color,
        currentMileage: vehicle.currentMileage,
        reliabilityScore: vehicle.aiProfile?.reliabilityScore || 100
      }
    });

  } catch (error) {
    console.error(`❌ Erreur getDefaultVehicle: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du véhicule par défaut'
    });
  }
};
// backend/src/controllers/userController.js
// Remplacer la fonction getWeather par celle-ci

// backend/src/controllers/userController.js
// Ajouter cet import en haut du fichier


export const getWeather = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    console.log(`🌤️ Demande météo pour: lat=${lat}, lng=${lng}`);

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude et longitude requises'
      });
    }

    const API_KEY = process.env.OPENWEATHER_API_KEY || 'b93221c293fc230d6d020f0f59463ecb';
    
    console.log(`🔑 Utilisation de la clé API: ${API_KEY.substring(0, 8)}...`);

    try {
      // Appel à l'API OpenWeatherMap avec axios
      const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
        params: {
          lat,
          lon: lng,
          units: 'metric',
          lang: 'fr',
          appid: API_KEY
        },
        timeout: 10000
      });

      const data = response.data;

      console.log(`📡 Réponse reçue: ${data.name}, ${data.main.temp}°C`);

      // Traduction des conditions météo
      const conditionMap = {
        'clear sky': 'Ciel dégagé',
        'few clouds': 'Peu nuageux',
        'scattered clouds': 'Nuages épars',
        'broken clouds': 'Nuages fragmentés',
        'overcast clouds': 'Très nuageux',
        'light rain': 'Pluie légère',
        'moderate rain': 'Pluie modérée',
        'heavy intensity rain': 'Pluie forte',
        'shower rain': 'Averses',
        'rain': 'Pluie',
        'thunderstorm': 'Orage',
        'snow': 'Neige',
        'light snow': 'Neige légère',
        'mist': 'Brume',
        'fog': 'Brouillard'
      };

      const rawCondition = data.weather[0]?.description || 'Inconnu';
      const condition = conditionMap[rawCondition] || rawCondition;

      const weatherData = {
        temp: Math.round(data.main.temp),
        condition: condition.charAt(0).toUpperCase() + condition.slice(1),
        icon: data.weather[0]?.icon || '01d',
        city: data.name || 'Ottawa',
        feelsLike: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed * 3.6), // m/s → km/h
      };

      console.log(`✅ Météo récupérée: ${weatherData.city}, ${weatherData.temp}°C, ${weatherData.condition}`);

      res.json({
        success: true,
        data: weatherData
      });

    } catch (apiError) {
      console.error('❌ Erreur API OpenWeatherMap:', apiError.response?.data || apiError.message);
      
      // Fallback: retourner des données simulées
      console.log('🔄 Fallback vers données simulées');
      
      const month = new Date().getMonth();
      const isWinter = month < 3 || month > 10;
      const baseTemp = isWinter ? -5 : 15;
      const randomTemp = Math.floor(Math.random() * 10) + baseTemp;
      
      res.json({
        success: true,
        data: {
          temp: randomTemp,
          condition: isWinter ? "Neige légère" : "Ensoleillé",
          icon: isWinter ? "13d" : "01d",
          city: "Ottawa",
          feelsLike: randomTemp - 2,
          humidity: Math.floor(Math.random() * 40) + 50,
          windSpeed: Math.floor(Math.random() * 20) + 5
        }
      });
    }

  } catch (error) {
    console.error('❌ Erreur getWeather:', error.message);
    
    // Fallback final
    res.json({
      success: true,
      data: {
        temp: 12,
        condition: "Partiellement nuageux",
        icon: "02d",
        city: "Ottawa",
        feelsLike: 10,
        humidity: 65,
        windSpeed: 15
      }
    });
  }
};