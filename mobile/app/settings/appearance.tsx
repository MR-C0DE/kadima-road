// app/settings/appearance.tsx - Version design moderne avec backend complet

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Switch,
  Platform,
  StatusBar,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import { api } from "../../config/api";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import ThemeSelector from "../../components/ThemeSelector";

const LANGUAGES = [
  { id: "fr", label: "Français", native: "Français", flag: "🇫🇷" },
  { id: "en", label: "English", native: "English", flag: "🇬🇧" },
];

const TEXT_SIZES = [
  { id: "small", label: "Petite", value: 14, preview: "Texte exemple" },
  { id: "normal", label: "Normale", value: 16, preview: "Texte exemple" },
  { id: "large", label: "Grande", value: 18, preview: "Texte exemple" },
];

export default function AppearanceSettingsScreen() {
  const router = useRouter();
  const { effectiveTheme, theme, setTheme } = useTheme();
  const colors = Colors[effectiveTheme ?? "light"];

  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [textSizeModalVisible, setTextSizeModalVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("fr");
  const [selectedTextSize, setSelectedTextSize] = useState("normal");
  const [saving, setSaving] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const itemsAnim = useRef([1, 2, 3].map(() => new Animated.Value(0))).current;

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

  const loadSettings = async () => {
    try {
      const response = await api.get("/users/settings");
      const preferences = response.data.data || {};
      setSelectedLanguage(preferences.language || "fr");
      setSelectedTextSize(preferences.textSize || "normal");
    } catch (error) {
      console.error("Erreur chargement paramètres:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveLanguage = async (langId: string) => {
    setSaving(true);
    try {
      await api.put("/users/settings", { language: langId });
      setSelectedLanguage(langId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Erreur sauvegarde langue:", error);
    } finally {
      setSaving(false);
    }
  };

  const saveTextSize = async (sizeId: string) => {
    setSaving(true);
    try {
      await api.put("/users/settings", { textSize: sizeId });
      setSelectedTextSize(sizeId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Erreur sauvegarde taille texte:", error);
    } finally {
      setSaving(false);
    }
  };

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

  const getTextSizeLabel = () => {
    const size = TEXT_SIZES.find((s) => s.id === selectedTextSize);
    return size?.label || "Normale";
  };

  const getTextSizeValue = () => {
    const size = TEXT_SIZES.find((s) => s.id === selectedTextSize);
    return size?.value || 16;
  };

  const previewTextSize = getTextSizeValue();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Header avec gradient */}
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

        {/* Taille du texte */}
        <Animated.View
          style={[
            styles.menuItem,
            { backgroundColor: colors.surface },
            { transform: [{ scale: itemsAnim[2] }], opacity: itemsAnim[2] },
          ]}
        >
          <TouchableOpacity
            style={styles.menuItemContent}
            onPress={() => setTextSizeModalVisible(true)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[colors.primary + "20", colors.primary + "10"]}
              style={styles.menuIcon}
            >
              <Ionicons name="text-outline" size={22} color={colors.primary} />
            </LinearGradient>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>
                Taille du texte
              </Text>
              <Text
                style={[styles.menuSubtitle, { color: colors.textSecondary }]}
              >
                {getTextSizeLabel()}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          {/* Aperçu de la taille du texte */}
          <View style={styles.previewContainer}>
            <LinearGradient
              colors={[colors.primary + "05", colors.secondary + "02"]}
              style={styles.previewGradient}
            >
              <Text
                style={[
                  styles.previewText,
                  {
                    color: colors.textSecondary,
                    fontSize: previewTextSize - 2,
                  },
                ]}
              >
                Aperçu
              </Text>
              <Text
                style={[
                  styles.previewExample,
                  { color: colors.text, fontSize: previewTextSize },
                ]}
              >
                Ceci est un exemple de texte avec la taille sélectionnée.
              </Text>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Note sur le thème système */}
        <Animated.View
          style={[
            styles.noteCard,
            { backgroundColor: colors.surface },
            { transform: [{ scale: itemsAnim[2] }], opacity: itemsAnim[2] },
          ]}
        >
          <LinearGradient
            colors={[colors.primary + "05", colors.secondary + "02"]}
            style={styles.noteGradient}
          >
            <Ionicons
              name="information-circle"
              size={24}
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

      {/* Modale Langue */}
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

              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.id}
                  style={[
                    styles.optionItem,
                    selectedLanguage === lang.id && {
                      backgroundColor: colors.primary + "10",
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => {
                    saveLanguage(lang.id);
                    setLanguageModalVisible(false);
                  }}
                  disabled={saving}
                >
                  <View style={styles.optionLeft}>
                    <Text style={styles.optionFlag}>{lang.flag}</Text>
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
                  </View>
                  {selectedLanguage === lang.id && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </LinearGradient>
          </Animated.View>
        </BlurView>
      </Modal>

      {/* Modale Taille texte */}
      <Modal visible={textSizeModalVisible} transparent animationType="fade">
        <BlurView
          intensity={90}
          style={styles.modalOverlay}
          tint={effectiveTheme === "dark" ? "dark" : "light"}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setTextSizeModalVisible(false)}
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
                  <Ionicons name="text" size={24} color={colors.primary} />
                </LinearGradient>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Taille du texte
                </Text>
                <TouchableOpacity
                  onPress={() => setTextSizeModalVisible(false)}
                  style={styles.modalClose}
                >
                  <Ionicons
                    name="close"
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
                    styles.sizeOption,
                    selectedTextSize === size.id && {
                      backgroundColor: colors.primary + "10",
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => {
                    saveTextSize(size.id);
                    setTextSizeModalVisible(false);
                  }}
                  disabled={saving}
                >
                  <View style={styles.optionLeft}>
                    <Text
                      style={[
                        styles.sizePreview,
                        {
                          fontSize: size.value,
                          color:
                            selectedTextSize === size.id
                              ? colors.primary
                              : colors.text,
                        },
                      ]}
                    >
                      {size.preview}
                    </Text>
                    <Text
                      style={[
                        styles.sizeLabel,
                        {
                          color:
                            selectedTextSize === size.id
                              ? colors.primary
                              : colors.textSecondary,
                        },
                      ]}
                    >
                      {size.label}
                    </Text>
                  </View>
                  {selectedTextSize === size.id && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </LinearGradient>
          </Animated.View>
        </BlurView>
      </Modal>

      {/* Modale Thème */}
      <ThemeSelector
        visible={themeModalVisible}
        onClose={() => setThemeModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  previewContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  previewGradient: {
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    gap: 8,
  },
  previewText: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  previewExample: {
    textAlign: "center",
    lineHeight: 24,
  },
  noteCard: {
    borderRadius: 20,
    marginTop: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  noteGradient: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
  sizeOption: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 4,
  },
  sizePreview: {
    fontWeight: "500",
  },
  sizeLabel: {
    fontSize: 12,
  },
});
