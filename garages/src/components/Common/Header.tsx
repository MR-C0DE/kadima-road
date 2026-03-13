import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  ListItemIcon,
  Tooltip,
  useMediaQuery,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Logout,
  Settings,
  Person,
  Brightness4,
  Brightness7,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useThemeMode } from "../../contexts/ThemeContext";

interface HeaderProps {
  toggleSidebar?: () => void;
}

export default function Header({ toggleSidebar }: HeaderProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width:600px)");

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    logout();
    navigate("/login");
  };

  const handleProfile = () => {
    handleClose();
    navigate("/profile");
  };

  // Obtenir les initiales de l'utilisateur
  const getInitials = () => {
    if (!user) return "?";
    return `${user.firstName?.[0] || ""}${
      user.lastName?.[0] || ""
    }`.toUpperCase();
  };

  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={1}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar>
        {toggleSidebar && (
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={toggleSidebar}
          >
            <MenuIcon />
          </IconButton>
        )}

        <Typography
          variant="h6"
          component="div"
          sx={{
            flexGrow: 1,
            fontWeight: 700,
            background: "linear-gradient(45deg, #B8860B 30%, #D4AF37 90%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            display: { xs: isMobile ? "none" : "block", sm: "block" },
          }}
        >
          Kadima Garages
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {/* Bouton de thème */}
          <Tooltip title={mode === "light" ? "Mode sombre" : "Mode clair"}>
            <IconButton onClick={toggleTheme} color="inherit">
              {mode === "light" ? <Brightness4 /> : <Brightness7 />}
            </IconButton>
          </Tooltip>

          {user && (
            <>
              <Typography
                variant="body2"
                sx={{ mr: 1, display: { xs: "none", md: "block" } }}
              >
                {user.firstName} {user.lastName}
              </Typography>

              <IconButton
                size="large"
                aria-label="account"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: "secondary.main",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                  }}
                >
                  {getInitials()}
                </Avatar>
              </IconButton>

              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "right",
                }}
                keepMounted
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                  elevation: 3,
                  sx: {
                    mt: 1,
                    minWidth: 200,
                    borderRadius: 2,
                  },
                }}
              >
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="subtitle2">
                    {user.firstName} {user.lastName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user.role === "admin" ? "Administrateur" : "Employé"}
                  </Typography>
                </Box>

                <Divider />

                <MenuItem onClick={handleProfile}>
                  <ListItemIcon>
                    <Person fontSize="small" />
                  </ListItemIcon>
                  Mon profil
                </MenuItem>

                <MenuItem onClick={handleClose}>
                  <ListItemIcon>
                    <Settings fontSize="small" />
                  </ListItemIcon>
                  Paramètres
                </MenuItem>

                <Divider />

                <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
                  <ListItemIcon>
                    <Logout fontSize="small" color="error" />
                  </ListItemIcon>
                  Déconnexion
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
