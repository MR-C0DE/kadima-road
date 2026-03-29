// helpers/app/settings/appearance.tsx
// Écran d'affichage et langue - Sauvegarde en temps réel

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Platform,
  StatusBar,
  Animated,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../config/api";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";

// ============================================
// CONSTANTES
// ============================================

const THEMES = [
  {
    id: "light" as const,
    label: "Clair",
    icon: "sunny",
    description: "Mode clair pour une utilisation en journée",
    previewColors: ["#FFFFFF", "#F5F5F5"],
  },
  {
    id: "dark" as const,
    label: "Sombre",
    icon: "moon",
    description: "Mode sombre pour réduire la fatigue oculaire",
    previewColors: ["#1A1A1A", "#0A0A0A"],
  },
  {
    id: "system" as const,
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

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function AppearanceSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { effectiveTheme, theme, setTheme } = useTheme();
  const colors = Colors[effectiveTheme ?? "light"];

  // États
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("fr");
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const itemsAnim = useRef([1, 2].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    loadSettings();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    itemsAnim.forEach((anim, index) => {
      Animated.spring(anim, {
        toValue: 1,
        delay: 200 + index * 100,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  // ============================================
  // CHARGEMENT DES PARAMÈTRES
  // ============================================

  const loadSettings = async () => {
    try {
      const response = await api.get("/helpers/profile/me");
      const preferences = response.data.data?.preferences || {};
      setSelectedLanguage(preferences.language || "fr");
    } catch (error) {
      console.error("Erreur chargement paramètres:", error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // SAUVEGARDE EN TEMPS RÉEL
  // ============================================

  const handleThemeChange = async (newTheme: "light" | "dark" | "system") => {
    if (saving) return;
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      // Sauvegarder dans le contexte (UI)
      setTheme(newTheme);

      // Sauvegarder dans le backend
      await api.put("/helpers/profile/me", {
        preferences: {
          theme: newTheme,
          language: selectedLanguage,
        },
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: "success",
        text1: "Thème changé",
        text2: `Thème ${
          THEMES.find((t) => t.id === newTheme)?.label || newTheme
        } activé`,
        position: "bottom",
        visibilityTime: 1500,
      });
    } catch (error: any) {
      console.error("Erreur sauvegarde thème:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2:
          error.response?.data?.message || "Impossible de changer le thème",
        position: "bottom",
      });
      // Revenir à l'ancien thème
      setTheme(theme);
    } finally {
      setSaving(false);
      setThemeModalVisible(false);
    }
  };

  const handleLanguageChange = async (langId: string) => {
    if (saving) return;
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      setSelectedLanguage(langId);

      await api.put("/helpers/profile/me", {
        preferences: {
          language: langId,
          theme: theme,
        },
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: "success",
        text1: "Langue changée",
        text2: LANGUAGES.find((l) => l.id === langId)?.native || "Français",
        position: "bottom",
        visibilityTime: 1500,
      });
    } catch (error: any) {
      console.error("Erreur sauvegarde langue:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2:
          error.response?.data?.message || "Impossible de changer la langue",
        position: "bottom",
      });
      // Revenir à l'ancienne langue
      const response = await api.get("/helpers/profile/me");
      setSelectedLanguage(response.data.data?.preferences?.language || "fr");
    } finally {
      setSaving(false);
      setLanguageModalVisible(false);
    }
  };

  // ============================================
  // UTILITAIRES
  // ============================================

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

  const getThemeIcon = () => {
    switch (theme) {
      case "light":
        return "sunny";
      case "dark":
        return "moon";
      default:
        return "phone-portrait";
    }
  };

  const getLanguageLabel = () => {
    const lang = LANGUAGES.find((l) => l.id === selectedLanguage);
    return lang?.native || "Français";
  };

  const getLanguageFlag = () => {
    const lang = LANGUAGES.find((l) => l.id === selectedLanguage);
    return lang?.flag || "🇫🇷";
  };

  // ============================================
  // RENDU
  // ============================================

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.loadingLogo}
          >
            <Ionicons name="color-palette" size={40} color="#fff" />
          </LinearGradient>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Chargement...
          </Text>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Affichage et langue</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        {/* Thème */}
        <Animated.View
          style={[
            styles.menuItem,
            { backgroundColor: colors.surface },
            { transform: [{ scale: itemsAnim[0] }], opacity: itemsAnim[0] },
          ]}
        >
          <TouchableOpacity
            style={styles.menuItemContent}
            onPress={() => setThemeModalVisible(true)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[colors.primary + "20", colors.primary + "10"]}
              style={styles.menuIcon}
            >
              <Ionicons
                name={getThemeIcon()}
                size={22}
                color={colors.primary}
              />
            </LinearGradient>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>
                Thème
              </Text>
              <Text
                style={[styles.menuSubtitle, { color: colors.textSecondary }]}
              >
                {getThemeLabel()}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Langue */}
        <Animated.View
          style={[
            styles.menuItem,
            { backgroundColor: colors.surface },
            { transform: [{ scale: itemsAnim[1] }], opacity: itemsAnim[1] },
          ]}
        >
          <TouchableOpacity
            style={styles.menuItemContent}
            onPress={() => setLanguageModalVisible(true)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[colors.primary + "20", colors.primary + "10"]}
              style={styles.menuIcon}
            >
              <Ionicons
                name="language-outline"
                size={22}
                color={colors.primary}
              />
            </LinearGradient>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>
                Langue
              </Text>
              <View style={styles.languagePreview}>
                <Text
                  style={[styles.menuSubtitle, { color: colors.textSecondary }]}
                >
                  {getLanguageFlag()} {getLanguageLabel()}
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Aperçu du thème actuel */}
        <Animated.View
          style={[
            styles.previewCard,
            { backgroundColor: colors.surface },
            { transform: [{ scale: itemsAnim[1] }], opacity: itemsAnim[1] },
          ]}
        >
          <LinearGradient
            colors={[colors.primary + "05", colors.secondary + "02"]}
            style={styles.previewGradient}
          >
            <View style={styles.previewHeader}>
              <Ionicons name="eye-outline" size={18} color={colors.primary} />
              <Text style={[styles.previewTitle, { color: colors.text }]}>
                Aperçu
              </Text>
            </View>
            <View style={styles.previewRow}>
              <View
                style={[
                  styles.previewBox,
                  { backgroundColor: colors.background },
                ]}
              >
                <View
                  style={[
                    styles.previewHeaderBar,
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
                style={[
                  styles.previewBox,
                  { backgroundColor: colors.background },
                ]}
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
          </LinearGradient>
        </Animated.View>

        {/* Note */}
        <Animated.View
          style={[
            styles.noteCard,
            { backgroundColor: colors.surface },
            { transform: [{ scale: itemsAnim[1] }], opacity: itemsAnim[1] },
          ]}
        >
          <LinearGradient
            colors={[colors.primary + "05", colors.secondary + "02"]}
            style={styles.noteGradient}
          >
            <Ionicons
              name="information-circle"
              size={20}
              color={colors.primary}
            />
            <Text style={[styles.noteTitle, { color: colors.text }]}>
              Thème système
            </Text>
            <Text style={[styles.noteText, { color: colors.textSecondary }]}>
              Le thème "Système" suit automatiquement les réglages d'affichage
              de votre appareil.
            </Text>
          </LinearGradient>
        </Animated.View>

        <View style={styles.bottomSpace} />
      </Animated.ScrollView>

      {/* ============================================
          MODALE LANGUE
      ============================================ */}
      <Modal visible={languageModalVisible} transparent animationType="fade">
        <BlurView
          intensity={90}
          style={styles.modalOverlay}
          tint={effectiveTheme === "dark" ? "dark" : "light"}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setLanguageModalVisible(false)}
            activeOpacity={1}
          />

          <Animated.View
            style={[
              styles.modalContent,
              { backgroundColor: colors.card },
              {
                transform: [
                  {
                    scale: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={[colors.primary + "10", colors.secondary + "05"]}
              style={styles.modalGradient}
            >
              <View style={styles.modalHeader}>
                <LinearGradient
                  colors={[colors.primary + "20", colors.primary + "10"]}
                  style={styles.modalIcon}
                >
                  <Ionicons name="language" size={24} color={colors.primary} />
                </LinearGradient>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Choisir la langue
                </Text>
                <TouchableOpacity
                  onPress={() => setLanguageModalVisible(false)}
                  style={styles.modalClose}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {LANGUAGES.map((lang) => {
                const isSelected = selectedLanguage === lang.id;
                return (
                  <TouchableOpacity
                    key={lang.id}
                    style={[
                      styles.optionItem,
                      isSelected && {
                        backgroundColor: colors.primary + "10",
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => handleLanguageChange(lang.id)}
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
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </LinearGradient>
          </Animated.View>
        </BlurView>
      </Modal>

      {/* ============================================
          MODALE THÈME
      ============================================ */}
      <Modal visible={themeModalVisible} transparent animationType="fade">
        <BlurView
          intensity={90}
          style={styles.modalOverlay}
          tint={effectiveTheme === "dark" ? "dark" : "light"}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setThemeModalVisible(false)}
            activeOpacity={1}
          />

          <Animated.View
            style={[
              styles.modalContent,
              { backgroundColor: colors.card },
              {
                transform: [
                  {
                    scale: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={[colors.primary + "10", colors.secondary + "05"]}
              style={styles.modalGradient}
            >
              <View style={styles.modalHeader}>
                <LinearGradient
                  colors={[colors.primary + "20", colors.primary + "10"]}
                  style={styles.modalIcon}
                >
                  <Ionicons
                    name="color-palette"
                    size={24}
                    color={colors.primary}
                  />
                </LinearGradient>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Choisir le thème
                </Text>
                <TouchableOpacity
                  onPress={() => setThemeModalVisible(false)}
                  style={styles.modalClose}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {THEMES.map((themeOption) => {
                const isSelected = theme === themeOption.id;
                return (
                  <TouchableOpacity
                    key={themeOption.id}
                    style={[
                      styles.themeOption,
                      {
                        borderColor: isSelected
                          ? themeOption.id === "light"
                            ? "#FFB347"
                            : themeOption.id === "dark"
                            ? "#6C5B7B"
                            : "#3B82F6"
                          : colors.border,
                        backgroundColor: isSelected
                          ? (themeOption.id === "light"
                              ? "#FFB347"
                              : themeOption.id === "dark"
                              ? "#6C5B7B"
                              : "#3B82F6") + "10"
                          : "transparent",
                      },
                    ]}
                    onPress={() => handleThemeChange(themeOption.id)}
                    disabled={saving}
                  >
                    <View style={styles.themePreview}>
                      <LinearGradient
                        colors={themeOption.previewColors}
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
                            {
                              backgroundColor:
                                themeOption.id === "light"
                                  ? "#FFB347"
                                  : themeOption.id === "dark"
                                  ? "#6C5B7B"
                                  : "#3B82F6",
                            },
                          ]}
                        >
                          <Ionicons name="checkmark" size={12} color="#fff" />
                        </View>
                      )}
                    </View>
                    <View style={styles.themeInfo}>
                      <View style={styles.themeInfoRow}>
                        <Ionicons
                          name={themeOption.icon}
                          size={16}
                          color={
                            isSelected
                              ? themeOption.id === "light"
                                ? "#FFB347"
                                : themeOption.id === "dark"
                                ? "#6C5B7B"
                                : "#3B82F6"
                              : colors.textSecondary
                          }
                        />
                        <Text
                          style={[
                            styles.themeLabel,
                            {
                              color: isSelected
                                ? themeOption.id === "light"
                                  ? "#FFB347"
                                  : themeOption.id === "dark"
                                  ? "#6C5B7B"
                                  : "#3B82F6"
                                : colors.text,
                            },
                          ]}
                        >
                          {themeOption.label}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.themeDescription,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {themeOption.description}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </LinearGradient>
          </Animated.View>
        </BlurView>
      </Modal>

      <Toast />
    </View>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  loadingLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  menuItem: {
    borderRadius: 20,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
  },
  languagePreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  previewCard: {
    borderRadius: 20,
    marginTop: 8,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  previewGradient: {
    padding: 16,
    gap: 12,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
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
  previewHeaderBar: {
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
  noteCard: {
    borderRadius: 20,
    marginTop: 8,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  noteGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  noteText: {
    fontSize: 12,
    flex: 2,
  },
  bottomSpace: {
    height: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxWidth: 400,
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 20,
  },
  modalGradient: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  modalIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  modalClose: {
    padding: 4,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "transparent",
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  optionFlag: {
    fontSize: 24,
  },
  optionText: {
    fontSize: 16,
  },
  themeOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
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
});
