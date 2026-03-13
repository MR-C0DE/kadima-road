import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Button,
  useTheme,
  Grid,
  Chip,
  LinearProgress,
} from "@mui/material";
import {
  Today,
  ViewWeek,
  CalendarMonth,
  Add,
  Refresh,
} from "@mui/icons-material";
import PlanningView from "../components/Planning/PlanningView";
import NewAppointmentModal from "../components/Planning/NewAppointmentModal";
import { Appointment, Mechanic, PlanningStats } from "../types/planning";

// Données fictives
const MOCK_MECHANICS: Mechanic[] = [
  {
    id: "1",
    name: "Jean-Marc",
    specialty: "Moteur",
    color: "#B8860B",
    isAvailable: true,
  },
  {
    id: "2",
    name: "Sophie",
    specialty: "Électronique",
    color: "#800020",
    isAvailable: true,
  },
  {
    id: "3",
    name: "Pierre",
    specialty: "Diagnostic",
    color: "#4CAF50",
    isAvailable: true,
  },
  {
    id: "4",
    name: "Luc",
    specialty: "Freins",
    color: "#2196F3",
    isAvailable: false,
  },
];

const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: "1",
    time: "09:00",
    endTime: "09:45",
    clientName: "Jean Dupont",
    clientPhone: "613-555-0123",
    vehicle: "Renault Clio",
    vehicleYear: 2019,
    licensePlate: "ABC-123",
    service: "Vidange",
    serviceType: "maintenance",
    mechanic: "Jean-Marc",
    mechanicId: "1",
    duration: 45,
    status: "confirmé",
    estimatedCost: 120,
    notes: "Vidange complète + contrôle niveaux",
    createdAt: "2026-03-12T08:00:00",
  },
  {
    id: "2",
    time: "10:30",
    endTime: "11:30",
    clientName: "Marie Martin",
    clientPhone: "613-555-0456",
    vehicle: "Peugeot 308",
    vehicleYear: 2022,
    licensePlate: "XYZ-789",
    service: "Révision",
    serviceType: "maintenance",
    mechanic: "Sophie",
    mechanicId: "2",
    duration: 60,
    status: "confirmé",
    estimatedCost: 250,
    notes: "Révision annuelle + vidange",
    createdAt: "2026-03-12T08:30:00",
  },
  {
    id: "3",
    time: "14:00",
    endTime: "14:30",
    clientName: "Pierre Durand",
    clientPhone: "613-555-0789",
    vehicle: "Toyota Corolla",
    vehicleYear: 2020,
    licensePlate: "DEF-456",
    service: "Diagnostic",
    serviceType: "diagnostic",
    mechanic: "Pierre",
    mechanicId: "3",
    duration: 30,
    status: "confirmé",
    estimatedCost: 95,
    notes: "Voyant moteur allumé",
    createdAt: "2026-03-12T09:00:00",
  },
  {
    id: "4",
    time: "15:30",
    endTime: "16:15",
    clientName: "Sophie Lefebvre",
    clientPhone: "613-555-0321",
    vehicle: "Honda Civic",
    vehicleYear: 2021,
    licensePlate: "GHI-789",
    service: "Freins",
    serviceType: "reparation",
    mechanic: "Jean-Marc",
    mechanicId: "1",
    duration: 45,
    status: "confirmé",
    estimatedCost: 350,
    notes: "Changement plaquettes avant",
    createdAt: "2026-03-12T09:30:00",
  },
  {
    id: "5",
    time: "17:00",
    endTime: "18:00",
    clientName: "Lucas Moreau",
    clientPhone: "613-555-0654",
    vehicle: "Ford Focus",
    vehicleYear: 2018,
    licensePlate: "JKL-012",
    service: "Climatisation",
    serviceType: "reparation",
    mechanic: "Sophie",
    mechanicId: "2",
    duration: 60,
    status: "confirmé",
    estimatedCost: 180,
    notes: "Recharge climatisation",
    createdAt: "2026-03-12T10:00:00",
  },
];

export default function Planning() {
  const theme = useTheme();
  const [view, setView] = useState<"day" | "week" | "month">("day");
  const [appointments, setAppointments] =
    useState<Appointment[]>(MOCK_APPOINTMENTS);
  const [mechanics] = useState<Mechanic[]>(MOCK_MECHANICS);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [stats, setStats] = useState<PlanningStats>({
    totalAppointments: 0,
    completed: 0,
    ongoing: 0,
    upcoming: 0,
    occupancyRate: 0,
  });

  // Calculer les statistiques
  useEffect(() => {
    const total = appointments.length;
    const completed = appointments.filter((a) => a.status === "terminé").length;
    const ongoing = appointments.filter((a) => a.status === "en_cours").length;
    const upcoming = appointments.filter((a) => a.status === "confirmé").length;

    // Taux d'occupation basé sur les créneaux de 9h à 18h (9h = 540 min)
    const totalMinutes = 9 * 60; // 540 minutes
    const occupiedMinutes = appointments.reduce(
      (acc, app) => acc + app.duration,
      0
    );
    const occupancyRate = Math.min(
      Math.round((occupiedMinutes / totalMinutes) * 100),
      100
    );

    setStats({
      totalAppointments: total,
      completed,
      ongoing,
      upcoming,
      occupancyRate,
    });
  }, [appointments]);

  const handleViewChange = (
    event: React.MouseEvent<HTMLElement>,
    newView: "day" | "week" | "month" | null
  ) => {
    if (newView) {
      setView(newView);
    }
  };

  const handleRefresh = () => {
    // Simuler un rechargement
    setAppointments([...MOCK_APPOINTMENTS]);
  };

  const handleNewAppointment = (newAppointment: Appointment) => {
    setAppointments([...appointments, newAppointment]);
    setModalOpen(false);
  };

  const handleEditAppointment = (updatedAppointment: Appointment) => {
    setAppointments(
      appointments.map((a) =>
        a.id === updatedAppointment.id ? updatedAppointment : a
      )
    );
  };

  const handleDeleteAppointment = (id: string) => {
    setAppointments(appointments.filter((a) => a.id !== id));
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" gutterBottom fontWeight={600}>
            Planning
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatDate(selectedDate).charAt(0).toUpperCase() +
              formatDate(selectedDate).slice(1)}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            size="small"
          >
            Rafraîchir
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setModalOpen(true)}
            size="small"
          >
            Nouveau RDV
          </Button>
        </Box>
      </Box>

      {/* Contrôles de vue */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={handleViewChange}
          size="small"
        >
          <ToggleButton value="day">
            <Today sx={{ mr: 1 }} /> Jour
          </ToggleButton>
          <ToggleButton value="week">
            <ViewWeek sx={{ mr: 1 }} /> Semaine
          </ToggleButton>
          <ToggleButton value="month">
            <CalendarMonth sx={{ mr: 1 }} /> Mois
          </ToggleButton>
        </ToggleButtonGroup>

        {/* Légende des mécaniciens */}
        <Box sx={{ display: "flex", gap: 2 }}>
          {mechanics.map((mech) => (
            <Chip
              key={mech.id}
              label={mech.name}
              size="small"
              sx={{
                bgcolor: mech.color + "20",
                color: mech.color,
                border: `1px solid ${mech.color}`,
                opacity: mech.isAvailable ? 1 : 0.5,
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Statistiques */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h5" color="primary" fontWeight={600}>
              {stats.totalAppointments}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Rendez-vous aujourd'hui
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h5" color="warning.main" fontWeight={600}>
              {stats.ongoing}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              En cours
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h5" color="success.main" fontWeight={600}>
              {stats.completed}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Terminés
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Taux d'occupation
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ flex: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={stats.occupancyRate}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: theme.palette.grey[200],
                    "& .MuiLinearProgress-bar": {
                      bgcolor:
                        stats.occupancyRate > 80
                          ? theme.palette.error.main
                          : stats.occupancyRate > 50
                          ? theme.palette.warning.main
                          : theme.palette.success.main,
                    },
                  }}
                />
              </Box>
              <Typography variant="body2" fontWeight={600}>
                {stats.occupancyRate}%
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Vue principale */}
      <PlanningView
        view={view}
        appointments={appointments}
        mechanics={mechanics}
        onEdit={handleEditAppointment}
        onDelete={handleDeleteAppointment}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />

      {/* Modal de création */}
      <NewAppointmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleNewAppointment}
        mechanics={mechanics}
      />
    </Box>
  );
}
