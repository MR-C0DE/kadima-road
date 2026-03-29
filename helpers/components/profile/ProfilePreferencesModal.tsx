// helpers/components/profile/ProfilePreferencesModal.tsx
// VERSION FINALE - SAUVEGARDE EN TEMPS RÉEL

import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");

const THEMES = [
  {
    id: "light",
    label: "Clair",
    icon: "sunny",
    description: "Mode clair pour une utilisation en journée",
    previewColors: ["#FFFFFF", "#F5F5F5"],
  },
  {
    id: "dark",
    label: "Sombre",
    icon: "moon",
    description: "Mode sombre pour réduire la fatigue oculaire",
    previewColors: ["#1A1A1A", "#0A0A0A"],
  },
  {
    id: "system",
    label: "Système",
    icon: "phone-portrait",
    description: "Suit les réglages de votre appareil",
    previewColors: ["#3B82F6", "#8B5CF6"],
  },
];

const LANGUAGES = [
  { id: "fr", label: "Français", native: "Français", flag: "🇫🇷" },
  { id: "en", label: "English", native: "English", flag: "🇬🇧" },
];

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
  colorScheme: string | null;
  onClose: () => void;
  onLanguageChange: (languageId: string) => Promise<void> | void;
  onThemeChange: (themeId: "light" | "dark" | "system") => Promise<void> | void;
  onNotificationChange: (
    type: "email" | "sms" | "push",
    value: boolean
  ) => Promise<void> | void;
  // Note: onSave n'est plus utilisé, on garde pour compatibilité
  onSave?: () => void;
}

export default function ProfilePreferencesModal({
  visible,
  selectedLanguage,
  selectedTheme,
  notifications,
  colors,
  colorScheme,
  onClose,
  onLanguageChange,
  onThemeChange,
  onNotificationChange,
}: ProfilePreferencesModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [localSelectedTheme, setLocalSelectedTheme] = useState(selectedTheme);
  const [localSelectedLanguage, setLocalSelectedLanguage] =
    useState(selectedLanguage);
  const [localNotifications, setLocalNotifications] = useState(notifications);
  const [saving, setSaving] = useState(false);

  // Synchroniser avec les props quand la modal s'ouvre
  useEffect(() => {
    if (visible) {
      setLocalSelectedTheme(selectedTheme);
      setLocalSelectedLanguage(selectedLanguage);
      setLocalNotifications(notifications);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.9);
      fadeAnim.setValue(0);
    }
  }, [visible, selectedTheme, selectedLanguage, notifications]);

  // ============================================
  // SAUVEGARDE EN TEMPS RÉEL
  // ============================================

  const handleThemeSelect = async (themeId: "light" | "dark" | "system") => {
    if (saving) return;
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocalSelectedTheme(themeId);
    try {
      await onThemeChange(themeId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Erreur sauvegarde thème:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // Revenir à l'ancienne valeur
      setLocalSelectedTheme(selectedTheme);
    } finally {
      setSaving(false);
    }
  };

  const handleLanguageSelect = async (langId: string) => {
    if (saving) return;
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocalSelectedLanguage(langId);
    try {
      await onLanguageChange(langId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Erreur sauvegarde langue:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setLocalSelectedLanguage(selectedLanguage);
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationToggle = async (
    type: "email" | "sms" | "push",
    value: boolean
  ) => {
    if (saving) return;
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocalNotifications({ ...localNotifications, [type]: value });
    try {
      await onNotificationChange(type, value);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Erreur sauvegarde notification:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setLocalNotifications(notifications);
    } finally {
      setSaving(false);
    }
  };

  const getThemeIcon = (themeId: string) => {
    switch (themeId) {
      case "light":
        return "sunny";
      case "dark":
        return "moon";
      default:
        return "phone-portrait";
    }
  };

  const getCurrentThemeLabel = () => {
    switch (selectedTheme) {
      case "light":
        return "Clair";
      case "dark":
        return "Sombre";
      default:
        return "Système";
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <BlurView intensity={90} tint={colorScheme} style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          activeOpacity={1}
        />

        <Animated.View
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.card,
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          {/* Header */}
          <LinearGradient
            colors={[colors.primary + "20", colors.secondary + "10"]}
            style={styles.headerGradient}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <LinearGradient
                  colors={[colors.primary, colors.secondary]}
                  style={styles.modalHeaderIcon}
                >
                  <Ionicons name="settings" size={22} color="#fff" />
                </LinearGradient>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Préférences
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.modalClose}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text
              style={[styles.modalDescription, { color: colors.textSecondary }]}
            >
              Personnalisez votre expérience
            </Text>
          </LinearGradient>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Section Langue */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <LinearGradient
                  colors={[colors.primary + "20", colors.secondary + "10"]}
                  style={styles.sectionIcon}
                >
                  <Ionicons name="language" size={18} color={colors.primary} />
                </LinearGradient>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Langue
                </Text>
              </View>
              <Text
                style={[
                  styles.sectionSubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                Choisissez la langue de l'application
              </Text>

              <View style={styles.optionsContainer}>
                {LANGUAGES.map((lang) => {
                  const isSelected = localSelectedLanguage === lang.id;
                  return (
                    <TouchableOpacity
                      key={lang.id}
                      style={[
                        styles.optionCard,
                        {
                          backgroundColor: isSelected
                            ? colors.primary + "10"
                            : colors.background,
                          borderColor: isSelected
                            ? colors.primary
                            : colors.border,
                        },
                      ]}
                      onPress={() => handleLanguageSelect(lang.id)}
                      disabled={saving}
                    >
                      <View style={styles.optionLeft}>
                        <Text style={styles.optionFlag}>{lang.flag}</Text>
                        <Text
                          style={[
                            styles.optionText,
                            {
                              color: isSelected ? colors.primary : colors.text,
                            },
                          ]}
                        >
                          {lang.native}
                        </Text>
                      </View>
                      {isSelected && (
                        <View
                          style={[
                            styles.checkBadge,
                            { backgroundColor: colors.primary },
                          ]}
                        >
                          <Ionicons name="checkmark" size={14} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Section Thème */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <LinearGradient
                  colors={[colors.primary + "20", colors.secondary + "10"]}
                  style={styles.sectionIcon}
                >
                  <Ionicons
                    name="color-palette"
                    size={18}
                    color={colors.primary}
                  />
                </LinearGradient>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Thème
                </Text>
              </View>
              <Text
                style={[
                  styles.sectionSubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                Personnalisez l'apparence de l'application
              </Text>

              <View style={styles.themesContainer}>
                {THEMES.map((theme) => {
                  const isSelected = localSelectedTheme === theme.id;
                  return (
                    <TouchableOpacity
                      key={theme.id}
                      style={[
                        styles.themeCard,
                        {
                          backgroundColor: isSelected
                            ? colors.primary + "10"
                            : colors.background,
                          borderColor: isSelected
                            ? colors.primary
                            : colors.border,
                        },
                      ]}
                      onPress={() =>
                        handleThemeSelect(
                          theme.id as "light" | "dark" | "system"
                        )
                      }
                      disabled={saving}
                    >
                      <View style={styles.themePreview}>
                        <LinearGradient
                          colors={theme.previewColors}
                          style={styles.themePreviewGradient}
                        >
                          <View style={styles.themePreviewContent}>
                            <View style={styles.themePreviewHeader} />
                            <View style={styles.themePreviewBody}>
                              <View style={styles.themePreviewLine} />
                              <View style={styles.themePreviewLineSmall} />
                            </View>
                          </View>
                        </LinearGradient>
                        {isSelected && (
                          <View
                            style={[
                              styles.themeSelectedBadge,
                              { backgroundColor: colors.primary },
                            ]}
                          >
                            <Ionicons name="checkmark" size={12} color="#fff" />
                          </View>
                        )}
                      </View>
                      <View style={styles.themeInfo}>
                        <View style={styles.themeInfoRow}>
                          <Ionicons
                            name={getThemeIcon(theme.id)}
                            size={16}
                            color={
                              isSelected ? colors.primary : colors.textSecondary
                            }
                          />
                          <Text
                            style={[
                              styles.themeLabel,
                              {
                                color: isSelected
                                  ? colors.primary
                                  : colors.text,
                              },
                            ]}
                          >
                            {theme.label}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.themeDescription,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {theme.description}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Indicateur du thème actuel */}
              <View
                style={[
                  styles.activeThemeIndicator,
                  { backgroundColor: colors.primary + "10" },
                ]}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={colors.primary}
                />
                <Text
                  style={[styles.activeThemeText, { color: colors.primary }]}
                >
                  Thème actuel : {getCurrentThemeLabel()}
                </Text>
              </View>
            </View>

            {/* Section Notifications */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <LinearGradient
                  colors={[colors.primary + "20", colors.secondary + "10"]}
                  style={styles.sectionIcon}
                >
                  <Ionicons
                    name="notifications"
                    size={18}
                    color={colors.primary}
                  />
                </LinearGradient>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Notifications
                </Text>
              </View>
              <Text
                style={[
                  styles.sectionSubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                Gérez vos alertes
              </Text>

              <View style={styles.notificationsContainer}>
                <View
                  style={[
                    styles.notificationItem,
                    { backgroundColor: colors.background },
                  ]}
                >
                  <View style={styles.notificationLeft}>
                    <View
                      style={[
                        styles.notificationIcon,
                        { backgroundColor: colors.primary + "10" },
                      ]}
                    >
                      <Ionicons
                        name="mail-outline"
                        size={20}
                        color={colors.primary}
                      />
                    </View>
                    <View>
                      <Text
                        style={[
                          styles.notificationTitle,
                          { color: colors.text },
                        ]}
                      >
                        Email
                      </Text>
                      <Text
                        style={[
                          styles.notificationDesc,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Recevoir les alertes par email
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={localNotifications.email}
                    onValueChange={(value) =>
                      handleNotificationToggle("email", value)
                    }
                    trackColor={{ false: colors.border, true: colors.primary }}
                    disabled={saving}
                  />
                </View>

                <View
                  style={[
                    styles.notificationItem,
                    { backgroundColor: colors.background },
                  ]}
                >
                  <View style={styles.notificationLeft}>
                    <View
                      style={[
                        styles.notificationIcon,
                        { backgroundColor: colors.primary + "10" },
                      ]}
                    >
                      <Ionicons
                        name="chatbubble-outline"
                        size={20}
                        color={colors.primary}
                      />
                    </View>
                    <View>
                      <Text
                        style={[
                          styles.notificationTitle,
                          { color: colors.text },
                        ]}
                      >
                        SMS
                      </Text>
                      <Text
                        style={[
                          styles.notificationDesc,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Recevoir les alertes par SMS
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={localNotifications.sms}
                    onValueChange={(value) =>
                      handleNotificationToggle("sms", value)
                    }
                    trackColor={{ false: colors.border, true: colors.primary }}
                    disabled={saving}
                  />
                </View>

                <View
                  style={[
                    styles.notificationItem,
                    { backgroundColor: colors.background },
                  ]}
                >
                  <View style={styles.notificationLeft}>
                    <View
                      style={[
                        styles.notificationIcon,
                        { backgroundColor: colors.primary + "10" },
                      ]}
                    >
                      <Ionicons
                        name="notifications-outline"
                        size={20}
                        color={colors.primary}
                      />
                    </View>
                    <View>
                      <Text
                        style={[
                          styles.notificationTitle,
                          { color: colors.text },
                        ]}
                      >
                        Push
                      </Text>
                      <Text
                        style={[
                          styles.notificationDesc,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Recevoir les notifications push
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={localNotifications.push}
                    onValueChange={(value) =>
                      handleNotificationToggle("push", value)
                    }
                    trackColor={{ false: colors.border, true: colors.primary }}
                    disabled={saving}
                  />
                </View>
              </View>
            </View>

            {/* Note explicative */}
            <View style={styles.noteContainer}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color={colors.textSecondary}
              />
              <Text style={[styles.noteText, { color: colors.textSecondary }]}>
                Les modifications sont sauvegardées automatiquement
              </Text>
            </View>
          </ScrollView>

          {/* Bouton de fermeture */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.closeButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.closeButtonText}>Fermer</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
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
  modalContent: {
    width: "90%",
    maxHeight: "85%",
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 20,
  },
  headerGradient: {
    padding: 20,
    paddingBottom: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalHeaderIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  modalClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  modalDescription: {
    fontSize: 14,
    marginLeft: 56,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  sectionSubtitle: {
    fontSize: 12,
    marginBottom: 4,
  },
  optionsContainer: {
    gap: 8,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  optionFlag: {
    fontSize: 28,
  },
  optionText: {
    fontSize: 15,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  themesContainer: {
    gap: 12,
  },
  themeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  themePreview: {
    position: "relative",
  },
  themePreviewGradient: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: "hidden",
  },
  themePreviewContent: {
    flex: 1,
    padding: 6,
  },
  themePreviewHeader: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.5)",
    borderRadius: 4,
    marginBottom: 6,
  },
  themePreviewBody: {
    gap: 3,
  },
  themePreviewLine: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.5)",
    borderRadius: 2,
    width: "80%",
  },
  themePreviewLineSmall: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.4)",
    borderRadius: 2,
    width: "50%",
  },
  themeSelectedBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  themeInfo: {
    flex: 1,
  },
  themeInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  themeLabel: {
    fontSize: 15,
  },
  themeDescription: {
    fontSize: 11,
  },
  activeThemeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  activeThemeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  notificationsContainer: {
    gap: 8,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 16,
  },
  notificationLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  notificationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 2,
  },
  notificationDesc: {
    fontSize: 11,
  },
  noteContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
  },
  noteText: {
    fontSize: 12,
  },
  closeButton: {
    margin: 20,
    marginTop: 0,
    borderRadius: 30,
    overflow: "hidden",
  },
  closeButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 8,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
