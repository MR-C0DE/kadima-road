// components/settings/SettingsPage.tsx
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import AccountSection from "./AccountSection";
import AppearanceSection from "./AppearanceSection";
import NotificationsSection from "./NotificationsSection";
import PrivacySection from "./PrivacySection";
import VehiclesSection from "./VehiclesSection";
import SupportSection from "./SupportSection";
import AboutSection from "./AboutSection";
import { useTheme } from "../../contexts/ThemeContext";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface SettingsPageProps {
  userDetails: any;
  settings: any;
  onUpdateProfile: () => void;
  onSaveSettings: (newSettings: any) => void;
}

export default function SettingsPage({
  userDetails,
  settings,
  onUpdateProfile,
  onSaveSettings,
}: SettingsPageProps) {
  const { effectiveTheme } = useTheme();
  const colorScheme = useColorScheme();
  const colors = Colors[effectiveTheme ?? "light"];

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <AccountSection userDetails={userDetails} onUpdate={onUpdateProfile} />
      <AppearanceSection settings={settings} onSaveSettings={onSaveSettings} />
      <NotificationsSection
        settings={settings}
        onSaveSettings={onSaveSettings}
      />
      <PrivacySection settings={settings} onSaveSettings={onSaveSettings} />
      <VehiclesSection userDetails={userDetails} />
      <SupportSection />
      <AboutSection />
      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  bottomSpace: {
    height: 20,
  },
});
