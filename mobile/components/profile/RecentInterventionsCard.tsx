// components/profile/RecentInterventionsCard.tsx - Version améliorée

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
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../contexts/ThemeContext";
import { Colors } from "@/constants/theme";

const { width } = Dimensions.get("window");

interface Intervention {
  _id: string;
  type: string;
  status: string;
  createdAt: string;
  problem?: { description: string; category?: string };
  pricing?: { final?: number };
  helper?: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

interface RecentInterventionsCardProps {
  interventions: Intervention[];
}

// Formatage de la date intelligent
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
};

// Configuration des statuts
const getStatusConfig = (status: string, colors: any) => {
  switch (status) {
    case "completed":
      return {
        color: colors.success,
        bgColor: colors.success + "15",
        text: "Terminée",
        icon: "checkmark-circle",
      };
    case "pending":
      return {
        color: colors.warning,
        bgColor: colors.warning + "15",
        text: "En attente",
        icon: "time",
      };
    case "cancelled":
      return {
        color: colors.error,
        bgColor: colors.error + "15",
        text: "Annulée",
        icon: "close-circle",
      };
    case "accepted":
      return {
        color: colors.info,
        bgColor: colors.info + "15",
        text: "Acceptée",
        icon: "checkmark-circle",
      };
    case "en_route":
      return {
        color: colors.accent,
        bgColor: colors.accent + "15",
        text: "En route",
        icon: "car",
      };
    default:
      return {
        color: colors.primary,
        bgColor: colors.primary + "15",
        text: "En cours",
        icon: "car",
      };
  }
};

// Configuration des types
const getTypeConfig = (type: string, colors: any) => {
  switch (type) {
    case "sos":
      return {
        icon: "alert-circle",
        label: "SOS Urgence",
        gradient: [colors.error, colors.error + "80"],
      };
    case "diagnostic":
      return {
        icon: "medkit",
        label: "Diagnostic IA",
        gradient: [colors.accent, colors.primary],
      };
    case "assistance":
      return {
        icon: "construct",
        label: "Assistance",
        gradient: [colors.primary, colors.secondary],
      };
    default:
      return {
        icon: "car",
        label: "Intervention",
        gradient: [colors.primary, colors.secondary],
      };
  }
};

// Composant d'intervention individuelle avec animation
const InterventionItem = ({
  intervention,
  colors,
  onPress,
  index,
}: {
  intervention: Intervention;
  colors: any;
  onPress: () => void;
  index: number;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const statusConfig = getStatusConfig(intervention.status, colors);
  const typeConfig = getTypeConfig(intervention.type, colors);
  const isSOS = intervention.type === "sos";
  const dateFormatted = formatDate(intervention.createdAt);

  // Animation d'entrée
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
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
      toValue: 0.98,
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
        styles.interventionWrapper,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }, { translateX }],
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.interventionItem, { backgroundColor: colors.surface }]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {/* Icône avec dégradé */}
        <LinearGradient
          colors={typeConfig.gradient}
          style={styles.interventionIcon}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name={typeConfig.icon} size={22} color="#fff" />
        </LinearGradient>

        <View style={styles.interventionInfo}>
          <View style={styles.interventionHeader}>
            <View style={styles.typeContainer}>
              <Text style={[styles.interventionType, { color: colors.text }]}>
                {typeConfig.label}
              </Text>
              {isSOS && (
                <View
                  style={[
                    styles.sosBadge,
                    { backgroundColor: colors.error + "15" },
                  ]}
                >
                  <Text style={[styles.sosBadgeText, { color: colors.error }]}>
                    URGENT
                  </Text>
                </View>
              )}
            </View>

            {/* Badge de statut amélioré */}
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusConfig.bgColor },
              ]}
            >
              <Ionicons
                name={statusConfig.icon}
                size={10}
                color={statusConfig.color}
              />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.text}
              </Text>
            </View>
          </View>

          {/* Description avec troncature intelligente */}
          <Text
            style={[
              styles.interventionDescription,
              { color: colors.textSecondary },
            ]}
            numberOfLines={2}
          >
            {intervention.problem?.description ||
              intervention.problem?.category ||
              "Intervention sans description"}
          </Text>

          {/* Footer avec date, helper et prix */}
          <View style={styles.interventionFooter}>
            <View style={styles.footerLeft}>
              <View style={styles.dateContainer}>
                <Ionicons
                  name="calendar-outline"
                  size={10}
                  color={colors.textSecondary}
                />
                <Text
                  style={[
                    styles.interventionDate,
                    { color: colors.textSecondary },
                  ]}
                >
                  {dateFormatted}
                </Text>
              </View>

              {intervention.helper && (
                <View style={styles.helperContainer}>
                  <Ionicons
                    name="person-outline"
                    size={10}
                    color={colors.textSecondary}
                  />
                  <Text
                    style={[styles.helperName, { color: colors.textSecondary }]}
                  >
                    {intervention.helper.user.firstName}{" "}
                    {intervention.helper.user.lastName}
                  </Text>
                </View>
              )}
            </View>

            {intervention.pricing?.final && (
              <View
                style={[
                  styles.priceBadge,
                  { backgroundColor: colors.success + "10" },
                ]}
              >
                <Ionicons
                  name="cash-outline"
                  size={12}
                  color={colors.success}
                />
                <Text style={[styles.priceText, { color: colors.success }]}>
                  ${intervention.pricing.final.toFixed(2)}
                </Text>
              </View>
            )}
          </View>
        </View>

        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.textSecondary}
          style={styles.chevron}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function RecentInterventionsCard({
  interventions,
}: RecentInterventionsCardProps) {
  const router = useRouter();
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

  const hasInterventions = interventions && interventions.length > 0;
  const visibleInterventions = hasInterventions
    ? interventions.slice(0, 3)
    : [];

  const handleSeeAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/history");
  };

  const handleSOS = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/sos");
  };

  // ============================================
  // ÉTAT VIDE
  // ============================================
  if (!hasInterventions) {
    return (
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
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
        <LinearGradient
          colors={[colors.primary + "05", colors.secondary + "02"]}
          style={styles.cardBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        <View style={styles.cardHeader}>
          <LinearGradient
            colors={[colors.primary + "20", colors.secondary + "10"]}
            style={styles.cardIcon}
          >
            <Ionicons name="time-outline" size={18} color={colors.primary} />
          </LinearGradient>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Dernières interventions
          </Text>
        </View>

        {/* État vide amélioré avec bouton SOS */}
        <View style={styles.emptyContainer}>
          <LinearGradient
            colors={[colors.primary + "15", colors.primary + "05"]}
            style={styles.emptyIcon}
          >
            <Ionicons name="time-outline" size={42} color={colors.primary} />
          </LinearGradient>

          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Aucune intervention
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Utilisez SOS ou Diagnostic pour commencer
          </Text>

          <TouchableOpacity
            style={[styles.sosButton, { backgroundColor: colors.error }]}
            onPress={handleSOS}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.error, colors.error + "CC"]}
              style={styles.sosGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="alert-circle" size={18} color="#fff" />
              <Text style={styles.sosButtonText}>SOS Urgence</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }

  // ============================================
  // ÉTAT AVEC INTERVENTIONS
  // ============================================
  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
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
      <LinearGradient
        colors={[colors.primary + "05", colors.secondary + "02"]}
        style={styles.cardBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* En-tête avec compteur */}
      <View style={styles.cardHeader}>
        <LinearGradient
          colors={[colors.primary + "20", colors.secondary + "10"]}
          style={styles.cardIcon}
        >
          <Ionicons name="time-outline" size={18} color={colors.primary} />
        </LinearGradient>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          Dernières interventions
        </Text>
        <View
          style={[
            styles.countBadge,
            { backgroundColor: colors.primary + "15" },
          ]}
        >
          <Text style={[styles.countText, { color: colors.primary }]}>
            {interventions.length}
          </Text>
        </View>
      </View>

      {/* Liste des interventions */}
      <View style={styles.interventionsList}>
        {visibleInterventions.map((intervention, index) => (
          <InterventionItem
            key={intervention._id}
            intervention={intervention}
            colors={colors}
            onPress={() => router.push(`/interventions/${intervention._id}`)}
            index={index}
          />
        ))}
      </View>

      {/* Bouton Voir tout */}
      {interventions.length > 3 && (
        <TouchableOpacity
          style={styles.seeAllButton}
          onPress={handleSeeAll}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={[colors.primary + "15", colors.primary + "05"]}
            style={styles.seeAllGradient}
          >
            <Text style={[styles.seeAllText, { color: colors.primary }]}>
              Voir toutes les interventions
            </Text>
            <Ionicons name="arrow-forward" size={14} color={colors.primary} />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 20,
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
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    letterSpacing: -0.3,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  countText: {
    fontSize: 12,
    fontWeight: "600",
  },
  interventionsList: {
    gap: 12,
  },
  interventionWrapper: {
    marginBottom: 0,
  },
  interventionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 20,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  interventionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  interventionInfo: {
    flex: 1,
  },
  interventionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  typeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  interventionType: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  sosBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  sosBadgeText: {
    fontSize: 8,
    fontWeight: "700",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "600",
  },
  interventionDescription: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  interventionFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  interventionDate: {
    fontSize: 10,
  },
  helperContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  helperName: {
    fontSize: 10,
  },
  priceBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  priceText: {
    fontSize: 10,
    fontWeight: "600",
  },
  chevron: {
    marginLeft: 4,
  },
  seeAllButton: {
    marginTop: 12,
    alignItems: "flex-end",
  },
  seeAllGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: "500",
  },
  // État vide
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
    gap: 12,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 13,
    textAlign: "center",
  },
  sosButton: {
    marginTop: 8,
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  sosGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },
  sosButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
