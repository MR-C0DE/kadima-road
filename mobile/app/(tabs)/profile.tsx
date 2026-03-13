import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Dimensions,
  Animated,
  Easing,
  Platform,
  RefreshControl,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { api } from "../../config/api";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { format, formatDistance, formatRelative } from "date-fns";
import { fr } from "date-fns/locale";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");

interface Vehicle {
  _id?: string;
  make: string;
  model: string;
  year: string;
  licensePlate: string;
  color: string;
  isDefault: boolean;
}

interface Intervention {
  _id: string;
  type: string;
  status: string;
  createdAt: string;
  problem?: {
    description: string;
    category: string;
  };
}

interface UserDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  isHelper: boolean;
  createdAt: string;
  lastLogin?: string;
  stats?: {
    interventionsAsUser: number;
    totalSpent: number;
    averageRating?: number;
    completedInterventions?: number;
  };
  vehicles?: Vehicle[];
  recentInterventions?: Intervention[];
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { effectiveTheme, setTheme } = useTheme();
  const colors = Colors[effectiveTheme];

  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [vehicleForm, setVehicleForm] = useState({
    make: "",
    model: "",
    year: "",
    licensePlate: "",
    color: "",
    isDefault: false,
  });
  const [activeTab, setActiveTab] = useState("info");

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;
  const avatarRotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      if (loading) {
        console.log("⚠️ Timeout de sécurité - affichage forcé");
        setLoading(false);
      }
    }, 8000);

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
      Animated.loop(
        Animated.sequence([
          Animated.timing(avatarRotateAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(avatarRotateAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();

    fetchUserProfile();

    return () => clearTimeout(safetyTimeout);
  }, []);

  useEffect(() => {
    const tabIndex =
      activeTab === "info" ? 0 : activeTab === "vehicles" ? 1 : 2;
    Animated.spring(tabIndicatorAnim, {
      toValue: tabIndex,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  // ============================================
  // FONCTIONS DE FORMATAGE DE DATES (SÉCURISÉES)
  // ============================================

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Date inconnue";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Date inconnue";

      return formatRelative(date, new Date(), { locale: fr });
    } catch (error) {
      return "Date inconnue";
    }
  };

  const formatMemberSince = (dateString?: string) => {
    if (!dateString) return "Date inconnue";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Date inconnue";

      return format(date, "MMMM yyyy", { locale: fr });
    } catch (error) {
      return "Date inconnue";
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await api.get("/auth/user/me");
      setUserDetails(response.data.data);
    } catch (error) {
      Alert.alert("Erreur", "Impossible de charger le profil");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserProfile();
  };

  const handleLogout = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Alert.alert("Déconnexion", "Voulez-vous vraiment vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Se déconnecter", onPress: logout, style: "destructive" },
    ]);
  };

  const openAddVehicleModal = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEditingVehicle(null);
    setVehicleForm({
      make: "",
      model: "",
      year: "",
      licensePlate: "",
      color: "",
      isDefault: false,
    });
    setModalVisible(true);
  };

  const openEditVehicleModal = (vehicle: Vehicle) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEditingVehicle(vehicle);
    setVehicleForm({
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      licensePlate: vehicle.licensePlate,
      color: vehicle.color,
      isDefault: vehicle.isDefault,
    });
    setModalVisible(true);
  };

  const handleSaveVehicle = async () => {
    if (
      !vehicleForm.make ||
      !vehicleForm.model ||
      !vehicleForm.year ||
      !vehicleForm.licensePlate
    ) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires");
      return;
    }

    setLoading(true);
    try {
      if (editingVehicle) {
        await api.put(`/users/vehicles/${editingVehicle._id}`, vehicleForm);
        Alert.alert("Succès", "Véhicule modifié avec succès");
      } else {
        await api.post("/users/vehicles", vehicleForm);
        Alert.alert("Succès", "Véhicule ajouté avec succès");
      }
      setModalVisible(false);
      fetchUserProfile();
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de sauvegarder le véhicule");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVehicle = (vehicleId: string) => {
    Alert.alert("Supprimer", "Voulez-vous vraiment supprimer ce véhicule ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          try {
            await api.delete(`/users/vehicles/${vehicleId}`);
            Alert.alert("Succès", "Véhicule supprimé");
            fetchUserProfile();
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
            }
          } catch (error) {
            Alert.alert("Erreur", "Impossible de supprimer le véhicule");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleSetDefaultVehicle = async (vehicleId: string) => {
    setLoading(true);
    try {
      await api.put(`/users/vehicles/${vehicleId}`, { isDefault: true });
      Alert.alert("Succès", "Véhicule principal défini");
      fetchUserProfile();
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de définir le véhicule principal");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return colors.success;
      case "pending":
        return colors.warning;
      case "cancelled":
        return colors.error;
      case "accepted":
        return colors.info;
      default:
        return colors.icon;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return "checkmark-circle";
      case "pending":
        return "time";
      case "cancelled":
        return "close-circle";
      case "accepted":
        return "car";
      default:
        return "ellipse";
    }
  };

  const avatarRotate = avatarRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["-5deg", "5deg"],
  });

  const tabIndicatorPosition = tabIndicatorAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, (width - 60) / 3, ((width - 60) / 3) * 2],
  });

  if (loading && !refreshing) {
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
            <Ionicons name="car-sport" size={60} color={colors.primary} />
          </Animated.View>
          <Text style={[styles.loadingText, { color: colors.primary }]}>
            Chargement du profil...
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
      <StatusBar
        barStyle={effectiveTheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />

      {/* Fond animé */}
      <LinearGradient
        colors={
          effectiveTheme === "dark"
            ? [colors.primary + "15", colors.secondary + "15", "transparent"]
            : [colors.primary + "08", colors.secondary + "08", "transparent"]
        }
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Cercles décoratifs animés */}
      <Animated.View
        style={[
          styles.decorativeCircle,
          styles.circle1,
          {
            backgroundColor: colors.primary + "08",
            transform: [
              {
                scale: slideAnim.interpolate({
                  inputRange: [0, 50],
                  outputRange: [1, 1.3],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.decorativeCircle,
          styles.circle2,
          {
            backgroundColor: colors.secondary + "08",
            transform: [
              {
                scale: slideAnim.interpolate({
                  inputRange: [0, 50],
                  outputRange: [1, 1.2],
                }),
              },
            ],
          },
        ]}
      />

      <ScrollView
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
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
            },
          ]}
        >
          {/* En-tête luxueux */}
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.headerPattern}>
              {[...Array(5)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.patternDot,
                    { backgroundColor: colors.background + "10" },
                  ]}
                />
              ))}
            </View>

            <View style={styles.headerContent}>
              <Animated.View
                style={[
                  styles.avatarWrapper,
                  { transform: [{ rotate: avatarRotate }] },
                ]}
              >
                <LinearGradient
                  colors={["#FFFFFF", "#F5F5F5"]}
                  style={styles.avatarGradient}
                >
                  <Text style={[styles.avatarText, { color: colors.primary }]}>
                    {userDetails?.firstName?.[0]}
                    {userDetails?.lastName?.[0]}
                  </Text>
                </LinearGradient>
                {userDetails?.isHelper && (
                  <View style={styles.verifiedBadge}>
                    <LinearGradient
                      colors={["#4CAF50", "#45A049"]}
                      style={styles.verifiedBadgeGradient}
                    >
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    </LinearGradient>
                  </View>
                )}
              </Animated.View>

              <Text style={[styles.name, { color: colors.background }]}>
                {userDetails?.firstName} {userDetails?.lastName}
              </Text>
              <Text
                style={[
                  styles.email,
                  { color: colors.background, opacity: 0.9 },
                ]}
              >
                {userDetails?.email}
              </Text>

              {userDetails?.lastLogin && (
                <View style={styles.lastLoginContainer}>
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color={colors.background}
                  />
                  <Text
                    style={[styles.lastLoginText, { color: colors.background }]}
                  >
                    Dernière connexion{" "}
                    {formatDistance(
                      new Date(userDetails.lastLogin),
                      new Date(),
                      { addSuffix: true, locale: fr }
                    )}
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>

          {/* Cartes statistiques élégantes */}
          <View style={styles.statsGrid}>
            {[
              {
                icon: "car",
                value: userDetails?.stats?.interventionsAsUser || 0,
                label: "Interventions",
                colors: [colors.primary + "20", colors.secondary + "10"],
              },
              {
                icon: "wallet",
                value:
                  (userDetails?.stats?.totalSpent?.toFixed(2) || "0") + " $",
                label: "Dépensé",
                colors: [colors.secondary + "20", colors.primary + "10"],
              },
              {
                icon: "star",
                value: userDetails?.stats?.averageRating?.toFixed(1) || "5.0",
                label: "Note",
                colors: [colors.primary + "20", colors.secondary + "10"],
              },
            ].map((stat, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.statCardWrapper,
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
                <LinearGradient
                  colors={stat.colors}
                  style={styles.statCard}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View
                    style={[
                      styles.statIconContainer,
                      { backgroundColor: colors.background },
                    ]}
                  >
                    <Ionicons
                      name={stat.icon}
                      size={20}
                      color={colors.primary}
                    />
                  </View>
                  <Text style={[styles.statNumber, { color: colors.text }]}>
                    {stat.value}
                  </Text>
                  <Text
                    style={[styles.statLabel, { color: colors.textSecondary }]}
                  >
                    {stat.label}
                  </Text>
                </LinearGradient>
              </Animated.View>
            ))}
          </View>

          {/* Carte membre */}
          <Animated.View
            style={[
              styles.memberCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={[colors.surface, colors.surface]}
              style={styles.memberCardGradient}
            >
              <View style={styles.memberIconContainer}>
                <Ionicons name="calendar" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.memberText, { color: colors.text }]}>
                Membre depuis {formatMemberSince(userDetails?.createdAt)}
              </Text>
            </LinearGradient>
          </Animated.View>

          {/* Tabs élégants */}
          <View style={styles.tabContainer}>
            {["info", "vehicles", "history"].map((tab, index) => (
              <TouchableOpacity
                key={tab}
                style={styles.tabButton}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color:
                        activeTab === tab
                          ? colors.primary
                          : colors.textSecondary,
                      fontWeight: activeTab === tab ? "600" : "400",
                    },
                  ]}
                >
                  {tab === "info"
                    ? "Infos"
                    : tab === "vehicles"
                    ? "Véhicules"
                    : "Historique"}
                </Text>
              </TouchableOpacity>
            ))}
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

          {/* Contenu des tabs */}
          <View style={styles.tabContent}>
            {/* Tab Informations */}
            {activeTab === "info" && (
              <Animated.View style={[styles.infoTab, { opacity: fadeAnim }]}>
                <LinearGradient
                  colors={[colors.surface, colors.surface]}
                  style={styles.infoCard}
                >
                  {[
                    {
                      icon: "call-outline",
                      label: "Téléphone",
                      value: userDetails?.phone || "Non renseigné",
                    },
                    {
                      icon: "mail-outline",
                      label: "Email",
                      value: userDetails?.email,
                    },
                    {
                      icon: "person-outline",
                      label: "Rôle",
                      value:
                        userDetails?.role === "admin"
                          ? "Administrateur"
                          : "Utilisateur",
                    },
                  ].map((item, index) => (
                    <Animated.View
                      key={index}
                      style={[
                        styles.infoRow,
                        {
                          opacity: fadeAnim,
                          transform: [
                            {
                              translateX: slideAnim.interpolate({
                                inputRange: [0, 50],
                                outputRange: [0, 10 * (index + 1)],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.infoIconContainer,
                          { backgroundColor: colors.primary + "10" },
                        ]}
                      >
                        <Ionicons
                          name={item.icon}
                          size={18}
                          color={colors.primary}
                        />
                      </View>
                      <View style={styles.infoTextContainer}>
                        <Text
                          style={[
                            styles.infoLabel,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {item.label}
                        </Text>
                        <Text
                          style={[styles.infoValue, { color: colors.text }]}
                        >
                          {item.value}
                        </Text>
                      </View>
                    </Animated.View>
                  ))}

                  {userDetails?.isHelper && (
                    <Animated.View
                      style={[
                        styles.helperInfo,
                        {
                          opacity: fadeAnim,
                          transform: [{ translateY: slideAnim }],
                        },
                      ]}
                    >
                      <LinearGradient
                        colors={[
                          colors.primary + "15",
                          colors.secondary + "10",
                        ]}
                        style={styles.helperGradient}
                      >
                        <Ionicons
                          name="star"
                          size={18}
                          color={colors.primary}
                        />
                        <Text
                          style={[
                            styles.helperInfoText,
                            { color: colors.primary },
                          ]}
                        >
                          Helper certifié •{" "}
                          {userDetails.stats?.completedInterventions || 0}{" "}
                          interventions
                        </Text>
                      </LinearGradient>
                    </Animated.View>
                  )}
                </LinearGradient>
              </Animated.View>
            )}

            {/* Tab Véhicules */}
            {activeTab === "vehicles" && (
              <Animated.View
                style={[styles.vehiclesTab, { opacity: fadeAnim }]}
              >
                <View style={styles.vehiclesHeader}>
                  <Text
                    style={[
                      styles.vehiclesCount,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {userDetails?.vehicles?.length || 0} véhicule(s)
                  </Text>
                  <TouchableOpacity
                    onPress={openAddVehicleModal}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={[colors.primary, colors.secondary]}
                      style={styles.addVehicleButton}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Ionicons name="add" size={18} color="#fff" />
                      <Text style={styles.addVehicleText}>Ajouter</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                {userDetails?.vehicles && userDetails.vehicles.length > 0 ? (
                  userDetails.vehicles.map((vehicle, index) => (
                    <Animated.View
                      key={index}
                      style={[
                        styles.vehicleCard,
                        {
                          opacity: fadeAnim,
                          transform: [
                            {
                              translateX: slideAnim.interpolate({
                                inputRange: [0, 50],
                                outputRange: [0, 15 * (index + 1)],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      <LinearGradient
                        colors={[colors.surface, colors.surface]}
                        style={styles.vehicleGradient}
                      >
                        <View style={styles.vehicleHeader}>
                          <View style={styles.vehicleTitle}>
                            <View
                              style={[
                                styles.vehicleIconContainer,
                                { backgroundColor: colors.primary + "10" },
                              ]}
                            >
                              <Ionicons
                                name="car"
                                size={20}
                                color={colors.primary}
                              />
                            </View>
                            <Text
                              style={[
                                styles.vehicleMake,
                                { color: colors.text },
                              ]}
                            >
                              {vehicle.make} {vehicle.model}
                            </Text>
                          </View>
                          <View style={styles.vehicleActions}>
                            <TouchableOpacity
                              onPress={() => openEditVehicleModal(vehicle)}
                              style={styles.vehicleAction}
                            >
                              <Ionicons
                                name="create-outline"
                                size={18}
                                color={colors.primary}
                              />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleDeleteVehicle(vehicle._id!)}
                              style={styles.vehicleAction}
                            >
                              <Ionicons
                                name="trash-outline"
                                size={18}
                                color={colors.error}
                              />
                            </TouchableOpacity>
                          </View>
                        </View>

                        <View style={styles.vehicleDetails}>
                          <View style={styles.vehicleDetailItem}>
                            <Ionicons
                              name="calendar-outline"
                              size={14}
                              color={colors.textSecondary}
                            />
                            <Text
                              style={[
                                styles.vehicleDetailText,
                                { color: colors.textSecondary },
                              ]}
                            >
                              {vehicle.year}
                            </Text>
                          </View>
                          <View style={styles.vehicleDetailItem}>
                            <Ionicons
                              name="color-palette-outline"
                              size={14}
                              color={colors.textSecondary}
                            />
                            <Text
                              style={[
                                styles.vehicleDetailText,
                                { color: colors.textSecondary },
                              ]}
                            >
                              {vehicle.color || "Non spécifiée"}
                            </Text>
                          </View>
                          <View style={styles.vehicleDetailItem}>
                            <Ionicons
                              name="id-card-outline"
                              size={14}
                              color={colors.textSecondary}
                            />
                            <Text
                              style={[
                                styles.vehicleDetailText,
                                { color: colors.textSecondary },
                              ]}
                            >
                              {vehicle.licensePlate}
                            </Text>
                          </View>
                        </View>

                        {vehicle.isDefault ? (
                          <View
                            style={[
                              styles.defaultBadge,
                              { backgroundColor: colors.success },
                            ]}
                          >
                            <Ionicons name="checkmark" size={12} color="#fff" />
                            <Text style={styles.defaultBadgeText}>
                              Principal
                            </Text>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={[
                              styles.setDefaultButton,
                              { borderColor: colors.primary },
                            ]}
                            onPress={() =>
                              handleSetDefaultVehicle(vehicle._id!)
                            }
                          >
                            <Text
                              style={[
                                styles.setDefaultText,
                                { color: colors.primary },
                              ]}
                            >
                              Définir comme principal
                            </Text>
                          </TouchableOpacity>
                        )}
                      </LinearGradient>
                    </Animated.View>
                  ))
                ) : (
                  <LinearGradient
                    colors={[colors.surface, colors.surface]}
                    style={styles.emptyVehicles}
                  >
                    <View
                      style={[
                        styles.emptyIconContainer,
                        { backgroundColor: colors.primary + "10" },
                      ]}
                    >
                      <Ionicons
                        name="car-outline"
                        size={40}
                        color={colors.primary}
                      />
                    </View>
                    <Text
                      style={[
                        styles.emptyText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Aucun véhicule enregistré
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.emptyAddButton,
                        { backgroundColor: colors.primary },
                      ]}
                      onPress={openAddVehicleModal}
                    >
                      <Text style={styles.emptyAddButtonText}>
                        Ajouter un véhicule
                      </Text>
                    </TouchableOpacity>
                  </LinearGradient>
                )}
              </Animated.View>
            )}

            {/* Tab Historique */}
            {activeTab === "history" && (
              <Animated.View style={[styles.historyTab, { opacity: fadeAnim }]}>
                <Text style={[styles.historyTitle, { color: colors.text }]}>
                  Interventions récentes
                </Text>

                {userDetails?.recentInterventions &&
                userDetails.recentInterventions.length > 0 ? (
                  userDetails.recentInterventions.map((intervention, index) => (
                    <Animated.View
                      key={intervention._id}
                      style={[
                        styles.historyCard,
                        {
                          opacity: fadeAnim,
                          transform: [
                            {
                              translateX: slideAnim.interpolate({
                                inputRange: [0, 50],
                                outputRange: [0, 15 * (index + 1)],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      <LinearGradient
                        colors={[colors.surface, colors.surface]}
                        style={styles.historyGradient}
                      >
                        <View
                          style={[
                            styles.historyIconContainer,
                            {
                              backgroundColor:
                                getStatusColor(intervention.status) + "15",
                            },
                          ]}
                        >
                          <Ionicons
                            name={getStatusIcon(intervention.status)}
                            size={24}
                            color={getStatusColor(intervention.status)}
                          />
                        </View>
                        <View style={styles.historyContent}>
                          <View style={styles.historyHeader}>
                            <Text
                              style={[
                                styles.historyType,
                                { color: colors.text },
                              ]}
                            >
                              {intervention.type === "sos"
                                ? "SOS Urgence"
                                : "Assistance"}
                            </Text>
                            <View
                              style={[
                                styles.historyStatus,
                                {
                                  backgroundColor:
                                    getStatusColor(intervention.status) + "15",
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.historyStatusText,
                                  {
                                    color: getStatusColor(intervention.status),
                                  },
                                ]}
                              >
                                {intervention.status === "completed"
                                  ? "Terminé"
                                  : intervention.status === "pending"
                                  ? "En attente"
                                  : intervention.status === "cancelled"
                                  ? "Annulé"
                                  : "En cours"}
                              </Text>
                            </View>
                          </View>
                          <Text
                            style={[
                              styles.historyDescription,
                              { color: colors.textSecondary },
                            ]}
                            numberOfLines={2}
                          >
                            {intervention.problem?.description ||
                              "Intervention sans description"}
                          </Text>
                          <View style={styles.historyFooter}>
                            <Ionicons
                              name="time-outline"
                              size={12}
                              color={colors.textSecondary}
                            />
                            <Text
                              style={[
                                styles.historyDate,
                                { color: colors.textSecondary },
                              ]}
                            >
                              {formatDate(intervention.createdAt)}
                            </Text>
                          </View>
                        </View>
                      </LinearGradient>
                    </Animated.View>
                  ))
                ) : (
                  <LinearGradient
                    colors={[colors.surface, colors.surface]}
                    style={styles.emptyHistory}
                  >
                    <View
                      style={[
                        styles.emptyIconContainer,
                        { backgroundColor: colors.primary + "10" },
                      ]}
                    >
                      <Ionicons
                        name="time-outline"
                        size={40}
                        color={colors.primary}
                      />
                    </View>
                    <Text
                      style={[
                        styles.emptyText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Aucune intervention récente
                    </Text>
                    <Text
                      style={[
                        styles.emptySubtext,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Utilisez SOS ou Diagnostic pour commencer
                    </Text>
                  </LinearGradient>
                )}
              </Animated.View>
            )}
          </View>

          {/* Actions rapides */}
          <View style={styles.actionsGrid}>
            {[
              {
                icon: "settings-outline",
                label: "Paramètres",
                gradient: [colors.primary + "20", colors.secondary + "10"],
              },
              {
                icon: "help-circle-outline",
                label: "Aide",
                gradient: [colors.primary + "20", colors.secondary + "10"],
              },
              {
                icon: "log-out-outline",
                label: "Déconnexion",
                gradient: [colors.error + "20", colors.error + "10"],
                onPress: handleLogout,
              },
            ].map((action, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.actionItemWrapper,
                  {
                    opacity: fadeAnim,
                    transform: [
                      {
                        translateY: slideAnim.interpolate({
                          inputRange: [0, 50],
                          outputRange: [0, 10 * (index + 1)],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={action.onPress}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={action.gradient}
                    style={styles.actionGradient}
                  >
                    <Ionicons
                      name={action.icon}
                      size={22}
                      color={
                        action.icon === "log-out-outline"
                          ? colors.error
                          : colors.primary
                      }
                    />
                    <Text style={[styles.actionLabel, { color: colors.text }]}>
                      {action.label}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Modal véhicule */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <BlurView
          intensity={80}
          tint={effectiveTheme}
          style={styles.modalOverlay}
        >
          <Animated.View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.background,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={[colors.primary + "10", colors.secondary + "05"]}
              style={styles.modalGradient}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {editingVehicle
                    ? "Modifier le véhicule"
                    : "Ajouter un véhicule"}
                </Text>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons
                    name="close"
                    size={22}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {[
                  {
                    placeholder: "Marque *",
                    field: "make",
                    keyboard: "default",
                  },
                  {
                    placeholder: "Modèle *",
                    field: "model",
                    keyboard: "default",
                  },
                  {
                    placeholder: "Année *",
                    field: "year",
                    keyboard: "numeric",
                  },
                  {
                    placeholder: "Plaque d'immatriculation *",
                    field: "licensePlate",
                    keyboard: "default",
                  },
                  {
                    placeholder: "Couleur",
                    field: "color",
                    keyboard: "default",
                  },
                ].map((field, index) => (
                  <Animated.View
                    key={index}
                    style={[
                      styles.modalInputWrapper,
                      {
                        opacity: fadeAnim,
                        transform: [
                          {
                            translateX: slideAnim.interpolate({
                              inputRange: [0, 50],
                              outputRange: [0, 10 * (index + 1)],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <TextInput
                      style={[
                        styles.modalInput,
                        {
                          backgroundColor: colors.surface,
                          color: colors.text,
                          borderColor: colors.border,
                        },
                      ]}
                      placeholder={field.placeholder}
                      placeholderTextColor={colors.placeholder}
                      value={vehicleForm[field.field]}
                      onChangeText={(text) =>
                        setVehicleForm({ ...vehicleForm, [field.field]: text })
                      }
                      keyboardType={field.keyboard}
                    />
                  </Animated.View>
                ))}

                <TouchableOpacity
                  style={styles.modalSaveButton}
                  onPress={handleSaveVehicle}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[colors.primary, colors.secondary]}
                    style={styles.modalSaveGradient}
                  >
                    <Text style={styles.modalSaveText}>
                      {editingVehicle ? "Modifier" : "Ajouter"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            </LinearGradient>
          </Animated.View>
        </BlurView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: "absolute",
    width: width,
    height: height,
  },
  decorativeCircle: {
    position: "absolute",
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
  },
  circle1: {
    top: -width * 0.2,
    right: -width * 0.2,
  },
  circle2: {
    bottom: -width * 0.2,
    left: -width * 0.2,
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  content: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 40,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    position: "relative",
    overflow: "hidden",
  },
  headerPattern: {
    position: "absolute",
    width: "100%",
    height: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    opacity: 0.5,
  },
  patternDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    margin: 10,
  },
  headerContent: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 15,
  },
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "bold",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
  },
  verifiedBadgeGradient: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  name: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    marginBottom: 10,
  },
  lastLoginContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  lastLoginText: {
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: -20,
    marginBottom: 20,
    gap: 10,
  },
  statCardWrapper: {
    flex: 1,
  },
  statCard: {
    padding: 15,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  memberCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  memberCardGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    gap: 12,
  },
  memberIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.03)",
    justifyContent: "center",
    alignItems: "center",
  },
  memberText: {
    fontSize: 14,
    fontWeight: "500",
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 20,
    position: "relative",
    backgroundColor: "rgba(0,0,0,0.02)",
    borderRadius: 30,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 26,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  tabIndicator: {
    position: "absolute",
    bottom: 4,
    left: 4,
    width: (width - 60) / 3 - 4,
    height: "70%",
    borderRadius: 26,
    backgroundColor: "transparent",
  },
  tabContent: {
    paddingHorizontal: 20,
    minHeight: 300,
  },
  infoTab: {
    gap: 15,
  },
  infoCard: {
    padding: 20,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "500",
  },
  helperInfo: {
    marginTop: 5,
  },
  helperGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 20,
    gap: 8,
  },
  helperInfoText: {
    fontSize: 13,
    fontWeight: "500",
  },
  vehiclesTab: {
    gap: 15,
  },
  vehiclesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  vehiclesCount: {
    fontSize: 13,
    fontWeight: "500",
  },
  addVehicleButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 25,
    gap: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addVehicleText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  vehicleCard: {
    borderRadius: 25,
    overflow: "hidden",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  vehicleGradient: {
    padding: 15,
  },
  vehicleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  vehicleTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  vehicleIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  vehicleMake: {
    fontSize: 15,
    fontWeight: "600",
  },
  vehicleActions: {
    flexDirection: "row",
    gap: 12,
  },
  vehicleAction: {
    padding: 4,
  },
  vehicleDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
    marginBottom: 12,
  },
  vehicleDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  vehicleDetailText: {
    fontSize: 12,
  },
  defaultBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
    gap: 4,
  },
  defaultBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  setDefaultButton: {
    borderWidth: 1,
    borderRadius: 15,
    padding: 8,
    alignItems: "center",
  },
  setDefaultText: {
    fontSize: 11,
    fontWeight: "500",
  },
  emptyVehicles: {
    alignItems: "center",
    padding: 40,
    borderRadius: 30,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 15,
    marginBottom: 15,
  },
  emptyAddButton: {
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
  },
  emptyAddButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  historyTab: {
    gap: 15,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
  },
  historyCard: {
    borderRadius: 25,
    overflow: "hidden",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  historyGradient: {
    flexDirection: "row",
    padding: 15,
    gap: 15,
  },
  historyIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  historyContent: {
    flex: 1,
  },
  historyStatus: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  historyStatusText: {
    fontSize: 9,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  historyDescription: {
    fontSize: 12,
    marginVertical: 6,
  },
  historyFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  historyDate: {
    fontSize: 10,
  },
  emptyHistory: {
    alignItems: "center",
    padding: 50,
    borderRadius: 30,
  },
  emptySubtext: {
    fontSize: 12,
    textAlign: "center",
  },
  actionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginTop: 20,
    gap: 10,
  },
  actionItemWrapper: {
    flex: 1,
  },
  actionItem: {
    borderRadius: 25,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionGradient: {
    alignItems: "center",
    padding: 15,
    gap: 6,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    borderRadius: 40,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  modalGradient: {
    padding: 25,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.03)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalInputWrapper: {
    marginBottom: 12,
  },
  modalInput: {
    padding: 16,
    borderRadius: 25,
    fontSize: 15,
    borderWidth: 1,
  },
  modalSaveButton: {
    borderRadius: 25,
    overflow: "hidden",
    marginTop: 15,
  },
  modalSaveGradient: {
    padding: 16,
    alignItems: "center",
  },
  modalSaveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
