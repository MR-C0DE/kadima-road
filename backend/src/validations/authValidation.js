import { body } from 'express-validator';

export const registerValidation = [
  body('firstName')
    .notEmpty().withMessage('Le prénom est requis')
    .isLength({ min: 2 }).withMessage('Le prénom doit avoir au moins 2 caractères')
    .trim(),
  
  body('lastName')
    .notEmpty().withMessage('Le nom est requis')
    .isLength({ min: 2 }).withMessage('Le nom doit avoir au moins 2 caractères')
    .trim(),
  
  body('email')
    .notEmpty().withMessage('L\'email est requis')
    .isEmail().withMessage('Email invalide')
    .normalizeEmail(),
  
  body('phone')
    .notEmpty().withMessage('Le téléphone est requis')
    .matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4}$/)
    .withMessage('Numéro de téléphone invalide'),
  
  body('password')
    .notEmpty().withMessage('Le mot de passe est requis')
    .isLength({ min: 6 }).withMessage('Le mot de passe doit avoir au moins 6 caractères')
];

export const loginValidation = [
  body('email')
    .notEmpty().withMessage('L\'email est requis')
    .isEmail().withMessage('Email invalide'),
  
  body('password')
    .notEmpty().withMessage('Le mot de passe est requis')
];