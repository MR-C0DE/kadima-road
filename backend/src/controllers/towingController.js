// backend/src/controllers/towingController.js
import Towing from '../models/Towing.js';
import { searchNearbyTowing } from '../services/googlePlacesService.js';
import logger from '../config/logger.js';

// ============================================
// SERVICES DE REMORQUAGE
// ============================================

// @desc    Récupérer les services de remorquage à proximité
// @route   GET /api/towings/nearby
// @access  Private
export const getNearbyTowing = async (req, res) => {
  try {
    const { lat, lng, radius = 10, source = 'all' } = req.query;

    console.log(`🔍 Recherche remorquage à proximité: lat=${lat}, lng=${lng}, rayon=${radius}km`);

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude et longitude requises'
      });
    }

    let towingServices = [];

    // 1. Récupérer les services partenaires de la base
    if (source === 'all' || source === 'partner') {
      const partnerTowing = await Towing.find({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(lng), parseFloat(lat)]
            },
            $maxDistance: radius * 1000
          }
        },
        status: 'active'
      }).limit(50);

      console.log(`📦 ${partnerTowing.length} services de remorquage partenaires trouvés`);

      towingServices = partnerTowing.map(t => ({
        _id: t._id,
        name: t.name,
        address: t.address,
        phone: t.phone,
        pricing: t.pricing || { basePrice: 75, perKm: 2, afterHours: 50 },
        available24h: t.available24h ?? true,
        rating: t.rating || 0,
        location: {
          coordinates: t.location?.coordinates || [parseFloat(lng), parseFloat(lat)]
        },
        source: 'partner'
      }));
    }

    // 2. Récupérer via Google Places
    if (source === 'all' || source === 'google') {
      try {
        const googleTowing = await searchNearbyTowing(lat, lng, radius * 1000);
        console.log(`📦 ${googleTowing.length} services de remorquage Google trouvés`);
        
        towingServices = [...towingServices, ...googleTowing];
      } catch (googleError) {
        console.error('❌ Erreur Google Places:', googleError.message);
      }
    }

    // 3. Calculer la distance et estimer le prix
    const isAfterHours = isAfterHoursNow();
    const towingWithDetails = towingServices.map(towing => {
      let distance = 999999;
      if (towing.location?.coordinates && towing.location.coordinates.length === 2) {
        const [towingLng, towingLat] = towing.location.coordinates;
        distance = calculateDistance(
          parseFloat(lat),
          parseFloat(lng),
          towingLat,
          towingLng
        );
      }

      const basePrice = towing.pricing?.basePrice || 75;
      const perKm = towing.pricing?.perKm || 2;
      const afterHoursFee = isAfterHours ? (towing.pricing?.afterHours || 50) : 0;
      const estimatedPrice = basePrice + (distance * perKm) + afterHoursFee;

      return {
        ...towing,
        distance: Math.round(distance * 10) / 10,
        estimatedPrice: Math.round(estimatedPrice),
        isAfterHours
      };
    }).sort((a, b) => a.distance - b.distance);

    console.log(`✅ ${towingWithDetails.length} services de remorquage retournés`);

    res.json({
      success: true,
      count: towingWithDetails.length,
      data: towingWithDetails
    });

  } catch (error) {
    console.error('❌ Erreur getNearbyTowing:', error);
    logger.error(`Erreur getNearbyTowing: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche des services de remorquage'
    });
  }
};

// @desc    Obtenir un service de remorquage par ID
// @route   GET /api/towings/:id
// @access  Private
export const getTowingById = async (req, res) => {
  try {
    const towing = await Towing.findById(req.params.id)
      .populate('reviews.user', 'firstName lastName photo');

    if (!towing) {
      return res.status(404).json({
        success: false,
        message: 'Service de remorquage non trouvé'
      });
    }

    res.json({
      success: true,
      data: towing
    });

  } catch (error) {
    logger.error(`Erreur getTowingById: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du service'
    });
  }
};

// @desc    Ajouter un avis sur un service de remorquage
// @route   POST /api/towings/:id/review
// @access  Private
export const addTowingReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const towing = await Towing.findById(req.params.id);

    if (!towing) {
      return res.status(404).json({
        success: false,
        message: 'Service de remorquage non trouvé'
      });
    }

    const existingReview = towing.reviews?.find(
      r => r.user.toString() === req.user._id.toString()
    );

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà laissé un avis pour ce service'
      });
    }

    towing.reviews = towing.reviews || [];
    towing.reviews.push({
      user: req.user._id,
      rating,
      comment,
      createdAt: new Date()
    });

    const totalRating = towing.reviews.reduce((sum, r) => sum + r.rating, 0);
    towing.rating = totalRating / towing.reviews.length;

    await towing.save();

    res.json({
      success: true,
      message: 'Avis ajouté avec succès',
      data: {
        rating: towing.rating,
        reviews: towing.reviews
      }
    });

  } catch (error) {
    logger.error(`Erreur addTowingReview: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout de l\'avis'
    });
  }
};

// ============================================
// ADMIN
// ============================================

// @desc    Créer un service de remorquage (admin)
// @route   POST /api/towings
// @access  Private/Admin
export const createTowing = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs'
      });
    }

    const towing = await Towing.create(req.body);

    logger.info(`✅ Service de remorquage créé: ${towing.name}`);

    res.status(201).json({
      success: true,
      data: towing
    });

  } catch (error) {
    logger.error(`Erreur createTowing: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du service'
    });
  }
};

// @desc    Mettre à jour un service de remorquage (admin)
// @route   PUT /api/towings/:id
// @access  Private/Admin
export const updateTowing = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs'
      });
    }

    const towing = await Towing.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!towing) {
      return res.status(404).json({
        success: false,
        message: 'Service de remorquage non trouvé'
      });
    }

    logger.info(`✅ Service de remorquage mis à jour: ${towing.name}`);

    res.json({
      success: true,
      data: towing
    });

  } catch (error) {
    logger.error(`Erreur updateTowing: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour'
    });
  }
};

// @desc    Supprimer un service de remorquage (admin)
// @route   DELETE /api/towings/:id
// @access  Private/Admin
export const deleteTowing = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs'
      });
    }

    const towing = await Towing.findByIdAndDelete(req.params.id);

    if (!towing) {
      return res.status(404).json({
        success: false,
        message: 'Service de remorquage non trouvé'
      });
    }

    logger.info(`✅ Service de remorquage supprimé: ${towing.name}`);

    res.json({
      success: true,
      message: 'Service supprimé avec succès'
    });

  } catch (error) {
    logger.error(`Erreur deleteTowing: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression'
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

function isAfterHoursNow() {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  return day === 0 || day === 6 || hour >= 20 || hour < 8;
}