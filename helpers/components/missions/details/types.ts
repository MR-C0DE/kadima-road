// helpers/components/missions/details/types.ts

export interface MissionDetail {
  _id: string;
  type: string;
  status: MissionStatus;
  client: ClientInfo;
  vehicle?: VehicleInfo;
  problem: ProblemInfo;
  location: LocationInfo;
  createdAt: string;
  eta?: number;
  distance?: number;
  reward?: number;
  pricing?: PricingInfo;
  timeline?: TimelineEvent[];
}

export type MissionStatus =
  | "pending" // En attente d'acceptation
  | "accepted" // Accepté par un helper
  | "en_route" // Le helper arrive
  | "arrived" // Le helper est sur place
  | "in_progress" // Travail en cours
  | "completed" // Terminé
  | "cancelled" // Annulé
  | "expired"; // Expiré (pas de helper trouvé)

export interface ClientInfo {
  firstName: string;
  lastName: string;
  phone: string;
  photo?: string;
  email?: string;
}

export interface VehicleInfo {
  make: string; // Marque (ex: Toyota)
  model: string; // Modèle (ex: Camry)
  year: number; // Année (ex: 2020)
  licensePlate: string; // Plaque d'immatriculation
  color?: string; // Couleur (ex: Rouge, Bleu)
  fuelType?: FuelType; // Type de carburant
  transmission?: Transmission;
  vin?: string; // Numéro VIN (optionnel)
  currentMileage?: number;
}

export type FuelType =
  | "essence"
  | "diesel"
  | "electrique"
  | "hybride"
  | "gpl"
  | "autre";

export type Transmission =
  | "manuelle"
  | "automatique"
  | "semi-automatique"
  | "cvt";

export interface ProblemInfo {
  description: string;
  category: ProblemCategory;
  severity?: Severity;
  photos?: string[];
  diagnostic?: DiagnosticInfo;
}

export type ProblemCategory =
  | "battery" // Batterie
  | "tire" // Pneu
  | "fuel" // Essence
  | "engine" // Moteur
  | "electrical" // Électrique
  | "accident" // Accident
  | "lockout" // Clés enfermées
  | "other"; // Autre

export type Severity =
  | "low" // Faible
  | "medium" // Moyen
  | "high" // Élevé
  | "critical"; // Critique

export interface DiagnosticInfo {
  iaAnalysis: string;
  suggestedActions: string[];
  confidence: number;
}

export interface LocationInfo {
  address: string;
  coordinates: [number, number]; // [longitude, latitude]
  landmark?: string;
}

export interface PricingInfo {
  estimated: number;
  final?: number;
  breakdown?: {
    base: number;
    perKm: number;
    service: number;
    tax: number;
  };
}

export interface TimelineEvent {
  status: MissionStatus;
  timestamp: Date;
  note?: string;
  location?: {
    coordinates: [number, number];
  };
  updatedBy?: string;
  updatedByRole?: "helper" | "user" | "system";
}

// Configuration des statuts pour l'affichage UI
export interface StatusConfig {
  color: string;
  bgColor: string;
  icon: string;
  label: string;
  nextStatuses: MissionStatus[];
}
// helpers/components/missions/details/types.ts

export interface VehicleHistory {
  lastIntervention?: {
    date: string;
    type: string;
    description: string;
  };
  recentInterventions?: Array<{
    date: string;
    type: string;
    description: string;
  }>;
  nextMaintenance?: {
    type: string;
    dueKm: number;
    currentKm: number;
  };
  alerts?: string[];
  currentMileage?: number;
}

export interface VehicleInfo {
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  color?: string;
  fuelType?: string;
  transmission?: string;
  history?: VehicleHistory; // ✅ AJOUT
}

export const STATUS_CONFIG: Record<MissionStatus, StatusConfig> = {
  pending: {
    color: "#FFC107",
    bgColor: "#FFC10720",
    icon: "time",
    label: "En attente",
    nextStatuses: ["accepted", "cancelled"],
  },
  accepted: {
    color: "#4CAF50",
    bgColor: "#4CAF5020",
    icon: "checkmark-circle",
    label: "Acceptée",
    nextStatuses: ["en_route", "cancelled"],
  },
  en_route: {
    color: "#2196F3",
    bgColor: "#2196F320",
    icon: "car",
    label: "En route",
    nextStatuses: ["arrived", "cancelled"],
  },
  arrived: {
    color: "#FF9800",
    bgColor: "#FF980020",
    icon: "location",
    label: "Arrivé",
    nextStatuses: ["in_progress", "cancelled"],
  },
  in_progress: {
    color: "#9C27B0",
    bgColor: "#9C27B020",
    icon: "construct",
    label: "En cours",
    nextStatuses: ["completed", "cancelled"],
  },
  completed: {
    color: "#4CAF50",
    bgColor: "#4CAF5020",
    icon: "checkmark-done",
    label: "Terminée",
    nextStatuses: [],
  },
  cancelled: {
    color: "#F44336",
    bgColor: "#F4433620",
    icon: "close-circle",
    label: "Annulée",
    nextStatuses: [],
  },
  expired: {
    color: "#9E9E9E",
    bgColor: "#9E9E9E20",
    icon: "alert-circle",
    label: "Expirée",
    nextStatuses: [],
  },
};
