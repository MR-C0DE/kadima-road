import React from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Divider,
  useTheme,
  Paper,
} from "@mui/material";
import {
  MoreVert,
  DirectionsCar,
  Person,
  Build,
  AccessTime,
  Phone,
} from "@mui/icons-material";
import { Appointment, Mechanic } from "../../types/planning";
import AppointmentCard from "./AppointmentCard";

interface DayViewProps {
  appointments: Appointment[];
  mechanics: Mechanic[];
  onEdit: (appointment: Appointment) => void;
  onDelete: (id: string) => void;
  selectedDate: Date;
}

// Créneaux horaires de 8h à 19h
const TIME_SLOTS = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
];

export default function DayView({
  appointments,
  mechanics,
  onEdit,
  onDelete,
  selectedDate,
}: DayViewProps) {
  const theme = useTheme();

  const getAppointmentForTime = (time: string) => {
    return appointments.find((a) => a.time === time);
  };

  const isLunchBreak = (time: string) => {
    return time === "12:00" || time === "12:30";
  };

  return (
    <Box sx={{ display: "flex", height: "100%" }}>
      {/* Colonne des horaires */}
      <Box
        sx={{ width: 80, borderRight: `1px solid ${theme.palette.divider}` }}
      >
        {TIME_SLOTS.map((time) => (
          <Box
            key={time}
            sx={{
              height: 70,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderBottom: `1px solid ${theme.palette.divider}`,
              bgcolor: isLunchBreak(time) ? "action.hover" : "transparent",
            }}
          >
            <Typography variant="caption" fontWeight={500}>
              {time}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Colonne des rendez-vous */}
      <Box sx={{ flex: 1, overflowX: "auto" }}>
        {TIME_SLOTS.map((time) => {
          const appointment = getAppointmentForTime(time);
          const isBreak = isLunchBreak(time);

          return (
            <Box
              key={time}
              sx={{
                height: 70,
                borderBottom: `1px solid ${theme.palette.divider}`,
                p: 0.5,
                bgcolor: isBreak ? "action.hover" : "transparent",
              }}
            >
              {appointment ? (
                <AppointmentCard
                  appointment={appointment}
                  mechanics={mechanics}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  compact={false}
                />
              ) : isBreak ? (
                <Box
                  sx={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Pause déjeuner
                  </Typography>
                </Box>
              ) : null}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
