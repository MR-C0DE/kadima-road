// helpers/components/missions/SOSCard.tsx
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

interface SOSCardProps {
  sos: any;
  colors: any;
  onAccept: (sosId: string) => void;
  onLocationPress: (coordinates: [number, number]) => void;
  index: number;
}

export const SOSCard = ({
  sos,
  colors,
  onAccept,
  onLocationPress,
  index,
}: SOSCardProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 40,
        delay: index * 80,
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
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Animated.View
      style={[
        styles.sosCard,
        {
          backgroundColor: colors.card,
          opacity: fadeAnim,
          transform: [{ translateY }],
        },
      ]}
    >
      <LinearGradient
        colors={[colors.error + "05", colors.error + "02"]}
        style={styles.sosCardBg}
      />

      <View style={styles.sosHeader}>
        <View style={styles.sosUser}>
          <LinearGradient
            colors={[colors.error + "20", colors.error + "10"]}
            style={styles.sosAvatar}
          >
            <Ionicons name="alert-circle" size={24} color={colors.error} />
          </LinearGradient>
          <View>
            <Text style={[styles.sosUserName, { color: colors.text }]}>
              {sos.client?.firstName} {sos.client?.lastName}
            </Text>
            <Text style={[styles.sosType, { color: colors.textSecondary }]}>
              {sos.type || "SOS"}
            </Text>
          </View>
        </View>
        <View
          style={[styles.urgentBadge, { backgroundColor: colors.error + "15" }]}
        >
          <Ionicons name="time" size={12} color={colors.error} />
          <Text style={[styles.urgentText, { color: colors.error }]}>
            URGENT
          </Text>
        </View>
      </View>

      <Text
        style={[styles.sosDescription, { color: colors.textSecondary }]}
        numberOfLines={2}
      >
        {sos.problem?.description}
      </Text>

      <View style={styles.sosInfo}>
        <View style={styles.infoItem}>
          <Ionicons name="location-outline" size={14} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            {sos.distance?.toFixed(1)} km
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="cash-outline" size={14} color={colors.success} />
          <Text style={[styles.infoText, { color: colors.success }]}>
            ${sos.reward}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons
            name="time-outline"
            size={14}
            color={colors.textSecondary}
          />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {formatTime(sos.createdAt)}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.addressContainer}
        onPress={() => onLocationPress(sos.location?.coordinates)}
        activeOpacity={0.7}
      >
        <Ionicons name="navigate-outline" size={14} color={colors.primary} />
        <Text
          style={[styles.addressText, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {sos.location?.address || "Adresse non disponible"}
        </Text>
        <Ionicons
          name="chevron-forward"
          size={16}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.acceptButton, { backgroundColor: colors.success }]}
        onPress={() => onAccept(sos._id)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[colors.success, colors.success + "CC"]}
          style={styles.acceptButtonGradient}
        >
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.acceptButtonText}>Accepter la mission</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Styles à copier depuis l'original (partie SOS Card)
const styles = StyleSheet.create({
  sosCard: {
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
  sosCardBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.5,
  },
  sosHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sosUser: { flexDirection: "row", alignItems: "center", gap: 12 },
  sosAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  sosUserName: { fontSize: 15, fontWeight: "600", marginBottom: 2 },
  sosType: { fontSize: 12 },
  urgentBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  urgentText: { fontSize: 10, fontWeight: "600" },
  sosDescription: { fontSize: 13, marginBottom: 12, lineHeight: 18 },
  sosInfo: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 8 },
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
  acceptButton: { borderRadius: 30, overflow: "hidden", marginTop: 8 },
  acceptButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    gap: 8,
  },
  acceptButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
