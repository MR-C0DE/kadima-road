// mobile/hooks/use-color-scheme.ts
import { useTheme } from "../contexts/ThemeContext";

export function useColorScheme() {
  const { effectiveTheme } = useTheme();
  return effectiveTheme;
}
