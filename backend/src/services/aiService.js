import OpenAI from 'openai';
import logger from '../config/logger.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Système de diagnostic automobile de base
const SYSTEM_PROMPT = `Tu es un mécanicien expert avec 20 ans d'expérience. 
Tu aides les conducteurs à diagnostiquer leurs pannes de voiture.

Règles :
1. Pose des questions simples et claires
2. Propose un diagnostic probable basé sur les symptômes
3. Donne un niveau de gravité (VERT, ORANGE, ROUGE)
4. Suggère des actions concrètes
5. Reste prudent : en cas de doute, recommande un professionnel

Format de réponse attendu (JSON) :
{
  "questions": ["question1", "question2"],
  "diagnostic": {
    "probableCause": "description courte",
    "confidence": 0-100,
    "severity": "VERT|ORANGE|ROUGE",
    "explanation": "explication détaillée"
  },
  "actions": [
    {
      "step": "description",
      "type": "check|fix|call",
      "videoUrl": "lien optionnel"
    }
  ],
  "recommendation": "appeler un helper|réparer soi-même|conduire au garage"
}`;

// ============================================
// ⚡ NOUVEAU : Système de diagnostic avec contexte véhicule
// ============================================
const VEHICLE_CONTEXT_PROMPT = `Tu es un mécanicien expert avec 20 ans d'expérience.
Tu aides les conducteurs à diagnostiquer leurs pannes de voiture.

CONTEXTE IMPORTANT :
- Tu as accès à l'historique complet du véhicule (interventions passées, problèmes récurrents)
- Utilise cet historique pour éviter de poser des questions déjà répondues
- Adapte ton diagnostic en fonction des problèmes déjà rencontrés
- Si le problème est récurrent, propose une solution définitive
- Si le véhicule a déjà eu des problèmes similaires, tiens-en compte

Règles :
1. Pose des questions simples et claires (uniquement si nécessaire)
2. Propose un diagnostic probable basé sur les symptômes ET l'historique
3. Donne un niveau de gravité (VERT, ORANGE, ROUGE)
4. Suggère des actions concrètes
5. Reste prudent : en cas de doute, recommande un professionnel

Format de réponse attendu (JSON) :
{
  "questions": ["question1", "question2"],
  "diagnostic": {
    "probableCause": "description courte",
    "confidence": 0-100,
    "severity": "VERT|ORANGE|ROUGE",
    "explanation": "explication détaillée",
    "historicalContext": "mention des problèmes similaires déjà rencontrés"
  },
  "actions": [
    {
      "step": "description",
      "type": "check|fix|call",
      "videoUrl": "lien optionnel"
    }
  ],
  "recommendation": "appeler un helper|réparer soi-même|conduire au garage"
}`;

// ============================================
// ANALYSE AVEC CONTEXTE VÉHICULE
// ============================================

// Analyser la description initiale avec contexte véhicule
export const analyzeProblemWithVehicleContext = async (description, vehicleContext) => {
  try {
    const systemPrompt = VEHICLE_CONTEXT_PROMPT + `
    
HISTORIQUE DU VÉHICULE :
- Marque/Modèle: ${vehicleContext.make} ${vehicleContext.model} (${vehicleContext.year})
- Kilométrage: ${vehicleContext.currentMileage} km
- Type carburant: ${vehicleContext.fuelType}
- Transmission: ${vehicleContext.transmission}
- Score fiabilité: ${vehicleContext.reliabilityScore}%

Problèmes récurrents :
${vehicleContext.commonIssues?.map(i => `- ${i.issue} (${i.count} fois, dernière fois: ${new Date(i.lastOccurrence).toLocaleDateString()})`).join('\n') || 'Aucun problème récurrent détecté'}

Interventions récentes :
${vehicleContext.recentInterventions?.map(i => `- ${i.problem || i.description} (${new Date(i.date).toLocaleDateString()})`).join('\n') || 'Aucune intervention récente'}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Voici le problème décrit par le conducteur : "${description}". Analyse et retourne les premières questions à poser (si nécessaire).` }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    logger.error(`Erreur analyse problème avec contexte: ${error.message}`);
    throw error;
  }
};

// Analyser avec les réponses aux questions (avec contexte)
export const diagnoseWithVehicleContext = async (initialDescription, questionsAndAnswers, vehicleContext) => {
  try {
    const context = `
HISTORIQUE DU VÉHICULE :
- Marque/Modèle: ${vehicleContext.make} ${vehicleContext.model} (${vehicleContext.year})
- Kilométrage: ${vehicleContext.currentMileage} km
- Score fiabilité: ${vehicleContext.reliabilityScore}%

Problèmes récurrents :
${vehicleContext.commonIssues?.map(i => `- ${i.issue} (${i.count} fois)`).join('\n') || 'Aucun problème récurrent détecté'}

Problème actuel : "${initialDescription}"

Questions et réponses :
${questionsAndAnswers.map(qa => `Q: ${qa.question}\nR: ${qa.answer}`).join('\n')}
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: VEHICLE_CONTEXT_PROMPT },
        { role: 'user', content: context + '\n\nBasé sur ces informations et l\'historique du véhicule, fournis un diagnostic complet au format JSON.' }
      ],
      temperature: 0.5,
      max_tokens: 800
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    logger.error(`Erreur diagnostic avec contexte: ${error.message}`);
    throw error;
  }
};

// ============================================
// FONCTIONS ORIGINALES (gardées pour compatibilité)
// ============================================

// Analyser la description initiale
export const analyzeProblem = async (description) => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Voici le problème décrit par le conducteur : "${description}". Analyse et retourne les premières questions à poser.` }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    logger.error(`Erreur analyse problème: ${error.message}`);
    throw error;
  }
};

// Analyser avec les réponses aux questions
export const diagnoseWithAnswers = async (initialDescription, questionsAndAnswers) => {
  try {
    const context = `
Problème initial : "${initialDescription}"
Questions et réponses :
${questionsAndAnswers.map(qa => `Q: ${qa.question}\nR: ${qa.answer}`).join('\n')}
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: context + '\n\nBasé sur ces informations, fournis un diagnostic complet au format JSON.' }
      ],
      temperature: 0.5,
      max_tokens: 800
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    logger.error(`Erreur diagnostic: ${error.message}`);
    throw error;
  }
};

// Analyse rapide (pour l'historique) - version avec contexte optionnel
export const quickAnalyze = async (description, vehicleContext = null) => {
  try {
    let systemPrompt = 'Tu es un mécanicien expert. Donne un diagnostic rapide en 2-3 phrases.';
    
    if (vehicleContext) {
      systemPrompt = `Tu es un mécanicien expert. Donne un diagnostic rapide en 2-3 phrases.
      
Contexte du véhicule :
- ${vehicleContext.make} ${vehicleContext.model} (${vehicleContext.year})
- Kilométrage: ${vehicleContext.currentMileage} km
Problèmes récurrents: ${vehicleContext.commonIssues?.map(i => i.issue).join(', ') || 'aucun'}`;
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: description }
      ],
      temperature: 0.3,
      max_tokens: 150
    });

    return response.choices[0].message.content;
  } catch (error) {
    logger.error(`Erreur analyse rapide: ${error.message}`);
    return "Analyse non disponible pour le moment";
  }
};

// ============================================
// FONCTION PRINCIPALE POUR DIAGNOSTIC AVEC CONTEXTE
// ============================================

// Fonction unifiée pour le diagnostic avec contexte
export const analyzeWithVehicleContext = async (description, vehicleContext, answers = null) => {
  try {
    // Si des réponses sont fournies, c'est la phase finale
    if (answers && answers.length > 0) {
      return await diagnoseWithVehicleContext(description, answers, vehicleContext);
    }
    // Sinon, c'est la phase initiale
    return await analyzeProblemWithVehicleContext(description, vehicleContext);
  } catch (error) {
    logger.error(`Erreur analyse avec contexte: ${error.message}`);
    throw error;
  }
};

// Suggestions de vidéos YouTube
export const getVideoSuggestions = (diagnostic) => {
  const videos = {
    battery: [
      { title: "Comment démarrer avec des câbles", url: "https://youtu.be/example1" },
      { title: "Tester une batterie avec un multimètre", url: "https://youtu.be/example2" }
    ],
    tire: [
      { title: "Changer une roue en 5 étapes", url: "https://youtu.be/example3" }
    ],
    engine: [
      { title: "Vérifier les niveaux d'huile", url: "https://youtu.be/example4" }
    ],
    fuel: [
      { title: "Panne d'essence : que faire ?", url: "https://youtu.be/example5" }
    ]
  };

  return videos[diagnostic] || [];
};