// components/vehicle/VehicleDetails.tsx - Version avec animations et design moderne

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../contexts/ThemeContext";
import { Colors } from "@/constants/theme";

const { width } = Dimensions.get("window");

interface VehicleDetailsProps {
  vehicle: any;
}

export default function VehicleDetails({ vehicle }: VehicleDetailsProps) {
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme ?? "light"];
  const [expanded, setExpanded] = useState(true);
  const rotateAnim = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

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

  const toggleExpand = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const toValue = expanded ? 0 : 1;
    Animated.spring(rotateAnim, {
      toValue,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();
    setExpanded(!expanded);
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const getFuelIcon = () => {
    switch (vehicle.fuelType) {
      case "essence":
        return "water";
      case "diesel":
        return "water";
      case "electrique":
        return "battery-charging";
      case "hybride":
        return "leaf";
      default:
        return "water";
    }
  };

  const getTransmissionIcon = () => {
    return vehicle.transmission === "manuelle" ? "cog" : "car-sport";
  };

  const getFuelLabel = () => {
    switch (vehicle.fuelType) {
      case "essence":
        return "Essence";
      case "diesel":
        return "Diesel";
      case "electrique":
        return "Électrique";
      case "hybride":
        return "Hybride";
      default:
        return vehicle.fuelType;
    }
  };

  const getTransmissionLabel = () => {
    return vehicle.transmission === "manuelle" ? "Manuelle" : "Automatique";
  };

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

      <TouchableOpacity
        onPress={toggleExpand}
        style={styles.header}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={[colors.primary + "20", colors.secondary + "10"]}
            style={styles.headerIcon}
          >
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={colors.primary}
            />
          </LinearGradient>
          <Text style={[styles.title, { color: colors.text }]}>
            Détails techniques
          </Text>
        </View>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons
            name="chevron-down"
            size={20}
            color={colors.textSecondary}
          />
        </Animated.View>
      </TouchableOpacity>

      {expanded && (
        <Animated.View
          style={[
            styles.grid,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          {/* Carburant */}
          <View style={styles.item}>
            <LinearGradient
              colors={[colors.primary + "15", colors.primary + "05"]}
              style={styles.itemIcon}
            >
              <Ionicons name={getFuelIcon()} size={20} color={colors.primary} />
            </LinearGradient>
            <View style={styles.itemContent}>
              <Text style={[styles.itemLabel, { color: colors.textSecondary }]}>
                Carburant
              </Text>
              <Text style={[styles.itemValue, { color: colors.text }]}>
                {getFuelLabel()}
              </Text>
            </View>
          </View>

          {/* Transmission */}
          <View style={styles.item}>
            <LinearGradient
              colors={[colors.primary + "15", colors.primary + "05"]}
              style={styles.itemIcon}
            >
              <Ionicons
                name={getTransmissionIcon()}
                size={20}
                color={colors.primary}
              />
            </LinearGradient>
            <View style={styles.itemContent}>
              <Text style={[styles.itemLabel, { color: colors.textSecondary }]}>
                Transmission
              </Text>
              <Text style={[styles.itemValue, { color: colors.text }]}>
                {getTransmissionLabel()}
              </Text>
            </View>
          </View>

          {/* Couleur */}
          {vehicle.color && (
            <View style={styles.item}>
              <LinearGradient
                colors={[colors.primary + "15", colors.primary + "05"]}
                style={styles.itemIcon}
              >
                <Ionicons
                  name="color-palette-outline"
                  size={20}
                  color={colors.primary}
                />
              </LinearGradient>
              <View style={styles.itemContent}>
                <Text
                  style={[styles.itemLabel, { color: colors.textSecondary }]}
                >
                  Couleur
                </Text>
                <View style={styles.colorRow}>
                  <View
                    style={[
                      styles.colorDot,
                      { backgroundColor: vehicle.color.toLowerCase() },
                    ]}
                  />
                  <Text style={[styles.itemValue, { color: colors.text }]}>
                    {vehicle.color}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* VIN */}
          {vehicle.vin && (
            <View style={styles.item}>
              <LinearGradient
                colors={[colors.primary + "15", colors.primary + "05"]}
                style={styles.itemIcon}
              >
                <Ionicons
                  name="qr-code-outline"
                  size={20}
                  color={colors.primary}
                />
              </LinearGradient>
              <View style={styles.itemContent}>
                <Text
                  style={[styles.itemLabel, { color: colors.textSecondary }]}
                >
                  VIN
                </Text>
                <Text
                  style={[styles.itemValue, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {vehicle.vin}
                </Text>
              </View>
            </View>
          )}
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 16,
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
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  grid: {
    marginTop: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  item: {
    width: (width - 48) / 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  itemValue: {
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: -0.2,
  },
  colorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
