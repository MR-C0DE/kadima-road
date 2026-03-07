import Intervention from '../models/Intervention.js';
import SOSAlert from '../models/SOSAlert.js';
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
      helperId
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

    // Créer l'intervention
    const intervention = await Intervention.create({
      user: req.user._id,
      helper: helperId,
      sosAlert: sosAlertId,
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

// @desc    Obtenir toutes les interventions de l'utilisateur
// @route   GET /api/interventions
// @access  Private
export const getUserInterventions = async (req, res) => {
  try {
    const interventions = await Intervention.find({ user: req.user._id })
      .populate('helper')
      .populate('sosAlert')
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
export const getInterventionById = async (req, res) => {
  try {
    const intervention = await Intervention.findById(req.params.id)
      .populate('user', 'firstName lastName phone email')
      .populate('helper')
      .populate('sosAlert');

    if (!intervention) {
      return res.status(404).json({
        success: false,
        message: 'Intervention non trouvée'
      });
    }

    // Vérifier que l'utilisateur a le droit
    const isUser = intervention.user._id.toString() === req.user._id.toString();
    const isHelper = intervention.helper?.user?.toString() === req.user._id.toString();
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
      .populate('helper');

    if (!intervention) {
      return res.status(404).json({
        success: false,
        message: 'Intervention non trouvée'
      });
    }

    // Vérifier les permissions
    const isHelper = intervention.helper?.user?.toString() === req.user._id.toString();
    const isUser = intervention.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isHelper && !isUser && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    // Ajouter au timeline
    intervention.timeline.push({
      status,
      timestamp: new Date(),
      note: note || `Statut mis à jour: ${status}`,
      location
    });

    // Mettre à jour le statut
    intervention.status = status;

    // Actions spécifiques selon le statut
    switch (status) {
      case 'accepted':
        if (isHelper && intervention.helper) {
          // Calculer le temps d'arrivée estimé
          if (intervention.location?.coordinates) {
            const [lng, lat] = intervention.location.coordinates;
            // Simuler un calcul de distance (à améliorer avec Google Maps)
            const eta = 15; // minutes
            intervention.eta = eta;
            
            // Notifier l'utilisateur
            await notifyUserHelperOnWay(
              intervention.user,
              intervention.helper,
              eta
            );
          }
        }
        break;

      case 'en_route':
        // Rien de spécial
        break;

      case 'arrived':
        // Le helper est arrivé
        break;

      case 'in_progress':
        // Travail en cours
        break;

      case 'completed':
        intervention.completedAt = new Date();
        
        // Mettre à jour les stats du helper
        if (intervention.helper) {
          await Helper.findByIdAndUpdate(intervention.helper._id, {
            $inc: {
              'stats.completedInterventions': 1,
              'stats.totalInterventions': 1
            }
          });
        }
        
        // Mettre à jour les stats de l'utilisateur
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

    // Envoyer une notification si nécessaire
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

    // Vérifier que l'intervention est en attente
    if (intervention.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cette intervention n\'est plus disponible'
      });
    }

    // Vérifier le helper
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
      // Le helper connecté s'assigne lui-même
      helper = await Helper.findOne({ user: req.user._id }).populate('user');
      if (!helper) {
        return res.status(403).json({
          success: false,
          message: 'Vous n\'êtes pas un helper'
        });
      }
    }

    // Assigner le helper
    intervention.helper = helper._id;
    intervention.status = 'accepted';
    intervention.timeline.push({
      status: 'accepted',
      timestamp: new Date(),
      note: `Helper assigné: ${helper.user.firstName} ${helper.user.lastName}`
    });

    await intervention.save();

    // Notifier l'utilisateur
    const user = await User.findById(intervention.user);
    if (user?.phone) {
      await sendSMS(
        user.phone,
        `✅ Un helper a été assigné à votre intervention ! ${helper.user.firstName} arrive.`
      );
    }

    // Envoyer email de confirmation
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

    // Vérifier les permissions
    const isUser = intervention.user.toString() === req.user._id.toString();
    const isHelper = intervention.helper?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isUser && !isHelper && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    // Ajouter le message
    intervention.communication.messages.push({
      sender: isHelper ? 'helper' : (isUser ? 'user' : 'system'),
      content,
      timestamp: new Date()
    });
    intervention.communication.lastMessageAt = new Date();

    await intervention.save();

    // TODO: Envoyer notification push à l'autre partie

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

    // Vérifier que c'est l'utilisateur concerné
    if (intervention.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Seul l\'utilisateur peut évaluer l\'intervention'
      });
    }

    // Vérifier que l'intervention est terminée
    if (intervention.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Impossible d\'évaluer une intervention non terminée'
      });
    }

    // Ajouter l'évaluation
    intervention.review = {
      rating,
      comment,
      createdAt: new Date()
    };

    await intervention.save();

    // Mettre à jour la note moyenne du helper
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

    // Si c'est un helper, seulement ses interventions
    const helper = await Helper.findOne({ user: req.user._id });
    if (helper) {
      query.helper = helper._id;
    } else {
      // Sinon, seulement les interventions de l'utilisateur
      query.user = req.user._id;
    }

    const interventions = await Intervention.find(query)
      .populate('user', 'firstName lastName phone')
      .populate('helper')
      .populate('sosAlert')
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

// @desc    Annuler une intervention
// @route   PUT /api/interventions/:id/cancel
// @access  Private
export const cancelIntervention = async (req, res) => {
  try {
    const { reason } = req.body;
    
    const intervention = await Intervention.findById(req.params.id);

    if (!intervention) {
      return res.status(404).json({
        success: false,
        message: 'Intervention non trouvée'
      });
    }

    // Vérifier les permissions
    const isUser = intervention.user.toString() === req.user._id.toString();
    const isHelper = intervention.helper?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isUser && !isHelper && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    // Vérifier que l'intervention peut être annulée
    if (['completed', 'cancelled'].includes(intervention.status)) {
      return res.status(400).json({
        success: false,
        message: 'Impossible d\'annuler cette intervention'
      });
    }

    intervention.status = 'cancelled';
    intervention.cancellation = {
      cancelledBy: isUser ? 'user' : (isHelper ? 'helper' : 'system'),
      reason: reason || 'Annulation',
      cancelledAt: new Date()
    };
    intervention.timeline.push({
      status: 'cancelled',
      timestamp: new Date(),
      note: reason || 'Intervention annulée'
    });

    await intervention.save();

    // Notifier l'autre partie
    if (isUser && intervention.helper) {
      // Notifier le helper
      const helper = await Helper.findById(intervention.helper).populate('user');
      if (helper?.user?.phone) {
        await sendSMS(
          helper.user.phone,
          `❌ L'intervention #${intervention._id} a été annulée par l'utilisateur.`
        );
      }
    } else if (isHelper) {
      // Notifier l'utilisateur
      const user = await User.findById(intervention.user);
      if (user?.phone) {
        await sendSMS(
          user.phone,
          `❌ L'intervention #${intervention._id} a été annulée par le helper.`
        );
      }
    }

    res.json({
      success: true,
      message: 'Intervention annulée',
      data: intervention
    });

  } catch (error) {
    logger.error(`Erreur annulation: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'annulation'
    });
  }
};