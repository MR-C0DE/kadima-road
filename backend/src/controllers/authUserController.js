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
      // Pas de helperProfile car ce n'est pas un helper
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