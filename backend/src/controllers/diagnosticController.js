// backend/src/controllers/diagnosticController.js
import {
  analyzeProblem,
  diagnoseWithAnswers,
  quickAnalyze,
  getVideoSuggestions,
  analyzeWithVehicleContext
} from '../services/aiService.js';
import Intervention from '../models/Intervention.js';
import Vehicle from '../models/Vehicle.js';
import VehicleLog from '../models/VehicleLog.js';
import logger from '../config/logger.js';

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

// Parser le texte de l'IA en objet structuré
function parseAnalysisText(text, category) {
  const lowerText = text.toLowerCase();
  
  // Détection basée sur mots-clés
  if (lowerText.includes("batterie") || lowerText.includes("démarre") || lowerText.includes("clic")) {
    return {
      probableCause: "Batterie déchargée",
      confidence: 92,
      severity: "ORANGE",
      explanation: "La batterie semble avoir perdu sa charge. Vérifiez les connexions et essayez un démarrage assisté. Si le problème persiste, l'alternateur pourrait être en cause.",
      actions: [
        "Vérifier les câbles de la batterie",
        "Tenter un démarrage avec des câbles",
        "Faire tester la batterie chez un professionnel"
      ]
    };
  }
  
  if (lowerText.includes("pneu") || lowerText.includes("crevé") || lowerText.includes("plat")) {
    return {
      probableCause: "Pneu crevé",
      confidence: 95,
      severity: "ORANGE",
      explanation: "Un pneu est à plat. Changez la roue ou appelez un helper. Ne roulez pas sur un pneu à plat.",
      actions: [
        "Changer la roue avec la roue de secours",
        "Gonfler le pneu si la crevaison est petite",
        "Appeler un helper pour assistance"
      ]
    };
  }
  
  if (lowerText.includes("moteur") || lowerText.includes("bruit") || lowerText.includes("cliquetis")) {
    return {
      probableCause: "Problème moteur",
      confidence: 85,
      severity: "ROUGE",
      explanation: "Un bruit anormal a été détecté. Ne roulez pas et appelez immédiatement un helper. Cela pourrait être un problème de courroie ou de distribution.",
      actions: [
        "Ne pas démarrer le véhicule",
        "Appeler un helper immédiatement",
        "Préparer les documents du véhicule"
      ]
    };
  }
  
  if (lowerText.includes("voyant") || lowerText.includes("témoin") || category === "warning") {
    return {
      probableCause: "Voyant moteur allumé",
      confidence: 88,
      severity: "ORANGE",
      explanation: "Le voyant moteur est allumé. Cela peut être dû à un capteur, une bougie ou un problème d'échappement. Faites vérifier le véhicule.",
      actions: [
        "Vérifier le bouchon d'essence (bien serré)",
        "Observer si le voyant clignote",
        "Prendre rendez-vous dans un garage"
      ]
    };
  }
  
  if (lowerText.includes("surchauffe") || lowerText.includes("température") || category === "overheat") {
    return {
      probableCause: "Surchauffe moteur",
      confidence: 90,
      severity: "ROUGE",
      explanation: "Le moteur surchauffe. Arrêtez-vous immédiatement pour éviter une casse moteur.",
      actions: [
        "Arrêter le véhicule immédiatement",
        "Ne pas ouvrir le bouchon du radiateur",
        "Appeler un helper ou un remorquage"
      ]
    };
  }
  
  // Par défaut selon la catégorie
  if (category === "battery") {
    return {
      probableCause: "Batterie déchargée",
      confidence: 85,
      severity: "ORANGE",
      explanation: "Le problème semble lié à la batterie. Vérifiez les connexions.",
      actions: ["Vérifier les câbles", "Tester un démarrage assisté", "Appeler un helper"]
    };
  }
  
  if (category === "tire") {
    return {
      probableCause: "Pneu crevé",
      confidence: 90,
      severity: "ORANGE",
      explanation: "Un problème de pneu a été détecté.",
      actions: ["Changer la roue", "Gonfler le pneu", "Appeler un helper"]
    };
  }
  
  // Diagnostic par défaut
  return {
    probableCause: "Problème détecté",
    confidence: 70,
    severity: "ORANGE",
    explanation: "L'IA a détecté un problème. Un helper peut vous aider à identifier la cause.",
    actions: ["Contacter un helper", "Consulter un garage"]
  };
}

// Déterminer l'action recommandée selon la gravité et la préférence
function determineRecommendedAction(severity, preference) {
  // Préférence : toujours appeler un helper
  if (preference === "sos_first") {
    return "call_helper";
  }
  
  // Préférence : diagnostic d'abord
  if (preference === "diagnostic_first") {
    return "show_diagnostic";
  }
  
  // Préférence : automatique selon gravité
  if (preference === "auto") {
    if (severity === "ROUGE") return "call_helper";
    if (severity === "ORANGE") return "show_garage";
    if (severity === "VERT") return "show_tutorial";
  }
  
  return "show_diagnostic";
}

// Obtenir une cause par défaut selon la catégorie
function getDefaultCause(category) {
  const causes = {
    battery: "Batterie déchargée",
    tire: "Pneu crevé",
    engine: "Problème moteur",
    warning: "Voyant moteur allumé",
    noise: "Bruit anormal",
    overheat: "Surchauffe moteur"
  };
  return causes[category] || "Problème détecté";
}

// Obtenir une explication par défaut selon la catégorie
function getDefaultExplanation(category) {
  const explanations = {
    battery: "La batterie semble avoir perdu sa charge. Vérifiez les connexions.",
    tire: "Un pneu est à plat. Changez la roue ou appelez un helper.",
    engine: "Un bruit anormal a été détecté. Ne roulez pas.",
    warning: "Le voyant moteur est allumé. Faites vérifier le véhicule.",
    noise: "Un bruit suspect a été détecté. Faites inspecter le véhicule.",
    overheat: "Le moteur surchauffe. Arrêtez-vous immédiatement."
  };
  return explanations[category] || "L'IA a détecté un problème nécessitant une attention.";
}

// ============================================
// CONTROLLERS
// ============================================

// @desc    Commencer un diagnostic
// @route   POST /api/diagnostic/start
// @access  Private
export const startDiagnostic = async (req, res) => {
  try {
    const { description, vehicleId } = req.body;

    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'Description du problème requise'
      });
    }

    let vehicleContext = null;
    if (vehicleId) {
      const vehicle = await Vehicle.findOne({
        _id: vehicleId,
        'owners.user': req.user._id,
        status: 'active'
      }).populate('logs', 'title description metadata createdAt', null, { limit: 10 });

      if (vehicle) {
        vehicleContext = {
          id: vehicle._id,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          currentMileage: vehicle.currentMileage,
          fuelType: vehicle.fuelType,
          engineType: vehicle.engineType,
          transmission: vehicle.transmission,
          commonIssues: vehicle.aiProfile?.commonIssues || [],
          reliabilityScore: vehicle.aiProfile?.reliabilityScore || 100,
          recentLogs: vehicle.logs?.slice(-5).map(l => ({
            type: l.type,
            description: l.description,
            date: l.createdAt
          }))
        };
      }
    }

    const analysis = vehicleContext 
      ? await analyzeWithVehicleContext(description, vehicleContext)
      : await analyzeProblem(description);

    res.json({
      success: true,
      data: {
        description,
        questions: analysis.questions || [],
        sessionId: new Date().getTime(),
        vehicleContext: vehicleContext ? {
          make: vehicleContext.make,
          model: vehicleContext.model,
          year: vehicleContext.year,
          reliabilityScore: vehicleContext.reliabilityScore
        } : null
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
    const { description, answers, vehicleId, interventionId } = req.body;

    if (!description || !answers || !answers.length) {
      return res.status(400).json({
        success: false,
        message: 'Description et réponses requises'
      });
    }

    let vehicleContext = null;
    let vehicle = null;
    if (vehicleId) {
      vehicle = await Vehicle.findOne({
        _id: vehicleId,
        'owners.user': req.user._id,
        status: 'active'
      });

      if (vehicle) {
        vehicleContext = {
          id: vehicle._id,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          currentMileage: vehicle.currentMileage,
          fuelType: vehicle.fuelType,
          engineType: vehicle.engineType,
          transmission: vehicle.transmission,
          commonIssues: vehicle.aiProfile?.commonIssues || [],
          reliabilityScore: vehicle.aiProfile?.reliabilityScore || 100
        };
      }
    }

    const diagnostic = vehicleContext
      ? await analyzeWithVehicleContext(description, vehicleContext, answers)
      : await diagnoseWithAnswers(description, answers);

    const videos = getVideoSuggestions(diagnostic.diagnostic?.probableCause);

    if (interventionId) {
      await Intervention.findByIdAndUpdate(interventionId, {
        'problem.diagnostic': {
          iaAnalysis: diagnostic.diagnostic.explanation,
          suggestedActions: diagnostic.actions.map(a => a.step),
          confidence: diagnostic.diagnostic.confidence
        }
      });
    }

    if (vehicle) {
      const commonIssueIndex = vehicle.aiProfile.commonIssues.findIndex(
        i => i.issue === diagnostic.diagnostic?.probableCause
      );
      
      if (commonIssueIndex !== -1) {
        vehicle.aiProfile.commonIssues[commonIssueIndex].count += 1;
        vehicle.aiProfile.commonIssues[commonIssueIndex].lastOccurrence = new Date();
      } else if (diagnostic.diagnostic?.probableCause) {
        vehicle.aiProfile.commonIssues.push({
          issue: diagnostic.diagnostic.probableCause,
          count: 1,
          lastOccurrence: new Date()
        });
      }

      vehicle.calculateReliabilityScore();
      await vehicle.save();

      await VehicleLog.create({
        vehicle: vehicle._id,
        user: req.user._id,
        diagnostic: true,
        type: 'diagnostic',
        title: `Diagnostic: ${diagnostic.diagnostic?.probableCause || 'Problème identifié'}`,
        description: diagnostic.diagnostic?.explanation || description,
        metadata: {
          problem: description,
          severity: diagnostic.diagnostic?.severity,
          confidence: diagnostic.diagnostic?.confidence,
          actions: diagnostic.actions?.map(a => a.step)
        }
      });
    }

    res.json({
      success: true,
      data: {
        ...diagnostic,
        videos,
        timestamp: new Date(),
        vehicleInfo: vehicle ? {
          id: vehicle._id,
          make: vehicle.make,
          model: vehicle.model,
          reliabilityScore: vehicle.aiProfile?.reliabilityScore
        } : null
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

// @desc    Analyse rapide (sans questions) - VERSION AMÉLIORÉE
// @route   POST /api/diagnostic/quick
// @access  Private
export const quickDiagnostic = async (req, res) => {
  try {
    const { 
      description, 
      photo, 
      category, 
      vehicleId, 
      location, 
      userPreferences 
    } = req.body;

    console.log("📊 Diagnostic rapide reçu:", { 
      description: description?.substring(0, 50), 
      hasPhoto: !!photo, 
      category, 
      vehicleId 
    });

    // Déterminer la description à analyser
    let analysisText = description;
    
    // Si c'est une catégorie prédéfinie, utiliser la description correspondante
    if (category && !analysisText) {
      const categoryDescriptions = {
        battery: "Ma voiture ne démarre pas, les phares sont faibles",
        tire: "J'ai un pneu crevé ou qui perd de l'air",
        engine: "Le moteur fait un bruit anormal ou manque de puissance",
        warning: "Le voyant moteur est allumé sur le tableau de bord",
        noise: "J'entends un bruit étrange (cliquetis, sifflement, grincement)",
        overheat: "La température du moteur est trop élevée"
      };
      analysisText = categoryDescriptions[category] || "Problème mécanique détecté";
    }
    
    // Si c'est une photo, simuler une analyse (à améliorer avec vision API)
    if (photo && !analysisText) {
      analysisText = "Photo du problème envoyée pour analyse";
    }
    
    if (!analysisText) {
      return res.status(400).json({
        success: false,
        message: 'Description du problème requise'
      });
    }

    // Récupérer le contexte du véhicule
    let vehicleContext = null;
    if (vehicleId) {
      const vehicle = await Vehicle.findOne({
        _id: vehicleId,
        'owners.user': req.user._id,
        status: 'active'
      });

      if (vehicle) {
        vehicleContext = {
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          currentMileage: vehicle.currentMileage,
          commonIssues: vehicle.aiProfile?.commonIssues || []
        };
      }
    }

    // Analyser avec l'IA
    const analysisTextResult = await quickAnalyze(analysisText, vehicleContext);
    
    // Parser le résultat de l'IA
    let diagnosticResult;
    try {
      if (typeof analysisTextResult === 'string' && analysisTextResult.includes('{')) {
        diagnosticResult = JSON.parse(analysisTextResult);
      } else {
        diagnosticResult = parseAnalysisText(analysisTextResult, category);
      }
    } catch (e) {
      diagnosticResult = parseAnalysisText(analysisTextResult, category);
    }

    // Déterminer l'action recommandée selon les préférences
    const severity = diagnosticResult.severity || "ORANGE";
    const recommendedAction = determineRecommendedAction(severity, userPreferences?.assistanceType);

    // Ajouter des vidéos suggérées
    const videos = getVideoSuggestions(diagnosticResult.probableCause?.toLowerCase() || category);

    // Construire la réponse finale
    const result = {
      diagnostic: {
        probableCause: diagnosticResult.probableCause || getDefaultCause(category),
        confidence: diagnosticResult.confidence || 85,
        severity: severity,
        explanation: diagnosticResult.explanation || getDefaultExplanation(category),
        suggestedActions: diagnosticResult.actions || []
      },
      recommendedAction,
      videos: videos.slice(0, 2),
      timestamp: new Date(),
      vehicleInfo: vehicleContext ? {
        make: vehicleContext.make,
        model: vehicleContext.model
      } : null
    };

    console.log("✅ Diagnostic terminé:", { cause: result.diagnostic.probableCause, severity });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error("❌ Erreur quickDiagnostic:", error);
    logger.error(`Erreur quickDiagnostic: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du diagnostic rapide',
      error: error.message
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