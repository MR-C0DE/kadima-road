import OpenAI from 'openai';
import logger from '../config/logger.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Système de diagnostic automobile
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

// Analyse rapide (pour l'historique)
export const quickAnalyze = async (description) => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { 
          role: 'system', 
          content: 'Tu es un mécanicien expert. Donne un diagnostic rapide en 2-3 phrases.' 
        },
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

// Suggestions de vidéos YouTube (simulé pour l'instant)
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
    ]
  };

  return videos[diagnostic] || [];
};