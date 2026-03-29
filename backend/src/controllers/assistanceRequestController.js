// backend/src/controllers/assistanceRequestController.js
import AssistanceRequest from '../models/AssistanceRequest.js';
import Helper from '../models/Helper.js';
import Garage from '../models/Garage.js';
import Towing from '../models/Towing.js';
import Vehicle from '../models/Vehicle.js';
import { sendSMS } from '../services/smsService.js';
import logger from '../config/logger.js';

// ============================================
// CRÉER UNE DEMANDE D'ASSISTANCE
// ============================================

// @desc    Créer une demande d'assistance
// @route   POST /api/assistance/request
// @access  Private
export const createAssistanceRequest = async (req, res) => {
  try {
    const {
      type,
      targetId,
      vehicleId,
      problem,
      location
    } = req.body;

    console.log(`📝 Création demande assistance - Type: ${type}, Target: ${targetId}`);

    // Validation
    if (!type || !targetId || !location?.coordinates) {
      return res.status(400).json({
        success: false,
        message: 'Type, targetId et coordonnées requis'
      });
    }

    // Vérifier que le véhicule existe et appartient à l'utilisateur
    let vehicle = null;
    if (vehicleId) {
      vehicle = await Vehicle.findOne({
        _id: vehicleId,
        'owners.user': req.user._id,
        status: 'active'
      });
      
      if (!vehicle) {
        return res.status(400).json({
          success: false,
          message: 'Véhicule non trouvé ou non autorisé'
        });
      }
    }

    // Vérifier que la cible existe selon le type
    let target = null;
    if (type === 'helper') {
      target = await Helper.findById(targetId).populate('user', 'firstName lastName phone email');
      if (!target || target.status !== 'active') {
        return res.status(404).json({
          success: false,
          message: 'Helper non disponible'
        });
      }
    } else if (type === 'garage') {
      target = await Garage.findById(targetId);
      if (!target || target.status !== 'active') {
        return res.status(404).json({
          success: false,
          message: 'Garage non disponible'
        });
      }
    } else if (type === 'towing') {
      target = await Towing.findById(targetId);
      if (!target || target.status !== 'active') {
        return res.status(404).json({
          success: false,
          message: 'Service de remorquage non disponible'
        });
      }
    }

    if (!target) {
      return res.status(404).json({
        success: false,
        message: 'Service non trouvé'
      });
    }

    // Créer la demande
    const request = await AssistanceRequest.create({
      user: req.user._id,
      type,
      targetId,
      vehicle: vehicleId,
      problem: {
        description: problem?.description || '',
        category: problem?.category || 'other',
        severity: problem?.severity || 'medium',
        photos: problem?.photos || []
      },
      location: {
        type: 'Point',
        coordinates: location.coordinates,
        address: location.address || ''
      },
      timeline: [{
        status: 'pending',
        timestamp: new Date(),
        note: 'Demande créée'
      }]
    });

    // Calculer l'ETA approximatif
    let eta = 15;
    if (target.location?.coordinates && location.coordinates) {
      const [targetLng, targetLat] = target.location.coordinates;
      const distance = calculateDistance(
        location.coordinates[1],
        location.coordinates[0],
        targetLat,
        targetLng
      );
      eta = Math.round(distance * 2);
    }

    // Mettre à jour la demande avec l'ETA
    request.eta = eta;
    await request.save();

    // Notifier le prestataire (helper/garage/towing) par SMS
    if (type === 'helper' && target.user?.phone) {
      await sendSMS(
        target.user.phone,
        `🆕 NOUVELLE DEMANDE D'ASSISTANCE\n\n` +
        `Client: ${req.user.firstName} ${req.user.lastName}\n` +
        `Problème: ${problem?.description || 'Non spécifié'}\n` +
        `Distance: ${eta} min\n\n` +
        `Acceptez la demande dans l'application Kadima Helpers.`
      );
    } else if (target.phone) {
      await sendSMS(
        target.phone,
        `🆕 NOUVELLE DEMANDE D'ASSISTANCE\n\n` +
        `Client: ${req.user.firstName} ${req.user.lastName}\n` +
        `Problème: ${problem?.description || 'Non spécifié'}\n` +
        `Distance: ${eta} min\n\n` +
        `Acceptez la demande en appelant le client au ${req.user.phone}.`
      );
    }

    logger.info(`✅ Demande d'assistance créée: ${request._id} pour ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Demande envoyée avec succès',
      data: {
        requestId: request._id,
        status: request.status,
        eta
      }
    });

  } catch (error) {
    console.error('❌ Erreur createAssistanceRequest:', error);
    logger.error(`Erreur createAssistanceRequest: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la demande'
    });
  }
};

// ============================================
// RÉCUPÉRER LES DEMANDES
// ============================================

// @desc    Obtenir les demandes actives de l'utilisateur
// @route   GET /api/assistance/active
// @access  Private
export const getActiveRequests = async (req, res) => {
  try {
    const requests = await AssistanceRequest.find({
      user: req.user._id,
      status: { $in: ['pending', 'accepted', 'en_route', 'arrived', 'in_progress'] }
    })
      .sort('-createdAt')
      .populate('vehicle', 'make model licensePlate')
      .lean();

    // Enrichir avec les détails du prestataire
    const enrichedRequests = await Promise.all(requests.map(async (req) => {
      let provider = null;
      if (req.type === 'helper') {
        provider = await Helper.findById(req.targetId).populate('user', 'firstName lastName phone');
      } else if (req.type === 'garage') {
        provider = await Garage.findById(req.targetId);
      } else if (req.type === 'towing') {
        provider = await Towing.findById(req.targetId);
      }
      return { ...req, provider };
    }));

    res.json({
      success: true,
      count: enrichedRequests.length,
      data: enrichedRequests
    });

  } catch (error) {
    logger.error(`Erreur getActiveRequests: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des demandes'
    });
  }
};

// @desc    Obtenir une demande par ID
// @route   GET /api/assistance/:id
// @access  Private
export const getRequestById = async (req, res) => {
  try {
    const request = await AssistanceRequest.findById(req.params.id)
      .populate('user', 'firstName lastName phone')
      .populate('vehicle', 'make model licensePlate');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Demande non trouvée'
      });
    }

    // Vérifier que l'utilisateur est le demandeur
    if (request.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    // Récupérer les détails du prestataire
    let provider = null;
    if (request.type === 'helper') {
      provider = await Helper.findById(request.targetId).populate('user', 'firstName lastName phone photo');
    } else if (request.type === 'garage') {
      provider = await Garage.findById(request.targetId);
    } else if (request.type === 'towing') {
      provider = await Towing.findById(request.targetId);
    }

    res.json({
      success: true,
      data: { ...request.toObject(), provider }
    });

  } catch (error) {
    logger.error(`Erreur getRequestById: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la demande'
    });
  }
};

// ============================================
// METTRE À JOUR LE STATUT
// ============================================

// @desc    Mettre à jour le statut d'une demande
// @route   PUT /api/assistance/:id/status
// @access  Private (prestataire ou système)
export const updateRequestStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const request = await AssistanceRequest.findById(req.params.id)
      .populate('user', 'firstName lastName phone');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Demande non trouvée'
      });
    }

    request.status = status;
    request.timeline.push({
      status,
      timestamp: new Date(),
      note: note || `Statut mis à jour: ${status}`
    });

    if (status === 'accepted') {
      request.acceptedAt = new Date();
      
      // Notifier l'utilisateur
      if (request.user?.phone) {
        await sendSMS(
          request.user.phone,
          `✅ Votre demande d'assistance a été acceptée !\n\n` +
          `Un prestataire arrive dans environ ${request.eta} minutes.\n` +
          `Suivez son arrivée dans l'application.`
        );
      }
    }

    if (status === 'completed') {
      request.completedAt = new Date();
    }

    if (status === 'cancelled') {
      request.cancelledAt = new Date();
      request.cancellationReason = note;
    }

    await request.save();

    res.json({
      success: true,
      message: 'Statut mis à jour',
      data: request
    });

  } catch (error) {
    logger.error(`Erreur updateRequestStatus: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut'
    });
  }
};

// ============================================
// ANNULER UNE DEMANDE
// ============================================

// @desc    Annuler une demande
// @route   PUT /api/assistance/:id/cancel
// @access  Private
export const cancelRequest = async (req, res) => {
  try {
    const { reason } = req.body;
    const request = await AssistanceRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Demande non trouvée'
      });
    }

    if (request.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Seul le demandeur peut annuler'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Impossible d\'annuler une demande déjà acceptée'
      });
    }

    request.status = 'cancelled';
    request.cancelledAt = new Date();
    request.cancellationReason = reason || 'Annulé par l\'utilisateur';
    request.timeline.push({
      status: 'cancelled',
      timestamp: new Date(),
      note: reason || 'Annulé par l\'utilisateur'
    });

    await request.save();

    res.json({
      success: true,
      message: 'Demande annulée',
      data: request
    });

  } catch (error) {
    logger.error(`Erreur cancelRequest: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'annulation'
    });
  }
};

// ============================================
// CHAT
// ============================================

// @desc    Ajouter un message à une demande
// @route   POST /api/assistance/:id/messages
// @access  Private
export const addMessage = async (req, res) => {
  try {
    const { content, sender = 'user' } = req.body;
    const request = await AssistanceRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Demande non trouvée'
      });
    }

    if (request.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    request.messages.push({
      sender,
      content,
      timestamp: new Date()
    });

    await request.save();

    res.json({
      success: true,
      message: 'Message ajouté',
      data: request.messages
    });

  } catch (error) {
    logger.error(`Erreur addMessage: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout du message'
    });
  }
};

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}