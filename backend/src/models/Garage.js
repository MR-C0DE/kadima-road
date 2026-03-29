// backend/src/models/Garage.js
import mongoose from 'mongoose';

const garageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
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
    }
  },
  phone: String,
  email: String,
  website: String,
  openingHours: {
    monday: String,
    tuesday: String,
    wednesday: String,
    thursday: String,
    friday: String,
    saturday: String,
    sunday: String
  },
  services: [{
    type: String,
    enum: ['reparation', 'diagnostic', 'vidange', 'freins', 'pneus', 'climatisation', 'moteur', 'electrique']
  }],
  brands: [String], // marques de voitures réparées
  images: [String],
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
  googlePlaceId: String, // pour éviter les doublons
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, { timestamps: true });

garageSchema.index({ location: '2dsphere' });

export default mongoose.model('Garage', garageSchema);