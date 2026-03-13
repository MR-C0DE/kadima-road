import { Service, Equipment, Language, Theme } from "./types";

export const SERVICES_LIST: Service[] = [
  {
    id: "battery",
    label: "Batterie",
    icon: "battery-dead",
    description: "Dépannage batterie",
    color: "#FF6B6B",
  },
  {
    id: "tire",
    label: "Pneu",
    icon: "car-sport",
    description: "Changement de pneu",
    color: "#4ECDC4",
  },
  {
    id: "fuel",
    label: "Essence",
    icon: "water",
    description: "Livraison de carburant",
    color: "#45B7D1",
  },
  {
    id: "towing",
    label: "Remorquage",
    icon: "construct",
    description: "Remorquage léger",
    color: "#96CEB4",
  },
  {
    id: "lockout",
    label: "Clés enfermées",
    icon: "key",
    description: "Ouverture de porte",
    color: "#FFEAA7",
  },
  {
    id: "diagnostic",
    label: "Diagnostic",
    icon: "medkit",
    description: "Diagnostic rapide",
    color: "#DDA0DD",
  },
  {
    id: "jumpstart",
    label: "Démarrage",
    icon: "flash",
    description: "Aide au démarrage",
    color: "#FFD93D",
  },
  {
    id: "minor_repair",
    label: "Petite réparation",
    icon: "build",
    description: "Réparations mineures",
    color: "#6C5B7B",
  },
];

export const EQUIPMENT_LIST: Equipment[] = [
  {
    id: "cables",
    label: "Câbles de démarrage",
    icon: "flash",
    category: "Électrique",
  },
  { id: "jack", label: "Cric", icon: "car", category: "Levage" },
  { id: "triangle", label: "Triangle", icon: "warning", category: "Sécurité" },
  {
    id: "vest",
    label: "Gilet de sécurité",
    icon: "shirt",
    category: "Sécurité",
  },
  {
    id: "tire_iron",
    label: "Clé à roue",
    icon: "construct",
    category: "Outillage",
  },
  {
    id: "compressor",
    label: "Compresseur",
    icon: "airplane",
    category: "Pneumatique",
  },
  {
    id: "battery_booster",
    label: "Booster batterie",
    icon: "battery-charging",
    category: "Électrique",
  },
  {
    id: "tow_rope",
    label: "Câble de remorquage",
    icon: "git-network",
    category: "Remorquage",
  },
];

export const LANGUAGES: Language[] = [
  { id: "fr", label: "Français", icon: "language" },
  { id: "en", label: "English", icon: "language" },
];

export const THEMES: Theme[] = [
  { id: "light", label: "Clair", icon: "sunny" },
  { id: "dark", label: "Sombre", icon: "moon" },
  { id: "system", label: "Système", icon: "phone-portrait" },
];

export const RADIUS_OPTIONS = [5, 10, 15, 20, 25, 30, 40, 50];

export const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "#4CAF50";
    case "pending":
      return "#FF9800";
    case "suspended":
      return "#F44336";
    default:
      return "#9E9E9E";
  }
};

export const getStatusText = (status: string) => {
  switch (status) {
    case "active":
      return "Actif";
    case "pending":
      return "En attente";
    case "suspended":
      return "Suspendu";
    case "inactive":
      return "Inactif";
    default:
      return status;
  }
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};
