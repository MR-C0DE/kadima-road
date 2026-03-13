import { Stack } from "expo-router";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";
import { View, ActivityIndicator, StatusBar } from "react-native";
import { useEffect } from "react";
import { useRouter } from "expo-router";

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const { effectiveTheme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace("/auth/login");
      } else {
        router.replace("/(tabs)");
      }
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#E63946" />
      </View>
    );
  }

  return (
    <>
      <StatusBar
        barStyle={effectiveTheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="sos/index" />
        <Stack.Screen name="diagnostic/index" />
        <Stack.Screen name="diagnostic/result" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />
        {/* ❌ SUPPRIME helpers/index */}
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <RootLayoutNav />
      </ThemeProvider>
    </AuthProvider>
  );
}
