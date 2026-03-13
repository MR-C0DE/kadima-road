export interface Appointment {
  id: string;
  time: string;
  endTime: string;
  clientName: string;
  clientPhone: string;
  vehicle: string;
  vehicleYear: number;
  licensePlate: string;
  service: string;
  serviceType: "maintenance" | "reparation" | "diagnostic" | "controle";
  mechanic: string;
  mechanicId: string;
  duration: number; // en minutes
  status: "confirmé" | "en_cours" | "terminé" | "annulé";
  notes?: string;
  estimatedCost: number;
  createdAt: string;
}

export interface Mechanic {
  id: string;
  name: string;
  specialty: string;
  color: string;
  avatar?: string;
  isAvailable: boolean;
}

export interface PlanningStats {
  totalAppointments: number;
  completed: number;
  ongoing: number;
  upcoming: number;
  occupancyRate: number;
}
