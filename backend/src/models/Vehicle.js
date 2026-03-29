import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  // ============================================
  // IDENTIFICATION DU VÉHICULE
  // ============================================
  vin: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^[A-HJ-NPR-Z0-9]{17}$/.test(v);
      },
      message: 'VIN invalide (17 caractères alphanumériques)'
    }
  },
  licensePlate: {
    type: String,
    required: [true, 'La plaque d\'immatriculation est requise'],
    uppercase: true,
    trim: true
  },
  make: {
    type: String,
    required: [true, 'La marque est requise'],
    trim: true
  },
  model: {
    type: String,
    required: [true, 'Le modèle est requis'],
    trim: true
  },
  year: {
    type: Number,
    required: [true, 'L\'année est requise'],
    min: 1900,
    max: new Date().getFullYear() + 1
  },
  color: {
    type: String,
    trim: true
  },
  fuelType: {
    type: String,
    enum: ['essence', 'diesel', 'electrique', 'hybride', 'gpl', 'autre'],
    default: 'essence'
  },
  engineType: {
    type: String,
    trim: true
  },
  engineSize: {
    type: Number, // en cm³
    min: 0
  },
  horsepower: {
    type: Number,
    min: 0
  },
  transmission: {
    type: String,
    enum: ['manuelle', 'automatique', 'semi-automatique', 'cvt'],
    default: 'manuelle'
  },
  doors: {
    type: Number,
    min: 2,
    max: 5,
    default: 4
  },
  
  // ============================================
  // KILOMÉTRAGE
  // ============================================
  currentMileage: {
    type: Number,
    default: 0,
    min: 0
  },
  mileageLastUpdate: {
    type: Date,
    default: Date.now
  },
  mileageHistory: [{
    mileage: Number,
    date: { type: Date, default: Date.now },
    source: { type: String, enum: ['user', 'intervention', 'diagnostic', 'garage'] },
    note: String
  }],
  
  // ============================================
  // PROPRIÉTAIRES (HISTORIQUE)
  // ============================================
  owners: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    from: {
      type: Date,
      default: Date.now,
      required: true
    },
    to: {
      type: Date,
      default: null
    },
    isCurrent: {
      type: Boolean,
      default: true
    },
    purchasePrice: Number,
    purchaseDate: Date,
    sellerInfo: {
      name: String,
      phone: String,
      email: String
    }
  }],
  
  // ============================================
  // JOURNAL D'ÉVÉNEMENTS (RÉFÉRENCES)
  // ============================================
  logs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VehicleLog'
  }],
  
  // ============================================
  // DOCUMENTS
  // ============================================
  documents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VehicleDocument'
  }],
  
  // ============================================
  // INTERVENTIONS LIÉES
  // ============================================
  interventions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Intervention'
  }],
  
  // ============================================
  // MAINTENANCE PLANIFIÉE
  // ============================================
  scheduledMaintenance: [{
    type: {
      type: String,
      enum: ['vidange', 'pneus', 'freins', 'courroie', 'batterie', 'filtre', 'autre']
    },
    description: String,
    dueDate: Date,
    dueMileage: Number,
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending'
    },
    completedAt: Date,
    notes: String
  }],
  
  // ============================================
  // PROFIL IA
  // ============================================
  aiProfile: {
    commonIssues: [{
      issue: String,
      count: { type: Number, default: 1 },
      lastOccurrence: Date
    }],
    reliabilityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 100
    },
    lastAnalysis: Date,
    predictedMaintenance: [{
      type: String,
      description: String,
      predictedDate: Date,
      predictedMileage: Number,
      confidence: { type: Number, min: 0, max: 100 }
    }],
    healthScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 100
    }
  },
  
  // ============================================
  // NOTES LIBRES
  // ============================================
  notes: [{
    text: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    isPrivate: { type: Boolean, default: false }
  }],
  
  // ============================================
  // STATUT
  // ============================================
  status: {
    type: String,
    enum: ['active', 'sold', 'scrapped', 'stolen', 'inactive'],
    default: 'active'
  },
  soldAt: Date,
  soldTo: {
    name: String,
    email: String,
    phone: String
  }
  
}, {
  timestamps: true
});

// ============================================
// INDEX
// ============================================
vehicleSchema.index({ licensePlate: 1 });
vehicleSchema.index({ vin: 1 }, { unique: true, sparse: true });
vehicleSchema.index({ 'owners.user': 1 });
vehicleSchema.index({ status: 1 });

// ============================================
// MÉTHODES D'INSTANCE
// ============================================

// Obtenir le propriétaire actuel
vehicleSchema.methods.getCurrentOwner = function() {
  return this.owners.find(owner => owner.isCurrent);
};

// Transférer le véhicule à un nouveau propriétaire
vehicleSchema.methods.transfer = async function(newOwnerId, transferData = {}) {
  // Marquer l'ancien propriétaire comme non actuel
  const currentOwner = this.owners.find(o => o.isCurrent);
  if (currentOwner) {
    currentOwner.isCurrent = false;
    currentOwner.to = new Date();
  }
  
  // Ajouter le nouveau propriétaire
  this.owners.push({
    user: newOwnerId,
    from: new Date(),
    isCurrent: true,
    purchasePrice: transferData.price,
    purchaseDate: transferData.date || new Date(),
    sellerInfo: transferData.sellerInfo
  });
  
  this.status = 'active';
  if (transferData.soldAt) this.soldAt = transferData.soldAt;
  if (transferData.soldTo) this.soldTo = transferData.soldTo;
  
  await this.save();
  
  // Ajouter un log de transfert
  const VehicleLog = mongoose.model('VehicleLog');
  await VehicleLog.create({
    vehicle: this._id,
    user: newOwnerId,
    type: 'transfer',
    description: `Véhicule transféré à ${transferData.newOwnerName || 'nouveau propriétaire'}`,
    metadata: {
      fromOwner: currentOwner?.user,
      toOwner: newOwnerId,
      price: transferData.price
    }
  });
  
  return this;
};

// Mettre à jour le kilométrage
vehicleSchema.methods.updateMileage = async function(newMileage, source, note = '') {
  if (newMileage <= this.currentMileage) {
    throw new Error('Le nouveau kilométrage doit être supérieur à l\'actuel');
  }
  
  this.mileageHistory.push({
    mileage: newMileage,
    source,
    note
  });
  
  this.currentMileage = newMileage;
  this.mileageLastUpdate = new Date();
  
  await this.save();
  
  return this;
};

// Ajouter une note
vehicleSchema.methods.addNote = async function(text, authorId, isPrivate = false) {
  this.notes.push({
    text,
    author: authorId,
    isPrivate
  });
  await this.save();
  return this;
};

// Calculer la fiabilité IA
vehicleSchema.methods.calculateReliabilityScore = function() {
  // Base sur l'âge, le kilométrage, les interventions
  const age = new Date().getFullYear() - this.year;
  let score = 100;
  
  // Pénalités selon l'âge
  if (age > 10) score -= 15;
  else if (age > 5) score -= 5;
  
  // Pénalités selon kilométrage
  if (this.currentMileage > 200000) score -= 15;
  else if (this.currentMileage > 100000) score -= 5;
  
  // Pénalités selon problèmes récurrents
  const issuesCount = this.aiProfile.commonIssues?.length || 0;
  score -= issuesCount * 2;
  
  this.aiProfile.reliabilityScore = Math.max(0, Math.min(100, score));
  this.aiProfile.lastAnalysis = new Date();
  
  return this.aiProfile.reliabilityScore;
};

const Vehicle = mongoose.model('Vehicle', vehicleSchema);
export default Vehicle;