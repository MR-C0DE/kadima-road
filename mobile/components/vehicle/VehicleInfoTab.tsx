// components/vehicle/VehicleInfoTab.tsx - Version avec valeurs par défaut sécurisées

import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, Dimensions, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../contexts/ThemeContext";
import { Colors } from "@/constants/theme";

const { width } = Dimensions.get("window");

interface VehicleInfoTabProps {
  vehicle: any;
}

export default function VehicleInfoTab({ vehicle }: VehicleInfoTabProps) {
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

  const formatMileage = (mileage: number) => {
    if (mileage >= 1000) {
      return `${(mileage / 1000).toFixed(1)}k km`;
    }
    return `${mileage} km`;
  };

  // Valeurs par défaut sécurisées
  const commonIssues = vehicle?.aiProfile?.commonIssues || [];
  const predictedMaintenance = vehicle?.aiProfile?.predictedMaintenance || [];

  return (
    <Animated.View
      style={[
        styles.card,
        { backgroundColor: colors.surface },
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={[colors.primary + "05", colors.secondary + "02"]}
        style={styles.cardBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Problèmes récurrents */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <LinearGradient
            colors={[colors.warning + "20", colors.warning + "10"]}
            style={styles.sectionIcon}
          >
            <Ionicons name="warning-outline" size={18} color={colors.warning} />
          </LinearGradient>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Problèmes récurrents
          </Text>
          {commonIssues.length > 0 && (
            <View
              style={[
                styles.countBadge,
                { backgroundColor: colors.warning + "15" },
              ]}
            >
              <Text style={[styles.countText, { color: colors.warning }]}>
                {commonIssues.length}
              </Text>
            </View>
          )}
        </View>

        {commonIssues.length > 0 ? (
          <View style={styles.issuesList}>
            {commonIssues.map((issue: any, index: number) => (
              <View key={index} style={styles.issueCard}>
                <View style={styles.issueHeader}>
                  <LinearGradient
                    colors={[colors.warning + "20", colors.warning + "10"]}
                    style={styles.issueIcon}
                  >
                    <Ionicons
                      name="alert-circle-outline"
                      size={16}
                      color={colors.warning}
                    />
                  </LinearGradient>
                  <Text
                    style={[styles.issueText, { color: colors.text }]}
                    numberOfLines={2}
                  >
                    {issue.issue}
                  </Text>
                  <View
                    style={[
                      styles.issueCount,
                      { backgroundColor: colors.warning + "15" },
                    ]}
                  >
                    <Text
                      style={[styles.issueCountText, { color: colors.warning }]}
                    >
                      {issue.count}x
                    </Text>
                  </View>
                </View>
                <Text
                  style={[styles.issueDate, { color: colors.textSecondary }]}
                >
                  Dernière occurrence :{" "}
                  {issue.lastOccurrence
                    ? new Date(issue.lastOccurrence).toLocaleDateString()
                    : "Date inconnue"}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <LinearGradient
              colors={[colors.success + "15", colors.success + "05"]}
              style={styles.emptyIcon}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={28}
                color={colors.success}
              />
            </LinearGradient>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Aucun problème récurrent
            </Text>
            <Text
              style={[styles.emptySubtext, { color: colors.textSecondary }]}
            >
              Votre véhicule semble en bonne santé
            </Text>
          </View>
        )}
      </View>

      {/* Maintenance prédite */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <LinearGradient
            colors={[colors.primary + "20", colors.primary + "10"]}
            style={styles.sectionIcon}
          >
            <Ionicons
              name="calendar-outline"
              size={18}
              color={colors.primary}
            />
          </LinearGradient>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Maintenance prédite
          </Text>
          {predictedMaintenance.length > 0 && (
            <View
              style={[
                styles.countBadge,
                { backgroundColor: colors.primary + "15" },
              ]}
            >
              <Text style={[styles.countText, { color: colors.primary }]}>
                {predictedMaintenance.length}
              </Text>
            </View>
          )}
        </View>

        {predictedMaintenance.length > 0 ? (
          <View style={styles.maintenanceList}>
            {predictedMaintenance.map((item: any, index: number) => (
              <View key={index} style={styles.maintenanceCard}>
                <View style={styles.maintenanceHeader}>
                  <LinearGradient
                    colors={[colors.primary + "20", colors.primary + "10"]}
                    style={styles.maintenanceIcon}
                  >
                    <Ionicons
                      name="construct-outline"
                      size={16}
                      color={colors.primary}
                    />
                  </LinearGradient>
                  <View style={styles.maintenanceInfo}>
                    <Text
                      style={[styles.maintenanceTitle, { color: colors.text }]}
                    >
                      {item.description}
                    </Text>
                    <View style={styles.maintenanceMeta}>
                      <View style={styles.metaItem}>
                        <Ionicons
                          name="speedometer-outline"
                          size={12}
                          color={colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.metaText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {formatMileage(item.predictedMileage)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.confidenceBadge,
                      { backgroundColor: colors.primary + "10" },
                    ]}
                  >
                    <Text
                      style={[styles.confidenceText, { color: colors.primary }]}
                    >
                      {item.confidence}%
                    </Text>
                  </View>
                </View>
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      { backgroundColor: colors.border },
                    ]}
                  >
                    <View
                      style={[
                        styles.progressFill,
                        {
                          backgroundColor: colors.primary,
                          width: `${item.confidence}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.confidenceLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Niveau de confiance
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <LinearGradient
              colors={[colors.primary + "15", colors.primary + "05"]}
              style={styles.emptyIcon}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={28}
                color={colors.primary}
              />
            </LinearGradient>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Aucune maintenance prédite
            </Text>
            <Text
              style={[styles.emptySubtext, { color: colors.textSecondary }]}
            >
              Profitez de votre véhicule en toute sérénité
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
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
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
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
  // Issues
  issuesList: {
    gap: 12,
  },
  issueCard: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.02)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  issueHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  issueIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  issueText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  issueCount: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  issueCountText: {
    fontSize: 11,
    fontWeight: "600",
  },
  issueDate: {
    fontSize: 11,
    marginLeft: 44,
  },
  // Maintenance
  maintenanceList: {
    gap: 12,
  },
  maintenanceCard: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.02)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  maintenanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  maintenanceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  maintenanceInfo: {
    flex: 1,
  },
  maintenanceTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  maintenanceMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 11,
  },
  confidenceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: "600",
  },
  progressBarContainer: {
    marginLeft: 52,
    gap: 4,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  confidenceLabel: {
    fontSize: 10,
  },
  // Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: 12,
    textAlign: "center",
  },
});
