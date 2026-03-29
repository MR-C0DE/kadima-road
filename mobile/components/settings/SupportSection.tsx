// components/settings/SupportSection.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as MailComposer from "expo-mail-composer";
import SettingsSection from "./SettingsSection";
import { useTheme } from "../../contexts/ThemeContext";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function SupportSection() {
  const { effectiveTheme } = useTheme();
  const colorScheme = useColorScheme();
  const colors = Colors[effectiveTheme ?? "light"];

  const handleContactSupport = async () => {
    const isAvailable = await MailComposer.isAvailableAsync();
    if (isAvailable) {
      await MailComposer.composeAsync({
        recipients: ["support@kadimaroad.com"],
        subject: "[Kadima Road] Demande d'assistance",
        body: "\n\n---\nApplication: Kadima Road\nVersion: 1.0.0\n---",
      });
    } else {
      Linking.openURL("mailto:support@kadimaroad.com");
    }
  };

  const handleReportProblem = async () => {
    const isAvailable = await MailComposer.isAvailableAsync();
    if (isAvailable) {
      await MailComposer.composeAsync({
        recipients: ["support@kadimaroad.com"],
        subject: "[Kadima Road] Signalement de problème",
        body: "\n\n\n---\nDécrivez le problème rencontré :\n\n---\nApplication: Kadima Road\nVersion: 1.0.0\n---",
      });
    } else {
      Linking.openURL("mailto:support@kadimaroad.com");
    }
  };

  const handleOpenFAQ = () => {
    Linking.openURL("https://kadimaroad.com/faq");
  };

  return (
    <SettingsSection title="Aide et support" icon="help-circle-outline">
      {/* Centre d'aide */}
      <TouchableOpacity style={styles.menuItem} onPress={handleOpenFAQ}>
        <View style={styles.menuItemLeft}>
          <Ionicons
            name="document-text-outline"
            size={20}
            color={colors.primary}
          />
          <Text style={[styles.menuItemText, { color: colors.text }]}>
            Centre d'aide
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {/* Contacter le support */}
      <TouchableOpacity style={styles.menuItem} onPress={handleContactSupport}>
        <View style={styles.menuItemLeft}>
          <Ionicons name="mail-outline" size={20} color={colors.primary} />
          <Text style={[styles.menuItemText, { color: colors.text }]}>
            Contacter le support
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {/* Signaler un problème */}
      <TouchableOpacity
        style={[styles.menuItem, styles.lastItem]}
        onPress={handleReportProblem}
      >
        <View style={styles.menuItemLeft}>
          <Ionicons
            name="alert-circle-outline"
            size={20}
            color={colors.warning}
          />
          <Text style={[styles.menuItemText, { color: colors.text }]}>
            Signaler un problème
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.textSecondary}
        />
      </TouchableOpacity>
    </SettingsSection>
  );
}

const styles = StyleSheet.create({
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: "500",
  },
});
