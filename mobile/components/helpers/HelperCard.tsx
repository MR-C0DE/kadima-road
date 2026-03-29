// components/helpers/HelperCard.tsx

import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");

interface HelperCardProps {
  helper: any;
  colors: any;
  onPress: () => void;
  index: number;
}

// Fonctions utilitaires
const formatDistance = (distance: number) => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }
  return `${distance.toFixed(1)} km`;
};

const getAvailabilityColor = (isAvailable: boolean) => {
  return isAvailable ? "#22C55E" : "#EF4444";
};

const getAvailabilityText = (isAvailable: boolean) => {
  return isAvailable ? "Disponible" : "Indisponible";
};

const getReliabilityColor = (score: number) => {
  if (score >= 80) return "#22C55E";
  if (score >= 60) return "#F59E0B";
  if (score >= 40) return "#F97316";
  return "#EF4444";
};

export default function HelperCard({
  helper,
  colors,
  onPress,
  index,
}: HelperCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.spring(translateX, {
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

  const firstName = helper.user?.firstName || "Helper";
  const lastName = helper.user?.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim();
  const distance = helper.distance || 0;
  const rating = helper.stats?.averageRating || 5.0;
  const completedInterventions = helper.stats?.completedInterventions || 0;
  const responseTime = helper.stats?.averageResponseTime || 5;
  const basePrice = helper.pricing?.basePrice || 25;
  const perKm = helper.pricing?.perKm || 1;
  const estimatedPrice = basePrice + perKm * distance;
  const isAvailable = helper.availability?.isAvailable ?? true;
  const availabilityColor = getAvailabilityColor(isAvailable);
  const reliabilityScore = helper.aiProfile?.reliabilityScore || 85;
  const reliabilityColor = getReliabilityColor(reliabilityScore);

  // Services avec icônes
  const serviceIcons: Record<string, { icon: string; label: string }> = {
    battery: { icon: "battery-dead", label: "Batterie" },
    tire: { icon: "car-sport", label: "Pneu" },
    fuel: { icon: "water", label: "Essence" },
    engine: { icon: "cog", label: "Moteur" },
    towing: { icon: "car", label: "Remorquage" },
    lockout: { icon: "key", label: "Clés" },
    jumpstart: { icon: "flash", label: "Démarrage" },
  };

  const displayServices = helper.services?.slice(0, 3) || [];

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
        style={[styles.card, { backgroundColor: colors.surface }]}
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

        {/* En-tête avec avatar et disponibilité */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>
                {firstName[0]}
                {lastName[0] || firstName[1] || "H"}
              </Text>
            </LinearGradient>
            <View
              style={[
                styles.availabilityDot,
                { backgroundColor: availabilityColor },
              ]}
            />
          </View>

          <View style={styles.headerInfo}>
            <View style={styles.nameRow}>
              <Text
                style={[styles.name, { color: colors.text }]}
                numberOfLines={1}
              >
                {fullName}
              </Text>
              <View
                style={[
                  styles.availabilityBadge,
                  { backgroundColor: availabilityColor + "15" },
                ]}
              >
                <Text
                  style={[
                    styles.availabilityText,
                    { color: availabilityColor },
                  ]}
                >
                  {getAvailabilityText(isAvailable)}
                </Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="star" size={14} color="#FFD700" />
                <Text
                  style={[styles.statText, { color: colors.textSecondary }]}
                >
                  {rating.toFixed(1)}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color={colors.success}
                />
                <Text
                  style={[styles.statText, { color: colors.textSecondary }]}
                >
                  {completedInterventions}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="time" size={14} color={colors.warning} />
                <Text
                  style={[styles.statText, { color: colors.textSecondary }]}
                >
                  {responseTime} min
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.distanceContainer}>
            <Ionicons name="location" size={14} color={colors.primary} />
            <Text
              style={[styles.distanceText, { color: colors.textSecondary }]}
            >
              {formatDistance(distance)}
            </Text>
          </View>
        </View>

        {/* Services */}
        {displayServices.length > 0 && (
          <View style={styles.servicesContainer}>
            {displayServices.map((service: string) => {
              const serviceInfo = serviceIcons[service] || {
                icon: "help-circle",
                label: service,
              };
              return (
                <View
                  key={service}
                  style={[
                    styles.serviceTag,
                    { backgroundColor: colors.primary + "10" },
                  ]}
                >
                  <Ionicons
                    name={serviceInfo.icon as any}
                    size={12}
                    color={colors.primary}
                  />
                  <Text style={[styles.serviceText, { color: colors.primary }]}>
                    {serviceInfo.label}
                  </Text>
                </View>
              );
            })}
            {helper.services?.length > 3 && (
              <Text
                style={[styles.moreServices, { color: colors.textSecondary }]}
              >
                +{helper.services.length - 3}
              </Text>
            )}
          </View>
        )}

        {/* Prix et fiabilité */}
        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>
              Estimation
            </Text>
            <Text style={[styles.priceValue, { color: colors.success }]}>
              ${Math.round(estimatedPrice)}
            </Text>
            <Text style={[styles.priceUnit, { color: colors.textSecondary }]}>
              CAD
            </Text>
          </View>

          <View style={styles.reliabilityContainer}>
            <View style={styles.reliabilityHeader}>
              <Ionicons
                name="shield-checkmark"
                size={12}
                color={reliabilityColor}
              />
              <Text
                style={[styles.reliabilityText, { color: reliabilityColor }]}
              >
                {reliabilityScore}%
              </Text>
            </View>
            <View
              style={[
                styles.reliabilityBar,
                { backgroundColor: colors.border },
              ]}
            >
              <View
                style={[
                  styles.reliabilityFill,
                  {
                    backgroundColor: reliabilityColor,
                    width: `${reliabilityScore}%`,
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Bouton d'action */}
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={onPress}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.actionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="chatbubble-outline" size={18} color="#fff" />
            <Text style={styles.actionText}>Demander de l'aide</Text>
          </LinearGradient>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 12,
  },
  card: {
    borderRadius: 24,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    position: "relative",
    overflow: "hidden",
  },
  cardBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.5,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  availabilityDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#fff",
  },
  headerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  availabilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  availabilityText: {
    fontSize: 10,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: "500",
  },
  statDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  distanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.03)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: "500",
  },
  servicesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  serviceTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  serviceText: {
    fontSize: 11,
    fontWeight: "500",
  },
  moreServices: {
    fontSize: 11,
    fontWeight: "500",
    marginLeft: 4,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  priceLabel: {
    fontSize: 11,
    marginRight: 4,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  priceUnit: {
    fontSize: 11,
    marginLeft: 2,
  },
  reliabilityContainer: {
    flex: 1,
    marginLeft: 12,
  },
  reliabilityHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  reliabilityText: {
    fontSize: 10,
    fontWeight: "600",
  },
  reliabilityBar: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  reliabilityFill: {
    height: "100%",
    borderRadius: 2,
  },
  actionButton: {
    borderRadius: 30,
    overflow: "hidden",
  },
  actionGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  actionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
