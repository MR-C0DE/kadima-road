// helpers/components/missions/CurrentMissionCard.tsx
import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Mission, STATUS_CONFIG } from "./types";

interface CurrentMissionCardProps {
  mission: Mission;
  colors: any;
  onViewDetails: (missionId: string) => void;
  onCallPress: (phone: string) => void;
}

export const CurrentMissionCard = ({
  mission,
  colors,
  onViewDetails,
  onCallPress,
}: CurrentMissionCardProps) => {
  const status = mission.status || "pending";
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDistance = (distance: number) => {
    if (distance < 1) return `${Math.round(distance * 1000)} m`;
    return `${distance.toFixed(1)} km`;
  };

  return (
    <Animated.View
      style={[
        styles.missionCard,
        {
          backgroundColor: colors.card,
          opacity: fadeAnim,
          transform: [{ translateY }],
        },
      ]}
    >
      <LinearGradient
        colors={[colors.primary + "05", colors.secondary + "02"]}
        style={styles.missionCardBg}
      />

      {/* En-tête */}
      <View style={styles.missionHeader}>
        <View style={styles.missionUser}>
          <LinearGradient
            colors={
              status === "cancelled"
                ? [colors.error + "20", colors.error + "10"]
                : [colors.primary + "20", colors.secondary + "10"]
            }
            style={styles.missionAvatar}
          >
            <Text
              style={[
                styles.missionAvatarText,
                {
                  color: status === "cancelled" ? colors.error : colors.primary,
                },
              ]}
            >
              {mission.user?.firstName?.[0]}
              {mission.user?.lastName?.[0]}
            </Text>
          </LinearGradient>
          <View>
            <Text style={[styles.missionUserName, { color: colors.text }]}>
              {mission.user?.firstName} {mission.user?.lastName}
            </Text>
            <Text style={[styles.missionType, { color: colors.textSecondary }]}>
              {mission.type === "sos"
                ? "SOS Urgence"
                : mission.type || "Assistance"}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusConfig.bgColor },
          ]}
        >
          <Ionicons
            name={statusConfig.icon}
            size={12}
            color={statusConfig.color}
          />
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      {/* Description */}
      <Text
        style={[styles.missionDescription, { color: colors.textSecondary }]}
        numberOfLines={2}
      >
        {mission.problem?.description || "Intervention en cours"}
      </Text>

      {/* Informations */}
      <View style={styles.missionInfo}>
        <View style={styles.infoItem}>
          <Ionicons name="location-outline" size={14} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            {formatDistance(mission.distance)}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="cash-outline" size={14} color={colors.success} />
          <Text style={[styles.infoText, { color: colors.success }]}>
            ${mission.reward}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons
            name="time-outline"
            size={14}
            color={colors.textSecondary}
          />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {formatTime(mission.createdAt)}
          </Text>
        </View>
        {mission.eta && (
          <View style={styles.infoItem}>
            <Ionicons name="car" size={14} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.primary }]}>
              {mission.eta} min
            </Text>
          </View>
        )}
      </View>

      {/* Adresse */}
      <TouchableOpacity
        style={styles.addressContainer}
        onPress={() => {
          if (mission.location?.coordinates) {
            const url = Platform.select({
              ios: `maps:?q=${mission.location.coordinates[1]},${mission.location.coordinates[0]}`,
              android: `geo:${mission.location.coordinates[1]},${mission.location.coordinates[0]}?q=${mission.location.coordinates[1]},${mission.location.coordinates[0]}`,
            });
            if (url) Linking.openURL(url);
          }
        }}
        activeOpacity={0.7}
      >
        <Ionicons name="location-outline" size={14} color={colors.primary} />
        <Text
          style={[styles.addressText, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {mission.location?.address || "Adresse non disponible"}
        </Text>
        <Ionicons
          name="chevron-forward"
          size={16}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {/* Actions simplifiées : seulement "Voir les détails" */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.viewDetailsBtn, { borderColor: colors.border }]}
          onPress={() => onViewDetails(mission._id)}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={[colors.primary + "10", colors.secondary + "05"]}
            style={styles.viewDetailsGradient}
          >
            <Ionicons name="eye-outline" size={18} color={colors.primary} />
            <Text style={[styles.viewDetailsText, { color: colors.primary }]}>
              Voir les détails
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  missionCard: {
    borderRadius: 24,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    position: "relative",
    overflow: "hidden",
    marginBottom: 12,
  },
  missionCardBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.5,
  },
  missionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  missionUser: { flexDirection: "row", alignItems: "center", gap: 12 },
  missionAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  missionAvatarText: { fontSize: 16, fontWeight: "600" },
  missionUserName: { fontSize: 15, fontWeight: "600", marginBottom: 2 },
  missionType: { fontSize: 12 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: { fontSize: 10, fontWeight: "600" },
  missionDescription: { fontSize: 13, marginBottom: 12, lineHeight: 18 },
  missionInfo: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 8,
  },
  infoItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  infoText: { fontSize: 12, fontWeight: "500" },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.02)",
  },
  addressText: { flex: 1, fontSize: 12 },
  actionsContainer: {
    marginTop: 4,
  },
  viewDetailsBtn: {
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 1,
  },
  viewDetailsGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
  },
  viewDetailsText: { fontSize: 14, fontWeight: "600" },
});
