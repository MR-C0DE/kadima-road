// components/profile/ProfileHeader.tsx - Version sans rotation

import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useTheme } from "../../contexts/ThemeContext";
import { Colors } from "@/constants/theme";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");

interface ProfileHeaderProps {
  userDetails: any;
  uploadingPhoto: boolean;
  onPhotoPress: () => void;
  totalDistance?: number;
  badges?: Array<{ icon: string; label: string; color: string }>;
}

// Composant Skeleton pour le header
const HeaderSkeleton = ({ colors }: { colors: any }) => (
  <View style={[styles.skeletonHeader, { backgroundColor: colors.primary }]}>
    <View style={styles.skeletonAvatar}>
      <View
        style={[styles.skeletonAvatarInner, { backgroundColor: colors.border }]}
      />
    </View>
    <View
      style={[
        styles.skeletonLine,
        { backgroundColor: colors.border, width: 180, marginTop: 16 },
      ]}
    />
    <View
      style={[
        styles.skeletonLine,
        { backgroundColor: colors.border, width: 140, marginTop: 8 },
      ]}
    />
    <View style={styles.skeletonStats}>
      <View style={[styles.skeletonStat, { backgroundColor: colors.border }]} />
      <View style={[styles.skeletonStat, { backgroundColor: colors.border }]} />
      <View style={[styles.skeletonStat, { backgroundColor: colors.border }]} />
    </View>
  </View>
);

// Composant Badge individuel
const Badge = ({
  icon,
  label,
  color,
}: {
  icon: string;
  label: string;
  color: string;
}) => (
  <View style={[styles.badge, { backgroundColor: color + "20" }]}>
    <Ionicons name={icon as any} size={12} color={color} />
    <Text style={[styles.badgeText, { color }]}>{label}</Text>
  </View>
);

// Composant Statistique avec animation d'entrée
const StatItem = ({
  value,
  label,
  icon,
  iconColor,
  delay = 0,
}: {
  value: string | number;
  label: string;
  icon: string;
  iconColor: string;
  delay?: number;
}) => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        delay,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.statItem,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View
        style={[
          styles.statIconContainer,
          { backgroundColor: iconColor + "20" },
        ]}
      >
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <Text style={[styles.statValue, { color: "#fff" }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: "#fff", opacity: 0.8 }]}>
        {label}
      </Text>
    </Animated.View>
  );
};

export default function ProfileHeader({
  userDetails,
  uploadingPhoto,
  onPhotoPress,
  totalDistance = 0,
  badges = [],
}: ProfileHeaderProps) {
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme ?? "light"];

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Formatage des valeurs
  const formatDistance = (distance: number) => {
    if (distance >= 1000) {
      return `${(distance / 1000).toFixed(1)}k km`;
    }
    return `${distance} km`;
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("fr-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Date inconnue";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  };

  // Récupération des données
  const firstName = userDetails?.firstName || "Conducteur";
  const lastName = userDetails?.lastName || "";
  const email = userDetails?.email || "";
  const photo = userDetails?.photo;
  const isHelper = userDetails?.isHelper || false;

  const stats = userDetails?.stats || {};
  const completedInterventions =
    stats.completedInterventions || stats.interventionsAsUser || 0;
  const totalSpent = stats.totalSpent || 0;
  const averageRating = stats.averageRating || stats.rating || 5.0;
  const memberSince = stats.memberSince || userDetails?.createdAt;

  // Animation de pulsation pour l'avatar (optionnel, mais discret)
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  if (uploadingPhoto) {
    return <HeaderSkeleton colors={colors} />;
  }

  return (
    <LinearGradient
      colors={[colors.primary, colors.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.headerGradient}
    >
      <View style={styles.headerContent}>
        {/* Avatar avec effet de pulsation (discret) */}
        <TouchableOpacity
          onPress={onPhotoPress}
          disabled={uploadingPhoto}
          activeOpacity={0.9}
        >
          <Animated.View
            style={[
              styles.avatarContainer,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            {photo ? (
              <Image
                source={{ uri: photo }}
                style={styles.avatarImage}
                contentFit="cover"
              />
            ) : (
              <LinearGradient
                colors={["#FFFFFF", "#F0F0F0"]}
                style={styles.avatarGradient}
              >
                <Text style={[styles.avatarText, { color: colors.primary }]}>
                  {firstName?.[0]}
                  {lastName?.[0]}
                </Text>
              </LinearGradient>
            )}
            <View
              style={[styles.editBadge, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </Animated.View>
        </TouchableOpacity>

        {/* Nom et email */}
        <Text style={[styles.userName, { color: "#fff" }]}>
          {firstName} {lastName}
        </Text>
        <Text style={[styles.userEmail, { color: "#fff", opacity: 0.9 }]}>
          {email}
        </Text>

        {/* Badges */}
        {badges.length > 0 && (
          <Animated.View
            style={[styles.badgesContainer, { opacity: fadeAnim }]}
          >
            {badges.map((badge, index) => (
              <Badge
                key={index}
                icon={badge.icon}
                label={badge.label}
                color={badge.color}
              />
            ))}
          </Animated.View>
        )}

        {/* Statistiques principales - 3 colonnes */}
        <Animated.View style={[styles.statsRow, { opacity: fadeAnim }]}>
          <StatItem
            value={completedInterventions}
            label="Interventions"
            icon="construct-outline"
            iconColor="#fff"
            delay={100}
          />
          <StatItem
            value={formatDistance(totalDistance)}
            label="Parcourus"
            icon="speedometer-outline"
            iconColor="#fff"
            delay={200}
          />
          <StatItem
            value={averageRating.toFixed(1)}
            label="Note"
            icon="star-outline"
            iconColor="#FFD700"
            delay={300}
          />
        </Animated.View>

        {/* Statistiques secondaires - 2 colonnes */}
        <Animated.View style={[styles.secondaryStats, { opacity: fadeAnim }]}>
          <View style={styles.secondaryStat}>
            <Ionicons name="cash-outline" size={16} color="#fff" />
            <Text style={styles.secondaryStatValue}>
              {formatMoney(totalSpent)}
            </Text>
            <Text style={styles.secondaryStatLabel}>Dépensé</Text>
          </View>
          <View style={styles.statDividerSmall} />
          <View style={styles.secondaryStat}>
            <Ionicons name="calendar-outline" size={16} color="#fff" />
            <Text style={styles.secondaryStatValue}>
              {formatDate(memberSince).split(" ")[0]}
            </Text>
            <Text style={styles.secondaryStatLabel}>Membre depuis</Text>
          </View>
        </Animated.View>

        {/* Badge Helper certifié si applicable */}
        {isHelper && (
          <Animated.View style={[styles.helperBadge, { opacity: fadeAnim }]}>
            <LinearGradient
              colors={["rgba(255,255,255,0.2)", "rgba(255,255,255,0.1)"]}
              style={styles.helperBadgeGradient}
            >
              <Ionicons name="checkmark-circle" size={16} color="#fff" />
              <Text style={styles.helperBadgeText}>Helper certifié</Text>
            </LinearGradient>
          </Animated.View>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 24,
    marginBottom: 8,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  // Avatar
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    position: "relative",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "bold",
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
    textAlign: "center",
  },
  userEmail: {
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 12,
    textAlign: "center",
  },
  // Badges
  badgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  // Statistiques
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  // Statistiques secondaires
  secondaryStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    marginTop: 4,
  },
  secondaryStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  secondaryStatValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
  secondaryStatLabel: {
    fontSize: 10,
    color: "#fff",
    opacity: 0.8,
  },
  statDividerSmall: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  // Badge Helper
  helperBadge: {
    marginTop: 12,
  },
  helperBadgeGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  helperBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  // Skeleton
  skeletonHeader: {
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  skeletonAvatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: "center",
    alignItems: "center",
  },
  skeletonAvatarInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  skeletonLine: {
    height: 16,
    borderRadius: 8,
  },
  skeletonStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "80%",
    marginTop: 20,
  },
  skeletonStat: {
    width: 60,
    height: 40,
    borderRadius: 12,
  },
});
