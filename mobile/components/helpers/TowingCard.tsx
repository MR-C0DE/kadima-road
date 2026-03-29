// components/helpers/TowingCard.tsx - Version sans bouton

import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Linking,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");

interface TowingCardProps {
  towing: any;
  colors: any;
  onPress: () => void;
  index: number;
}

const formatDistance = (distance: number) => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }
  return `${distance.toFixed(1)} km`;
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

const getSourceBadge = (source: string, colors: any) => {
  if (source === "partner") {
    return {
      label: "Partenaire",
      icon: "star",
      color: "#F59E0B",
      bgColor: "#F59E0B15",
    };
  }
  return {
    label: "Google",
    icon: "logo-google",
    color: colors.textSecondary,
    bgColor: "rgba(0,0,0,0.05)",
  };
};

const vehicleTypeIcons: Record<string, { icon: string; label: string }> = {
  voiture: { icon: "car", label: "Voiture" },
  suv: { icon: "car-sport", label: "SUV" },
  camionnette: { icon: "bus", label: "Camionnette" },
  poids_lourd: { icon: "truck", label: "Poids lourd" },
};

export default function TowingCard({
  towing,
  colors,
  onPress,
  index,
}: TowingCardProps) {
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

  const name = towing.name || "Service de remorquage";
  const address = towing.address || "Adresse non disponible";
  const distance = towing.distance || 0;
  const rating = towing.rating || 0;
  const phone = towing.phone;
  const available24h = towing.available24h ?? true;
  const source = towing.source || "google";
  const sourceBadge = getSourceBadge(source, colors);

  const basePrice = towing.pricing?.basePrice || 75;
  const perKm = towing.pricing?.perKm || 2;
  const afterHoursFee = towing.pricing?.afterHours || 50;
  const estimatedPrice = towing.estimatedPrice || basePrice + perKm * distance;
  const isAfterHours = towing.isAfterHours || false;

  const vehicleTypes = towing.vehicleTypes || ["voiture", "suv"];
  const displayVehicleTypes = vehicleTypes.slice(0, 3);
  const hasMoreTypes = vehicleTypes.length > 3;

  const handleCall = () => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert("Information", "Numéro de téléphone non disponible");
    }
  };

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

        <View
          style={[styles.sourceBadge, { backgroundColor: sourceBadge.bgColor }]}
        >
          <Ionicons
            name={sourceBadge.icon as any}
            size={12}
            color={sourceBadge.color}
          />
          <Text style={[styles.sourceText, { color: sourceBadge.color }]}>
            {sourceBadge.label}
          </Text>
        </View>

        {available24h && (
          <View
            style={[
              styles.badge247,
              { backgroundColor: colors.success + "15" },
            ]}
          >
            <Ionicons name="time" size={12} color={colors.success} />
            <Text style={[styles.badge247Text, { color: colors.success }]}>
              24/7
            </Text>
          </View>
        )}

        <View style={styles.header}>
          <LinearGradient
            colors={[colors.warning + "20", colors.warning + "10"]}
            style={styles.iconContainer}
          >
            <Ionicons name="car" size={28} color={colors.warning} />
          </LinearGradient>

          <View style={styles.headerInfo}>
            <Text
              style={[styles.name, { color: colors.text }]}
              numberOfLines={1}
            >
              {name}
            </Text>
            <View style={styles.locationRow}>
              <Ionicons
                name="location-outline"
                size={12}
                color={colors.textSecondary}
              />
              <Text
                style={[styles.address, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {address}
              </Text>
            </View>
          </View>

          <View style={styles.distanceContainer}>
            <Ionicons name="location" size={14} color={colors.warning} />
            <Text
              style={[styles.distanceText, { color: colors.textSecondary }]}
            >
              {formatDistance(distance)}
            </Text>
          </View>
        </View>

        {rating > 0 && (
          <View style={styles.ratingContainer}>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= rating ? "star" : "star-outline"}
                  size={14}
                  color={star <= rating ? "#FFD700" : colors.textSecondary}
                />
              ))}
              <Text
                style={[styles.ratingText, { color: colors.textSecondary }]}
              >
                ({rating.toFixed(1)})
              </Text>
            </View>
          </View>
        )}

        {displayVehicleTypes.length > 0 && (
          <View style={styles.vehicleTypesContainer}>
            {displayVehicleTypes.map((type: string) => {
              const typeInfo = vehicleTypeIcons[type] || {
                icon: "car",
                label: type,
              };
              return (
                <View
                  key={type}
                  style={[
                    styles.vehicleTag,
                    { backgroundColor: colors.warning + "10" },
                  ]}
                >
                  <Ionicons
                    name={typeInfo.icon as any}
                    size={12}
                    color={colors.warning}
                  />
                  <Text style={[styles.vehicleText, { color: colors.warning }]}>
                    {typeInfo.label}
                  </Text>
                </View>
              );
            })}
            {hasMoreTypes && (
              <Text style={[styles.moreTypes, { color: colors.textSecondary }]}>
                +{vehicleTypes.length - 3}
              </Text>
            )}
          </View>
        )}

        <View style={styles.priceSection}>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>
              Estimation
            </Text>
            <Text style={[styles.priceValue, { color: colors.success }]}>
              {formatPrice(estimatedPrice)}
            </Text>
            <Text style={[styles.priceDetail, { color: colors.textSecondary }]}>
              (base {formatPrice(basePrice)} + {perKm}$/km)
            </Text>
          </View>

          {isAfterHours && (
            <View style={styles.afterHoursBadge}>
              <Ionicons name="moon" size={12} color={colors.warning} />
              <Text style={[styles.afterHoursText, { color: colors.warning }]}>
                Supplément nuit/week-end: +{formatPrice(afterHoursFee)}
              </Text>
            </View>
          )}
        </View>

        {phone && (
          <TouchableOpacity style={styles.contactRow} onPress={handleCall}>
            <Ionicons name="call-outline" size={14} color={colors.success} />
            <Text style={[styles.contactText, { color: colors.textSecondary }]}>
              {phone}
            </Text>
          </TouchableOpacity>
        )}
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
  sourceBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    zIndex: 10,
  },
  sourceText: {
    fontSize: 10,
    fontWeight: "600",
  },
  badge247: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    zIndex: 10,
  },
  badge247Text: {
    fontSize: 10,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
    marginTop: 8,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  address: {
    fontSize: 12,
    flex: 1,
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
  ratingContainer: {
    marginBottom: 12,
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  ratingText: {
    fontSize: 12,
    marginLeft: 8,
  },
  vehicleTypesContainer: {
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
  vehicleTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  vehicleText: {
    fontSize: 11,
    fontWeight: "500",
  },
  moreTypes: {
    fontSize: 11,
    fontWeight: "500",
    marginLeft: 4,
  },
  priceSection: {
    marginBottom: 12,
    gap: 6,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
    gap: 6,
  },
  priceLabel: {
    fontSize: 11,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  priceDetail: {
    fontSize: 11,
  },
  afterHoursBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  afterHoursText: {
    fontSize: 11,
    fontWeight: "500",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  contactText: {
    fontSize: 12,
  },
});
