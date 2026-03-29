// components/vehicle/VehicleStats.tsx - Version avec animations d'entrée et design moderne

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import { useTheme } from "../../contexts/ThemeContext";
import { Colors } from "@/constants/theme";
import Toast from "react-native-toast-message";

const { width } = Dimensions.get("window");

interface VehicleStatsProps {
  vehicle: any;
  isCurrentOwner: boolean;
  onMileageUpdate: () => void;
  onAnalyze: () => void;
  onShare: () => void;
  onTransfer: () => void;
  isAnalyzing: boolean;
}

const getReliabilityColor = (score: number) => {
  if (score >= 80) return "#22C55E";
  if (score >= 60) return "#F59E0B";
  if (score >= 40) return "#F97316";
  if (score >= 20) return "#EF4444";
  return "#DC2626";
};

const getReliabilityIcon = (score: number) => {
  if (score >= 80) return "shield-checkmark";
  if (score >= 60) return "shield-half";
  if (score >= 40) return "shield-outline";
  return "alert-circle";
};

const getReliabilityText = (score: number) => {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Très bon";
  if (score >= 40) return "Bon";
  if (score >= 20) return "À surveiller";
  return "Critique";
};

const formatMileage = (mileage: number) => {
  if (mileage >= 1000) {
    return `${(mileage / 1000).toFixed(1)}k km`;
  }
  return `${mileage} km`;
};

export default function VehicleStats({
  vehicle,
  isCurrentOwner,
  onMileageUpdate,
  onAnalyze,
  onShare,
  onTransfer,
  isAnalyzing,
}: VehicleStatsProps) {
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme ?? "light"];
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const statsAnimations = useRef(
    [1, 2, 3].map(() => new Animated.Value(0))
  ).current;

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

    statsAnimations.forEach((anim, index) => {
      Animated.spring(anim, {
        toValue: 1,
        delay: 200 + index * 100,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const reliabilityScore = vehicle.aiProfile?.reliabilityScore || 100;
  const reliabilityColor = getReliabilityColor(reliabilityScore);
  const reliabilityIcon = getReliabilityIcon(reliabilityScore);
  const reliabilityText = getReliabilityText(reliabilityScore);

  const handlePlatePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("Plaque d'immatriculation", vehicle.licensePlate);
  };

  const handleCopyPlate = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(vehicle.licensePlate);
    Toast.show({
      type: "success",
      text1: "Copié !",
      text2: `La plaque ${vehicle.licensePlate} a été copiée`,
      position: "bottom",
      visibilityTime: 2000,
    });
  };

  const handleAnalyze = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAnalyze();
  };

  const handleShare = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onShare();
  };

  const handleTransfer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onTransfer();
  };

  const handleMileageUpdate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onMileageUpdate();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Plaque d'immatriculation */}
      <TouchableOpacity
        style={[styles.plateCard, { backgroundColor: colors.surface }]}
        onPress={handlePlatePress}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={[colors.primary + "10", colors.secondary + "05"]}
          style={styles.plateGradient}
        >
          <View style={styles.plateContent}>
            <View style={styles.plateIconContainer}>
              <Ionicons name="car-outline" size={16} color={colors.primary} />
            </View>
            <Text style={[styles.plateLabel, { color: colors.textSecondary }]}>
              Plaque d'immatriculation
            </Text>
          </View>
          <View style={styles.plateValueContainer}>
            <Text style={[styles.plateText, { color: colors.text }]}>
              {vehicle.licensePlate}
            </Text>
            <TouchableOpacity
              onPress={handleCopyPlate}
              style={styles.copyButton}
            >
              <Ionicons
                name="copy-outline"
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {/* Kilométrage */}
        <Animated.View
          style={[
            styles.statCard,
            { backgroundColor: colors.surface },
            {
              transform: [{ scale: statsAnimations[0] }],
              opacity: statsAnimations[0],
            },
          ]}
        >
          <View style={styles.statIconWrapper}>
            <LinearGradient
              colors={[colors.primary + "20", colors.primary + "05"]}
              style={styles.statIconBg}
            >
              <Ionicons
                name="speedometer-outline"
                size={28}
                color={colors.primary}
              />
            </LinearGradient>
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {formatMileage(vehicle.currentMileage)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Kilométrage
          </Text>
          {isCurrentOwner && (
            <TouchableOpacity
              onPress={handleMileageUpdate}
              style={styles.editIcon}
            >
              <Ionicons
                name="create-outline"
                size={14}
                color={colors.primary}
              />
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Année */}
        <Animated.View
          style={[
            styles.statCard,
            { backgroundColor: colors.surface },
            {
              transform: [{ scale: statsAnimations[1] }],
              opacity: statsAnimations[1],
            },
          ]}
        >
          <View style={styles.statIconWrapper}>
            <LinearGradient
              colors={[colors.primary + "20", colors.primary + "05"]}
              style={styles.statIconBg}
            >
              <Ionicons
                name="calendar-outline"
                size={28}
                color={colors.primary}
              />
            </LinearGradient>
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {vehicle.year}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Année
          </Text>
        </Animated.View>
      </View>

      {/* Fiabilité - Carte pleine largeur */}
      <Animated.View
        style={[
          styles.reliabilityCard,
          { backgroundColor: colors.surface },
          {
            transform: [{ scale: statsAnimations[2] }],
            opacity: statsAnimations[2],
          },
        ]}
      >
        <View style={styles.reliabilityHeader}>
          <View style={styles.reliabilityIconContainer}>
            <LinearGradient
              colors={[reliabilityColor + "20", reliabilityColor + "05"]}
              style={[
                styles.reliabilityIconBg,
                { backgroundColor: reliabilityColor + "10" },
              ]}
            >
              <Ionicons
                name={reliabilityIcon}
                size={32}
                color={reliabilityColor}
              />
            </LinearGradient>
          </View>
          <View style={styles.reliabilityInfo}>
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
          <TouchableOpacity
            onPress={handleAnalyze}
            disabled={isAnalyzing}
            style={[
              styles.analyzeButton,
              { backgroundColor: colors.primary + "10" },
            ]}
          >
            {isAnalyzing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Ionicons
                  name="flash-outline"
                  size={14}
                  color={colors.primary}
                />
                <Text style={[styles.analyzeText, { color: colors.primary }]}>
                  IA
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.reliabilityBarContainer}>
          <View
            style={[styles.reliabilityBar, { backgroundColor: colors.border }]}
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
          <Text
            style={[styles.reliabilityHint, { color: colors.textSecondary }]}
          >
            Score basé sur l'historique d'entretien
          </Text>
        </View>
      </Animated.View>

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.surface }]}
          onPress={handleShare}
          activeOpacity={0.7}
        >
          <Ionicons name="share-outline" size={20} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.primary }]}>
            Partager
          </Text>
        </TouchableOpacity>

        {isCurrentOwner && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.surface }]}
            onPress={handleTransfer}
            activeOpacity={0.7}
          >
            <Ionicons
              name="swap-horizontal-outline"
              size={20}
              color={colors.warning}
            />
            <Text style={[styles.actionText, { color: colors.warning }]}>
              Transférer
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    marginBottom: 16,
  },
  // Plaque
  plateCard: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  plateGradient: {
    padding: 16,
  },
  plateContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  plateIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.03)",
    justifyContent: "center",
    alignItems: "center",
  },
  plateLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  plateValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  plateText: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 1,
  },
  copyButton: {
    padding: 4,
  },
  // Stats Grid
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    width: (width - 44) / 2,
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconWrapper: {
    marginBottom: 12,
  },
  statIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  editIcon: {
    position: "absolute",
    top: 12,
    right: 12,
  },
  // Fiabilité
  reliabilityCard: {
    width: "100%",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  reliabilityHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  reliabilityIconContainer: {
    marginRight: 16,
  },
  reliabilityIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  reliabilityInfo: {
    flex: 1,
  },
  reliabilityScore: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  reliabilityBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  reliabilityBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  analyzeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 25,
  },
  analyzeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  reliabilityBarContainer: {
    gap: 8,
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
  reliabilityHint: {
    fontSize: 10,
    textAlign: "center",
  },
  // Actions
  actionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
