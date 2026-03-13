// src/components/Dashboard/Dashboard.tsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Typography,
  useTheme,
  Paper,
  Divider,
  Container,
} from "@mui/material";
import StatsCards from "./StatsCards";
import DailyPlanning from "./DailyPlanning";
import OngoingInterventions from "./OngoingInterventions";
import StockAlerts from "./StockAlerts";
import PerformanceChart from "./PerformanceChart";
import QuickActions from "./QuickActions";
import {
  Appointment,
  Intervention,
  StockAlert,
  DailyStats,
} from "../../types/garage";

// Données fictives (identiques)
const MOCK_APPOINTMENTS: Appointment[] = [
  /* ... */
];

const MOCK_INTERVENTIONS: Intervention[] = [
  /* ... */
];

const MOCK_STOCK_ALERTS: StockAlert[] = [
  /* ... */
];

const MOCK_STATS: DailyStats = {
  appointments: 8,
  appointmentsChange: 2,
  interventions: 3,
  interventionsChange: 1,
  revenue: 2450,
  revenueChange: 12,
  mechanicsActive: 3,
};

export default function Dashboard() {
  const theme = useTheme();
  const [appointments] = useState<Appointment[]>(MOCK_APPOINTMENTS);
  const [interventions] = useState<Intervention[]>(MOCK_INTERVENTIONS);
  const [stockAlerts] = useState<StockAlert[]>(MOCK_STOCK_ALERTS);
  const [stats] = useState<DailyStats>(MOCK_STATS);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentTime.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Box
      sx={{
        p: { xs: 2, md: 4 },
        backgroundColor: theme.palette.background.default,
        minHeight: "100vh",
      }}
    >
      {/* En-tête amélioré */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 3,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          color: "white",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: { xs: "wrap", md: "nowrap" },
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h3" fontWeight={700} gutterBottom>
              Tableau de bord
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              {formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}
            </Typography>
          </Box>
          <QuickActions />
        </Box>
      </Paper>

      {/* Cartes de statistiques - plus d'espace */}
      <Box sx={{ mb: 4 }}>
        <StatsCards stats={stats} />
      </Box>

      {/* Planning et Alertes - meilleur équilibre */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              borderRadius: 3,
              height: "100%",
              transition: "transform 0.2s",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: theme.shadows[8],
              },
            }}
          >
            <Typography variant="h5" fontWeight={600} gutterBottom>
              Planning du jour
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <DailyPlanning appointments={appointments} />
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              borderRadius: 3,
              height: "100%",
              transition: "transform 0.2s",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: theme.shadows[8],
              },
            }}
          >
            <Typography variant="h5" fontWeight={600} gutterBottom>
              Alertes stock
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <StockAlerts alerts={stockAlerts} />
          </Paper>
        </Grid>
      </Grid>

      {/* Interventions et Performance */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              borderRadius: 3,
              transition: "transform 0.2s",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: theme.shadows[8],
              },
            }}
          >
            <Typography variant="h5" fontWeight={600} gutterBottom>
              Interventions en cours
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <OngoingInterventions interventions={interventions} />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              borderRadius: 3,
              transition: "transform 0.2s",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: theme.shadows[8],
              },
            }}
          >
            <Typography variant="h5" fontWeight={600} gutterBottom>
              Performance
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <PerformanceChart />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
