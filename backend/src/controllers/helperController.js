import Helper from '../models/Helper.js';
import User from '../models/User.js';
import Intervention from '../models/Intervention.js';
import { sendSMS } from '../services/smsService.js';
import logger from '../config/logger.js';

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
export const updateHelperProfile = async (req, res) => {
  try {
    const helper = await Helper.findOne({ user: req.user._id });

    if (!helper) {
      return res.status(404).json({
        success: false,
        message: 'Profil helper non trouvé'
      });
    }

    // Champs autorisés
    const allowedUpdates = [
      'serviceArea',
      'availability',
      'pricing',
      'equipment'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        helper[field] = req.body[field];
      }
    });

    await helper.save();

    res.json({
      success: true,
      message: 'Profil mis à jour',
      data: helper
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
export const uploadDocument = async (req, res) => {
  try {
    const { type, url } = req.body;

    const helper = await Helper.findOne({ user: req.user._id });

    if (!helper) {
      return res.status(404).json({
        success: false,
        message: 'Helper non trouvé'
      });
    }

    helper.documents.push({
      type,
      url,
      verified: false,
      uploadedAt: new Date()
    });

    await helper.save();

    res.json({
      success: true,
      message: 'Document uploadé',
      data: helper.documents
    });

  } catch (error) {
    logger.error(`Erreur uploadDocument: ${error.message}`);
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