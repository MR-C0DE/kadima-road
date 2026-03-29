// backend/src/models/AssistanceRequest.js
import mongoose from 'mongoose';

const assistanceRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['helper', 'garage', 'towing'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'type' // dynamique: Helper, Garage ou Towing
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'en_route', 'arrived', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  problem: {
    description: String,
    category: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    photos: [String]
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
    address: String
  },
  eta: Number, // minutes
  pricing: {
    estimated: Number,
    final: Number
  },
  timeline: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String
  }],
  messages: [{
    sender: { type: String, enum: ['user', 'provider', 'system'] },
    content: String,
    timestamp: { type: Date, default: Date.now },
    read: { type: Boolean, default: false }
  }],
  acceptedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  cancellationReason: String
}, { timestamps: true });

assistanceRequestSchema.index({ user: 1, status: 1 });
assistanceRequestSchema.index({ targetId: 1, status: 1 });
assistanceRequestSchema.index({ 'location.coordinates': '2dsphere' });

export default mongoose.model('AssistanceRequest', assistanceRequestSchema);