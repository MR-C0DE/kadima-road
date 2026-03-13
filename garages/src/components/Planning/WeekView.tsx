import React from "react";
import { Box, Typography, Grid, Paper, useTheme } from "@mui/material";
import { Appointment, Mechanic } from "../../types/planning";
import AppointmentCard from "./AppointmentCard";

interface WeekViewProps {
  appointments: Appointment[];
  mechanics: Mechanic[];
  onEdit: (appointment: Appointment) => void;
  onDelete: (id: string) => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

// Jours de la semaine
const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export default function WeekView({
  appointments,
  mechanics,
  onEdit,
  onDelete,
  selectedDate,
}: WeekViewProps) {
  const theme = useTheme();

  // Obtenir les dates de la semaine
  const getWeekDates = () => {
    const startOfWeek = new Date(selectedDate);
    const day = selectedDate.getDay();
    const diff = day === 0 ? 6 : day - 1; // Ajuster pour commencer le lundi
    startOfWeek.setDate(selectedDate.getDate() - diff);

    return DAYS.map((_, index) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + index);
      return date;
    });
  };

  const weekDates = getWeekDates();

  // Filtrer les rendez-vous pour une date donnée
  const getAppointmentsForDate = (date: Date) => {
    const dateStr = date.toDateString();
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.createdAt).toDateString();
      return aptDate === dateStr;
    });
  };

  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={1}>
        {/* En-têtes des jours */}
        {DAYS.map((day, index) => (
          <Grid item xs={12 / 7} key={day}>
            <Paper
              sx={{
                p: 1,
                textAlign: "center",
                bgcolor: theme.palette.primary.main + "10",
                borderBottom: `2px solid ${theme.palette.primary.main}`,
              }}
            >
              <Typography variant="subtitle2" fontWeight={600}>
                {day}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {weekDates[index].getDate()}
              </Typography>
            </Paper>
          </Grid>
        ))}

        {/* Créneaux horaires */}
        {Array.from({ length: 10 }, (_, hour) => hour + 8).map((hour) => (
          <React.Fragment key={hour}>
            {weekDates.map((date, dayIndex) => {
              const timeStr = `${hour.toString().padStart(2, "0")}:00`;
              const appointmentsForDay = getAppointmentsForDate(date);
              const appointment = appointmentsForDay.find(
                (a) => a.time === timeStr
              );

              return (
                <Grid item xs={12 / 7} key={`${dayIndex}-${hour}`}>
                  <Paper
                    sx={{
                      p: 0.5,
                      minHeight: 80,
                      border: `1px solid ${theme.palette.divider}`,
                      bgcolor: appointment
                        ? theme.palette.primary.main + "05"
                        : "transparent",
                    }}
                  >
                    {appointment ? (
                      <AppointmentCard
                        appointment={appointment}
                        mechanics={mechanics}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        compact={true}
                      />
                    ) : (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", textAlign: "center", mt: 1 }}
                      >
                        {timeStr}
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              );
            })}
          </React.Fragment>
        ))}
      </Grid>
    </Box>
  );
}
