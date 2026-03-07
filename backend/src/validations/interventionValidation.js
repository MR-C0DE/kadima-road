import { body, param, query } from 'express-validator';

// Validation pour la création d'une intervention
export const createInterventionValidation = [
  body('type')
    .optional()
    .isIn(['sos', 'assistance', 'towing', 'diagnostic'])
    .withMessage('Type d\'intervention invalide'),
  
  body('problem.description')
    .notEmpty()
    .withMessage('La description du problème est requise')
    .isLength({ min: 5, max: 500 })
    .withMessage('La description doit contenir entre 5 et 500 caractères')
    .trim(),
  
  body('problem.category')
    .optional()
    .isIn(['battery', 'tire', 'fuel', 'engine', 'electrical', 'accident', 'other'])
    .withMessage('Catégorie de problème invalide'),
  
  body('problem.severity')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Niveau de gravité invalide'),
  
  body('problem.photos')
    .optional()
    .isArray()
    .withMessage('Les photos doivent être un tableau'),
  
  body('problem.photos.*')
    .optional()
    .isURL()
    .withMessage('Chaque photo doit être une URL valide'),
  
  body('location.coordinates')
    .notEmpty()
    .withMessage('Les coordonnées sont requises')
    .isArray({ min: 2, max: 2 })
    .withMessage('Les coordonnées doivent être un tableau [longitude, latitude]'),
  
  body('location.coordinates.0')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude invalide'),
  
  body('location.coordinates.1')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude invalide'),
  
  body('location.address')
    .optional()
    .isString()
    .withMessage('L\'adresse doit être une chaîne de caractères')
    .trim(),
  
  body('destination.coordinates')
    .optional()
    .isArray({ min: 2, max: 2 })
    .withMessage('Les coordonnées de destination doivent être un tableau [longitude, latitude]'),
  
  body('destination.coordinates.0')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude de destination invalide'),
  
  body('destination.coordinates.1')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude de destination invalide'),
  
  body('destination.address')
    .optional()
    .isString()
    .withMessage('L\'adresse de destination doit être une chaîne de caractères')
    .trim(),
  
  body('sosAlertId')
    .optional()
    .isMongoId()
    .withMessage('ID d\'alerte SOS invalide'),
  
  body('helperId')
    .optional()
    .isMongoId()
    .withMessage('ID de helper invalide')
];

// Validation pour la mise à jour du statut
export const updateStatusValidation = [
  param('id')
    .isMongoId()
    .withMessage('ID d\'intervention invalide'),
  
  body('status')
    .notEmpty()
    .withMessage('Le statut est requis')
    .isIn([
      'pending', 'accepted', 'en_route', 'arrived',
      'in_progress', 'completed', 'cancelled', 'expired'
    ])
    .withMessage('Statut invalide'),
  
  body('note')
    .optional()
    .isString()
    .withMessage('La note doit être une chaîne de caractères')
    .isLength({ max: 500 })
    .withMessage('La note ne peut pas dépasser 500 caractères')
    .trim(),
  
  body('location')
    .optional()
    .isObject()
    .withMessage('La location doit être un objet'),
  
  body('location.coordinates')
    .optional()
    .isArray({ min: 2, max: 2 })
    .withMessage('Les coordonnées doivent être un tableau [longitude, latitude]'),
  
  body('location.coordinates.0')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude invalide'),
  
  body('location.coordinates.1')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude invalide')
];

// Validation pour l'assignation d'un helper
export const assignHelperValidation = [
  param('id')
    .isMongoId()
    .withMessage('ID d\'intervention invalide'),
  
  body('helperId')
    .optional()
    .isMongoId()
    .withMessage('ID de helper invalide')
];

// Validation pour l'ajout d'un message
export const addMessageValidation = [
  param('id')
    .isMongoId()
    .withMessage('ID d\'intervention invalide'),
  
  body('content')
    .notEmpty()
    .withMessage('Le message est requis')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Le message doit contenir entre 1 et 1000 caractères')
    .trim()
];

// Validation pour l'ajout d'une évaluation
export const addReviewValidation = [
  param('id')
    .isMongoId()
    .withMessage('ID d\'intervention invalide'),
  
  body('rating')
    .notEmpty()
    .withMessage('La note est requise')
    .isInt({ min: 1, max: 5 })
    .withMessage('La note doit être comprise entre 1 et 5'),
  
  body('comment')
    .optional()
    .isString()
    .withMessage('Le commentaire doit être une chaîne de caractères')
    .isLength({ max: 500 })
    .withMessage('Le commentaire ne peut pas dépasser 500 caractères')
    .trim()
];

// Validation pour l'annulation d'une intervention
export const cancelInterventionValidation = [
  param('id')
    .isMongoId()
    .withMessage('ID d\'intervention invalide'),
  
  body('reason')
    .optional()
    .isString()
    .withMessage('La raison doit être une chaîne de caractères')
    .isLength({ max: 500 })
    .withMessage('La raison ne peut pas dépasser 500 caractères')
    .trim()
];

// Validation pour la récupération d'une intervention par ID
export const getInterventionByIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('ID d\'intervention invalide')
];

// Validation pour la recherche d'interventions actives
export const getActiveInterventionsValidation = [
  query('lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude invalide'),
  
  query('lng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude invalide'),
  
  query('radius')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Le rayon doit être compris entre 1 et 50 km')
];

// Validation pour les statistiques
export const getHelperStatsValidation = [
  param('id')
    .isMongoId()
    .withMessage('ID de helper invalide')
];