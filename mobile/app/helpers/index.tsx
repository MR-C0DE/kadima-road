import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Easing,
  Platform,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import * as Location from "expo-location";
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from "react-native-maps";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../config/api";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");

// Types de services avec icônes et couleurs
const SERVICE_TYPES = [
  { id: "all", label: "Tous", icon: "apps", color: "#6C5B7B" },
  { id: "battery", label: "Batterie", icon: "battery-dead", color: "#FF6B6B" },
  { id: "tire", label: "Pneu", icon: "car-sport", color: "#4ECDC4" },
  { id: "fuel", label: "Essence", icon: "water", color: "#45B7D1" },
  { id: "engine", label: "Moteur", icon: "cog", color: "#96CEB4" },
  { id: "towing", label: "Remorquage", icon: "car", color: "#FFEAA7" },
  { id: "lockout", label: "Clés", icon: "key", color: "#DDA0DD" },
  { id: "jumpstart", label: "Démarrage", icon: "flash", color: "#FFD93D" },
];

// Interface pour un helper
interface Helper {
  _id: string;
  user: {
    firstName: string;
    lastName: string;
    phone: string;
    photo?: string;
  };
  services: string[];
  stats: {
    averageRating: number;
    completedInterventions: number;
    averageResponseTime: number;
  };
  distance: number;
  pricing: {
    basePrice: number;
    perKm: number;
  };
  availability: {
    isAvailable: boolean;
    schedule?: Array<{ day: string; startTime: string; endTime: string }>;
  };
  location?: {
    coordinates: [number, number];
    address?: string;
  };
}

// Cache key
const CACHE_KEY = "helpers_cache";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default function HelpersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // États
  const [location, setLocation] = useState<any>(null);
  const [region, setRegion] = useState<any>(null);
  const [helpers, setHelpers] = useState<Helper[]>([]);
  const [filteredHelpers, setFilteredHelpers] = useState<Helper[]>([]);
  const [selectedService, setSelectedService] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mapType, setMapType] = useState("standard");
  const [viewMode, setViewMode] = useState<"map" | "list">("map");

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const filterAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    getLocationAndHelpers();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Rafraîchir quand l'écran revient au premier plan
      getLocationAndHelpers(true);
    }, [])
  );

  useEffect(() => {
    filterHelpers();
  }, [selectedService, helpers]);

  // Charger les helpers avec cache
  const getLocationAndHelpers = async (forceRefresh = false) => {
    try {
      // 1. Vérifier le cache
      if (!forceRefresh) {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION && data.length > 0) {
            setHelpers(data);
            setFilteredHelpers(data);
          }
        }
      }

      // 2. Obtenir la position
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission refusée",
          "La géolocalisation est nécessaire pour trouver des helpers",
          [
            { text: "Annuler", style: "cancel" },
            { text: "Réessayer", onPress: () => getLocationAndHelpers() },
          ]
        );
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const userLocation = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

      setLocation(userLocation);
      setRegion(userLocation);

      // 3. Appeler l'API
      const response = await api.get("/helpers/nearby", {
        params: {
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
          radius: 50, // ← 50 km pour couvrir Ottawa
        },
      });

      const helpersData = response.data.data || [];
      setHelpers(helpersData);
      setFilteredHelpers(helpersData);

      // 4. Sauvegarder dans le cache
      await AsyncStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          data: helpersData,
          timestamp: Date.now(),
        })
      );
    } catch (error: any) {
      console.error("Erreur:", error);
      // Ne pas afficher d'alerte si on a des données en cache
      if (helpers.length === 0) {
        Alert.alert(
          "Erreur",
          error.response?.data?.message || "Impossible de charger les helpers"
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterHelpers = () => {
    if (selectedService === "all") {
      setFilteredHelpers(helpers);
    } else {
      setFilteredHelpers(
        helpers.filter((helper) => helper.services?.includes(selectedService))
      );
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await getLocationAndHelpers(true);
  };

  const handleServiceSelect = (serviceId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedService(serviceId);

    Animated.sequence([
      Animated.timing(filterAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(filterAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleHelperPress = (helper: Helper) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Calculer le prix estimé (base + km)
    const estimatedPrice = helper.pricing?.basePrice || 25;
    const pricePerKm = helper.pricing?.perKm || 1;
    const totalEstimate = estimatedPrice + pricePerKm * helper.distance;

    Alert.alert(
      `${helper.user?.firstName} ${helper.user?.lastName}`,
      `📞 ${helper.user?.phone}\n\n` +
        `📍 Distance: ${helper.distance?.toFixed(1)} km\n` +
        `⭐ Note: ${helper.stats?.averageRating?.toFixed(1) || "5.0"}/5\n` +
        `🔧 Interventions: ${helper.stats?.completedInterventions || 0}\n` +
        `💰 Estimation: ${totalEstimate.toFixed(2)} CAD\n` +
        `✅ Disponible: ${helper.availability?.isAvailable ? "Oui" : "Non"}`,
      [
        { text: "Fermer", style: "cancel" },
        {
          text: "Appeler",
          onPress: () => handleCall(helper.user?.phone),
        },
        {
          text: "Voir sur la carte",
          onPress: () => {
            setViewMode("map");
            if (helper.location?.coordinates) {
              setRegion({
                latitude: helper.location.coordinates[1],
                longitude: helper.location.coordinates[0],
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              });
            }
          },
        },
      ]
    );
  };

  const handleCall = (phone: string) => {
    if (!phone) {
      Alert.alert("Erreur", "Numéro de téléphone non disponible");
      return;
    }
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Linking.openURL(`tel:${phone}`);
  };

  const getAvailabilityText = (helper: Helper) => {
    if (!helper.availability?.isAvailable) return "Indisponible";
    return "Disponible";
  };

  const getAvailabilityColor = (helper: Helper) => {
    return helper.availability?.isAvailable ? "#4CAF50" : "#F44336";
  };

  const filterScale = filterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.95],
  });

  if (loading && helpers.length === 0) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <LinearGradient
          colors={[colors.primary + "20", colors.secondary + "20"]}
          style={styles.loadingGradient}
        >
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Ionicons name="people" size={60} color={colors.primary} />
          </Animated.View>
          <Text style={[styles.loadingText, { color: colors.primary }]}>
            Recherche des helpers...
          </Text>
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={styles.loadingSpinner}
          />
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Helpers disponibles</Text>
        <TouchableOpacity
          style={styles.viewModeButton}
          onPress={() => setViewMode(viewMode === "map" ? "list" : "map")}
        >
          <Ionicons
            name={viewMode === "map" ? "list" : "map"}
            size={24}
            color="#fff"
          />
        </TouchableOpacity>
      </LinearGradient>

      {/* Filtres */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {SERVICE_TYPES.map((service) => (
          <Animated.View
            key={service.id}
            style={{
              transform: [
                { scale: selectedService === service.id ? filterScale : 1 },
              ],
            }}
          >
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedService === service.id && styles.filterButtonActive,
                {
                  borderColor:
                    selectedService === service.id
                      ? service.color
                      : colors.border,
                },
              ]}
              onPress={() => handleServiceSelect(service.id)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={
                  selectedService === service.id
                    ? [service.color, service.color + "80"]
                    : ["transparent", "transparent"]
                }
                style={styles.filterGradient}
              >
                <Ionicons
                  name={service.icon}
                  size={20}
                  color={
                    selectedService === service.id ? "#fff" : service.color
                  }
                />
                <Text
                  style={[
                    styles.filterText,
                    {
                      color:
                        selectedService === service.id ? "#fff" : colors.text,
                    },
                  ]}
                >
                  {service.label}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>

      {/* Vue principale */}
      {viewMode === "map" ? (
        <View style={styles.mapContainer}>
          {region && (
            <MapView
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              region={region}
              mapType={mapType}
              showsUserLocation
              showsMyLocationButton
              showsCompass
            >
              {filteredHelpers.map((helper) => (
                <Marker
                  key={helper._id}
                  coordinate={{
                    latitude:
                      helper.location?.coordinates?.[1] || region.latitude,
                    longitude:
                      helper.location?.coordinates?.[0] || region.longitude,
                  }}
                  onPress={() => handleHelperPress(helper)}
                >
                  <View
                    style={[
                      styles.markerContainer,
                      {
                        backgroundColor: getAvailabilityColor(helper),
                      },
                    ]}
                  >
                    <Ionicons name="person" size={16} color="#fff" />
                  </View>
                  <Callout tooltip>
                    <BlurView
                      intensity={80}
                      tint={colorScheme}
                      style={styles.callout}
                    >
                      <Text
                        style={[styles.calloutName, { color: colors.text }]}
                      >
                        {helper.user?.firstName} {helper.user?.lastName}
                      </Text>
                      <Text
                        style={[
                          styles.calloutDistance,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {helper.distance?.toFixed(1)} km
                      </Text>
                      <View style={styles.calloutRating}>
                        <Ionicons name="star" size={12} color="#FFD700" />
                        <Text
                          style={[
                            styles.calloutRatingText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {helper.stats?.averageRating?.toFixed(1) || "5.0"}
                        </Text>
                      </View>
                      <View style={styles.calloutAvailability}>
                        <View
                          style={[
                            styles.calloutDot,
                            { backgroundColor: getAvailabilityColor(helper) },
                          ]}
                        />
                        <Text
                          style={[
                            styles.calloutAvailabilityText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {getAvailabilityText(helper)}
                        </Text>
                      </View>
                    </BlurView>
                  </Callout>
                </Marker>
              ))}
            </MapView>
          )}

          <TouchableOpacity
            style={[styles.mapTypeButton, { backgroundColor: colors.surface }]}
            onPress={() =>
              setMapType(mapType === "standard" ? "satellite" : "standard")
            }
          >
            <Ionicons name="layers" size={24} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.recenterButton, { backgroundColor: colors.surface }]}
            onPress={() => setRegion(location)}
          >
            <Ionicons name="locate" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {filteredHelpers.length > 0 ? (
            filteredHelpers.map((helper, index) => (
              <Animated.View
                key={helper._id}
                style={[
                  styles.helperCard,
                  {
                    opacity: fadeAnim,
                    transform: [
                      {
                        translateY: slideAnim.interpolate({
                          inputRange: [0, 50],
                          outputRange: [0, 15 * (index + 1)],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.helperCardContent,
                    { backgroundColor: colors.surface },
                  ]}
                  onPress={() => handleHelperPress(helper)}
                  activeOpacity={0.7}
                >
                  <View style={styles.helperInfo}>
                    <View
                      style={[
                        styles.helperAvatar,
                        {
                          backgroundColor: getAvailabilityColor(helper) + "20",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.helperAvatarText,
                          { color: getAvailabilityColor(helper) },
                        ]}
                      >
                        {helper.user?.firstName?.[0]}
                        {helper.user?.lastName?.[0]}
                      </Text>
                      <View
                        style={[
                          styles.availabilityDot,
                          { backgroundColor: getAvailabilityColor(helper) },
                        ]}
                      />
                    </View>

                    <View style={styles.helperDetails}>
                      <View style={styles.helperNameRow}>
                        <Text
                          style={[styles.helperName, { color: colors.text }]}
                        >
                          {helper.user?.firstName} {helper.user?.lastName}
                        </Text>
                        <View
                          style={[
                            styles.availabilityBadge,
                            {
                              backgroundColor:
                                getAvailabilityColor(helper) + "20",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.availabilityBadgeText,
                              { color: getAvailabilityColor(helper) },
                            ]}
                          >
                            {getAvailabilityText(helper)}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.helperMeta}>
                        <View style={styles.helperRating}>
                          <Ionicons name="star" size={14} color="#FFD700" />
                          <Text
                            style={[
                              styles.helperRatingText,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {helper.stats?.averageRating?.toFixed(1) || "5.0"}
                          </Text>
                        </View>

                        <View style={styles.helperDistance}>
                          <Ionicons
                            name="location"
                            size={14}
                            color={colors.primary}
                          />
                          <Text
                            style={[
                              styles.helperDistanceText,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {helper.distance?.toFixed(1)} km
                          </Text>
                        </View>

                        <View style={styles.helperInterventions}>
                          <Ionicons
                            name="checkmark-circle"
                            size={14}
                            color={colors.success}
                          />
                          <Text
                            style={[
                              styles.helperInterventionsText,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {helper.stats?.completedInterventions || 0}
                          </Text>
                        </View>

                        {helper.stats?.averageResponseTime > 0 && (
                          <View style={styles.helperResponseTime}>
                            <Ionicons
                              name="time"
                              size={12}
                              color={colors.textSecondary}
                            />
                            <Text
                              style={[
                                styles.helperResponseTimeText,
                                { color: colors.textSecondary },
                              ]}
                            >
                              {helper.stats.averageResponseTime} min
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Services */}
                      <View style={styles.helperServices}>
                        {helper.services?.slice(0, 3).map((service) => {
                          const serviceConfig = SERVICE_TYPES.find(
                            (s) => s.id === service
                          );
                          return (
                            <View
                              key={service}
                              style={[
                                styles.serviceTag,
                                {
                                  backgroundColor:
                                    (serviceConfig?.color || colors.primary) +
                                    "15",
                                },
                              ]}
                            >
                              <Ionicons
                                name={serviceConfig?.icon || "help-circle"}
                                size={10}
                                color={serviceConfig?.color || colors.primary}
                              />
                              <Text
                                style={[
                                  styles.serviceTagText,
                                  {
                                    color:
                                      serviceConfig?.color || colors.primary,
                                  },
                                ]}
                              >
                                {service}
                              </Text>
                            </View>
                          );
                        })}
                        {(helper.services?.length || 0) > 3 && (
                          <Text
                            style={[
                              styles.moreServices,
                              { color: colors.textSecondary },
                            ]}
                          >
                            +{helper.services.length - 3}
                          </Text>
                        )}
                      </View>

                      {/* Prix estimé */}
                      <View style={styles.priceEstimate}>
                        <Ionicons
                          name="cash-outline"
                          size={12}
                          color={colors.success}
                        />
                        <Text
                          style={[
                            styles.priceEstimateText,
                            { color: colors.success },
                          ]}
                        >
                          ~$
                          {(
                            (helper.pricing?.basePrice || 25) +
                            (helper.pricing?.perKm || 1) * helper.distance
                          ).toFixed(0)}{" "}
                          CAD
                        </Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.callButton,
                      { backgroundColor: colors.success },
                    ]}
                    onPress={() => handleCall(helper.user?.phone)}
                  >
                    <Ionicons name="call" size={20} color="#fff" />
                  </TouchableOpacity>
                </TouchableOpacity>
              </Animated.View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <LinearGradient
                colors={[colors.surface, colors.surface]}
                style={styles.emptyCard}
              >
                <View
                  style={[
                    styles.emptyIconContainer,
                    { backgroundColor: colors.primary + "10" },
                  ]}
                >
                  <Ionicons
                    name="people-outline"
                    size={50}
                    color={colors.primary}
                  />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  Aucun helper disponible
                </Text>
                <Text
                  style={[
                    styles.emptySubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  {selectedService !== "all"
                    ? `Aucun helper ne propose le service "${selectedService}"`
                    : "Aucun helper n'est disponible dans votre région"}
                </Text>
                {selectedService !== "all" && (
                  <TouchableOpacity
                    style={[
                      styles.resetFilterButton,
                      { backgroundColor: colors.primary },
                    ]}
                    onPress={() => setSelectedService("all")}
                  >
                    <Text style={styles.resetFilterText}>
                      Voir tous les helpers
                    </Text>
                  </TouchableOpacity>
                )}
              </LinearGradient>
            </View>
          )}
        </ScrollView>
      )}

      {/* Indicateur de nombre de helpers */}
      {filteredHelpers.length > 0 && (
        <BlurView intensity={80} tint={colorScheme} style={styles.statsBadge}>
          <Text style={[styles.statsText, { color: colors.text }]}>
            {filteredHelpers.length} helper
            {filteredHelpers.length > 1 ? "s" : ""} trouvé
            {filteredHelpers.length > 1 ? "s" : ""}
          </Text>
        </BlurView>
      )}
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
  },
  loadingGradient: {
    width: width * 0.8,
    padding: 40,
    borderRadius: 30,
    alignItems: "center",
  },
  loadingSpinner: {
    marginTop: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: "500",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
  },
  viewModeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  filtersContainer: {
    maxHeight: 70,
    marginVertical: 10,
  },
  filtersContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  filterButton: {
    borderRadius: 25,
    borderWidth: 1,
    overflow: "hidden",
  },
  filterButtonActive: {
    borderWidth: 0,
  },
  filterGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "500",
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  callout: {
    padding: 12,
    borderRadius: 16,
    minWidth: 150,
  },
  calloutName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  calloutDistance: {
    fontSize: 12,
    marginBottom: 4,
  },
  calloutRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  calloutRatingText: {
    fontSize: 11,
  },
  calloutAvailability: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  calloutDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  calloutAvailabilityText: {
    fontSize: 10,
  },
  mapTypeButton: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  recenterButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  helperCard: {
    marginBottom: 12,
    borderRadius: 25,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  helperCardContent: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
    justifyContent: "space-between",
  },
  helperInfo: {
    flex: 1,
    flexDirection: "row",
    gap: 12,
  },
  helperAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  helperAvatarText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  availabilityDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#fff",
  },
  helperDetails: {
    flex: 1,
  },
  helperNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  helperName: {
    fontSize: 16,
    fontWeight: "600",
  },
  availabilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  availabilityBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  helperMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 8,
  },
  helperRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  helperRatingText: {
    fontSize: 13,
    fontWeight: "500",
  },
  helperDistance: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  helperDistanceText: {
    fontSize: 13,
  },
  helperInterventions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  helperInterventionsText: {
    fontSize: 13,
  },
  helperResponseTime: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  helperResponseTimeText: {
    fontSize: 11,
  },
  helperServices: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 6,
  },
  serviceTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  serviceTagText: {
    fontSize: 10,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  moreServices: {
    fontSize: 11,
    marginLeft: 2,
  },
  priceEstimate: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  priceEstimateText: {
    fontSize: 11,
    fontWeight: "600",
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
  },
  emptyCard: {
    alignItems: "center",
    padding: 40,
    borderRadius: 30,
    width: width * 0.8,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
  },
  resetFilterButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  resetFilterText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  statsBadge: {
    position: "absolute",
    bottom: 20,
    left: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 25,
    overflow: "hidden",
  },
  statsText: {
    fontSize: 13,
    fontWeight: "500",
  },
});
