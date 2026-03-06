import {
    analyzeProblem,
    diagnoseWithAnswers,
    quickAnalyze,
    getVideoSuggestions
  } from '../services/aiService.js';
  import Intervention from '../models/Intervention.js';
  import logger from '../config/logger.js';
  
  // @desc    Commencer un diagnostic
  // @route   POST /api/diagnostic/start
  // @access  Private
  export const startDiagnostic = async (req, res) => {
    try {
      const { description } = req.body;
  
      if (!description) {
        return res.status(400).json({
          success: false,
          message: 'Description du problème requise'
        });
      }
  
      // Analyser la description
      const analysis = await analyzeProblem(description);
  
      // Sauvegarder dans la session (optionnel)
      // Pour l'instant on retourne juste les questions
  
      res.json({
        success: true,
        data: {
          description,
          questions: analysis.questions || [],
          sessionId: new Date().getTime() // Simple ID de session
        }
      });
  
    } catch (error) {
      logger.error(`Erreur start diagnostic: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du démarrage du diagnostic',
        error: error.message
      });
    }
  };
  
  // @desc    Obtenir le diagnostic final
  // @route   POST /api/diagnostic/result
  // @access  Private
  export const getDiagnosticResult = async (req, res) => {
    try {
      const { description, answers } = req.body;
  
      if (!description || !answers || !answers.length) {
        return res.status(400).json({
          success: false,
          message: 'Description et réponses requises'
        });
      }
  
      // Obtenir le diagnostic
      const diagnostic = await diagnoseWithAnswers(description, answers);
  
      // Ajouter des vidéos suggérées
      const videos = getVideoSuggestions(diagnostic.diagnostic?.probableCause);
  
      // Sauvegarder dans l'intervention si fournie
      if (req.body.interventionId) {
        await Intervention.findByIdAndUpdate(req.body.interventionId, {
          'problem.diagnostic': {
            iaAnalysis: diagnostic.diagnostic.explanation,
            suggestedActions: diagnostic.actions.map(a => a.step),
            confidence: diagnostic.diagnostic.confidence
          }
        });
      }
  
      res.json({
        success: true,
        data: {
          ...diagnostic,
          videos,
          timestamp: new Date()
        }
      });
  
    } catch (error) {
      logger.error(`Erreur diagnostic: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du diagnostic',
        error: error.message
      });
    }
  };
  
  // @desc    Analyse rapide (sans questions)
  // @route   POST /api/diagnostic/quick
  // @access  Private
  export const quickDiagnostic = async (req, res) => {
    try {
      const { description } = req.body;
  
      if (!description) {
        return res.status(400).json({
          success: false,
          message: 'Description requise'
        });
      }
  
      const result = await quickAnalyze(description);
  
      res.json({
        success: true,
        data: {
          description,
          analysis: result,
          timestamp: new Date()
        }
      });
  
    } catch (error) {
      logger.error(`Erreur analyse rapide: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'analyse rapide'
      });
    }
  };
  
  // @desc    Obtenir des tutoriels par type de panne
  // @route   GET /api/diagnostic/tutorials/:type
  // @access  Private
  export const getTutorials = (req, res) => {
    const { type } = req.params;
    
    const tutorials = {
      battery: [
        {
          title: "Comment jumper une batterie",
          steps: [
            "Positionnez les deux véhicules face à face",
            "Connectez le câble rouge sur la borne positive (+) de la batterie déchargée",
            "Connectez l'autre extrémité du câble rouge sur la batterie du véhicule donneur",
            "Connectez le câble noir sur la borne négative (-) de la batterie donneuse",
            "Connectez l'autre extrémité du câble noir sur une partie métallique du véhicule en panne",
            "Démarrez le véhicule donneur, attendez 2 minutes",
            "Tentez de démarrer le véhicule en panne"
          ],
          videoUrl: "https://youtu.be/example1",
          precautions: [
            "Ne touchez pas les pinces entre elles",
            "Vérifiez que les câbles ne touchent pas les pièces mobiles"
          ]
        }
      ],
      tire: [
        {
          title: "Changer une roue",
          steps: [
            "Stationnez sur une surface plane",
            "Mettez le frein à main",
            "Placez la roue de secours près du pneu crevé",
            "Desserrez les écrous (ne les enlevez pas)",
            "Lever le véhicule avec le cric",
            "Enlevez les écrous et la roue",
            "Placez la roue de secours",
            "Vissez les écrous à la main",
            "Abaissez le véhicule",
            "Serrez les écrous en croix"
          ],
          videoUrl: "https://youtu.be/example2"
        }
      ],
      fuel: [
        {
          title: "Panne d'essence",
          steps: [
            "Allumez vos feux de détresse",
            "Placez le triangle de signalisation",
            "Appelez un service d'assistance",
            "Si vous avez un bidon, le garage le plus proche est à 2 km"
          ],
          videoUrl: "https://youtu.be/example3"
        }
      ]
    };
  
    res.json({
      success: true,
      data: tutorials[type] || []
    });
  };