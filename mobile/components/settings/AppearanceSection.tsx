// components/settings/AppearanceSection.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Switch,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import SettingsSection from "./SettingsSection";
import ThemeSelector from "../ThemeSelector";
import { useTheme } from "../../contexts/ThemeContext";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

const { width, height } = Dimensions.get("window"); // ← AJOUTER CETTE LIGNE

interface AppearanceSectionProps {
  settings: any;
  onSaveSettings: (newSettings: any) => void;
}

const LANGUAGES = [
  { id: "fr", label: "Français", native: "Français" },
  { id: "en", label: "English", native: "English" },
];

const TEXT_SIZES = [
  { id: "small", label: "Petite", value: 14 },
  { id: "normal", label: "Normale", value: 16 },
  { id: "large", label: "Grande", value: 18 },
];

export default function AppearanceSection({
  settings,
  onSaveSettings,
}: AppearanceSectionProps) {
  const { theme, effectiveTheme, setTheme } = useTheme();
  const colorScheme = useColorScheme();
  const colors = Colors[effectiveTheme ?? "light"];

  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [textSizeModalVisible, setTextSizeModalVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(
    settings?.language || "fr"
  );
  const [selectedTextSize, setSelectedTextSize] = useState("normal");

  const getThemeLabel = () => {
    switch (theme) {
      case "light":
        return "Clair";
      case "dark":
        return "Sombre";
      default:
        return "Système";
    }
  };

  const getLanguageLabel = () => {
    const lang = LANGUAGES.find((l) => l.id === selectedLanguage);
    return lang?.native || "Français";
  };

  const getTextSizeLabel = () => {
    const size = TEXT_SIZES.find((s) => s.id === selectedTextSize);
    return size?.label || "Normale";
  };

  const handleLanguageChange = (langId: string) => {
    setSelectedLanguage(langId);
    onSaveSettings({ ...settings, language: langId });
    setLanguageModalVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleTextSizeChange = (sizeId: string) => {
    setSelectedTextSize(sizeId);
    // TODO: Implémenter le changement de taille de texte global
    setTextSizeModalVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <>
      <SettingsSection title="Affichage et langue" icon="color-palette-outline">
        {/* Thème */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setThemeModalVisible(true)}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons
              name="contrast-outline"
              size={20}
              color={colors.primary}
            />
            <Text style={[styles.menuItemText, { color: colors.text }]}>
              Thème
            </Text>
          </View>
          <View style={styles.menuItemRight}>
            <Text
              style={[styles.menuItemValue, { color: colors.textSecondary }]}
            >
              {getThemeLabel()}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textSecondary}
            />
          </View>
        </TouchableOpacity>

        {/* Langue */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setLanguageModalVisible(true)}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons
              name="language-outline"
              size={20}
              color={colors.primary}
            />
            <Text style={[styles.menuItemText, { color: colors.text }]}>
              Langue
            </Text>
          </View>
          <View style={styles.menuItemRight}>
            <Text
              style={[styles.menuItemValue, { color: colors.textSecondary }]}
            >
              {getLanguageLabel()}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textSecondary}
            />
          </View>
        </TouchableOpacity>

        {/* Taille du texte */}
        <TouchableOpacity
          style={[styles.menuItem, styles.lastItem]}
          onPress={() => setTextSizeModalVisible(true)}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="text-outline" size={20} color={colors.primary} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>
              Taille du texte
            </Text>
          </View>
          <View style={styles.menuItemRight}>
            <Text
              style={[styles.menuItemValue, { color: colors.textSecondary }]}
            >
              {getTextSizeLabel()}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textSecondary}
            />
          </View>
        </TouchableOpacity>
      </SettingsSection>

      {/* Modale Langue */}
      <Modal visible={languageModalVisible} transparent animationType="fade">
        <BlurView
          intensity={80}
          style={styles.modalOverlay}
          tint={effectiveTheme === "dark" ? "dark" : "light"}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Choisir la langue
              </Text>
              <TouchableOpacity onPress={() => setLanguageModalVisible(false)}>
                <Ionicons
                  name="close-outline"
                  size={24}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.id}
                style={[
                  styles.optionItem,
                  selectedLanguage === lang.id && {
                    backgroundColor: colors.primary + "10",
                  },
                ]}
                onPress={() => handleLanguageChange(lang.id)}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color:
                        selectedLanguage === lang.id
                          ? colors.primary
                          : colors.text,
                    },
                  ]}
                >
                  {lang.native}
                </Text>
                {selectedLanguage === lang.id && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </BlurView>
      </Modal>

      {/* Modale Taille texte */}
      <Modal visible={textSizeModalVisible} transparent animationType="fade">
        <BlurView
          intensity={80}
          style={styles.modalOverlay}
          tint={effectiveTheme === "dark" ? "dark" : "light"}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Taille du texte
              </Text>
              <TouchableOpacity onPress={() => setTextSizeModalVisible(false)}>
                <Ionicons
                  name="close-outline"
                  size={24}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            {TEXT_SIZES.map((size) => (
              <TouchableOpacity
                key={size.id}
                style={[
                  styles.optionItem,
                  selectedTextSize === size.id && {
                    backgroundColor: colors.primary + "10",
                  },
                ]}
                onPress={() => handleTextSizeChange(size.id)}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color:
                        selectedTextSize === size.id
                          ? colors.primary
                          : colors.text,
                      fontSize: size.value,
                    },
                  ]}
                >
                  {size.label}
                </Text>
                {selectedTextSize === size.id && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </BlurView>
      </Modal>

      {/* Modale Thème (réutilise ThemeSelector existant) */}
      <ThemeSelector
        visible={themeModalVisible}
        onClose={() => setThemeModalVisible(false)}
      />
    </>
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
  menuItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  menuItemValue: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: width * 0.85,
    borderRadius: 28,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  optionText: {
    fontSize: 16,
  },
});
