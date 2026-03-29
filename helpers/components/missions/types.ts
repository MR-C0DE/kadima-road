// helpers/components/missions/types.ts
export interface Mission {
  _id: string;
  type: string;
  status: string;
  distance: number;
  reward: number;
  user?: {
    firstName: string;
    lastName: string;
    phone: string;
    photo?: string;
  };
  problem: {
    description: string;
    category: string;
  };
  location: {
    address: string;
    coordinates: [number, number];
  };
  createdAt: string;
  eta?: number;
}

export interface SOSItem {
  _id: string;
  type?: string;
  client?: {
    firstName: string;
    lastName: string;
  };
  problem?: {
    description: string;
    category?: string;
  };
  location?: {
    address: string;
    coordinates: [number, number];
  };
  distance?: number;
  reward?: number;
  createdAt: string;
}

export interface StatusConfig {
  color: string;
  bgColor: string;
  icon: string;
  label: string;
  nextStatuses: string[];
}

export const STATUS_CONFIG: Record<string, StatusConfig> = {
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
  pending: {
    color: "#FFC107",
    bgColor: "#FFC10720",
    icon: "time",
    label: "En attente",
    nextStatuses: ["accepted", "cancelled"],
  },
};
