// components/profile/MainVehicleCard.tsx - Version avec état vide amélioré

import React, { useRef, useEffect, useState } from "react";
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
import { useTheme } from "../../contexts/ThemeContext";
import { Colors } from "@/constants/theme";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");

interface MainVehicleCardProps {
  userDetails: any;
  onPress: () => void;
}

// Fonctions utilitaires
const getReliabilityColor = (score: number) => {
  if (score >= 80) return "#22C55E";
  if (score >= 60) return "#F59E0B";
  if (score >= 40) return "#F97316";
  if (score >= 20) return "#EF4444";
  return "#DC2626";
};

const getReliabilityText = (score: number) => {
  if (score >= 80) return "Excellente";
  if (score >= 60) return "Très bonne";
  if (score >= 40) return "Bonne";
  if (score >= 20) return "À surveiller";
  return "Critique";
};

const getReliabilityIcon = (score: number) => {
  if (score >= 80) return "shield-checkmark";
  if (score >= 60) return "shield-half";
  if (score >= 40) return "shield-outline";
  return "alert-circle";
};

const formatMileage = (mileage: number) => {
  if (mileage >= 1000) {
    return `${(mileage / 1000).toFixed(1)}k km`;
  }
  return `${mileage} km`;
};

export default function MainVehicleCard({
  userDetails,
  onPress,
}: MainVehicleCardProps) {
  const router = useRouter();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme ?? "light"];
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const defaultVehicle = userDetails?.vehicles?.find(
    (v: any) => v.isDefault === true
  );
  const firstVehicle = userDetails?.vehicles?.[0];
  const vehicle = defaultVehicle || firstVehicle;

  // Animation d'entrée
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
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

  const handleAddVehicle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/vehicles/add");
  };

  // ============================================
  // ÉTAT VIDE - AUCUN VÉHICULE
  // ============================================
  if (!vehicle) {
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
            <Ionicons name="star-outline" size={20} color={colors.primary} />
          </LinearGradient>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Véhicule principal
          </Text>
          <TouchableOpacity
            onPress={onPress}
            style={styles.chevronButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* État vide amélioré avec bouton d'action */}
        <View style={styles.emptyContainer}>
          <LinearGradient
            colors={[colors.primary + "15", colors.primary + "05"]}
            style={styles.emptyIcon}
          >
            <Ionicons name="car-outline" size={48} color={colors.primary} />
          </LinearGradient>

          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Aucun véhicule
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Ajoutez votre premier véhicule pour suivre son entretien
          </Text>

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={handleAddVehicle}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.addButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="add-outline" size={18} color="#fff" />
              <Text style={styles.addButtonText}>Ajouter un véhicule</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.cardFooter}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={[colors.primary + "15", colors.primary + "05"]}
            style={styles.footerGradient}
          >
            <Text style={[styles.footerText, { color: colors.primary }]}>
              Gérer mes véhicules
            </Text>
            <Ionicons name="arrow-forward" size={14} color={colors.primary} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // ============================================
  // ÉTAT AVEC VÉHICULE
  // ============================================

  const reliabilityScore = vehicle.aiProfile?.reliabilityScore || 100;
  const reliabilityColor = getReliabilityColor(reliabilityScore);
  const reliabilityText = getReliabilityText(reliabilityScore);
  const reliabilityIcon = getReliabilityIcon(reliabilityScore);
  const formattedMileage = formatMileage(vehicle.currentMileage || 0);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
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

      <TouchableOpacity
        style={styles.cardTouchable}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={styles.cardHeader}>
          <LinearGradient
            colors={[colors.primary + "20", colors.secondary + "10"]}
            style={styles.cardIcon}
          >
            <Ionicons name="star" size={18} color={colors.primary} />
          </LinearGradient>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Véhicule principal
          </Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textSecondary}
          />
        </View>

        <View style={styles.cardContent}>
          {/* Modèle et année */}
          <View style={styles.vehicleHeader}>
            <Text style={[styles.vehicleName, { color: colors.text }]}>
              {vehicle.make} {vehicle.model}
            </Text>
            <View
              style={[
                styles.yearBadge,
                { backgroundColor: colors.primary + "10" },
              ]}
            >
              <Text style={[styles.yearText, { color: colors.primary }]}>
                {vehicle.year}
              </Text>
            </View>
          </View>

          {/* Plaque et kilométrage */}
          <View style={styles.vehicleDetails}>
            <View style={styles.detailChip}>
              <Ionicons
                name="id-card-outline"
                size={14}
                color={colors.primary}
              />
              <Text
                style={[styles.detailText, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {vehicle.licensePlate}
              </Text>
            </View>
            <View style={styles.detailChip}>
              <Ionicons
                name="speedometer-outline"
                size={14}
                color={colors.primary}
              />
              <Text
                style={[styles.detailText, { color: colors.textSecondary }]}
              >
                {formattedMileage}
              </Text>
            </View>
          </View>

          {/* Barre de fiabilité */}
          <View style={styles.reliabilitySection}>
            <View style={styles.reliabilityHeader}>
              <View style={styles.reliabilityTitleContainer}>
                <Ionicons
                  name={reliabilityIcon}
                  size={14}
                  color={reliabilityColor}
                />
                <Text
                  style={[
                    styles.reliabilityLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  Fiabilité
                </Text>
              </View>
              <View style={styles.reliabilityScoreContainer}>
                <Text
                  style={[styles.reliabilityScore, { color: reliabilityColor }]}
                >
                  {reliabilityScore}%
                </Text>
                <View
                  style={[
                    styles.reliabilityBadge,
                    { backgroundColor: reliabilityColor + "15" },
                  ]}
                >
                  <Text
                    style={[
                      styles.reliabilityBadgeText,
                      { color: reliabilityColor },
                    ]}
                  >
                    {reliabilityText}
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={[
                styles.reliabilityBar,
                { backgroundColor: colors.border },
              ]}
            >
              <Animated.View
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

          {/* Suggestions d'entretien (si disponibles) */}
          {vehicle.aiProfile?.predictedMaintenance?.length > 0 && (
            <View style={styles.maintenancePreview}>
              <Ionicons
                name="calendar-outline"
                size={12}
                color={colors.warning}
              />
              <Text
                style={[styles.maintenanceText, { color: colors.warning }]}
                numberOfLines={1}
              >
                {vehicle.aiProfile.predictedMaintenance[0].description}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <LinearGradient
            colors={[colors.primary + "15", colors.primary + "05"]}
            style={styles.footerGradient}
          >
            <Text style={[styles.footerText, { color: colors.primary }]}>
              Voir les détails
            </Text>
            <Ionicons name="arrow-forward" size={14} color={colors.primary} />
          </LinearGradient>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
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
  cardTouchable: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    letterSpacing: -0.3,
  },
  chevronButton: {
    padding: 4,
  },
  cardContent: {
    gap: 14,
  },
  vehicleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  yearBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  yearText: {
    fontSize: 12,
    fontWeight: "600",
  },
  vehicleDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  detailChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.03)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  detailText: {
    fontSize: 13,
    fontWeight: "500",
  },
  reliabilitySection: {
    gap: 8,
    marginTop: 4,
  },
  reliabilityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reliabilityTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  reliabilityLabel: {
    fontSize: 12,
  },
  reliabilityScoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reliabilityScore: {
    fontSize: 14,
    fontWeight: "700",
  },
  reliabilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  reliabilityBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  reliabilityBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  reliabilityFill: {
    height: "100%",
    borderRadius: 3,
  },
  maintenancePreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  maintenanceText: {
    fontSize: 11,
    fontWeight: "500",
    flex: 1,
  },
  cardFooter: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    alignItems: "flex-end",
  },
  footerGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  footerText: {
    fontSize: 12,
    fontWeight: "500",
  },
  // État vide
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 20,
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
  emptySubtext: {
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  addButton: {
    marginTop: 8,
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  addButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
