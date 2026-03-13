import { Stack } from "expo-router";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";
import { OnboardingProvider } from "../contexts/OnboardingContext"; // ← AJOUTER CET IMPORT
import { View, ActivityIndicator, StatusBar } from "react-native";
import { useEffect, useState } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { Colors } from "@/constants/theme";
import { api } from "../config/api";

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const { effectiveTheme } = useTheme();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);

  const colors = Colors[effectiveTheme];

  useEffect(() => {
    if (!isLoading) {
      setIsReady(true);
    }
  }, [isLoading]);

  useEffect(() => {
    const checkHelperProfile = async () => {
      if (!isAuthenticated) {
        setCheckingProfile(false);
        return;
      }

      try {
        const response = await api.get("/auth/helper/profile");
        const helper = response.data.data;

        const hasEssentialInfo =
          helper.services?.length > 0 && helper.pricing?.basePrice > 0;

        setNeedsOnboarding(!hasEssentialInfo);
      } catch (error) {
        console.log("Pas de profil helper, besoin d'onboarding");
        setNeedsOnboarding(true);
      } finally {
        setCheckingProfile(false);
      }
    };

    if (isAuthenticated) {
      checkHelperProfile();
    } else {
      setCheckingProfile(false);
    }
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      if (isReady && !checkingProfile) {
        if (!isAuthenticated) {
          router.replace("/auth/login");
        } else if (needsOnboarding) {
          router.replace("/(onboarding)/welcome");
        } else {
          router.replace("/(tabs)");
        }
      }
    }, [isReady, checkingProfile, isAuthenticated, needsOnboarding])
  );

  if (!isReady || isLoading || checkingProfile) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <StatusBar
          barStyle={
            effectiveTheme === "dark" ? "light-content" : "dark-content"
          }
        />
        <ActivityIndicator size="large" color={colors.primary} />
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
      <Stack screenOptions={{ headerShown: false }}>
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
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <OnboardingProvider>
          {/* ← AJOUTER ICI */}
          <RootLayoutNav />
        </OnboardingProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
