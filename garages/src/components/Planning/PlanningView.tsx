import React from "react";
import { Box, Paper } from "@mui/material";
import DayView from "./DayView";
import WeekView from "./WeekView";
import MonthView from "./MonthView";
import { Appointment, Mechanic } from "../../types/planning";

interface PlanningViewProps {
  view: "day" | "week" | "month";
  appointments: Appointment[];
  mechanics: Mechanic[];
  onEdit: (appointment: Appointment) => void;
  onDelete: (id: string) => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export default function PlanningView({
  view,
  appointments,
  mechanics,
  onEdit,
  onDelete,
  selectedDate,
  onDateChange,
}: PlanningViewProps) {
  const renderView = () => {
    switch (view) {
      case "day":
        return (
          <DayView
            appointments={appointments}
            mechanics={mechanics}
            onEdit={onEdit}
            onDelete={onDelete}
            selectedDate={selectedDate}
          />
        );
      case "week":
        return (
          <WeekView
            appointments={appointments}
            mechanics={mechanics}
            onEdit={onEdit}
            onDelete={onDelete}
            selectedDate={selectedDate}
            onDateChange={onDateChange}
          />
        );
      case "month":
        return (
          <MonthView
            appointments={appointments}
            mechanics={mechanics}
            onEdit={onEdit}
            onDelete={onDelete}
            selectedDate={selectedDate}
            onDateChange={onDateChange}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Paper sx={{ p: 2, minHeight: 600 }}>
      <Box sx={{ height: "100%" }}>{renderView()}</Box>
    </Paper>
  );
}
