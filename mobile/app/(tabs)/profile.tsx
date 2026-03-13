import React, { useEffect, useState, useRef, useCallback } from "react";
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
  Switch,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
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
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import Toast from "react-native-toast-message";
import { LineChart } from "react-native-gifted-charts";

const { width, height } = Dimensions.get("window");

// ============================================
// TYPES
// ============================================

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

interface EmergencyContact {
  _id?: string;
  name: string;
  phone: string;
  relationship: string;
}

interface MonthlyStat {
  month: string;
  count: number;
  amount: number;
}

interface Settings {
  language: "fr" | "en";
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  theme: "light" | "dark" | "system";
  privacy: {
    shareLocation: boolean;
    shareData: boolean;
  };
}

interface UserDetails {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  photo?: string;
  role: string;
  isHelper: boolean;
  createdAt: string;
  lastLogin?: string;
  stats?: {
    interventionsAsUser: number;
    totalSpent: number;
    averageRating?: number;
    completedInterventions?: number;
    cancelledInterventions?: number;
    averageResponseTime?: number;
    favoriteService?: string;
    monthlyStats?: MonthlyStat[];
  };
  vehicles?: Vehicle[];
  recentInterventions?: Intervention[];
  emergencyContacts?: EmergencyContact[];
  settings?: Settings;
}

interface QuickAction {
  icon: string;
  label: string;
  gradient: string[];
  onPress?: () => void;
}

interface StatItem {
  icon: string;
  value: string | number;
  label: string;
  colors: string[];
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { effectiveTheme, setTheme } = useTheme();
  const colors = Colors[effectiveTheme];

  // ============================================
  // ÉTATS
  // ============================================

  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [activeTab, setActiveTab] = useState("info");

  // États pour les modales
  const [modalVisible, setModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [contactModalVisible, setContactModalVisible] = useState(false);

  // États pour les formulaires
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(
    null
  );

  const [vehicleForm, setVehicleForm] = useState({
    make: "",
    model: "",
    year: "",
    licensePlate: "",
    color: "",
    isDefault: false,
  });

  const [contactForm, setContactForm] = useState({
    name: "",
    phone: "",
    relationship: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const [settings, setSettings] = useState<Settings>({
    language: "fr",
    notifications: { email: true, push: true, sms: true },
    theme: "system",
    privacy: { shareLocation: true, shareData: false }, // ← IMPORTANT
  });

  const [emergencyContacts, setEmergencyContacts] = useState<
    EmergencyContact[]
  >([]);

  // ============================================
  // ANIMATIONS
  // ============================================

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;
  const avatarRotateAnim = useRef(new Animated.Value(0)).current;
  const skeletonPulseAnim = useRef(new Animated.Value(0.3)).current;

  // ============================================
  // CONSTANTES
  // ============================================

  const CACHE_KEY = "user_profile_cache";
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // ============================================
  // EFFETS
  // ============================================

  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      if (loading) {
        console.log("⚠️ Timeout de sécurité - affichage forcé");
        setLoading(false);
      }
    }, 8000);

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
      Animated.loop(
        Animated.sequence([
          Animated.timing(skeletonPulseAnim, {
            toValue: 0.7,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(skeletonPulseAnim, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();

    fetchUserProfile();
    loadEmergencyContacts();
    loadSettings();

    return () => clearTimeout(safetyTimeout);
  }, []);

  useEffect(() => {
    const tabIndex =
      activeTab === "info"
        ? 0
        : activeTab === "vehicles"
        ? 1
        : activeTab === "history"
        ? 2
        : 3;
    Animated.spring(tabIndicatorAnim, {
      toValue: tabIndex,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile(true); // Force refresh quand l'écran est focus
    }, [])
  );

  // ============================================
  // FONCTIONS DE FORMATAGE
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

  const formatPhoneNumber = (phone: string) => {
    return phone.replace(
      /(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/,
      "$1 $2 $3 $4 $5"
    );
  };

  // ============================================
  // FONCTIONS API
  // ============================================

  const fetchUserProfile = async (forceRefresh = false) => {
    try {
      // Vérifier le cache
      if (!forceRefresh) {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            setUserDetails(data);
            setLoading(false);
            return;
          }
        }
      }

      const response = await api.get("/auth/user/me");
      setUserDetails(response.data.data);

      // Sauvegarder dans le cache
      await AsyncStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          data: response.data.data,
          timestamp: Date.now(),
        })
      );

      showToast("success", "Profil mis à jour");
    } catch (error: any) {
      showToast(
        "error",
        error.response?.data?.message || "Impossible de charger le profil"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadEmergencyContacts = async () => {
    try {
      const response = await api.get("/users/emergency-contacts");
      setEmergencyContacts(response.data.data || []);
    } catch (error) {
      console.error("Erreur chargement contacts:", error);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await api.get("/users/settings");
      // Fusionne avec les valeurs par défaut pour éviter undefined
      setSettings({
        language: response.data.data?.language || "fr",
        notifications: response.data.data?.notifications || {
          email: true,
          push: true,
          sms: true,
        },
        theme: response.data.data?.theme || "system",
        privacy: response.data.data?.privacy || {
          shareLocation: true,
          shareData: false,
        },
      });
    } catch (error) {
      console.error("Erreur chargement settings:", error);
      // Garde les valeurs par défaut
    }
  };

  // ============================================
  // HANDLERS PHOTO
  // ============================================

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast("error", "Besoin d'accéder à la galerie");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setUploadingPhoto(true);
      try {
        const formData = new FormData();
        formData.append("photo", {
          uri: result.assets[0].uri,
          type: "image/jpeg",
          name: "profile.jpg",
        } as any);

        await api.post("/users/profile/photo", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        fetchUserProfile(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast("success", "Photo mise à jour");
      } catch (error) {
        showToast("error", "Impossible de mettre à jour la photo");
      } finally {
        setUploadingPhoto(false);
      }
    }
  };

  // ============================================
  // HANDLERS VÉHICULES
  // ============================================

  const openAddVehicleModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast("error", "Veuillez remplir tous les champs obligatoires");
      return;
    }

    setLoading(true);
    try {
      if (editingVehicle) {
        await api.put(`/users/vehicles/${editingVehicle._id}`, vehicleForm);
        showToast("success", "Véhicule modifié");
      } else {
        await api.post("/users/vehicles", vehicleForm);
        showToast("success", "Véhicule ajouté");
      }
      setModalVisible(false);
      fetchUserProfile(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      showToast("error", "Impossible de sauvegarder le véhicule");
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
            showToast("success", "Véhicule supprimé");
            fetchUserProfile(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (error) {
            showToast("error", "Impossible de supprimer le véhicule");
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
      showToast("success", "Véhicule principal défini");
      fetchUserProfile(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      showToast("error", "Impossible de définir le véhicule principal");
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // HANDLERS CONTACTS D'URGENCE
  // ============================================

  const openAddContactModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingContact(null);
    setContactForm({ name: "", phone: "", relationship: "" });
    setContactModalVisible(true);
  };

  const openEditContactModal = (contact: EmergencyContact) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingContact(contact);
    setContactForm({
      name: contact.name,
      phone: contact.phone,
      relationship: contact.relationship,
    });
    setContactModalVisible(true);
  };

  const handleSaveContact = async () => {
    if (!contactForm.name || !contactForm.phone) {
      showToast("error", "Veuillez remplir tous les champs");
      return;
    }

    try {
      if (editingContact) {
        await api.put(
          `/users/emergency-contacts/${editingContact._id}`,
          contactForm
        );
        showToast("success", "Contact modifié");
      } else {
        await api.post("/users/emergency-contacts", contactForm);
        showToast("success", "Contact ajouté");
      }
      setContactModalVisible(false);
      loadEmergencyContacts();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      showToast("error", "Impossible de sauvegarder le contact");
    }
  };

  const handleDeleteContact = (contactId: string) => {
    Alert.alert("Supprimer", "Voulez-vous vraiment supprimer ce contact ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/users/emergency-contacts/${contactId}`);
            showToast("success", "Contact supprimé");
            loadEmergencyContacts();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (error) {
            showToast("error", "Impossible de supprimer le contact");
          }
        },
      },
    ]);
  };

  // ============================================
  // HANDLERS MOT DE PASSE
  // ============================================

  const handleChangePassword = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
      showToast("error", "Les mots de passe ne correspondent pas");
      return;
    }

    if (passwordForm.new.length < 6) {
      showToast("error", "Minimum 6 caractères");
      return;
    }

    try {
      await api.post("/users/change-password", {
        currentPassword: passwordForm.current,
        newPassword: passwordForm.new,
      });
      setPasswordModalVisible(false);
      setPasswordForm({ current: "", new: "", confirm: "" });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("success", "Mot de passe modifié");
    } catch (error: any) {
      showToast("error", error.response?.data?.message || "Échec");
    }
  };

  // ============================================
  // HANDLERS PARAMÈTRES
  // ============================================

  const saveSettings = async (newSettings: Settings) => {
    try {
      await api.put("/users/settings", newSettings);
      setSettings(newSettings);
      if (newSettings.theme !== settings.theme) {
        setTheme(newSettings.theme);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("success", "Paramètres sauvegardés");
    } catch (error) {
      showToast("error", "Impossible de sauvegarder");
    }
  };

  // ============================================
  // HANDLERS UI
  // ============================================

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Animated.timing(fadeAnim, {
      toValue: 0.5,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      fetchUserProfile(true);
    });
  }, []);

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Déconnexion", "Voulez-vous vraiment vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Se déconnecter", onPress: logout, style: "destructive" },
    ]);
  };

  const showToast = (type: "success" | "error", text: string) => {
    Toast.show({
      type,
      text1: type === "success" ? "Succès" : "Erreur",
      text2: text,
      position: "bottom",
      visibilityTime: 3000,
    });
  };

  // ============================================
  // FONCTIONS UTILITAIRES
  // ============================================

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

  // ============================================
  // ANIMATIONS INTERPOLATIONS
  // ============================================

  const avatarRotate = avatarRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["-5deg", "5deg"],
  });

  const tabIndicatorPosition = tabIndicatorAnim.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [
      0,
      (width - 60) / 4,
      ((width - 60) / 4) * 2,
      ((width - 60) / 4) * 3,
    ],
  });

  // ============================================
  // DONNÉES POUR L'UI
  // ============================================

  const stats: StatItem[] = [
    {
      icon: "car",
      value: userDetails?.stats?.interventionsAsUser || 0,
      label: "Interventions",
      colors: [colors.primary + "20", colors.secondary + "10"],
    },
    {
      icon: "wallet",
      value: (userDetails?.stats?.totalSpent?.toFixed(2) || "0") + " $",
      label: "Dépensé",
      colors: [colors.secondary + "20", colors.primary + "10"],
    },
    {
      icon: "star",
      value: userDetails?.stats?.averageRating?.toFixed(1) || "5.0",
      label: "Note",
      colors: [colors.primary + "20", colors.secondary + "10"],
    },
  ];

  const actions: QuickAction[] = [
    {
      icon: "settings-outline",
      label: "Paramètres",
      gradient: [colors.primary + "20", colors.secondary + "10"],
      onPress: () => setSettingsModalVisible(true),
    },
    {
      icon: "people-outline",
      label: "Contacts",
      gradient: [colors.primary + "20", colors.secondary + "10"],
      onPress: () => setActiveTab("emergency"),
    },
    {
      icon: "lock-closed-outline",
      label: "Mot de passe",
      gradient: [colors.primary + "20", colors.secondary + "10"],
      onPress: () => setPasswordModalVisible(true),
    },
    {
      icon: "log-out-outline",
      label: "Déconnexion",
      gradient: [colors.error + "20", colors.error + "10"],
      onPress: handleLogout,
    },
  ];

  // ============================================
  // RENDER HELPERS
  // ============================================

  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Animated.View
          key={i}
          style={[
            styles.skeletonItem,
            {
              backgroundColor: colors.surface,
              opacity: skeletonPulseAnim,
            },
          ]}
        />
      ))}
    </View>
  );

  const renderHeader = () => (
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
          <TouchableOpacity onPress={handlePickImage} disabled={uploadingPhoto}>
            {uploadingPhoto ? (
              <View
                style={[
                  styles.avatarGradient,
                  { justifyContent: "center", alignItems: "center" },
                ]}
              >
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : userDetails?.photo ? (
              <Image
                source={{ uri: userDetails.photo }}
                style={styles.avatarImage}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <LinearGradient
                colors={["#FFFFFF", "#F5F5F5"]}
                style={styles.avatarGradient}
              >
                <Text style={[styles.avatarText, { color: colors.primary }]}>
                  {userDetails?.firstName?.[0]}
                  {userDetails?.lastName?.[0]}
                </Text>
              </LinearGradient>
            )}
            <View
              style={[styles.editBadge, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="camera" size={12} color="#fff" />
            </View>
          </TouchableOpacity>
        </Animated.View>

        <Text style={[styles.name, { color: colors.background }]}>
          {userDetails?.firstName} {userDetails?.lastName}
        </Text>
        <Text
          style={[styles.email, { color: colors.background, opacity: 0.9 }]}
        >
          {userDetails?.email}
        </Text>

        {userDetails?.lastLogin && (
          <View style={styles.lastLoginContainer}>
            <Ionicons name="time-outline" size={14} color={colors.background} />
            <Text style={[styles.lastLoginText, { color: colors.background }]}>
              Dernière connexion{" "}
              {formatDistance(new Date(userDetails.lastLogin), new Date(), {
                addSuffix: true,
                locale: fr,
              })}
            </Text>
          </View>
        )}
      </View>
    </LinearGradient>
  );

  const renderStats = () => (
    <View style={styles.statsGrid}>
      {stats.map((stat, index) => (
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
              <Ionicons name={stat.icon} size={20} color={colors.primary} />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {stat.value}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {stat.label}
            </Text>
          </LinearGradient>
        </Animated.View>
      ))}
    </View>
  );

  const renderMemberCard = () => (
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
  );

  const renderTabs = () => (
    <View style={[styles.tabContainer, { backgroundColor: colors.surface }]}>
      {["info", "vehicles", "history", "emergency"].map((tab) => (
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
                  activeTab === tab ? colors.primary : colors.textSecondary,
                fontWeight: activeTab === tab ? "600" : "400",
              },
            ]}
          >
            {tab === "info"
              ? "Infos"
              : tab === "vehicles"
              ? "Véhicules"
              : tab === "history"
              ? "Historique"
              : "Urgence"}
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
  );

  const renderInfoTab = () => (
    <Animated.View style={[styles.infoTab, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={[colors.surface, colors.surface]}
        style={styles.infoCard}
      >
        {[
          {
            icon: "call-outline",
            label: "Téléphone",
            value: userDetails?.phone
              ? formatPhoneNumber(userDetails.phone)
              : "Non renseigné",
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
              userDetails?.role === "admin" ? "Administrateur" : "Utilisateur",
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
              <Ionicons name={item.icon} size={18} color={colors.primary} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                {item.label}
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
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
              colors={[colors.primary + "15", colors.secondary + "10"]}
              style={styles.helperGradient}
            >
              <Ionicons name="star" size={18} color={colors.primary} />
              <Text style={[styles.helperInfoText, { color: colors.primary }]}>
                Helper certifié •{" "}
                {userDetails.stats?.completedInterventions || 0} interventions
              </Text>
            </LinearGradient>
          </Animated.View>
        )}
      </LinearGradient>
    </Animated.View>
  );

  const renderVehiclesTab = () => (
    <Animated.View style={[styles.vehiclesTab, { opacity: fadeAnim }]}>
      <View style={styles.vehiclesHeader}>
        <Text style={[styles.vehiclesCount, { color: colors.textSecondary }]}>
          {userDetails?.vehicles?.length || 0} véhicule(s)
        </Text>
        <TouchableOpacity onPress={openAddVehicleModal} activeOpacity={0.8}>
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
            key={vehicle._id || index}
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
                    <Ionicons name="car" size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.vehicleMake, { color: colors.text }]}>
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
                  <Text style={styles.defaultBadgeText}>Principal</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.setDefaultButton,
                    { borderColor: colors.primary },
                  ]}
                  onPress={() => handleSetDefaultVehicle(vehicle._id!)}
                >
                  <Text
                    style={[styles.setDefaultText, { color: colors.primary }]}
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
            <Ionicons name="car-outline" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Aucun véhicule enregistré
          </Text>
          <TouchableOpacity
            style={[styles.emptyAddButton, { backgroundColor: colors.primary }]}
            onPress={openAddVehicleModal}
          >
            <Text style={styles.emptyAddButtonText}>Ajouter un véhicule</Text>
          </TouchableOpacity>
        </LinearGradient>
      )}
    </Animated.View>
  );

  const renderHistoryTab = () => (
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
                    backgroundColor: getStatusColor(intervention.status) + "15",
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
                  <Text style={[styles.historyType, { color: colors.text }]}>
                    {intervention.type === "sos" ? "SOS Urgence" : "Assistance"}
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
                        { color: getStatusColor(intervention.status) },
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
            <Ionicons name="time-outline" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Aucune intervention récente
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Utilisez SOS ou Diagnostic pour commencer
          </Text>
        </LinearGradient>
      )}
    </Animated.View>
  );

  const renderEmergencyTab = () => (
    <Animated.View style={[styles.emergencyTab, { opacity: fadeAnim }]}>
      <View style={styles.emergencyHeader}>
        <Text style={[styles.emergencyTitle, { color: colors.text }]}>
          Contacts d'urgence
        </Text>
        <TouchableOpacity onPress={openAddContactModal} activeOpacity={0.8}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.addContactButton}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addContactText}>Ajouter</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {emergencyContacts.length > 0 ? (
        emergencyContacts.map((contact, index) => (
          <Animated.View
            key={contact._id || index}
            style={[
              styles.contactCard,
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
              style={styles.contactGradient}
            >
              <View style={styles.contactInfo}>
                <View
                  style={[
                    styles.contactIconContainer,
                    { backgroundColor: colors.error + "15" },
                  ]}
                >
                  <Ionicons
                    name="alert-circle"
                    size={24}
                    color={colors.error}
                  />
                </View>
                <View style={styles.contactDetails}>
                  <Text style={[styles.contactName, { color: colors.text }]}>
                    {contact.name}
                  </Text>
                  <Text
                    style={[
                      styles.contactPhone,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {formatPhoneNumber(contact.phone)}
                  </Text>
                  <Text
                    style={[
                      styles.contactRelation,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {contact.relationship}
                  </Text>
                </View>
              </View>
              <View style={styles.contactActions}>
                <TouchableOpacity
                  onPress={() => openEditContactModal(contact)}
                  style={styles.contactAction}
                >
                  <Ionicons
                    name="create-outline"
                    size={18}
                    color={colors.primary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteContact(contact._id!)}
                  style={styles.contactAction}
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={colors.error}
                  />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        ))
      ) : (
        <LinearGradient
          colors={[colors.surface, colors.surface]}
          style={styles.emptyContacts}
        >
          <View
            style={[
              styles.emptyIconContainer,
              { backgroundColor: colors.error + "10" },
            ]}
          >
            <Ionicons name="people-outline" size={40} color={colors.error} />
          </View>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Aucun contact d'urgence
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Ajoutez des contacts pour les situations d'urgence
          </Text>
        </LinearGradient>
      )}
    </Animated.View>
  );

  const renderMonthlyChart = () => {
    if (!userDetails?.stats?.monthlyStats) return null;

    return (
      <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>
          Interventions mensuelles
        </Text>
        <LineChart
          data={userDetails.stats.monthlyStats.map((d) => ({ value: d.count }))}
          height={150}
          width={width - 80}
          color={colors.primary}
          thickness={2}
          hideDataPoints
          hideRules
          hideYAxisText
          xAxisColor={colors.border}
          yAxisColor={colors.border}
        />
      </View>
    );
  };

  const renderActions = () => (
    <View style={styles.actionsGrid}>
      {actions.map((action, index) => (
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
  );

  // ============================================
  // MODALES
  // ============================================

  const renderVehicleModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <BlurView
        intensity={Platform.OS === "ios" ? 50 : 20} // Réduire l'intensité
        blurReductionFactor={0.5} // Ajouter sur Android
        experimentalBlurMethod={Platform.OS === "android" ? "dimezis" : "none"} // Option Android
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
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { placeholder: "Marque *", field: "make", keyboard: "default" },
                {
                  placeholder: "Modèle *",
                  field: "model",
                  keyboard: "default",
                },
                { placeholder: "Année *", field: "year", keyboard: "numeric" },
                {
                  placeholder: "Plaque d'immatriculation *",
                  field: "licensePlate",
                  keyboard: "default",
                },
                { placeholder: "Couleur", field: "color", keyboard: "default" },
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
                    keyboardType={field.keyboard as any}
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
  );

  const renderContactModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={contactModalVisible}
      onRequestClose={() => setContactModalVisible(false)}
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
                {editingContact ? "Modifier le contact" : "Ajouter un contact"}
              </Text>
              <TouchableOpacity
                onPress={() => setContactModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                {
                  placeholder: "Nom complet *",
                  field: "name",
                  keyboard: "default",
                },
                {
                  placeholder: "Téléphone *",
                  field: "phone",
                  keyboard: "phone-pad",
                },
                {
                  placeholder: "Relation (ex: conjoint, parent)",
                  field: "relationship",
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
                    value={contactForm[field.field]}
                    onChangeText={(text) =>
                      setContactForm({ ...contactForm, [field.field]: text })
                    }
                    keyboardType={field.keyboard as any}
                  />
                </Animated.View>
              ))}

              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSaveContact}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[colors.primary, colors.secondary]}
                  style={styles.modalSaveGradient}
                >
                  <Text style={styles.modalSaveText}>
                    {editingContact ? "Modifier" : "Ajouter"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </LinearGradient>
        </Animated.View>
      </BlurView>
    </Modal>
  );

  const renderPasswordModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={passwordModalVisible}
      onRequestClose={() => setPasswordModalVisible(false)}
    >
      <BlurView
        intensity={Platform.OS === "ios" ? 0 : 20} // Réduire l'intensité
        blurReductionFactor={0.5} // Ajouter sur Android
        experimentalBlurMethod={Platform.OS === "android" ? "dimezis" : "none"} // Option Android
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
                Changer le mot de passe
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setPasswordModalVisible(false);
                  setPasswordForm({ current: "", new: "", confirm: "" });
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                {
                  placeholder: "Mot de passe actuel",
                  field: "current",
                  secure: true,
                },
                {
                  placeholder: "Nouveau mot de passe",
                  field: "new",
                  secure: true,
                },
                {
                  placeholder: "Confirmer le mot de passe",
                  field: "confirm",
                  secure: true,
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
                    value={passwordForm[field.field]}
                    onChangeText={(text) =>
                      setPasswordForm({ ...passwordForm, [field.field]: text })
                    }
                    secureTextEntry={field.secure}
                  />
                </Animated.View>
              ))}

              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleChangePassword}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[colors.primary, colors.secondary]}
                  style={styles.modalSaveGradient}
                >
                  <Text style={styles.modalSaveText}>
                    Changer le mot de passe
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </LinearGradient>
        </Animated.View>
      </BlurView>
    </Modal>
  );

  const renderSettingsModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={settingsModalVisible}
      onRequestClose={() => setSettingsModalVisible(false)}
    >
      <BlurView
        intensity={Platform.OS === "ios" ? 50 : 20} // Réduire l'intensité
        blurReductionFactor={0.5} // Ajouter sur Android
        experimentalBlurMethod={Platform.OS === "android" ? "dimezis" : "none"} // Option Android
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
                Paramètres
              </Text>
              <TouchableOpacity
                onPress={() => setSettingsModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.settingsSection, { color: colors.text }]}>
                Notifications
              </Text>

              {[
                { label: "Notifications par email", key: "email" },
                { label: "Notifications push", key: "push" },
                { label: "Notifications SMS", key: "sms" },
              ].map((item) => (
                <View
                  key={item.key}
                  style={[
                    styles.settingItem,
                    { backgroundColor: colors.surface },
                  ]}
                >
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    {item.label}
                  </Text>
                  <Switch
                    value={settings.notifications[item.key]}
                    onValueChange={(value) =>
                      setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          [item.key]: value,
                        },
                      })
                    }
                    trackColor={{ false: colors.border, true: colors.primary }}
                  />
                </View>
              ))}

              <Text
                style={[
                  styles.settingsSection,
                  { color: colors.text, marginTop: 20 },
                ]}
              >
                Confidentialité
              </Text>

              {/* Dans la section Confidentialité */}
              {settings.privacy ? ( // ← Vérification importante !
                [
                  {
                    label: "Partager ma position",
                    key: "shareLocation" as const,
                  },
                  {
                    label: "Partager mes données d'utilisation",
                    key: "shareData" as const,
                  },
                ].map((item) => (
                  <View
                    key={item.key}
                    style={[
                      styles.settingItem,
                      { backgroundColor: colors.surface },
                    ]}
                  >
                    <Text style={[styles.settingLabel, { color: colors.text }]}>
                      {item.label}
                    </Text>
                    <Switch
                      value={settings.privacy[item.key]}
                      onValueChange={(value) =>
                        setSettings({
                          ...settings,
                          privacy: { ...settings.privacy, [item.key]: value },
                        })
                      }
                      trackColor={{
                        false: colors.border,
                        true: colors.primary,
                      }}
                    />
                  </View>
                ))
              ) : (
                <Text style={{ color: colors.textSecondary, padding: 20 }}>
                  Chargement des paramètres...
                </Text>
              )}
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={() => {
                  saveSettings(settings);
                  setSettingsModalVisible(false);
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[colors.primary, colors.secondary]}
                  style={styles.modalSaveGradient}
                >
                  <Text style={styles.modalSaveText}>Sauvegarder</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </LinearGradient>
        </Animated.View>
      </BlurView>
    </Modal>
  );

  // ============================================
  // RENDER PRINCIPAL
  // ============================================

  if (loading && !refreshing) {
    return renderSkeleton();
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
            backgroundColor: colors.primary + "03",
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
            backgroundColor: colors.secondary + "03",
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
          {renderHeader()}
          {renderStats()}
          {renderMemberCard()}
          {renderMonthlyChart()}
          {renderTabs()}

          <View style={styles.tabContent}>
            {activeTab === "info" && renderInfoTab()}
            {activeTab === "vehicles" && renderVehiclesTab()}
            {activeTab === "history" && renderHistoryTab()}
            {activeTab === "emergency" && renderEmergencyTab()}
          </View>

          {renderActions()}
        </Animated.View>
      </ScrollView>

      {/* Modales */}
      {renderVehicleModal()}
      {renderContactModal()}
      {renderPasswordModal()}
      {renderSettingsModal()}

      {/* Toast */}
      <Toast />
    </View>
  );
}

// ============================================
// STYLES
// ============================================

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
  skeletonContainer: {
    flex: 1,
    padding: 20,
    gap: 15,
  },
  skeletonItem: {
    height: 100,
    borderRadius: 20,
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
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
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
  chartCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 15,
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
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  tabIndicator: {
    position: "absolute",
    bottom: 4,
    left: 4,
    width: (width - 60) / 4 - 4,
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
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  historyType: {
    fontSize: 14,
    fontWeight: "600",
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
    marginBottom: 6,
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
  emergencyTab: {
    gap: 15,
  },
  emergencyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  emergencyTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  addContactButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 25,
    gap: 5,
  },
  addContactText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  contactCard: {
    borderRadius: 25,
    overflow: "hidden",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  contactGradient: {
    flexDirection: "row",
    padding: 15,
    alignItems: "center",
    justifyContent: "space-between",
  },
  contactInfo: {
    flexDirection: "row",
    gap: 12,
    flex: 1,
  },
  contactIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 13,
    marginBottom: 2,
  },
  contactRelation: {
    fontSize: 12,
  },
  contactActions: {
    flexDirection: "row",
    gap: 12,
  },
  contactAction: {
    padding: 4,
  },
  emptyContacts: {
    alignItems: "center",
    padding: 50,
    borderRadius: 30,
  },
  actionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginTop: 20,
    gap: 10,
    flexWrap: "wrap",
  },
  actionItemWrapper: {
    width: (width - 50) / 2,
    marginBottom: 10,
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
    fontSize: 12,
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
  settingsSection: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 20,
    marginBottom: 8,
  },
  settingLabel: {
    fontSize: 15,
  },
});
