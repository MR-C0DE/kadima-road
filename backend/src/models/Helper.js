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
  certification: {
    isCertified: { type: Boolean, default: false },
    certifiedAt: Date,
    expiresAt: Date,
    certificateNumber: String,
    trainingCompleted: { type: Boolean, default: false },
    backgroundCheck: { type: Boolean, default: false }
  },
  serviceArea: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    },
    radius: { type: Number, default: 20 } // Rayon en km
  },
  availability: {
    isAvailable: { type: Boolean, default: true },
    schedule: [{
      day: { type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
      startTime: String,
      endTime: String
    }]
  },
  services: [{
    type: String,
    enum: ['battery', 'tire', 'fuel', 'jumpstart', 'lockout', 'minor_repair', 'towing']
  }],
  equipment: [{
    name: String,
    has: Boolean,
    lastChecked: Date
  }],
  pricing: {
    basePrice: { type: Number, required: true },
    perKm: { type: Number, default: 1 },
    services: [{
      service: String,
      price: Number
    }]
  },
  stats: {
    totalInterventions: { type: Number, default: 0 },
    completedInterventions: { type: Number, default: 0 },
    cancelledInterventions: { type: Number, default: 0 },
    averageResponseTime: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 }
  },
  documents: [{
    type: { type: String, enum: ['license', 'insurance', 'certification'] },
    url: String,
    verified: { type: Boolean, default: false },
    uploadedAt: Date
  }],
  reviews: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

helperSchema.index({ 'serviceArea.coordinates': '2dsphere' });

const Helper = mongoose.model('Helper', helperSchema);
export default Helper;