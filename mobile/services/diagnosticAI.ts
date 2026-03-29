// services/diagnosticAI.ts
import { api } from "../config/api";

interface DiagnosticRequest {
  description?: string;
  photo?: string;
  category?: string;
  vehicleId: string;
  userPreferences: {
    assistanceType: "sos_first" | "diagnostic_first" | "auto";
  };
}

interface DiagnosticResult {
  cause: string;
  confidence: number;
  severity: "VERT" | "ORANGE" | "ROUGE";
  explanation: string;
  recommendedAction:
    | "call_helper"
    | "show_garage"
    | "show_tutorial"
    | "show_diagnostic";
  helper?: {
    available: boolean;
    eta?: number;
    distance?: number;
    name?: string;
  };
  garage?: {
    nearest: any;
  };
  tutorial?: {
    title: string;
    url: string;
    duration: string;
  };
}

// Fonction de décision selon préférence
const getRecommendedAction = (
  severity: string,
  preference: string,
  hasHelperNearby: boolean
): DiagnosticResult["recommendedAction"] => {
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
    if (severity === "ORANGE")
      return hasHelperNearby ? "call_helper" : "show_garage";
    if (severity === "VERT") return "show_tutorial";
  }

  return "show_diagnostic";
};

export const analyzeDiagnostic = async (
  request: DiagnosticRequest
): Promise<DiagnosticResult> => {
  try {
    // 1. Appel API IA (optimisé avec timeout)
    const response = await api.post(
      "/diagnostic/quick",
      {
        description: request.description,
        photo: request.photo,
        category: request.category,
        vehicleId: request.vehicleId,
      },
      {
        timeout: 5000, // 5 secondes max
      }
    );

    const diagnostic = response.data.data.analysis;

    // 2. Récupérer helpers à proximité si besoin
    let nearbyHelpers = [];
    if (diagnostic.severity !== "VERT") {
      try {
        const helpersResponse = await api.get("/helpers/nearby", {
          params: {
            lat: diagnostic.location?.lat,
            lng: diagnostic.location?.lng,
            radius: 10,
          },
          timeout: 3000,
        });
        nearbyHelpers = helpersResponse.data.data || [];
      } catch (e) {
        console.log("Erreur chargement helpers", e);
      }
    }

    // 3. Déterminer l'action selon préférence
    const hasHelperNearby = nearbyHelpers.length > 0;
    const recommendedAction = getRecommendedAction(
      diagnostic.severity,
      request.userPreferences.assistanceType,
      hasHelperNearby
    );

    // 4. Construire la réponse
    return {
      cause: diagnostic.probableCause,
      confidence: diagnostic.confidence,
      severity: diagnostic.severity,
      explanation: diagnostic.explanation,
      recommendedAction,
      helper: hasHelperNearby
        ? {
            available: true,
            eta: nearbyHelpers[0]?.eta || 15,
            distance: nearbyHelpers[0]?.distance,
            name: `${nearbyHelpers[0]?.user?.firstName} ${nearbyHelpers[0]?.user?.lastName}`,
          }
        : undefined,
      garage:
        diagnostic.severity === "ORANGE"
          ? {
              nearest: diagnostic.nearestGarage,
            }
          : undefined,
      tutorial:
        diagnostic.severity === "VERT"
          ? {
              title: `Comment réparer : ${diagnostic.probableCause}`,
              url: diagnostic.tutorialUrl,
              duration: "2 min",
            }
          : undefined,
    };
  } catch (error) {
    console.error("Erreur diagnostic IA:", error);
    // Fallback
    return {
      cause: "Problème non identifié",
      confidence: 0,
      severity: "ORANGE",
      explanation:
        "Notre IA n'a pas pu analyser le problème. Un helper peut vous aider.",
      recommendedAction: "call_helper",
    };
  }
};
