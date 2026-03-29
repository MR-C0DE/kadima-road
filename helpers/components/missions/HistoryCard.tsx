// helpers/components/missions/HistoryCard.tsx
import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Mission, STATUS_CONFIG } from "./types";

interface HistoryCardProps {
  mission: Mission;
  colors: any;
}

export const HistoryCard = ({ mission, colors }: HistoryCardProps) => {
  const status = mission.status || "pending";
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(translateX, {
        toValue: 0,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <Animated.View
      style={[
        styles.historyCard,
        {
          backgroundColor: colors.card,
          opacity: fadeAnim,
          transform: [{ translateX }],
        },
      ]}
    >
      <LinearGradient
        colors={[colors.primary + "05", colors.secondary + "02"]}
        style={styles.historyCardBg}
      />

      <View style={styles.historyHeader}>
        <View style={styles.historyUser}>
          <LinearGradient
            colors={[colors.primary + "20", colors.secondary + "10"]}
            style={styles.historyAvatar}
          >
            <Text style={[styles.historyAvatarText, { color: colors.primary }]}>
              {mission.user?.firstName?.[0]}
              {mission.user?.lastName?.[0]}
            </Text>
          </LinearGradient>
          <View>
            <Text style={[styles.historyUserName, { color: colors.text }]}>
              {mission.user?.firstName} {mission.user?.lastName}
            </Text>
            <Text style={[styles.historyDate, { color: colors.textSecondary }]}>
              {formatDate(mission.createdAt)}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.historyStatus,
            { backgroundColor: statusConfig.bgColor },
          ]}
        >
          <Ionicons
            name={statusConfig.icon}
            size={12}
            color={statusConfig.color}
          />
          <Text
            style={[styles.historyStatusText, { color: statusConfig.color }]}
          >
            {statusConfig.label}
          </Text>
        </View>
      </View>

      <Text
        style={[styles.historyDescription, { color: colors.textSecondary }]}
        numberOfLines={2}
      >
        {mission.problem?.description || "Intervention sans description"}
      </Text>

      <View style={styles.historyInfo}>
        <View style={styles.infoItem}>
          <Ionicons name="cash-outline" size={14} color={colors.success} />
          <Text style={[styles.infoText, { color: colors.success }]}>
            ${mission.reward}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="location-outline" size={14} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {mission.distance} km
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

// Styles à copier depuis l'original (partie HistoryCard)
const styles = StyleSheet.create({
  historyCard: {
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
    position: "relative",
    overflow: "hidden",
  },
  historyCardBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.5,
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  historyUser: { flexDirection: "row", alignItems: "center", gap: 12 },
  historyAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  historyAvatarText: { fontSize: 16, fontWeight: "600" },
  historyUserName: { fontSize: 15, fontWeight: "600", marginBottom: 2 },
  historyDate: { fontSize: 11 },
  historyStatus: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  historyStatusText: { fontSize: 10, fontWeight: "600" },
  historyDescription: { fontSize: 13, marginBottom: 8, lineHeight: 18 },
  historyInfo: { flexDirection: "row", gap: 16 },
  infoItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  infoText: { fontSize: 12, fontWeight: "500" },
});
