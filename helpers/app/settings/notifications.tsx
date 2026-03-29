// helpers/app/settings/notifications.tsx
// Écran des notifications - Sauvegarde en temps réel

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
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../config/api";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";

// ============================================
// TYPES
// ============================================

interface NotificationSettings {
  push: boolean;
  email: boolean;
  sms: boolean;
}

interface DetailedNotifications {
  sos: boolean;
  new_mission: boolean;
  mission_update: boolean;
  earnings: boolean;
  promo: boolean;
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function NotificationsSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme ?? "light"];

  // États
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    push: true,
    email: true,
    sms: true,
  });
  const [detailedSettings, setDetailedSettings] =
    useState<DetailedNotifications>({
      sos: true,
      new_mission: true,
      mission_update: true,
      earnings: true,
      promo: false,
    });
  const [expanded, setExpanded] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const expandAnim = useRef(new Animated.Value(0)).current;
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

  useEffect(() => {
    Animated.timing(expandAnim, {
      toValue: expanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [expanded]);

  // ============================================
  // CHARGEMENT DES PARAMÈTRES
  // ============================================

  const loadSettings = async () => {
    try {
      const response = await api.get("/helpers/profile/me");
      const preferences = response.data.data?.preferences || {};
      const notifications = preferences.notifications || {};

      setSettings({
        push: notifications.push ?? true,
        email: notifications.email ?? true,
        sms: notifications.sms ?? true,
      });

      setDetailedSettings({
        sos: notifications.sos ?? true,
        new_mission: notifications.new_mission ?? true,
        mission_update: notifications.mission_update ?? true,
        earnings: notifications.earnings ?? true,
        promo: notifications.promo ?? false,
      });
    } catch (error) {
      console.error("Erreur chargement notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // SAUVEGARDE EN TEMPS RÉEL
  // ============================================

  const saveSettings = async (
    newSettings: NotificationSettings,
    newDetailed: DetailedNotifications
  ) => {
    if (saving) return;
    setSaving(true);

    try {
      await api.put("/helpers/profile/me", {
        preferences: {
          notifications: {
            ...newSettings,
            ...newDetailed,
          },
        },
      });
    } catch (error: any) {
      console.error("Erreur sauvegarde notifications:", error);
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: error.response?.data?.message || "Impossible de sauvegarder",
        position: "bottom",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleSetting = async (
    key: keyof NotificationSettings,
    value: boolean
  ) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await saveSettings(newSettings, detailedSettings);

    Toast.show({
      type: "success",
      text1: "Mis à jour",
      text2: `${key === "push" ? "Push" : key === "email" ? "Email" : "SMS"} ${
        value ? "activé" : "désactivé"
      }`,
      position: "bottom",
      visibilityTime: 1500,
    });
  };

  const toggleDetailedSetting = async (
    key: keyof DetailedNotifications,
    value: boolean
  ) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newDetailed = { ...detailedSettings, [key]: value };
    setDetailedSettings(newDetailed);
    await saveSettings(settings, newDetailed);
  };

  const toggleExpand = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded(!expanded);
  };

  // ============================================
  // UTILITAIRES
  // ============================================

  const getDetailedIcon = (key: keyof DetailedNotifications) => {
    switch (key) {
      case "sos":
        return "alert-circle";
      case "new_mission":
        return "flash";
      case "mission_update":
        return "car";
      case "earnings":
        return "cash";
      case "promo":
        return "gift";
      default:
        return "notifications";
    }
  };

  const getDetailedLabel = (key: keyof DetailedNotifications) => {
    switch (key) {
      case "sos":
        return "Alertes SOS";
      case "new_mission":
        return "Nouvelles missions";
      case "mission_update":
        return "Mise à jour de mission";
      case "earnings":
        return "Gains";
      case "promo":
        return "Offres et actualités";
      default:
        return key;
    }
  };

  const getDetailedDescription = (key: keyof DetailedNotifications) => {
    switch (key) {
      case "sos":
        return "Alertes d'urgence prioritaires";
      case "new_mission":
        return "Nouvelles missions disponibles";
      case "mission_update":
        return "Changements de statut de mission";
      case "earnings":
        return "Nouveaux gains et paiements";
      case "promo":
        return "Promotions et actualités Kadima Helpers";
      default:
        return "";
    }
  };

  const expandHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 380],
  });

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
            <Ionicons name="notifications" size={40} color="#fff" />
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
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        {/* Notifications Push */}
        <Animated.View
          style={[
            styles.settingItem,
            { backgroundColor: colors.surface },
            { transform: [{ scale: itemsAnim[0] }], opacity: itemsAnim[0] },
          ]}
        >
          <View style={styles.settingItemContent}>
            <LinearGradient
              colors={[colors.primary + "20", colors.primary + "10"]}
              style={styles.settingIcon}
            >
              <Ionicons
                name="phone-portrait-outline"
                size={22}
                color={colors.primary}
              />
            </LinearGradient>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                Notifications push
              </Text>
              <Text
                style={[
                  styles.settingSubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                Alertes sur votre appareil
              </Text>
            </View>
            <Switch
              value={settings.push}
              onValueChange={(value) => toggleSetting("push", value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={Platform.OS === "ios" ? "#fff" : undefined}
              disabled={saving}
            />
          </View>
        </Animated.View>

        {/* Notifications Email */}
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
              <Ionicons name="mail-outline" size={22} color={colors.primary} />
            </LinearGradient>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                Notifications email
              </Text>
              <Text
                style={[
                  styles.settingSubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                Alertes par email
              </Text>
            </View>
            <Switch
              value={settings.email}
              onValueChange={(value) => toggleSetting("email", value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={Platform.OS === "ios" ? "#fff" : undefined}
              disabled={saving}
            />
          </View>
        </Animated.View>

        {/* Notifications SMS */}
        <Animated.View
          style={[
            styles.settingItem,
            { backgroundColor: colors.surface },
            { transform: [{ scale: itemsAnim[2] }], opacity: itemsAnim[2] },
          ]}
        >
          <View style={styles.settingItemContent}>
            <LinearGradient
              colors={[colors.primary + "20", colors.primary + "10"]}
              style={styles.settingIcon}
            >
              <Ionicons
                name="chatbubble-outline"
                size={22}
                color={colors.primary}
              />
            </LinearGradient>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                Notifications SMS
              </Text>
              <Text
                style={[
                  styles.settingSubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                Alertes par SMS
              </Text>
            </View>
            <Switch
              value={settings.sms}
              onValueChange={(value) => toggleSetting("sms", value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={Platform.OS === "ios" ? "#fff" : undefined}
              disabled={saving}
            />
          </View>
        </Animated.View>

        {/* Section détaillée (dépliante) */}
        {settings.push && (
          <Animated.View style={{ opacity: itemsAnim[3] }}>
            <TouchableOpacity
              style={[styles.expandButton, { backgroundColor: colors.surface }]}
              onPress={toggleExpand}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={[colors.primary + "10", colors.secondary + "05"]}
                style={styles.expandGradient}
              >
                <Ionicons
                  name={expanded ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={colors.primary}
                />
                <Text style={[styles.expandText, { color: colors.primary }]}>
                  {expanded
                    ? "Masquer les détails"
                    : "Personnaliser les notifications push"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <Animated.View
              style={[
                styles.detailedContainer,
                {
                  height: expandHeight,
                  opacity: expandAnim,
                },
              ]}
            >
              <View
                style={[
                  styles.detailedContent,
                  { backgroundColor: colors.surface },
                ]}
              >
                {Object.keys(detailedSettings).map((key, index) => {
                  const k = key as keyof DetailedNotifications;
                  return (
                    <View
                      key={k}
                      style={[
                        styles.detailedItem,
                        index === Object.keys(detailedSettings).length - 1 &&
                          styles.lastDetailedItem,
                      ]}
                    >
                      <View style={styles.detailedLeft}>
                        <LinearGradient
                          colors={[
                            colors.primary + "20",
                            colors.primary + "10",
                          ]}
                          style={styles.detailedIcon}
                        >
                          <Ionicons
                            name={getDetailedIcon(k)}
                            size={18}
                            color={colors.primary}
                          />
                        </LinearGradient>
                        <View>
                          <Text
                            style={[
                              styles.detailedLabel,
                              { color: colors.text },
                            ]}
                          >
                            {getDetailedLabel(k)}
                          </Text>
                          <Text
                            style={[
                              styles.detailedDescription,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {getDetailedDescription(k)}
                          </Text>
                        </View>
                      </View>
                      <Switch
                        value={detailedSettings[k]}
                        onValueChange={(value) =>
                          toggleDetailedSetting(k, value)
                        }
                        trackColor={{
                          false: colors.border,
                          true: colors.primary,
                        }}
                        thumbColor={Platform.OS === "ios" ? "#fff" : undefined}
                        disabled={saving}
                      />
                    </View>
                  );
                })}
              </View>
            </Animated.View>
          </Animated.View>
        )}

        {/* Note informative */}
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
              name="information-circle"
              size={24}
              color={colors.primary}
            />
            <View style={styles.noteContent}>
              <Text style={[styles.noteTitle, { color: colors.text }]}>
                Gestion des notifications
              </Text>
              <Text style={[styles.noteText, { color: colors.textSecondary }]}>
                Vous pouvez modifier à tout moment vos préférences de
                notification. Les alertes SOS sont prioritaires et seront
                toujours envoyées.
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Indicateur de sauvegarde */}
        {saving && (
          <View style={styles.savingIndicator}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.savingText, { color: colors.textSecondary }]}>
              Sauvegarde...
            </Text>
          </View>
        )}

        <View style={styles.bottomSpace} />
      </Animated.ScrollView>

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
  expandButton: {
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 20,
    overflow: "hidden",
  },
  expandGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  expandText: {
    fontSize: 13,
    fontWeight: "500",
  },
  detailedContainer: {
    overflow: "hidden",
  },
  detailedContent: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  detailedItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  lastDetailedItem: {
    borderBottomWidth: 0,
  },
  detailedLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  detailedIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  detailedLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  detailedDescription: {
    fontSize: 11,
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
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  noteText: {
    fontSize: 12,
    lineHeight: 16,
  },
  savingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  savingText: {
    fontSize: 12,
  },
  bottomSpace: {
    height: 20,
  },
});
