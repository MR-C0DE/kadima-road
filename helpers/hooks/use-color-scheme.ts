import { useColorScheme as useNativeColorScheme } from "react-native";
import { useTheme } from "../contexts/ThemeContext";

export function useColorScheme() {
  const { effectiveTheme } = useTheme();
  return effectiveTheme;
}
