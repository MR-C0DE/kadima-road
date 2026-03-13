import React from "react";
import {
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Box,
  LinearProgress,
  Chip,
  useTheme,
} from "@mui/material";
import { Build, DirectionsCar } from "@mui/icons-material";
import { Intervention } from "../../types/garage";

interface OngoingInterventionsProps {
  interventions: Intervention[];
}

export default function OngoingInterventions({
  interventions,
}: OngoingInterventionsProps) {
  const theme = useTheme();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "en_cours":
        return "warning";
      case "en_attente":
        return "info";
      case "terminé":
        return "success";
      default:
        return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "en_cours":
        return "En cours";
      case "en_attente":
        return "En attente";
      case "terminé":
        return "Terminé";
      default:
        return status;
    }
  };

  return (
    <List sx={{ width: "100%" }}>
      {interventions.map((intervention) => (
        <ListItem
          key={intervention.id}
          alignItems="flex-start"
          sx={{
            borderRadius: 1,
            mb: 1,
            "&:hover": {
              bgcolor: "action.selected",
            },
          }}
        >
          <ListItemAvatar>
            <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
              <Build />
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography variant="subtitle2" fontWeight={600}>
                  {intervention.vehicle}
                </Typography>
                <Chip
                  label={getStatusText(intervention.status)}
                  size="small"
                  color={getStatusColor(intervention.status) as any}
                />
              </Box>
            }
            secondary={
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {intervention.service} • {intervention.client}
                </Typography>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Mécanicien: {intervention.mechanic}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    • {intervention.startTime}
                  </Typography>
                </Box>
                <Box sx={{ mt: 1 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 0.5,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Progression
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {intervention.progress}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={intervention.progress}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: `${theme.palette.primary.main}20`,
                      "& .MuiLinearProgress-bar": {
                        bgcolor: theme.palette.primary.main,
                      },
                    }}
                  />
                </Box>
              </Box>
            }
          />
        </ListItem>
      ))}
    </List>
  );
}
