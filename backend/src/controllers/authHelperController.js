import User from '../models/User.js';
import Helper from '../models/Helper.js';
import jwt from 'jsonwebtoken';
import logger from '../config/logger.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// @desc    Inscription helper (Kadima Helpers)
// @route   POST /api/auth/helper/register
// @access  Public
export const registerHelper = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    // Vérifier si l'utilisateur existe déjà
    let user = await User.findOne({ email });

    if (user) {
      // Utilisateur existant : vérifier s'il est déjà helper
      if (user.isHelper) {
        return res.status(400).json({
          success: false,
          message: 'Vous êtes déjà inscrit comme helper'
        });
      }

      // Mettre à jour l'utilisateur existant pour en faire un helper
      user.role = 'helper';
      user.isHelper = true;
      
      // Créer le profil helper
      const helper = await Helper.create({
        user: user._id,
        status: 'pending',
        services: [],
        equipment: [],
        pricing: {
          basePrice: 25,
          perKm: 1
        },
        availability: {
          isAvailable: true,
          schedule: []
        }
      });

      user.helperProfile = helper._id;
      await user.save();

      const token = generateToken(user._id);

      return res.status(201).json({
        success: true,
        message: 'Rôle helper ajouté avec succès',
        data: {
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isHelper: user.isHelper
          },
          helper: {
            id: helper._id,
            status: helper.status
          },
          token
        }
      });
    }

    // Nouvel utilisateur : créer avec rôle helper
    user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password,
      role: 'helper',
      isHelper: true
    });

    // Créer le profil helper
    const helper = await Helper.create({
      user: user._id,
      status: 'pending',
      services: [],
      equipment: [],
      pricing: {
        basePrice: 25,
        perKm: 1
      },
      availability: {
        isAvailable: true,
        schedule: []
      }
    });

    user.helperProfile = helper._id;
    await user.save();

    const token = generateToken(user._id);

    logger.info(`✅ Nouveau helper créé: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Inscription helper réussie',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isHelper: user.isHelper
        },
        helper: {
          id: helper._id,
          status: helper.status
        },
        token
      }
    });

  } catch (error) {
    logger.error(`Erreur inscription helper: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription helper'
    });
  }
};

// @desc    Connexion helper (Kadima Helpers)
// @route   POST /api/auth/helper/login
// @access  Public
export const loginHelper = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).populate('helperProfile');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // VÉRIFICATION : doit être helper ou admin
    if (!user.isHelper && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cette application est réservée aux helpers. Inscrivez-vous d\'abord.'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Connexion helper réussie',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isHelper: user.isHelper
        },
        helper: user.helperProfile,
        token
      }
    });

  } catch (error) {
    logger.error(`Erreur connexion helper: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion helper'
    });
  }
};

// @desc    Obtenir le profil du helper connecté
// @route   GET /api/auth/helper/profile
// @access  Private
export const getHelperProfile = async (req, res) => {
  try {
    const helper = await Helper.findOne({ user: req.user._id })
      .populate('user', '-password');

    if (!helper) {
      return res.status(404).json({
        success: false,
        message: 'Profil helper non trouvé'
      });
    }

    res.json({
      success: true,
      data: helper
    });
  } catch (error) {
    logger.error(`Erreur récupération profil helper: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil'
    });
  }
};

// @desc    Mettre à jour le profil helper
// @route   PUT /api/auth/helper/profile
// @access  Private
export const updateHelperProfile = async (req, res) => {
  try {
    const helper = await Helper.findOne({ user: req.user._id });

    if (!helper) {
      return res.status(404).json({
        success: false,
        message: 'Profil helper non trouvé'
      });
    }

    const allowedUpdates = ['services', 'equipment', 'pricing', 'availability', 'serviceArea'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        helper[field] = req.body[field];
      }
    });

    await helper.save();

    res.json({
      success: true,
      message: 'Profil helper mis à jour',
      data: helper
    });

  } catch (error) {
    logger.error(`Erreur mise à jour helper: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil'
    });
  }
};