import Intervention from '../models/Intervention.js';
import SOSAlert from '../models/SOSAlert.js';
import Vehicle from '../models/Vehicle.js';
import VehicleLog from '../models/VehicleLog.js';
import User from '../models/User.js';
import Helper from '../models/Helper.js';
import { sendSMS, notifyUserHelperOnWay } from '../services/smsService.js';
import { sendInterventionConfirmation } from '../services/emailService.js';
import { calculateDistance } from '../services/mapService.js';
import logger from '../config/logger.js';

// @desc    Créer une intervention (depuis un SOS ou direct)
// @route   POST /api/interventions
// @access  Private
export const createIntervention = async (req, res) => {
  try {
    const {
      type,
      problem,
      location,
      destination,
      sosAlertId,
      helperId,
      vehicleId  // ⚡ NOUVEAU : ID du véhicule
    } = req.body;

    // Vérifier si c'est lié à un SOS
    let sosAlert = null;
    if (sosAlertId) {
      sosAlert = await SOSAlert.findById(sosAlertId);
      if (!sosAlert) {
        return res.status(404).json({
          success: false,
          message: 'Alerte SOS non trouvée'
        });
      }
    }

    // ⚡ Si un véhicule est fourni, vérifier qu'il appartient à l'utilisateur
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

    // Créer l'intervention
    const intervention = await Intervention.create({
      user: req.user._id,
      helper: helperId,
      sosAlert: sosAlertId,
      vehicle: vehicleId, // ⚡ AJOUT
      type: type || 'assistance',
      status: 'pending',
      problem: {
        description: problem.description,
        category: problem.category,
        severity: problem.severity || 'medium',
        photos: problem.photos || [],
        diagnostic: problem.diagnostic
      },
      location: {
        type: 'Point',
        coordinates: location.coordinates,
        address: location.address
      },
      destination: destination ? {
        type: 'Point',
        coordinates: destination.coordinates,
        address: destination.address
      } : undefined,
      timeline: [{
        status: 'pending',
        timestamp: new Date(),
        note: 'Intervention créée'
      }]
    });

    // Si c'était un SOS, le mettre à jour
    if (sosAlert) {
      sosAlert.intervention = intervention._id;
      sosAlert.status = 'dispatched';
      sosAlert.timeline.push({
        event: 'Intervention créée',
        timestamp: new Date()
      });
      await sosAlert.save();
    }

    // ⚡ AJOUTER UN LOG DANS LE JOURNAL DU VÉHICULE
    if (vehicle) {
      await VehicleLog.create({
        vehicle: vehicle._id,
        user: req.user._id,
        intervention: intervention._id,
        type: 'intervention',
        title: `Intervention ${type}`,
        description: problem.description || 'Intervention en cours',
        metadata: {
          interventionId: intervention._id,
          helperId: helperId,
          status: 'pending'
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Intervention créée',
      data: intervention
    });

  } catch (error) {
    logger.error(`Erreur création intervention: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'intervention'
    });
  }
};

// backend/src/controllers/interventionController.js

// @desc    Obtenir toutes les interventions de l'utilisateur
// @route   GET /api/interventions
// @access  Private
export const getUserInterventions = async (req, res) => {
  try {
    const interventions = await Intervention.find({ user: req.user._id })
      .populate({
        path: 'helper',
        populate: {
          path: 'user',
          select: 'firstName lastName phone email photo'
        }
      })
      .populate('sosAlert')
      .populate('vehicle')
      .sort('-createdAt');

    res.json({
      success: true,
      count: interventions.length,
      data: interventions
    });

  } catch (error) {
    logger.error(`Erreur récupération interventions: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des interventions'
    });
  }
};

// @desc    Obtenir une intervention par ID
// @route   GET /api/interventions/:id
// @access  Private
// backend/src/controllers/interventionController.js
// Modifier la fonction getInterventionById

export const getInterventionById = async (req, res) => {
  try {
    const intervention = await Intervention.findById(req.params.id)
      .populate('user', 'firstName lastName phone email')
      .populate({
        path: 'helper',
        populate: {
          path: 'user',
          select: 'firstName lastName phone email photo'
        }
      })
      .populate('sosAlert')
      .populate('vehicle'); // ⚡ AJOUT

    if (!intervention) {
      return res.status(404).json({
        success: false,
        message: 'Intervention non trouvée'
      });
    }

    const isUser = intervention.user._id.toString() === req.user._id.toString();
    const isHelper = intervention.helper?.user?._id?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isUser && !isHelper && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    res.json({
      success: true,
      data: intervention
    });

  } catch (error) {
    logger.error(`Erreur récupération intervention: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'intervention'
    });
  }
};

// @desc    Mettre à jour le statut d'une intervention
// @route   PUT /api/interventions/:id/status
// @access  Private
export const updateInterventionStatus = async (req, res) => {
  try {
    const { status, note, location } = req.body;
    
    const intervention = await Intervention.findById(req.params.id)
      .populate('user')
      .populate('helper')
      .populate('vehicle'); // ⚡ AJOUT

    if (!intervention) {
      return res.status(404).json({
        success: false,
        message: 'Intervention non trouvée'
      });
    }

    const isHelper = intervention.helper?.user?.toString() === req.user._id.toString();
    const isUser = intervention.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isHelper && !isUser && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    const oldStatus = intervention.status;
    intervention.timeline.push({
      status,
      timestamp: new Date(),
      note: note || `Statut mis à jour: ${status}`,
      location
    });

    intervention.status = status;

    // Actions spécifiques selon le statut
    switch (status) {
      case 'accepted':
        if (isHelper && intervention.helper) {
          if (intervention.location?.coordinates) {
            const eta = 15;
            intervention.eta = eta;
            await notifyUserHelperOnWay(
              intervention.user,
              intervention.helper,
              eta
            );
          }
        }
        break;

      case 'completed':
        intervention.completedAt = new Date();
        
        if (intervention.helper) {
          await Helper.findByIdAndUpdate(intervention.helper._id, {
            $inc: {
              'stats.completedInterventions': 1,
              'stats.totalInterventions': 1
            }
          });
        }
        
        await User.findByIdAndUpdate(intervention.user._id, {
          $inc: {
            'stats.interventionsAsUser': 1
          }
        });
        break;

      case 'cancelled':
        intervention.cancelledAt = new Date();
        intervention.cancellation = {
          cancelledBy: isHelper ? 'helper' : (isUser ? 'user' : 'system'),
          reason: note || 'Annulée',
          cancelledAt: new Date()
        };
        break;
    }

    await intervention.save();

    // ⚡ AJOUTER UN LOG DANS LE JOURNAL DU VÉHICULE SI LE STATUT A CHANGÉ
    if (intervention.vehicle && oldStatus !== status) {
      await VehicleLog.create({
        vehicle: intervention.vehicle._id,
        user: req.user._id,
        intervention: intervention._id,
        type: 'intervention',
        title: `Statut intervention: ${status}`,
        description: `Changement de statut de ${oldStatus} à ${status}`,
        metadata: {
          interventionId: intervention._id,
          oldStatus,
          newStatus: status,
          updatedBy: isHelper ? 'helper' : (isUser ? 'user' : 'system')
        }
      });
    }

    if (status === 'accepted' && intervention.user?.phone) {
      await sendSMS(
        intervention.user.phone,
        `✅ Votre intervention #${intervention._id} a été acceptée. Un helper arrive !`
      );
    }

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

// @desc    Assigner un helper à une intervention
// @route   PUT /api/interventions/:id/assign
// @access  Private (helper ou admin)
export const assignHelper = async (req, res) => {
  try {
    const { helperId } = req.body;
    
    const intervention = await Intervention.findById(req.params.id);

    if (!intervention) {
      return res.status(404).json({
        success: false,
        message: 'Intervention non trouvée'
      });
    }

    if (intervention.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cette intervention n\'est plus disponible'
      });
    }

    let helper;
    if (helperId) {
      helper = await Helper.findById(helperId).populate('user');
      if (!helper || helper.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'Helper non disponible'
        });
      }
    } else {
      helper = await Helper.findOne({ user: req.user._id }).populate('user');
      if (!helper) {
        return res.status(403).json({
          success: false,
          message: 'Vous n\'êtes pas un helper'
        });
      }
    }

    intervention.helper = helper._id;
    intervention.status = 'accepted';
    intervention.timeline.push({
      status: 'accepted',
      timestamp: new Date(),
      note: `Helper assigné: ${helper.user.firstName} ${helper.user.lastName}`
    });

    await intervention.save();

    const user = await User.findById(intervention.user);
    if (user?.phone) {
      await sendSMS(
        user.phone,
        `✅ Un helper a été assigné à votre intervention ! ${helper.user.firstName} arrive.`
      );
    }

    await sendInterventionConfirmation(user, intervention, helper);

    res.json({
      success: true,
      message: 'Helper assigné',
      data: intervention
    });

  } catch (error) {
    logger.error(`Erreur assignation helper: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'assignation du helper'
    });
  }
};

// @desc    Ajouter un message à une intervention
// @route   POST /api/interventions/:id/messages
// @access  Private
export const addMessage = async (req, res) => {
  try {
    const { content } = req.body;
    
    const intervention = await Intervention.findById(req.params.id);

    if (!intervention) {
      return res.status(404).json({
        success: false,
        message: 'Intervention non trouvée'
      });
    }

    const isUser = intervention.user.toString() === req.user._id.toString();
    const isHelper = intervention.helper?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isUser && !isHelper && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    intervention.communication.messages.push({
      sender: isHelper ? 'helper' : (isUser ? 'user' : 'system'),
      content,
      timestamp: new Date()
    });
    intervention.communication.lastMessageAt = new Date();

    await intervention.save();

    res.json({
      success: true,
      message: 'Message ajouté',
      data: intervention.communication.messages
    });

  } catch (error) {
    logger.error(`Erreur ajout message: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout du message'
    });
  }
};

// @desc    Ajouter une évaluation à une intervention
// @route   POST /api/interventions/:id/review
// @access  Private (user uniquement)
export const addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    const intervention = await Intervention.findById(req.params.id);

    if (!intervention) {
      return res.status(404).json({
        success: false,
        message: 'Intervention non trouvée'
      });
    }

    if (intervention.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Seul l\'utilisateur peut évaluer l\'intervention'
      });
    }

    if (intervention.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Impossible d\'évaluer une intervention non terminée'
      });
    }

    intervention.review = {
      rating,
      comment,
      createdAt: new Date()
    };

    await intervention.save();

    if (intervention.helper) {
      const helper = await Helper.findById(intervention.helper);
      const reviews = await Intervention.find({
        helper: intervention.helper,
        'review.rating': { $exists: true }
      }).select('review.rating');
      
      const total = reviews.reduce((sum, r) => sum + r.review.rating, 0);
      helper.stats.averageRating = total / reviews.length;
      helper.reviews.push({
        user: req.user._id,
        rating,
        comment,
        createdAt: new Date()
      });
      
      await helper.save();
    }

    res.json({
      success: true,
      message: 'Évaluation ajoutée',
      data: intervention.review
    });

  } catch (error) {
    logger.error(`Erreur ajout évaluation: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout de l\'évaluation'
    });
  }
};

// @desc    Obtenir les interventions actives (pour helpers)
// @route   GET /api/interventions/active
// @access  Private
export const getActiveInterventions = async (req, res) => {
  try {
    const query = { status: { $in: ['accepted', 'en_route', 'arrived', 'in_progress'] } };

    const helper = await Helper.findOne({ user: req.user._id });
    if (helper) {
      query.helper = helper._id;
    } else {
      query.user = req.user._id;
    }

    const interventions = await Intervention.find(query)
      .populate('user', 'firstName lastName phone')
      .populate('helper')
      .populate('sosAlert')
      .populate('vehicle') // ⚡ AJOUT
      .sort('-updatedAt');

    res.json({
      success: true,
      count: interventions.length,
      data: interventions
    });

  } catch (error) {
    logger.error(`Erreur récupération actives: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des interventions actives'
    });
  }
};

// backend/src/controllers/interventionController.js
// REMPLACEZ la fonction cancelIntervention par celle-ci

// backend/src/controllers/interventionController.js
export const cancelIntervention = async (req, res) => {
  try {
    const { reason } = req.body;
    const intervention = await Intervention.findById(req.params.id)
      .populate('user', 'firstName lastName phone')
      .populate('helper');

    if (!intervention) {
      return res.status(404).json({
        success: false,
        message: 'Intervention non trouvée'
      });
    }

    const isUser = intervention.user._id.toString() === req.user._id.toString();
    const isHelper = intervention.helper?._id?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isUser && !isHelper && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    if (intervention.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Impossible d\'annuler une intervention déjà terminée'
      });
    }

    const oldStatus = intervention.status;
    
    intervention.status = 'cancelled';
    intervention.cancelledAt = new Date();
    intervention.cancellation = {
      cancelledBy: isUser ? 'user' : (isHelper ? 'helper' : 'system'),
      reason: reason || `Annulé par ${isUser ? 'l\'utilisateur' : (isHelper ? 'le helper' : 'le système')}`,
      cancelledAt: new Date()
    };
    
    intervention.timeline.push({
      status: 'cancelled',
      timestamp: new Date(),
      note: reason || `Annulé par ${isUser ? 'l\'utilisateur' : (isHelper ? 'le helper' : 'le système')}`,
      location: req.body.location || null
    });

    await intervention.save();
    
    console.log(`✅ Intervention ${intervention._id} annulée: ${oldStatus} -> cancelled`);

    let io = null;
    try {
      const socketModule = await import('../socket/index.js');
      io = socketModule.getIO();
    } catch (importError) {
      console.error('❌ Erreur import socket module:', importError.message);
    }

    if (io) {
      const missionTitle = `${intervention.type === 'sos' ? 'SOS' : 'Assistance'}${intervention.problem?.category ? ` - ${intervention.problem.category}` : ''}`;
      
      // Événement pour tous les helpers (simple)
      io.emit('mission-cancelled', {
        missionId: intervention._id,
        reason: reason || `Annulé par ${isUser ? 'le client' : (isHelper ? 'le helper' : 'le système')}`,
        location: intervention.location,
        reward: intervention.pricing?.final || 0
      });
      
      // Événement détaillé avec qui a annulé
      io.emit('mission-cancelled-detail', {
        missionId: intervention._id,
        cancelledBy: isUser ? 'user' : (isHelper ? 'helper' : 'system'),
        reason: reason || (isUser ? 'Annulé par le client' : (isHelper ? 'Annulé par le helper' : 'Annulé par le système')),
        missionTitle: missionTitle
      });
      
      // Notifier spécifiquement le client si c'est le helper qui annule
      if (isHelper && intervention.user) {
        io.to(`user:${intervention.user._id}`).emit('mission-cancelled-detail', {
          missionId: intervention._id,
          cancelledBy: 'helper',
          reason: reason || 'Annulé par le helper',
          missionTitle: missionTitle
        });
      }
      
      console.log(`📢 Événements d'annulation émis pour mission ${intervention._id}`);
    }

    res.json({
      success: true,
      message: 'Intervention annulée avec succès',
      data: {
        _id: intervention._id,
        status: intervention.status,
        cancellation: intervention.cancellation,
        timeline: intervention.timeline.slice(-3)
      }
    });

  } catch (error) {
    console.error('❌ Erreur annulation:', error);
    logger.error(`Erreur annulation: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'annulation',
      error: error.message
    });
  }
};

// backend/src/controllers/interventionController.js
// Ajouter à la fin du fichier

// @desc    Récupérer la position du helper pour une intervention
// @route   GET /api/interventions/:id/helper-location
// @access  Private
export const getHelperLocation = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`📍 Récupération position helper - Intervention: ${id}`);

    const intervention = await Intervention.findById(id)
      .populate('helper', 'user');

    if (!intervention) {
      return res.status(404).json({
        success: false,
        message: 'Intervention non trouvée'
      });
    }

    // Vérifier que l'utilisateur est le client ou le helper
    const isUser = intervention.user.toString() === req.user._id.toString();
    const isHelper = intervention.helper?.user?._id?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isUser && !isHelper && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    // Si pas de position, retourner null
    if (!intervention.helperLocation || !intervention.helperLocation.coordinates) {
      return res.json({
        success: true,
        data: null
      });
    }

    // Formater la réponse
    const [longitude, latitude] = intervention.helperLocation.coordinates;

    res.json({
      success: true,
      data: {
        latitude,
        longitude,
        accuracy: intervention.helperLocation.accuracy || 10,
        updatedAt: intervention.helperLocation.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ Erreur getHelperLocation:', error);
    logger.error(`Erreur getHelperLocation: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la position'
    });
  }
};