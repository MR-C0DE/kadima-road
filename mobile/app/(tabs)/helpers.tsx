// app/(tabs)/helpers.tsx - Version finale avec rayon uniquement pour garages/towing

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  RefreshControl,
  StatusBar,
  Platform,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import * as Location from "expo-location";
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from "react-native-maps";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { api } from "../../config/api";
import { Colors } from "@/constants/theme";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";

// Composants
import { HelperCard, GarageCard, TowingCard } from "../../components/helpers";
import GarageDetailModal from "../../components/helpers/GarageDetailModal";
import TowingDetailModal from "../../components/helpers/TowingDetailModal";

const { width, height } = Dimensions.get("window");

type TabType = "helpers" | "garages" | "towing";

const TABS: {
  id: TabType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { id: "helpers", label: "Helpers", icon: "people" },
  { id: "garages", label: "Garages", icon: "business" },
  { id: "towing", label: "Remorquage", icon: "car" },
];

// Options de rayon pour garages et remorquage
const RADIUS_OPTIONS = [5, 10, 20, 50];

export default function HelpersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme ?? "light"];

  // États de données
  const [activeTab, setActiveTab] = useState<TabType>("helpers");
  const [location, setLocation] = useState<any>(null);
  const [region, setRegion] = useState<any>(null);
  const [helpers, setHelpers] = useState<any[]>([]);
  const [garages, setGarages] = useState<any[]>([]);
  const [towingServices, setTowingServices] = useState<any[]>([]);

  // États d'interface
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mapType, setMapType] = useState("standard");
  const [viewMode, setViewMode] = useState<"map" | "list">("map");

  // États de recherche et filtres (UNIQUEMENT pour garages et towing)
  const [searchQuery, setSearchQuery] = useState("");
  const [searchRadius, setSearchRadius] = useState(10); // Rayon par défaut pour garages/towing
  const [showFilters, setShowFilters] = useState(false);

  // États modals
  const [selectedGarage, setSelectedGarage] = useState<any>(null);
  const [selectedTowing, setSelectedTowing] = useState<any>(null);

  // Refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const filtersAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const mapRef = useRef<MapView>(null);
  const scrollViewRef = useRef<Animated.ScrollView>(null);

  // ============================================
  // EFFETS ET CHARGEMENTS
  // ============================================

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
        useNativeDriver: true,
      }),
    ]).start();

    getLocationAndData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      getLocationAndData(true);
    }, [])
  );

  useEffect(() => {
    if (location) {
      if (activeTab === "helpers") loadHelpers();
      if (activeTab === "garages") loadGarages();
      if (activeTab === "towing") loadTowing();
    }
  }, [activeTab, location, searchRadius, searchQuery]);

  useEffect(() => {
    Animated.timing(filtersAnim, {
      toValue: showFilters ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showFilters]);

  // ============================================
  // CHARGEMENT DES DONNÉES
  // ============================================

  const getLocationAndData = async (forceRefresh = false) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Toast.show({
          type: "error",
          text1: "Permission refusée",
          text2: "La géolocalisation est nécessaire",
          position: "bottom",
        });
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

      await Promise.all([
        activeTab === "helpers" ? loadHelpers() : Promise.resolve(),
        activeTab === "garages" ? loadGarages() : Promise.resolve(),
        activeTab === "towing" ? loadTowing() : Promise.resolve(),
      ]);
    } catch (error) {
      console.error("Erreur localisation:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Helpers - rayon fixe de 50 km
  const loadHelpers = async () => {
    if (!location) return;
    try {
      const response = await api.get("/helpers/nearby", {
        params: {
          lat: location.latitude,
          lng: location.longitude,
          radius: 50, // ← Rayon fixe pour les helpers
        },
      });
      setHelpers(response.data.data || []);
    } catch (error) {
      console.error("Erreur chargement helpers:", error);
    }
  };

  // Garages - avec rayon personnalisable
  const loadGarages = async () => {
    if (!location) return;
    try {
      const response = await api.get("/garages/nearby", {
        params: {
          lat: location.latitude,
          lng: location.longitude,
          radius: searchRadius,
          source: "all",
        },
      });
      let data = response.data.data || [];
      if (searchQuery) {
        data = data.filter((g: any) =>
          g.name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      setGarages(data);
    } catch (error) {
      console.error("Erreur chargement garages:", error);
    }
  };

  // Remorquage - avec rayon personnalisable
  const loadTowing = async () => {
    if (!location) return;
    try {
      const response = await api.get("/towings/nearby", {
        params: {
          lat: location.latitude,
          lng: location.longitude,
          radius: searchRadius,
          source: "all",
        },
      });
      let data = response.data.data || [];
      if (searchQuery) {
        data = data.filter((t: any) =>
          t.name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      setTowingServices(data);
    } catch (error) {
      console.error("Erreur chargement remorquage:", error);
    }
  };

  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await getLocationAndData(true);
  };

  // ============================================
  // INTERACTIONS
  // ============================================

  const handleTabChange = (tab: TabType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
    setSearchQuery("");
  };

  const handleItemPress = (item: any, type: TabType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (type === "helpers") {
      router.push({
        pathname: "/helpers/request",
        params: {
          type,
          id: item._id,
          name: `${item.user?.firstName} ${item.user?.lastName}`,
          distance: item.distance?.toString() || "0",
        },
      });
    } else if (type === "garages") {
      setSelectedGarage(item);
    } else if (type === "towing") {
      setSelectedTowing(item);
    }
  };

  const handleRadiusChange = (radius: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchRadius(radius);
  };

  // ============================================
  // RENDU
  // ============================================

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
          <Ionicons name="people" size={40} color="#fff" />
        </LinearGradient>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Recherche des services...
        </Text>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Header fixe */}
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Assistance</Text>
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
        </View>
      </LinearGradient>

      {/* Onglets */}
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => handleTabChange(tab.id)}
              activeOpacity={0.7}
            >
              <View style={styles.tabContent}>
                <Ionicons
                  name={tab.icon}
                  size={20}
                  color={isActive ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.tabText,
                    { color: isActive ? colors.primary : colors.textSecondary },
                  ]}
                >
                  {tab.label}
                </Text>
              </View>
              {isActive && (
                <View
                  style={[
                    styles.tabUnderline,
                    { backgroundColor: colors.primary },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Barre de recherche et filtres - UNIQUEMENT pour garages et towing */}
      {activeTab !== "helpers" && (
        <View style={styles.searchSection}>
          <View
            style={[
              styles.searchBar,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Rechercher un service..."
              placeholderTextColor={colors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== "" && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.filterButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="options" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Panneau de filtres - UNIQUEMENT pour garages et towing */}
      {showFilters && activeTab !== "helpers" && (
        <Animated.View
          style={[
            styles.filtersPanel,
            { backgroundColor: colors.surface },
            {
              opacity: filtersAnim,
              transform: [
                {
                  scaleY: filtersAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={[styles.filterTitle, { color: colors.text }]}>
            Rayon de recherche
          </Text>
          <View style={styles.radiusButtons}>
            {RADIUS_OPTIONS.map((radius) => (
              <TouchableOpacity
                key={radius}
                style={[
                  styles.radiusButton,
                  searchRadius === radius && {
                    backgroundColor: colors.primary,
                  },
                ]}
                onPress={() => handleRadiusChange(radius)}
              >
                <Text
                  style={[
                    styles.radiusText,
                    { color: searchRadius === radius ? "#fff" : colors.text },
                  ]}
                >
                  {radius} km
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      )}

      {/* Vue principale */}
      <Animated.ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        scrollEventThrottle={16}
      >
        {/* Carte */}
        {viewMode === "map" && region ? (
          <View style={[styles.mapContainer, { height: height - 180 }]}>
            <MapView
              ref={mapRef}
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              region={region}
              mapType={mapType}
              showsUserLocation
              showsMyLocationButton={false}
              showsCompass={false}
            >
              {/* Helpers */}
              {activeTab === "helpers" &&
                helpers.map((helper) => (
                  <Marker
                    key={helper._id}
                    coordinate={{
                      latitude:
                        helper.location?.coordinates?.[1] || region.latitude,
                      longitude:
                        helper.location?.coordinates?.[0] || region.longitude,
                    }}
                    onPress={() => handleItemPress(helper, "helpers")}
                  >
                    <View
                      style={[
                        styles.markerContainer,
                        {
                          backgroundColor: helper.availability?.isAvailable
                            ? "#4CAF50"
                            : "#F44336",
                        },
                      ]}
                    >
                      <Ionicons name="person" size={16} color="#fff" />
                    </View>
                    <Callout tooltip>
                      <BlurView
                        intensity={80}
                        tint={effectiveTheme}
                        style={styles.callout}
                      >
                        <Text
                          style={[styles.calloutName, { color: colors.text }]}
                          numberOfLines={1}
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
                      </BlurView>
                    </Callout>
                  </Marker>
                ))}

              {/* Garages */}
              {activeTab === "garages" &&
                garages.map((garage, idx) => (
                  <Marker
                    key={garage._id || `garage-${idx}`}
                    coordinate={{
                      latitude:
                        garage.location?.coordinates?.[1] || region.latitude,
                      longitude:
                        garage.location?.coordinates?.[0] || region.longitude,
                    }}
                    onPress={() => handleItemPress(garage, "garages")}
                  >
                    <View
                      style={[
                        styles.markerContainer,
                        { backgroundColor: "#3B82F6" },
                      ]}
                    >
                      <Ionicons name="business" size={16} color="#fff" />
                    </View>
                    <Callout tooltip>
                      <BlurView
                        intensity={80}
                        tint={effectiveTheme}
                        style={styles.callout}
                      >
                        <Text
                          style={[styles.calloutName, { color: colors.text }]}
                          numberOfLines={1}
                        >
                          {garage.name}
                        </Text>
                        <Text
                          style={[
                            styles.calloutDistance,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {garage.distance?.toFixed(1)} km
                        </Text>
                      </BlurView>
                    </Callout>
                  </Marker>
                ))}

              {/* Remorquage */}
              {activeTab === "towing" &&
                towingServices.map((towing, idx) => (
                  <Marker
                    key={towing._id || `towing-${idx}`}
                    coordinate={{
                      latitude:
                        towing.location?.coordinates?.[1] || region.latitude,
                      longitude:
                        towing.location?.coordinates?.[0] || region.longitude,
                    }}
                    onPress={() => handleItemPress(towing, "towing")}
                  >
                    <View
                      style={[
                        styles.markerContainer,
                        { backgroundColor: "#F59E0B" },
                      ]}
                    >
                      <Ionicons name="car" size={16} color="#fff" />
                    </View>
                    <Callout tooltip>
                      <BlurView
                        intensity={80}
                        tint={effectiveTheme}
                        style={styles.callout}
                      >
                        <Text
                          style={[styles.calloutName, { color: colors.text }]}
                          numberOfLines={1}
                        >
                          {towing.name}
                        </Text>
                        <Text
                          style={[
                            styles.calloutDistance,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {towing.distance?.toFixed(1)} km
                        </Text>
                      </BlurView>
                    </Callout>
                  </Marker>
                ))}
            </MapView>

            {/* Boutons de contrôle */}
            <TouchableOpacity
              style={[
                styles.mapTypeButton,
                { backgroundColor: colors.surface },
              ]}
              onPress={() =>
                setMapType(mapType === "standard" ? "satellite" : "standard")
              }
            >
              <Ionicons name="layers" size={24} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.recenterButton,
                { backgroundColor: colors.surface },
              ]}
              onPress={() => {
                if (location) {
                  mapRef.current?.animateToRegion(location, 1000);
                }
              }}
            >
              <Ionicons name="locate" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {(() => {
              const data =
                activeTab === "helpers"
                  ? helpers
                  : activeTab === "garages"
                  ? garages
                  : towingServices;
              const hasData = data.length > 0;

              if (!hasData) {
                return (
                  <View
                    style={[
                      styles.emptyContainer,
                      { backgroundColor: colors.surface },
                    ]}
                  >
                    <LinearGradient
                      colors={[colors.primary + "20", colors.secondary + "10"]}
                      style={styles.emptyIcon}
                    >
                      <Ionicons
                        name={
                          activeTab === "helpers"
                            ? "people-outline"
                            : activeTab === "garages"
                            ? "business-outline"
                            : "car-outline"
                        }
                        size={48}
                        color={colors.primary}
                      />
                    </LinearGradient>
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>
                      {activeTab === "helpers"
                        ? "Aucun helper disponible"
                        : activeTab === "garages"
                        ? "Aucun garage trouvé"
                        : "Aucun service de remorquage trouvé"}
                    </Text>
                    <Text
                      style={[
                        styles.emptySubtitle,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {activeTab === "helpers"
                        ? "Essayez d'élargir votre zone de recherche"
                        : "Aucun service trouvé dans votre région. Essayez un rayon plus grand."}
                    </Text>
                  </View>
                );
              }

              return (
                <>
                  {activeTab === "helpers" &&
                    helpers.map((helper, index) => (
                      <HelperCard
                        key={helper._id}
                        helper={helper}
                        colors={colors}
                        onPress={() => handleItemPress(helper, "helpers")}
                        index={index}
                      />
                    ))}
                  {activeTab === "garages" &&
                    garages.map((garage, index) => (
                      <GarageCard
                        key={garage._id || `garage-${index}`}
                        garage={garage}
                        colors={colors}
                        onPress={() => handleItemPress(garage, "garages")}
                        index={index}
                      />
                    ))}
                  {activeTab === "towing" &&
                    towingServices.map((towing, index) => (
                      <TowingCard
                        key={towing._id || `towing-${index}`}
                        towing={towing}
                        colors={colors}
                        onPress={() => handleItemPress(towing, "towing")}
                        index={index}
                      />
                    ))}
                </>
              );
            })()}
          </View>
        )}
        <View style={styles.bottomSpace} />
      </Animated.ScrollView>

      {/* Modals */}
      <GarageDetailModal
        visible={!!selectedGarage}
        garage={selectedGarage}
        colors={colors}
        onClose={() => setSelectedGarage(null)}
      />
      <TowingDetailModal
        visible={!!selectedTowing}
        towing={selectedTowing}
        colors={colors}
        onClose={() => setSelectedTowing(null)}
      />

      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 0 },
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
  loadingText: { fontSize: 14 },
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginTop: 0,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#fff" },
  viewModeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  tab: { flex: 1, paddingVertical: 12, position: "relative" },
  tabActive: {},
  tabContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  tabText: { fontSize: 14 },
  tabUnderline: {
    position: "absolute",
    bottom: -1,
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 1,
  },
  searchSection: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15 },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  filtersPanel: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  filterTitle: { fontSize: 14, fontWeight: "600", marginBottom: 12 },
  radiusButtons: { flexDirection: "row", gap: 12 },
  radiusButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 25,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  radiusText: { fontSize: 14, fontWeight: "500" },
  scrollContent: { flexGrow: 1, paddingBottom: 0 },
  mapContainer: { width: "100%", position: "relative", overflow: "hidden" },
  map: { flex: 1 },
  markerContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  callout: { padding: 12, borderRadius: 16, minWidth: 150 },
  calloutName: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  calloutDistance: { fontSize: 12 },
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
  listContainer: { padding: 16, paddingBottom: 30 },
  emptyContainer: {
    alignItems: "center",
    padding: 40,
    borderRadius: 24,
    marginTop: 40,
    gap: 16,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: { fontSize: 18, fontWeight: "600" },
  emptySubtitle: { fontSize: 14, textAlign: "center" },
  bottomSpace: { height: 30 },
});
