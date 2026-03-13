import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "react-native";

type ThemeType = "light" | "dark" | "system";

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  effectiveTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeType>("system");
  const [isLoading, setIsLoading] = useState(true);

  const effectiveTheme =
    theme === "system" ? systemColorScheme ?? "light" : theme;

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem("userTheme");
      if (savedTheme) {
        setThemeState(savedTheme as ThemeType);
      }
    } catch (error) {
      console.log("Erreur chargement thème:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setTheme = async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    try {
      await AsyncStorage.setItem("userTheme", newTheme);
    } catch (error) {
      console.log("Erreur sauvegarde thème:", error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, effectiveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
