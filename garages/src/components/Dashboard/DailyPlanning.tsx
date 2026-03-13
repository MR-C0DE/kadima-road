// src/components/Dashboard/DailyPlanning.tsx
import React from "react";
import {
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Box,
  Chip,
  useTheme,
  alpha,
} from "@mui/material";
import { DirectionsCar, Build, AccessTime } from "@mui/icons-material";
import { Appointment } from "../../types/garage";

interface DailyPlanningProps {
  appointments: Appointment[];
}

export default function DailyPlanning({ appointments }: DailyPlanningProps) {
  const theme = useTheme();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmé":
        return theme.palette.success.main;
      case "en cours":
        return theme.palette.warning.main;
      case "terminé":
        return theme.palette.info.main;
      case "annulé":
        return theme.palette.error.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const isLunchBreak = (appointment: Appointment) => {
    return (
      appointment.service === "" && appointment.clientName === "Pause déjeuner"
    );
  };

  return (
    <List sx={{ width: "100%" }}>
      {appointments.map((appointment, index) => (
        <React.Fragment key={appointment.id}>
          <ListItem
            alignItems="flex-start"
            sx={{
              p: 2,
              borderRadius: 2,
              mb: 1,
              bgcolor: isLunchBreak(appointment)
                ? alpha(theme.palette.grey[500], 0.1)
                : "background.paper",
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              transition: "all 0.2s",
              "&:hover": {
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                transform: "translateX(8px)",
                borderColor: theme.palette.primary.main,
              },
            }}
          >
            <ListItemAvatar>
              <Avatar
                sx={{
                  bgcolor: isLunchBreak(appointment)
                    ? theme.palette.grey[500]
                    : theme.palette.primary.main,
                  width: 48,
                  height: 48,
                }}
              >
                {isLunchBreak(appointment) ? "🍽️" : <DirectionsCar />}
              </Avatar>
            </ListItemAvatar>

            <ListItemText
              primary={
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    mb: 0.5,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <AccessTime
                      sx={{ fontSize: 16, color: "text.secondary" }}
                    />
                    <Typography variant="subtitle1" fontWeight={600}>
                      {appointment.time}
                    </Typography>
                  </Box>

                  <Typography variant="h6" fontWeight={500}>
                    {appointment.clientName}
                  </Typography>

                  {!isLunchBreak(appointment) && (
                    <Chip
                      label={appointment.status}
                      size="small"
                      sx={{
                        ml: "auto",
                        bgcolor: alpha(getStatusColor(appointment.status), 0.1),
                        color: getStatusColor(appointment.status),
                        border: `1px solid ${alpha(
                          getStatusColor(appointment.status),
                          0.3
                        )}`,
                        fontWeight: 600,
                      }}
                    />
                  )}
                </Box>
              }
              secondary={
                !isLunchBreak(appointment) ? (
                  <Box sx={{ mt: 1 }}>
                    <Typography
                      variant="body1"
                      color="text.primary"
                      gutterBottom
                    >
                      {appointment.vehicle}
                    </Typography>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <Build sx={{ fontSize: 16, color: "text.secondary" }} />
                        <Typography variant="body2" color="text.secondary">
                          {appointment.service}
                        </Typography>
                      </Box>

                      <Typography variant="body2" color="text.secondary">
                        • {appointment.mechanic}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    Pause déjeuner de l'équipe (12:00 - 14:00)
                  </Typography>
                )
              }
            />
          </ListItem>
        </React.Fragment>
      ))}
    </List>
  );
}
