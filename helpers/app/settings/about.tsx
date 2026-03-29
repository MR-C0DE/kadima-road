// helpers/app/settings/about.tsx
// Écran À propos - Version, conditions, licences

import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  StatusBar,
  Animated,
  Share,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";

// ============================================
// CONSTANTES
// ============================================

const APP_VERSION = "1.0.0";
const APP_BUILD = "100";
const APP_YEAR = "2025";
const APP_NAME = "Moxtor Helpers";

// ============================================
// OPTIONS
// ============================================

const ABOUT_OPTIONS = [
  {
    id: "terms",
    title: "Conditions d'utilisation",
    icon: "document-text-outline",
    description: "Conditions générales d'utilisation",
    color: "#3B82F6",
    url: "https://moxtor.com/terms",
  },
  {
    id: "privacy",
    title: "Politique de confidentialité",
    icon: "shield-outline",
    description: "Comment nous protégeons vos données",
    color: "#8B5CF6",
    url: "https://moxtor.com/privacy",
  },
  {
    id: "licenses",
    title: "Licences open source",
    icon: "code-slash-outline",
    description: "Bibliothèques et crédits",
    color: "#10B981",
    url: "https://moxtor.com/licenses",
  },
  {
    id: "website",
    title: "Site web",
    icon: "globe-outline",
    description: "moxtor.com",
    color: "#06B6D4",
    url: "https://moxtor.com",
  },
  {
    id: "instagram",
    title: "Instagram",
    icon: "logo-instagram",
    description: "@moxtor_helpers",
    color: "#EC4899",
    url: "https://instagram.com/moxtor_helpers",
  },
  {
    id: "github",
    title: "GitHub",
    icon: "logo-github",
    description: "Projet open source",
    color: "#6B7280",
    url: "https://github.com/moxtor/helpers",
  },
];

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function AboutSettingsScreen() {
  const router = useRouter();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme ?? "light"];

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.9)).current;
  const itemsAnim = useRef(
    ABOUT_OPTIONS.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 5,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();

    itemsAnim.forEach((anim, index) => {
      Animated.spring(anim, {
        toValue: 1,
        delay: 300 + index * 80,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  // ============================================
  // ACTIONS
  // ============================================

  const handleOpenLink = async (url: string, title: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Toast.show({
          type: "error",
          text1: "Erreur",
          text2: `Impossible d'ouvrir ${title}`,
          position: "bottom",
        });
      }
    } catch (error) {
      console.error("Erreur ouverture lien:", error);
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: `Impossible d'ouvrir ${title}`,
        position: "bottom",
      });
    }
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `${APP_NAME} - Application d'assistance routière\nTéléchargez l'application sur ${
          Platform.OS === "ios" ? "l'App Store" : "Google Play"
        }\nhttps://moxtor.com/download`,
        title: APP_NAME,
      });
    } catch (error) {
      console.error("Erreur partage:", error);
    }
  };

  // ============================================
  // RENDU
  // ============================================

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
          <Text style={styles.headerTitle}>À propos</Text>
          <TouchableOpacity
            onPress={handleShare}
            style={styles.shareButton}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={["rgba(255,255,255,0.2)", "rgba(255,255,255,0.1)"]}
              style={styles.shareButtonGradient}
            >
              <Ionicons name="share-outline" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        {/* Logo et version */}
        <Animated.View
          style={[
            styles.logoCard,
            { backgroundColor: colors.surface },
            { transform: [{ scale: logoScale }] },
          ]}
        >
          <LinearGradient
            colors={[colors.primary + "10", colors.secondary + "05"]}
            style={styles.logoGradient}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.logoIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="flash" size={48} color="#fff" />
            </LinearGradient>

            <Text style={[styles.appName, { color: colors.text }]}>
              {APP_NAME}
            </Text>

            <View style={styles.versionContainer}>
              <View
                style={[
                  styles.versionBadge,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Text style={[styles.versionText, { color: colors.primary }]}>
                  Version {APP_VERSION}
                </Text>
              </View>
              <View
                style={[styles.buildBadge, { backgroundColor: colors.border }]}
              >
                <Text
                  style={[styles.buildText, { color: colors.textSecondary }]}
                >
                  Build {APP_BUILD}
                </Text>
              </View>
            </View>

            <Text style={[styles.copyright, { color: colors.textSecondary }]}>
              © {APP_YEAR} Moxtor. Tous droits réservés.
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Options */}
        <View style={styles.optionsList}>
          {ABOUT_OPTIONS.map((option, index) => (
            <Animated.View
              key={option.id}
              style={[
                styles.optionItem,
                { backgroundColor: colors.surface },
                {
                  opacity: itemsAnim[index],
                  transform: [
                    {
                      translateY: itemsAnim[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.optionContent}
                onPress={() => handleOpenLink(option.url, option.title)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[option.color + "20", option.color + "10"]}
                  style={styles.optionIcon}
                >
                  <Ionicons name={option.icon} size={22} color={option.color} />
                </LinearGradient>
                <View style={styles.optionTextContainer}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    {option.title}
                  </Text>
                  <Text
                    style={[
                      styles.optionDescription,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {option.description}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* Note de fin */}
        <View style={[styles.noteCard, { backgroundColor: colors.surface }]}>
          <LinearGradient
            colors={[colors.primary + "05", colors.secondary + "02"]}
            style={styles.noteGradient}
          >
            <Ionicons name="heart" size={24} color={colors.primary} />
            <View style={styles.noteContent}>
              <Text style={[styles.noteTitle, { color: colors.text }]}>
                Made with ❤️
              </Text>
              <Text style={[styles.noteText, { color: colors.textSecondary }]}>
                Moxtor Helpers est une application d'assistance routière conçue
                pour connecter les conducteurs en panne avec des helpers
                professionnels.
              </Text>
            </View>
          </LinearGradient>
        </View>

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
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
  },
  shareButtonGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  logoCard: {
    borderRadius: 28,
    marginBottom: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  logoGradient: {
    alignItems: "center",
    padding: 32,
    gap: 16,
  },
  logoIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  appName: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  versionContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  versionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  versionText: {
    fontSize: 13,
    fontWeight: "600",
  },
  buildBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  buildText: {
    fontSize: 11,
  },
  copyright: {
    fontSize: 11,
    marginTop: 4,
  },
  optionsList: {
    gap: 12,
    marginBottom: 20,
  },
  optionItem: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 12,
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
    padding: 20,
    gap: 16,
  },
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  noteText: {
    fontSize: 13,
    lineHeight: 18,
  },
  bottomSpace: {
    height: 20,
  },
});
