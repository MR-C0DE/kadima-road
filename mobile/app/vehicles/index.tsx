// app/vehicles/index.tsx - Version améliorée

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  StatusBar,
  Platform,
  Animated,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../config/api";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");

interface Vehicle {
  _id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  color?: string;
  currentMileage: number;
  isDefault?: boolean;
  status: string;
  aiProfile?: {
    reliabilityScore: number;
    healthScore: number;
  };
}

// Composant de carte véhicule avec animation
const VehicleCard = ({
  vehicle,
  colors,
  onPress,
  index,
}: {
  vehicle: Vehicle;
  colors: any;
  onPress: () => void;
  index: number;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  // Animation d'entrée
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
        friction: 6,
        tension: 40,
        delay: index * 80,
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

  const reliabilityScore = vehicle.aiProfile?.reliabilityScore || 100;
  const reliabilityColor = (() => {
    if (reliabilityScore >= 80) return "#22C55E";
    if (reliabilityScore >= 50) return "#F59E0B";
    return "#EF4444";
  })();

  const formatMileage = (mileage: number) => {
    if (mileage >= 1000) {
      return `${(mileage / 1000).toFixed(1)}k km`;
    }
    return `${mileage} km`;
  };

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }, { translateY }],
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.vehicleCard, { backgroundColor: colors.card }]}
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

        <View style={styles.vehicleHeader}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.vehicleIcon}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="car-outline" size={24} color="#fff" />
          </LinearGradient>

          <View style={styles.vehicleInfo}>
            <View style={styles.vehicleNameRow}>
              <Text style={[styles.vehicleName, { color: colors.text }]}>
                {vehicle.make} {vehicle.model}
              </Text>
              <View style={styles.vehicleYearBadge}>
                <Text style={[styles.vehicleYear, { color: colors.primary }]}>
                  {vehicle.year}
                </Text>
              </View>
            </View>

            <Text
              style={[styles.vehiclePlate, { color: colors.textSecondary }]}
            >
              {vehicle.licensePlate}
            </Text>
          </View>

          {/* Badge "Principal" */}
          {vehicle.isDefault && (
            <LinearGradient
              colors={[colors.success, colors.success + "CC"]}
              style={styles.defaultBadge}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="star" size={10} color="#fff" />
              <Text style={styles.defaultBadgeText}>Principal</Text>
            </LinearGradient>
          )}
        </View>

        <View style={styles.vehicleStats}>
          <View style={styles.statItem}>
            <Ionicons
              name="speedometer-outline"
              size={14}
              color={colors.primary}
            />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>
              {formatMileage(vehicle.currentMileage)}
            </Text>
          </View>

          <View style={styles.statItem}>
            <View
              style={[
                styles.reliabilityDot,
                { backgroundColor: reliabilityColor },
              ]}
            />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>
              {reliabilityScore}%
            </Text>
          </View>

          {vehicle.color && (
            <View style={styles.statItem}>
              <View
                style={[
                  styles.colorDot,
                  { backgroundColor: vehicle.color.toLowerCase() },
                ]}
              />
              <Text style={[styles.statText, { color: colors.textSecondary }]}>
                {vehicle.color}
              </Text>
            </View>
          )}
        </View>

        {/* Barre de fiabilité */}
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
        </View>

        <View style={styles.vehicleFooter}>
          <LinearGradient
            colors={[colors.primary + "10", "transparent"]}
            style={styles.footerGradient}
          >
            <Text style={[styles.viewDetailsText, { color: colors.primary }]}>
              Voir détails
            </Text>
            <Ionicons name="arrow-forward" size={16} color={colors.primary} />
          </LinearGradient>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function VehiclesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadVehicles();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadVehicles();
    }, [])
  );

  const loadVehicles = async () => {
    try {
      const response = await api.get("/vehicles");
      setVehicles(response.data.data);
    } catch (error) {
      console.log("Erreur chargement véhicules:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await loadVehicles();
  };

  const handleAddVehicle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/vehicles/add");
  };

  if (loading && !refreshing) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.loadingLogo}
        >
          <Ionicons name="car" size={40} color="#fff" />
        </LinearGradient>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Chargement des véhicules...
        </Text>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Header avec gradient */}
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mes véhicules</Text>
          <TouchableOpacity
            onPress={handleAddVehicle}
            style={styles.headerButton}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        style={{ opacity: fadeAnim }}
      >
        {vehicles.length > 0 ? (
          <>
            {/* En-tête avec compteur */}
            <View style={styles.counterContainer}>
              <Text
                style={[styles.counterText, { color: colors.textSecondary }]}
              >
                {vehicles.length} véhicule{vehicles.length > 1 ? "s" : ""}
              </Text>
              <LinearGradient
                colors={[colors.primary + "20", colors.secondary + "10"]}
                style={styles.counterBadge}
              >
                <Ionicons name="car-outline" size={12} color={colors.primary} />
                <Text
                  style={[styles.counterBadgeText, { color: colors.primary }]}
                >
                  Garage
                </Text>
              </LinearGradient>
            </View>

            {/* Liste des véhicules */}
            {vehicles.map((vehicle, index) => (
              <VehicleCard
                key={vehicle._id}
                vehicle={vehicle}
                colors={colors}
                onPress={() => router.push(`/vehicles/${vehicle._id}`)}
                index={index}
              />
            ))}
          </>
        ) : (
          // État vide amélioré
          <Animated.View
            style={[
              styles.emptyContainer,
              { backgroundColor: colors.card },
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={[colors.primary + "20", colors.secondary + "10"]}
              style={styles.emptyIcon}
            >
              <Ionicons name="car-outline" size={64} color={colors.primary} />
            </LinearGradient>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Aucun véhicule
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
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
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.addButtonText}>Ajouter un véhicule</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Espace pour le tab bar */}
        <View style={styles.bottomSpace} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  loadingLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  counterContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  counterText: {
    fontSize: 13,
    fontWeight: "500",
  },
  counterBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  counterBadgeText: {
    fontSize: 11,
    fontWeight: "500",
  },
  cardWrapper: {
    marginBottom: 12,
  },
  vehicleCard: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    position: "relative",
  },
  cardBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.5,
  },
  vehicleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    paddingBottom: 8,
  },
  vehicleIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: "600",
  },
  vehicleYearBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.03)",
  },
  vehicleYear: {
    fontSize: 13,
    fontWeight: "600",
  },
  vehiclePlate: {
    fontSize: 12,
  },
  defaultBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  defaultBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  vehicleStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
  },
  reliabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  reliabilityBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  reliabilityBar: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  reliabilityFill: {
    height: "100%",
    borderRadius: 2,
  },
  vehicleFooter: {
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  footerGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    padding: 40,
    borderRadius: 24,
    gap: 16,
    marginTop: 40,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 14,
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
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  bottomSpace: {
    height: 20,
  },
});
