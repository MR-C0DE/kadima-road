import React, { useState } from "react";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  InputAdornment,
  IconButton,
  useTheme,
  Divider,
  Link,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Build,
} from "@mui/icons-material";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Email ou mot de passe incorrect");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: theme.palette.mode === "light" ? "#f0f2f5" : "#0a0a0a",
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 2,
            borderTop: `4px solid ${theme.palette.primary.main}`,
          }}
        >
          {/* En-tête avec logo */}
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                mb: 2,
              }}
            >
              <Build sx={{ fontSize: 40, color: theme.palette.primary.main }} />
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                }}
              >
                KADIMA GARAGES
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Logiciel de gestion d'atelier professionnel
            </Typography>
          </Box>

          {/* Formulaire */}
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              size="medium"
              label="Email professionnel"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!error}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              size="medium"
              label="Mot de passe"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!error}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                py: 1.5,
                mb: 2,
                fontWeight: 600,
              }}
            >
              {loading ? "Connexion..." : "Se connecter"}
            </Button>

            {/* ← LIEN VERS INSCRIPTION AJOUTÉ ICI */}
            <Box sx={{ textAlign: "center", mb: 2 }}>
              <Link
                component={RouterLink}
                to="/register"
                variant="body2"
                sx={{
                  color: theme.palette.primary.main,
                  textDecoration: "none",
                  fontWeight: 500,
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
              >
                Pas encore de compte ? Créer un compte garage
              </Link>
            </Box>

            <Divider sx={{ my: 2 }}>
              <Typography variant="caption" color="text.secondary">
                ACCÈS PROFESSIONNEL
              </Typography>
            </Divider>

            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="caption" color="text.secondary">
                Version 2.0.0
              </Typography>
              <Typography variant="caption" color="primary">
                Support technique 24/7
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Pied de page avec infos légales */}
        <Box sx={{ textAlign: "center", mt: 3 }}>
          <Typography variant="caption" color="text.secondary" display="block">
            © 2026 Kadima Technologies. Tous droits réservés.
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Logiciel de gestion pour ateliers de réparation automobile
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
