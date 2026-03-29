import Helper from "../models/Helper.js";
import SOSAlert from "../models/SOSAlert.js";
import User from "../models/User.js";
import Intervention from "../models/Intervention.js";
import { sendSMS } from "../services/smsService.js";
import logger from "../config/logger.js";

import sharp from "sharp";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// controllers/helperController.js - registerAsHelper COMPLET
// @desc    S'inscrire en tant que helper
// @route   POST /api/helpers/register
// @access  Private
export const registerAsHelper = async (req, res) => {
  try {
    // ============================================
    // 1. VÉRIFICATIONS PRÉLIMINAIRES
    // ============================================

    // Vérifier si l'utilisateur est déjà helper
    const existingHelper = await Helper.findOne({ user: req.user._id });
    if (existingHelper) {
      return res.status(400).json({
        success: false,
        message: "Vous êtes déjà inscrit comme helper",
      });
    }

    // ============================================
    // 2. EXTRAIRE LES DONNÉES DU CORPS DE LA REQUÊTE
    // ============================================

    const { serviceArea, availability, services, equipment, pricing, address } =
      req.body;

    // ============================================
    // 3. VALIDATION DES COORDONNÉES (OBLIGATOIRE)
    // ============================================

    // Vérifier que serviceArea existe
    if (!serviceArea) {
      return res.status(400).json({
        success: false,
        message: "La zone d'intervention (serviceArea) est requise",
      });
    }

    // Vérifier que les coordonnées existent
    if (!serviceArea.coordinates || !Array.isArray(serviceArea.coordinates)) {
      return res.status(400).json({
        success: false,
        message: "Les coordonnées GPS sont requises",
      });
    }

    // Vérifier le format des coordonnées [longitude, latitude]
    if (serviceArea.coordinates.length !== 2) {
      return res.status(400).json({
        success: false,
        message:
          "Les coordonnées doivent être un tableau [longitude, latitude]",
      });
    }

    // Valider les valeurs
    const [lng, lat] = serviceArea.coordinates;
    if (isNaN(lng) || isNaN(lat)) {
      return res.status(400).json({
        success: false,
        message: "Les coordonnées doivent être des nombres valides",
      });
    }

    // Valider les plages (longitude: -180 à 180, latitude: -90 à 90)
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      return res.status(400).json({
        success: false,
        message: "Coordonnées hors limites (lng: -180/180, lat: -90/90)",
      });
    }

    // ============================================
    // 4. VALIDATION DES AUTRES CHAMPS OBLIGATOIRES
    // ============================================

    // Vérifier le pricing (obligatoire)
    if (!pricing || !pricing.basePrice) {
      return res.status(400).json({
        success: false,
        message: "Le prix de base (basePrice) est requis",
      });
    }

    if (isNaN(pricing.basePrice) || pricing.basePrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Le prix de base doit être un nombre positif",
      });
    }

    // ============================================
    // 5. CRÉATION DU PROFIL HELPER
    // ============================================

    const helper = await Helper.create({
      user: req.user._id,
      status: "pending", // En attente de validation par l'admin

      // Service area avec coordonnées validées
      serviceArea: {
        type: "Point",
        coordinates: serviceArea.coordinates,
        radius: serviceArea.radius || 20, // Rayon par défaut: 20 km
      },

      // Adresse (optionnelle)
      address: address || "",

      // Disponibilité (par défaut: disponible)
      availability: availability || {
        isAvailable: true,
        schedule: [],
      },

      // Services proposés (optionnel)
      services: services || [],

      // Équipement (optionnel)
      equipment: equipment || [],

      // Tarification
      pricing: {
        basePrice: pricing.basePrice,
        perKm: pricing.perKm || 1, // Par défaut: 1$/km
        services: pricing.services || [],
      },

      // Certification (par défaut: non certifié)
      certification: {
        isCertified: false,
        trainingCompleted: false,
        backgroundCheck: false,
      },

      // Statistiques initiales
      stats: {
        totalInterventions: 0,
        completedInterventions: 0,
        cancelledInterventions: 0,
        averageResponseTime: 0,
        averageRating: 0,
        totalEarnings: 0,
      },
    });

    // ============================================
    // 6. METTRE À JOUR L'UTILISATEUR
    // ============================================

    await User.findByIdAndUpdate(req.user._id, {
      isHelper: true,
      helperProfile: helper._id,
      role: "helper", // Changer le rôle
    });

    // ============================================
    // 7. LOG DE SUCCÈS
    // ============================================

    logger.info(`✅ Nouveau helper inscrit: ${req.user.email}`);

    // ============================================
    // 8. RÉPONSE SUCCÈS
    // ============================================

    res.status(201).json({
      success: true,
      message: "Inscription helper réussie. En attente de validation.",
      data: {
        helper: {
          id: helper._id,
          status: helper.status,
          serviceArea: helper.serviceArea,
          pricing: helper.pricing,
          availability: helper.availability,
        },
      },
    });
  } catch (error) {
    // ============================================
    // 9. GESTION DES ERREURS
    // ============================================

    logger.error(`❌ Erreur registerAsHelper: ${error.message}`);

    // Gérer les erreurs de validation Mongoose
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Erreur de validation",
        errors: messages,
      });
    }

    // Erreur générique
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'inscription comme helper",
    });
  }
};

// @desc    Obtenir le profil du helper connecté
// @route   GET /api/helpers/profile/me
// @access  Private
export const getHelperProfile = async (req, res) => {
  try {
    const helper = await Helper.findOne({ user: req.user._id }).populate(
      "user",
      "-password"
    );

    console.log(helper);

    if (!helper) {
      return res.status(404).json({
        success: false,
        message: "Profil helper non trouvé",
      });
    }

    res.json({
      success: true,
      data: helper,
    });
  } catch (error) {
    logger.error(`Erreur getHelperProfile: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du profil",
    });
  }
};
// backend/src/controllers/helperController.js

// @desc    Mettre à jour le profil helper
// @route   PUT /api/helpers/profile/me
// @access  Private
export const updateHelperProfile = async (req, res) => {
  try {
    console.log("📝 updateHelperProfile - Données reçues:", req.body);

    const helper = await Helper.findOne({ user: req.user._id });

    if (!helper) {
      return res.status(404).json({
        success: false,
        message: "Profil helper non trouvé",
      });
    }

    // ============================================
    // 1. METTRE À JOUR L'UTILISATEUR (User model)
    // ============================================
    const userUpdates = {};

    if (req.body.firstName !== undefined) {
      userUpdates.firstName = req.body.firstName;
      console.log(`✏️ Mise à jour firstName: ${req.body.firstName}`);
    }

    if (req.body.lastName !== undefined) {
      userUpdates.lastName = req.body.lastName;
      console.log(`✏️ Mise à jour lastName: ${req.body.lastName}`);
    }

    if (req.body.phone !== undefined) {
      userUpdates.phone = req.body.phone;
      console.log(`✏️ Mise à jour phone: ${req.body.phone}`);
    }

    if (req.body.email !== undefined) {
      userUpdates.email = req.body.email;
      console.log(`✏️ Mise à jour email: ${req.body.email}`);
    }

    // Appliquer les mises à jour à l'utilisateur
    if (Object.keys(userUpdates).length > 0) {
      await User.findByIdAndUpdate(req.user._id, userUpdates);
      console.log("✅ Utilisateur mis à jour:", userUpdates);
    }

    // ============================================
    // 2. METTRE À JOUR LE HELPER (Helper model)
    // ============================================
    const allowedUpdates = [
      "serviceArea",
      "availability",
      "pricing",
      "equipment",
      "services",
      "address",
      "photo",
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        helper[field] = req.body[field];
        console.log(`✏️ Mise à jour helper.${field}:`, req.body[field]);
      }
    });

    // ============================================
    // 3. GESTION DES PRÉFÉRENCES
    // ============================================
    if (req.body.preferences !== undefined) {
      helper.preferences = {
        ...helper.preferences,
        ...req.body.preferences,
      };
      console.log(`✏️ Mise à jour preferences:`, req.body.preferences);
    }

    await helper.save();
    console.log("✅ Helper sauvegardé");

    // ============================================
    // 4. RÉCUPÉRER LE PROFIL MIS À JOUR
    // ============================================
    const updatedHelper = await Helper.findOne({ user: req.user._id }).populate(
      "user",
      "-password"
    );

    res.json({
      success: true,
      message: "Profil mis à jour avec succès",
      data: updatedHelper,
    });
  } catch (error) {
    console.error("❌ Erreur updateHelperProfile:", error);
    logger.error(`Erreur updateHelperProfile: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du profil",
      error: error.message,
    });
  }
};
// @desc    Obtenir un helper par ID
// @route   GET /api/helpers/:id
// @access  Private
export const getHelperById = async (req, res) => {
  try {
    const helper = await Helper.findById(req.params.id).populate(
      "user",
      "firstName lastName phone email photo"
    );

    if (!helper) {
      return res.status(404).json({
        success: false,
        message: "Helper non trouvé",
      });
    }

    res.json({
      success: true,
      data: helper,
    });
  } catch (error) {
    logger.error(`Erreur getHelperById: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du helper",
    });
  }
};

// @desc    Obtenir tous les helpers (admin only)
// @route   GET /api/helpers
// @access  Private/Admin
export const getAllHelpers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Accès réservé aux administrateurs",
      });
    }

    const { status, certified, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (certified) query["certification.isCertified"] = certified === "true";

    const helpers = await Helper.find(query)
      .populate("user", "firstName lastName email phone")
      .sort("-createdAt")
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Helper.countDocuments(query);

    res.json({
      success: true,
      count: helpers.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: helpers,
    });
  } catch (error) {
    logger.error(`Erreur getAllHelpers: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des helpers",
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
        message: "Helper non trouvé",
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
      message: `Disponibilité mise à jour: ${
        isAvailable ? "disponible" : "indisponible"
      }`,
      data: helper.availability,
    });
  } catch (error) {
    logger.error(`Erreur updateAvailability: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de la disponibilité",
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
        message: "Helper non trouvé",
      });
    }

    // Vérifier si le service existe déjà
    const serviceExists = helper.pricing.services?.find(
      (s) => s.service === service
    );

    if (serviceExists) {
      return res.status(400).json({
        success: false,
        message: "Ce service existe déjà",
      });
    }

    // Ajouter le service
    if (!helper.pricing.services) {
      helper.pricing.services = [];
    }

    helper.pricing.services.push({
      service,
      price: price || helper.pricing.basePrice,
    });

    // Ajouter aussi à la liste des services proposés
    if (!helper.services.includes(service)) {
      helper.services.push(service);
    }

    await helper.save();

    res.json({
      success: true,
      message: "Service ajouté",
      data: helper.pricing.services,
    });
  } catch (error) {
    logger.error(`Erreur addService: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'ajout du service",
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
        message: "Helper non trouvé",
      });
    }

    const serviceIndex = helper.pricing.services?.findIndex(
      (s) => s._id.toString() === req.params.serviceId
    );

    if (serviceIndex === -1 || serviceIndex === undefined) {
      return res.status(404).json({
        success: false,
        message: "Service non trouvé",
      });
    }

    // Supprimer le service
    const removedService = helper.pricing.services[serviceIndex];
    helper.pricing.services.splice(serviceIndex, 1);

    // Supprimer aussi de la liste des services si plus aucun pricing
    const serviceStillExists = helper.pricing.services.some(
      (s) => s.service === removedService.service
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
      message: "Service supprimé",
      data: helper.pricing.services,
    });
  } catch (error) {
    logger.error(`Erreur removeService: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression du service",
    });
  }
};

// @desc    Obtenir les helpers à proximité (pour le client)
// @route   GET /api/helpers/nearby
// @access  Private
export const getNearbyHelpers = async (req, res) => {
  try {
    const { lat, lng, radius = 100, service } = req.query;

    console.log("\n🔍 ===== DEBUG getNearbyHelpers =====");
    console.log("📍 Position client reçue:", { lat, lng });
    console.log("📏 Rayon demandé:", radius, "km");
    console.log("🔧 Filtre service:", service || "aucun");

    // ============================================
    // 1. VALIDATION DES PARAMÈTRES
    // ============================================
    if (!lat || !lng) {
      console.log("❌ Paramètres manquants");
      return res.status(400).json({
        success: false,
        message: "Latitude et longitude requises",
      });
    }

    // ============================================
    // 2. STATISTIQUES GÉNÉRALES DE LA BASE
    // ============================================
    const totalHelpers = await Helper.countDocuments();
    console.log("📊 1. Total helpers dans la base:", totalHelpers);

    const totalActive = await Helper.countDocuments({ status: "active" });
    console.log("📊 2. Helpers avec status 'active':", totalActive);

    const totalAvailable = await Helper.countDocuments({
      status: "active",
      "availability.isAvailable": true,
    });
    console.log("📊 3. Helpers actifs ET disponibles:", totalAvailable);

    const totalWithCoords = await Helper.countDocuments({
      "serviceArea.coordinates": { $exists: true, $ne: null },
      "serviceArea.coordinates.0": { $exists: true },
      "serviceArea.coordinates.1": { $exists: true },
    });
    console.log("📊 4. Helpers avec coordonnées valides:", totalWithCoords);

    // ============================================
    // 3. VÉRIFICATION D'UN HELPER EXEMPLE
    // ============================================
    const sampleHelper = await Helper.findOne({
      status: "active",
      "availability.isAvailable": true,
      "serviceArea.coordinates": { $exists: true },
    }).populate("user", "email firstName");

    if (sampleHelper) {
      console.log("\n✅ HELPER EXEMPLE TROUVÉ:");
      console.log("  ID:", sampleHelper._id);
      console.log("  Email:", sampleHelper.user?.email);
      console.log("  Status:", sampleHelper.status);
      console.log("  Available:", sampleHelper.availability?.isAvailable);
      console.log("  Coordinates:", sampleHelper.serviceArea?.coordinates);
      console.log("  Type:", sampleHelper.serviceArea?.type);

      // Calculer la distance de cet exemple par rapport à la position client
      const distance = calculateDistance(
        parseFloat(lat),
        parseFloat(lng),
        sampleHelper.serviceArea.coordinates[1],
        sampleHelper.serviceArea.coordinates[0]
      );
      console.log(`  Distance du client: ${distance.toFixed(1)} km`);
    } else {
      console.log("\n❌ AUCUN helper actif et disponible trouvé dans la base!");
    }

    // ============================================
    // 4. VÉRIFICATION DE L'INDEX
    // ============================================
    try {
      const indexes = await Helper.collection.indexes();
      const geoIndex = indexes.find(
        (i) => i.key && i.key["serviceArea.coordinates"] === "2dsphere"
      );
      if (geoIndex) {
        console.log("\n✅ Index géospatial trouvé:", geoIndex.name);
      } else {
        console.log("\n❌ Index géospatial MANQUANT!");
        console.log(
          "Index disponibles:",
          indexes.map((i) => i.name)
        );
      }
    } catch (indexError) {
      console.log(
        "❌ Erreur lors de la vérification des index:",
        indexError.message
      );
    }

    // ============================================
    // 5. RECHERCHE AVEC $near
    // ============================================
    console.log("\n🔍 RECHERCHE AVEC $near:");

    // ⚡ CORRECTION: enlever le ": any"
    const query = {
      "serviceArea.coordinates": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: radius * 1000, // Conversion en mètres
        },
      },
      status: "active",
      "availability.isAvailable": true,
    };

    // Ajouter le filtre service si spécifié
    if (service) {
      query.services = service;
    }

    console.log("📝 Requête MongoDB:", JSON.stringify(query, null, 2));

    const helpers = await Helper.find(query)
      .populate("user", "firstName lastName phone photo")
      .limit(100);

    console.log(`✅ Résultat: ${helpers.length} helpers trouvés avec $near`);

    // ============================================
    // 6. SI AUCUN RÉSULTAT, TEST SANS $near
    // ============================================
    if (helpers.length === 0) {
      console.log("\n🔄 TEST SANS FILTRE DE DISTANCE:");

      const fallbackQuery = {
        status: "active",
        "availability.isAvailable": true,
      };

      if (service) {
        fallbackQuery.services = service;
      }

      const allHelpers = await Helper.find(fallbackQuery).populate(
        "user",
        "firstName lastName phone photo"
      );

      console.log(
        `📊 Total helpers sans filtre distance: ${allHelpers.length}`
      );

      if (allHelpers.length > 0) {
        console.log("\n📍 LISTE DE TOUS LES HELPERS DISPONIBLES:");
        allHelpers.forEach((helper, index) => {
          if (helper.serviceArea?.coordinates) {
            const distance = calculateDistance(
              parseFloat(lat),
              parseFloat(lng),
              helper.serviceArea.coordinates[1],
              helper.serviceArea.coordinates[0]
            );
            console.log(
              `  ${index + 1}. ${helper.user?.firstName} ${
                helper.user?.lastName
              }:`
            );
            console.log(
              `     - Coordonnées: [${helper.serviceArea.coordinates}]`
            );
            console.log(`     - Distance: ${distance.toFixed(1)} km`);
            console.log(`     - Status: ${helper.status}`);
            console.log(
              `     - Available: ${helper.availability?.isAvailable}`
            );
          } else {
            console.log(
              `  ${index + 1}. ${helper.user?.firstName} ${
                helper.user?.lastName
              }: PAS DE COORDONNÉES`
            );
          }
        });
      } else {
        console.log("❌ AUCUN helper actif et disponible trouvé dans la base!");
      }
    }

    // ============================================
    // 7. FORMATAGE DES RÉSULTATS
    // ============================================
    const helpersWithDistance = helpers.map((helper) => {
      const [helperLng, helperLat] = helper.serviceArea.coordinates;
      const distance = calculateDistance(
        parseFloat(lat),
        parseFloat(lng),
        helperLat,
        helperLng
      );
      return {
        ...helper.toObject(),
        distance: Math.round(distance * 10) / 10, // Arrondi à 1 décimale
      };
    });

    // Trier par distance (déjà fait par $near, mais par sécurité)
    helpersWithDistance.sort((a, b) => a.distance - b.distance);

    console.log(
      `\n📦 Envoi de ${helpersWithDistance.length} helpers au client`
    );
    console.log("🔚 ===== FIN getNearbyHelpers =====\n");

    res.json({
      success: true,
      count: helpersWithDistance.length,
      data: helpersWithDistance,
    });
  } catch (error) {
    console.error("\n❌ ERREUR CRITIQUE dans getNearbyHelpers:");
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);

    res.status(500).json({
      success: false,
      message: "Erreur lors de la recherche de helpers",
      error: error.message,
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
        message: "Helper non trouvé",
      });
    }

    // Récupérer les interventions du helper
    const interventions = await Intervention.find({ helper: helper._id });

    const totalInterventions = interventions.length;
    const completedInterventions = interventions.filter(
      (i) => i.status === "completed"
    ).length;
    const cancelledInterventions = interventions.filter(
      (i) => i.status === "cancelled"
    ).length;

    const totalEarnings = interventions
      .filter((i) => i.status === "completed")
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
        memberSince: helper.createdAt,
      },
    });
  } catch (error) {
    logger.error(`Erreur getHelperStats: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques",
    });
  }
};

// @desc    Vérifier un helper (admin only)
// @route   PUT /api/helpers/verify/:id
// @access  Private/Admin
export const verifyHelper = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Accès réservé aux administrateurs",
      });
    }

    const { verified, backgroundCheck, trainingCompleted } = req.body;

    const helper = await Helper.findById(req.params.id).populate("user");

    if (!helper) {
      return res.status(404).json({
        success: false,
        message: "Helper non trouvé",
      });
    }

    // Mettre à jour la certification
    helper.certification = {
      ...helper.certification,
      isCertified:
        verified !== undefined ? verified : helper.certification.isCertified,
      backgroundCheck:
        backgroundCheck !== undefined
          ? backgroundCheck
          : helper.certification.backgroundCheck,
      trainingCompleted:
        trainingCompleted !== undefined
          ? trainingCompleted
          : helper.certification.trainingCompleted,
      certifiedAt: verified ? new Date() : helper.certification.certifiedAt,
      expiresAt: verified
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        : null,
    };

    // Mettre à jour le statut
    if (verified) {
      helper.status = "active";
    }

    await helper.save();

    // Notifier le helper par SMS
    if (helper.user?.phone) {
      const message = verified
        ? "Félicitations! Votre profil helper a été approuvé. Vous pouvez maintenant commencer à aider les conducteurs sur Kadima Road."
        : "Votre profil helper est en attente de vérification. Nous vous contacterons sous peu.";

      await sendSMS(helper.user.phone, message);
    }

    res.json({
      success: true,
      message: verified ? "Helper vérifié avec succès" : "Helper mis à jour",
      data: helper,
    });
  } catch (error) {
    logger.error(`Erreur verifyHelper: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la vérification du helper",
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
        message: "Aucun document fourni",
      });
    }

    const { type } = req.body; // 'license', 'insurance', 'certification'

    const helper = await Helper.findOne({ user: req.user._id });

    if (!helper) {
      // Supprimer le fichier si helper non trouvé
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: "Helper non trouvé",
      });
    }

    // Construire l'URL du document
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const documentUrl = `${baseUrl}/uploads/documents/${req.file.filename}`;

    helper.documents.push({
      type,
      url: documentUrl,
      verified: false,
      uploadedAt: new Date(),
    });

    await helper.save();

    res.json({
      success: true,
      message: "Document uploadé avec succès",
      data: helper.documents,
    });
  } catch (error) {
    logger.error(`Erreur uploadDocument: ${error.message}`);

    // Nettoyer le fichier en cas d'erreur
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: "Erreur lors de l'upload du document",
    });
  }
};

// @desc    Obtenir les avis d'un helper
// @route   GET /api/helpers/reviews/:id
// @access  Private
export const getHelperReviews = async (req, res) => {
  try {
    const helper = await Helper.findById(req.params.id).populate({
      path: "reviews.user",
      select: "firstName lastName photo",
    });

    if (!helper) {
      return res.status(404).json({
        success: false,
        message: "Helper non trouvé",
      });
    }

    res.json({
      success: true,
      count: helper.reviews.length,
      averageRating: helper.stats?.averageRating || 0,
      data: helper.reviews.sort((a, b) => b.createdAt - a.createdAt),
    });
  } catch (error) {
    logger.error(`Erreur getHelperReviews: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des avis",
    });
  }
};

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

// Fonction utilitaire pour calculer la distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Rayon de la Terre en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
        message: "Helper non trouvé",
      });
    }

    // Statuts des missions en cours
    const currentStatuses = ["accepted", "en_route", "arrived", "in_progress"];

    const missions = await Intervention.find({
      helper: helper._id,
      status: { $in: currentStatuses },
    })
      .populate("user", "firstName lastName phone")
      .populate("sosAlert")
      .sort("-updatedAt");

    // Ajouter la distance et la récompense à chaque mission
    const missionsWithDetails = missions.map((mission) => {
      let distance = 0;
      let reward = 0;

      // Calculer la distance si le helper a une position
      if (helper.serviceArea?.coordinates && mission.location?.coordinates) {
        const [helperLng, helperLat] = helper.serviceArea.coordinates;
        const [missionLng, missionLat] = mission.location.coordinates;
        distance = calculateDistance(
          helperLat,
          helperLng,
          missionLat,
          missionLng
        );
        distance = Math.round(distance * 10) / 10;
      }

      // Calculer la récompense (prix de base + distance)
      const basePrice = helper.pricing?.basePrice || 25;
      const perKm = helper.pricing?.perKm || 2;
      reward = basePrice + distance * perKm;
      reward = Math.round(reward);

      // Formater l'objet mission
      return {
        _id: mission._id,
        type: mission.type || "sos",
        status: mission.status,
        distance: distance,
        reward: reward,
        user: mission.user
          ? {
              firstName: mission.user.firstName,
              lastName: mission.user.lastName,
              phone: mission.user.phone,
            }
          : null,
        problem: mission.problem || {
          description: "",
          category: "",
        },
        location: mission.location || {
          address: "",
          coordinates: [0, 0],
        },
        createdAt: mission.createdAt,
        acceptedAt: mission.timeline?.find((t) => t.status === "accepted")
          ?.timestamp,
        completedAt: mission.completedAt,
        estimatedTime: mission.eta ? `${mission.eta} min` : undefined,
        cancellation: mission.cancellation,
      };
    });

    res.json({
      success: true,
      count: missionsWithDetails.length,
      data: missionsWithDetails,
    });
  } catch (error) {
    logger.error(`Erreur getCurrentMissions: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des missions en cours",
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
        message: "Helper non trouvé",
      });
    }

    // Statuts des missions terminées
    const historyStatuses = ["completed", "cancelled"];

    const missions = await Intervention.find({
      helper: helper._id,
      status: { $in: historyStatuses },
    })
      .populate("user", "firstName lastName")
      .sort("-createdAt")
      .limit(50); // Limiter à 50 missions pour l'historique

    // Ajouter la distance et la récompense à chaque mission
    const missionsWithDetails = missions.map((mission) => {
      let distance = 0;
      let reward = 0;

      // Calculer la distance si le helper a une position
      if (helper.serviceArea?.coordinates && mission.location?.coordinates) {
        const [helperLng, helperLat] = helper.serviceArea.coordinates;
        const [missionLng, missionLat] = mission.location.coordinates;
        distance = calculateDistance(
          helperLat,
          helperLng,
          missionLat,
          missionLng
        );
        distance = Math.round(distance * 10) / 10;
      }

      // Calculer la récompense (prix de base + distance)
      const basePrice = helper.pricing?.basePrice || 25;
      const perKm = helper.pricing?.perKm || 2;
      reward = basePrice + distance * perKm;
      reward = Math.round(reward);

      return {
        _id: mission._id,
        type: mission.type || "sos",
        status: mission.status,
        distance: distance,
        reward: reward,
        user: mission.user
          ? {
              firstName: mission.user.firstName,
              lastName: mission.user.lastName,
            }
          : null,
        problem: mission.problem || {
          description: "",
          category: "",
        },
        location: mission.location || {
          address: "",
          coordinates: [0, 0],
        },
        createdAt: mission.createdAt,
        completedAt: mission.completedAt,
        cancellation: mission.cancellation,
      };
    });

    res.json({
      success: true,
      count: missionsWithDetails.length,
      data: missionsWithDetails,
    });
  } catch (error) {
    logger.error(`Erreur getMissionHistory: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de l'historique",
    });
  }
};

// Dans backend/src/controllers/helperController.js
// Modifiez la fonction updateMissionStatus

// @desc    Mettre à jour le statut d'une mission
// @route   PUT /api/helpers/missions/:id/status
// @access  Private
export const updateMissionStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    const { id } = req.params;

    console.log(
      `📡 Mise à jour mission - ID: ${id}, Nouveau statut: ${status}`
    );

    // 1. Vérifier que le helper existe
    const helper = await Helper.findOne({ user: req.user._id }).populate(
      "user"
    );
    if (!helper) {
      return res.status(404).json({
        success: false,
        message: "Helper non trouvé",
      });
    }

    // 2. Récupérer l'intervention
    const intervention = await Intervention.findById(id)
      .populate("user", "firstName lastName phone")
      .populate("helper")
      .populate("sosAlert")
      .populate("vehicle");

    if (!intervention) {
      return res.status(404).json({
        success: false,
        message: "Intervention non trouvée",
      });
    }

    // 3. Vérifier que le helper est assigné
    if (intervention.helper?._id.toString() !== helper._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Vous n'êtes pas assigné à cette intervention",
      });
    }

    // 4. Valider le statut
    const validStatuses = [
      "accepted",
      "en_route",
      "arrived",
      "in_progress",
      "completed",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Statut invalide. Valides: ${validStatuses.join(", ")}`,
      });
    }

    // 5. Sauvegarder l'ancien statut
    const oldStatus = intervention.status;

    // 6. Mettre à jour l'intervention
    intervention.status = status;

    // Ajouter au timeline
    intervention.timeline.push({
      status,
      timestamp: new Date(),
      note: reason || `Statut mis à jour par le helper: ${status}`,
      location: req.body.location || null,
      updatedBy: helper.user._id,
      updatedByRole: "helper",
    });

    // Actions spécifiques selon le statut
    if (status === "accepted" && oldStatus !== "accepted") {
      intervention.acceptedAt = new Date();
    }

    if (status === "en_route") {
      // Calculer l'ETA si pas déjà fait
      if (
        !intervention.eta &&
        intervention.location?.coordinates &&
        helper.serviceArea?.coordinates
      ) {
        const [clientLng, clientLat] = intervention.location.coordinates;
        const [helperLng, helperLat] = helper.serviceArea.coordinates;
        const distance = calculateDistance(
          clientLat,
          clientLng,
          helperLat,
          helperLng
        );
        intervention.eta = Math.max(5, Math.round(distance * 2));
      }
    }

    if (status === "completed") {
      intervention.completedAt = new Date();

      // Mettre à jour les stats du helper
      await Helper.findByIdAndUpdate(helper._id, {
        $inc: {
          "stats.completedInterventions": 1,
          "stats.totalInterventions": 1,
        },
      });

      // Mettre à jour les stats de l'utilisateur
      await User.findByIdAndUpdate(intervention.user._id, {
        $inc: {
          "stats.interventionsAsUser": 1,
        },
      });
    }

    if (status === "cancelled") {
      intervention.cancelledAt = new Date();
      intervention.cancellation = {
        cancelledBy: "helper",
        reason: reason || "Annulé par le helper",
        cancelledAt: new Date(),
      };

      // Mettre à jour les stats du helper
      await Helper.findByIdAndUpdate(helper._id, {
        $inc: {
          "stats.cancelledInterventions": 1,
        },
      });
    }

    await intervention.save();

    console.log(`✅ Intervention ${id} mise à jour: ${oldStatus} -> ${status}`);

    // ============================================
    // 7. DIFFUSION WEBSOCKET
    // ============================================
    try {
      const { getIO } = await import("../socket/index.js");
      const io = getIO();

      // 7.1 Diffuser le changement de statut à la salle de l'intervention
      io.to(`intervention:${id}`).emit("status-update", {
        interventionId: id,
        status: status,
        note: reason || `Statut: ${status}`,
        timestamp: new Date().toISOString(),
        updatedBy: "helper",
        oldStatus: oldStatus,
      });
      console.log(
        `📢 Statut diffusé à la salle intervention:${id} - ${status}`
      );

      // 7.2 Si la mission est annulée, diffuser à tous les helpers
      if (status === "cancelled") {
        io.emit("mission-cancelled", {
          missionId: id,
          reason: reason || "Annulé par le helper",
          location: intervention.location,
          reward: intervention.pricing?.final || 0,
        });
        console.log(`📢 Mission annulée diffusée à tous les helpers: ${id}`);
      }

      // 7.3 Si la mission est acceptée, notifier le client
      if (status === "accepted") {
        // Notifier le client via Socket.IO (s'il est connecté)
        io.to(`user:${intervention.user._id}`).emit("mission-accepted", {
          interventionId: id,
          helper: {
            firstName: helper.user.firstName,
            lastName: helper.user.lastName,
            phone: helper.user.phone,
            photo: helper.photo,
          },
          eta: intervention.eta,
        });
        console.log(
          `📢 Mission acceptée notifiée au client: ${intervention.user._id}`
        );
      }

      // 7.4 Si le helper est en route, notifier le client
      if (status === "en_route") {
        io.to(`user:${intervention.user._id}`).emit("helper-en-route", {
          interventionId: id,
          eta: intervention.eta,
          helperLocation: helper.serviceArea?.coordinates,
        });
        console.log(
          `📢 Helper en route notifié au client: ${intervention.user._id}`
        );
      }

      // 7.5 Si la mission est terminée, notifier le client
      if (status === "completed") {
        io.to(`user:${intervention.user._id}`).emit("mission-completed", {
          interventionId: id,
          completedAt: intervention.completedAt,
          reward: intervention.pricing?.final,
        });
        console.log(
          `📢 Mission terminée notifiée au client: ${intervention.user._id}`
        );
      }
    } catch (wsError) {
      console.error("⚠️ Erreur WebSocket (non bloquante):", wsError.message);
    }

    // ============================================
    // 8. NOTIFICATIONS SMS (optionnel)
    // ============================================
    try {
      // Notifier le client par SMS pour les statuts importants
      if (status === "accepted" && intervention.user?.phone) {
        const { sendSMS } = await import("../services/smsService.js");
        await sendSMS(
          intervention.user.phone,
          `✅ Votre demande d'assistance a été acceptée !\n\n` +
            `${helper.user.firstName} ${
              helper.user.lastName
            } arrive dans environ ${intervention.eta || 15} minutes.\n` +
            `Suivez l'intervention dans l'application.`
        );
        console.log(`📱 SMS envoyé au client: ${intervention.user.phone}`);
      }

      if (status === "cancelled" && intervention.user?.phone) {
        const { sendSMS } = await import("../services/smsService.js");
        await sendSMS(
          intervention.user.phone,
          `❌ Votre demande d'assistance a été annulée.\n\n` +
            `Raison: ${reason || "Annulé par le helper"}\n` +
            `Vous pouvez faire une nouvelle demande dans l'application.`
        );
        console.log(
          `📱 SMS d'annulation envoyé au client: ${intervention.user.phone}`
        );
      }
    } catch (smsError) {
      console.error("⚠️ Erreur envoi SMS (non bloquante):", smsError.message);
    }

    // ============================================
    // 9. RÉPONSE
    // ============================================
    res.json({
      success: true,
      message: "Statut mis à jour avec succès",
      data: {
        _id: intervention._id,
        status: intervention.status,
        timeline: intervention.timeline.slice(-3),
        eta: intervention.eta,
        completedAt: intervention.completedAt,
        cancellation: intervention.cancellation,
      },
    });
  } catch (error) {
    console.error("❌ Erreur updateMissionStatus:", error);
    logger.error(`Erreur updateMissionStatus: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du statut",
      error: error.message,
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
        message: "Helper non trouvé",
      });
    }

    // Récupérer toutes les interventions du helper
    const interventions = await Intervention.find({
      helper: helper._id,
      status: "completed",
    });

    // Calculer les statistiques
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const weekAgo = new Date(now.setDate(now.getDate() - 7));
    const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
    const yearAgo = new Date(now.setFullYear(now.getFullYear() - 1));

    const todayEarnings = interventions
      .filter((i) => new Date(i.createdAt) >= today)
      .reduce((sum, i) => sum + (i.pricing?.final || 0), 0);

    const weekEarnings = interventions
      .filter((i) => new Date(i.createdAt) >= weekAgo)
      .reduce((sum, i) => sum + (i.pricing?.final || 0), 0);

    const monthEarnings = interventions
      .filter((i) => new Date(i.createdAt) >= monthAgo)
      .reduce((sum, i) => sum + (i.pricing?.final || 0), 0);

    const totalEarnings = interventions.reduce(
      (sum, i) => sum + (i.pricing?.final || 0),
      0
    );

    // Gains en attente (interventions acceptées mais pas encore terminées)
    const pendingInterventions = await Intervention.find({
      helper: helper._id,
      status: { $in: ["accepted", "en_route", "arrived", "in_progress"] },
    });

    const pendingEarnings = pendingInterventions.reduce(
      (sum, i) => sum + (i.pricing?.final || 0),
      0
    );

    // Statistiques supplémentaires
    const completedMissions = interventions.length;
    const averagePerMission =
      completedMissions > 0 ? totalEarnings / completedMissions : 0;

    // Taux de réponse et d'annulation
    const allInterventions = await Intervention.find({ helper: helper._id });
    const totalMissions = allInterventions.length;
    const cancelledMissions = allInterventions.filter(
      (i) => i.status === "cancelled"
    ).length;

    const responseRate = totalMissions > 0 ? 100 : 100; // À améliorer avec des données réelles
    const cancellationRate =
      totalMissions > 0 ? (cancelledMissions / totalMissions) * 100 : 0;

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
        cancellationRate,
      },
    });
  } catch (error) {
    logger.error(`Erreur getEarningsStats: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques de gains",
    });
  }
};

// @desc    Obtenir les transactions récentes
// @route   GET /api/helpers/earnings/transactions
// @access  Private
export const getEarningsTransactions = async (req, res) => {
  try {
    const { period = "week" } = req.query;

    const helper = await Helper.findOne({ user: req.user._id });

    if (!helper) {
      return res.status(404).json({
        success: false,
        message: "Helper non trouvé",
      });
    }

    // Déterminer la date de début selon la période
    const now = new Date();
    let startDate;

    switch (period) {
      case "day":
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case "week":
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case "month":
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case "year":
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setDate(now.getDate() - 7));
    }

    // Récupérer les interventions de la période
    const interventions = await Intervention.find({
      helper: helper._id,
      createdAt: { $gte: startDate },
    })
      .populate("user", "firstName lastName")
      .sort("-createdAt")
      .limit(50);

    // Formater les transactions
    const transactions = interventions.map((i) => ({
      _id: i._id,
      date: i.createdAt,
      amount: i.pricing?.final || 0,
      type: i.type,
      status:
        i.status === "completed"
          ? "completed"
          : i.status === "cancelled"
          ? "cancelled"
          : "pending",
      client: {
        firstName: i.user?.firstName || "Client",
        lastName: i.user?.lastName || "",
      },
      missionType: i.problem?.category || i.type || "Assistance",
    }));

    res.json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    logger.error(`Erreur getEarningsTransactions: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des transactions",
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
        message: "Aucune photo fournie",
      });
    }

    const helper = await Helper.findOne({ user: req.user._id });

    if (!helper) {
      // Supprimer le fichier uploadé si helper non trouvé
      fs.unlinkSync(req.file.path);

      return res.status(404).json({
        success: false,
        message: "Helper non trouvé",
      });
    }

    // ============================================
    // Optimisation de l'image
    // ============================================

    const optimizedFilename = `optimized-${req.file.filename}`;
    const optimizedPath = path.join(
      __dirname,
      "../../uploads/profiles",
      optimizedFilename
    );

    await sharp(req.file.path)
      .resize(400, 400, { fit: "cover" })
      .jpeg({ quality: 80 })
      .toFile(optimizedPath);

    // Supprimer le fichier original
    fs.unlinkSync(req.file.path);

    // ============================================
    // Construire l'URL de la photo
    // ============================================

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const photoUrl = `${baseUrl}/uploads/profiles/${optimizedFilename}`;

    // ============================================
    // Supprimer l'ancienne photo si elle existe
    // ============================================

    if (helper.photo) {
      const oldPhotoPath = path.join(
        __dirname,
        "../../",
        helper.photo.replace(baseUrl, "")
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
      message: "Photo de profil mise à jour",
      data: {
        photo: photoUrl,
      },
    });
  } catch (error) {
    logger.error(`Erreur uploadProfilePhoto: ${error.message}`);

    // Nettoyer le fichier en cas d'erreur
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: "Erreur lors de l'upload de la photo",
    });
  }
};

// @desc    Supprimer la photo de profil
// @route   DELETE /api/helpers/profile/photo
// @access  Private
export const deleteProfilePhoto = async (req, res) => {
  try {
    const helper = await Helper.findOne({ user: req.user._id }).populate(
      "user"
    );

    if (!helper) {
      return res.status(404).json({
        success: false,
        message: "Helper non trouvé",
      });
    }

    if (helper.user?.photo) {
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const photoPath = path.join(
        __dirname,
        "../../",
        helper.user.photo.replace(baseUrl, "")
      );

      // Supprimer le fichier physique
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }

      // Supprimer la référence dans la base de données
      await User.findByIdAndUpdate(req.user._id, {
        $unset: { photo: 1 },
      });
    }

    res.json({
      success: true,
      message: "Photo de profil supprimée",
    });
  } catch (error) {
    logger.error(`Erreur deleteProfilePhoto: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de la photo",
    });
  }
};

// ============================================
// ROUTES POUR LES SOS (À AJOUTER)
// ============================================

// @desc    Obtenir les SOS disponibles à proximité
// @route   GET /api/helpers/available-sos
// @access  Private
export const getAvailableSOS = async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;

    console.log("\n🔍 ========== getAvailableSOS ==========");
    console.log("📍 Position helper reçue:", { lat, lng });
    console.log("📏 Rayon demandé:", radius, "km");
    console.log("👤 User ID from token:", req.user?._id);
    console.log("👤 User email from token:", req.user?.email);

    // ============================================
    // 1. VALIDATION DES PARAMÈTRES
    // ============================================
    if (!lat || !lng) {
      console.log("❌ Paramètres manquants: lat ou lng");
      return res.status(400).json({
        success: false,
        message: "Latitude et longitude requises",
      });
    }

    // ============================================
    // 2. RECHERCHE DU HELPER
    // ============================================
    console.log("\n🔍 Recherche du helper dans la base...");

    const helper = await Helper.findOne({ user: req.user._id });

    if (!helper) {
      console.log("❌ Aucun helper trouvé pour l'utilisateur:", req.user._id);

      // Vérifier si l'utilisateur existe
      const user = await User.findById(req.user._id);
      console.log(
        "👤 Utilisateur trouvé:",
        user
          ? {
              id: user._id,
              email: user.email,
              role: user.role,
              isHelper: user.isHelper,
            }
          : "non trouvé"
      );

      return res.status(404).json({
        success: false,
        message: "Profil helper non trouvé",
      });
    }

    console.log("\n✅ Helper trouvé:", {
      id: helper._id,
      status: helper.status,
      isAvailable: helper.availability?.isAvailable,
      coordinates: helper.serviceArea?.coordinates,
      address: helper.address,
    });

    // Vérifier que le helper est actif
    if (helper.status !== "active") {
      console.log("⚠️ Helper non actif - status:", helper.status);
      return res.status(403).json({
        success: false,
        message: `Votre compte helper est en statut "${helper.status}". Il doit être "active" pour voir les SOS.`,
      });
    }

    // Vérifier que le helper est disponible
    if (!helper.availability?.isAvailable) {
      console.log("⚠️ Helper non disponible");
      return res.status(403).json({
        success: false,
        message:
          "Vous êtes marqué comme indisponible. Activez votre disponibilité.",
      });
    }

    // ============================================
    // 3. VÉRIFICATION DES COORDONNÉES DU HELPER
    // ============================================
    if (!helper.serviceArea?.coordinates) {
      console.log("❌ Helper sans coordonnées GPS");
      return res.status(400).json({
        success: false,
        message:
          "Votre profil n'a pas de coordonnées GPS. Veuillez mettre à jour votre zone d'intervention.",
      });
    }

    // ============================================
    // 4. COMPTAGE DES SOS ACTIFS
    // ============================================
    const totalActiveSOS = await SOSAlert.countDocuments({ status: "active" });
    console.log("\n📊 Total SOS actifs dans la base:", totalActiveSOS);

    if (totalActiveSOS === 0) {
      console.log("ℹ️ Aucun SOS actif dans la base");
      return res.json({
        success: true,
        count: 0,
        data: [],
      });
    }

    // ============================================
    // 5. RECHERCHE DES SOS À PROXIMITÉ
    // ============================================
    console.log("\n🔍 Recherche des SOS à proximité...");
    console.log("📍 Centre de recherche:", [parseFloat(lng), parseFloat(lat)]);
    console.log("📏 Rayon de recherche:", radius * 1000, "m");

    let sosAlerts = [];
    try {
      sosAlerts = await SOSAlert.find({
        "location.coordinates": {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [parseFloat(lng), parseFloat(lat)],
            },
            $maxDistance: radius * 1000,
          },
        },
        status: "active",
      }).populate("user", "firstName lastName phone");

      console.log(`✅ ${sosAlerts.length} SOS trouvés à proximité`);
    } catch (dbError) {
      console.error("❌ Erreur MongoDB dans $near:", dbError);

      // Fallback: chercher sans $near
      console.log("🔄 Tentative sans géolocalisation...");
      sosAlerts = await SOSAlert.find({
        status: "active",
      }).populate("user", "firstName lastName phone");

      console.log(`✅ ${sosAlerts.length} SOS trouvés (sans filtre distance)`);
    }

    // ============================================
    // 6. FORMATAGE DES RÉSULTATS
    // ============================================
    console.log("\n🔄 Formatage des résultats...");

    const formattedSOS = sosAlerts.map((sos) => {
      const [sosLng, sosLat] = sos.location.coordinates;

      // Calculer la distance
      let distance = 0;
      try {
        distance = calculateDistance(
          parseFloat(lat),
          parseFloat(lng),
          sosLat,
          sosLng
        );
      } catch (calcError) {
        console.error("❌ Erreur calcul distance:", calcError);
        distance = 999999;
      }

      // Calculer la récompense (prix de base + distance)
      const basePrice = 25;
      const reward = Math.round(basePrice + distance * 2);

      return {
        _id: sos._id,
        type: sos.problem.category,
        distance: Math.round(distance * 10) / 10,
        reward: reward,
        client: {
          firstName: sos.user?.firstName || "Client",
          lastName: sos.user?.lastName || "",
        },
        problem: {
          description: sos.problem.description,
          category: sos.problem.category,
        },
        location: {
          address: sos.location.address || "Adresse non disponible",
          coordinates: sos.location.coordinates,
        },
        createdAt: sos.createdAt,
      };
    });

    // Trier par distance
    formattedSOS.sort((a, b) => a.distance - b.distance);

    console.log(`\n📦 Envoi de ${formattedSOS.length} SOS formatés`);
    console.log("🔚 ========== FIN getAvailableSOS ==========\n");

    res.json({
      success: true,
      count: formattedSOS.length,
      data: formattedSOS,
    });
  } catch (error) {
    console.error("\n❌ ERREUR CRITIQUE dans getAvailableSOS:");
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
    console.error("Name:", error.name);

    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des SOS",
      error: error.message,
    });
  }
};

// backend/src/controllers/helperController.js

// @desc    Accepter un SOS et créer l'intervention
// @route   POST /api/helpers/accept-sos/:sosId
// @access  Private
export const acceptSOSMission = async (req, res) => {
  try {
    console.log("\n🔍 ========== acceptSOSMission ==========");
    console.log("📦 req.params:", req.params);
    console.log("📍 req.query:", req.query);
    console.log("👤 req.user:", req.user?._id);

    const { sosId } = req.params;
    const { lat, lng } = req.query;

    // ============================================
    // 1. VALIDATION DU SOS ID
    // ============================================
    if (!sosId) {
      console.log("❌ sosId manquant");
      return res.status(400).json({
        success: false,
        message: "ID du SOS requis",
      });
    }

    // ============================================
    // 2. VÉRIFIER QUE L'UTILISATEUR EST UN HELPER
    // ============================================
    const helper = await Helper.findOne({ user: req.user._id }).populate(
      "user"
    );
    console.log(
      "🔍 Helper trouvé:",
      helper
        ? {
            _id: helper._id,
            user: helper.user?.email,
            status: helper.status,
            isAvailable: helper.availability?.isAvailable,
          }
        : "NON"
    );

    if (!helper) {
      console.log("❌ Helper non trouvé");
      return res.status(403).json({
        success: false,
        message: "Vous n'êtes pas un helper",
      });
    }

    // ============================================
    // 3. VÉRIFIER QUE LE HELPER EST ACTIF ET DISPONIBLE
    // ============================================
    if (helper.status !== "active") {
      console.log("⚠️ Helper non actif:", helper.status);
      return res.status(403).json({
        success: false,
        message: "Votre compte helper n'est pas actif",
      });
    }

    if (!helper.availability?.isAvailable) {
      console.log("⚠️ Helper non disponible");
      return res.status(403).json({
        success: false,
        message: "Vous n'êtes pas disponible pour le moment",
      });
    }

    // ============================================
    // 4. RÉCUPÉRER LE SOS
    // ============================================
    const sosAlert = await SOSAlert.findById(sosId).populate("user");
    console.log(
      "🔍 SOS trouvé:",
      sosAlert
        ? {
            _id: sosAlert._id,
            status: sosAlert.status,
            user: sosAlert.user?.email,
            hasVehicleRef: !!sosAlert.vehicleRef,
            hasVehicleSnapshot: !!sosAlert.vehicle,
          }
        : "NON"
    );

    if (!sosAlert) {
      console.log("❌ SOS non trouvé");
      return res.status(404).json({
        success: false,
        message: "SOS non trouvé",
      });
    }

    console.log("📊 SOS status:", sosAlert.status);
    console.log("🚗 SOS.vehicleRef:", sosAlert.vehicleRef);
    console.log("🚗 SOS.vehicle snapshot:", sosAlert.vehicle);

    // ============================================
    // 5. VÉRIFIER QUE LE SOS EST ENCORE ACTIF
    // ============================================
    if (sosAlert.status !== "active") {
      console.log("⚠️ SOS plus disponible - status:", sosAlert.status);
      return res.status(400).json({
        success: false,
        message: "Ce SOS n'est plus disponible",
      });
    }

    // ============================================
    // 6. VÉRIFIER LE VÉHICULE
    // ============================================
    let vehicleId = null;

    // Priorité 1: vehicleRef (ObjectId)
    if (sosAlert.vehicleRef) {
      vehicleId = sosAlert.vehicleRef;
      console.log("✅ Véhicule trouvé via vehicleRef:", vehicleId);
    }
    // Priorité 2: snapshot dans le SOS (on ne peut pas l'utiliser comme ObjectId)
    else if (sosAlert.vehicle && sosAlert.vehicle.make) {
      console.log("⚠️ Le SOS a un snapshot véhicule mais pas de vehicleRef");
      console.log("   Snapshot:", sosAlert.vehicle);
      // On ne peut pas créer de lien vers Vehicle avec un snapshot
      // On garde quand même les infos pour l'affichage
    } else {
      console.log("⚠️ Aucun véhicule associé à ce SOS");
    }

    // ============================================
    // 7. CRÉER L'INTERVENTION
    // ============================================
    console.log("📝 Création de l'intervention...");
    console.log("   - user:", sosAlert.user._id);
    console.log("   - helper:", helper._id);
    console.log("   - sosAlert:", sosAlert._id);
    console.log("   - vehicleRef:", vehicleId);

    const intervention = await Intervention.create({
      user: sosAlert.user._id,
      helper: helper._id,
      sosAlert: sosAlert._id,
      vehicle: vehicleId, // ← ObjectId ou null
      type: "sos",
      status: "accepted",
      problem: sosAlert.problem,
      location: sosAlert.location,
      timeline: [
        {
          status: "accepted",
          timestamp: new Date(),
          note: `Accepté par ${helper.user.firstName} ${helper.user.lastName}`,
        },
      ],
    });

    console.log("✅ Intervention créée:");
    console.log("   - _id:", intervention._id);
    console.log("   - vehicle (ObjectId):", intervention.vehicle);
    console.log("   - status:", intervention.status);

    // ============================================
    // 8. METTRE À JOUR LE SOS
    // ============================================
    sosAlert.status = "dispatched";
    sosAlert.intervention = intervention._id;
    await sosAlert.save();
    console.log("✅ SOS mis à jour - nouveau status: dispatched");

    // ============================================
    // 9. CALCULER L'ETA
    // ============================================
    let eta = 15;
    if (lat && lng && sosAlert.location?.coordinates) {
      const [sosLng, sosLat] = sosAlert.location.coordinates;
      const distance = calculateDistance(
        parseFloat(lat),
        parseFloat(lng),
        sosLat,
        sosLng
      );
      eta = Math.round(distance * 2);
      console.log(`📏 Distance: ${distance.toFixed(1)}km, ETA: ${eta}min`);
    } else {
      console.log("⚠️ Impossible de calculer ETA - coordonnées manquantes");
    }

    // ============================================
    // 10. RÉPONSE
    // ============================================
    console.log("📦 Réponse envoyée avec succès");
    console.log("🔚 ========== FIN acceptSOSMission ==========\n");

    return res.status(200).json({
      success: true,
      message: "SOS accepté avec succès",
      data: {
        intervention: {
          _id: intervention._id,
          status: intervention.status,
          vehicle: intervention.vehicle, // ← Inclure pour vérifier
        },
        eta: eta,
        helper: {
          firstName: helper.user.firstName,
          lastName: helper.user.lastName,
          phone: helper.user.phone,
        },
        client: {
          firstName: sosAlert.user.firstName,
          lastName: sosAlert.user.lastName,
          phone: sosAlert.user.phone,
        },
      },
    });
  } catch (error) {
    console.error("\n❌ ERREUR dans acceptSOSMission:");
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de l'acceptation du SOS",
      error: error.message,
    });
  }
};

// @desc    Obtenir le détail d'une mission par ID
// @route   GET /api/helpers/missions/:id
// @access  Private
// backend/src/controllers/helperController.js

// @desc    Obtenir le détail d'une mission par ID
// @route   GET /api/helpers/missions/:id
// @access  Private
export const getMissionById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🔍 Récupération mission:", id);

    // 1. Vérifier que l'utilisateur est un helper
    const helper = await Helper.findOne({ user: req.user._id }).populate(
      "user"
    );
    if (!helper) {
      return res.status(403).json({
        success: false,
        message: "Vous n'êtes pas un helper",
      });
    }

    // 2. Récupérer l'intervention avec tous les populate
    const intervention = await Intervention.findById(id)
      .populate("user", "firstName lastName phone")
      .populate("helper")
      .populate("sosAlert")
      .populate("vehicle"); // Populate du véhicule

    if (!intervention) {
      return res.status(404).json({
        success: false,
        message: "Mission non trouvée",
      });
    }

    // 3. Vérifier que le helper est bien assigné à cette mission
    if (intervention.helper?._id.toString() !== helper._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Vous n'êtes pas assigné à cette mission",
      });
    }

    // 4. Récupérer les informations du véhicule
    let vehicleInfo = null;

    if (intervention.vehicle) {
      console.log("🚗 Véhicule trouvé via populate:", intervention.vehicle._id);

      // Récupérer les dernières interventions pour ce véhicule
      const lastInterventions = await Intervention.find({
        vehicle: intervention.vehicle._id,
        status: "completed",
      })
        .sort("-createdAt")
        .limit(3)
        .select("problem.description type createdAt");

      // Récupérer les alertes (problèmes récurrents)
      const commonIssues = intervention.vehicle.aiProfile?.commonIssues || [];
      const alerts = commonIssues
        .filter((issue) => issue.count >= 2)
        .map((issue) => `${issue.issue} (${issue.count} fois)`);

      // Calculer le prochain entretien (exemple: vidange tous les 10 000 km)
      let nextMaintenance = null;
      const lastOilChange = await Intervention.findOne({
        vehicle: intervention.vehicle._id,
        "problem.category": "maintenance",
        "problem.description": { $regex: /vidange/i },
      }).sort("-createdAt");

      if (lastOilChange && lastOilChange.createdAt) {
        // Simplifié: prochaine vidange dans 10 000 km
        const lastMileageAtOilChange = lastOilChange.metadata?.mileage || 0;
        const dueKm = lastMileageAtOilChange + 10000;
        const currentKm = intervention.vehicle.currentMileage || 0;
        if (dueKm > currentKm) {
          nextMaintenance = {
            type: "Vidange",
            dueKm: dueKm,
            currentKm: currentKm,
          };
        }
      }

      vehicleInfo = {
        make: intervention.vehicle.make || "",
        model: intervention.vehicle.model || "",
        year: intervention.vehicle.year || null,
        licensePlate: intervention.vehicle.licensePlate || "",
        color: intervention.vehicle.color || "",
        fuelType: intervention.vehicle.fuelType || "",
        transmission: intervention.vehicle.transmission || "",
        history: {
          currentMileage: intervention.vehicle.currentMileage || 0,
          lastIntervention: lastInterventions[0]
            ? {
                date: lastInterventions[0].createdAt,
                description:
                  lastInterventions[0].problem?.description || "Intervention",
                type: lastInterventions[0].type,
              }
            : null,
          recentInterventions: lastInterventions.slice(0, 2).map((i) => ({
            date: i.createdAt,
            description: i.problem?.description || "Intervention",
            type: i.type,
          })),
          alerts: alerts.slice(0, 2),
          nextMaintenance: nextMaintenance,
        },
      };

      console.log("📊 Historique véhicule:", {
        currentMileage: vehicleInfo.history.currentMileage,
        lastIntervention: vehicleInfo.history.lastIntervention?.description,
        alerts: vehicleInfo.history.alerts,
      });
    }
    // Fallback: utiliser le snapshot du SOS si pas de véhicule en base
    else if (intervention.sosAlert?.vehicle) {
      console.log("🚗 Véhicule trouvé via SOS snapshot");
      vehicleInfo = {
        make: intervention.sosAlert.vehicle.make || "",
        model: intervention.sosAlert.vehicle.model || "",
        year: intervention.sosAlert.vehicle.year || null,
        licensePlate: intervention.sosAlert.vehicle.licensePlate || "",
        color: intervention.sosAlert.vehicle.color || "",
        fuelType: intervention.sosAlert.vehicle.fuelType || "",
        transmission: "",
        history: null,
      };
    }
    // 5. Construire la réponse complète
    console.log(
      "📍 Adresse brute de l'intervention:",
      intervention.location?.address
    );
    console.log("📍 Coordonnées:", intervention.location?.coordinates);
    console.log(
      "📍 Address dans SOS:",
      intervention.sosAlert?.location?.address
    );
    // 5. Construire la réponse complète
    const missionDetail = {
      _id: intervention._id,
      type: String(intervention.type || ""),
      status: String(intervention.status || ""),
      client: {
        firstName: String(intervention.user?.firstName || "Client"),
        lastName: String(intervention.user?.lastName || ""),
        phone: String(intervention.user?.phone || ""),
      },
      vehicle: vehicleInfo,
      problem: {
        description: String(intervention.problem?.description || ""),
        category: String(intervention.problem?.category || ""),
      },
      location: {
        address: String(intervention.location?.address || ""),
        coordinates: Array.isArray(intervention.location?.coordinates)
          ? intervention.location.coordinates.map(Number)
          : [0, 0],
      },
      createdAt: intervention.createdAt,
      eta: Number(intervention.eta || 15),
      reward: Number(intervention.pricing?.final || 0),
      distance: intervention.distance || null,
    };

    console.log(
      "📦 Mission detail envoyée avec véhicule:",
      missionDetail.vehicle
        ? {
            make: missionDetail.vehicle.make,
            model: missionDetail.vehicle.model,
            hasHistory: !!missionDetail.vehicle.history,
          }
        : "Aucun véhicule"
    );

    res.json({
      success: true,
      data: missionDetail,
    });
  } catch (error) {
    console.error("❌ Erreur getMissionById:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de la mission",
      error: error.message,
    });
  }
};

// backend/src/controllers/helperController.js
// Ajouter à la fin du fichier

// @desc    Mettre à jour la position du helper pour une mission
// @route   PUT /api/helpers/missions/:id/location
// @access  Private
export const updateHelperLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, accuracy } = req.body;

    console.log(
      `📍 Mise à jour position helper - Mission: ${id}, Lat: ${latitude}, Lng: ${longitude}`
    );

    // Vérifier que le helper existe
    const helper = await Helper.findOne({ user: req.user._id });
    if (!helper) {
      return res.status(404).json({
        success: false,
        message: "Helper non trouvé",
      });
    }

    // Vérifier que l'intervention existe et appartient au helper
    const intervention = await Intervention.findById(id);
    if (!intervention) {
      return res.status(404).json({
        success: false,
        message: "Intervention non trouvée",
      });
    }

    if (intervention.helper?.toString() !== helper._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Vous n'êtes pas assigné à cette intervention",
      });
    }

    // Valider les coordonnées
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude et longitude requises",
      });
    }

    // Mettre à jour la position du helper
    intervention.helperLocation = {
      type: "Point",
      coordinates: [parseFloat(longitude), parseFloat(latitude)],
      accuracy: accuracy || 10,
      updatedAt: new Date(),
    };

    await intervention.save();

    console.log(`✅ Position mise à jour pour mission ${id}`);

    res.json({
      success: true,
      message: "Position mise à jour",
      data: {
        location: intervention.helperLocation,
        updatedAt: intervention.helperLocation.updatedAt,
      },
    });
  } catch (error) {
    console.error("❌ Erreur updateHelperLocation:", error);
    logger.error(`Erreur updateHelperLocation: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de la position",
    });
  }
};
