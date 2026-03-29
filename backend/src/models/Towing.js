// backend/src/models/Towing.js
import mongoose from 'mongoose';

const towingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  address: String,
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  phone: {
    type: String,
    required: true
  },
  pricing: {
    basePrice: { type: Number, default: 75 },
    perKm: { type: Number, default: 2 },
    afterHours: { type: Number, default: 50 }, // supplément nuit/week-end
    flatRate: Number // tarif fixe pour certaines zones
  },
  available24h: {
    type: Boolean,
    default: true
  },
  serviceArea: {
    type: Number, // rayon en km
    default: 30
  },
  vehicleTypes: [{
    type: String,
    enum: ['voiture', 'suv', 'camionnette', 'poids_lourd']
  }],
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  reviews: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: Number,
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }],
  source: {
    type: String,
    enum: ['partner', 'google'],
    default: 'partner'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, { timestamps: true });

towingSchema.index({ location: '2dsphere' });

export default mongoose.model('Towing', towingSchema);