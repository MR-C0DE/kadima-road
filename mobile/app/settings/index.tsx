// app/settings/index.tsx - Version avec header simplifié

import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

interface SettingsCategory {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  route: string;
  badge?: number;
  color: string;
}

const CATEGORIES: SettingsCategory[] = [
  {
    id: "account",
    title: "Compte et sécurité",
    icon: "person-outline",
    description: "Profil, mot de passe, suppression du compte",
    route: "/settings/account",
    color: "#3B82F6",
  },
  {
    id: "appearance",
    title: "Affichage et langue",
    icon: "color-palette-outline",
    description: "Thème, langue, taille du texte",
    route: "/settings/appearance",
    color: "#8B5CF6",
  },
  {
    id: "notifications",
    title: "Notifications",
    icon: "notifications-outline",
    description: "Push, email, SMS",
    route: "/settings/notifications",
    color: "#EC4899",
  },
  {
    id: "privacy",
    title: "Confidentialité",
    icon: "shield-outline",
    description: "Partager ma position, mes données",
    route: "/settings/privacy",
    color: "#22C55E",
  },
  {
    id: "vehicles",
    title: "Véhicules et assistance",
    icon: "car-outline",
    description: "Véhicule par défaut, méthode de paiement",
    route: "/settings/vehicles",
    color: "#F59E0B",
  },
  {
    id: "emergency",
    title: "Contacts d'urgence",
    icon: "alert-circle-outline",
    description: "Gérer vos contacts en cas de besoin",
    route: "/settings/emergency",
    color: "#EF4444",
  },
  {
    id: "support",
    title: "Aide et support",
    icon: "help-circle-outline",
    description: "Centre d'aide, contacter le support",
    route: "/settings/support",
    color: "#6B7280",
  },
  {
    id: "about",
    title: "À propos",
    icon: "information-circle-outline",
    description: "Version, conditions, licences",
    route: "/settings/about",
    color: "#9CA3AF",
  },
];

const CategoryCard = ({
  category,
  colors,
  onPress,
  index,
}: {
  category: SettingsCategory;
  colors: any;
  onPress: () => void;
  index: number;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.spring(translateX, {
        toValue: 0,
        friction: 6,
        tension: 40,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }, { translateX }],
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.categoryCard, { backgroundColor: colors.surface }]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <LinearGradient
          colors={[colors.primary + "05", colors.secondary + "02"]}
          style={styles.cardBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        <View style={styles.cardContent}>
          <LinearGradient
            colors={[category.color + "20", category.color + "10"]}
            style={styles.categoryIcon}
          >
            <Ionicons name={category.icon} size={26} color={category.color} />
          </LinearGradient>

          <View style={styles.categoryInfo}>
            <Text style={[styles.categoryTitle, { color: colors.text }]}>
              {category.title}
            </Text>
            <Text
              style={[
                styles.categoryDescription,
                { color: colors.textSecondary },
              ]}
            >
              {category.description}
            </Text>
          </View>

          <View style={styles.categoryRight}>
            {category.badge && category.badge > 0 && (
              <LinearGradient
                colors={[category.color, category.color + "80"]}
                style={styles.badge}
              >
                <Text style={styles.badgeText}>{category.badge}</Text>
              </LinearGradient>
            )}
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textSecondary}
            />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function SettingsScreen() {
  const router = useRouter();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme ?? "light"];
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
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
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Header avec gradient - sans icône */}
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

          <Text style={styles.headerTitle}>Paramètres</Text>

          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        {/* En-tête avec compteur */}
        <View style={styles.counterContainer}>
          <LinearGradient
            colors={[colors.primary + "20", colors.secondary + "10"]}
            style={styles.counterBadge}
          >
            <Ionicons name="settings" size={12} color={colors.primary} />
            <Text style={[styles.counterText, { color: colors.primary }]}>
              {CATEGORIES.length} options
            </Text>
          </LinearGradient>
        </View>

        {/* Liste des catégories */}
        {CATEGORIES.map((category, index) => (
          <CategoryCard
            key={category.id}
            category={category}
            colors={colors}
            onPress={() => router.push(category.route as any)}
            index={index}
          />
        ))}

        {/* Version de l'app */}
        <View style={styles.versionContainer}>
          <LinearGradient
            colors={[colors.primary + "10", colors.secondary + "05"]}
            style={styles.versionBadge}
          >
            <Ionicons
              name="code-outline"
              size={12}
              color={colors.textSecondary}
            />
            <Text style={[styles.versionText, { color: colors.textSecondary }]}>
              Kadima Road v1.0.0
            </Text>
          </LinearGradient>
        </View>

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
    flex: 1,
    textAlign: "center",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  counterContainer: {
    alignItems: "flex-end",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  counterBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  counterText: {
    fontSize: 12,
    fontWeight: "500",
  },
  cardWrapper: {
    marginBottom: 12,
  },
  categoryCard: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    position: "relative",
  },
  cardBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.5,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
  },
  categoryIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  categoryDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  categoryRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  versionContainer: {
    alignItems: "center",
    marginTop: 24,
    marginBottom: 20,
  },
  versionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  versionText: {
    fontSize: 11,
    fontWeight: "500",
  },
  bottomSpace: {
    height: 20,
  },
});
