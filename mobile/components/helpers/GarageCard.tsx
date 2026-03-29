// components/helpers/GarageCard.tsx - Version sans bouton

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

interface GarageCardProps {
  garage: any;
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

const serviceIcons: Record<string, { icon: string; label: string }> = {
  reparation: { icon: "construct", label: "Réparation" },
  diagnostic: { icon: "medkit", label: "Diagnostic" },
  vidange: { icon: "water", label: "Vidange" },
  freins: { icon: "car", label: "Freins" },
  pneus: { icon: "car-sport", label: "Pneus" },
  climatisation: { icon: "snow", label: "Clim" },
  moteur: { icon: "cog", label: "Moteur" },
  electrique: { icon: "flash", label: "Électrique" },
};

export default function GarageCard({
  garage,
  colors,
  onPress,
  index,
}: GarageCardProps) {
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

  const name = garage.name || "Garage";
  const address = garage.address || "Adresse non disponible";
  const distance = garage.distance || 0;
  const rating = garage.rating || 0;
  const services = garage.services || [];
  const source = garage.source || "google";
  const sourceBadge = getSourceBadge(source, colors);
  const phone = garage.phone;

  const displayServices = services.slice(0, 3);
  const hasMoreServices = services.length > 3;

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

        <View style={styles.header}>
          <LinearGradient
            colors={[colors.primary + "20", colors.secondary + "10"]}
            style={styles.iconContainer}
          >
            <Ionicons name="business" size={28} color={colors.primary} />
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
            <Ionicons name="location" size={14} color={colors.primary} />
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

        {displayServices.length > 0 && (
          <View style={styles.servicesContainer}>
            {displayServices.map((service: string) => {
              const serviceInfo = serviceIcons[service] || {
                icon: "construct",
                label: service,
              };
              return (
                <View
                  key={service}
                  style={[
                    styles.serviceTag,
                    { backgroundColor: colors.primary + "10" },
                  ]}
                >
                  <Ionicons
                    name={serviceInfo.icon as any}
                    size={12}
                    color={colors.primary}
                  />
                  <Text style={[styles.serviceText, { color: colors.primary }]}>
                    {serviceInfo.label}
                  </Text>
                </View>
              );
            })}
            {hasMoreServices && (
              <Text
                style={[styles.moreServices, { color: colors.textSecondary }]}
              >
                +{services.length - 3}
              </Text>
            )}
          </View>
        )}

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
  servicesContainer: {
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
  serviceTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  serviceText: {
    fontSize: 11,
    fontWeight: "500",
  },
  moreServices: {
    fontSize: 11,
    fontWeight: "500",
    marginLeft: 4,
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
