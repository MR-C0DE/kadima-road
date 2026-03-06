import SOSAlert from '../models/SOSAlert.js';
import Helper from '../models/Helper.js';
import User from '../models/User.js';
import Intervention from '../models/Intervention.js';
import logger from '../config/logger.js';

// @desc    Créer une alerte SOS
// @route   POST /api/sos
// @access  Private
export const createSOSAlert = async (req, res) => {
  try {
    const {
      location,
      vehicle,
      problem,
      emergencyContacts
    } = req.body;

    // Validation de base
    if (!location || !location.coordinates) {
      return res.status(400).json({
        success: false,
        message: 'La position est requise'
      });
    }

    // Créer l'alerte SOS
    const sosAlert = await SOSAlert.create({
      user: req.user._id,
      location: {
        type: 'Point',
        coordinates: location.coordinates,
        address: location.address,
        accuracy: location.accuracy
      },
      vehicle,
      problem: {
        description: problem?.description || '',
        category: problem?.category || 'other',
        severity: problem?.severity || 'medium'
      },
      emergencyContacts: emergencyContacts || [],
      status: 'active',
      timeline: [{
        event: 'Alerte SOS créée',
        timestamp: new Date()
      }]
    });

    // Chercher les helpers disponibles autour
    const nearbyHelpers = await Helper.find({
      'serviceArea.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: location.coordinates
          },
          $maxDistance: 10000 // 10 km
        }
      },
      'availability.isAvailable': true,
      status: 'active'
    }).populate('user');

    // Enregistrer les helpers trouvés
    const helperNotifications = nearbyHelpers.map(helper => ({
      helper: helper._id,
      distance: calculateDistance(
        location.coordinates,
        helper.serviceArea.coordinates
      ),
      notifiedAt: new Date()
    }));

    sosAlert.notifications.nearbyHelpers = helperNotifications;
    sosAlert.timeline.push({
      event: `${helperNotifications.length} helpers trouvés autour`,
      timestamp: new Date()
    });

    await sosAlert.save();

    // Ici, tu pourrais envoyer des notifications push/SMS aux helpers
    // (on ajoutera ça plus tard avec Twilio)

    res.status(201).json({
      success: true,
      message: 'Alerte SOS créée',
      data: {
        sosAlert,
        nearbyHelpers: helperNotifications.length
      }
    });

  } catch (error) {
    logger.error(`Erreur création SOS: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'alerte SOS',
      error: error.message
    });
  }
};

// @desc    Obtenir les alertes SOS actives autour
// @route   GET /api/sos/nearby
// @access  Private (helpers)
export const getNearbySOS = async (req, res) => {
  try {
    const { lat, lng, radius = 10000 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude et longitude requises'
      });
    }

    const sosAlerts = await SOSAlert.find({
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(radius)
        }
      },
      status: 'active'
    }).populate('user', 'firstName lastName phone');

    res.json({
      success: true,
      count: sosAlerts.length,
      data: sosAlerts
    });

  } catch (error) {
    logger.error(`Erreur recherche SOS: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche des alertes SOS'
    });
  }
};

// @desc    Un helper accepte une alerte SOS
// @route   POST /api/sos/:id/accept
// @access  Private (helpers)
export const acceptSOS = async (req, res) => {
  try {
    const sosAlert = await SOSAlert.findById(req.params.id);

    if (!sosAlert) {
      return res.status(404).json({
        success: false,
        message: 'Alerte SOS non trouvée'
      });
    }

    if (sosAlert.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cette alerte n\'est plus active'
      });
    }

    // Vérifier que le helper existe et est actif
    const helper = await Helper.findOne({ user: req.user._id });
    if (!helper || helper.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas un helper actif'
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
        note: 'Alerte acceptée par helper'
      }]
    });

    // Mettre à jour le SOS
    sosAlert.status = 'dispatched';
    sosAlert.intervention = intervention._id;
    sosAlert.timeline.push({
      event: 'Alerte acceptée par helper',
      timestamp: new Date()
    });

    await sosAlert.save();

    // Ici, notifier l'utilisateur qu'un helper arrive

    res.json({
      success: true,
      message: 'Alerte acceptée',
      data: {
        sosAlert,
        intervention
      }
    });

  } catch (error) {
    logger.error(`Erreur acceptation SOS: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'acceptation de l\'alerte'
    });
  }
};

// @desc    Mettre à jour le statut d'une intervention
// @route   PUT /api/sos/:id/status
// @access  Private (helper ou user)
export const updateStatus = async (req, res) => {
  try {
    const { status, note, location } = req.body;
    
    const intervention = await Intervention.findById(req.params.id);
    
    if (!intervention) {
      return res.status(404).json({
        success: false,
        message: 'Intervention non trouvée'
      });
    }

    // Vérifier les permissions
    const isHelper = intervention.helper?.toString() === req.user._id?.toString();
    const isUser = intervention.user.toString() === req.user._id.toString();

    if (!isHelper && !isUser) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    // Ajouter au timeline
    intervention.timeline.push({
      status,
      timestamp: new Date(),
      note,
      location
    });

    intervention.status = status;

    // Si c'est terminé, mettre à jour les stats
    if (status === 'completed') {
      intervention.completedAt = new Date();
      
      // Mettre à jour les stats du helper
      if (intervention.helper) {
        await Helper.findByIdAndUpdate(intervention.helper, {
          $inc: {
            'stats.completedInterventions': 1,
            'stats.totalInterventions': 1
          }
        });
      }
    }

    await intervention.save();

    res.json({
      success: true,
      message: 'Statut mis à jour',
      data: intervention
    });

  } catch (error) {
    logger.error(`Erreur mise à jour statut: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut'
    });
  }
};

// @desc    Contacter les secours (911)
// @route   POST /api/sos/:id/emergency
// @access  Private
export const callEmergency = async (req, res) => {
  try {
    const sosAlert = await SOSAlert.findById(req.params.id);

    if (!sosAlert) {
      return res.status(404).json({
        success: false,
        message: 'Alerte SOS non trouvée'
      });
    }

    // Marquer que les secours ont été notifiés
    sosAlert.notifications.emergencyServices = {
      notified: true,
      notifiedAt: new Date(),
      serviceType: {
        ambulance: req.body.ambulance || false,
        police: req.body.police || false,
        fire: req.body.fire || false
      }
    };

    sosAlert.timeline.push({
      event: 'Secours contactés',
      timestamp: new Date(),
      data: req.body
    });

    await sosAlert.save();

    // Ici, tu pourrais intégrer un appel automatique à une API de secours
    // ou simplement retourner les infos pour que l'app mobile appelle le 911

    res.json({
      success: true,
      message: 'Secours notifiés',
      data: {
        emergencyServices: sosAlert.notifications.emergencyServices,
        location: sosAlert.location,
        user: await User.findById(sosAlert.user).select('firstName lastName phone')
      }
    });

  } catch (error) {
    logger.error(`Erreur appel secours: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'appel aux secours'
    });
  }
};

// Fonction utilitaire pour calculer la distance
function calculateDistance(coord1, coord2) {
  const [lng1, lat1] = coord1;
  const [lng2, lat2] = coord2;
  
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}