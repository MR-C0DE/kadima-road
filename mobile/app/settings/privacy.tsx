// app/settings/privacy.tsx - Version avec nouvelle API expo-file-system

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Share,
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
import * as Haptics from "expo-haptics";
import { File, Directory, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

// Options de localisation
const LOCATION_OPTIONS = [
  { id: "always", label: "Toujours", description: "Partagée en permanence" },
  {
    id: "sos_only",
    label: "Uniquement lors d'un SOS",
    description: "Partagée uniquement en cas d'urgence",
  },
  { id: "never", label: "Jamais", description: "Position non partagée" },
];

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme ?? "light"];

  const [settings, setSettings] = useState({
    shareLocation: true,
    shareData: false,
  });
  const [locationMode, setLocationMode] = useState("always");
  const [expanded, setExpanded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const itemsAnim = useRef(
    [1, 2, 3, 4].map(() => new Animated.Value(0))
  ).current;

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
      const privacy = response.data.data?.privacy || {
        shareLocation: true,
        shareData: false,
      };
      setSettings(privacy);
    } catch (error) {
      console.error("Erreur chargement paramètres:", error);
    }
  };

  const savePrivacy = async (newPrivacy: any) => {
    try {
      await api.put("/users/settings", { privacy: newPrivacy });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert("Erreur", "Impossible de sauvegarder les paramètres");
    }
  };

  const toggleShareLocation = (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSettings({ ...settings, shareLocation: value });
    savePrivacy({ ...settings, shareLocation: value });
  };

  const toggleShareData = (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSettings({ ...settings, shareData: value });
    savePrivacy({ ...settings, shareData: value });
  };

  const handleLocationModeChange = (mode: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocationMode(mode);
    if (mode !== "never") {
      toggleShareLocation(true);
    } else {
      toggleShareLocation(false);
    }
  };

  // ✅ NOUVELLE VERSION - Utilisation de la nouvelle API expo-file-system
  const handleExportData = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDownloading(true);

    try {
      const response = await api.get("/users/export-data");
      const data = response.data.data;
      const jsonString = JSON.stringify(data, null, 2);
      const fileName = `kadima_data_${Date.now()}.json`;

      // Créer un dossier dans le cache
      const cacheDir = new Directory(Paths.cache);

      // Créer le fichier
      const file = new File(cacheDir, fileName);

      // Créer le fichier (overwrite si existe)
      file.create({ overwrite: true });

      // Écrire le contenu
      file.write(jsonString);

      // Vérifier que le fichier existe
      if (!file.exists) {
        throw new Error("Le fichier n'a pas pu être créé");
      }

      // Partager le fichier
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: "application/json",
          dialogTitle: "Exporter mes données",
          UTI: "public.json",
        });
      } else {
        Alert.alert(
          "Export",
          "Le partage n'est pas disponible sur cet appareil"
        );
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      console.error("Erreur export:", error);
      Alert.alert(
        "Erreur",
        error.message || "Impossible d'exporter les données"
      );
    } finally {
      setDownloading(false);
    }
  };

  const handleClearHistory = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      "⚠️ Supprimer l'historique",
      "Voulez-vous vraiment supprimer tout l'historique des interventions ? Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            setClearingHistory(true);
            try {
              await api.delete("/users/history");
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
              Alert.alert("✅ Succès", "Historique supprimé avec succès");
            } catch (error: any) {
              Alert.alert(
                "Erreur",
                error.response?.data?.message ||
                  "Impossible de supprimer l'historique"
              );
            } finally {
              setClearingHistory(false);
            }
          },
        },
      ]
    );
  };

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
          <Text style={styles.headerTitle}>Confidentialité</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        {/* Partager ma position */}
        <Animated.View
          style={[
            styles.menuItem,
            { backgroundColor: colors.surface },
            { transform: [{ scale: itemsAnim[0] }], opacity: itemsAnim[0] },
          ]}
        >
          <TouchableOpacity
            style={styles.menuItemContent}
            onPress={() => setExpanded(!expanded)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[colors.primary + "20", colors.primary + "10"]}
              style={styles.menuIcon}
            >
              <Ionicons
                name="location-outline"
                size={22}
                color={colors.primary}
              />
            </LinearGradient>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>
                Partager ma position
              </Text>
              <Text
                style={[styles.menuSubtitle, { color: colors.textSecondary }]}
              >
                {settings.shareLocation
                  ? locationMode === "always"
                    ? "Toujours"
                    : locationMode === "sos_only"
                    ? "SOS uniquement"
                    : "Désactivé"
                  : "Désactivé"}
              </Text>
            </View>
            <Ionicons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          {expanded && (
            <View style={styles.expandedOptions}>
              {LOCATION_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.radioOption,
                    locationMode === opt.id && {
                      backgroundColor: colors.primary + "10",
                    },
                  ]}
                  onPress={() => handleLocationModeChange(opt.id)}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      locationMode === opt.id && {
                        borderColor: colors.primary,
                      },
                    ]}
                  >
                    {locationMode === opt.id && (
                      <View
                        style={[
                          styles.radioInner,
                          { backgroundColor: colors.primary },
                        ]}
                      />
                    )}
                  </View>
                  <View style={styles.radioTextContainer}>
                    <Text
                      style={[
                        styles.radioLabel,
                        {
                          color:
                            locationMode === opt.id
                              ? colors.primary
                              : colors.text,
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                    <Text
                      style={[
                        styles.radioDescription,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {opt.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Animated.View>

        {/* Partager mes données d'utilisation */}
        <Animated.View
          style={[
            styles.settingItem,
            { backgroundColor: colors.surface },
            { transform: [{ scale: itemsAnim[1] }], opacity: itemsAnim[1] },
          ]}
        >
          <View style={styles.settingItemContent}>
            <LinearGradient
              colors={[colors.primary + "20", colors.primary + "10"]}
              style={styles.settingIcon}
            >
              <Ionicons
                name="analytics-outline"
                size={22}
                color={colors.primary}
              />
            </LinearGradient>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                Partager mes données d'utilisation
              </Text>
              <Text
                style={[
                  styles.settingSubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                Aide à améliorer l'application
              </Text>
            </View>
            <Switch
              value={settings.shareData}
              onValueChange={toggleShareData}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={Platform.OS === "ios" ? "#fff" : undefined}
            />
          </View>
        </Animated.View>

        {/* Télécharger mes données */}
        <Animated.View
          style={[
            styles.menuItem,
            { backgroundColor: colors.surface },
            { transform: [{ scale: itemsAnim[2] }], opacity: itemsAnim[2] },
          ]}
        >
          <TouchableOpacity
            style={styles.menuItemContent}
            onPress={handleExportData}
            disabled={downloading}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[colors.primary + "20", colors.primary + "10"]}
              style={styles.menuIcon}
            >
              <Ionicons
                name="download-outline"
                size={22}
                color={colors.primary}
              />
            </LinearGradient>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>
                Télécharger mes données
              </Text>
              <Text
                style={[styles.menuSubtitle, { color: colors.textSecondary }]}
              >
                Exporter toutes vos données personnelles (RGPD)
              </Text>
            </View>
            {downloading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Supprimer l'historique */}
        <Animated.View
          style={[
            styles.menuItem,
            styles.dangerItem,
            { backgroundColor: colors.surface },
            { transform: [{ scale: itemsAnim[3] }], opacity: itemsAnim[3] },
          ]}
        >
          <TouchableOpacity
            style={styles.menuItemContent}
            onPress={handleClearHistory}
            disabled={clearingHistory}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[colors.error + "20", colors.error + "10"]}
              style={[
                styles.menuIcon,
                { backgroundColor: colors.error + "10" },
              ]}
            >
              <Ionicons name="trash-outline" size={22} color={colors.error} />
            </LinearGradient>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuTitle, { color: colors.error }]}>
                Supprimer l'historique
              </Text>
              <Text style={[styles.menuSubtitle, { color: colors.error }]}>
                Effacer toutes vos interventions passées
              </Text>
            </View>
            {clearingHistory ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <Ionicons name="chevron-forward" size={20} color={colors.error} />
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Note sur la confidentialité */}
        <Animated.View
          style={[
            styles.noteCard,
            { backgroundColor: colors.surface },
            { transform: [{ scale: itemsAnim[3] }], opacity: itemsAnim[3] },
          ]}
        >
          <LinearGradient
            colors={[colors.primary + "05", colors.secondary + "02"]}
            style={styles.noteGradient}
          >
            <Ionicons
              name="shield-checkmark"
              size={24}
              color={colors.primary}
            />
            <Text style={[styles.noteTitle, { color: colors.text }]}>
              Vos données sont protégées
            </Text>
            <Text style={[styles.noteText, { color: colors.textSecondary }]}>
              Conformément au RGPD, vous avez le contrôle total sur vos données
              personnelles. Vous pouvez les exporter ou les supprimer à tout
              moment.
            </Text>
          </LinearGradient>
        </Animated.View>

        <View style={styles.bottomSpace} />
      </Animated.ScrollView>
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
  settingItem: {
    borderRadius: 20,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingItemContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
  },
  settingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
  },
  dangerItem: {
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
  },
  expandedOptions: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  radioTextContainer: {
    flex: 1,
  },
  radioLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  radioDescription: {
    fontSize: 12,
  },
  noteCard: {
    borderRadius: 20,
    marginTop: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  noteGradient: {
    padding: 20,
    alignItems: "center",
    gap: 12,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  noteText: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  bottomSpace: {
    height: 20,
  },
});
