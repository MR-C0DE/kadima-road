// backend/src/models/VehicleDocument.js
import mongoose from 'mongoose';

const vehicleDocumentSchema = new mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['carte_grise', 'assurance', 'controle_technique', 'facture_achat', 'facture_entretien', 'photo', 'autre'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  fileUrl: {
    type: String,
    default: null, // ✅ MODIFIÉ : permet null au lieu de required
    validate: {
      validator: function(v) {
        // Si ce n'est pas un document, on accepte null
        if (this.type === 'autre' && !v) return true;
        // Sinon, il faut une URL
        return v !== null && v !== '';
      },
      message: 'Le fichier est requis pour ce type de document'
    }
  },
  fileName: {
    type: String,
    trim: true
  },
  fileSize: {
    type: Number,
    min: 0
  },
  mimeType: {
    type: String,
    trim: true
  },
  metadata: {
    expiryDate: { type: Date, default: null },
    issueDate: { type: Date, default: null },
    referenceNumber: { type: String, trim: true },
    issuer: { type: String, trim: true }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  isValid: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    default: null
  },
  isPublic: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index
vehicleDocumentSchema.index({ vehicle: 1, createdAt: -1 });
vehicleDocumentSchema.index({ type: 1 });
vehicleDocumentSchema.index({ expiresAt: 1 });

// Méthodes
vehicleDocumentSchema.methods.isExpired = function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

vehicleDocumentSchema.methods.isExpiringSoon = function() {
  if (!this.expiresAt) return false;
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  return this.expiresAt <= thirtyDaysFromNow && !this.isExpired();
};

vehicleDocumentSchema.methods.markAsVerified = async function(adminId) {
  this.isVerified = true;
  this.verifiedBy = adminId;
  this.verifiedAt = new Date();
  await this.save();
  return this;
};

// ⚡ PROTECTION CONTRE LES IMPORTS MULTIPLES
const VehicleDocument = mongoose.models.VehicleDocument || mongoose.model('VehicleDocument', vehicleDocumentSchema);

export default VehicleDocument;