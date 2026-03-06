import mongoose from 'mongoose';

const sosAlertSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  intervention: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Intervention'
  },
  status: {
    type: String,
    enum: ['active', 'dispatched', 'resolved', 'cancelled'],
    default: 'active'
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
    accuracy: Number
  },
  vehicle: {
    make: String,
    model: String,
    year: Number,
    licensePlate: String,
    color: String
  },
  problem: {
    description: String,
    category: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    }
  },
  emergencyContacts: [{
    name: String,
    phone: String,
    notified: { type: Boolean, default: false },
    notifiedAt: Date
  }],
  notifications: {
    emergencyServices: {
      notified: { type: Boolean, default: false },
      notifiedAt: Date,
      serviceType: {
        ambulance: { type: Boolean, default: false },
        police: { type: Boolean, default: false },
        fire: { type: Boolean, default: false }
      }
    },
    nearbyHelpers: [{
      helper: { type: mongoose.Schema.Types.ObjectId, ref: 'Helper' },
      distance: Number,
      notifiedAt: Date,
      responded: { type: Boolean, default: false },
      responseTime: Number
    }]
  },
  timeline: [{
    event: String,
    timestamp: { type: Date, default: Date.now },
    data: mongoose.Schema.Types.Mixed
  }],
  resolvedAt: Date,
  resolvedBy: {
    type: String,
    enum: ['helper', 'user', 'emergency', 'system']
  }
}, {
  timestamps: true
});

sosAlertSchema.index({ 'location.coordinates': '2dsphere' });
sosAlertSchema.index({ status: 1, createdAt: -1 });

const SOSAlert = mongoose.model('SOSAlert', sosAlertSchema);
export default SOSAlert;