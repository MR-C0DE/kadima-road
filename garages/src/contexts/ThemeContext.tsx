import React, { createContext, useState, useContext, useEffect } from "react";

type ThemeMode = "light" | "dark";

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>("light");

  useEffect(() => {
    // Récupérer le thème sauvegardé
    const savedTheme = localStorage.getItem("theme") as ThemeMode | null;
    if (savedTheme) {
      setMode(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newMode = mode === "light" ? "dark" : "light";
    setMode(newMode);
    localStorage.setItem("theme", newMode);
  };

  const setThemeMode = (newMode: ThemeMode) => {
    setMode(newMode);
    localStorage.setItem("theme", newMode);
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, setMode: setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeMode must be used within ThemeProvider");
  }
  return context;
};
