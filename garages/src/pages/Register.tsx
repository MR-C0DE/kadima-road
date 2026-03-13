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
  Stepper,
  Step,
  StepLabel,
  Grid,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Build,
  Person,
  Phone,
  LocationOn,
  AccessTime,
  CheckCircle,
} from "@mui/icons-material";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Étapes d'inscription
const steps = ["Informations garage", "Identifiants", "Confirmation"];

// Types de garage
const garageTypes = [
  { value: "independant", label: "Garage indépendant" },
  { value: "franchise", label: "Franchise" },
  { value: "multimarques", label: "Multimarques" },
  { value: "concession", label: "Concession" },
];

// Nombre de mécaniciens
const mechanicOptions = [
  { value: "1", label: "1 mécanicien" },
  { value: "2-5", label: "2 à 5 mécaniciens" },
  { value: "6-10", label: "6 à 10 mécaniciens" },
  { value: "10+", label: "Plus de 10 mécaniciens" },
];

export default function Register() {
  const [activeStep, setActiveStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  // Données du formulaire
  const [formData, setFormData] = useState({
    // Étape 1
    garageName: "",
    garageType: "",
    siret: "",
    address: "",
    city: "",
    postalCode: "",
    phone: "",
    mechanicCount: "",
    yearEstablished: "",

    // Étape 2
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",

    // Étape 3
    acceptTerms: false,
    acceptNewsletter: false,
  });

  const handleChange =
    (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | { value: unknown }>) => {
      setFormData({
        ...formData,
        [field]: e.target.value,
      });
    };

  const handleCheckbox =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({
        ...formData,
        [field]: e.target.checked,
      });
    };

  const handleNext = () => {
    // Validation étape 1
    if (activeStep === 0) {
      if (!formData.garageName || !formData.garageType || !formData.phone) {
        setError("Veuillez remplir tous les champs obligatoires");
        return;
      }
    }

    // Validation étape 2
    if (activeStep === 1) {
      if (
        !formData.firstName ||
        !formData.lastName ||
        !formData.email ||
        !formData.password
      ) {
        setError("Veuillez remplir tous les champs");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Les mots de passe ne correspondent pas");
        return;
      }
      if (formData.password.length < 6) {
        setError("Le mot de passe doit contenir au moins 6 caractères");
        return;
      }
    }

    setError("");

    if (activeStep === steps.length - 1) {
      handleSubmit();
    } else {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
    setError("");
  };

  const handleSubmit = async () => {
    if (!formData.acceptTerms) {
      setError("Vous devez accepter les conditions d'utilisation");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Simuler une inscription (à remplacer par appel API)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSuccess(true);

      // Rediriger vers login après 2 secondes
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              Informations du garage
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Nom du garage"
                  value={formData.garageName}
                  onChange={handleChange("garageName")}
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  select
                  label="Type de garage"
                  value={formData.garageType}
                  onChange={handleChange("garageType")}
                  disabled={loading}
                >
                  {garageTypes.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="N° SIRET"
                  value={formData.siret}
                  onChange={handleChange("siret")}
                  disabled={loading}
                  placeholder="123 456 789 00012"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Adresse"
                  value={formData.address}
                  onChange={handleChange("address")}
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOn color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Ville"
                  value={formData.city}
                  onChange={handleChange("city")}
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Code postal"
                  value={formData.postalCode}
                  onChange={handleChange("postalCode")}
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  required
                  label="Téléphone"
                  value={formData.phone}
                  onChange={handleChange("phone")}
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Nombre de mécaniciens"
                  value={formData.mechanicCount}
                  onChange={handleChange("mechanicCount")}
                  disabled={loading}
                >
                  {mechanicOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Année de création"
                  value={formData.yearEstablished}
                  onChange={handleChange("yearEstablished")}
                  disabled={loading}
                  placeholder="2015"
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              Identifiants de connexion
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Prénom"
                  value={formData.firstName}
                  onChange={handleChange("firstName")}
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Nom"
                  value={formData.lastName}
                  onChange={handleChange("lastName")}
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Email professionnel"
                  type="email"
                  value={formData.email}
                  onChange={handleChange("email")}
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Mot de passe"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange("password")}
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
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Confirmer mot de passe"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange("confirmPassword")}
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
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          edge="end"
                          size="small"
                        >
                          {showConfirmPassword ? (
                            <VisibilityOff />
                          ) : (
                            <Visibility />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ mb: 3, color: "success.main" }}
            >
              <CheckCircle sx={{ mr: 1, verticalAlign: "middle" }} />
              Confirmation
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" paragraph>
                Veuillez vérifier vos informations avant de finaliser
                l'inscription.
              </Typography>

              <Paper
                variant="outlined"
                sx={{ p: 2, mb: 3, bgcolor: "background.default" }}
              >
                <Typography variant="subtitle2" gutterBottom>
                  Garage : {formData.garageName || "Non renseigné"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formData.address} {formData.city} {formData.postalCode}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tél: {formData.phone}
                </Typography>
              </Paper>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.acceptTerms}
                    onChange={handleCheckbox("acceptTerms")}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2">
                    J'accepte les{" "}
                    <a
                      href="/terms"
                      style={{ color: theme.palette.primary.main }}
                    >
                      conditions générales d'utilisation
                    </a>
                  </Typography>
                }
                sx={{ mb: 1 }}
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.acceptNewsletter}
                    onChange={handleCheckbox("acceptNewsletter")}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2">
                    Je souhaite recevoir les actualités Kadima Garages
                  </Typography>
                }
              />
            </Box>
          </Box>
        );

      default:
        return "Étape inconnue";
    }
  };

  if (success) {
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
              borderTop: `4px solid ${theme.palette.success.main}`,
              textAlign: "center",
            }}
          >
            <CheckCircle sx={{ fontSize: 60, color: "success.main", mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Inscription réussie !
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Votre compte a été créé avec succès. Vous allez être redirigé vers
              la page de connexion.
            </Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: theme.palette.mode === "light" ? "#f0f2f5" : "#0a0a0a",
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 2,
            borderTop: `4px solid ${theme.palette.primary.main}`,
          }}
        >
          {/* En-tête */}
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
              Créez votre compte professionnel
            </Typography>
          </Box>

          {/* Stepper */}
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Contenu de l'étape */}
          {getStepContent(activeStep)}

          {/* Message d'erreur */}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {/* Boutons de navigation */}
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
            <Button
              variant="outlined"
              onClick={handleBack}
              disabled={activeStep === 0 || loading}
            >
              Retour
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={loading}
              sx={{ minWidth: 120 }}
            >
              {activeStep === steps.length - 1
                ? loading
                  ? "Inscription..."
                  : "S'inscrire"
                : "Suivant"}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Typography variant="caption" color="text.secondary">
              DÉJÀ INSCRIT ?
            </Typography>
          </Divider>

          <Box sx={{ textAlign: "center" }}>
            <Button
              component={RouterLink}
              to="/login"
              color="primary"
              sx={{ textTransform: "none" }}
            >
              Se connecter
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
