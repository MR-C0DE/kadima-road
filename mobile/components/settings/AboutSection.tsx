// components/settings/AboutSection.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SettingsSection from "./SettingsSection";
import { useTheme } from "../../contexts/ThemeContext";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

const APP_VERSION = "1.0.0";

export default function AboutSection() {
  const { effectiveTheme } = useTheme();
  const colorScheme = useColorScheme();
  const colors = Colors[effectiveTheme ?? "light"];

  const handleOpenTerms = () => {
    Linking.openURL("https://kadimaroad.com/terms");
  };

  const handleOpenPrivacy = () => {
    Linking.openURL("https://kadimaroad.com/privacy");
  };

  const handleOpenLicenses = () => {
    Linking.openURL("https://kadimaroad.com/licenses");
  };

  const handleOpenWebsite = () => {
    Linking.openURL("https://kadimaroad.com");
  };

  const handleOpenInstagram = () => {
    Linking.openURL("https://instagram.com/kadimaroad");
  };

  return (
    <SettingsSection title="À propos" icon="information-circle-outline">
      {/* Version */}
      <View style={styles.menuItem}>
        <View style={styles.menuItemLeft}>
          <Ionicons name="code-outline" size={20} color={colors.primary} />
          <Text style={[styles.menuItemText, { color: colors.text }]}>
            Version
          </Text>
        </View>
        <Text style={[styles.versionText, { color: colors.textSecondary }]}>
          v{APP_VERSION}
        </Text>
      </View>

      {/* Conditions d'utilisation */}
      <TouchableOpacity style={styles.menuItem} onPress={handleOpenTerms}>
        <View style={styles.menuItemLeft}>
          <Ionicons
            name="document-text-outline"
            size={20}
            color={colors.primary}
          />
          <Text style={[styles.menuItemText, { color: colors.text }]}>
            Conditions d'utilisation
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {/* Politique de confidentialité */}
      <TouchableOpacity style={styles.menuItem} onPress={handleOpenPrivacy}>
        <View style={styles.menuItemLeft}>
          <Ionicons name="shield-outline" size={20} color={colors.primary} />
          <Text style={[styles.menuItemText, { color: colors.text }]}>
            Politique de confidentialité
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {/* Licences open source */}
      <TouchableOpacity style={styles.menuItem} onPress={handleOpenLicenses}>
        <View style={styles.menuItemLeft}>
          <Ionicons
            name="code-slash-outline"
            size={20}
            color={colors.primary}
          />
          <Text style={[styles.menuItemText, { color: colors.text }]}>
            Licences open source
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {/* Site web */}
      <TouchableOpacity style={styles.menuItem} onPress={handleOpenWebsite}>
        <View style={styles.menuItemLeft}>
          <Ionicons name="globe-outline" size={20} color={colors.primary} />
          <Text style={[styles.menuItemText, { color: colors.text }]}>
            Site web
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {/* Instagram */}
      <TouchableOpacity
        style={[styles.menuItem, styles.lastItem]}
        onPress={handleOpenInstagram}
      >
        <View style={styles.menuItemLeft}>
          <Ionicons name="logo-instagram" size={20} color={colors.primary} />
          <Text style={[styles.menuItemText, { color: colors.text }]}>
            Instagram
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
  versionText: {
    fontSize: 14,
  },
});
