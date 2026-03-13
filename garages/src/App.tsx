import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Box } from "@mui/material";
import { getTheme } from "./theme";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider, useThemeMode } from "./contexts/ThemeContext";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Planning from "./pages/Planning"; // ← AJOUTÉ

// Composants
import Sidebar from "./components/Common/Sidebar";
import Header from "./components/Common/Header";
import Loading from "./components/Common/Loading";

const drawerWidth = 240;

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  if (loading) return <Loading />;

  if (!user) return <Navigate to="/login" />;

  return (
    <Box sx={{ display: "flex" }}>
      <Header toggleSidebar={handleDrawerToggle} />
      <Sidebar mobileOpen={mobileOpen} onClose={handleDrawerToggle} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: "64px",
          minHeight: "100vh",
          backgroundColor: "background.default",
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

function AppContent() {
  const { mode } = useThemeMode();
  const theme = getTheme(mode);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />
        <Route
          path="/planning" // ← NOUVELLE ROUTE
          element={
            <PrivateRoute>
              <Planning />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
      </Routes>
    </MuiThemeProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <AppContent />
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
