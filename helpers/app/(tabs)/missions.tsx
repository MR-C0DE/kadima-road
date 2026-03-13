import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Dimensions,
  Animated,
  Easing,
  Platform,
  StatusBar,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../config/api";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import * as Location from "expo-location";

const { width } = Dimensions.get("window");

// Clé API Google Maps (à remplacer par la tienne)
const GOOGLE_MAPS_APIKEY = "AIzaSyDGpdR97HaU5KBE3yTSq_W7Lu5StXhJh1E";

interface Mission {
  _id: string;
  type: string;
  status:
    | "pending"
    | "accepted"
    | "en_route"
    | "arrived"
    | "in_progress"
    | "completed"
    | "cancelled";
  distance: number;
  reward: number;
  client: {
    firstName: string;
    lastName: string;
    phone: string;
    photo?: string;
  };
  problem: {
    description: string;
    category: string;
  };
  location: {
    address: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  createdAt: string;
  acceptedAt?: string;
  completedAt?: string;
  estimatedTime?: string;
}

export default function MissionsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // États
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"current" | "history">("current");
  const [currentMissions, setCurrentMissions] = useState<Mission[]>([]);
  const [historyMissions, setHistoryMissions] = useState<Mission[]>([]);

  // États pour la localisation
  const [helperLocation, setHelperLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationSubscription, setLocationSubscription] = useState<any>(null);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 45.4215,
    longitude: -75.6919,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;

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

    loadMissions();
    requestLocationPermission();

    return () => {
      stopLocationTracking();
    };
  }, []);

  useEffect(() => {
    Animated.spring(tabIndicatorAnim, {
      toValue: activeTab === "current" ? 0 : 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  useEffect(() => {
    // Si une mission est sélectionnée, centrer la carte sur sa position
    if (selectedMission) {
      setMapRegion({
        latitude: selectedMission.location.coordinates[1],
        longitude: selectedMission.location.coordinates[0],
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  }, [selectedMission]);

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission refusée",
        "Besoin de la localisation pour voir les itinéraires"
      );
    }
  };

  const startLocationTracking = async (mission: Mission) => {
    setSelectedMission(mission);
    setShowMap(true);

    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission refusée",
        "Activez la localisation pour voir l'itinéraire"
      );
      return;
    }

    try {
      // Obtenir position initiale
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setHelperLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      // Centrer la carte entre helper et client
      setMapRegion({
        latitude:
          (location.coords.latitude + mission.location.coordinates[1]) / 2,
        longitude:
          (location.coords.longitude + mission.location.coordinates[0]) / 2,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      });

      // Suivre en temps réel
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (newLocation) => {
          setHelperLocation({
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
          });
        }
      );

      setLocationSubscription(subscription);
    } catch (error) {
      console.log("Erreur localisation:", error);
    }
  };

  const stopLocationTracking = () => {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }
  };

  const loadMissions = async () => {
    try {
      const currentResponse = await api.get("/helpers/missions/current");
      setCurrentMissions(currentResponse.data.data || []);

      const historyResponse = await api.get("/helpers/missions/history");
      setHistoryMissions(historyResponse.data.data || []);
    } catch (error) {
      console.log("Erreur chargement missions:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await loadMissions();
    setRefreshing(false);
  };

  const updateMissionStatus = async (missionId: string, newStatus: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      await api.put(`/helpers/missions/${missionId}/status`, {
        status: newStatus,
      });

      // Gérer le tracking selon le statut
      const mission = currentMissions.find((m) => m._id === missionId);

      if (newStatus === "en_route" && mission) {
        startLocationTracking(mission);
      }

      if (newStatus === "completed" || newStatus === "cancelled") {
        stopLocationTracking();
        setShowMap(false);
        setSelectedMission(null);
      }

      await loadMissions();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Succès", "Statut de la mission mis à jour");
    } catch (error) {
      Alert.alert("Erreur", "Impossible de mettre à jour le statut");
    }
  };

  const calculateDistance = (point1: any, point2: any) => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const dLon = ((point2.longitude - point1.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((point1.latitude * Math.PI) / 180) *
        Math.cos((point2.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "#4CAF50";
      case "en_route":
        return "#2196F3";
      case "arrived":
        return "#FF9800";
      case "in_progress":
        return "#9C27B0";
      case "completed":
        return "#4CAF50";
      case "cancelled":
        return "#F44336";
      default:
        return "#FFC107";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return "checkmark-circle";
      case "en_route":
        return "car";
      case "arrived":
        return "location";
      case "in_progress":
        return "construct";
      case "completed":
        return "checkmark-done";
      case "cancelled":
        return "close-circle";
      default:
        return "time";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "accepted":
        return "Acceptée";
      case "en_route":
        return "En route";
      case "arrived":
        return "Arrivé";
      case "in_progress":
        return "En cours";
      case "completed":
        return "Terminée";
      case "cancelled":
        return "Annulée";
      default:
        return "En attente";
    }
  };

  const getNextStatusOptions = (currentStatus: string) => {
    const options: Record<string, string[]> = {
      accepted: ["en_route", "cancelled"],
      en_route: ["arrived", "cancelled"],
      arrived: ["in_progress", "cancelled"],
      in_progress: ["completed", "cancelled"],
    };
    return options[currentStatus] || [];
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const tabIndicatorPosition = tabIndicatorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width / 2 - 20],
  });

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="dark-content" />
        <Animated.View
          style={[
            styles.loadingContent,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.loadingLogo}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="car" size={40} color="#fff" />
          </LinearGradient>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Chargement de vos missions...
          </Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Header avec dégradé */}
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Missions</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.headerButton}>
            <Ionicons name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={[styles.tabContainer, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => setActiveTab("current")}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "current"
                    ? colors.primary
                    : colors.textSecondary,
              },
            ]}
          >
            En cours
          </Text>
          {currentMissions.length > 0 && (
            <View
              style={[styles.tabBadge, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.tabBadgeText}>{currentMissions.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => setActiveTab("history")}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "history"
                    ? colors.primary
                    : colors.textSecondary,
              },
            ]}
          >
            Historique
          </Text>
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.tabIndicator,
            {
              backgroundColor: colors.primary,
              transform: [{ translateX: tabIndicatorPosition }],
            },
          ]}
        />
      </View>

      <ScrollView
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
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Carte de navigation pour la mission en cours */}
          {activeTab === "current" && selectedMission && showMap && (
            <View style={[styles.mapCard, { backgroundColor: colors.card }]}>
              <View style={styles.mapHeader}>
                <Text style={[styles.mapTitle, { color: colors.text }]}>
                  Itinéraire vers {selectedMission.client.firstName}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowMap(false)}
                  style={styles.mapCloseButton}
                >
                  <Ionicons
                    name="close"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  provider={PROVIDER_GOOGLE}
                  region={mapRegion}
                  showsUserLocation={true}
                  followsUserLocation={true}
                >
                  {/* Position du client */}
                  <Marker
                    coordinate={{
                      latitude: selectedMission.location.coordinates[1],
                      longitude: selectedMission.location.coordinates[0],
                    }}
                    title={selectedMission.client.firstName}
                    description={selectedMission.location.address}
                  >
                    <View
                      style={[
                        styles.clientMarker,
                        { backgroundColor: colors.error },
                      ]}
                    >
                      <Ionicons name="person" size={16} color="#fff" />
                    </View>
                  </Marker>

                  {/* Position du helper (si disponible) */}
                  {helperLocation && (
                    <Marker coordinate={helperLocation} title="Votre position">
                      <View
                        style={[
                          styles.helperMarker,
                          { backgroundColor: colors.primary },
                        ]}
                      >
                        <Ionicons name="car" size={16} color="#fff" />
                      </View>
                    </Marker>
                  )}

                  {/* Tracer l'itinéraire */}
                  {helperLocation && (
                    <MapViewDirections
                      origin={helperLocation}
                      destination={{
                        latitude: selectedMission.location.coordinates[1],
                        longitude: selectedMission.location.coordinates[0],
                      }}
                      apikey={GOOGLE_MAPS_APIKEY}
                      strokeWidth={4}
                      strokeColor={colors.primary}
                      optimizeWaypoints={true}
                      onReady={(result) => {
                        console.log(`Distance: ${result.distance} km`);
                        console.log(`Durée: ${result.duration} min`);
                      }}
                      onError={(errorMessage) => {
                        console.log("Erreur itinéraire:", errorMessage);
                      }}
                    />
                  )}
                </MapView>
              </View>

              {/* Infos de navigation */}
              {helperLocation && (
                <View style={styles.navigationInfo}>
                  <View style={styles.navItem}>
                    <Ionicons
                      name="navigate"
                      size={20}
                      color={colors.primary}
                    />
                    <Text style={[styles.navText, { color: colors.text }]}>
                      {calculateDistance(helperLocation, {
                        latitude: selectedMission.location.coordinates[1],
                        longitude: selectedMission.location.coordinates[0],
                      }).toFixed(1)}{" "}
                      km
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.navButton,
                      { backgroundColor: colors.primary },
                    ]}
                    onPress={() => {
                      const url = Platform.select({
                        ios: `maps:?saddr=${helperLocation.latitude},${helperLocation.longitude}&daddr=${selectedMission.location.coordinates[1]},${selectedMission.location.coordinates[0]}`,
                        android: `google.navigation:q=${selectedMission.location.coordinates[1]},${selectedMission.location.coordinates[0]}`,
                      });
                      if (url) Linking.openURL(url);
                    }}
                  >
                    <Ionicons name="map" size={18} color="#fff" />
                    <Text style={styles.navButtonText}>Ouvrir dans Maps</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Missions en cours */}
          {activeTab === "current" && (
            <>
              {currentMissions.length > 0 ? (
                currentMissions.map((mission) => (
                  <View
                    key={mission._id}
                    style={[
                      styles.missionCard,
                      { backgroundColor: colors.card },
                      selectedMission?._id === mission._id &&
                        styles.selectedMission,
                    ]}
                  >
                    {/* En-tête avec statut */}
                    <View style={styles.missionHeader}>
                      <View style={styles.missionUser}>
                        <LinearGradient
                          colors={[
                            colors.primary + "20",
                            colors.secondary + "10",
                          ]}
                          style={styles.missionAvatar}
                        >
                          <Text
                            style={[
                              styles.missionAvatarText,
                              { color: colors.primary },
                            ]}
                          >
                            {mission.client.firstName[0]}
                            {mission.client.lastName[0]}
                          </Text>
                        </LinearGradient>
                        <View>
                          <Text
                            style={[
                              styles.missionUserName,
                              { color: colors.text },
                            ]}
                          >
                            {mission.client.firstName} {mission.client.lastName}
                          </Text>
                          <Text
                            style={[
                              styles.missionType,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {mission.type}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              getStatusColor(mission.status) + "15",
                          },
                        ]}
                      >
                        <Ionicons
                          name={getStatusIcon(mission.status)}
                          size={12}
                          color={getStatusColor(mission.status)}
                        />
                        <Text
                          style={[
                            styles.statusText,
                            { color: getStatusColor(mission.status) },
                          ]}
                        >
                          {getStatusText(mission.status)}
                        </Text>
                      </View>
                    </View>

                    {/* Description */}
                    <Text
                      style={[
                        styles.missionDescription,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {mission.problem.description}
                    </Text>

                    {/* Informations */}
                    <View style={styles.missionInfo}>
                      <View style={styles.infoItem}>
                        <Ionicons
                          name="location-outline"
                          size={14}
                          color={colors.primary}
                        />
                        <Text style={[styles.infoText, { color: colors.text }]}>
                          {mission.distance} km
                        </Text>
                      </View>
                      <View style={styles.infoItem}>
                        <Ionicons
                          name="cash-outline"
                          size={14}
                          color={colors.success}
                        />
                        <Text
                          style={[styles.infoText, { color: colors.success }]}
                        >
                          ${mission.reward}
                        </Text>
                      </View>
                      <View style={styles.infoItem}>
                        <Ionicons
                          name="time-outline"
                          size={14}
                          color={colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.infoText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {formatTime(mission.createdAt)}
                        </Text>
                      </View>
                    </View>

                    {/* Adresse */}
                    <TouchableOpacity
                      style={styles.addressContainer}
                      onPress={() => startLocationTracking(mission)}
                    >
                      <Ionicons
                        name="navigate-outline"
                        size={14}
                        color={colors.primary}
                      />
                      <Text
                        style={[
                          styles.addressText,
                          { color: colors.textSecondary },
                        ]}
                        numberOfLines={1}
                      >
                        {mission.location.address}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>

                    {/* Actions */}
                    <View style={styles.missionActions}>
                      {getNextStatusOptions(mission.status).map(
                        (nextStatus) => (
                          <TouchableOpacity
                            key={nextStatus}
                            style={[
                              styles.actionButton,
                              nextStatus === "cancelled"
                                ? styles.cancelButton
                                : styles.primaryButton,
                              {
                                borderColor:
                                  nextStatus === "cancelled"
                                    ? colors.error
                                    : colors.primary,
                              },
                            ]}
                            onPress={() =>
                              updateMissionStatus(mission._id, nextStatus)
                            }
                          >
                            <Ionicons
                              name={
                                nextStatus === "en_route"
                                  ? "car"
                                  : nextStatus === "arrived"
                                  ? "location"
                                  : nextStatus === "in_progress"
                                  ? "construct"
                                  : nextStatus === "completed"
                                  ? "checkmark"
                                  : "close"
                              }
                              size={16}
                              color={
                                nextStatus === "cancelled"
                                  ? colors.error
                                  : colors.primary
                              }
                            />
                            <Text
                              style={[
                                styles.actionButtonText,
                                {
                                  color:
                                    nextStatus === "cancelled"
                                      ? colors.error
                                      : colors.primary,
                                },
                              ]}
                            >
                              {nextStatus === "en_route"
                                ? "En route"
                                : nextStatus === "arrived"
                                ? "Arrivé"
                                : nextStatus === "in_progress"
                                ? "Commencer"
                                : nextStatus === "completed"
                                ? "Terminer"
                                : "Annuler"}
                            </Text>
                          </TouchableOpacity>
                        )
                      )}

                      <TouchableOpacity
                        style={[
                          styles.contactButton,
                          { backgroundColor: colors.background },
                        ]}
                        onPress={() => {
                          Alert.alert(
                            "Contacter le client",
                            `${mission.client.firstName} ${mission.client.lastName}`,
                            [
                              { text: "Annuler", style: "cancel" },
                              {
                                text: "Appeler",
                                onPress: () =>
                                  Alert.alert("Appel", mission.client.phone),
                              },
                            ]
                          );
                        }}
                      >
                        <Ionicons
                          name="call-outline"
                          size={18}
                          color={colors.primary}
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Bouton pour afficher la carte */}
                    {mission.status === "en_route" && !showMap && (
                      <TouchableOpacity
                        style={[
                          styles.showMapButton,
                          { borderColor: colors.primary },
                        ]}
                        onPress={() => startLocationTracking(mission)}
                      >
                        <Ionicons
                          name="map-outline"
                          size={16}
                          color={colors.primary}
                        />
                        <Text
                          style={[
                            styles.showMapText,
                            { color: colors.primary },
                          ]}
                        >
                          Voir l'itinéraire
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              ) : (
                <View
                  style={[
                    styles.emptyContainer,
                    { backgroundColor: colors.card },
                  ]}
                >
                  <LinearGradient
                    colors={[colors.primary + "10", colors.secondary + "05"]}
                    style={styles.emptyIconContainer}
                  >
                    <Ionicons
                      name="car-outline"
                      size={32}
                      color={colors.textSecondary}
                    />
                  </LinearGradient>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    Aucune mission en cours
                  </Text>
                  <Text
                    style={[styles.emptyText, { color: colors.textSecondary }]}
                  >
                    Les missions que vous acceptez apparaîtront ici
                  </Text>
                </View>
              )}
            </>
          )}

          {/* Historique */}
          {activeTab === "history" && (
            <>
              {historyMissions.length > 0 ? (
                historyMissions.map((mission) => (
                  <View
                    key={mission._id}
                    style={[
                      styles.missionCard,
                      { backgroundColor: colors.card },
                    ]}
                  >
                    {/* Version simplifiée pour l'historique */}
                    <View style={styles.missionHeader}>
                      <View style={styles.missionUser}>
                        <LinearGradient
                          colors={[
                            colors.primary + "20",
                            colors.secondary + "10",
                          ]}
                          style={styles.missionAvatar}
                        >
                          <Text
                            style={[
                              styles.missionAvatarText,
                              { color: colors.primary },
                            ]}
                          >
                            {mission.client.firstName[0]}
                            {mission.client.lastName[0]}
                          </Text>
                        </LinearGradient>
                        <View>
                          <Text
                            style={[
                              styles.missionUserName,
                              { color: colors.text },
                            ]}
                          >
                            {mission.client.firstName} {mission.client.lastName}
                          </Text>
                          <Text
                            style={[
                              styles.missionDate,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {formatDate(mission.createdAt)}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              getStatusColor(mission.status) + "15",
                          },
                        ]}
                      >
                        <Ionicons
                          name={getStatusIcon(mission.status)}
                          size={12}
                          color={getStatusColor(mission.status)}
                        />
                        <Text
                          style={[
                            styles.statusText,
                            { color: getStatusColor(mission.status) },
                          ]}
                        >
                          {getStatusText(mission.status)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.historyInfo}>
                      <View style={styles.infoItem}>
                        <Ionicons
                          name="cash-outline"
                          size={14}
                          color={colors.success}
                        />
                        <Text
                          style={[styles.infoText, { color: colors.success }]}
                        >
                          ${mission.reward}
                        </Text>
                      </View>
                      <View style={styles.infoItem}>
                        <Ionicons
                          name="location-outline"
                          size={14}
                          color={colors.primary}
                        />
                        <Text
                          style={[
                            styles.infoText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {mission.distance} km
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <View
                  style={[
                    styles.emptyContainer,
                    { backgroundColor: colors.card },
                  ]}
                >
                  <LinearGradient
                    colors={[colors.primary + "10", colors.secondary + "05"]}
                    style={styles.emptyIconContainer}
                  >
                    <Ionicons
                      name="time-outline"
                      size={32}
                      color={colors.textSecondary}
                    />
                  </LinearGradient>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    Aucun historique
                  </Text>
                  <Text
                    style={[styles.emptyText, { color: colors.textSecondary }]}
                  >
                    Vos missions terminées apparaîtront ici
                  </Text>
                </View>
              )}
            </>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  loadingContent: {
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
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 16,
    padding: 4,
    borderRadius: 16,
    position: "relative",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "500",
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
  },
  tabBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 4,
    left: 4,
    width: (width - 40) / 2 - 8,
    height: 32,
    borderRadius: 12,
    zIndex: -1,
  },
  content: {
    padding: 20,
    gap: 12,
  },
  mapCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  mapHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  mapCloseButton: {
    padding: 4,
  },
  mapContainer: {
    height: 200,
    borderRadius: 16,
    overflow: "hidden",
  },
  map: {
    flex: 1,
  },
  clientMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  helperMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  navigationInfo: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  navText: {
    fontSize: 14,
    fontWeight: "500",
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  navButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  missionCard: {
    padding: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  selectedMission: {
    borderWidth: 2,
    borderColor: "rgba(184, 134, 11, 0.5)",
  },
  missionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  missionUser: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  missionAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  missionAvatarText: {
    fontSize: 16,
    fontWeight: "600",
  },
  missionUserName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  missionType: {
    fontSize: 12,
  },
  missionDate: {
    fontSize: 11,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  missionDescription: {
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  missionInfo: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    fontWeight: "500",
  },
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
  addressText: {
    flex: 1,
    fontSize: 12,
  },
  missionActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 30,
    borderWidth: 1,
    gap: 6,
  },
  primaryButton: {
    backgroundColor: "transparent",
  },
  cancelButton: {
    backgroundColor: "transparent",
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  contactButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  showMapButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  showMapText: {
    fontSize: 13,
    fontWeight: "500",
  },
  historyInfo: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: "center",
    padding: 32,
    borderRadius: 24,
    gap: 12,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 13,
    textAlign: "center",
  },
});
