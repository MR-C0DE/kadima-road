// src/components/Dashboard/QuickActions.tsx
import React from "react";
import { Button, Stack, Tooltip, useTheme, Badge, alpha } from "@mui/material";
import { Add, CalendarToday, Build, Inventory } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

export default function QuickActions() {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Stack direction="row" spacing={2}>
      <Tooltip title="Nouveau rendez-vous">
        <Button
          variant="contained"
          size="large"
          startIcon={<Add />}
          onClick={() => navigate("/planning/new")}
          sx={{
            bgcolor: theme.palette.primary.main,
            color: "white",
            px: 3,
            py: 1.5,
            borderRadius: 2,
            fontWeight: 600,
            "&:hover": {
              bgcolor: theme.palette.primary.dark,
              transform: "scale(1.05)",
            },
            transition: "all 0.2s",
          }}
        >
          RDV
        </Button>
      </Tooltip>

      <Tooltip title="Nouvelle intervention">
        <Button
          variant="contained"
          size="large"
          startIcon={<Build />}
          onClick={() => navigate("/interventions/new")}
          sx={{
            bgcolor: theme.palette.secondary.main,
            color: "white",
            px: 3,
            py: 1.5,
            borderRadius: 2,
            fontWeight: 600,
            "&:hover": {
              bgcolor: theme.palette.secondary.dark,
              transform: "scale(1.05)",
            },
            transition: "all 0.2s",
          }}
        >
          Intervention
        </Button>
      </Tooltip>

      <Tooltip title="Voir le planning">
        <Button
          variant="outlined"
          size="large"
          startIcon={<CalendarToday />}
          onClick={() => navigate("/planning")}
          sx={{
            borderColor: "white",
            color: "white",
            px: 3,
            py: 1.5,
            borderRadius: 2,
            fontWeight: 600,
            "&:hover": {
              borderColor: "white",
              backgroundColor: alpha("#FFFFFF", 0.1),
              transform: "scale(1.05)",
            },
            transition: "all 0.2s",
          }}
        >
          Planning
        </Button>
      </Tooltip>

      <Tooltip title="Gestion du stock">
        <Badge badgeContent={3} color="error" variant="standard">
          <Button
            variant="outlined"
            size="large"
            startIcon={<Inventory />}
            onClick={() => navigate("/stock")}
            sx={{
              borderColor: "white",
              color: "white",
              px: 3,
              py: 1.5,
              borderRadius: 2,
              fontWeight: 600,
              "&:hover": {
                borderColor: "white",
                backgroundColor: alpha("#FFFFFF", 0.1),
                transform: "scale(1.05)",
              },
              transition: "all 0.2s",
            }}
          >
            Stock
          </Button>
        </Badge>
      </Tooltip>
    </Stack>
  );
}
