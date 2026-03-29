export interface DocumentInfo {
  type: string;
  url?: string;
  verified: boolean;
  status: "missing" | "pending" | "verified" | "rejected";
  uploadedAt?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  rejectionReason?: string;
}

export interface HelperProfile {
  _id: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    photo?: string;
  };
  photo?: string;
  status: "pending" | "active" | "suspended" | "inactive";
  certification: {
    isCertified: boolean;
    certifiedAt?: string;
    expiresAt?: string;
    certificateNumber?: string;
  };
  services: string[];
  equipment: Array<{
    name: string;
    has: boolean;
    lastChecked?: string;
  }>;
  serviceArea: {
    radius: number;
    address?: string;
    coordinates?: [number, number];
  };
  pricing: {
    basePrice: number;
    perKm: number;
    services: Array<{
      service: string;
      price: number;
    }>;
  };
  availability: {
    isAvailable: boolean;
    schedule: Array<{
      day: string;
      startTime: string;
      endTime: string;
    }>;
  };
  stats: {
    totalInterventions: number;
    completedInterventions: number;
    averageRating: number;
    totalEarnings: number;
    responseRate: number;
    averageResponseTime: number;
  };
  documents: {
    license?: DocumentInfo;
    insurance?: DocumentInfo;
    certification?: DocumentInfo;
  };
  preferences: {
    language: string;
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
    theme: "light" | "dark" | "system";
  };
  createdAt: string;
}

export interface PricingService {
  service: string;
  price: number;
}

export interface Service {
  id: string;
  label: string;
  icon: string;
  description: string;
  color: string;
}

export interface Equipment {
  id: string;
  label: string;
  icon: string;
  category: string;
}

export interface Language {
  id: string;
  label: string;
  icon: string;
}

export interface Theme {
  id: string;
  label: string;
  icon: string;
}

export type ModalType =
  | null
  | "services"
  | "equipment"
  | "zone"
  | "pricing"
  | "documents"
  | "preferences";
