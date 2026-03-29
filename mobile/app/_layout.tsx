// mobile/app/_layout.tsx
import { Stack } from "expo-router";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";
import { SOSProvider } from "../contexts/SOSContext";
import { PaymentProvider } from "../contexts/PaymentContext";
import { SocketProvider } from "../contexts/SocketContext";
import { NetworkProvider } from "../contexts/NetworkContext"; // ← AJOUT
import { NetworkAlert } from "../components/NetworkAlert";
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
      <NetworkAlert />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="sos/index" />
        <Stack.Screen name="sos/waiting" />
        <Stack.Screen name="sos/tracking/[id]" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />
        <Stack.Screen name="vehicles/index" />
        <Stack.Screen name="vehicles/add" />
        <Stack.Screen name="vehicles/[id]" />
        <Stack.Screen name="vehicles/edit/[id]" />
        <Stack.Screen name="vehicles/transfer/[id]" />
        <Stack.Screen name="vehicles/[id]/log" />
        <Stack.Screen name="settings/index" />
        <Stack.Screen name="settings/account" />
        <Stack.Screen name="settings/appearance" />
        <Stack.Screen name="settings/notifications" />
        <Stack.Screen name="settings/privacy" />
        <Stack.Screen name="settings/emergency" />
        <Stack.Screen name="settings/vehicles" />
        <Stack.Screen name="settings/support" />
        <Stack.Screen name="settings/about" />
        <Stack.Screen name="diagnostic/index" />
        <Stack.Screen name="diagnostic/result" />
        <Stack.Screen name="helpers/index" />
        <Stack.Screen name="helpers/request" />
        <Stack.Screen name="history/index" />
        <Stack.Screen name="interventions/[id]" />
        <Stack.Screen name="interventions/[id]/review" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <PaymentProvider>
          <SOSProvider>
            {/* ✅ NetworkProvider DOIT être AVANT SocketProvider */}
            <NetworkProvider>
              <SocketProvider>
                <RootLayoutNav />
              </SocketProvider>
            </NetworkProvider>
          </SOSProvider>
        </PaymentProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
