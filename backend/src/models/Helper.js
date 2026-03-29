// models/Helper.js - VERSION COMPLÈTE AVEC COORDONNÉES OBLIGATOIRES
import mongoose from 'mongoose';

const helperSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'inactive'],
    default: 'pending'
  },
  
  // ============================================
  // CERTIFICATION
  // ============================================
  certification: {
    isCertified: { type: Boolean, default: false },
    certifiedAt: Date,
    expiresAt: Date,
    certificateNumber: String,
    trainingCompleted: { type: Boolean, default: false },
    backgroundCheck: { type: Boolean, default: false }
  },
  
  // ============================================
  // ZONE D'INTERVENTION - OBLIGATOIRE MAINTENANT !
  // ============================================
  serviceArea: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      index: '2dsphere',
      validate: {
        validator: function(coords) {
          // Vérification stricte des coordonnées
          return coords && 
                 coords.length === 2 && 
                 !isNaN(coords[0]) && 
                 !isNaN(coords[1]) &&
                 coords[0] >= -180 && coords[0] <= 180 && // longitude valide
                 coords[1] >= -90 && coords[1] <= 90;     // latitude valide
        },
        message: 'Des coordonnées GPS valides [longitude, latitude] sont requises'
      }
    },
    radius: { 
      type: Number, 
      default: 20,
      min: 1,
      max: 100
    }
  },
  
  // ============================================
  // ADRESSE (pour affichage)
  // ============================================
  address: { 
    type: String, 
    default: '' 
  },
  
  // ============================================
  // DISPONIBILITÉ
  // ============================================
  availability: {
    isAvailable: { 
      type: Boolean, 
      default: true 
    },
    schedule: [{
      day: { 
        type: String, 
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] 
      },
      startTime: String,
      endTime: String
    }]
  },
  
  // ============================================
  // SERVICES PROPOSÉS
  // ============================================
  services: [{
    type: String,
    enum: ['battery', 'tire', 'fuel', 'jumpstart', 'lockout', 'minor_repair', 'towing']
  }],
  
  // ============================================
  // ÉQUIPEMENT
  // ============================================
  equipment: [{
    name: String,
    has: Boolean,
    lastChecked: Date
  }],
  
  // ============================================
  // TARIFICATION
  // ============================================
  pricing: {
    basePrice: { 
      type: Number, 
      required: true 
    },
    perKm: { 
      type: Number, 
      default: 1 
    },
    services: [{
      service: String,
      price: Number
    }]
  },
  
  // ============================================
  // PHOTO DE PROFIL
  // ============================================
  photo: {
    type: String,
    default: null
  },
  
  // ============================================
  // STATISTIQUES
  // ============================================
  stats: {
    totalInterventions: { type: Number, default: 0 },
    completedInterventions: { type: Number, default: 0 },
    cancelledInterventions: { type: Number, default: 0 },
    averageResponseTime: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 }
  },
  
  // ============================================
  // DOCUMENTS
  // ============================================
  documents: [{
    type: { 
      type: String, 
      enum: ['license', 'insurance', 'certification'],
      required: true 
    },
    url: { type: String, default: null },
    verified: { type: Boolean, default: false },
    uploadedAt: Date,
    fileName: String,
    fileSize: Number,
    mimeType: String,
    status: {
      type: String,
      enum: ['missing', 'pending', 'verified', 'rejected'],
      default: 'missing'
    },
    rejectionReason: String,
    reviewedAt: Date,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  
  // ============================================
  // AVIS
  // ============================================
  reviews: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }]
  
}, {
  timestamps: true
});

// ============================================
// INDEX GÉOSPATIAL (OBLIGATOIRE POUR LES RECHERCHES)
// ============================================
helperSchema.index({ 'serviceArea.coordinates': '2dsphere' });

// ============================================
// MIDDLEWARE PRE-SAVE POUR VALIDER LES COORDONNÉES
// ============================================
helperSchema.pre('save', function(next) {
  // Vérifier que les coordonnées existent
  if (!this.serviceArea || !this.serviceArea.coordinates) {
    return next(new Error('Les coordonnées GPS sont obligatoires'));
  }
  
  // Vérifier que ce sont des nombres valides
  const [lng, lat] = this.serviceArea.coordinates;
  if (isNaN(lng) || isNaN(lat)) {
    return next(new Error('Coordonnées GPS invalides'));
  }
  
  next();
});

// ============================================
// MÉTHODES STATIQUES UTILES
// ============================================

// Trouver les helpers à proximité d'un point
helperSchema.statics.findNearby = function(coordinates, maxDistance = 20000) {
  return this.find({
    'serviceArea.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        $maxDistance: maxDistance
      }
    },
    status: 'active',
    'availability.isAvailable': true
  }).populate('user', 'firstName lastName phone photo');
};

// ============================================
// MÉTHODES D'INSTANCE
// ============================================

// Calculer la distance à un point
helperSchema.methods.distanceTo = function(coordinates) {
  const [lng1, lat1] = this.serviceArea.coordinates;
  const [lng2, lat2] = coordinates;
  
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const Helper = mongoose.model('Helper', helperSchema);
export default Helper;