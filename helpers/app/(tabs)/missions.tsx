// helpers/app/(tabs)/missions.tsx - VERSION CORRIGÉE
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Dimensions,
  Animated,
  Platform,
  StatusBar,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { useSocket } from "../../contexts/SocketContext";
import { api } from "../../config/api";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";

import {
  CancelMissionModal,
  SOSCard,
  CurrentMissionCard,
  HistoryCard,
  MissionTabs,
  MissionsHeader,
} from "../../components/missions";
import { CancelNotificationModal } from "../../components/CancelNotificationModal";
import type { Mission } from "../../components/missions/types";

const { width } = Dimensions.get("window");
const LOCATION_INTERVAL = 2000;

export default function MissionsScreen() {
  // ← EXPORT PAR DÉFAUT
  const router = useRouter();
  const { user } = useAuth();
  const { joinInterventionRoom, updateStatus, isConnected } = useSocket();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // États
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "available" | "current" | "history"
  >("available");
  const [availableSOS, setAvailableSOS] = useState<any[]>([]);
  const [currentMissions, setCurrentMissions] = useState<Mission[]>([]);
  const [historyMissions, setHistoryMissions] = useState<Mission[]>([]);
  const [helperLocation, setHelperLocation] = useState<any>(null);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelMissionId, setCancelMissionId] = useState<string | null>(null);
  // État pour le modal d'annulation (pour missions en cours)
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
  // Refs
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const currentInterventionIdRef = useRef<string | null>(null);
  const currentMissionsRef = useRef(currentMissions);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;

  // ============================================
  // WEBSOCKET - ENVOI POSITION
  // ============================================
  const startLocationStream = useCallback(
    async (interventionId: string) => {
      if (!isConnected) return;
      currentInterventionIdRef.current = interventionId;
      if (locationIntervalRef.current)
        clearInterval(locationIntervalRef.current);

      locationIntervalRef.current = setInterval(async () => {
        if (!isMountedRef.current || !currentInterventionIdRef.current) return;
        try {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          const newLoc = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
          setHelperLocation(newLoc);
          const socket = require("../../services/socket").getSocket();
          if (socket?.connected) {
            socket.emit("location-update", {
              interventionId,
              latitude: newLoc.latitude,
              longitude: newLoc.longitude,
            });
          }
        } catch (error) {
          console.error("Location error:", error);
        }
      }, LOCATION_INTERVAL);
    },
    [isConnected]
  );

  const stopLocationStream = useCallback(() => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
    currentInterventionIdRef.current = null;
  }, []);

  // ============================================
  // CHARGEMENT DES DONNÉES
  // ============================================
  const loadAvailableSOS = useCallback(async () => {
    if (!isMountedRef.current) return;
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const res = await api.get("/helpers/available-sos", {
        params: {
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
          radius: 100,
        },
        timeout: 10000,
      });
      if (isMountedRef.current) setAvailableSOS(res.data.data || []);
    } catch (error) {
      if (isMountedRef.current) setAvailableSOS([]);
    }
  }, []);

  const loadCurrentMissions = useCallback(async () => {
    if (!isMountedRef.current) return;
    try {
      const res = await api.get("/helpers/missions/current", {
        timeout: 10000,
      });
      if (isMountedRef.current) setCurrentMissions(res.data.data || []);
    } catch (error) {}
  }, []);

  const loadHistoryMissions = useCallback(async () => {
    if (!isMountedRef.current) return;
    try {
      const res = await api.get("/helpers/missions/history", {
        timeout: 10000,
      });
      if (isMountedRef.current) setHistoryMissions(res.data.data || []);
    } catch (error) {}
  }, []);

  const loadAllData = useCallback(async () => {
    await Promise.all([
      loadAvailableSOS(),
      loadCurrentMissions(),
      loadHistoryMissions(),
    ]);
  }, [loadAvailableSOS, loadCurrentMissions, loadHistoryMissions]);

  // ============================================
  // ACTIONS
  // ============================================
  const handleAcceptSOS = async (sosId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const res = await api.post(
        `/helpers/accept-sos/${sosId}`,
        {},
        { params: { lat: loc.coords.latitude, lng: loc.coords.longitude } }
      );
      const { intervention, eta } = res.data.data;
      joinInterventionRoom(intervention._id);
      startLocationStream(intervention._id);

      Alert.alert("✅ SOS accepté !", `Arrivée estimée : ${eta} min`, [
        {
          text: "Voir la mission",
          onPress: () => router.push(`/missions/${intervention._id}`),
        },
      ]);
      await loadCurrentMissions();
      setActiveTab("current");
    } catch (error: any) {
      Alert.alert(
        "Erreur",
        error.response?.data?.message || "Impossible d'accepter"
      );
    }
  };

  const handleUpdateStatus = async (
    missionId: string,
    newStatus: string,
    reason?: string
  ) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      setCurrentMissions((prev) =>
        prev.map((m) => (m._id === missionId ? { ...m, status: newStatus } : m))
      );
      updateStatus(missionId, newStatus, reason);
      await api.put(`/helpers/missions/${missionId}/status`, {
        status: newStatus,
        reason,
      });

      if (newStatus === "en_route") startLocationStream(missionId);
      if (newStatus === "completed" || newStatus === "cancelled")
        stopLocationStream();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (newStatus === "completed" || newStatus === "cancelled") {
        Alert.alert(
          "Succès",
          newStatus === "completed" ? "Mission terminée" : "Mission annulée"
        );
      }
    } catch (error: any) {
      console.error("❌ Erreur:", error.response?.data);
      Alert.alert(
        "Erreur",
        error.response?.data?.message || "Impossible de mettre à jour"
      );
      await loadCurrentMissions();
    }
  };

  const handleCancelPress = (missionId: string) => {
    setCancelMissionId(missionId);
    setCancelModalVisible(true);
  };

  const handleCancelConfirm = async (reason: string) => {
    if (cancelMissionId) {
      await handleUpdateStatus(cancelMissionId, "cancelled", reason);
      setCancelModalVisible(false);
      setCancelMissionId(null);
    }
  };

  const handleCallPress = (phone: string) => {
    if (phone) Linking.openURL(`tel:${phone}`);
    else Alert.alert("Erreur", "Numéro de téléphone non disponible");
  };

  const handleViewDetails = (missionId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/missions/${missionId}`);
  };

  // À ajouter après les autres useEffect
  useEffect(() => {
    currentMissionsRef.current = currentMissions;
  }, [currentMissions]);
  // ============================================
  // ÉCOUTEURS WEBSOCKET
  // ============================================
  // helpers/app/(tabs)/missions.tsx
  useEffect(() => {
    const socket = require("../../services/socket").getSocket();
    if (!socket) return;

    // ✅ NOUVEAU : Détail d'annulation
    const handleMissionCancelledDetail = (data: {
      missionId: string;
      cancelledBy: "user" | "helper" | "system";
      reason?: string;
      missionTitle: string;
    }) => {
      console.log("📢 [Missions] Détail annulation:", data);

      // Récupérer la mission dans currentMissions
      const mission = currentMissions.find((m) => m._id === data.missionId);

      // Cas 1: La mission n'est pas encore acceptée (pending)
      if (mission?.status === "pending") {
        loadAllData();
        Toast.show({
          type: "info",
          text1: "Mission annulée",
          text2: data.reason || "Le client a annulé la mission",
          position: "bottom",
          visibilityTime: 2000,
        });
      }
      // Cas 2: Mission en cours (accepted, en_route, arrived, in_progress)
      else if (
        mission &&
        ["accepted", "en_route", "arrived", "in_progress"].includes(
          mission.status
        )
      ) {
        // Afficher le modal
        setCancelModal({
          visible: true,
          missionId: data.missionId,
          missionTitle: data.missionTitle,
          reason: data.reason,
          cancelledBy: data.cancelledBy,
          autoCloseDelay: 0,
        });
        // Supprimer des missions en cours
        setCurrentMissions((prev) =>
          prev.filter((m) => m._id !== data.missionId)
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      // Cas 3: Autres cas, recharger les données
      else {
        loadAllData();
      }
    };

    socket.on("mission-cancelled-detail", handleMissionCancelledDetail);

    return () => {
      socket.off("mission-cancelled-detail", handleMissionCancelledDetail);
    };
  }, [currentMissions]); // ⚠️ Ajouter currentMissions dans les dépendances

  // ============================================
  // INITIALISATION
  // ============================================
  useEffect(() => {
    isMountedRef.current = true;

    const init = async () => {
      await loadAllData();
      setLoading(false);
    };
    init();

    // Animations d'entrée
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

    // ✅ PAS DE POLLING - Socket.IO gère les mises à jour en temps réel
    // Les événements WebSocket couvrent :
    // - new-mission : quand un SOS est créé
    // - status-update : quand une mission change de statut
    // - mission-cancelled : quand une mission est annulée

    return () => {
      isMountedRef.current = false;
      stopLocationStream();
    };
  }, []);
  // Animation de l'indicateur d'onglet
  useEffect(() => {
    Animated.spring(tabIndicatorAnim, {
      toValue: activeTab === "available" ? 0 : activeTab === "current" ? 1 : 2,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  const tabIndicatorPosition = tabIndicatorAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, (width - 40) / 3, ((width - 40) / 3) * 2],
  });

  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.loadingLogo}
          >
            <Ionicons name="car" size={40} color="#fff" />
          </LinearGradient>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Chargement...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      <MissionsHeader
        onBack={() => router.back()}
        onRefresh={onRefresh}
        refreshing={refreshing}
        colors={colors}
      />

      <MissionTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        availableCount={availableSOS.length}
        currentCount={currentMissions.length}
        colors={colors}
        tabIndicatorPosition={tabIndicatorPosition}
      />

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.content,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* SOS Disponibles */}
          {activeTab === "available" &&
            (availableSOS.length > 0 ? (
              availableSOS.map((sos, idx) => (
                <SOSCard
                  key={sos._id}
                  sos={sos}
                  colors={colors}
                  onAccept={handleAcceptSOS}
                  onLocationPress={(coords) => {
                    if (coords) {
                      const url = Platform.select({
                        ios: `maps:?q=${coords[1]},${coords[0]}`,
                        android: `geo:${coords[1]},${coords[0]}?q=${coords[1]},${coords[0]}`,
                      });
                      if (url) Linking.openURL(url);
                    }
                  }}
                  index={idx}
                />
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
                  style={styles.emptyIcon}
                >
                  <Ionicons
                    name="alert-circle-outline"
                    size={32}
                    color={colors.textSecondary}
                  />
                </LinearGradient>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  Aucun SOS
                </Text>
                <Text
                  style={[styles.emptyText, { color: colors.textSecondary }]}
                >
                  Les alertes apparaîtront ici
                </Text>
              </View>
            ))}

          {/* Missions en cours */}
          {activeTab === "current" &&
            (currentMissions.length > 0 ? (
              currentMissions.map((mission) => (
                <CurrentMissionCard
                  key={mission._id}
                  mission={mission}
                  colors={colors}
                  onViewDetails={handleViewDetails}
                  onCallPress={handleCallPress}
                />
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
                  style={styles.emptyIcon}
                >
                  <Ionicons
                    name="car-outline"
                    size={32}
                    color={colors.textSecondary}
                  />
                </LinearGradient>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  Aucune mission
                </Text>
                <Text
                  style={[styles.emptyText, { color: colors.textSecondary }]}
                >
                  Les missions acceptées apparaîtront ici
                </Text>
              </View>
            ))}

          {/* Historique */}
          {activeTab === "history" &&
            (historyMissions.length > 0 ? (
              historyMissions.map((mission) => (
                <HistoryCard
                  key={mission._id}
                  mission={mission}
                  colors={colors}
                />
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
                  style={styles.emptyIcon}
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
                  Vos missions terminées ici
                </Text>
              </View>
            ))}
        </Animated.View>
      </ScrollView>

      <CancelMissionModal
        visible={cancelModalVisible}
        onClose={() => setCancelModalVisible(false)}
        onConfirm={handleCancelConfirm}
        colors={colors}
        colorScheme={colorScheme}
      />
      {/* Modal d'annulation pour missions en cours */}
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

// Styles communs
const styles = StyleSheet.create({
  container: { flex: 1 },
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
  content: { padding: 20, gap: 12 },
  emptyContainer: {
    alignItems: "center",
    padding: 32,
    borderRadius: 24,
    gap: 12,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: { fontSize: 16, fontWeight: "600" },
  emptyText: { fontSize: 13, textAlign: "center" },
});
