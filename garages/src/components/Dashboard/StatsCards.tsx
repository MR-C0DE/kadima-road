// src/components/Dashboard/StatsCards.tsx
import React from "react";
import { Grid, Paper, Typography, Box, useTheme, alpha } from "@mui/material";
import {
  EventAvailable,
  Build,
  AttachMoney,
  People,
} from "@mui/icons-material";
import { DailyStats } from "../../types/garage";

interface StatsCardsProps {
  stats: DailyStats;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const theme = useTheme();

  const cards = [
    {
      title: "Rendez-vous",
      value: stats.appointments,
      change: stats.appointmentsChange,
      icon: <EventAvailable sx={{ fontSize: 40 }} />,
      color: theme.palette.primary.main,
    },
    {
      title: "Interventions",
      value: stats.interventions,
      change: stats.interventionsChange,
      icon: <Build sx={{ fontSize: 40 }} />,
      color: theme.palette.secondary.main,
    },
    {
      title: "Chiffre d'affaires",
      value: `${stats.revenue.toLocaleString()} €`,
      change: stats.revenueChange,
      icon: <AttachMoney sx={{ fontSize: 40 }} />,
      color: "#4CAF50",
    },
    {
      title: "Mécaniciens actifs",
      value: stats.mechanicsActive,
      change: 0,
      icon: <People sx={{ fontSize: 40 }} />,
      color: "#FF9800",
    },
  ];

  return (
    <Grid container spacing={3}>
      {cards.map((card, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              borderRadius: 3,
              background: `linear-gradient(135deg, ${alpha(
                card.color,
                0.1
              )} 0%, ${alpha(card.color, 0.05)} 100%)`,
              border: `1px solid ${alpha(card.color, 0.2)}`,
              transition: "all 0.3s",
              "&:hover": {
                transform: "translateY(-8px) scale(1.02)",
                boxShadow: `0 12px 24px ${alpha(card.color, 0.3)}`,
                borderColor: card.color,
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  backgroundColor: alpha(card.color, 0.2),
                  borderRadius: 3,
                  p: 1.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Box sx={{ color: card.color }}>{card.icon}</Box>
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {card.title}
                </Typography>
                <Typography variant="h3" component="div" fontWeight={700}>
                  {card.value}
                </Typography>
                {card.change !== 0 && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: card.change > 0 ? "success.main" : "error.main",
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      mt: 0.5,
                      fontWeight: 600,
                    }}
                  >
                    {card.change > 0 ? "▲" : "▼"} {Math.abs(card.change)}% vs
                    hier
                  </Typography>
                )}
              </Box>
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}
