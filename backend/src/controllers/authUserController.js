import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import logger from '../config/logger.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// @desc    Inscription utilisateur (Kadima Road)
// @route   POST /api/auth/user/register
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
        message: 'Un compte avec cet email ou téléphone existe déjà'
      });
    }

    // Créer l'utilisateur (rôle 'user' par défaut)
    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password,
      role: 'user',
      isHelper: false
    });

    const token = generateToken(user._id);

    logger.info(`✅ Nouvel utilisateur créé: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
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
        token
      }
    });

  } catch (error) {
    logger.error(`Erreur inscription utilisateur: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription'
    });
  }
};

// @desc    Connexion utilisateur (Kadima Road)
// @route   POST /api/auth/user/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // VÉRIFICATION : doit avoir le rôle 'user' ou être admin
    if (user.role !== 'user' && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cette application est réservée aux utilisateurs. Veuillez utiliser l\'application Kadima Helpers.'
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
      message: 'Connexion réussie',
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
        token
      }
    });

  } catch (error) {
    logger.error(`Erreur connexion utilisateur: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion'
    });
  }
};

// @desc    Obtenir le profil de l'utilisateur connecté
// @route   GET /api/auth/user/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error(`Erreur getMe: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil'
    });
  }
};

// @desc    Mettre à jour le profil
// @route   PUT /api/auth/user/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const updates = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phone: req.body.phone,
      address: req.body.address,
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
    logger.error(`Erreur updateProfile: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil'
    });
  }
};

// @desc    Changer le mot de passe
// @route   POST /api/auth/user/change-password
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
    logger.error(`Erreur changePassword: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de mot de passe'
    });
  }
};