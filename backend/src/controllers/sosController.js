import SOSAlert from '../models/SOSAlert.js';
import Helper from '../models/Helper.js';
import User from '../models/User.js';
import Intervention from '../models/Intervention.js';
import Vehicle from '../models/Vehicle.js'; // ⚡ NOUVEAU
import VehicleLog from '../models/VehicleLog.js'; // ⚡ NOUVEAU
import logger from '../config/logger.js';

// backend/src/controllers/sosController.js

// @desc    Créer une alerte SOS
// @route   POST /api/sos
// @access  Private
export const createSOSAlert = async (req, res) => {
  try {
    const {
      location,
      vehicle,
      problem,
      emergencyContacts,
      vehicleId
    } = req.body;

    if (!location || !location.coordinates) {
      return res.status(400).json({
        success: false,
        message: 'La position est requise'
      });
    }

    // Récupérer le véhicule si vehicleId est fourni
    let vehicleInfo = vehicle;
    let vehicleRef = null;
    
    if (vehicleId) {
      const vehicleDoc = await Vehicle.findOne({
        _id: vehicleId,
        'owners.user': req.user._id,
        status: 'active'
      });
      
      if (vehicleDoc) {
        vehicleRef = vehicleDoc._id;
        vehicleInfo = {
          make: vehicleDoc.make,
          model: vehicleDoc.model,
          year: vehicleDoc.year,
          licensePlate: vehicleDoc.licensePlate,
          color: vehicleDoc.color,
          currentMileage: vehicleDoc.currentMileage
        };
      }
    }

    console.log("📍 Location reçue du client:", location);
console.log("📍 Address reçue:", location?.address);
console.log("📍 Coordinates reçues:", location?.coordinates);
    // 1. Créer l'alerte SOS
    const sosAlert = await SOSAlert.create({
      user: req.user._id,
      vehicleRef,
      vehicle: vehicleInfo,
      location: {
        type: 'Point',
        coordinates: location.coordinates,
        address: location.address,
        accuracy: location.accuracy
      },
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

    console.log("📍 SOS créé à:", location.coordinates);
    console.log("🚗 vehicleRef:", vehicleRef);
    console.log("🚗 vehicle snapshot:", vehicleInfo);

    // 2. Trouver les helpers actifs à proximité
    const allHelpers = await Helper.find({
      'availability.isAvailable': true,
      status: 'active'
    }).populate('user', 'firstName lastName phone');

    console.log(`🔍 ${allHelpers.length} helpers actifs trouvés au total`);

    // 3. Calculer la distance pour chaque helper
    const helperNotifications = allHelpers.map(helper => {
      let distance = null;
      
      if (helper.serviceArea?.coordinates) {
        distance = calculateDistance(
          location.coordinates,
          helper.serviceArea.coordinates
        );
      }

      return {
        helper: helper._id,
        distance: distance || 999999,
        notifiedAt: new Date()
      };
    });

    // 4. Trier par distance
    helperNotifications.sort((a, b) => a.distance - b.distance);

    // 5. Sauvegarder dans le SOS
    sosAlert.notifications.nearbyHelpers = helperNotifications;
    sosAlert.timeline.push({
      event: `${helperNotifications.length} helpers trouvés au total`,
      timestamp: new Date(),
      data: { 
        total: helperNotifications.length,
        withCoordinates: allHelpers.filter(h => h.serviceArea?.coordinates).length
      }
    });

    await sosAlert.save();

    // 6. ✅ ÉMETTRE L'ÉVÉNEMENT new-mission POUR TOUS LES HELPERS
    try {
      const { getIO } = await import('../socket/index.js');
      const io = getIO();
      
      // Émettre à tous les helpers connectés
      io.emit('new-mission', {
        sosId: sosAlert._id,
        location: sosAlert.location,
        problem: sosAlert.problem,
        vehicle: vehicleInfo,
        createdAt: sosAlert.createdAt,
        user: {
          firstName: req.user.firstName,
          lastName: req.user.lastName
        }
      });
      
      console.log("📢 Événement new-mission émis pour le SOS:", sosAlert._id);
    } catch (socketError) {
      console.error("⚠️ Erreur émission socket (non bloquante):", socketError.message);
    }

    // ⚡ AJOUT : Log dans le journal du véhicule
    if (vehicleRef) {
      await VehicleLog.create({
        vehicle: vehicleRef,
        user: req.user._id,
        type: 'sos',
        title: `Alerte SOS envoyée`,
        description: problem?.description || 'SOS envoyé',
        metadata: {
          sosId: sosAlert._id,
          problem: problem?.category,
          location: location.coordinates
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Alerte SOS créée',
      data: {
        sosAlert,
        totalHelpers: helperNotifications.length
      }
    });

  } catch (error) {
    console.error(`Erreur création SOS: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'alerte SOS'
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
    }).populate('user', 'firstName lastName phone')
      .populate('vehicleRef'); // ⚡ AJOUT : populate du véhicule

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
    const sosAlert = await SOSAlert.findById(req.params.id).populate('vehicleRef'); // ⚡ AJOUT

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
      vehicle: sosAlert.vehicleRef, // ⚡ AJOUT : lier le véhicule
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

    sosAlert.status = 'dispatched';
    sosAlert.intervention = intervention._id;
    sosAlert.timeline.push({
      event: 'Alerte acceptée par helper',
      timestamp: new Date()
    });

    await sosAlert.save();

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

    const isHelper = intervention.helper?.toString() === req.user._id?.toString();
    const isUser = intervention.user.toString() === req.user._id.toString();

    if (!isHelper && !isUser) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    intervention.timeline.push({
      status,
      timestamp: new Date(),
      note,
      location
    });

    intervention.status = status;

    if (status === 'completed') {
      intervention.completedAt = new Date();
      
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

// @desc    Obtenir une alerte SOS par ID
// @route   GET /api/sos/:id
// @access  Private
export const getSOSById = async (req, res) => {
  try {
    const sosAlert = await SOSAlert.findById(req.params.id)
      .populate({
        path: 'notifications.nearbyHelpers.helper',
        populate: { path: 'user', select: 'firstName lastName phone' }
      })
      .populate({
        path: 'intervention',
        populate: {
          path: 'helper',
          populate: { path: 'user', select: 'firstName lastName phone photo' }
        }
      })
      .populate('vehicleRef'); // ⚡ AJOUT

    if (!sosAlert) {
      return res.status(404).json({
        success: false,
        message: 'Alerte SOS non trouvée'
      });
    }

    if (sosAlert.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    res.json({
      success: true,
      data: sosAlert
    });

  } catch (error) {
    logger.error(`Erreur getSOSById: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'alerte'
    });
  }
};

// @desc    Annuler une alerte SOS
// @route   PUT /api/sos/:id/cancel
// @access  Private
// backend/src/controllers/sosController.js
// Modifier la fonction cancelSOS (vers la fin du fichier)

export const cancelSOS = async (req, res) => {
  try {
    const sosAlert = await SOSAlert.findById(req.params.id);

    if (!sosAlert) {
      return res.status(404).json({
        success: false,
        message: 'Alerte SOS non trouvée'
      });
    }

    if (sosAlert.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    if (sosAlert.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Impossible d\'annuler cette alerte'
      });
    }

    sosAlert.status = 'cancelled';
    sosAlert.timeline.push({
      event: 'Alerte annulée par l\'utilisateur',
      timestamp: new Date()
    });

    await sosAlert.save();

    // ============================================
    // ⚡ AJOUT : Émettre l'événement WebSocket pour annuler la mission
    // ============================================
    try {
      const { getIO } = await import('../socket/index.js');
      const io = getIO();
      
      // Récupérer les helpers notifiés pour ce SOS
      const notifiedHelpers = sosAlert.notifications?.nearbyHelpers || [];
      
      // Émettre à TOUS les helpers (pour les alertes actives)
      io.emit('mission-cancelled', {
        missionId: sosAlert._id,
        reason: 'Annulé par le client',
        location: sosAlert.location,
        reward: 0
      });
      
      // Émettre le détail d'annulation pour les modales
      const missionTitle = `SOS${sosAlert.problem?.category ? ` - ${sosAlert.problem.category}` : ''}`;
      
      io.emit('mission-cancelled-detail', {
        missionId: sosAlert._id,
        cancelledBy: 'user',
        reason: 'Le client a annulé la demande',
        missionTitle: missionTitle
      });
      
      console.log(`📢 SOS annulé - Événements émis pour ${sosAlert._id}`);
    } catch (socketError) {
      console.error('⚠️ Erreur émission socket (non bloquante):', socketError.message);
    }

    res.json({
      success: true,
      message: 'Alerte annulée',
      data: sosAlert
    });

  } catch (error) {
    logger.error(`Erreur cancelSOS: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'annulation'
    });
  }
};