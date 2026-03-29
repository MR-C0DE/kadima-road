// helpers/app/settings/_layout.tsx
import { Stack } from "expo-router";

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Paramètres" }} />
      <Stack.Screen name="account" options={{ title: "Compte et sécurité" }} />
      <Stack.Screen
        name="appearance"
        options={{ title: "Affichage et langue" }}
      />
      <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
      <Stack.Screen name="privacy" options={{ title: "Confidentialité" }} />
      <Stack.Screen name="services" options={{ title: "Services" }} />
      <Stack.Screen name="equipment" options={{ title: "Équipement" }} />
      <Stack.Screen name="zone" options={{ title: "Zone d'intervention" }} />
      <Stack.Screen name="pricing" options={{ title: "Tarifs" }} />
      <Stack.Screen name="documents" options={{ title: "Documents" }} />
      <Stack.Screen name="support" options={{ title: "Aide et support" }} />
      <Stack.Screen name="about" options={{ title: "À propos" }} />
    </Stack>
  );
}
