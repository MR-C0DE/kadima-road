import Vehicle from '../models/Vehicle.js';
import VehicleLog from '../models/VehicleLog.js';
import VehicleDocument from '../models/VehicleDocument.js';
import User from '../models/User.js';
import Intervention from '../models/Intervention.js';
import logger from '../config/logger.js';
import { uploadFile, deleteFile } from '../services/fileService.js';

// ============================================
// CRUD DE BASE
// ============================================

// @desc    Créer un véhicule
// @route   POST /api/vehicles
// @access  Private
// backend/src/controllers/vehicleController.js
// Modifiez la fonction createVehicle

export const createVehicle = async (req, res) => {
    try {
      const {
        vin,
        licensePlate,
        make,
        model,
        year,
        color,
        fuelType,
        engineType,
        transmission,
        currentMileage
      } = req.body;
  
      // Validation
      if (!make || !model || !year || !licensePlate) {
        return res.status(400).json({
          success: false,
          message: 'Les champs make, model, year et licensePlate sont requis'
        });
      }
  
      // Vérifier si la plaque existe déjà
      const existingVehicle = await Vehicle.findOne({ 
        licensePlate: licensePlate.toUpperCase(),
        'owners.user': req.user._id,
        status: 'active'
      });
  
      if (existingVehicle) {
        return res.status(400).json({
          success: false,
          message: 'Vous avez déjà un véhicule avec cette plaque'
        });
      }
  
      // Créer le véhicule
      const vehicle = await Vehicle.create({
        vin: vin || undefined,
        licensePlate: licensePlate.toUpperCase(),
        make,
        model,
        year,
        color: color || undefined,
        fuelType: fuelType || 'essence',
        engineType: engineType || undefined,
        transmission: transmission || 'manuelle',
        currentMileage: currentMileage || 0,
        owners: [{
          user: req.user._id,
          from: new Date(),
          isCurrent: true
        }]
      });
  
      // Ajouter au profil utilisateur
      await User.findByIdAndUpdate(req.user._id, {
        $push: { vehicles: vehicle._id }
      });
  
      // ✅ CRÉER UN LOG SIMPLE (sans créer de document)
      // Pour éviter l'erreur, on ne crée pas de VehicleDocument
      // On crée juste un VehicleLog
      try {
        await VehicleLog.create({
          vehicle: vehicle._id,
          user: req.user._id,
          type: 'acquisition',
          title: 'Véhicule ajouté',
          description: `${make} ${model} (${year}) - ${licensePlate}`,
          metadata: {
            make,
            model,
            year,
            licensePlate
          }
        });
      } catch (logError) {
        // Ne pas bloquer la création du véhicule si le log échoue
        console.error('Erreur création log:', logError.message);
      }
  
      res.status(201).json({
        success: true,
        data: vehicle
      });
  
    } catch (error) {
      logger.error(`Erreur createVehicle: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création du véhicule',
        error: error.message
      });
    }
  };


// @desc    Obtenir tous les véhicules de l'utilisateur
// @route   GET /api/vehicles
// @access  Private
export const getUserVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({
      'owners.user': req.user._id,
      status: { $in: ['active', 'sold'] }
    })
    .sort('-createdAt')
    .populate('logs', 'title description type createdAt', null, { limit: 5 })
    .lean();

    res.json({
      success: true,
      count: vehicles.length,
      data: vehicles
    });

  } catch (error) {
    logger.error(`Erreur getUserVehicles: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des véhicules'
    });
  }
};

// @desc    Obtenir un véhicule par ID
// @route   GET /api/vehicles/:id
// @access  Private
export const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('logs', '-__v')
      .populate('documents', '-__v')
      .populate('interventions', 'status type createdAt')
      .populate('owners.user', 'firstName lastName email');

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Véhicule non trouvé'
      });
    }

    // Vérifier que l'utilisateur a accès (propriétaire actuel ou ancien)
    const hasAccess = vehicle.owners.some(o => 
      o.user._id.toString() === req.user._id.toString()
    );

    if (!hasAccess && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    res.json({
      success: true,
      data: vehicle
    });

  } catch (error) {
    logger.error(`Erreur getVehicleById: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du véhicule'
    });
  }
};

// @desc    Mettre à jour un véhicule
// @route   PUT /api/vehicles/:id
// @access  Private
// backend/src/controllers/vehicleController.js
// Corrigez la fonction updateVehicle

export const updateVehicle = async (req, res) => {
    try {
      console.log("📦 UPDATE VEHICLE - ID reçu:", req.params.id);
      console.log("📦 UPDATE VEHICLE - Données reçues:", req.body);
      
      const vehicle = await Vehicle.findById(req.params.id);
  
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Véhicule non trouvé'
        });
      }
  
      // Vérifier que l'utilisateur est le propriétaire actuel
      const isCurrentOwner = vehicle.owners.some(o => 
        o.user.toString() === req.user._id.toString() && o.isCurrent
      );
  
      if (!isCurrentOwner && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Seul le propriétaire actuel peut modifier le véhicule'
        });
      }
  
      // ✅ LISTE COMPLÈTE des champs modifiables
      const allowedUpdates = [
        'vin', 
        'licensePlate', 
        'color', 
        'fuelType',
        'engineType', 
        'transmission', 
        'notes',
        'make',        // ← AJOUTÉ
        'model',       // ← AJOUTÉ
        'year'         // ← AJOUTÉ
      ];
  
      let hasChanges = false;
      const updatedFields = [];
      
      allowedUpdates.forEach(field => {
        if (req.body[field] !== undefined && req.body[field] !== null) {
          const oldValue = vehicle[field];
          const newValue = req.body[field];
          
          // Vérifier si la valeur a vraiment changé
          if (oldValue !== newValue) {
            vehicle[field] = newValue;
            hasChanges = true;
            updatedFields.push(`${field}: ${oldValue} -> ${newValue}`);
            console.log(`✏️ Modification du champ ${field}: ${oldValue} -> ${newValue}`);
          }
        }
      });
  
      if (!hasChanges) {
        console.log("⚠️ Aucune modification détectée");
        return res.json({
          success: true,
          message: 'Aucune modification',
          data: vehicle
        });
      }
  
      console.log("✅ Champs modifiés:", updatedFields);
      
      await vehicle.save();
      console.log("💾 Véhicule sauvegardé avec succès");
  
      // Ajouter un log
      await VehicleLog.create({
        vehicle: vehicle._id,
        user: req.user._id,
        type: 'note',
        title: 'Informations du véhicule mises à jour',
        description: `Modifications effectuées par ${req.user.firstName}`,
        metadata: { updatedFields }
      });
  
      res.json({
        success: true,
        message: 'Véhicule mis à jour',
        data: vehicle
      });
  
    } catch (error) {
      console.error("❌ Erreur updateVehicle:", error);
      logger.error(`Erreur updateVehicle: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du véhicule'
      });
    }
  };

// @desc    Supprimer un véhicule (soft delete)
// @route   DELETE /api/vehicles/:id
// @access  Private
export const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Véhicule non trouvé'
      });
    }

    const isCurrentOwner = vehicle.owners.some(o => 
      o.user.toString() === req.user._id.toString() && o.isCurrent
    );

    if (!isCurrentOwner && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Seul le propriétaire peut supprimer le véhicule'
      });
    }

    vehicle.status = 'inactive';
    await vehicle.save();

    // Retirer du profil utilisateur
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { vehicles: vehicle._id }
    });

    // Ajouter un log
    await VehicleLog.create({
      vehicle: vehicle._id,
      user: req.user._id,
      type: 'note',
      title: 'Véhicule supprimé',
      description: 'Le véhicule a été retiré de votre garage'
    });

    res.json({
      success: true,
      message: 'Véhicule supprimé'
    });

  } catch (error) {
    logger.error(`Erreur deleteVehicle: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du véhicule'
    });
  }
};

// ============================================
// TRANSFERT DE PROPRIÉTÉ
// ============================================

// @desc    Transférer un véhicule à un autre utilisateur
// @route   POST /api/vehicles/:id/transfer
// @access  Private
export const transferVehicle = async (req, res) => {
  try {
    const { newOwnerId, price, sellerInfo } = req.body;
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Véhicule non trouvé'
      });
    }

    // Vérifier que l'utilisateur est le propriétaire actuel
    const isCurrentOwner = vehicle.owners.some(o => 
      o.user.toString() === req.user._id.toString() && o.isCurrent
    );

    if (!isCurrentOwner && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Seul le propriétaire actuel peut transférer le véhicule'
      });
    }

    // Vérifier que le nouveau propriétaire existe
    const newOwner = await User.findById(newOwnerId);
    if (!newOwner) {
      return res.status(404).json({
        success: false,
        message: 'Nouveau propriétaire non trouvé'
      });
    }

    // Effectuer le transfert
    await vehicle.transfer(newOwnerId, { price, sellerInfo });

    // Ajouter le véhicule au nouveau propriétaire
    await User.findByIdAndUpdate(newOwnerId, {
      $push: { vehicles: vehicle._id }
    });

    res.json({
      success: true,
      message: 'Véhicule transféré avec succès',
      data: vehicle
    });

  } catch (error) {
    logger.error(`Erreur transferVehicle: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du transfert du véhicule'
    });
  }
};

// ============================================
// KILOMÉTRAGE
// ============================================

// @desc    Mettre à jour le kilométrage
// @route   PUT /api/vehicles/:id/mileage
// @access  Private
export const updateMileage = async (req, res) => {
  try {
    const { mileage, source, note } = req.body;
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Véhicule non trouvé'
      });
    }

    const isCurrentOwner = vehicle.owners.some(o => 
      o.user.toString() === req.user._id.toString() && o.isCurrent
    );

    if (!isCurrentOwner && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Seul le propriétaire peut modifier le kilométrage'
      });
    }

    await vehicle.updateMileage(mileage, source || 'user', note);

    res.json({
      success: true,
      data: {
        currentMileage: vehicle.currentMileage,
        mileageHistory: vehicle.mileageHistory
      }
    });

  } catch (error) {
    logger.error(`Erreur updateMileage: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la mise à jour du kilométrage'
    });
  }
};

// ============================================
// NOTES
// ============================================

// @desc    Ajouter une note au véhicule
// @route   POST /api/vehicles/:id/notes
// @access  Private
export const addVehicleNote = async (req, res) => {
  try {
    const { text, isPrivate } = req.body;
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Véhicule non trouvé'
      });
    }

    const isCurrentOwner = vehicle.owners.some(o => 
      o.user.toString() === req.user._id.toString() && o.isCurrent
    );

    if (!isCurrentOwner && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Seul le propriétaire peut ajouter des notes'
      });
    }

    await vehicle.addNote(text, req.user._id, isPrivate || false);

    // Ajouter un log
    await VehicleLog.create({
      vehicle: vehicle._id,
      user: req.user._id,
      type: 'note',
      title: 'Note ajoutée',
      description: text.substring(0, 100),
      metadata: { isPrivate }
    });

    res.json({
      success: true,
      data: vehicle.notes
    });

  } catch (error) {
    logger.error(`Erreur addVehicleNote: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout de la note'
    });
  }
};

// ============================================
// LOGS
// ============================================

// @desc    Obtenir le journal du véhicule
// @route   GET /api/vehicles/:id/logs
// @access  Private
export const getVehicleLogs = async (req, res) => {
  try {
    const { limit = 50, type, startDate, endDate } = req.query;
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Véhicule non trouvé'
      });
    }

    const query = { vehicle: vehicle._id };

    if (type) query.type = type;
    if (startDate) query.createdAt = { $gte: new Date(startDate) };
    if (endDate) query.createdAt = { ...query.createdAt, $lte: new Date(endDate) };

    const logs = await VehicleLog.find(query)
      .sort('-createdAt')
      .limit(parseInt(limit))
      .populate('user', 'firstName lastName');

    res.json({
      success: true,
      count: logs.length,
      data: logs
    });

  } catch (error) {
    logger.error(`Erreur getVehicleLogs: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du journal'
    });
  }
};

// ============================================
// ANALYSE IA
// ============================================

// @desc    Analyser le véhicule avec IA
// @route   POST /api/vehicles/:id/analyze
// @access  Private
export const analyzeVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('interventions')
      .populate('logs');

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Véhicule non trouvé'
      });
    }

    // Calculer le score de fiabilité
    const reliabilityScore = vehicle.calculateReliabilityScore();

    // Analyser les problèmes récurrents
    const issues = {};
    vehicle.interventions?.forEach(intervention => {
      const category = intervention.problem?.category;
      if (category) {
        issues[category] = (issues[category] || 0) + 1;
      }
    });

    const commonIssues = Object.entries(issues)
      .map(([issue, count]) => ({ issue, count }))
      .sort((a, b) => b.count - a.count);

    // Prédire les maintenances à venir
    const predictedMaintenance = [];

    // Vidange (tous les 10 000 km)
    const lastOilChange = vehicle.logs?.find(l => 
      l.metadata?.type === 'vidange'
    );
    if (lastOilChange) {
      const kmSinceLastOil = vehicle.currentMileage - (lastOilChange.metadata?.mileage || 0);
      if (kmSinceLastOil > 8000) {
        predictedMaintenance.push({
          type: 'vidange',
          description: 'Vidange d\'huile recommandée',
          predictedMileage: (lastOilChange.metadata?.mileage || 0) + 10000,
          confidence: 90
        });
      }
    }

    vehicle.aiProfile = {
      commonIssues,
      reliabilityScore,
      lastAnalysis: new Date(),
      predictedMaintenance,
      healthScore: reliabilityScore
    };

    await vehicle.save();

    // Ajouter un log d'analyse
    await VehicleLog.create({
      vehicle: vehicle._id,
      user: req.user._id,
      type: 'alert',
      title: 'Analyse IA terminée',
      description: `Score de fiabilité: ${reliabilityScore}%`,
      metadata: { reliabilityScore, commonIssues: commonIssues.length }
    });

    res.json({
      success: true,
      data: {
        reliabilityScore,
        commonIssues,
        predictedMaintenance,
        healthScore: reliabilityScore
      }
    });

  } catch (error) {
    logger.error(`Erreur analyzeVehicle: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'analyse du véhicule'
    });
  }
};

// ============================================
// STATISTIQUES
// ============================================

// @desc    Obtenir les statistiques des véhicules de l'utilisateur
// @route   GET /api/vehicles/stats
// @access  Private
export const getVehicleStats = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({
      'owners.user': req.user._id,
      status: 'active'
    });

    const totalVehicles = vehicles.length;
    let totalMileage = 0;
    let totalInterventions = 0;
    let avgReliability = 0;

    vehicles.forEach(v => {
      totalMileage += v.currentMileage || 0;
      totalInterventions += v.interventions?.length || 0;
      avgReliability += v.aiProfile?.reliabilityScore || 100;
    });

    res.json({
      success: true,
      data: {
        totalVehicles,
        totalMileage,
        totalInterventions,
        averageReliability: vehicles.length ? avgReliability / vehicles.length : 100
      }
    });

  } catch (error) {
    logger.error(`Erreur getVehicleStats: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
};