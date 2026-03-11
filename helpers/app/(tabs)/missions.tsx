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
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../config/api";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";

const { width } = Dimensions.get("window");

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
    coordinates: [number, number];
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

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    // Animation de l'indicateur de tab
    Animated.spring(tabIndicatorAnim, {
      toValue: activeTab === "current" ? 0 : 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  const loadMissions = async () => {
    try {
      // Charger les missions en cours
      const currentResponse = await api.get("/helpers/missions/current");
      setCurrentMissions(currentResponse.data.data || []);

      // Charger l'historique des missions
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

      // Recharger les missions
      await loadMissions();

      Alert.alert("Succès", "Statut de la mission mis à jour");
    } catch (error) {
      Alert.alert("Erreur", "Impossible de mettre à jour le statut");
    }
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
        return "#E63946";
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
    const options = {
      accepted: ["en_route", "cancelled"],
      en_route: ["arrived", "cancelled"],
      arrived: ["in_progress", "cancelled"],
      in_progress: ["completed", "cancelled"],
    };
    return options[currentStatus] || [];
  };

  const renderMissionCard = (mission: Mission, isCurrent: boolean) => (
    <Animated.View
      key={mission._id}
      style={[
        styles.missionCard,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateX: slideAnim.interpolate({
                inputRange: [0, 50],
                outputRange: [0, 20],
              }),
            },
          ],
        },
      ]}
    >
      <LinearGradient
        colors={[colors.surface, colors.surface]}
        style={styles.missionGradient}
      >
        {/* En-tête de la mission */}
        <View style={styles.missionHeader}>
          <View style={styles.missionUser}>
            <View
              style={[
                styles.missionAvatar,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Text
                style={[styles.missionAvatarText, { color: colors.primary }]}
              >
                {mission.client.firstName[0]}
                {mission.client.lastName[0]}
              </Text>
            </View>
            <View style={styles.missionUserInfo}>
              <Text style={[styles.missionUserName, { color: colors.text }]}>
                {mission.client.firstName} {mission.client.lastName}
              </Text>
              <Text style={[styles.missionType, { color: colors.primary }]}>
                {mission.type}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(mission.status) + "20" },
            ]}
          >
            <Ionicons
              name={getStatusIcon(mission.status)}
              size={14}
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

        {/* Description du problème */}
        <Text
          style={[styles.missionDescription, { color: colors.textSecondary }]}
          numberOfLines={2}
        >
          {mission.problem.description}
        </Text>

        {/* Détails de la mission */}
        <View style={styles.missionDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="location" size={16} color={colors.primary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {mission.distance} km
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="cash" size={16} color={colors.success} />
            <Text style={[styles.detailText, { color: colors.success }]}>
              {mission.reward} €
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time" size={16} color={colors.primary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {new Date(mission.createdAt).toLocaleTimeString()}
            </Text>
          </View>
        </View>

        {/* Adresse */}
        <View style={styles.addressContainer}>
          <Ionicons name="navigate" size={16} color={colors.primary} />
          <Text style={[styles.addressText, { color: colors.textSecondary }]}>
            {mission.location.address}
          </Text>
        </View>

        {/* Actions selon le statut */}
        {isCurrent && (
          <View style={styles.missionActions}>
            {/* Boutons de mise à jour du statut */}
            {getNextStatusOptions(mission.status).map((nextStatus) => (
              <TouchableOpacity
                key={nextStatus}
                style={[
                  styles.actionButton,
                  {
                    backgroundColor:
                      nextStatus === "cancelled"
                        ? colors.error + "20"
                        : colors.primary + "20",
                    borderColor:
                      nextStatus === "cancelled"
                        ? colors.error
                        : colors.primary,
                  },
                ]}
                onPress={() => updateMissionStatus(mission._id, nextStatus)}
              >
                <Ionicons
                  name={
                    nextStatus === "cancelled"
                      ? "close-circle"
                      : nextStatus === "en_route"
                      ? "car"
                      : nextStatus === "arrived"
                      ? "location"
                      : nextStatus === "in_progress"
                      ? "construct"
                      : "checkmark-circle"
                  }
                  size={20}
                  color={
                    nextStatus === "cancelled" ? colors.error : colors.primary
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
            ))}

            {/* Bouton pour contacter le client */}
            <TouchableOpacity
              style={[styles.contactButton, { borderColor: colors.border }]}
              onPress={() => {
                Alert.alert(
                  "Contacter le client",
                  `Voulez-vous appeler ${mission.client.firstName} ?`,
                  [
                    { text: "Annuler", style: "cancel" },
                    {
                      text: "Appeler",
                      onPress: () => {
                        // Implémenter l'appel téléphonique
                        Alert.alert("Info", `Appel à ${mission.client.phone}`);
                      },
                    },
                  ]
                );
              }}
            >
              <Ionicons name="call" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );

  const tabIndicatorPosition = tabIndicatorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width / 2 - 40],
  });

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={[colors.primary + "20", colors.secondary + "20"]}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View
          style={[
            styles.loadingContent,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View
            style={[
              styles.loadingLogo,
              { backgroundColor: colors.primary + "15" },
            ]}
          >
            <Ionicons name="car" size={60} color={colors.primary} />
          </View>
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
      {/* En-tête */}
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={styles.headerTitle}>Mes missions</Text>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabContainer}>
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
            En cours ({currentMissions.length})
          </Text>
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
            Historique ({historyMissions.length})
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
          {/* Missions en cours */}
          {activeTab === "current" && (
            <>
              {currentMissions.length > 0 ? (
                currentMissions.map((mission) =>
                  renderMissionCard(mission, true)
                )
              ) : (
                <BlurView
                  intensity={30}
                  tint={colorScheme}
                  style={styles.emptyContainer}
                >
                  <View
                    style={[
                      styles.emptyIcon,
                      { backgroundColor: colors.primary + "10" },
                    ]}
                  >
                    <Ionicons
                      name="car-outline"
                      size={50}
                      color={colors.primary}
                    />
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    Aucune mission en cours
                  </Text>
                  <Text
                    style={[styles.emptyText, { color: colors.textSecondary }]}
                  >
                    Les missions que vous acceptez apparaîtront ici
                  </Text>
                </BlurView>
              )}
            </>
          )}

          {/* Historique */}
          {activeTab === "history" && (
            <>
              {historyMissions.length > 0 ? (
                historyMissions.map((mission) =>
                  renderMissionCard(mission, false)
                )
              ) : (
                <BlurView
                  intensity={30}
                  tint={colorScheme}
                  style={styles.emptyContainer}
                >
                  <View
                    style={[
                      styles.emptyIcon,
                      { backgroundColor: colors.primary + "10" },
                    ]}
                  >
                    <Ionicons
                      name="time-outline"
                      size={50}
                      color={colors.primary}
                    />
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    Aucun historique
                  </Text>
                  <Text
                    style={[styles.emptyText, { color: colors.textSecondary }]}
                  >
                    Vos missions terminées apparaîtront ici
                  </Text>
                </BlurView>
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
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  loadingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  loadingLogo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 20,
  },
  tabContainer: {
    flexDirection: "row",
    marginTop: 20,
    marginHorizontal: 20,
    position: "relative",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: 20,
    width: (width - 40) / 2 - 20,
    height: 3,
    borderRadius: 1.5,
  },
  content: {
    padding: 20,
    gap: 15,
  },
  missionCard: {
    borderRadius: 20,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  missionGradient: {
    padding: 16,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  missionAvatarText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  missionUserInfo: {
    gap: 2,
  },
  missionUserName: {
    fontSize: 16,
    fontWeight: "600",
  },
  missionType: {
    fontSize: 13,
    fontWeight: "500",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  missionDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  missionDetails: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    fontWeight: "500",
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  addressText: {
    flex: 1,
    fontSize: 13,
  },
  missionActions: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  contactButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    padding: 50,
    borderRadius: 20,
    overflow: "hidden",
    marginTop: 20,
  },
  emptyIcon: {
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
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
});
