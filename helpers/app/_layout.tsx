// helpers/app/_layout.tsx
import { Stack } from "expo-router";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";
import { OnboardingProvider } from "../contexts/OnboardingContext";
import { SocketProvider } from "../contexts/SocketContext";
import { NetworkProvider } from "../contexts/NetworkContext"; // ← AJOUT
import { NetworkAlert } from "../components/NetworkAlert"; // ← AJOUT
import { View, ActivityIndicator, StatusBar, Text } from "react-native";
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
      <NetworkAlert />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />
        <Stack.Screen name="(onboarding)/welcome" />
        <Stack.Screen name="(onboarding)/services" />
        <Stack.Screen name="(onboarding)/zone" />
        <Stack.Screen name="(onboarding)/pricing" />
        <Stack.Screen name="(onboarding)/availability" />
        <Stack.Screen name="(onboarding)/equipment" />
        <Stack.Screen name="(onboarding)/documents" />
        <Stack.Screen name="(onboarding)/success" />
        <Stack.Screen name="missions/[id]" />
        <Stack.Screen name="settings" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <OnboardingProvider>
          {/* ✅ NetworkProvider AVANT SocketProvider */}
          <NetworkProvider>
            <SocketProvider>
              <RootLayoutNav />
            </SocketProvider>
          </NetworkProvider>
        </OnboardingProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
