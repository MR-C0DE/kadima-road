// backend/src/models/VehicleLog.js
import mongoose from 'mongoose';

const vehicleLogSchema = new mongoose.Schema({
  // ============================================
  // LIENS
  // ============================================
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
  
  // ============================================
  // TYPE DE LOG (CORRIGÉ)
  // ============================================
  type: {
    type: String,
    enum: [
      'acquisition',     // ✅ AJOUTÉ - Acquisition du véhicule
      'intervention',    // Intervention (SOS, assistance)
      'diagnostic',      // Diagnostic IA
      'note',            // Note ajoutée par l'utilisateur
      'transfer',        // Transfert de propriété
      'sos',             // Alerte SOS
      'maintenance',     // Maintenance planifiée
      'mileage_update',  // Mise à jour kilométrage
      'alert'            // Alerte système
    ],
    required: true
  },
  
  // ============================================
  // CONTENU
  // ============================================
  title: {
    type: String,
    required: true
  },
  description: String,
  
  // ============================================
  // MÉTADONNÉES
  // ============================================
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  }
  
}, {
  timestamps: true
});

// Index
vehicleLogSchema.index({ vehicle: 1 });
vehicleLogSchema.index({ type: 1 });
vehicleLogSchema.index({ createdAt: -1 });

const VehicleLog = mongoose.models.VehicleLog || mongoose.model('VehicleLog', vehicleLogSchema);
export default VehicleLog;