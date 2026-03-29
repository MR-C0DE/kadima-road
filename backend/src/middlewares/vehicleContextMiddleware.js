import Vehicle from '../models/Vehicle.js';
import VehicleLog from '../models/VehicleLog.js';

// Middleware pour charger le contexte du véhicule pour l'IA
export const loadVehicleContext = async (req, res, next) => {
  try {
    const { vehicleId } = req.body;
    
    if (!vehicleId) {
      req.vehicleContext = null;
      return next();
    }

    const vehicle = await Vehicle.findById(vehicleId)
      .populate('logs', 'type description metadata createdAt', null, { limit: 10 })
      .populate('interventions', 'problem status createdAt');

    if (!vehicle) {
      req.vehicleContext = null;
      return next();
    }

    // Construire le contexte pour l'IA
    req.vehicleContext = {
      id: vehicle._id,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      currentMileage: vehicle.currentMileage,
      fuelType: vehicle.fuelType,
      engineType: vehicle.engineType,
      transmission: vehicle.transmission,
      
      // Historique des problèmes
      commonIssues: vehicle.aiProfile?.commonIssues || [],
      
      // Interventions récentes
      recentInterventions: vehicle.interventions?.slice(-5).map(i => ({
        type: i.type,
        problem: i.problem?.description,
        status: i.status,
        date: i.createdAt
      })),
      
      // Logs récents
      recentLogs: vehicle.logs?.slice(-5).map(l => ({
        type: l.type,
        description: l.description,
        date: l.createdAt
      })),
      
      // Score de fiabilité
      reliabilityScore: vehicle.aiProfile?.reliabilityScore || 100
    };

    next();
    
  } catch (error) {
    console.error('Erreur chargement contexte véhicule:', error);
    req.vehicleContext = null;
    next();
  }
};