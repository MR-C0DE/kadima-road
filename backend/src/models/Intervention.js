import mongoose from 'mongoose';

const interventionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  helper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Helper'
  },
  sosAlert: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SOSAlert'
  },
  status: {
    type: String,
    enum: [
      'pending',      // En attente d'acceptation
      'accepted',     // Accepté par un helper
      'en_route',     // Le helper arrive
      'arrived',      // Le helper est sur place
      'in_progress',  // Travail en cours
      'completed',    // Terminé
      'cancelled',    // Annulé
      'expired'       // Expiré (pas de helper trouvé)
    ],
    default: 'pending'
  },
  type: {
    type: String,
    enum: ['sos', 'assistance', 'towing', 'diagnostic'],
    required: true
  },
  problem: {
    description: String,
    category: {
      type: String,
      enum: ['battery', 'tire', 'fuel', 'engine', 'electrical', 'accident', 'other']
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    photos: [String],
    diagnostic: {
      iaAnalysis: String,
      suggestedActions: [String],
      confidence: Number
    }
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    },
    address: String,
    landmark: String
  },
  destination: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: [Number],
    address: String
  },
  timeline: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String,
    location: {
      coordinates: [Number]
    }
  }],
  pricing: {
    estimated: Number,
    final: Number,
    distance: Number,
    duration: Number,
    breakdown: {
      base: Number,
      perKm: Number,
      service: Number,
      tax: Number
    }
  },
  payment: {
    method: {
      type: String,
      enum: ['card', 'cash', 'wallet', 'insurance']
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    stripePaymentIntentId: String,
    amount: Number,
    paidAt: Date
  },
  communication: {
    chatEnabled: { type: Boolean, default: true },
    messages: [{
      sender: { type: String, enum: ['user', 'helper', 'system'] },
      content: String,
      timestamp: { type: Date, default: Date.now },
      read: { type: Boolean, default: false }
    }],
    lastMessageAt: Date
  },
  review: {
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    createdAt: Date
  },
  cancellation: {
    cancelledBy: { type: String, enum: ['user', 'helper', 'system'] },
    reason: String,
    cancelledAt: Date
  },
  emergency: {
    isEmergency: { type: Boolean, default: false },
    emergencyContactNotified: { type: Boolean, default: false },
    ambulanceDispatched: { type: Boolean, default: false },
    policeDispatched: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

interventionSchema.index({ 'location.coordinates': '2dsphere' });
interventionSchema.index({ status: 1, createdAt: -1 });
interventionSchema.index({ user: 1, createdAt: -1 });

const Intervention = mongoose.model('Intervention', interventionSchema);
export default Intervention;