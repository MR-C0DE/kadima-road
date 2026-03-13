import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Box,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import frLocale from "date-fns/locale/fr";
import { Appointment, Mechanic } from "../../types/planning";

interface NewAppointmentModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (appointment: Appointment) => void;
  mechanics: Mechanic[];
}

const SERVICE_TYPES = [
  { value: "maintenance", label: "Maintenance" },
  { value: "reparation", label: "Réparation" },
  { value: "diagnostic", label: "Diagnostic" },
  { value: "controle", label: "Contrôle" },
];

const SERVICE_OPTIONS = [
  { value: "Vidange", label: "Vidange", duration: 45, price: 120 },
  { value: "Révision", label: "Révision", duration: 60, price: 250 },
  { value: "Diagnostic", label: "Diagnostic", duration: 30, price: 95 },
  { value: "Freins", label: "Freins", duration: 45, price: 350 },
  { value: "Climatisation", label: "Climatisation", duration: 60, price: 180 },
  { value: "Pneus", label: "Pneus", duration: 30, price: 80 },
  { value: "Moteur", label: "Moteur", duration: 120, price: 500 },
];

export default function NewAppointmentModal({
  open,
  onClose,
  onSave,
  mechanics,
}: NewAppointmentModalProps) {
  const [formData, setFormData] = useState({
    date: new Date(),
    time: "09:00",
    clientName: "",
    clientPhone: "",
    vehicle: "",
    vehicleYear: new Date().getFullYear(),
    licensePlate: "",
    service: "",
    serviceType: "maintenance",
    mechanicId: "",
    duration: 45,
    estimatedCost: 0,
    notes: "",
  });

  const handleServiceChange = (service: string) => {
    const selected = SERVICE_OPTIONS.find((s) => s.value === service);
    if (selected) {
      setFormData({
        ...formData,
        service,
        duration: selected.duration,
        estimatedCost: selected.price,
      });
    }
  };

  const handleSubmit = () => {
    const mechanic = mechanics.find((m) => m.id === formData.mechanicId);
    const appointment: Appointment = {
      id: Math.random().toString(36).substr(2, 9),
      time: formData.time,
      endTime: calculateEndTime(formData.time, formData.duration),
      clientName: formData.clientName,
      clientPhone: formData.clientPhone,
      vehicle: formData.vehicle,
      vehicleYear: formData.vehicleYear,
      licensePlate: formData.licensePlate,
      service: formData.service,
      serviceType: formData.serviceType as any,
      mechanic: mechanic?.name || "",
      mechanicId: formData.mechanicId,
      duration: formData.duration,
      status: "confirmé",
      estimatedCost: formData.estimatedCost,
      notes: formData.notes,
      createdAt: new Date().toISOString(),
    };
    onSave(appointment);
  };

  const calculateEndTime = (startTime: string, duration: number) => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, "0")}:${endMinutes
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={frLocale}>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6" fontWeight={600}>
            Nouveau rendez-vous
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            {/* Date et heure */}
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Date"
                value={formData.date}
                onChange={(date) =>
                  setFormData({ ...formData, date: date || new Date() })
                }
                slotProps={{ textField: { fullWidth: true, size: "small" } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Heure"
                value={formData.time}
                onChange={(e) =>
                  setFormData({ ...formData, time: e.target.value })
                }
              >
                {Array.from({ length: 24 }, (_, i) => {
                  const hour = i.toString().padStart(2, "0");
                  return (
                    <MenuItem key={hour} value={`${hour}:00`}>
                      {`${hour}:00`}
                    </MenuItem>
                  );
                })}
              </TextField>
            </Grid>

            {/* Client */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Nom du client"
                value={formData.clientName}
                onChange={(e) =>
                  setFormData({ ...formData, clientName: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Téléphone"
                value={formData.clientPhone}
                onChange={(e) =>
                  setFormData({ ...formData, clientPhone: e.target.value })
                }
                required
              />
            </Grid>

            {/* Véhicule */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Véhicule"
                value={formData.vehicle}
                onChange={(e) =>
                  setFormData({ ...formData, vehicle: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Année"
                type="number"
                value={formData.vehicleYear}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    vehicleYear: parseInt(e.target.value),
                  })
                }
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Plaque"
                value={formData.licensePlate}
                onChange={(e) =>
                  setFormData({ ...formData, licensePlate: e.target.value })
                }
              />
            </Grid>

            {/* Service */}
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Service"
                value={formData.service}
                onChange={(e) => handleServiceChange(e.target.value)}
                required
              >
                {SERVICE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label} ({option.duration} min - {option.price}$)
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.serviceType}
                  label="Type"
                  onChange={(e) =>
                    setFormData({ ...formData, serviceType: e.target.value })
                  }
                >
                  {SERVICE_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Mécanicien */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Mécanicien</InputLabel>
                <Select
                  value={formData.mechanicId}
                  label="Mécanicien"
                  onChange={(e) =>
                    setFormData({ ...formData, mechanicId: e.target.value })
                  }
                >
                  {mechanics
                    .filter((m) => m.isAvailable)
                    .map((mech) => (
                      <MenuItem key={mech.id} value={mech.id}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              bgcolor: mech.color,
                            }}
                          />
                          {mech.name} - {mech.specialty}
                        </Box>
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Durée (minutes)"
                type="number"
                value={formData.duration}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    duration: parseInt(e.target.value),
                  })
                }
              />
            </Grid>

            {/* Coût estimé */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Coût estimé ($)"
                type="number"
                value={formData.estimatedCost}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    estimatedCost: parseInt(e.target.value),
                  })
                }
              />
            </Grid>

            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Notes"
                multiline
                rows={2}
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={
              !formData.clientName ||
              !formData.clientPhone ||
              !formData.vehicle ||
              !formData.service ||
              !formData.mechanicId
            }
          >
            Créer le rendez-vous
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}
