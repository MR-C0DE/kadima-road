import { createTheme } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Theme {
    status: {
      danger: string;
    };
  }
  interface ThemeOptions {
    status?: {
      danger?: string;
    };
  }
}

// Thème clair
const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#B8860B", // Or antique
      light: "#D4AF37",
      dark: "#8B6508",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#800020", // Bordeaux
      light: "#9B1D1D",
      dark: "#4A0010",
      contrastText: "#FFFFFF",
    },
    success: {
      main: "#2E7D32",
      light: "#4CAF50",
      dark: "#1B5E20",
    },
    warning: {
      main: "#ED6C02",
      light: "#FF9800",
      dark: "#B26A00",
    },
    error: {
      main: "#D32F2F",
      light: "#EF5350",
      dark: "#C62828",
    },
    info: {
      main: "#0288D1",
      light: "#03A9F4",
      dark: "#01579B",
    },
    background: {
      default: "#F5F7FA",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#1A1B1E",
      secondary: "#6C757D",
    },
    divider: "#E9ECEF",
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: "2.5rem",
      fontWeight: 600,
      letterSpacing: "-0.02em",
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 600,
      letterSpacing: "-0.01em",
    },
    h3: {
      fontSize: "1.75rem",
      fontWeight: 600,
    },
    h4: {
      fontSize: "1.5rem",
      fontWeight: 600,
    },
    h5: {
      fontSize: "1.25rem",
      fontWeight: 600,
    },
    h6: {
      fontSize: "1rem",
      fontWeight: 600,
    },
    subtitle1: {
      fontSize: "1rem",
      fontWeight: 500,
    },
    subtitle2: {
      fontSize: "0.875rem",
      fontWeight: 500,
    },
    body1: {
      fontSize: "1rem",
    },
    body2: {
      fontSize: "0.875rem",
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: "8px 16px",
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
          },
        },
        containedPrimary: {
          background: "linear-gradient(45deg, #B8860B 30%, #D4AF37 90%)",
          "&:hover": {
            background: "linear-gradient(45deg, #8B6508 30%, #B8860B 90%)",
          },
        },
        containedSecondary: {
          background: "linear-gradient(45deg, #800020 30%, #9B1D1D 90%)",
          "&:hover": {
            background: "linear-gradient(45deg, #4A0010 30%, #800020 90%)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          transition: "transform 0.2s, box-shadow 0.2s",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
        elevation1: {
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#FFFFFF",
          borderRight: "1px solid #E9ECEF",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#FFFFFF",
          color: "#1A1B1E",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          borderBottom: "1px solid #E9ECEF",
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: "4px 8px",
          "&.Mui-selected": {
            backgroundColor: "#B8860B15",
            "&:hover": {
              backgroundColor: "#B8860B25",
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: "#F8F9FA",
        },
      },
    },
  },
});

// Thème sombre
const darkTheme = createTheme({
  ...lightTheme,
  palette: {
    mode: "dark",
    primary: {
      main: "#D4AF37", // Or plus clair pour le dark mode
      light: "#F0B90B",
      dark: "#B8860B",
      contrastText: "#000000",
    },
    secondary: {
      main: "#9B1D1D",
      light: "#B71C1C",
      dark: "#800020",
      contrastText: "#FFFFFF",
    },
    success: {
      main: "#4CAF50",
      light: "#81C784",
      dark: "#388E3C",
    },
    warning: {
      main: "#FF9800",
      light: "#FFB74D",
      dark: "#F57C00",
    },
    error: {
      main: "#F44336",
      light: "#E57373",
      dark: "#D32F2F",
    },
    info: {
      main: "#29B6F6",
      light: "#4FC3F7",
      dark: "#0288D1",
    },
    background: {
      default: "#121212",
      paper: "#1E1E1E",
    },
    text: {
      primary: "#FFFFFF",
      secondary: "#B0B0B0",
    },
    divider: "#404040",
  },
  components: {
    ...lightTheme.components,
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#1A1A1A",
          borderRight: "1px solid #404040",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#1A1A1A",
          color: "#FFFFFF",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          borderBottom: "1px solid #404040",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#1E1E1E",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        },
      },
    },
  },
});

export const getTheme = (mode: "light" | "dark") => {
  return mode === "light" ? lightTheme : darkTheme;
};
