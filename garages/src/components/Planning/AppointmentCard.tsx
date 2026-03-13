import React, { useState } from "react";
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  useTheme,
} from "@mui/material";
import {
  MoreVert,
  Edit,
  Delete,
  Phone,
  DirectionsCar,
  Build,
} from "@mui/icons-material";
import { Appointment, Mechanic } from "../../types/planning";

interface AppointmentCardProps {
  appointment: Appointment;
  mechanics: Mechanic[];
  onEdit: (appointment: Appointment) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
}

export default function AppointmentCard({
  appointment,
  mechanics,
  onEdit,
  onDelete,
  compact = false,
}: AppointmentCardProps) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const mechanic = mechanics.find((m) => m.id === appointment.mechanicId);
  const mechanicColor = mechanic?.color || theme.palette.primary.main;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    onEdit(appointment);
    handleMenuClose();
  };

  const handleDelete = () => {
    onDelete(appointment.id);
    handleMenuClose();
  };

  const getStatusColor = () => {
    switch (appointment.status) {
      case "confirmé":
        return theme.palette.success.main;
      case "en_cours":
        return theme.palette.warning.main;
      case "terminé":
        return theme.palette.info.main;
      case "annulé":
        return theme.palette.error.main;
      default:
        return theme.palette.grey[500];
    }
  };

  if (compact) {
    return (
      <Box
        sx={{
          p: 1,
          borderRadius: 1,
          bgcolor: `${mechanicColor}15`,
          borderLeft: `4px solid ${mechanicColor}`,
          position: "relative",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          cursor: "pointer",
          "&:hover": {
            bgcolor: `${mechanicColor}25`,
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Typography variant="caption" fontWeight={600} noWrap>
            {appointment.time}
          </Typography>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: getStatusColor(),
            }}
          />
        </Box>
        <Typography variant="caption" fontWeight={500} noWrap>
          {appointment.clientName}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {appointment.vehicle}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: "100%",
        p: 1,
        borderRadius: 1,
        bgcolor: `${mechanicColor}10`,
        border: `1px solid ${mechanicColor}30`,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        "&:hover": {
          bgcolor: `${mechanicColor}20`,
          "& .menu-button": {
            opacity: 1,
          },
        },
      }}
    >
      {/* En-tête */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 0.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            {appointment.time} - {appointment.endTime}
          </Typography>
          <Chip
            label={appointment.status}
            size="small"
            sx={{
              height: 20,
              fontSize: "0.625rem",
              bgcolor: getStatusColor() + "20",
              color: getStatusColor(),
              border: `1px solid ${getStatusColor()}`,
            }}
          />
        </Box>

        <IconButton
          size="small"
          className="menu-button"
          onClick={handleMenuOpen}
          sx={{ opacity: 0, transition: "opacity 0.2s", p: 0.5 }}
        >
          <MoreVert fontSize="small" />
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleEdit}>
            <Edit fontSize="small" sx={{ mr: 1 }} /> Modifier
          </MenuItem>
          <MenuItem onClick={handleDelete} sx={{ color: "error.main" }}>
            <Delete fontSize="small" sx={{ mr: 1 }} /> Supprimer
          </MenuItem>
        </Menu>
      </Box>

      {/* Client et véhicule */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
        <Avatar
          sx={{
            width: 24,
            height: 24,
            bgcolor: mechanicColor,
            fontSize: "0.75rem",
          }}
        >
          {appointment.clientName.charAt(0)}
        </Avatar>
        <Box>
          <Typography variant="body2" fontWeight={500}>
            {appointment.clientName}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <DirectionsCar sx={{ fontSize: 12, color: "text.secondary" }} />
            <Typography variant="caption" color="text.secondary">
              {appointment.vehicle} ({appointment.vehicleYear})
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Service et mécanicien */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mt: "auto",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Build sx={{ fontSize: 12, color: "text.secondary" }} />
          <Typography variant="caption" color="text.secondary">
            {appointment.service}
          </Typography>
        </Box>

        <Tooltip title={appointment.mechanic}>
          <Avatar
            sx={{
              width: 20,
              height: 20,
              bgcolor: mechanicColor,
              fontSize: "0.625rem",
            }}
          >
            {appointment.mechanic.charAt(0)}
          </Avatar>
        </Tooltip>
      </Box>

      {/* Téléphone en survol */}
      <Box
        sx={{
          position: "absolute",
          bottom: 4,
          right: 4,
          opacity: 0,
          transition: "opacity 0.2s",
          "&:hover": { opacity: 1 },
        }}
      >
        <IconButton size="small" sx={{ p: 0.5 }}>
          <Phone fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}
