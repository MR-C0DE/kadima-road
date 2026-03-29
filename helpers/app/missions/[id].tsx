// helpers/app/missions/[id].tsx - VERSION COMPLÈTE ET CORRIGÉE
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  Alert,
  Animated,
  StatusBar,
  Linking,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { useSocket } from "../../contexts/SocketContext";
import { api } from "../../config/api";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";

import {
  CancelModal,
  MissionHeader,
  MissionMap,
  MissionInfoCard,
  MissionActions,
  LoadingState,
  ErrorState,
  STATUS_CONFIG,
} from "../../components/missions/details";
import type { MissionDetail } from "../../components/missions/details/types";
import { CancelNotificationModal } from "../../components/CancelNotificationModal";
export default function MissionDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { updateStatus, isConnected } = useSocket();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [mission, setMission] = useState<MissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [helperLocation, setHelperLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationSubscription, setLocationSubscription] = useState<any>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 45.4215,
    longitude: -75.6919,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [isSendingLocation, setIsSendingLocation] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);

  // État pour le modal d'annulation client (sur la page de suivi)
  const [cancelModal, setCancelModal] = useState<{
    visible: boolean;
    missionId: string;
    missionTitle: string;
    reason?: string;
    cancelledBy: "user" | "helper" | "system";
    autoCloseDelay: number;
  }>({
    visible: false,
    missionId: "",
    missionTitle: "",
    cancelledBy: "system",
    autoCloseDelay: 0,
  });

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

  // Interpolation pour la translation
  const slideInterpolation = slideAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 100],
  });

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
      Animated.spring(headerAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    init();

    // ✅ AJOUT : Écouteur WebSocket pour les annulations
    const socket = require("../../services/socket").getSocket();
    if (socket) {
      const handleMissionCancelledDetail = (data: {
        missionId: string;
        cancelledBy: "user" | "helper" | "system";
        reason?: string;
        missionTitle: string;
      }) => {
        console.log("📢 [MissionDetail] Annulation reçue:", data);

        // Vérifier que c'est bien pour notre mission
        if (data.missionId !== id) return;

        setCancelModal({
          visible: true,
          missionId: data.missionId,
          missionTitle: data.missionTitle,
          reason: data.reason,
          cancelledBy: data.cancelledBy,
          autoCloseDelay: 0, // Pas de fermeture auto, l'utilisateur ferme
        });

        // Vibrer
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      };

      socket.on("mission-cancelled-detail", handleMissionCancelledDetail);

      // Nettoyage
      return () => {
        socket.off("mission-cancelled-detail", handleMissionCancelledDetail);
        if (locationSubscription) locationSubscription.remove();
      };
    }

    return () => {
      if (locationSubscription) locationSubscription.remove();
    };
  }, [id]);

  const init = async () => {
    await loadMission();
    await startLocationTracking();
  };

  const loadMission = async () => {
    try {
      const response = await api.get(`/helpers/missions/${id}`);
      const data = response.data.data;
      console.log(
        "📦 Mission data:",
        JSON.stringify(response.data.data, null, 2)
      );
      console.log(
        "📦 Mission data:",
        JSON.stringify(response.data.data, null, 2)
      );
      setMission(data);
      setDistance(data.distance || null);
      if (data.location?.coordinates) {
        setMapRegion({
          latitude: data.location.coordinates[1],
          longitude: data.location.coordinates[0],
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }
      setError(false);
    } catch (error: any) {
      console.error("Erreur chargement mission:", error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const sendLocationToBackend = async (
    latitude: number,
    longitude: number,
    accuracy?: number
  ) => {
    if (isSendingLocation) return;
    setIsSendingLocation(true);
    try {
      await api.put(`/helpers/missions/${id}/location`, {
        latitude,
        longitude,
        accuracy: accuracy || 10,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Erreur envoi position:", error);
    } finally {
      setIsSendingLocation(false);
    }
  };

  const startLocationTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const initialLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setHelperLocation(initialLocation);
      await sendLocationToBackend(
        initialLocation.latitude,
        initialLocation.longitude,
        location.coords.accuracy
      );

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        async (newLocation) => {
          const newPos = {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
          };
          setHelperLocation(newPos);
          await sendLocationToBackend(
            newPos.latitude,
            newPos.longitude,
            newLocation.coords.accuracy
          );
          const socket = require("../../services/socket").getSocket();
          if (socket?.connected) {
            socket.emit("location-update", {
              interventionId: id,
              latitude: newPos.latitude,
              longitude: newPos.longitude,
            });
          }
        }
      );
      setLocationSubscription(subscription);
    } catch (error) {
      console.log("Erreur localisation:", error);
    }
  };

  const updateMissionStatus = async (newStatus: string, reason?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      setMission((prev) =>
        prev ? { ...prev, status: newStatus as any } : prev
      );
      updateStatus(id as string, newStatus, reason);
      await api.put(`/helpers/missions/${id}/status`, {
        status: newStatus,
        reason,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (newStatus === "completed" || newStatus === "cancelled") {
        if (locationSubscription) locationSubscription.remove();
        Alert.alert(
          "Succès",
          newStatus === "completed" ? "Mission terminée" : "Mission annulée",
          [{ text: "OK", onPress: () => router.back() }]
        );
      } else {
        Alert.alert("Succès", "Statut mis à jour");
        loadMission();
      }
    } catch (error: any) {
      console.error("❌ Erreur:", error.response?.data);
      Alert.alert(
        "Erreur",
        error.response?.data?.message || "Impossible de mettre à jour le statut"
      );
      loadMission();
    }
  };

  const handleCancelConfirm = (reason: string) => {
    updateMissionStatus("cancelled", reason);
    setCancelModalVisible(false);
  };

  const handleCallPress = () => {
    if (mission?.client?.phone) {
      Linking.openURL(`tel:${mission.client.phone}`);
    } else {
      Alert.alert("Erreur", "Numéro de téléphone non disponible");
    }
  };

  const toggleMinimize = () => {
    setMinimized(!minimized);
  };

  const headerTranslateY = headerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 0],
  });

  const handleMapDistance = (distanceKm: number) => {
    setDistance(distanceKm);
  };

  if (loading) {
    return <LoadingState colors={colors} />;
  }

  if (error || !mission) {
    return <ErrorState colors={colors} onRetry={loadMission} />;
  }

  const statusConfig = STATUS_CONFIG[mission.status] || STATUS_CONFIG.pending;
  const nextStatuses = statusConfig.nextStatuses || [];
  const isActive = !["completed", "cancelled"].includes(mission.status);
  const clientLocation = {
    latitude: mission.location.coordinates[1],
    longitude: mission.location.coordinates[0],
  };
  const missionWithDistance = {
    ...mission,
    distance: distance || mission.distance,
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      <Animated.View
        style={[
          styles.headerContainer,
          { transform: [{ translateY: headerTranslateY }] },
        ]}
      >
        <MissionHeader
          status={mission.status}
          statusConfig={statusConfig}
          isConnected={isConnected}
          onBack={() => router.back()}
          onMinimize={toggleMinimize}
          minimized={minimized}
          colors={colors}
        />
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={[
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideInterpolation }],
          },
        ]}
      >
        <MissionMap
          clientLocation={clientLocation}
          helperLocation={helperLocation}
          mapRegion={mapRegion}
          minimized={minimized}
          colors={colors}
          onCalculateDistance={handleMapDistance}
          onToggleMinimize={toggleMinimize}
        />

        <MissionInfoCard
          mission={missionWithDistance}
          statusConfig={statusConfig}
          colors={colors}
          onCallPress={handleCallPress}
        />

        <MissionActions
          status={mission.status}
          nextStatuses={nextStatuses}
          isActive={isActive}
          colors={colors}
          colorScheme={colorScheme}
          missionType={mission.problem?.category}
          onStatusUpdate={(newStatus) => updateMissionStatus(newStatus)}
          onCancelPress={() => setCancelModalVisible(true)}
        />
      </Animated.ScrollView>

      <CancelModal
        visible={cancelModalVisible}
        onClose={() => setCancelModalVisible(false)}
        onConfirm={handleCancelConfirm}
        colors={colors}
        colorScheme={colorScheme}
      />

      {/* Modal d'annulation client (notification) */}
      <CancelNotificationModal
        visible={cancelModal.visible}
        missionId={cancelModal.missionId}
        missionTitle={cancelModal.missionTitle}
        reason={cancelModal.reason}
        cancelledBy={cancelModal.cancelledBy}
        autoCloseDelay={cancelModal.autoCloseDelay}
        onClose={() => setCancelModal((prev) => ({ ...prev, visible: false }))}
        onDismiss={() =>
          setCancelModal((prev) => ({ ...prev, visible: false }))
        }
        colors={colors}
        colorScheme={colorScheme}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  scrollContent: { flexGrow: 1, paddingTop: 100, paddingBottom: 30 },
});
