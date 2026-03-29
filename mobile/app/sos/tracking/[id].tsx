// mobile/app/sos/tracking/[id].tsx - Version PRO avec modal d'annulation améliorée
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  Dimensions,
  Animated,
  Platform,
  StatusBar,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "../../../contexts/AuthContext";
import { useSOS } from "../../../contexts/SOSContext";
import { useSocket } from "../../../contexts/SocketContext";
import { api } from "../../../config/api";
import * as Haptics from "expo-haptics";
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import Toast from "react-native-toast-message";

const { width, height } = Dimensions.get("window");

// Options de raison d'annulation avec vibrations spécifiques
const CANCEL_REASONS = [
  {
    id: "problem_solved",
    label: "Problème résolu",
    icon: "checkmark-circle",
    color: "#22C55E",
    haptic: "light",
  },
  {
    id: "found_other",
    label: "Autre helper trouvé",
    icon: "people",
    color: "#3B82F6",
    haptic: "light",
  },
  {
    id: "too_long",
    label: "Trop long",
    icon: "time",
    color: "#F59E0B",
    haptic: "light",
  },
  {
    id: "emergency",
    label: "Urgence médicale",
    icon: "medical",
    color: "#EF4444",
    haptic: "heavy",
  },
  {
    id: "no_longer_needed",
    label: "Plus besoin",
    icon: "close-circle",
    color: "#6B7280",
    haptic: "light",
  },
  {
    id: "other",
    label: "Autre raison",
    icon: "help-circle",
    color: "#9CA3AF",
    haptic: "light",
  },
];

export default function TrackingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { clearSOS } = useSOS();
  const { trackInterventionRoom, stopTracking, isConnected } = useSocket();

  const [intervention, setIntervention] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [helperLocation, setHelperLocation] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<any>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 45.4215,
    longitude: -75.6919,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const [distanceRemaining, setDistanceRemaining] = useState<number | null>(
    null
  );
  const [estimatedArrival, setEstimatedArrival] = useState<number | null>(null);
  const [showMap, setShowMap] = useState(true);

  // États pour la modale d'annulation
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const mapRef = useRef<MapView>(null);
  const isMountedRef = useRef(true);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const modalScaleAnim = useRef(new Animated.Value(0.9)).current;
  const modalOpacityAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    isMountedRef.current = true;
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

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    init();

    return () => {
      isMountedRef.current = false;
      stopTracking();
    };
  }, []);

  const init = async () => {
    await loadIntervention();
    await setupUserLocation();
    await setupWebSocket();
  };

  const loadIntervention = async () => {
    try {
      const response = await api.get(`/interventions/${id}`);
      if (!isMountedRef.current) return;
      setIntervention(response.data.data);

      if (response.data.data.location?.coordinates) {
        const [lng, lat] = response.data.data.location.coordinates;
        setMapRegion({
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        });
      }
    } catch (error: any) {
      console.error("Erreur chargement intervention:", error);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  };

  const setupUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      if (isMountedRef.current) {
        setUserLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      }
    } catch (error) {
      console.error("Erreur localisation:", error);
    }
  };

  const setupWebSocket = async () => {
    if (!id) return;

    trackInterventionRoom(
      id as string,
      (data: any) => {
        if (!isMountedRef.current) return;
        setHelperLocation({
          latitude: data.latitude,
          longitude: data.longitude,
        });
        updateETA({ latitude: data.latitude, longitude: data.longitude });
        mapRef.current?.animateToRegion(
          {
            latitude: data.latitude,
            longitude: data.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          },
          500
        );
      },
      (data: any) => {
        if (!isMountedRef.current) return;

        // Vibration selon le type de statut
        if (data.status === "en_route")
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        else if (data.status === "arrived")
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        else if (data.status === "in_progress")
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        else if (data.status === "completed")
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        else if (data.status === "cancelled")
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        setIntervention((prev: any) => ({ ...prev, status: data.status }));

        const statusMessages: Record<
          string,
          { message: string; icon: string; type: string }
        > = {
          en_route: {
            message: "🚗 Le helper est en chemin",
            icon: "car",
            type: "info",
          },
          arrived: {
            message: "📍 Le helper est arrivé sur place",
            icon: "location",
            type: "success",
          },
          in_progress: {
            message: "🔧 Le helper travaille sur votre véhicule",
            icon: "construct",
            type: "info",
          },
          completed: {
            message: "✅ Intervention terminée",
            icon: "checkmark",
            type: "success",
          },
          cancelled: {
            message: "❌ Intervention annulée",
            icon: "close",
            type: "error",
          },
        };

        if (statusMessages[data.status]) {
          Toast.show({
            type: statusMessages[data.status].type as any,
            text1: statusMessages[data.status].message,
            position: "bottom",
            visibilityTime: 2000,
          });
        }

        if (data.status === "completed") {
          setTimeout(() => router.replace(`/interventions/${id}/review`), 1500);
        } else if (data.status === "cancelled") {
          setTimeout(() => {
            clearSOS();
            router.replace("/(tabs)");
          }, 1500);
        }
      }
    );
  };

  const calculateDistance = (point1: any, point2: any) => {
    const R = 6371;
    const dLat = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const dLon = ((point2.longitude - point1.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((point1.latitude * Math.PI) / 180) *
        Math.cos((point2.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const updateETA = (helperPos: any) => {
    if (!intervention?.location?.coordinates) return;
    const dest = {
      latitude: intervention.location.coordinates[1],
      longitude: intervention.location.coordinates[0],
    };
    const dist = calculateDistance(helperPos, dest);
    setDistanceRemaining(dist);
    const avgSpeed = dist < 10 ? 30 : 50;
    setEstimatedArrival(Math.max(2, Math.round((dist / avgSpeed) * 60)));
  };

  const fetchRoute = useCallback(async () => {
    if (!helperLocation || !intervention?.location?.coordinates) return;
    const origin = `${helperLocation.latitude},${helperLocation.longitude}`;
    const dest = `${intervention.location.coordinates[1]},${intervention.location.coordinates[0]}`;
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${dest}&key=AIzaSyDGpdR97HaU5KBE3yTSq_W7Lu5StXhJh1E`
      );
      const data = await res.json();
      if (data.routes?.[0]?.overview_polyline?.points) {
        setRouteCoordinates(
          decodePolyline(data.routes[0].overview_polyline.points)
        );
      }
    } catch (error) {
      console.error("Route error:", error);
    }
  }, [helperLocation, intervention]);

  const decodePolyline = (encoded: string) => {
    let points: any[] = [];
    let index = 0,
      lat = 0,
      lng = 0;
    while (index < encoded.length) {
      let b,
        shift = 0,
        result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;
      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;
      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
  };

  useEffect(() => {
    if (helperLocation) fetchRoute();
  }, [helperLocation, fetchRoute]);

  // ============================================
  // ANNULATION AVEC RAISON - MODALE ÉLÉGANTE
  // ============================================
  const openCancelModal = () => {
    // Vibration intense pour l'ouverture
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    setSelectedReason(null);
    setCustomReason("");
    setCancelError(null);
    setCancelModalVisible(true);

    Animated.parallel([
      Animated.spring(modalScaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeCancelModal = () => {
    Animated.parallel([
      Animated.spring(modalScaleAnim, {
        toValue: 0.9,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => setCancelModalVisible(false));
  };

  const shakeError = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 5,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -5,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const confirmCancel = async () => {
    const selectedReasonObj = CANCEL_REASONS.find(
      (r) => r.id === selectedReason
    );
    let finalReason = "";

    if (selectedReason === "other") {
      if (!customReason.trim()) {
        setCancelError("Veuillez décrire la raison");
        shakeError();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      finalReason = customReason.trim();
    } else if (selectedReason) {
      finalReason = selectedReasonObj?.label || "Annulé par l'utilisateur";
    } else {
      setCancelError("Veuillez sélectionner une raison");
      shakeError();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    // Vibration intense pour confirmation
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    setIsCancelling(true);
    setCancelError(null);

    try {
      // 1. Envoyer via WebSocket
      const socket = require("../../../services/socket").getSocket();
      if (socket && socket.connected) {
        socket.emit("status-update", {
          interventionId: id,
          status: "cancelled",
          note: finalReason,
        });
      }

      // 2. Appel API
      await api.put(`/interventions/${id}/cancel`, { reason: finalReason });

      // Vibration de succès
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Toast.show({
        type: "success",
        text1: "Intervention annulée",
        position: "bottom",
      });

      closeCancelModal();
      clearSOS();
      stopTracking();

      setTimeout(() => router.replace("/(tabs)"), 1000);
    } catch (error: any) {
      console.error(
        "Erreur annulation:",
        error.response?.data || error.message
      );

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      setCancelError(
        error.response?.data?.message || "Impossible d'annuler l'intervention"
      );
      shakeError();

      Toast.show({
        type: "error",
        text1: error.response?.data?.message || "Échec de l'annulation",
        position: "bottom",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCallHelper = () => {
    if (intervention?.helper?.user?.phone) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Linking.openURL(`tel:${intervention.helper.user.phone}`);
    } else {
      Toast.show({
        type: "error",
        text1: "Numéro non disponible",
        position: "bottom",
      });
    }
  };

  const handleEmergencyCall = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    Alert.alert(
      "🚨 Appel d'urgence",
      "Voulez-vous contacter les services d'urgence ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Appeler le 911",
          onPress: () => Linking.openURL("tel:911"),
          style: "destructive",
        },
      ]
    );
  };

  const centerOnHelper = () => {
    if (helperLocation && mapRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      mapRef.current.animateToRegion(
        {
          latitude: helperLocation.latitude,
          longitude: helperLocation.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        500
      );
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Connexion...
          </Text>
        </View>
      </View>
    );
  }

  const helper = intervention?.helper?.user;
  const displayEta =
    estimatedArrival !== null ? estimatedArrival : intervention?.eta || 15;
  const distance =
    distanceRemaining !== null ? distanceRemaining.toFixed(1) : null;
  const isActive = !["completed", "cancelled"].includes(intervention?.status);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={openCancelModal}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Suivi en direct</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        {/* Carte */}
        <View style={[styles.mapCard, { backgroundColor: colors.surface }]}>
          {showMap && userLocation && (
            <View style={styles.mapContainer}>
              <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                region={mapRegion}
                showsUserLocation
                followsUserLocation
                showsTraffic
              >
                {intervention?.location?.coordinates && (
                  <Marker
                    coordinate={{
                      latitude: intervention.location.coordinates[1],
                      longitude: intervention.location.coordinates[0],
                    }}
                  >
                    <View
                      style={[
                        styles.destMarker,
                        { backgroundColor: colors.error },
                      ]}
                    >
                      <Ionicons name="flag" size={20} color="#fff" />
                    </View>
                  </Marker>
                )}
                {helperLocation && (
                  <Marker coordinate={helperLocation}>
                    <Animated.View
                      style={{ transform: [{ scale: pulseAnim }] }}
                    >
                      <LinearGradient
                        colors={[colors.primary, colors.secondary]}
                        style={styles.carMarker}
                      >
                        <Ionicons name="car" size={24} color="#fff" />
                      </LinearGradient>
                    </Animated.View>
                  </Marker>
                )}
                {routeCoordinates.length > 0 && (
                  <Polyline
                    coordinates={routeCoordinates}
                    strokeColor={colors.primary}
                    strokeWidth={4}
                  />
                )}
              </MapView>
            </View>
          )}
          <View style={styles.mapControls}>
            <TouchableOpacity
              style={[
                styles.mapControlBtn,
                { backgroundColor: colors.background },
              ]}
              onPress={() => setShowMap(!showMap)}
            >
              <Ionicons
                name={showMap ? "eye-off-outline" : "map-outline"}
                size={18}
                color={colors.primary}
              />
            </TouchableOpacity>
            {helperLocation && (
              <TouchableOpacity
                style={[
                  styles.mapControlBtn,
                  { backgroundColor: colors.background },
                ]}
                onPress={centerOnHelper}
              >
                <Ionicons name="navigate" size={18} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Infos helper */}
        <View style={[styles.helperCard, { backgroundColor: colors.surface }]}>
          <View style={styles.helperHeader}>
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>
                {helper?.firstName?.[0]}
                {helper?.lastName?.[0]}
              </Text>
            </LinearGradient>
            <View style={styles.helperInfo}>
              <Text style={[styles.helperName, { color: colors.text }]}>
                {helper?.firstName} {helper?.lastName}
              </Text>
              <View
                style={[
                  styles.statusChip,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <Ionicons name="radio" size={12} color={colors.primary} />
                </Animated.View>
                <Text style={[styles.statusText, { color: colors.primary }]}>
                  {intervention?.status === "accepted" && "Acceptée"}
                  {intervention?.status === "en_route" && "En route"}
                  {intervention?.status === "arrived" && "Arrivé"}
                  {intervention?.status === "in_progress" && "En cours"}
                  {intervention?.status === "completed" && "Terminée"}
                  {intervention?.status === "cancelled" && "Annulée"}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.callBtn, { backgroundColor: colors.success }]}
              onPress={handleCallHelper}
            >
              <Ionicons name="call" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.etaRow}>
            <View style={styles.etaItem}>
              <Ionicons name="time" size={24} color={colors.primary} />
              <View>
                <Text
                  style={[styles.etaLabel, { color: colors.textSecondary }]}
                >
                  Arrivée estimée
                </Text>
                <Text style={[styles.etaValue, { color: colors.text }]}>
                  {displayEta} min
                </Text>
              </View>
            </View>
            {distance && (
              <View style={styles.etaItem}>
                <Ionicons name="location" size={24} color={colors.primary} />
                <View>
                  <Text
                    style={[styles.etaLabel, { color: colors.textSecondary }]}
                  >
                    Distance restante
                  </Text>
                  <Text style={[styles.etaValue, { color: colors.text }]}>
                    {distance} km
                  </Text>
                </View>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.directionsBtn}
            onPress={() => {
              if (intervention?.location?.coordinates) {
                const [lng, lat] = intervention.location.coordinates;
                Linking.openURL(
                  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
                );
              }
            }}
          >
            <Ionicons name="navigate" size={16} color={colors.primary} />
            <Text style={[styles.directionsText, { color: colors.primary }]}>
              Ouvrir dans Google Maps
            </Text>
          </TouchableOpacity>
        </View>

        {/* Timeline progression */}
        <View
          style={[styles.timelineCard, { backgroundColor: colors.surface }]}
        >
          <Text style={[styles.timelineTitle, { color: colors.text }]}>
            Progression
          </Text>
          <View style={styles.timeline}>
            {[
              {
                status: "accepted",
                label: "Acceptée",
                icon: "checkmark-circle",
                color: "#4CAF50",
              },
              {
                status: "en_route",
                label: "En route",
                icon: "car",
                color: "#2196F3",
              },
              {
                status: "arrived",
                label: "Arrivé",
                icon: "location",
                color: "#FF9800",
              },
              {
                status: "in_progress",
                label: "En cours",
                icon: "construct",
                color: "#9C27B0",
              },
              {
                status: "completed",
                label: "Terminée",
                icon: "checkmark-done",
                color: "#4CAF50",
              },
            ].map((step, idx) => {
              const statusOrder = [
                "accepted",
                "en_route",
                "arrived",
                "in_progress",
                "completed",
              ];
              const currentIndex = statusOrder.indexOf(intervention?.status);
              const isCompleted = currentIndex >= idx;
              const isActive = currentIndex === idx;
              const isLast = idx === 4;
              return (
                <View key={step.status} style={styles.timelineStep}>
                  <View style={styles.timelineLeft}>
                    <View
                      style={[
                        styles.timelineDot,
                        {
                          backgroundColor: isCompleted
                            ? step.color
                            : colors.border,
                        },
                      ]}
                    >
                      <Ionicons name={step.icon} size={12} color="#fff" />
                    </View>
                    {!isLast && (
                      <View
                        style={[
                          styles.timelineLine,
                          { backgroundColor: colors.border },
                        ]}
                      />
                    )}
                  </View>
                  <View style={styles.timelineRight}>
                    <Text
                      style={[
                        styles.timelineLabel,
                        {
                          color: isCompleted
                            ? colors.text
                            : colors.textSecondary,
                          fontWeight: isActive ? "bold" : "normal",
                        },
                      ]}
                    >
                      {step.label}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Actions */}
        {isActive && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: colors.error }]}
              onPress={openCancelModal}
            >
              <Ionicons name="close" size={20} color={colors.error} />
              <Text style={[styles.actionText, { color: colors.error }]}>
                Annuler
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.emergencyBtn,
                {
                  borderColor: colors.error,
                  backgroundColor: colors.error + "10",
                },
              ]}
              onPress={handleEmergencyCall}
            >
              <Ionicons name="warning" size={20} color={colors.error} />
              <Text style={[styles.emergencyText, { color: colors.error }]}>
                Secours
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.ScrollView>

      {/* Modal d'annulation élégante */}
      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="none"
        onRequestClose={closeCancelModal}
      >
        <BlurView
          intensity={100}
          style={styles.modalOverlay}
          tint={colorScheme}
        >
          <TouchableWithoutFeedback onPress={closeCancelModal}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContainer}
          >
            <Animated.View
              style={[
                styles.modalContent,
                {
                  backgroundColor: colors.card,
                  transform: [
                    { scale: modalScaleAnim },
                    { translateX: shakeAnim },
                  ],
                  opacity: modalOpacityAnim,
                },
              ]}
            >
              <LinearGradient
                colors={[colors.error + "15", colors.error + "05"]}
                style={styles.modalGradient}
              >
                {/* Header avec icône animée */}
                <View style={styles.modalHeader}>
                  <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <LinearGradient
                      colors={[colors.error, colors.error + "CC"]}
                      style={styles.modalIcon}
                    >
                      <Ionicons name="alert-circle" size={32} color="#fff" />
                    </LinearGradient>
                  </Animated.View>
                  <View style={styles.modalHeaderText}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>
                      Annuler l'intervention
                    </Text>
                    <Text
                      style={[
                        styles.modalSubtitle,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Cette action est irréversible
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={closeCancelModal}
                    style={styles.modalClose}
                  >
                    <Ionicons
                      name="close"
                      size={22}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                {/* Message d'erreur */}
                {cancelError && (
                  <Animated.View
                    style={[
                      styles.errorContainer,
                      { transform: [{ translateX: shakeAnim }] },
                    ]}
                  >
                    <Ionicons
                      name="alert-circle"
                      size={16}
                      color={colors.error}
                    />
                    <Text style={[styles.errorText, { color: colors.error }]}>
                      {cancelError}
                    </Text>
                  </Animated.View>
                )}

                <Text
                  style={[styles.reasonTitle, { color: colors.textSecondary }]}
                >
                  Pourquoi annulez-vous ?
                </Text>

                {/* Liste des raisons en grille */}
                <View style={styles.reasonsGrid}>
                  {CANCEL_REASONS.map((reason) => (
                    <TouchableOpacity
                      key={reason.id}
                      style={[
                        styles.reasonCard,
                        {
                          backgroundColor: colors.background,
                          borderColor:
                            selectedReason === reason.id
                              ? reason.color
                              : colors.border,
                        },
                        selectedReason === reason.id && { borderWidth: 2 },
                      ]}
                      onPress={() => {
                        if (reason.haptic === "heavy")
                          Haptics.notificationAsync(
                            Haptics.NotificationFeedbackType.Warning
                          );
                        else
                          Haptics.impactAsync(
                            Haptics.ImpactFeedbackStyle.Light
                          );
                        setSelectedReason(reason.id);
                        setCancelError(null);
                      }}
                    >
                      <View
                        style={[
                          styles.reasonIcon,
                          { backgroundColor: reason.color + "15" },
                        ]}
                      >
                        <Ionicons
                          name={reason.icon}
                          size={28}
                          color={reason.color}
                        />
                      </View>
                      <Text
                        style={[
                          styles.reasonLabel,
                          {
                            color:
                              selectedReason === reason.id
                                ? reason.color
                                : colors.text,
                          },
                        ]}
                      >
                        {reason.label}
                      </Text>
                      {selectedReason === reason.id && (
                        <View
                          style={[
                            styles.reasonCheck,
                            { backgroundColor: reason.color },
                          ]}
                        >
                          <Ionicons name="checkmark" size={14} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Champ personnalisé pour "Autre" */}
                {selectedReason === "other" && (
                  <Animated.View style={{ opacity: modalOpacityAnim }}>
                    <TextInput
                      style={[
                        styles.customReasonInput,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                          color: colors.text,
                        },
                      ]}
                      placeholder="Décrivez la raison..."
                      placeholderTextColor={colors.placeholder}
                      value={customReason}
                      onChangeText={(text) => {
                        setCustomReason(text);
                        setCancelError(null);
                      }}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                      autoFocus
                    />
                  </Animated.View>
                )}

                {/* Boutons d'action */}
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      styles.modalButtonCancel,
                      { borderColor: colors.border },
                    ]}
                    onPress={closeCancelModal}
                  >
                    <Text style={{ color: colors.textSecondary }}>Retour</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      styles.modalButtonConfirm,
                      { backgroundColor: colors.error },
                    ]}
                    onPress={confirmCancel}
                    disabled={isCancelling}
                  >
                    {isCancelling ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Ionicons name="trash-outline" size={18} color="#fff" />
                        <Text style={{ color: "#fff", fontWeight: "600" }}>
                          Confirmer l'annulation
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                <Text
                  style={[styles.modalNote, { color: colors.textSecondary }]}
                >
                  <Ionicons name="information-circle" size={12} />{" "}
                  L'intervention sera annulée et le helper en sera informé
                </Text>
              </LinearGradient>
            </Animated.View>
          </KeyboardAvoidingView>
        </BlurView>
      </Modal>

      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  loadingText: { fontSize: 14 },
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#fff" },
  scrollContent: { padding: 20, gap: 16, paddingBottom: 30 },
  mapCard: {
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    position: "relative",
  },
  mapContainer: { height: 280, width: "100%" },
  map: { flex: 1 },
  mapControls: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    gap: 8,
  },
  mapControlBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  destMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  carMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  helperCard: {
    padding: 20,
    borderRadius: 24,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  helperHeader: { flexDirection: "row", alignItems: "center", gap: 16 },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  helperInfo: { flex: 1 },
  helperName: { fontSize: 18, fontWeight: "bold", marginBottom: 4 },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  statusText: { fontSize: 12, fontWeight: "600" },
  callBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  etaRow: { flexDirection: "row", gap: 16 },
  etaItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.03)",
    borderRadius: 16,
  },
  etaLabel: { fontSize: 11 },
  etaValue: { fontSize: 18, fontWeight: "bold" },
  directionsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  directionsText: { fontSize: 14, fontWeight: "500" },
  timelineCard: {
    padding: 20,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  timelineTitle: { fontSize: 16, fontWeight: "600", marginBottom: 16 },
  timeline: { gap: 12 },
  timelineStep: { flexDirection: "row" },
  timelineLeft: { width: 32, alignItems: "center", position: "relative" },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  timelineLine: { position: "absolute", top: 28, width: 2, height: 40 },
  timelineRight: { flex: 1, marginLeft: 12, paddingBottom: 12 },
  timelineLabel: { fontSize: 14 },
  actionsRow: { flexDirection: "row", gap: 12 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 30,
    borderWidth: 1,
    gap: 8,
  },
  actionText: { fontSize: 16, fontWeight: "500" },
  emergencyBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 30,
    borderWidth: 1,
    gap: 8,
  },
  emergencyText: { fontSize: 16, fontWeight: "500" },
  // Modal styles améliorés
  modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center" },
  modalContainer: { width: "90%", maxWidth: 400 },
  modalContent: {
    borderRadius: 32,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 20,
  },
  modalGradient: { padding: 24 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  modalIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  modalHeaderText: { flex: 1 },
  modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 4 },
  modalSubtitle: { fontSize: 13 },
  modalClose: { padding: 4 },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EF444415",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: { fontSize: 13, flex: 1 },
  reasonTitle: { fontSize: 14, fontWeight: "500", marginBottom: 12 },
  reasonsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  reasonCard: {
    width: (width - 80) / 2 - 12,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    position: "relative",
  },
  reasonIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  reasonLabel: { fontSize: 13, fontWeight: "500", textAlign: "center" },
  reasonCheck: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  customReasonInput: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  modalButtons: { flexDirection: "row", gap: 12, marginBottom: 16 },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  modalButtonCancel: { borderWidth: 1 },
  modalButtonConfirm: { borderWidth: 0 },
  modalNote: { fontSize: 11, textAlign: "center", opacity: 0.7 },
});
