import React from "react";
import {
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Box,
  Button,
  useTheme,
} from "@mui/material";
import { Warning, Inventory, ShoppingCart } from "@mui/icons-material";
import { StockAlert } from "../../types/garage";

interface StockAlertsProps {
  alerts: StockAlert[];
}

export default function StockAlerts({ alerts }: StockAlertsProps) {
  const theme = useTheme();

  const criticalAlerts = alerts.filter((a) => a.currentStock <= a.minStock / 2);
  const warnings = alerts.filter(
    (a) => a.currentStock > a.minStock / 2 && a.currentStock < a.minStock
  );
  const ok = alerts.filter((a) => a.currentStock >= a.minStock);

  return (
    <Box>
      {/* Alertes critiques */}
      {criticalAlerts.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="subtitle2"
            color="error"
            gutterBottom
            sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
          >
            <Warning fontSize="small" /> Critique
          </Typography>
          <List dense>
            {criticalAlerts.map((alert) => (
              <ListItem key={alert.id} sx={{ px: 0 }}>
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      bgcolor: theme.palette.error.light,
                      width: 32,
                      height: 32,
                    }}
                  >
                    <Warning sx={{ fontSize: 18 }} />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="body2" fontWeight={500}>
                      {alert.partName}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      Stock: {alert.currentStock}/{alert.minStock} {alert.unit}
                    </Typography>
                  }
                />
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  sx={{ minWidth: "auto", p: 0.5 }}
                >
                  <ShoppingCart fontSize="small" />
                </Button>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Alertes moyennes */}
      {warnings.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="subtitle2"
            color="warning.main"
            gutterBottom
            sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
          >
            <Warning fontSize="small" /> Attention
          </Typography>
          <List dense>
            {warnings.map((alert) => (
              <ListItem key={alert.id} sx={{ px: 0 }}>
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      bgcolor: theme.palette.warning.light,
                      width: 32,
                      height: 32,
                    }}
                  >
                    <Inventory sx={{ fontSize: 18 }} />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="body2" fontWeight={500}>
                      {alert.partName}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      Stock: {alert.currentStock}/{alert.minStock} {alert.unit}
                    </Typography>
                  }
                />
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  sx={{ minWidth: "auto", p: 0.5 }}
                >
                  <ShoppingCart fontSize="small" />
                </Button>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Stock OK */}
      {ok.length > 0 && (
        <Box>
          <Typography variant="subtitle2" color="success.main" gutterBottom>
            Stock normal
          </Typography>
          <List dense>
            {ok.slice(0, 2).map((alert) => (
              <ListItem key={alert.id} sx={{ px: 0 }}>
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      bgcolor: theme.palette.success.light,
                      width: 32,
                      height: 32,
                    }}
                  >
                    <Inventory sx={{ fontSize: 18 }} />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="body2" fontWeight={500}>
                      {alert.partName}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      Stock: {alert.currentStock} {alert.unit}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
}
