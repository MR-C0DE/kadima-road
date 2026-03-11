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
  createdAt: string;
}

interface HelperStats {
  todayEarnings: number;
  todayMissions: number;
  averageRating: number;
  totalMissions: number;
  availability: boolean;
  responseRate: number;
  completedToday: number;
}

interface HelperProfile {
  services: string[];
  equipment: string[];
  pricing: {
    basePrice: number;
    perKm: number;
  };
  availability: {
    schedule: any[];
  };
  status: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // États
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [stats, setStats] = useState<HelperStats>({
    todayEarnings: 0,
    todayMissions: 0,
    averageRating: 4.9,
    totalMissions: 0,
    availability: true,
    responseRate: 98,
    completedToday: 0,
  });
  const [availableMissions, setAvailableMissions] = useState<Mission[]>([]);
  const [showWelcome, setShowWelcome] = useState(true);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const welcomeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animation d'entrée
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

    // Animation de pulsation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animation de bienvenue
    setTimeout(() => {
      Animated.timing(welcomeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => setShowWelcome(false));
    }, 3000);

    checkProfileAndLoadData();
  }, []);

  const checkProfileAndLoadData = async () => {
    try {
      // Vérifier d'abord si le profil helper existe
      const profileResponse = await api.get("/auth/helper/profile");
      const helperProfile: HelperProfile = profileResponse.data.data;

      setHasProfile(true);

      // Vérifier si le profil est complété
      const isComplete =
        helperProfile.services?.length > 0 &&
        helperProfile.pricing?.basePrice > 0 &&
        helperProfile.availability?.schedule?.length > 0;

      setProfileComplete(isComplete);

      if (!isComplete) {
        setShowProfileModal(true);
      }

      // Charger les données si le profil existe
      await loadData();
    } catch (error) {
      // Pas de profil helper
      setHasProfile(false);
      setProfileComplete(false);
      setShowProfileModal(true);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      // Charger les statistiques
      if (user?.id && hasProfile) {
        try {
          const statsResponse = await api.get(`/helpers/stats/${user.id}`);
          setStats((prev) => ({ ...prev, ...statsResponse.data.data }));
        } catch (statsError) {
          console.log("Stats non disponibles");
        }
      }

      setAvailableMissions([]);
    } catch (error) {
      console.error("Erreur chargement données:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await loadData();
    setRefreshing(false);
  };

  const toggleAvailability = async () => {
    if (!profileComplete) {
      Alert.alert(
        "Profil incomplet",
        "Complétez d'abord votre profil pour changer votre statut",
        [
          { text: "Plus tard", style: "cancel" },
          {
            text: "Compléter",
            onPress: () => router.push("/(onboarding)/welcome"),
          },
        ]
      );
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    try {
      const newStatus = !isAvailable;
      await api.put("/helpers/availability", { isAvailable: newStatus });
      setIsAvailable(newStatus);
      Alert.alert(
        "Succès",
        `Vous êtes maintenant ${newStatus ? "disponible" : "indisponible"}`
      );
    } catch (error) {
      Alert.alert("Erreur", "Impossible de changer votre statut");
    }
  };

  const acceptMission = async (missionId: string) => {
    if (!profileComplete) {
      Alert.alert(
        "Profil incomplet",
        "Complétez d'abord votre profil pour accepter des missions"
      );
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    try {
      await api.post(`/helpers/accept-mission/${missionId}`);
      Alert.alert("Succès", "Mission acceptée !");
      loadData();
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'accepter la mission");
    }
  };

  const navigateToOnboarding = () => {
    setShowProfileModal(false);
    router.push("/(onboarding)/welcome");
  };

  const getTimeColor = (minutes: number) => {
    if (minutes < 10) return "#4CAF50";
    if (minutes < 20) return "#FF9800";
    return "#E63946";
  };

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
            <Ionicons name="construct" size={60} color={colors.primary} />
          </View>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Chargement de votre espace...
          </Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Modal de profil incomplet */}
      <Modal
        visible={showProfileModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <BlurView intensity={80} tint={colorScheme} style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.background,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View
              style={[
                styles.modalIcon,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Ionicons name="construct" size={50} color={colors.primary} />
            </View>

            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {!hasProfile
                ? "Bienvenue dans Kadima Helpers !"
                : "Profil incomplet"}
            </Text>

            <Text style={[styles.modalText, { color: colors.textSecondary }]}>
              {!hasProfile
                ? "Pour commencer à recevoir des missions, vous devez d'abord créer votre profil helper."
                : "Votre profil n'est pas encore complet. Ajoutez vos services, tarifs et disponibilités pour commencer."}
            </Text>

            <View style={styles.modalSteps}>
              <View style={styles.modalStep}>
                <View
                  style={[
                    styles.modalStepDot,
                    { backgroundColor: colors.primary },
                  ]}
                />
                <Text style={[styles.modalStepText, { color: colors.text }]}>
                  Services proposés
                </Text>
              </View>
              <View style={styles.modalStep}>
                <View
                  style={[
                    styles.modalStepDot,
                    { backgroundColor: colors.primary },
                  ]}
                />
                <Text style={[styles.modalStepText, { color: colors.text }]}>
                  Zone d'intervention
                </Text>
              </View>
              <View style={styles.modalStep}>
                <View
                  style={[
                    styles.modalStepDot,
                    { backgroundColor: colors.primary },
                  ]}
                />
                <Text style={[styles.modalStepText, { color: colors.text }]}>
                  Tarifs
                </Text>
              </View>
              <View style={styles.modalStep}>
                <View
                  style={[
                    styles.modalStepDot,
                    { backgroundColor: colors.primary },
                  ]}
                />
                <Text style={[styles.modalStepText, { color: colors.text }]}>
                  Disponibilités
                </Text>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={navigateToOnboarding}
              >
                <Text style={styles.modalButtonText}>
                  {!hasProfile ? "Créer mon profil" : "Compléter mon profil"}
                </Text>
              </TouchableOpacity>

              {hasProfile && (
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    {
                      backgroundColor: "transparent",
                      borderWidth: 1,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setShowProfileModal(false)}
                >
                  <Text
                    style={[
                      styles.modalButtonText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Plus tard
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        </BlurView>
      </Modal>

      {/* Message de bienvenue animé */}
      {showWelcome && (
        <Animated.View
          style={[
            styles.welcomeOverlay,
            {
              opacity: welcomeAnim,
              backgroundColor: colors.primary + "F2",
            },
          ]}
        >
          <Ionicons name="hand-left" size={60} color="#fff" />
          <Text style={styles.welcomeTitle}>Bonjour {user?.name} !</Text>
          <Text style={styles.welcomeSubtitle}>
            Prêt à aider des conducteurs ?
          </Text>
        </Animated.View>
      )}

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
          {/* En-tête avec statut */}
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.headerGreeting}>Bonjour,</Text>
                <Text style={styles.headerName}>{user?.name || "Helper"}</Text>
              </View>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity
                  style={[
                    styles.availabilityButton,
                    {
                      backgroundColor: isAvailable ? "#4CAF50" : "#E63946",
                      opacity: profileComplete ? 1 : 0.5,
                    },
                  ]}
                  onPress={toggleAvailability}
                  activeOpacity={0.8}
                  disabled={!profileComplete}
                >
                  <View style={styles.availabilityDot} />
                  <Text style={styles.availabilityText}>
                    {isAvailable ? "Disponible" : "Indisponible"}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </View>

            {/* Quick stats dans le header */}
            <View style={styles.headerStats}>
              <View style={styles.headerStat}>
                <Text style={styles.headerStatValue}>
                  {stats.todayMissions}
                </Text>
                <Text style={styles.headerStatLabel}>aujourd'hui</Text>
              </View>
              <View style={styles.headerStatDivider} />
              <View style={styles.headerStat}>
                <Text style={styles.headerStatValue}>
                  {stats.todayEarnings}€
                </Text>
                <Text style={styles.headerStatLabel}>gagnés</Text>
              </View>
              <View style={styles.headerStatDivider} />
              <View style={styles.headerStat}>
                <Text style={styles.headerStatValue}>
                  {stats.responseRate}%
                </Text>
                <Text style={styles.headerStatLabel}>réponse</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Cartes de statistiques */}
          <View style={styles.statsGrid}>
            <LinearGradient
              colors={[colors.primary + "15", colors.secondary + "05"]}
              style={styles.statCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View
                style={[
                  styles.statIcon,
                  { backgroundColor: colors.primary + "20" },
                ]}
              >
                <Ionicons name="star" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stats.averageRating.toFixed(1)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Note moyenne
              </Text>
            </LinearGradient>

            <LinearGradient
              colors={[colors.primary + "15", colors.secondary + "05"]}
              style={styles.statCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View
                style={[
                  styles.statIcon,
                  { backgroundColor: colors.primary + "20" },
                ]}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stats.totalMissions}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Missions totales
              </Text>
            </LinearGradient>

            <LinearGradient
              colors={[colors.primary + "15", colors.secondary + "05"]}
              style={styles.statCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View
                style={[
                  styles.statIcon,
                  { backgroundColor: colors.primary + "20" },
                ]}
              >
                <Ionicons name="time" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stats.completedToday}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Complétées
              </Text>
            </LinearGradient>
          </View>

          {/* Message si profil incomplet */}
          {!profileComplete && (
            <TouchableOpacity
              style={[
                styles.incompleteCard,
                { backgroundColor: colors.warning + "20" },
              ]}
              onPress={() => setShowProfileModal(true)}
            >
              <Ionicons name="alert-circle" size={24} color={colors.warning} />
              <View style={styles.incompleteContent}>
                <Text style={[styles.incompleteTitle, { color: colors.text }]}>
                  Profil incomplet
                </Text>
                <Text
                  style={[
                    styles.incompleteText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Complétez votre profil pour commencer
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={24}
                color={colors.warning}
              />
            </TouchableOpacity>
          )}

          {/* Missions disponibles */}
          <View style={styles.missionsSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Missions disponibles
              </Text>
              {availableMissions.length > 0 && (
                <View
                  style={[
                    styles.missionCount,
                    { backgroundColor: colors.primary + "20" },
                  ]}
                >
                  <Text
                    style={[styles.missionCountText, { color: colors.primary }]}
                  >
                    {availableMissions.length}
                  </Text>
                </View>
              )}
            </View>

            {!profileComplete ? (
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
                  <Ionicons name="construct" size={50} color={colors.primary} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  Profil incomplet
                </Text>
                <Text
                  style={[styles.emptyText, { color: colors.textSecondary }]}
                >
                  Complétez votre profil pour voir les missions disponibles
                </Text>
                <TouchableOpacity
                  style={[
                    styles.emptyButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={() => router.push("/(onboarding)/welcome")}
                >
                  <Text style={styles.emptyButtonText}>
                    Compléter mon profil
                  </Text>
                </TouchableOpacity>
              </BlurView>
            ) : availableMissions.length > 0 ? (
              availableMissions.map((mission, index) => (
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
                            outputRange: [0, 20 * (index + 1)],
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
                    <View style={styles.missionHeader}>
                      <View style={styles.missionUser}>
                        <View
                          style={[
                            styles.missionAvatar,
                            { backgroundColor: colors.primary + "20" },
                          ]}
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
                        </View>
                        <View style={styles.missionUserInfo}>
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
                              { color: colors.primary },
                            ]}
                          >
                            {mission.type}
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
                          name="location"
                          size={12}
                          color={colors.primary}
                        />
                        <Text
                          style={[
                            styles.missionDistanceText,
                            { color: colors.primary },
                          ]}
                        >
                          {mission.distance} km
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={[
                        styles.missionDescription,
                        { color: colors.textSecondary },
                      ]}
                      numberOfLines={2}
                    >
                      {mission.problem.description}
                    </Text>

                    <View style={styles.missionFooter}>
                      <View style={styles.missionMeta}>
                        <View
                          style={[
                            styles.missionTime,
                            {
                              backgroundColor:
                                getTimeColor(mission.estimatedTimeMinutes) +
                                "20",
                            },
                          ]}
                        >
                          <Ionicons
                            name="time"
                            size={14}
                            color={getTimeColor(mission.estimatedTimeMinutes)}
                          />
                          <Text
                            style={[
                              styles.missionTimeText,
                              {
                                color: getTimeColor(
                                  mission.estimatedTimeMinutes
                                ),
                              },
                            ]}
                          >
                            {mission.estimatedTime}
                          </Text>
                        </View>
                        <View style={styles.missionReward}>
                          <Text
                            style={[
                              styles.missionRewardText,
                              { color: colors.success },
                            ]}
                          >
                            +{mission.reward} €
                          </Text>
                        </View>
                      </View>

                      <View style={styles.missionActions}>
                        <TouchableOpacity
                          style={[
                            styles.acceptButton,
                            { backgroundColor: colors.success },
                          ]}
                          onPress={() => acceptMission(mission._id)}
                        >
                          <Text style={styles.acceptButtonText}>Accepter</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.detailsButton,
                            { borderColor: colors.border },
                          ]}
                          onPress={() =>
                            router.push(`/missions/${mission._id}`)
                          }
                        >
                          <Text
                            style={[
                              styles.detailsButtonText,
                              { color: colors.textSecondary },
                            ]}
                          >
                            Détails
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </LinearGradient>
                </Animated.View>
              ))
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
                  Aucune mission disponible
                </Text>
                <Text
                  style={[styles.emptyText, { color: colors.textSecondary }]}
                >
                  Les nouvelles missions apparaîtront ici
                </Text>
              </BlurView>
            )}
          </View>

          {/* Conseil du jour */}
          <LinearGradient
            colors={[colors.primary + "10", colors.secondary + "05"]}
            style={styles.tipCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View
              style={[
                styles.tipIcon,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Ionicons name="bulb" size={24} color={colors.primary} />
            </View>
            <View style={styles.tipContent}>
              <Text style={[styles.tipTitle, { color: colors.text }]}>
                Conseil du jour
              </Text>
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                Restez dans un rayon de 10 km pour augmenter vos chances de
                missions
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  welcomeOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 20,
    marginBottom: 10,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#fff",
    opacity: 0.9,
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
  content: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerGreeting: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
    marginBottom: 4,
  },
  headerName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  availabilityButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 8,
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  availabilityText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  headerStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    padding: 15,
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
    height: "80%",
    backgroundColor: "rgba(255,255,255,0.3)",
    alignSelf: "center",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: -20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: 15,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
  },
  missionsSection: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  missionCount: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
  },
  missionCountText: {
    fontSize: 12,
    fontWeight: "600",
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
  missionDistance: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    gap: 4,
  },
  missionDistanceText: {
    fontSize: 12,
    fontWeight: "500",
  },
  missionDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  missionFooter: {
    gap: 12,
  },
  missionMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  missionTime: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    gap: 4,
  },
  missionTimeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  missionReward: {
    flexDirection: "row",
    alignItems: "center",
  },
  missionRewardText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  missionActions: {
    flexDirection: "row",
    gap: 10,
  },
  acceptButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 15,
    alignItems: "center",
  },
  acceptButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  detailsButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
  },
  detailsButtonText: {
    fontSize: 15,
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    padding: 40,
    borderRadius: 20,
    overflow: "hidden",
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
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
  tipCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 16,
    borderRadius: 20,
    gap: 15,
  },
  tipIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    padding: 30,
    borderRadius: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  modalIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },
  modalText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 22,
  },
  modalSteps: {
    width: "100%",
    marginBottom: 30,
    gap: 12,
  },
  modalStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  modalStepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modalStepText: {
    fontSize: 14,
  },
  modalButtons: {
    width: "100%",
    gap: 10,
  },
  modalButton: {
    padding: 16,
    borderRadius: 15,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  incompleteCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  incompleteContent: {
    flex: 1,
  },
  incompleteTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  incompleteText: {
    fontSize: 13,
  },
  emptyButton: {
    marginTop: 20,
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
  },
  emptyButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
