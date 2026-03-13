import Helper from '../models/Helper.js';
import User from '../models/User.js';
import Intervention from '../models/Intervention.js';
import { sendSMS } from '../services/smsService.js';
import logger from '../config/logger.js';

import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    S'inscrire en tant que helper
// @route   POST /api/helpers/register
// @access  Private
export const registerAsHelper = async (req, res) => {
  try {
    // Vérifier si l'utilisateur est déjà helper
    const existingHelper = await Helper.findOne({ user: req.user._id });
    if (existingHelper) {
      return res.status(400).json({
        success: false,
        message: 'Vous êtes déjà inscrit comme helper'
      });
    }

    const {
      serviceArea,
      availability,
      services,
      equipment,
      pricing
    } = req.body;

    // Créer le profil helper
    const helper = await Helper.create({
      user: req.user._id,
      status: 'pending',
      serviceArea: {
        type: 'Point',
        coordinates: serviceArea.coordinates || [-75.6919, 45.4215], // Ottawa par défaut
        radius: serviceArea.radius || 20
      },
      availability: availability || {
        isAvailable: true,
        schedule: []
      },
      services: services || [],
      equipment: equipment || [],
      pricing: pricing || {
        basePrice: 50,
        perKm: 1
      },
      certification: {
        isCertified: false,
        trainingCompleted: false,
        backgroundCheck: false
      }
    });

    // Mettre à jour l'utilisateur
    await User.findByIdAndUpdate(req.user._id, {
      isHelper: true,
      helperProfile: helper._id,
      role: 'helper'
    });

    res.status(201).json({
      success: true,
      message: 'Inscription helper en attente de validation',
      data: helper
    });

  } catch (error) {
    logger.error(`Erreur registerAsHelper: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription comme helper'
    });
  }
};

// @desc    Obtenir le profil du helper connecté
// @route   GET /api/helpers/profile/me
// @access  Private
export const getHelperProfile = async (req, res) => {
  try {
    
    const helper = await Helper.findOne({ user: req.user._id })
      .populate('user', '-password');

      console.log(helper);

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
    logger.error(`Erreur getHelperProfile: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil'
    });
  }
};

// @desc    Mettre à jour le profil helper
// @route   PUT /api/helpers/profile/me
// @access  Private
// @desc    Mettre à jour le profil helper
// @route   PUT /api/helpers/profile/me
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

    // 1. Mettre à jour les champs simples
    const allowedUpdates = [
      'serviceArea',
      'availability',
      'pricing',
      'equipment',
      'services',
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        helper[field] = req.body[field];
      }
    });

    // 2. Gérer l'adresse (soit directe, soit dans serviceArea)
    if (req.body.address !== undefined) {
      // Si le modèle a un champ 'address' direct
      helper.address = req.body.address;
      console.log('📍 Adresse directe:', req.body.address);
    }
    
    if (req.body.serviceArea?.address !== undefined) {
      // Si l'adresse est dans serviceArea
      if (!helper.serviceArea) {
        helper.serviceArea = {
          type: 'Point',
          coordinates: [-75.6919, 45.4215],
          radius: 20
        };
      }
      helper.serviceArea.address = req.body.serviceArea.address;
      console.log('📍 Adresse dans serviceArea:', req.body.serviceArea.address);
    }

    // 3. Sauvegarder
    const savedHelper = await helper.save();
    console.log('✅ Profil mis à jour:', savedHelper._id);

    res.json({
      success: true,
      message: 'Profil mis à jour',
      data: savedHelper
    });

  } catch (error) {
    logger.error(`Erreur updateHelperProfile: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil'
    });
  }
};

// @desc    Obtenir un helper par ID
// @route   GET /api/helpers/:id
// @access  Private
export const getHelperById = async (req, res) => {
  try {
    const helper = await Helper.findById(req.params.id)
      .populate('user', 'firstName lastName phone email photo');

    if (!helper) {
      return res.status(404).json({
        success: false,
        message: 'Helper non trouvé'
      });
    }

    res.json({
      success: true,
      data: helper
    });

  } catch (error) {
    logger.error(`Erreur getHelperById: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du helper'
    });
  }
};

// @desc    Obtenir tous les helpers (admin only)
// @route   GET /api/helpers
// @access  Private/Admin
export const getAllHelpers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs'
      });
    }

    const { status, certified, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (certified) query['certification.isCertified'] = certified === 'true';

    const helpers = await Helper.find(query)
      .populate('user', 'firstName lastName email phone')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Helper.countDocuments(query);

    res.json({
      success: true,
      count: helpers.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: helpers
    });

  } catch (error) {
    logger.error(`Erreur getAllHelpers: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des helpers'
    });
  }
};

// @desc    Mettre à jour la disponibilité
// @route   PUT /api/helpers/availability
// @access  Private
export const updateAvailability = async (req, res) => {
  try {
    const { isAvailable, schedule } = req.body;

    const helper = await Helper.findOne({ user: req.user._id });

    if (!helper) {
      return res.status(404).json({
        success: false,
        message: 'Helper non trouvé'
      });
    }

    if (isAvailable !== undefined) {
      helper.availability.isAvailable = isAvailable;
    }

    if (schedule) {
      helper.availability.schedule = schedule;
    }

    await helper.save();

    res.json({
      success: true,
      message: `Disponibilité mise à jour: ${isAvailable ? 'disponible' : 'indisponible'}`,
      data: helper.availability
    });

  } catch (error) {
    logger.error(`Erreur updateAvailability: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la disponibilité'
    });
  }
};

// @desc    Ajouter un service
// @route   POST /api/helpers/services
// @access  Private
export const addService = async (req, res) => {
  try {
    const { service, price } = req.body;

    const helper = await Helper.findOne({ user: req.user._id });

    if (!helper) {
      return res.status(404).json({
        success: false,
        message: 'Helper non trouvé'
      });
    }

    // Vérifier si le service existe déjà
    const serviceExists = helper.pricing.services?.find(
      s => s.service === service
    );

    if (serviceExists) {
      return res.status(400).json({
        success: false,
        message: 'Ce service existe déjà'
      });
    }

    // Ajouter le service
    if (!helper.pricing.services) {
      helper.pricing.services = [];
    }

    helper.pricing.services.push({
      service,
      price: price || helper.pricing.basePrice
    });

    // Ajouter aussi à la liste des services proposés
    if (!helper.services.includes(service)) {
      helper.services.push(service);
    }

    await helper.save();

    res.json({
      success: true,
      message: 'Service ajouté',
      data: helper.pricing.services
    });

  } catch (error) {
    logger.error(`Erreur addService: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout du service'
    });
  }
};

// @desc    Supprimer un service
// @route   DELETE /api/helpers/services/:serviceId
// @access  Private
export const removeService = async (req, res) => {
  try {
    const helper = await Helper.findOne({ user: req.user._id });

    if (!helper) {
      return res.status(404).json({
        success: false,
        message: 'Helper non trouvé'
      });
    }

    const serviceIndex = helper.pricing.services?.findIndex(
      s => s._id.toString() === req.params.serviceId
    );

    if (serviceIndex === -1 || serviceIndex === undefined) {
      return res.status(404).json({
        success: false,
        message: 'Service non trouvé'
      });
    }

    // Supprimer le service
    const removedService = helper.pricing.services[serviceIndex];
    helper.pricing.services.splice(serviceIndex, 1);

    // Supprimer aussi de la liste des services si plus aucun pricing
    const serviceStillExists = helper.pricing.services.some(
      s => s.service === removedService.service
    );

    if (!serviceStillExists) {
      const serviceTypeIndex = helper.services.indexOf(removedService.service);
      if (serviceTypeIndex > -1) {
        helper.services.splice(serviceTypeIndex, 1);
      }
    }

    await helper.save();

    res.json({
      success: true,
      message: 'Service supprimé',
      data: helper.pricing.services
    });

  } catch (error) {
    logger.error(`Erreur removeService: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du service'
    });
  }
};

// @desc    Obtenir les helpers à proximité
// @route   GET /api/helpers/nearby
// @access  Private
export const getNearbyHelpers = async (req, res) => {
  try {
    const { lat, lng, radius = 10, service } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude et longitude requises'
      });
    }

    // Construire la requête
    const query = {
      'serviceArea.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radius * 1000
        }
      },
      status: 'active',
      'availability.isAvailable': true
    };

    // Filtrer par service si spécifié
    if (service) {
      query.services = service;
    }

    const helpers = await Helper.find(query)
      .populate('user', 'firstName lastName phone photo')
      .limit(20);

    // Ajouter la distance calculée
    const helpersWithDistance = helpers.map(helper => {
      const [helperLng, helperLat] = helper.serviceArea.coordinates;
      const distance = calculateDistance(
        parseFloat(lat),
        parseFloat(lng),
        helperLat,
        helperLng
      );
      return {
        ...helper.toObject(),
        distance
      };
    });

    // Trier par distance
    helpersWithDistance.sort((a, b) => a.distance - b.distance);

    res.json({
      success: true,
      count: helpersWithDistance.length,
      data: helpersWithDistance
    });

  } catch (error) {
    logger.error(`Erreur getNearbyHelpers: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche de helpers'
    });
  }
};

// @desc    Obtenir les statistiques d'un helper
// @route   GET /api/helpers/stats/:id
// @access  Private
export const getHelperStats = async (req, res) => {
  try {
    const helper = await Helper.findById(req.params.id);

    if (!helper) {
      return res.status(404).json({
        success: false,
        message: 'Helper non trouvé'
      });
    }

    // Récupérer les interventions du helper
    const interventions = await Intervention.find({ helper: helper._id });

    const totalInterventions = interventions.length;
    const completedInterventions = interventions.filter(i => i.status === 'completed').length;
    const cancelledInterventions = interventions.filter(i => i.status === 'cancelled').length;
    
    const totalEarnings = interventions
      .filter(i => i.status === 'completed')
      .reduce((sum, i) => sum + (i.pricing?.final || 0), 0);

    const averageRating = helper.stats?.averageRating || 0;

    res.json({
      success: true,
      data: {
        totalInterventions,
        completedInterventions,
        cancelledInterventions,
        totalEarnings,
        averageRating,
        responseTime: helper.stats?.averageResponseTime || 0,
        memberSince: helper.createdAt
      }
    });

  } catch (error) {
    logger.error(`Erreur getHelperStats: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
};

// @desc    Vérifier un helper (admin only)
// @route   PUT /api/helpers/verify/:id
// @access  Private/Admin
export const verifyHelper = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs'
      });
    }

    const { verified, backgroundCheck, trainingCompleted } = req.body;

    const helper = await Helper.findById(req.params.id).populate('user');

    if (!helper) {
      return res.status(404).json({
        success: false,
        message: 'Helper non trouvé'
      });
    }

    // Mettre à jour la certification
    helper.certification = {
      ...helper.certification,
      isCertified: verified !== undefined ? verified : helper.certification.isCertified,
      backgroundCheck: backgroundCheck !== undefined ? backgroundCheck : helper.certification.backgroundCheck,
      trainingCompleted: trainingCompleted !== undefined ? trainingCompleted : helper.certification.trainingCompleted,
      certifiedAt: verified ? new Date() : helper.certification.certifiedAt,
      expiresAt: verified ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null
    };

    // Mettre à jour le statut
    if (verified) {
      helper.status = 'active';
    }

    await helper.save();

    // Notifier le helper par SMS
    if (helper.user?.phone) {
      const message = verified 
        ? 'Félicitations! Votre profil helper a été approuvé. Vous pouvez maintenant commencer à aider les conducteurs sur Kadima Road.'
        : 'Votre profil helper est en attente de vérification. Nous vous contacterons sous peu.';
      
      await sendSMS(helper.user.phone, message);
    }

    res.json({
      success: true,
      message: verified ? 'Helper vérifié avec succès' : 'Helper mis à jour',
      data: helper
    });

  } catch (error) {
    logger.error(`Erreur verifyHelper: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du helper'
    });
  }
};

// @desc    Uploader un document
// @route   POST /api/helpers/documents
// @access  Private
// @desc    Uploader un document
// @route   POST /api/helpers/documents
// @access  Private
export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun document fourni'
      });
    }

    const { type } = req.body; // 'license', 'insurance', 'certification'

    const helper = await Helper.findOne({ user: req.user._id });

    if (!helper) {
      // Supprimer le fichier si helper non trouvé
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Helper non trouvé'
      });
    }

    // Construire l'URL du document
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const documentUrl = `${baseUrl}/uploads/documents/${req.file.filename}`;

    helper.documents.push({
      type,
      url: documentUrl,
      verified: false,
      uploadedAt: new Date()
    });

    await helper.save();

    res.json({
      success: true,
      message: 'Document uploadé avec succès',
      data: helper.documents
    });

  } catch (error) {
    logger.error(`Erreur uploadDocument: ${error.message}`);
    
    // Nettoyer le fichier en cas d'erreur
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload du document'
    });
  }
};

// @desc    Obtenir les avis d'un helper
// @route   GET /api/helpers/reviews/:id
// @access  Private
export const getHelperReviews = async (req, res) => {
  try {
    const helper = await Helper.findById(req.params.id)
      .populate({
        path: 'reviews.user',
        select: 'firstName lastName photo'
      });

    if (!helper) {
      return res.status(404).json({
        success: false,
        message: 'Helper non trouvé'
      });
    }

    res.json({
      success: true,
      count: helper.reviews.length,
      averageRating: helper.stats?.averageRating || 0,
      data: helper.reviews.sort((a, b) => b.createdAt - a.createdAt)
    });

  } catch (error) {
    logger.error(`Erreur getHelperReviews: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des avis'
    });
  }
};

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

// Fonction utilitaire pour calculer la distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// ============================================
// ROUTES POUR LES MISSIONS
// ============================================

// @desc    Obtenir les missions en cours du helper
// @route   GET /api/helpers/missions/current
// @access  Private
export const getCurrentMissions = async (req, res) => {
  try {
    const helper = await Helper.findOne({ user: req.user._id });
    
    if (!helper) {
      return res.status(404).json({
        success: false,
        message: 'Helper non trouvé'
      });
    }

    // Statuts des missions en cours
    const currentStatuses = ['accepted', 'en_route', 'arrived', 'in_progress'];
    
    const missions = await Intervention.find({
      helper: helper._id,
      status: { $in: currentStatuses }
    })
    .populate('user', 'firstName lastName phone')
    .sort('-updatedAt');

    res.json({
      success: true,
      count: missions.length,
      data: missions
    });

  } catch (error) {
    logger.error(`Erreur getCurrentMissions: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des missions en cours'
    });
  }
};

// @desc    Obtenir l'historique des missions du helper
// @route   GET /api/helpers/missions/history
// @access  Private
export const getMissionHistory = async (req, res) => {
  try {
    const helper = await Helper.findOne({ user: req.user._id });
    
    if (!helper) {
      return res.status(404).json({
        success: false,
        message: 'Helper non trouvé'
      });
    }

    // Statuts des missions terminées
    const historyStatuses = ['completed', 'cancelled'];
    
    const missions = await Intervention.find({
      helper: helper._id,
      status: { $in: historyStatuses }
    })
    .populate('user', 'firstName lastName')
    .sort('-createdAt')
    .limit(50); // Limiter à 50 missions pour l'historique

    res.json({
      success: true,
      count: missions.length,
      data: missions
    });

  } catch (error) {
    logger.error(`Erreur getMissionHistory: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'historique'
    });
  }
};

// @desc    Mettre à jour le statut d'une mission
// @route   PUT /api/helpers/missions/:id/status
// @access  Private
export const updateMissionStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const helper = await Helper.findOne({ user: req.user._id });
    
    if (!helper) {
      return res.status(404).json({
        success: false,
        message: 'Helper non trouvé'
      });
    }

    const intervention = await Intervention.findById(id)
      .populate('user')
      .populate('helper');

    if (!intervention) {
      return res.status(404).json({
        success: false,
        message: 'Intervention non trouvée'
      });
    }

    // Vérifier que le helper est bien assigné à cette intervention
    if (intervention.helper?._id.toString() !== helper._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas assigné à cette intervention'
      });
    }

    // Mettre à jour le statut
    intervention.status = status;
    intervention.timeline.push({
      status,
      timestamp: new Date(),
      note: `Statut mis à jour par le helper: ${status}`
    });

    // Actions spécifiques selon le statut
    if (status === 'en_route') {
      // Calculer le temps d'arrivée estimé
      intervention.eta = 15; // À améliorer avec Google Maps
      
      // Notifier l'utilisateur
      if (intervention.user?.phone) {
        await sendSMS(
          intervention.user.phone,
          `🚗 Votre helper ${helper.user?.firstName} est en route ! Arrivée estimée dans 15 minutes.`
        );
      }
    }

    if (status === 'arrived') {
      if (intervention.user?.phone) {
        await sendSMS(
          intervention.user.phone,
          `📍 Votre helper ${helper.user?.firstName} est arrivé sur place.`
        );
      }
    }

    if (status === 'completed') {
      intervention.completedAt = new Date();
      
      // Mettre à jour les stats du helper
      await Helper.findByIdAndUpdate(helper._id, {
        $inc: {
          'stats.completedInterventions': 1,
          'stats.totalInterventions': 1
        }
      });

      if (intervention.user?.phone) {
        await sendSMS(
          intervention.user.phone,
          `✅ Intervention terminée ! Merci d'avoir utilisé Kadima Helpers.`
        );
      }
    }

    if (status === 'cancelled') {
      intervention.cancelledAt = new Date();
      intervention.cancellation = {
        cancelledBy: 'helper',
        reason: 'Annulé par le helper',
        cancelledAt: new Date()
      };

      if (intervention.user?.phone) {
        await sendSMS(
          intervention.user.phone,
          `❌ Votre intervention a été annulée par le helper.`
        );
      }
    }

    await intervention.save();

    res.json({
      success: true,
      message: 'Statut mis à jour avec succès',
      data: intervention
    });

  } catch (error) {
    logger.error(`Erreur updateMissionStatus: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut'
    });
  }
};

// ============================================
// ROUTES POUR LES GAINS
// ============================================

// @desc    Obtenir les statistiques de gains
// @route   GET /api/helpers/earnings/stats
// @access  Private
export const getEarningsStats = async (req, res) => {
  try {
    const helper = await Helper.findOne({ user: req.user._id });
    
    if (!helper) {
      return res.status(404).json({
        success: false,
        message: 'Helper non trouvé'
      });
    }

    // Récupérer toutes les interventions du helper
    const interventions = await Intervention.find({ 
      helper: helper._id,
      status: 'completed'
    });

    // Calculer les statistiques
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const weekAgo = new Date(now.setDate(now.getDate() - 7));
    const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
    const yearAgo = new Date(now.setFullYear(now.getFullYear() - 1));

    const todayEarnings = interventions
      .filter(i => new Date(i.createdAt) >= today)
      .reduce((sum, i) => sum + (i.pricing?.final || 0), 0);

    const weekEarnings = interventions
      .filter(i => new Date(i.createdAt) >= weekAgo)
      .reduce((sum, i) => sum + (i.pricing?.final || 0), 0);

    const monthEarnings = interventions
      .filter(i => new Date(i.createdAt) >= monthAgo)
      .reduce((sum, i) => sum + (i.pricing?.final || 0), 0);

    const totalEarnings = interventions
      .reduce((sum, i) => sum + (i.pricing?.final || 0), 0);

    // Gains en attente (interventions acceptées mais pas encore terminées)
    const pendingInterventions = await Intervention.find({
      helper: helper._id,
      status: { $in: ['accepted', 'en_route', 'arrived', 'in_progress'] }
    });

    const pendingEarnings = pendingInterventions
      .reduce((sum, i) => sum + (i.pricing?.final || 0), 0);

    // Statistiques supplémentaires
    const completedMissions = interventions.length;
    const averagePerMission = completedMissions > 0 
      ? totalEarnings / completedMissions 
      : 0;

    // Taux de réponse et d'annulation
    const allInterventions = await Intervention.find({ helper: helper._id });
    const totalMissions = allInterventions.length;
    const cancelledMissions = allInterventions.filter(i => i.status === 'cancelled').length;
    
    const responseRate = totalMissions > 0 
      ? 100 
      : 100; // À améliorer avec des données réelles
    const cancellationRate = totalMissions > 0 
      ? (cancelledMissions / totalMissions) * 100 
      : 0;

    res.json({
      success: true,
      data: {
        todayEarnings,
        weekEarnings,
        monthEarnings,
        totalEarnings,
        pendingEarnings,
        completedMissions,
        averagePerMission,
        responseRate,
        cancellationRate
      }
    });

  } catch (error) {
    logger.error(`Erreur getEarningsStats: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques de gains'
    });
  }
};

// @desc    Obtenir les transactions récentes
// @route   GET /api/helpers/earnings/transactions
// @access  Private
export const getEarningsTransactions = async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    
    const helper = await Helper.findOne({ user: req.user._id });
    
    if (!helper) {
      return res.status(404).json({
        success: false,
        message: 'Helper non trouvé'
      });
    }

    // Déterminer la date de début selon la période
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'day':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setDate(now.getDate() - 7));
    }

    // Récupérer les interventions de la période
    const interventions = await Intervention.find({
      helper: helper._id,
      createdAt: { $gte: startDate }
    })
    .populate('user', 'firstName lastName')
    .sort('-createdAt')
    .limit(50);

    // Formater les transactions
    const transactions = interventions.map(i => ({
      _id: i._id,
      date: i.createdAt,
      amount: i.pricing?.final || 0,
      type: i.type,
      status: i.status === 'completed' ? 'completed' 
             : i.status === 'cancelled' ? 'cancelled' 
             : 'pending',
      client: {
        firstName: i.user?.firstName || 'Client',
        lastName: i.user?.lastName || ''
      },
      missionType: i.problem?.category || i.type || 'Assistance'
    }));

    res.json({
      success: true,
      count: transactions.length,
      data: transactions
    });

  } catch (error) {
    logger.error(`Erreur getEarningsTransactions: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des transactions'
    });
  }
};


// @desc    Uploader une photo de profil
// @route   POST /api/helpers/profile/photo
// @access  Private
export const uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucune photo fournie'
      });
    }

    const helper = await Helper.findOne({ user: req.user._id });

    if (!helper) {
      // Supprimer le fichier uploadé si helper non trouvé
      fs.unlinkSync(req.file.path);

      return res.status(404).json({
        success: false,
        message: 'Helper non trouvé'
      });
    }

    // ============================================
    // Optimisation de l'image
    // ============================================

    const optimizedFilename = `optimized-${req.file.filename}`;
    const optimizedPath = path.join(
      __dirname,
      '../../uploads/profiles',
      optimizedFilename
    );

    await sharp(req.file.path)
      .resize(400, 400, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toFile(optimizedPath);

    // Supprimer le fichier original
    fs.unlinkSync(req.file.path);

    // ============================================
    // Construire l'URL de la photo
    // ============================================

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const photoUrl = `${baseUrl}/uploads/profiles/${optimizedFilename}`;

    // ============================================
    // Supprimer l'ancienne photo si elle existe
    // ============================================

    if (helper.photo) {
      const oldPhotoPath = path.join(
        __dirname,
        '../../',
        helper.photo.replace(baseUrl, '')
      );

      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }

    // ============================================
    // Sauvegarder la photo dans Helper
    // ============================================

    helper.photo = photoUrl;
    await helper.save();

    // ============================================
    // Réponse
    // ============================================

    res.json({
      success: true,
      message: 'Photo de profil mise à jour',
      data: {
        photo: photoUrl
      }
    });

  } catch (error) {
    logger.error(`Erreur uploadProfilePhoto: ${error.message}`);

    // Nettoyer le fichier en cas d'erreur
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: "Erreur lors de l'upload de la photo"
    });
  }
};

// @desc    Supprimer la photo de profil
// @route   DELETE /api/helpers/profile/photo
// @access  Private
export const deleteProfilePhoto = async (req, res) => {
  try {
    const helper = await Helper.findOne({ user: req.user._id }).populate('user');
    
    if (!helper) {
      return res.status(404).json({
        success: false,
        message: 'Helper non trouvé'
      });
    }

    if (helper.user?.photo) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const photoPath = path.join(__dirname, '../../', helper.user.photo.replace(baseUrl, ''));
      
      // Supprimer le fichier physique
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }

      // Supprimer la référence dans la base de données
      await User.findByIdAndUpdate(req.user._id, {
        $unset: { photo: 1 }
      });
    }

    res.json({
      success: true,
      message: 'Photo de profil supprimée'
    });

  } catch (error) {
    logger.error(`Erreur deleteProfilePhoto: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la photo'
    });
  }
};

// @desc    Obtenir les SOS disponibles à proximité
// @route   GET /api/helpers/available-sos
// @access  Private
export const getAvailableSOS = async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude et longitude requises'
      });
    }

    // Récupérer le helper connecté
    const helper = await Helper.findOne({ user: req.user._id });
    if (!helper) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas un helper'
      });
    }

    // Chercher les SOS actifs autour
    const sosAlerts = await SOSAlert.find({
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radius * 1000
        }
      },
      status: 'active'
    })
    .populate('user', 'firstName lastName phone')
    .limit(20);

    // Formater pour l'affichage
    const formattedSOS = sosAlerts.map(sos => {
      const [sosLng, sosLat] = sos.location.coordinates;
      // ✅ Utilise la fonction calculateDistance existante
      const distance = calculateDistance(
        parseFloat(lat),
        parseFloat(lng),
        sosLat,
        sosLng
      );

      return {
        _id: sos._id,
        type: sos.problem.category,
        distance: Math.round(distance * 10) / 10, // Arrondi à 1 décimale
        reward: Math.round(25 + (distance * 2)), // Calcul du prix
        client: {
          firstName: sos.user.firstName,
          lastName: sos.user.lastName
        },
        problem: {
          description: sos.problem.description,
          category: sos.problem.category
        },
        location: {
          address: sos.location.address,
          coordinates: sos.location.coordinates
        },
        createdAt: sos.createdAt
      };
    });

    res.json({
      success: true,
      count: formattedSOS.length,
      data: formattedSOS
    });

  } catch (error) {
    logger.error(`Erreur getAvailableSOS: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des SOS'
    });
  }
};

// @desc    Accepter un SOS et créer l'intervention
// @route   POST /api/helpers/accept-sos/:sosId
// @access  Private
export const acceptSOSMission = async (req, res) => {
  try {
    const { sosId } = req.params;
    const { lat, lng } = req.query; // Position actuelle du helper

    // Récupérer le helper
    const helper = await Helper.findOne({ user: req.user._id }).populate('user');
    if (!helper) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas un helper'
      });
    }

    // Récupérer le SOS
    const sosAlert = await SOSAlert.findById(sosId);
    if (!sosAlert) {
      return res.status(404).json({
        success: false,
        message: 'SOS non trouvé'
      });
    }

    if (sosAlert.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Ce SOS n\'est plus disponible'
      });
    }

    // Créer l'intervention
    const intervention = await Intervention.create({
      user: sosAlert.user,
      helper: helper._id,
      sosAlert: sosAlert._id,
      type: 'sos',
      status: 'accepted',
      problem: sosAlert.problem,
      location: sosAlert.location,
      timeline: [{
        status: 'accepted',
        timestamp: new Date(),
        note: `Accepté par ${helper.user.firstName} ${helper.user.lastName}`
      }]
    });

    // Mettre à jour le SOS
    sosAlert.status = 'dispatched';
    sosAlert.intervention = intervention._id;
    sosAlert.timeline.push({
      event: 'SOS accepté',
      timestamp: new Date(),
      data: { helperId: helper._id }
    });

    await sosAlert.save();

    // ✅ Utilise la fonction calculateDistance existante
    let eta = 15; // valeur par défaut
    if (lat && lng) {
      const [sosLng, sosLat] = sosAlert.location.coordinates;
      const distance = calculateDistance(
        parseFloat(lat),
        parseFloat(lng),
        sosLat,
        sosLng
      );
      eta = Math.round(distance * 2); // 2 minutes par km
    }

    res.json({
      success: true,
      message: 'SOS accepté avec succès',
      data: {
        intervention,
        eta
      }
    });

  } catch (error) {
    logger.error(`Erreur acceptSOSMission: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'acceptation du SOS'
    });
  }
};
// Cette fonction est DÉJÀ présente vers la fin du fichier
