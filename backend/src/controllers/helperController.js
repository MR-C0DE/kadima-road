import Helper from '../models/Helper.js';
import User from '../models/User.js';
import logger from '../config/logger.js';

// @desc    Devenir helper (inscription)
// @route   POST /api/helpers/apply
// @access  Private
export const applyAsHelper = async (req, res) => {
  try {
    const {
      serviceArea,
      availability,
      services,
      equipment,
      pricing
    } = req.body;

    // Vérifier si l'utilisateur est déjà helper
    const existingHelper = await Helper.findOne({ user: req.user._id });
    if (existingHelper) {
      return res.status(400).json({
        success: false,
        message: 'Vous êtes déjà inscrit comme helper'
      });
    }

    // Créer le profil helper
    const helper = await Helper.create({
      user: req.user._id,
      serviceArea: {
        type: 'Point',
        coordinates: serviceArea.coordinates,
        radius: serviceArea.radius || 20
      },
      availability: availability || { isAvailable: true },
      services: services || [],
      equipment: equipment || [],
      pricing: pricing || { basePrice: 25 },
      status: 'pending' // En attente de certification
    });

    // Mettre à jour l'utilisateur
    await User.findByIdAndUpdate(req.user._id, {
      isHelper: true,
      helperProfile: helper._id,
      role: 'helper'
    });

    res.status(201).json({
      success: true,
      message: 'Demande de helper soumise avec succès',
      data: helper
    });

  } catch (error) {
    logger.error(`Erreur application helper: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la soumission',
      error: error.message
    });
  }
};

// @desc    Obtenir les helpers disponibles autour
// @route   GET /api/helpers/nearby
// @access  Private
export const getNearbyHelpers = async (req, res) => {
  try {
    const { lat, lng, radius = 10000, service } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude et longitude requises'
      });
    }

    const query = {
      'serviceArea.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(radius)
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
      .populate('user', 'firstName lastName phone rating')
      .limit(20);

    // Calculer la distance et le temps d'arrivée estimé
    const helpersWithETA = helpers.map(helper => {
      const distance = calculateDistance(
        [parseFloat(lng), parseFloat(lat)],
        helper.serviceArea.coordinates
      );
      
      return {
        ...helper.toObject(),
        distance: Math.round(distance * 10) / 10,
        eta: Math.round(distance * 2) // 2 minutes par km (estimation)
      };
    });

    res.json({
      success: true,
      count: helpersWithETA.length,
      data: helpersWithETA.sort((a, b) => a.distance - b.distance)
    });

  } catch (error) {
    logger.error(`Erreur recherche helpers: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche'
    });
  }
};

// @desc    Mettre à jour la disponibilité
// @route   PUT /api/helpers/availability
// @access  Private (helpers only)
export const updateAvailability = async (req, res) => {
  try {
    const { isAvailable, schedule } = req.body;

    const helper = await Helper.findOneAndUpdate(
      { user: req.user._id },
      {
        'availability.isAvailable': isAvailable,
        'availability.schedule': schedule
      },
      { new: true }
    );

    if (!helper) {
      return res.status(404).json({
        success: false,
        message: 'Profil helper non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Disponibilité mise à jour',
      data: helper.availability
    });

  } catch (error) {
    logger.error(`Erreur mise à jour disponibilité: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour'
    });
  }
};

// Fonction utilitaire de distance
function calculateDistance(coord1, coord2) {
  const [lng1, lat1] = coord1;
  const [lng2, lat2] = coord2;
  
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}