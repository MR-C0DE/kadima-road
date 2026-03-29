// components/profile/QuickActions.tsx - Version avec confirmation déconnexion

import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../contexts/ThemeContext";
import { Colors } from "@/constants/theme";

const { width } = Dimensions.get("window");

interface QuickActionsProps {
  onLogout: () => void;
  notificationCount?: number;
}

interface ActionItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  color: string;
  badge?: string;
  badgeCount?: number;
}

const ACTIONS: ActionItem[] = [
  {
    id: "vehicles",
    title: "Mes véhicules",
    icon: "car-outline",
    route: "/vehicles",
    color: "#3B82F6",
  },
  {
    id: "settings",
    title: "Paramètres",
    icon: "settings-outline",
    route: "/settings",
    color: "#8B5CF6",
  },
  {
    id: "history",
    title: "Historique",
    icon: "time-outline",
    route: "/history",
    color: "#F59E0B",
  },
  {
    id: "emergency",
    title: "Contacts d'urgence",
    icon: "call-outline",
    route: "/settings/emergency",
    color: "#EF4444",
    badge: "URGENT",
  },
];

// Composant d'action individuel
const ActionButton = ({
  action,
  colors,
  index,
}: {
  action: ActionItem;
  colors: any;
  index: number;
}) => {
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 6,
        tension: 40,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.94,
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

  const handlePress = () => {
    router.push(action.route as any);
  };

  const isEmergency = action.id === "emergency";

  return (
    <Animated.View
      style={[
        styles.actionWrapper,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }, { translateY }],
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.actionCard, { backgroundColor: colors.surface }]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <LinearGradient
          colors={
            isEmergency
              ? [action.color + "20", action.color + "10"]
              : [colors.primary + "20", colors.secondary + "10"]
          }
          style={styles.actionIcon}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons
            name={action.icon}
            size={28}
            color={isEmergency ? action.color : colors.primary}
          />
        </LinearGradient>

        <Text style={[styles.actionLabel, { color: colors.text }]}>
          {action.title}
        </Text>

        {action.badge && (
          <LinearGradient
            colors={[action.color, action.color + "CC"]}
            style={styles.badge}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.badgeText}>{action.badge}</Text>
          </LinearGradient>
        )}

        {action.badgeCount && action.badgeCount > 0 && (
          <View style={[styles.countBadge, { backgroundColor: colors.error }]}>
            <Text style={styles.countBadgeText}>
              {action.badgeCount > 99 ? "99+" : action.badgeCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Composant de déconnexion avec confirmation
const LogoutButton = ({
  onLogout,
  colors,
}: {
  onLogout: () => void;
  colors: any;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: 400,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 6,
        tension: 40,
        delay: 400,
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  // ✅ CONFIRMATION AVANT DÉCONNEXION
  const handleLogoutPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      "Déconnexion",
      "Voulez-vous vraiment vous déconnecter ?",
      [
        {
          text: "Annuler",
          style: "cancel",
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
        },
        {
          text: "Se déconnecter",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onLogout();
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <Animated.View
      style={[
        styles.logoutWrapper,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }, { translateY }],
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: colors.error }]}
        onPress={handleLogoutPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <LinearGradient
          colors={[colors.error, colors.error + "CC"]}
          style={styles.logoutGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Ionicons name="log-out-outline" size={22} color="#fff" />
          <Text style={styles.logoutText}>Déconnexion</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function QuickActions({
  onLogout,
  notificationCount = 0,
}: QuickActionsProps) {
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme ?? "light"];
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const actionsWithCount = ACTIONS.map((action) => {
    if (action.id === "settings" && notificationCount > 0) {
      return { ...action, badgeCount: notificationCount };
    }
    return action;
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        },
      ]}
    >
      {/* Titre de section */}
      <View style={styles.sectionHeader}>
        <LinearGradient
          colors={[colors.primary + "20", colors.secondary + "10"]}
          style={styles.sectionIcon}
        >
          <Ionicons name="flash-outline" size={12} color={colors.primary} />
        </LinearGradient>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Actions rapides
        </Text>
      </View>

      {/* Grille 2x2 */}
      <View style={styles.grid}>
        {actionsWithCount.map((action, index) => (
          <ActionButton
            key={action.id}
            action={action}
            colors={colors}
            index={index}
          />
        ))}
      </View>

      {/* Bouton Déconnexion avec confirmation */}
      <LogoutButton onLogout={onLogout} colors={colors} />

      {/* Version de l'app */}
      <Text style={[styles.versionHint, { color: colors.textSecondary }]}>
        Moxtor v1.0.0
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
  },
  sectionIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionWrapper: {
    width: (width - 44) / 2,
  },
  actionCard: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 24,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    position: "relative",
  },
  actionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: -0.2,
  },
  badge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  countBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  countBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  logoutWrapper: {
    marginTop: 4,
  },
  logoutButton: {
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 10,
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  versionHint: {
    textAlign: "center",
    fontSize: 10,
    marginTop: 8,
    marginBottom: 4,
  },
});
