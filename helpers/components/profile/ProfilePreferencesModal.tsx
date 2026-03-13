import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { LANGUAGES, THEMES } from "./constants";

interface ProfilePreferencesModalProps {
  visible: boolean;
  selectedLanguage: string;
  selectedTheme: "light" | "dark" | "system";
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  colors: any;
  colorScheme: string | null | undefined;
  scaleAnim: any;
  onClose: () => void;
  onLanguageChange: (languageId: string) => void;
  onThemeChange: (themeId: "light" | "dark" | "system") => void;
  onNotificationChange: (
    type: "email" | "sms" | "push",
    value: boolean
  ) => void;
  onSave: () => void;
}

export default function ProfilePreferencesModal({
  visible,
  selectedLanguage,
  selectedTheme,
  notifications,
  colors,
  colorScheme,
  scaleAnim,
  onClose,
  onLanguageChange,
  onThemeChange,
  onNotificationChange,
  onSave,
}: ProfilePreferencesModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={90} tint={colorScheme} style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.card,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Préférences
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.modalClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[styles.preferenceSection, { color: colors.text }]}>
              Langue
            </Text>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.id}
                style={[
                  styles.preferenceItem,
                  selectedLanguage === lang.id && {
                    backgroundColor: colors.primary + "10",
                  },
                ]}
                onPress={() => onLanguageChange(lang.id)}
              >
                <Ionicons
                  name={lang.icon}
                  size={22}
                  color={
                    selectedLanguage === lang.id
                      ? colors.primary
                      : colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.preferenceText,
                    {
                      color:
                        selectedLanguage === lang.id
                          ? colors.primary
                          : colors.text,
                    },
                  ]}
                >
                  {lang.label}
                </Text>
                {selectedLanguage === lang.id && (
                  <View
                    style={[
                      styles.preferenceCheck,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}

            <Text
              style={[
                styles.preferenceSection,
                { color: colors.text, marginTop: 20 },
              ]}
            >
              Thème
            </Text>
            {THEMES.map((theme) => (
              <TouchableOpacity
                key={theme.id}
                style={[
                  styles.preferenceItem,
                  selectedTheme === theme.id && {
                    backgroundColor: colors.primary + "10",
                  },
                ]}
                onPress={() =>
                  onThemeChange(theme.id as "light" | "dark" | "system")
                }
              >
                <Ionicons
                  name={theme.icon}
                  size={22}
                  color={
                    selectedTheme === theme.id
                      ? colors.primary
                      : colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.preferenceText,
                    {
                      color:
                        selectedTheme === theme.id
                          ? colors.primary
                          : colors.text,
                    },
                  ]}
                >
                  {theme.label}
                </Text>
                {selectedTheme === theme.id && (
                  <View
                    style={[
                      styles.preferenceCheck,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}

            <Text
              style={[
                styles.preferenceSection,
                { color: colors.text, marginTop: 20 },
              ]}
            >
              Notifications
            </Text>

            <View
              style={[
                styles.notificationItem,
                { backgroundColor: colors.background },
              ]}
            >
              <View style={styles.notificationInfo}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text style={[styles.notificationText, { color: colors.text }]}>
                  Email
                </Text>
              </View>
              <Switch
                value={notifications.email}
                onValueChange={(value) => onNotificationChange("email", value)}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>

            <View
              style={[
                styles.notificationItem,
                { backgroundColor: colors.background },
              ]}
            >
              <View style={styles.notificationInfo}>
                <Ionicons
                  name="chatbubble-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text style={[styles.notificationText, { color: colors.text }]}>
                  SMS
                </Text>
              </View>
              <Switch
                value={notifications.sms}
                onValueChange={(value) => onNotificationChange("sms", value)}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>

            <View
              style={[
                styles.notificationItem,
                { backgroundColor: colors.background },
              ]}
            >
              <View style={styles.notificationInfo}>
                <Ionicons
                  name="notifications-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text style={[styles.notificationText, { color: colors.text }]}>
                  Push
                </Text>
              </View>
              <Switch
                value={notifications.push}
                onValueChange={(value) => onNotificationChange("push", value)}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.modalButton} onPress={onSave}>
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.modalButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.modalButtonText}>Enregistrer</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

// Note: Importer Animated
import Animated from "react-native-reanimated";

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
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
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  modalClose: {
    padding: 4,
  },
  preferenceSection: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },
  preferenceItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    marginBottom: 6,
    gap: 10,
  },
  preferenceText: {
    flex: 1,
    fontSize: 14,
  },
  preferenceCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  notificationInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  notificationText: {
    fontSize: 14,
  },
  modalButton: {
    marginTop: 20,
    borderRadius: 30,
    overflow: "hidden",
  },
  modalButtonGradient: {
    padding: 16,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
