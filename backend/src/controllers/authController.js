import User from '../models/User.js';
import Helper from '../models/Helper.js';
import jwt from 'jsonwebtoken';
import logger from '../config/logger.js';

// Générer un token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// @desc    Inscription utilisateur (Kadima Road)
// @route   POST /api/auth/register/user
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const userExists = await User.findOne({ 
      $or: [{ email }, { phone }] 
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur avec cet email ou téléphone existe déjà'
      });
    }

    // Créer l'utilisateur (rôle user par défaut)
    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password,
      role: 'user',
      isHelper: false
    });

    // Générer le token
    const token = generateToken(user._id);

    logger.info(`✅ Nouvel utilisateur créé: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      data: {
        user: user.toJSON(),
        token
      }
    });

  } catch (error) {
    logger.error(`Erreur inscription utilisateur: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription',
      error: error.message
    });
  }
};

// @desc    Inscription helper (Kadima Helpers)
// @route   POST /api/auth/register/helper
// @access  Public
export const registerHelper = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const userExists = await User.findOne({ 
      $or: [{ email }, { phone }] 
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur avec cet email ou téléphone existe déjà'
      });
    }

    // Créer l'utilisateur avec rôle helper
    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password,
      role: 'helper',
      isHelper: true
    });

    // Créer le profil helper vide (sera complété pendant l'onboarding)
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
      },
      certification: {
        isCertified: false,
        trainingCompleted: false,
        backgroundCheck: false
      }
    });

    // Lier le helper à l'utilisateur
    user.helperProfile = helper._id;
    await user.save();

    // Générer le token
    const token = generateToken(user._id);

    logger.info(`✅ Nouveau helper créé: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Inscription helper réussie',
      data: {
        user: user.toJSON(),
        token
      }
    });

  } catch (error) {
    logger.error(`Erreur inscription helper: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription helper',
      error: error.message
    });
  }
};

// @desc    Connexion utilisateur (commun aux deux apps)
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Mettre à jour la dernière connexion
    user.lastLogin = new Date();
    await user.save();

    // Générer le token
    const token = generateToken(user._id);

    logger.info(`✅ Connexion réussie: ${email}`);

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: user.toJSON(),
        token
      }
    });

  } catch (error) {
    logger.error(`Erreur connexion: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion'
    });
  }
};

// @desc    Obtenir le profil de l'utilisateur connecté
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('helperProfile');

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error(`Erreur profil: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil'
    });
  }
};

// @desc    Mettre à jour le profil
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const updates = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phone: req.body.phone,
      address: req.body.address,
      emergencyContacts: req.body.emergencyContacts,
      preferences: req.body.preferences
    };

    // Enlever les champs undefined
    Object.keys(updates).forEach(key => 
      updates[key] === undefined && delete updates[key]
    );

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profil mis à jour',
      data: user
    });

  } catch (error) {
    logger.error(`Erreur mise à jour profil: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil'
    });
  }
};

// @desc    Changer le mot de passe
// @route   POST /api/auth/change-password
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

    // Mettre à jour le mot de passe
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    });

  } catch (error) {
    logger.error(`Erreur changement mot de passe: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de mot de passe'
    });
  }
};