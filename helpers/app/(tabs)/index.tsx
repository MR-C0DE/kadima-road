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
  Modal,
  StatusBar,
  SafeAreaView,
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
  distance: number;
  reward: number;
  client: {
    firstName: string;
    lastName: string;
    photo?: string;
  };
  estimatedTime: string;
  estimatedTimeMinutes: number;
  problem: {
    description: string;
    category: string;
  };
  location: {
    address: string;
    coordinates: [number, number];
  };
  createdAt: string;
}

interface HelperStats {
  todayEarnings: number;
  todayMissions: number;
  averageRating: number;
  totalMissions: number;
  responseRate: number;
  ranking: number;
  level: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // États
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [availableMissions, setAvailableMissions] = useState<Mission[]>([]);

  // Stats réelles
  const [stats, setStats] = useState<HelperStats>({
    todayEarnings: 0,
    todayMissions: 0,
    averageRating: 0,
    totalMissions: 0,
    responseRate: 100,
    ranking: 0,
    level: "Débutant",
  });

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Charger le profil pour la disponibilité
      const profileResponse = await api.get("/helpers/profile/me");
      const profile = profileResponse.data.data;
      setIsAvailable(profile.availability?.isAvailable ?? true);

      // Charger les statistiques
      try {
        const statsResponse = await api.get("/helpers/earnings/stats");
        const statsData = statsResponse.data.data;

        // Calculer le niveau basé sur le nombre de missions
        let level = "Débutant";
        if (statsData.completedMissions > 100) level = "Expert";
        else if (statsData.completedMissions > 50) level = "Confirmé";
        else if (statsData.completedMissions > 20) level = "Intermédiaire";

        setStats({
          todayEarnings: statsData.todayEarnings || 0,
          todayMissions: statsData.todayMissions || 0,
          averageRating: profile.stats?.averageRating || 0,
          totalMissions: statsData.completedMissions || 0,
          responseRate: statsData.responseRate || 100,
          ranking: 12, // À calculer plus tard
          level: level,
        });
      } catch (error) {
        console.log("Erreur chargement stats:", error);
      }

      // Charger les missions disponibles (à proximité)
      try {
        // Remplacer par de vraies coordonnées GPS
        const locationResponse = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = locationResponse.coords;

        const missionsResponse = await api.get(
          `/helpers/nearby?lat=${latitude}&lng=${longitude}&radius=20`
        );
        setAvailableMissions(missionsResponse.data.data || []);
      } catch (error) {
        console.log("Erreur chargement missions:", error);
        setAvailableMissions([]);
      }
    } catch (error) {
      console.log("Erreur chargement données:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadData();
    setRefreshing(false);
  };

  const toggleAvailability = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newStatus = !isAvailable;

    try {
      await api.put("/helpers/availability", { isAvailable: newStatus });
      setIsAvailable(newStatus);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert("Erreur", "Impossible de changer le statut");
    }
  };

  const handleMissionPress = (mission: Mission) => {
    setSelectedMission(mission);
    setShowMissionModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleAcceptMission = async () => {
    if (!selectedMission) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowMissionModal(false);

    try {
      await api.post(`/helpers/accept-mission/${selectedMission._id}`);
      Alert.alert(
        "✅ Mission acceptée",
        "Rendez-vous dans l'onglet Missions pour plus de détails"
      );
      loadData(); // Recharger les données
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'accepter la mission");
    }
  };

  const getTimeColor = (minutes: number) => {
    if (minutes < 10) return colors.success;
    if (minutes < 20) return colors.warning;
    return colors.error;
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Expert":
        return "#FFD700";
      case "Confirmé":
        return "#C0C0C0";
      case "Intermédiaire":
        return "#CD7F32";
      default:
        return colors.primary;
    }
  };

  const formatDistance = (distance: number) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    }
    return `${distance.toFixed(1)} km`;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.loadingLogo}
          >
            <Ionicons name="flash" size={40} color="#fff" />
          </LinearGradient>
          <Text style={[styles.loadingText, { color: colors.primary }]}>
            Kadima
          </Text>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
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

      {/* Header avec dégradé */}
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.header}
      >
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerGreeting}>Bonjour,</Text>
              <View style={styles.headerNameRow}>
                <Text style={styles.headerName}>
                  {user?.firstName || "Helper"}
                </Text>
                <View
                  style={[
                    styles.headerLevel,
                    { backgroundColor: getLevelColor(stats.level) + "30" },
                  ]}
                >
                  <Text
                    style={[
                      styles.headerLevelText,
                      { color: getLevelColor(stats.level) },
                    ]}
                  >
                    {stats.level}
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.statusButton,
                {
                  backgroundColor: isAvailable ? colors.success : colors.error,
                },
              ]}
              onPress={toggleAvailability}
              activeOpacity={0.8}
            >
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>
                {isAvailable ? "Disponible" : "Indisponible"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Stats header */}
          <View style={styles.headerStats}>
            <View style={styles.headerStat}>
              <Text style={styles.headerStatValue}>{stats.todayMissions}</Text>
              <Text style={styles.headerStatLabel}>aujourd'hui</Text>
            </View>
            <View style={styles.headerStatDivider} />
            <View style={styles.headerStat}>
              <Text style={styles.headerStatValue}>${stats.todayEarnings}</Text>
              <Text style={styles.headerStatLabel}>gagnés</Text>
            </View>
            <View style={styles.headerStatDivider} />
            <View style={styles.headerStat}>
              <Text style={styles.headerStatValue}>#{stats.ranking}</Text>
              <Text style={styles.headerStatLabel}>classement</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

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
          {/* Grille de stats */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <View
                style={[
                  styles.statIcon,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Ionicons name="star" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.statCardValue, { color: colors.text }]}>
                {stats.averageRating.toFixed(1)}
              </Text>
              <Text
                style={[styles.statCardLabel, { color: colors.textSecondary }]}
              >
                Note
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <View
                style={[
                  styles.statIcon,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={colors.primary}
                />
              </View>
              <Text style={[styles.statCardValue, { color: colors.text }]}>
                {stats.totalMissions}
              </Text>
              <Text
                style={[styles.statCardLabel, { color: colors.textSecondary }]}
              >
                Missions
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <View
                style={[
                  styles.statIcon,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Ionicons name="trending-up" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.statCardValue, { color: colors.text }]}>
                {stats.responseRate}%
              </Text>
              <Text
                style={[styles.statCardLabel, { color: colors.textSecondary }]}
              >
                Réponse
              </Text>
            </View>
          </View>

          {/* Section Missions disponibles */}
          <View style={styles.missionsSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Missions à proximité
              </Text>
              <TouchableOpacity onPress={() => router.push("/missions")}>
                <Text style={[styles.sectionLink, { color: colors.primary }]}>
                  Voir tout
                </Text>
              </TouchableOpacity>
            </View>

            {availableMissions.length > 0 ? (
              availableMissions.slice(0, 3).map((mission, index) => (
                <TouchableOpacity
                  key={mission._id}
                  style={[
                    styles.missionCard,
                    { backgroundColor: colors.card },
                    index === 0 && styles.firstMission,
                  ]}
                  onPress={() => handleMissionPress(mission)}
                  activeOpacity={0.7}
                >
                  <View style={styles.missionHeader}>
                    <View style={styles.missionLeft}>
                      <LinearGradient
                        colors={[
                          colors.primary + "20",
                          colors.secondary + "10",
                        ]}
                        style={styles.missionIcon}
                      >
                        <Ionicons
                          name={getMissionIcon(mission.problem.category)}
                          size={20}
                          color={colors.primary}
                        />
                      </LinearGradient>
                      <View>
                        <Text
                          style={[styles.missionType, { color: colors.text }]}
                        >
                          {getMissionType(mission.type)}
                        </Text>
                        <Text
                          style={[
                            styles.missionClient,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {mission.client.firstName} {mission.client.lastName}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.missionDistance,
                        { backgroundColor: colors.primary + "10" },
                      ]}
                    >
                      <Ionicons
                        name="location-outline"
                        size={12}
                        color={colors.primary}
                      />
                      <Text
                        style={[
                          styles.missionDistanceText,
                          { color: colors.primary },
                        ]}
                      >
                        {formatDistance(mission.distance)}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.missionDescription,
                      { color: colors.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {mission.problem.description}
                  </Text>

                  <View style={styles.missionFooter}>
                    <View
                      style={[
                        styles.missionTime,
                        {
                          backgroundColor:
                            getTimeColor(mission.estimatedTimeMinutes) + "15",
                        },
                      ]}
                    >
                      <Ionicons
                        name="time-outline"
                        size={14}
                        color={getTimeColor(mission.estimatedTimeMinutes)}
                      />
                      <Text
                        style={[
                          styles.missionTimeText,
                          { color: getTimeColor(mission.estimatedTimeMinutes) },
                        ]}
                      >
                        {mission.estimatedTime}
                      </Text>
                    </View>
                    <Text
                      style={[styles.missionReward, { color: colors.success }]}
                    >
                      ${mission.reward}
                    </Text>
                  </View>
                </TouchableOpacity>
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
                  Aucune mission
                </Text>
                <Text
                  style={[styles.emptyText, { color: colors.textSecondary }]}
                >
                  Les missions apparaîtront ici en temps réel
                </Text>
              </View>
            )}
          </View>

          {/* Espace pour le tab bar */}
          <View style={styles.tabBarSpace} />
        </Animated.View>
      </ScrollView>

      {/* Modal Mission */}
      <Modal
        visible={showMissionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMissionModal(false)}
      >
        <BlurView intensity={90} tint={colorScheme} style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setShowMissionModal(false)}
            activeOpacity={1}
          />
          {selectedMission && (
            <Animated.View
              style={[
                styles.modalContent,
                {
                  backgroundColor: colors.card,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <LinearGradient
                  colors={[colors.primary + "20", colors.secondary + "10"]}
                  style={styles.modalIcon}
                >
                  <Ionicons
                    name={getMissionIcon(selectedMission.problem.category)}
                    size={32}
                    color={colors.primary}
                  />
                </LinearGradient>
                <View style={styles.modalTitleContainer}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    {getMissionType(selectedMission.type)}
                  </Text>
                  <Text
                    style={[
                      styles.modalClient,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {selectedMission.client.firstName}{" "}
                    {selectedMission.client.lastName}
                  </Text>
                </View>
              </View>

              <View style={styles.modalDetails}>
                <View style={styles.modalDetail}>
                  <Ionicons
                    name="location-outline"
                    size={18}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.modalDetailText, { color: colors.text }]}
                  >
                    {formatDistance(selectedMission.distance)}
                  </Text>
                </View>
                <View style={styles.modalDetail}>
                  <Ionicons
                    name="time-outline"
                    size={18}
                    color={getTimeColor(selectedMission.estimatedTimeMinutes)}
                  />
                  <Text
                    style={[
                      styles.modalDetailText,
                      {
                        color: getTimeColor(
                          selectedMission.estimatedTimeMinutes
                        ),
                      },
                    ]}
                  >
                    {selectedMission.estimatedTime}
                  </Text>
                </View>
                <View style={styles.modalDetail}>
                  <Ionicons
                    name="cash-outline"
                    size={18}
                    color={colors.success}
                  />
                  <Text
                    style={[styles.modalDetailText, { color: colors.success }]}
                  >
                    ${selectedMission.reward}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.modalDescription,
                  { backgroundColor: colors.background },
                ]}
              >
                <Text
                  style={[styles.modalDescriptionText, { color: colors.text }]}
                >
                  {selectedMission.problem.description}
                </Text>
                <Text
                  style={[
                    styles.modalAddressText,
                    { color: colors.textSecondary },
                  ]}
                >
                  {selectedMission.location.address}
                </Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[
                    styles.modalAcceptButton,
                    { backgroundColor: colors.success },
                  ]}
                  onPress={handleAcceptMission}
                >
                  <Text style={styles.modalAcceptText}>
                    Accepter la mission
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalCloseButton,
                    { borderColor: colors.border },
                  ]}
                  onPress={() => setShowMissionModal(false)}
                >
                  <Text
                    style={[
                      styles.modalCloseText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Fermer
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
        </BlurView>
      </Modal>
    </View>
  );
}

// Fonctions utilitaires pour les missions
const getMissionIcon = (category: string) => {
  const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
    battery: "battery-dead",
    tire: "car",
    fuel: "water",
    towing: "construct",
    lockout: "key",
    diagnostic: "medkit",
    jumpstart: "flash",
    minor_repair: "build",
  };
  return icons[category] || "help-circle";
};

const getMissionType = (type: string) => {
  const types: Record<string, string> = {
    battery: "Batterie",
    tire: "Pneu",
    fuel: "Essence",
    towing: "Remorquage",
    lockout: "Clés",
    diagnostic: "Diagnostic",
    jumpstart: "Démarrage",
    minor_repair: "Réparation",
  };
  return types[type] || type;
};

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
    fontSize: 20,
    fontWeight: "600",
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 0 : StatusBar.currentHeight,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerSafeArea: {
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginHorizontal: 10,
  },
  headerGreeting: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.8,
    marginBottom: 4,
  },
  headerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  headerLevel: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  headerLevelText: {
    fontSize: 11,
    fontWeight: "600",
  },
  statusButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  statusText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  headerStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    padding: 16,
  },
  headerStat: {
    alignItems: "center",
  },
  headerStatValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 2,
  },
  headerStatLabel: {
    fontSize: 11,
    color: "#fff",
    opacity: 0.8,
  },
  headerStatDivider: {
    width: 1,
    height: "70%",
    backgroundColor: "rgba(255,255,255,0.3)",
    alignSelf: "center",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statCardValue: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  statCardLabel: {
    fontSize: 10,
  },
  missionsSection: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: "500",
  },
  missionCard: {
    padding: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  firstMission: {
    borderWidth: 2,
    borderColor: "rgba(184, 134, 11, 0.3)",
  },
  missionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  missionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  missionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  missionType: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  missionClient: {
    fontSize: 12,
  },
  missionDistance: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
  },
  missionDistanceText: {
    fontSize: 11,
    fontWeight: "500",
  },
  missionDescription: {
    fontSize: 13,
    marginBottom: 12,
  },
  missionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  missionTime: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
  },
  missionTimeText: {
    fontSize: 11,
    fontWeight: "500",
  },
  missionReward: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptyContainer: {
    alignItems: "center",
    padding: 32,
    borderRadius: 20,
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
  tabBarSpace: {
    height: 80,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxWidth: 400,
    padding: 24,
    borderRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
  },
  modalIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
  },
  modalClient: {
    fontSize: 14,
  },
  modalDetails: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  modalDetail: {
    alignItems: "center",
    gap: 4,
  },
  modalDetailText: {
    fontSize: 14,
    fontWeight: "500",
  },
  modalDescription: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    gap: 8,
  },
  modalDescriptionText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  modalAddressText: {
    fontSize: 12,
    textAlign: "center",
  },
  modalActions: {
    gap: 10,
  },
  modalAcceptButton: {
    padding: 16,
    borderRadius: 30,
    alignItems: "center",
  },
  modalAcceptText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalCloseButton: {
    padding: 14,
    borderRadius: 30,
    borderWidth: 1,
    alignItems: "center",
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
