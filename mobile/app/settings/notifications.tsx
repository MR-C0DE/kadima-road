// app/settings/notifications.tsx - Version design moderne avec backend complet

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
import { api } from "../../config/api";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

interface NotificationSettings {
  push: boolean;
  email: boolean;
  sms: boolean;
  // Sous-catégories (optionnelles)
  sos: boolean;
  intervention: boolean;
  helper: boolean;
  promo: boolean;
}

export default function NotificationsSettingsScreen() {
  const router = useRouter();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme ?? "light"];

  const [settings, setSettings] = useState<NotificationSettings>({
    push: true,
    email: true,
    sms: true,
    sos: true,
    intervention: true,
    helper: true,
    promo: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);

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
      setLoading(true);
      const response = await api.get("/users/settings");
      const preferences = response.data.data || {};

      if (preferences.notifications) {
        setSettings({
          push: preferences.notifications.push ?? true,
          email: preferences.notifications.email ?? true,
          sms: preferences.notifications.sms ?? true,
          sos: preferences.notifications.sos ?? true,
          intervention: preferences.notifications.intervention ?? true,
          helper: preferences.notifications.helper ?? true,
          promo: preferences.notifications.promo ?? false,
        });
      }
    } catch (error) {
      console.error("Erreur chargement notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    setSaving(true);
    try {
      await api.put("/users/settings", {
        notifications: {
          push: newSettings.push,
          email: newSettings.email,
          sms: newSettings.sms,
          sos: newSettings.sos,
          intervention: newSettings.intervention,
          helper: newSettings.helper,
          promo: newSettings.promo,
        },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Erreur sauvegarde notifications:", error);
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
    await saveSettings(newSettings);
  };

  const subCategories = [
    {
      id: "sos",
      label: "Alertes SOS",
      icon: "alert-circle",
      description: "Notifications en cas d'urgence",
    },
    {
      id: "intervention",
      label: "Mise à jour intervention",
      icon: "car",
      description: "Suivi de votre intervention",
    },
    {
      id: "helper",
      label: "Helper en route",
      icon: "navigate",
      description: "Quand un helper est assigné",
    },
    {
      id: "promo",
      label: "Offres et actualités",
      icon: "gift",
      description: "Promotions et nouveautés",
    },
  ];

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
            Chargement des préférences...
          </Text>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

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
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        {/* Push notifications */}
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
            />
          </View>
        </Animated.View>

        {/* Email notifications */}
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
            />
          </View>
        </Animated.View>

        {/* SMS notifications */}
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
            />
          </View>
        </Animated.View>

        {/* Détail des notifications push - section dépliante */}
        {settings.push && (
          <>
            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => setExpanded(!expanded)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={[colors.primary + "10", "transparent"]}
                style={styles.expandGradient}
              >
                <Text style={[styles.expandText, { color: colors.primary }]}>
                  {expanded
                    ? "Masquer les détails"
                    : "Personnaliser les notifications"}
                </Text>
                <Ionicons
                  name={expanded ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={colors.primary}
                />
              </LinearGradient>
            </TouchableOpacity>

            {expanded && (
              <Animated.View
                style={[
                  styles.subCategoriesContainer,
                  { backgroundColor: colors.surface },
                  {
                    transform: [
                      {
                        scale: itemsAnim[3].interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.95, 1],
                        }),
                      },
                    ],
                    opacity: itemsAnim[3],
                  },
                ]}
              >
                {subCategories.map((cat, index) => (
                  <View
                    key={cat.id}
                    style={[
                      styles.subCategoryRow,
                      index === subCategories.length - 1 && styles.lastRow,
                    ]}
                  >
                    <View style={styles.subCategoryLeft}>
                      <LinearGradient
                        colors={[
                          cat.id === "sos"
                            ? colors.error + "20"
                            : colors.primary + "20",
                          cat.id === "sos"
                            ? colors.error + "10"
                            : colors.primary + "10",
                        ]}
                        style={styles.subCategoryIcon}
                      >
                        <Ionicons
                          name={cat.icon}
                          size={18}
                          color={
                            cat.id === "sos" ? colors.error : colors.primary
                          }
                        />
                      </LinearGradient>
                      <View>
                        <Text
                          style={[
                            styles.subCategoryLabel,
                            { color: colors.text },
                          ]}
                        >
                          {cat.label}
                        </Text>
                        <Text
                          style={[
                            styles.subCategoryDescription,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {cat.description}
                        </Text>
                      </View>
                    </View>
                    <Switch
                      value={
                        settings[
                          cat.id as keyof NotificationSettings
                        ] as boolean
                      }
                      onValueChange={(value) =>
                        toggleSetting(
                          cat.id as keyof NotificationSettings,
                          value
                        )
                      }
                      trackColor={{
                        false: colors.border,
                        true: colors.primary,
                      }}
                      thumbColor={Platform.OS === "ios" ? "#fff" : undefined}
                    />
                  </View>
                ))}
              </Animated.View>
            )}
          </>
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
            <Text style={[styles.noteTitle, { color: colors.text }]}>
              Gestion des notifications
            </Text>
            <Text style={[styles.noteText, { color: colors.textSecondary }]}>
              Vous pouvez modifier à tout moment vos préférences de
              notification. Les alertes SOS sont prioritaires et seront toujours
              envoyées en cas d'urgence.
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Indicateur de sauvegarde */}
        {saving && (
          <View style={styles.savingIndicator}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.savingText, { color: colors.textSecondary }]}>
              Sauvegarde en cours...
            </Text>
          </View>
        )}

        <View style={styles.bottomSpace} />
      </Animated.ScrollView>
    </View>
  );
}

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
    alignItems: "center",
  },
  expandGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  expandText: {
    fontSize: 13,
    fontWeight: "500",
  },
  subCategoriesContainer: {
    borderRadius: 20,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  subCategoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  subCategoryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  subCategoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  subCategoryLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  subCategoryDescription: {
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
