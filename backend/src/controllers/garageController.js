// backend/src/controllers/garageController.js
import Garage from '../models/Garage.js';
import { searchNearbyGarages } from '../services/googlePlacesService.js';
import logger from '../config/logger.js';

// ============================================
// GARAGES PARTENAIRES (base de données)
// ============================================

// @desc    Récupérer les garages à proximité (partenaires + Google)
// @route   GET /api/garages/nearby
// @access  Private
export const getNearbyGarages = async (req, res) => {
  try {
    const { lat, lng, radius = 10, source = 'all' } = req.query;

    console.log(`🔍 Recherche garages à proximité: lat=${lat}, lng=${lng}, rayon=${radius}km`);

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude et longitude requises'
      });
    }

    let garages = [];

    // 1. Récupérer les garages partenaires de la base
    if (source === 'all' || source === 'partner') {
      const partnerGarages = await Garage.find({
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

      console.log(`📦 ${partnerGarages.length} garages partenaires trouvés`);

      garages = partnerGarages.map(g => ({
        _id: g._id,
        name: g.name,
        address: g.address,
        phone: g.phone,
        services: g.services || [],
        rating: g.rating || 0,
        location: {
          coordinates: g.location?.coordinates || [parseFloat(lng), parseFloat(lat)]
        },
        source: 'partner'
      }));
    }

    // 2. Récupérer les garages via Google Places
    if (source === 'all' || source === 'google') {
      try {
        const googleGarages = await searchNearbyGarages(lat, lng, radius * 1000);
        console.log(`📦 ${googleGarages.length} garages Google trouvés`);
        
        garages = [...garages, ...googleGarages];
      } catch (googleError) {
        console.error('❌ Erreur Google Places:', googleError.message);
      }
    }

    // 3. Calculer la distance et ajouter
    const garagesWithDistance = garages.map(garage => {
      let distance = 999999;
      if (garage.location?.coordinates && garage.location.coordinates.length === 2) {
        const [garageLng, garageLat] = garage.location.coordinates;
        distance = calculateDistance(
          parseFloat(lat),
          parseFloat(lng),
          garageLat,
          garageLng
        );
      }
      return {
        ...garage,
        distance: Math.round(distance * 10) / 10
      };
    }).sort((a, b) => a.distance - b.distance);

    console.log(`✅ ${garagesWithDistance.length} garages retournés`);

    res.json({
      success: true,
      count: garagesWithDistance.length,
      data: garagesWithDistance
    });

  } catch (error) {
    console.error('❌ Erreur getNearbyGarages:', error);
    logger.error(`Erreur getNearbyGarages: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche des garages'
    });
  }
};

// @desc    Rechercher des garages par nom ou service
// @route   GET /api/garages/search
// @access  Private
export const searchGarages = async (req, res) => {
  try {
    const { q, lat, lng, radius = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Terme de recherche requis'
      });
    }

    const query = {
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { services: { $in: [q.toLowerCase()] } },
        { brands: { $in: [q.toLowerCase()] } }
      ],
      status: 'active'
    };

    let garages = await Garage.find(query).limit(50);

    if (lat && lng) {
      garages = garages.map(garage => {
        let distance = 999999;
        if (garage.location?.coordinates) {
          const [garageLng, garageLat] = garage.location.coordinates;
          distance = calculateDistance(
            parseFloat(lat),
            parseFloat(lng),
            garageLat,
            garageLng
          );
        }
        return {
          ...garage.toObject(),
          distance: Math.round(distance * 10) / 10
        };
      }).sort((a, b) => a.distance - b.distance);
    }

    res.json({
      success: true,
      count: garages.length,
      data: garages
    });

  } catch (error) {
    console.error('❌ Erreur searchGarages:', error);
    logger.error(`Erreur searchGarages: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche'
    });
  }
};

// @desc    Obtenir un garage par ID
// @route   GET /api/garages/:id
// @access  Private
export const getGarageById = async (req, res) => {
  try {
    const garage = await Garage.findById(req.params.id)
      .populate('reviews.user', 'firstName lastName photo');

    if (!garage) {
      return res.status(404).json({
        success: false,
        message: 'Garage non trouvé'
      });
    }

    res.json({
      success: true,
      data: garage
    });

  } catch (error) {
    logger.error(`Erreur getGarageById: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du garage'
    });
  }
};

// @desc    Ajouter un avis sur un garage
// @route   POST /api/garages/:id/review
// @access  Private
export const addGarageReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const garage = await Garage.findById(req.params.id);

    if (!garage) {
      return res.status(404).json({
        success: false,
        message: 'Garage non trouvé'
      });
    }

    const existingReview = garage.reviews?.find(
      r => r.user.toString() === req.user._id.toString()
    );

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà laissé un avis pour ce garage'
      });
    }

    garage.reviews = garage.reviews || [];
    garage.reviews.push({
      user: req.user._id,
      rating,
      comment,
      createdAt: new Date()
    });

    const totalRating = garage.reviews.reduce((sum, r) => sum + r.rating, 0);
    garage.rating = totalRating / garage.reviews.length;

    await garage.save();

    res.json({
      success: true,
      message: 'Avis ajouté avec succès',
      data: {
        rating: garage.rating,
        reviews: garage.reviews
      }
    });

  } catch (error) {
    logger.error(`Erreur addGarageReview: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout de l\'avis'
    });
  }
};

// ============================================
// ADMIN - Gestion des garages partenaires
// ============================================

// @desc    Créer un garage (admin)
// @route   POST /api/garages
// @access  Private/Admin
export const createGarage = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs'
      });
    }

    const garage = await Garage.create(req.body);

    logger.info(`✅ Garage créé: ${garage.name}`);

    res.status(201).json({
      success: true,
      data: garage
    });

  } catch (error) {
    logger.error(`Erreur createGarage: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du garage'
    });
  }
};

// @desc    Mettre à jour un garage (admin)
// @route   PUT /api/garages/:id
// @access  Private/Admin
export const updateGarage = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs'
      });
    }

    const garage = await Garage.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!garage) {
      return res.status(404).json({
        success: false,
        message: 'Garage non trouvé'
      });
    }

    logger.info(`✅ Garage mis à jour: ${garage.name}`);

    res.json({
      success: true,
      data: garage
    });

  } catch (error) {
    logger.error(`Erreur updateGarage: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour'
    });
  }
};

// @desc    Supprimer un garage (admin)
// @route   DELETE /api/garages/:id
// @access  Private/Admin
export const deleteGarage = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs'
      });
    }

    const garage = await Garage.findByIdAndDelete(req.params.id);

    if (!garage) {
      return res.status(404).json({
        success: false,
        message: 'Garage non trouvé'
      });
    }

    logger.info(`✅ Garage supprimé: ${garage.name}`);

    res.json({
      success: true,
      message: 'Garage supprimé avec succès'
    });

  } catch (error) {
    logger.error(`Erreur deleteGarage: ${error.message}`);
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