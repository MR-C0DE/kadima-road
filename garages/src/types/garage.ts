export interface Appointment {
  id: string;
  time: string;
  clientName: string;
  vehicle: string;
  service: string;
  mechanic: string;
  status: "confirmé" | "en cours" | "terminé" | "annulé";
}

export interface Intervention {
  id: string;
  vehicle: string;
  client: string;
  service: string;
  mechanic: string;
  startTime: string;
  estimatedDuration: number;
  progress: number;
  status: "en_attente" | "en_cours" | "terminé";
}

export interface StockAlert {
  id: string;
  partName: string;
  currentStock: number;
  minStock: number;
  unit: string;
  reference: string;
}

export interface DailyStats {
  appointments: number;
  appointmentsChange: number;
  interventions: number;
  interventionsChange: number;
  revenue: number;
  revenueChange: number;
  mechanicsActive: number;
}

export interface Mechanic {
  id: string;
  name: string;
  specialty: string;
  avatar?: string;
  currentTask?: string;
}
