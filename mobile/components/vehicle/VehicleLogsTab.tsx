// components/vehicle/VehicleLogsTab.tsx - Version avec animations et design moderne

import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, Dimensions, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../contexts/ThemeContext";
import { Colors } from "@/constants/theme";

const { width } = Dimensions.get("window");

interface VehicleLogsTabProps {
  logs: any[];
}

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
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getLogIcon = (type: string) => {
  switch (type) {
    case "intervention":
      return "construct-outline";
    case "diagnostic":
      return "medkit-outline";
    case "transfer":
      return "swap-horizontal-outline";
    case "sos":
      return "alert-circle-outline";
    case "maintenance":
      return "calendar-outline";
    case "note":
      return "document-text-outline";
    case "acquisition":
      return "car-outline";
    case "mileage_update":
      return "speedometer-outline";
    default:
      return "time-outline";
  }
};

const getLogColor = (type: string, colors: any) => {
  switch (type) {
    case "intervention":
      return colors.success;
    case "diagnostic":
      return colors.accent;
    case "transfer":
      return colors.warning;
    case "sos":
      return colors.error;
    case "maintenance":
      return colors.info;
    case "note":
      return colors.secondary;
    case "acquisition":
      return colors.primary;
    case "mileage_update":
      return colors.primary;
    default:
      return colors.primary;
  }
};

const getLogTitle = (type: string, log: any) => {
  switch (type) {
    case "intervention":
      return "Intervention";
    case "diagnostic":
      return "Diagnostic IA";
    case "transfer":
      return "Transfert";
    case "sos":
      return "Alerte SOS";
    case "maintenance":
      return "Maintenance";
    case "note":
      return "Note";
    case "acquisition":
      return "Acquisition";
    case "mileage_update":
      return "Mise à jour km";
    default:
      return log.title || "Événement";
  }
};

export default function VehicleLogsTab({ logs }: VehicleLogsTabProps) {
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

  if (!logs || logs.length === 0) {
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
        <View style={styles.emptyState}>
          <LinearGradient
            colors={[colors.primary + "15", colors.primary + "05"]}
            style={styles.emptyIcon}
          >
            <Ionicons name="time-outline" size={32} color={colors.primary} />
          </LinearGradient>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Aucun événement
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Le journal du véhicule est vide
          </Text>
        </View>
      </Animated.View>
    );
  }

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

      <View style={styles.header}>
        <LinearGradient
          colors={[colors.primary + "20", colors.secondary + "10"]}
          style={styles.headerIcon}
        >
          <Ionicons name="time-outline" size={18} color={colors.primary} />
        </LinearGradient>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Journal du véhicule
        </Text>
        <View
          style={[
            styles.countBadge,
            { backgroundColor: colors.primary + "15" },
          ]}
        >
          <Text style={[styles.countText, { color: colors.primary }]}>
            {logs.length}
          </Text>
        </View>
      </View>

      <View style={styles.timeline}>
        {logs.map((log, index) => {
          const logColor = getLogColor(log.type, colors);
          const logIcon = getLogIcon(log.type);
          const logTitle = getLogTitle(log.type, log);
          const isLast = index === logs.length - 1;

          return (
            <View key={log._id || index} style={styles.timelineItem}>
              {!isLast && (
                <View
                  style={[
                    styles.timelineLine,
                    { backgroundColor: colors.border },
                  ]}
                />
              )}
              <View style={styles.timelineNode}>
                <LinearGradient
                  colors={[logColor + "20", logColor + "10"]}
                  style={[
                    styles.timelineDot,
                    { backgroundColor: logColor + "15" },
                  ]}
                >
                  <Ionicons name={logIcon} size={16} color={logColor} />
                </LinearGradient>
              </View>
              <View
                style={[styles.logCard, { backgroundColor: colors.background }]}
              >
                <View style={styles.logHeader}>
                  <View style={styles.logTypeContainer}>
                    <View
                      style={[
                        styles.logTypeBadge,
                        { backgroundColor: logColor + "15" },
                      ]}
                    >
                      <Text style={[styles.logTypeText, { color: logColor }]}>
                        {logTitle}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[styles.logDate, { color: colors.textSecondary }]}
                  >
                    {formatDate(log.createdAt)}
                  </Text>
                </View>
                <Text style={[styles.logDescription, { color: colors.text }]}>
                  {log.description}
                </Text>
                {log.metadata && (
                  <View style={styles.logMetadata}>
                    {log.metadata.mileage && (
                      <View style={styles.metadataItem}>
                        <Ionicons
                          name="speedometer-outline"
                          size={12}
                          color={colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.metadataText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {(log.metadata.mileage / 1000).toFixed(1)}k km
                        </Text>
                      </View>
                    )}
                    {log.metadata.duration && (
                      <View style={styles.metadataItem}>
                        <Ionicons
                          name="time-outline"
                          size={12}
                          color={colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.metadataText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {log.metadata.duration} min
                        </Text>
                      </View>
                    )}
                    {log.metadata.price && (
                      <View style={styles.metadataItem}>
                        <Ionicons
                          name="cash-outline"
                          size={12}
                          color={colors.success}
                        />
                        <Text
                          style={[
                            styles.metadataText,
                            { color: colors.success },
                          ]}
                        >
                          ${log.metadata.price}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>
          );
        })}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
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
  timeline: {
    position: "relative",
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 16,
    position: "relative",
  },
  timelineLine: {
    position: "absolute",
    left: 18,
    top: 40,
    bottom: -16,
    width: 2,
  },
  timelineNode: {
    width: 36,
    alignItems: "center",
  },
  timelineDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  logCard: {
    flex: 1,
    marginLeft: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  logTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  logTypeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  logDate: {
    fontSize: 10,
  },
  logDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  logMetadata: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 4,
  },
  metadataItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metadataText: {
    fontSize: 10,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
  },
});
