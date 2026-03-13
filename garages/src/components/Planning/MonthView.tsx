import React from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  useTheme,
  IconButton,
} from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { Appointment, Mechanic } from "../../types/planning";
import AppointmentCard from "./AppointmentCard";

interface MonthViewProps {
  appointments: Appointment[];
  mechanics: Mechanic[];
  onEdit: (appointment: Appointment) => void;
  onDelete: (id: string) => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export default function MonthView({
  appointments,
  mechanics,
  onEdit,
  onDelete,
  selectedDate,
  onDateChange,
}: MonthViewProps) {
  const theme = useTheme();

  // Obtenir les jours du mois
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days = [];
    const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    // Jours du mois précédent
    for (let i = 0; i < startOffset; i++) {
      const prevDate = new Date(year, month, -i);
      days.unshift({ date: prevDate, isCurrentMonth: false });
    }

    // Jours du mois courant
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    // Jours du mois suivant
    while (days.length < 42) {
      const nextDate = new Date(year, month, days.length - startOffset + 1);
      days.push({ date: nextDate, isCurrentMonth: false });
    }

    return days;
  };

  const handlePrevMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(selectedDate.getMonth() - 1);
    onDateChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(selectedDate.getMonth() + 1);
    onDateChange(newDate);
  };

  const days = getDaysInMonth(selectedDate);

  // Filtrer les rendez-vous pour une date donnée
  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.createdAt);
      return aptDate.toDateString() === date.toDateString();
    });
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* En-tête du mois */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <IconButton onClick={handlePrevMonth}>
          <ChevronLeft />
        </IconButton>
        <Typography variant="h6">
          {selectedDate.toLocaleDateString("fr-FR", {
            month: "long",
            year: "numeric",
          })}
        </Typography>
        <IconButton onClick={handleNextMonth}>
          <ChevronRight />
        </IconButton>
      </Box>

      {/* Jours de la semaine */}
      <Grid container spacing={0.5}>
        {DAYS.map((day) => (
          <Grid item xs={12 / 7} key={day}>
            <Paper
              sx={{
                p: 1,
                textAlign: "center",
                bgcolor: theme.palette.primary.main + "10",
                borderRadius: 1,
              }}
            >
              <Typography variant="caption" fontWeight={600}>
                {day}
              </Typography>
            </Paper>
          </Grid>
        ))}

        {/* Cases du mois */}
        {days.map((day, index) => {
          const dayAppointments = getAppointmentsForDate(day.date);
          const isToday = day.date.toDateString() === new Date().toDateString();

          return (
            <Grid item xs={12 / 7} key={index}>
              <Paper
                sx={{
                  p: 0.5,
                  minHeight: 100,
                  bgcolor: day.isCurrentMonth
                    ? "background.paper"
                    : "action.hover",
                  border: isToday
                    ? `2px solid ${theme.palette.primary.main}`
                    : `1px solid ${theme.palette.divider}`,
                  opacity: day.isCurrentMonth ? 1 : 0.5,
                  position: "relative",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    position: "absolute",
                    top: 2,
                    right: 4,
                    fontWeight: isToday ? 700 : 400,
                    color: isToday
                      ? theme.palette.primary.main
                      : "text.secondary",
                  }}
                >
                  {day.date.getDate()}
                </Typography>

                <Box sx={{ mt: 3 }}>
                  {dayAppointments.slice(0, 2).map((apt) => (
                    <Box key={apt.id} sx={{ mb: 0.5 }}>
                      <AppointmentCard
                        appointment={apt}
                        mechanics={mechanics}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        compact={true}
                      />
                    </Box>
                  ))}
                  {dayAppointments.length > 2 && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", textAlign: "center" }}
                    >
                      +{dayAppointments.length - 2} autres
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
