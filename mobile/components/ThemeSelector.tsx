// mobile/components/ThemeSelector.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useTheme } from "../contexts/ThemeContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");

interface ThemeSelectorProps {
  visible: boolean;
  onClose: () => void;
}

const THEMES = [
  {
    id: "light" as const,
    label: "Clair",
    icon: "sunny",
    description: "Mode jour",
    color: "#FFB347",
  },
  {
    id: "dark" as const,
    label: "Sombre",
    icon: "moon",
    description: "Mode nuit",
    color: "#6C5B7B",
  },
  {
    id: "system" as const,
    label: "Système",
    icon: "phone-portrait",
    description: "Suit les réglages de l'appareil",
    color: "#3B82F6",
  },
];

export default function ThemeSelector({
  visible,
  onClose,
}: ThemeSelectorProps) {
  const { theme, setTheme, effectiveTheme } = useTheme();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const handleThemeSelect = (newTheme: "light" | "dark" | "system") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTheme(newTheme);
    setTimeout(onClose, 300);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView
        intensity={Platform.OS === "ios" ? 80 : 60}
        tint={effectiveTheme === "dark" ? "dark" : "light"}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          activeOpacity={1}
        />

        <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleContainer}>
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.modalIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="color-palette" size={22} color="#fff" />
              </LinearGradient>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Thème d'affichage
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Liste des thèmes */}
          <View style={styles.themesList}>
            {THEMES.map((themeOption) => {
              const isSelected = theme === themeOption.id;
              return (
                <TouchableOpacity
                  key={themeOption.id}
                  style={[
                    styles.themeOption,
                    {
                      borderColor: isSelected
                        ? themeOption.color
                        : colors.border,
                      backgroundColor: isSelected
                        ? themeOption.color + "10"
                        : "transparent",
                    },
                  ]}
                  onPress={() => handleThemeSelect(themeOption.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.themeIconContainer,
                      {
                        backgroundColor: isSelected
                          ? themeOption.color + "20"
                          : colors.background,
                      },
                    ]}
                  >
                    <Ionicons
                      name={themeOption.icon}
                      size={28}
                      color={
                        isSelected ? themeOption.color : colors.textSecondary
                      }
                    />
                  </View>

                  <View style={styles.themeInfo}>
                    <Text
                      style={[
                        styles.themeLabel,
                        {
                          color: isSelected ? themeOption.color : colors.text,
                          fontWeight: isSelected ? "600" : "500",
                        },
                      ]}
                    >
                      {themeOption.label}
                    </Text>
                    <Text
                      style={[
                        styles.themeDescription,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {themeOption.description}
                    </Text>
                  </View>

                  {isSelected && (
                    <View
                      style={[
                        styles.selectedBadge,
                        { backgroundColor: themeOption.color },
                      ]}
                    >
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Aperçu visuel */}
          <View
            style={[
              styles.previewContainer,
              { backgroundColor: colors.background },
            ]}
          >
            <Text
              style={[styles.previewTitle, { color: colors.textSecondary }]}
            >
              Aperçu
            </Text>
            <View style={styles.previewRow}>
              <View
                style={[styles.previewBox, { backgroundColor: colors.surface }]}
              >
                <View
                  style={[
                    styles.previewHeader,
                    { backgroundColor: colors.primary },
                  ]}
                />
                <Text
                  style={[styles.previewText, { color: colors.text }]}
                  numberOfLines={1}
                >
                  Exemple de texte
                </Text>
              </View>
              <View
                style={[styles.previewBox, { backgroundColor: colors.surface }]}
              >
                <Ionicons name="car" size={24} color={colors.primary} />
                <Text
                  style={[
                    styles.previewTextSmall,
                    { color: colors.textSecondary },
                  ]}
                >
                  Mode {effectiveTheme === "dark" ? "sombre" : "clair"} actif
                </Text>
              </View>
            </View>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: width * 0.85,
    borderRadius: 28,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  themesList: {
    gap: 12,
    marginBottom: 20,
  },
  themeOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    gap: 14,
  },
  themeIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  themeInfo: {
    flex: 1,
  },
  themeLabel: {
    fontSize: 16,
    marginBottom: 2,
  },
  themeDescription: {
    fontSize: 12,
  },
  selectedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  previewContainer: {
    marginTop: 8,
    padding: 16,
    borderRadius: 20,
  },
  previewTitle: {
    fontSize: 12,
    marginBottom: 12,
  },
  previewRow: {
    flexDirection: "row",
    gap: 12,
  },
  previewBox: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    gap: 8,
  },
  previewHeader: {
    width: "100%",
    height: 4,
    borderRadius: 2,
  },
  previewText: {
    fontSize: 12,
  },
  previewTextSmall: {
    fontSize: 10,
  },
});
