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
  TextInput,
  Modal,
  Switch,
  Linking,
  StatusBar,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { api } from "../../config/api";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");

interface HelperProfile {
  _id: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    photo?: string;
  };

  photo?: string;
  status: "pending" | "active" | "suspended" | "inactive";
  certification: {
    isCertified: boolean;
    certifiedAt?: string;
    expiresAt?: string;
    certificateNumber?: string;
  };
  services: string[];
  equipment: Array<{
    name: string;
    has: boolean;
    lastChecked?: string;
  }>;
  serviceArea: {
    radius: number;
    address?: string;
    coordinates?: [number, number];
  };
  pricing: {
    basePrice: number;
    perKm: number;
    services: Array<{
      service: string;
      price: number;
    }>;
  };
  availability: {
    isAvailable: boolean;
    schedule: Array<{
      day: string;
      startTime: string;
      endTime: string;
    }>;
  };
  stats: {
    totalInterventions: number;
    completedInterventions: number;
    averageRating: number;
    totalEarnings: number;
    responseRate: number;
    averageResponseTime: number;
  };
  documents: {
    license?: DocumentInfo;
    insurance?: DocumentInfo;
    certification?: DocumentInfo;
  };
  preferences: {
    language: string;
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
    theme: "light" | "dark" | "system";
  };
  createdAt: string;
}

interface DocumentInfo {
  type: string;
  url?: string;
  verified: boolean;
  status: "missing" | "pending" | "verified" | "rejected";
  uploadedAt?: string;
  fileName?: string;
  fileSize?: number;
  rejectionReason?: string;
}

interface PricingService {
  service: string;
  price: number;
}

const SERVICES_LIST = [
  {
    id: "battery",
    label: "Batterie",
    icon: "battery-dead",
    description: "Dépannage batterie",
    color: "#FF6B6B",
  },
  {
    id: "tire",
    label: "Pneu",
    icon: "car-sport",
    description: "Changement de pneu",
    color: "#4ECDC4",
  },
  {
    id: "fuel",
    label: "Essence",
    icon: "water",
    description: "Livraison de carburant",
    color: "#45B7D1",
  },
  {
    id: "towing",
    label: "Remorquage",
    icon: "construct",
    description: "Remorquage léger",
    color: "#96CEB4",
  },
  {
    id: "lockout",
    label: "Clés enfermées",
    icon: "key",
    description: "Ouverture de porte",
    color: "#FFEAA7",
  },
  {
    id: "diagnostic",
    label: "Diagnostic",
    icon: "medkit",
    description: "Diagnostic rapide",
    color: "#DDA0DD",
  },
  {
    id: "jumpstart",
    label: "Démarrage",
    icon: "flash",
    description: "Aide au démarrage",
    color: "#FFD93D",
  },
  {
    id: "minor_repair",
    label: "Petite réparation",
    icon: "build",
    description: "Réparations mineures",
    color: "#6C5B7B",
  },
];

const EQUIPMENT_LIST = [
  {
    id: "cables",
    label: "Câbles de démarrage",
    icon: "flash",
    category: "Électrique",
  },
  { id: "jack", label: "Cric", icon: "car", category: "Levage" },
  { id: "triangle", label: "Triangle", icon: "warning", category: "Sécurité" },
  {
    id: "vest",
    label: "Gilet de sécurité",
    icon: "shirt",
    category: "Sécurité",
  },
  {
    id: "tire_iron",
    label: "Clé à roue",
    icon: "construct",
    category: "Outillage",
  },
  {
    id: "compressor",
    label: "Compresseur",
    icon: "airplane",
    category: "Pneumatique",
  },
  {
    id: "battery_booster",
    label: "Booster batterie",
    icon: "battery-charging",
    category: "Électrique",
  },
  {
    id: "tow_rope",
    label: "Câble de remorquage",
    icon: "git-network",
    category: "Remorquage",
  },
];

const LANGUAGES = [
  { id: "fr", label: "Français", icon: "language" },
  { id: "en", label: "English", icon: "language" },
];

const THEMES = [
  { id: "light", label: "Clair", icon: "sunny" },
  { id: "dark", label: "Sombre", icon: "moon" },
  { id: "system", label: "Système", icon: "phone-portrait" },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { setTheme } = useTheme();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // États
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<HelperProfile | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [newAvatar, setNewAvatar] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [docProgress, setDocProgress] = useState<{ [key: string]: number }>({});
  const [documents, setDocuments] = useState<{
    license?: DocumentInfo;
    insurance?: DocumentInfo;
    certification?: DocumentInfo;
  }>({});

  // États pour les modales
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [pricingServices, setPricingServices] = useState<PricingService[]>([]);
  const [basePrice, setBasePrice] = useState("");
  const [perKm, setPerKm] = useState("");
  const [radius, setRadius] = useState("");
  const [address, setAddress] = useState("");
  const [notifications, setNotifications] = useState({
    email: true,
    sms: true,
    push: true,
  });
  const [selectedLanguage, setSelectedLanguage] = useState("fr");
  const [selectedTheme, setSelectedTheme] = useState<
    "light" | "dark" | "system"
  >("system");
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // 1. TIMEOUT DE SÉCURITÉ - Force l'arrêt du chargement après 8 secondes
    const safetyTimeout = setTimeout(() => {
      if (loading) {
        console.log("⚠️ Timeout de sécurité - affichage forcé");
        setLoading(false);
      }
    }, 8000);

    // 2. ANIMATIONS
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

    // 3. CHARGEMENT DES DONNÉES
    const loadAllData = async () => {
      try {
        await loadProfile();
        await loadDocuments();
        await loadSavedTheme();
      } catch (error) {
        console.log("Erreur chargement:", error);
      } finally {
        // ← Important : forcer loading à false même si erreur
        setLoading(false);
        clearTimeout(safetyTimeout);
      }
    };

    loadAllData();

    // 4. NETTOYAGE
    return () => clearTimeout(safetyTimeout);
  }, []); // ← Dépendances vides = s'exécute une seule fois

  const loadProfile = async () => {
    try {
      const response = await api.get("/helpers/profile/me");
      setProfile(response.data.data);
      console.log(response.data.data.photo);

      if (response.data.data.services) {
        setSelectedServices(response.data.data.services);
      }
      if (response.data.data.equipment) {
        setSelectedEquipment(
          response.data.data.equipment.map((e: any) => e.name)
        );
      }
      if (response.data.data.pricing) {
        setBasePrice(response.data.data.pricing.basePrice.toString());
        setPerKm(response.data.data.pricing.perKm.toString());
        setPricingServices(response.data.data.pricing.services || []);
      }
      if (response.data.data.serviceArea) {
        setRadius(response.data.data.serviceArea.radius?.toString() || "20");
        setAddress(response.data.data.address || "");
      }
      if (response.data.data.preferences) {
        setNotifications(
          response.data.data.preferences.notifications || {
            email: true,
            sms: true,
            push: true,
          }
        );
        setSelectedLanguage(response.data.data.preferences.language || "fr");
      }
    } catch (error) {
      console.log("Erreur chargement profil:", error);
    }
  };

  const loadDocuments = async () => {
    try {
      const response = await api.get("/documents");
      setDocuments(response.data.data);
    } catch (error) {
      console.log("Erreur chargement documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem("userTheme");
      if (savedTheme) {
        setSelectedTheme(savedTheme as "light" | "dark" | "system");
      }
    } catch (error) {
      console.log("Erreur chargement thème:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await loadProfile();
    await loadDocuments();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      "Déconnexion",
      "Voulez-vous vraiment vous déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Se déconnecter",
          onPress: async () => {
            await logout();
            router.replace("/auth/login");
          },
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
  };

  const updateField = async (field: string, value: any) => {
    try {
      const address = value.address;
      delete value.address;

      await api.put("/helpers/profile/me", { [field]: value, address });
      await loadProfile();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Succès", "Profil mis à jour");
    } catch (error) {
      Alert.alert("Erreur", "Impossible de mettre à jour le profil");
    }
  };

  const saveServices = async () => {
    setActiveModal(null);
    await updateField("services", selectedServices);
    Alert.alert("Succès", "Services mis à jour");
  };

  const saveEquipment = async () => {
    const equipmentList = selectedEquipment.map((name) => ({
      name,
      has: true,
      lastChecked: new Date().toISOString(),
    }));
    setActiveModal(null);
    await updateField("equipment", equipmentList);
    Alert.alert("Succès", "Équipement mis à jour");
  };

  const savePricing = async () => {
    const pricingData = {
      basePrice: parseFloat(basePrice) || 0,
      perKm: parseFloat(perKm) || 0,
      services: pricingServices,
    };
    setActiveModal(null);
    await updateField("pricing", pricingData);
    Alert.alert("Succès", "Tarifs mis à jour");
  };

  const saveServiceArea = async () => {
    const areaData = {
      radius: parseFloat(radius) || 20,
      address: address,
    };
    setActiveModal(null);
    await updateField("serviceArea", areaData);
    Alert.alert("Succès", "Zone mise à jour");
  };

  const savePreferences = async () => {
    try {
      const preferencesData = {
        language: selectedLanguage,
        notifications: notifications,
        theme: selectedTheme,
      };

      await updateField("preferences", preferencesData);
      await AsyncStorage.setItem("userTheme", selectedTheme);
      setTheme(selectedTheme);

      setActiveModal(null);
      Alert.alert("Succès", "Préférences mises à jour");
    } catch (error) {
      Alert.alert("Erreur", "Impossible de sauvegarder les préférences");
    }
  };

  // Fonction de sélection d'image depuis la galerie
  const handleImagePick = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission refusée",
          "Vous devez autoriser l'accès à la galerie"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;

        const formData = new FormData();
        formData.append("photo", {
          uri: uri,
          type: "image/jpeg",
          name: `profile_${Date.now()}.jpg`,
        } as any);

        setUploadLoading(true);
        setShowPhotoOptions(false);

        try {
          const response = await api.post("/helpers/profile/photo", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });

          if (response.data.success) {
            setNewAvatar(uri);
            await loadProfile();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Succès", "Photo de profil mise à jour");
          }
        } catch (error: any) {
          console.error("Erreur lors de l'upload :", error);
          Alert.alert("Erreur", "Impossible de télécharger l'image");
        } finally {
          setUploadLoading(false);
        }
      }
    } catch (error) {
      console.error("Erreur lors de la sélection:", error);
      Alert.alert("Erreur", "Impossible de sélectionner l'image");
      setUploadLoading(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission refusée",
          "Vous devez autoriser l'accès à la caméra"
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;

        const formData = new FormData();
        formData.append("photo", {
          uri: uri,
          type: "image/jpeg",
          name: `profile_${Date.now()}.jpg`,
        } as any);

        setUploadLoading(true);
        setShowPhotoOptions(false);

        try {
          const response = await api.post("/helpers/profile/photo", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });

          if (response.data.success) {
            setNewAvatar(uri);
            await loadProfile();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Succès", "Photo de profil mise à jour");
          }
        } catch (error) {
          console.error("Erreur:", error);
          Alert.alert("Erreur", "Impossible de prendre la photo");
        } finally {
          setUploadLoading(false);
        }
      }
    } catch (error) {
      console.error("Erreur caméra:", error);
      Alert.alert("Erreur", "Impossible d'ouvrir la caméra");
      setUploadLoading(false);
    }
  };

  const deletePhoto = async () => {
    Alert.alert(
      "Supprimer la photo",
      "Voulez-vous vraiment supprimer votre photo de profil ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              setUploadLoading(true);
              await api.delete("/helpers/profile/photo");
              setNewAvatar(null);
              await loadProfile();
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
              Alert.alert("Succès", "Photo supprimée");
            } catch (error) {
              Alert.alert("Erreur", "Impossible de supprimer la photo");
            } finally {
              setUploadLoading(false);
              setShowPhotoOptions(false);
            }
          },
        },
      ]
    );
  };

  const pickDocument = async (docType: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "image/*",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];

      if (file.size && file.size > 10 * 1024 * 1024) {
        Alert.alert("Erreur", "Le fichier est trop volumineux (max 10MB)");
        return;
      }

      setUploadingDoc(docType);

      const formData = new FormData();
      formData.append("document", {
        uri: file.uri,
        type: file.mimeType || "application/octet-stream",
        name: file.name || `document.${file.name?.split(".").pop() || "pdf"}`,
      } as any);

      const response = await api.post(`/documents/${docType}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setDocProgress((prev) => ({ ...prev, [docType]: percent }));
          }
        },
      });

      if (response.data.success) {
        await loadDocuments();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Succès", "Document uploadé avec succès");
      }
    } catch (error: any) {
      console.error("Erreur upload document:", error);
      Alert.alert("Erreur", "Impossible d'uploader le document");
    } finally {
      setUploadingDoc(null);
      setDocProgress((prev) => {
        const newProgress = { ...prev };
        delete newProgress[docType];
        return newProgress;
      });
    }
  };

  const deleteDocument = async (docType: string) => {
    Alert.alert(
      "Supprimer le document",
      "Voulez-vous vraiment supprimer ce document ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/documents/${docType}`);
              await loadDocuments();
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
              Alert.alert("Succès", "Document supprimé");
            } catch (error: any) {
              if (error.response?.status === 400) {
                Alert.alert(
                  "Erreur",
                  "Impossible de supprimer un document vérifié"
                );
              } else {
                Alert.alert("Erreur", "Impossible de supprimer le document");
              }
            }
          },
        },
      ]
    );
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case "license":
        return "card-outline";
      case "insurance":
        return "shield-outline";
      case "certification":
        return "ribbon-outline";
      default:
        return "document-outline";
    }
  };

  const getDocumentLabel = (type: string) => {
    switch (type) {
      case "license":
        return "Permis de conduire";
      case "insurance":
        return "Attestation d'assurance";
      case "certification":
        return "Certification";
      default:
        return type;
    }
  };

  const getDocumentStatus = (doc?: DocumentInfo) => {
    if (!doc || doc.status === "missing" || !doc.url) {
      return {
        label: "Manquant",
        color: colors.textSecondary,
        icon: "close-circle",
      };
    }
    if (doc.status === "verified") {
      return {
        label: "Vérifié",
        color: colors.success,
        icon: "checkmark-circle",
      };
    }
    if (doc.status === "pending") {
      return { label: "En attente", color: colors.warning, icon: "time" };
    }
    if (doc.status === "rejected") {
      return { label: "Rejeté", color: colors.error, icon: "alert-circle" };
    }
    return {
      label: "Manquant",
      color: colors.textSecondary,
      icon: "close-circle",
    };
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "#4CAF50";
      case "pending":
        return "#FF9800";
      case "suspended":
        return "#F44336";
      default:
        return "#9E9E9E";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Actif";
      case "pending":
        return "En attente";
      case "suspended":
        return "Suspendu";
      case "inactive":
        return "Inactif";
      default:
        return status;
    }
  };

  const truncateFileName = (fileName: string, maxLength = 20) => {
    if (!fileName) return "";
    if (fileName.length <= maxLength) return fileName;

    const lastDot = fileName.lastIndexOf(".");
    if (lastDot === -1) return fileName.slice(0, maxLength) + "...";

    const extension = fileName.slice(lastDot);
    const nameWithoutExt = fileName.slice(0, lastDot);
    const truncatedName = nameWithoutExt.slice(
      0,
      maxLength - 3 - extension.length
    );

    return `${truncatedName}...${extension}`;
  };

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
            <Ionicons name="person" size={40} color="#fff" />
          </LinearGradient>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Chargement de votre profil...
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
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.headerButton}>
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
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
          {/* Carte de profil */}
          <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
            <View style={styles.profileHeader}>
              <TouchableOpacity
                onPress={() => setShowPhotoOptions(true)}
                style={styles.avatarContainer}
                disabled={uploadLoading}
              >
                {uploadLoading ? (
                  <View
                    style={[
                      styles.avatarGradient,
                      { justifyContent: "center", alignItems: "center" },
                    ]}
                  >
                    <ActivityIndicator size="large" color={colors.primary} />
                  </View>
                ) : (
                  <>
                    {profile?.photo || newAvatar ? (
                      <Image
                        source={{ uri: newAvatar || profile?.photo }}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <LinearGradient
                        colors={[colors.primary, colors.secondary]}
                        style={styles.avatarGradient}
                      >
                        <View style={styles.avatarInner}>
                          <Text style={styles.avatarText}>
                            {profile?.user.firstName?.[0]?.toUpperCase() || ""}
                            {profile?.user.lastName?.[0]?.toUpperCase() || ""}
                          </Text>
                        </View>
                      </LinearGradient>
                    )}
                    <View
                      style={[
                        styles.editBadge,
                        { backgroundColor: colors.primary },
                      ]}
                    >
                      <Ionicons name="camera" size={12} color="#fff" />
                    </View>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: colors.text }]}>
                  {profile?.user.firstName} {profile?.user.lastName}
                </Text>
                <View style={styles.badgeContainer}>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          getStatusColor(profile?.status || "pending") + "20",
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor: getStatusColor(
                            profile?.status || "pending"
                          ),
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(profile?.status || "pending") },
                      ]}
                    >
                      {getStatusText(profile?.status || "pending")}
                    </Text>
                  </View>

                  {profile?.certification.isCertified && (
                    <View
                      style={[
                        styles.certBadge,
                        { backgroundColor: "#4CAF50" + "20" },
                      ]}
                    >
                      <Ionicons name="ribbon" size={12} color="#4CAF50" />
                      <Text style={[styles.certText, { color: "#4CAF50" }]}>
                        Certifié
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.contactSection}>
              <View style={styles.contactRow}>
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={colors.primary}
                />
                <Text style={[styles.contactText, { color: colors.text }]}>
                  {profile?.user.email}
                </Text>
              </View>
              <View style={styles.contactRow}>
                <Ionicons
                  name="call-outline"
                  size={18}
                  color={colors.primary}
                />
                <Text style={[styles.contactText, { color: colors.text }]}>
                  {profile?.user.phone}
                </Text>
              </View>
            </View>
          </View>

          {/* Statistiques */}
          <View style={styles.statsGrid}>
            <View style={[styles.statBox, { backgroundColor: colors.card }]}>
              <Ionicons name="car" size={24} color={colors.primary} />
              <Text style={[styles.statNumber, { color: colors.text }]}>
                {profile?.stats.totalInterventions || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Interventions
              </Text>
            </View>

            <View style={[styles.statBox, { backgroundColor: colors.card }]}>
              <Ionicons name="star" size={24} color="#FFD700" />
              <Text style={[styles.statNumber, { color: colors.text }]}>
                {profile?.stats.averageRating?.toFixed(1) || "0.0"}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Note
              </Text>
            </View>

            <View style={[styles.statBox, { backgroundColor: colors.card }]}>
              <Ionicons name="trending-up" size={24} color="#4CAF50" />
              <Text style={[styles.statNumber, { color: colors.text }]}>
                {profile?.stats.responseRate || 0}%
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Acceptation
              </Text>
            </View>

            <View style={[styles.statBox, { backgroundColor: colors.card }]}>
              <Ionicons name="wallet" size={24} color="#FF9800" />
              <Text style={[styles.statNumber, { color: colors.text }]}>
                {profile?.stats.totalEarnings?.toFixed(0) || 0}$
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Gains
              </Text>
            </View>
          </View>

          {/* Menu sections */}
          <View style={styles.menuSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Gestion
            </Text>

            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: colors.card }]}
              onPress={() => {
                setActiveModal("services");
                setSelectedServices(profile?.services || []);
              }}
            >
              <LinearGradient
                colors={[colors.primary + "20", colors.secondary + "10"]}
                style={styles.menuIconContainer}
              >
                <Ionicons name="construct" size={24} color={colors.primary} />
              </LinearGradient>
              <View style={styles.menuContent}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>
                  Services
                </Text>
                <Text
                  style={[styles.menuSubtitle, { color: colors.textSecondary }]}
                >
                  {profile?.services?.length || 0} services proposés
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: colors.card }]}
              onPress={() => {
                setActiveModal("equipment");
                setSelectedEquipment(
                  profile?.equipment.map((e) => e.name) || []
                );
              }}
            >
              <LinearGradient
                colors={[colors.primary + "20", colors.secondary + "10"]}
                style={styles.menuIconContainer}
              >
                <Ionicons name="build" size={24} color={colors.primary} />
              </LinearGradient>
              <View style={styles.menuContent}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>
                  Équipement
                </Text>
                <Text
                  style={[styles.menuSubtitle, { color: colors.textSecondary }]}
                >
                  {profile?.equipment?.length || 0} équipements
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: colors.card }]}
              onPress={() => {
                setActiveModal("zone");
                setRadius(profile?.serviceArea.radius?.toString() || "20");
                setAddress(profile?.address || "");
              }}
            >
              <LinearGradient
                colors={[colors.primary + "20", colors.secondary + "10"]}
                style={styles.menuIconContainer}
              >
                <Ionicons name="location" size={24} color={colors.primary} />
              </LinearGradient>
              <View style={styles.menuContent}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>
                  Zone d'intervention
                </Text>
                <Text
                  style={[styles.menuSubtitle, { color: colors.textSecondary }]}
                >
                  {profile?.serviceArea.radius || 20} km -{" "}
                  {profile?.address || "Adresse non définie"}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: colors.card }]}
              onPress={() => {
                setActiveModal("pricing");
                setBasePrice(profile?.pricing.basePrice?.toString() || "25");
                setPerKm(profile?.pricing.perKm?.toString() || "1");
                setPricingServices(profile?.pricing.services || []);
              }}
            >
              <LinearGradient
                colors={[colors.primary + "20", colors.secondary + "10"]}
                style={styles.menuIconContainer}
              >
                <Ionicons name="cash" size={24} color={colors.primary} />
              </LinearGradient>
              <View style={styles.menuContent}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>
                  Tarifs
                </Text>
                <Text
                  style={[styles.menuSubtitle, { color: colors.textSecondary }]}
                >
                  {profile?.pricing.basePrice || 25}$ de base +{" "}
                  {profile?.pricing.perKm || 1}$/km
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: colors.card }]}
              onPress={() => setActiveModal("documents")}
            >
              <LinearGradient
                colors={[colors.primary + "20", colors.secondary + "10"]}
                style={styles.menuIconContainer}
              >
                <Ionicons name="document" size={24} color={colors.primary} />
              </LinearGradient>
              <View style={styles.menuContent}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>
                  Documents
                </Text>
                <Text
                  style={[styles.menuSubtitle, { color: colors.textSecondary }]}
                >
                  {Object.values(documents).filter((d) => d?.url).length || 0}{" "}
                  documents
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: colors.card }]}
              onPress={async () => {
                setActiveModal("preferences");
                setNotifications(
                  profile?.preferences?.notifications || {
                    email: true,
                    sms: true,
                    push: true,
                  }
                );
                setSelectedLanguage(profile?.preferences?.language || "fr");
                try {
                  const savedTheme = await AsyncStorage.getItem("userTheme");
                  if (savedTheme) {
                    setSelectedTheme(savedTheme as "light" | "dark" | "system");
                  } else {
                    setSelectedTheme(profile?.preferences?.theme || "system");
                  }
                } catch (error) {
                  setSelectedTheme(profile?.preferences?.theme || "system");
                }
              }}
            >
              <LinearGradient
                colors={[colors.primary + "20", colors.secondary + "10"]}
                style={styles.menuIconContainer}
              >
                <Ionicons name="settings" size={24} color={colors.primary} />
              </LinearGradient>
              <View style={styles.menuContent}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>
                  Préférences
                </Text>
                <Text
                  style={[styles.menuSubtitle, { color: colors.textSecondary }]}
                >
                  Langue, thème, notifications
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Support et déconnexion */}
          <View style={styles.footerSection}>
            <TouchableOpacity
              style={[styles.supportButton, { backgroundColor: colors.card }]}
              onPress={() => Linking.openURL("mailto:support@kadima.com")}
            >
              <Ionicons
                name="help-circle-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.supportText, { color: colors.text }]}>
                Centre d'aide
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <LinearGradient
                colors={["#F44336", "#D32F2F"]}
                style={styles.logoutGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="log-out-outline" size={20} color="#fff" />
                <Text style={styles.logoutText}>Se déconnecter</Text>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={[styles.versionText, { color: colors.textSecondary }]}>
              Version 1.0.0
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Modal choix photo */}
      <Modal
        visible={showPhotoOptions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPhotoOptions(false)}
      >
        <BlurView intensity={90} tint={colorScheme} style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setShowPhotoOptions(false)}
            activeOpacity={1}
          />
          <Animated.View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.card,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                { color: colors.text, textAlign: "center", marginBottom: 20 },
              ]}
            >
              Photo de profil
            </Text>

            <TouchableOpacity
              style={[styles.photoOption, { borderColor: colors.border }]}
              onPress={handleTakePhoto}
            >
              <View
                style={[
                  styles.photoOptionIcon,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Ionicons name="camera" size={24} color={colors.primary} />
              </View>
              <View style={styles.photoOptionText}>
                <Text style={[styles.photoOptionTitle, { color: colors.text }]}>
                  Prendre une photo
                </Text>
                <Text
                  style={[
                    styles.photoOptionDesc,
                    { color: colors.textSecondary },
                  ]}
                >
                  Utiliser l'appareil photo
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.photoOption, { borderColor: colors.border }]}
              onPress={handleImagePick}
            >
              <View
                style={[
                  styles.photoOptionIcon,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Ionicons name="images" size={24} color={colors.primary} />
              </View>
              <View style={styles.photoOptionText}>
                <Text style={[styles.photoOptionTitle, { color: colors.text }]}>
                  Choisir dans la galerie
                </Text>
                <Text
                  style={[
                    styles.photoOptionDesc,
                    { color: colors.textSecondary },
                  ]}
                >
                  Sélectionner une photo existante
                </Text>
              </View>
            </TouchableOpacity>

            {(profile?.user.photo || newAvatar) && (
              <TouchableOpacity
                style={[styles.photoOption, { borderColor: colors.border }]}
                onPress={deletePhoto}
              >
                <View
                  style={[
                    styles.photoOptionIcon,
                    { backgroundColor: "#F44336" + "15" },
                  ]}
                >
                  <Ionicons name="trash" size={24} color="#F44336" />
                </View>
                <View style={styles.photoOptionText}>
                  <Text style={[styles.photoOptionTitle, { color: "#F44336" }]}>
                    Supprimer la photo
                  </Text>
                  <Text
                    style={[
                      styles.photoOptionDesc,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Revenir à l'avatar par défaut
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.modalButton, { marginTop: 10 }]}
              onPress={() => setShowPhotoOptions(false)}
            >
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.modalButtonGradient}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </BlurView>
      </Modal>

      {/* Modale Services */}
      <Modal
        visible={activeModal === "services"}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <BlurView intensity={90} tint={colorScheme} style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setActiveModal(null)}
          />
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
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Services
              </Text>
              <TouchableOpacity
                onPress={() => setActiveModal(null)}
                style={styles.modalClose}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {SERVICES_LIST.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={[
                    styles.modalItem,
                    { borderColor: colors.border },
                    selectedServices.includes(service.id) &&
                      styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    if (selectedServices.includes(service.id)) {
                      setSelectedServices(
                        selectedServices.filter((s) => s !== service.id)
                      );
                    } else {
                      setSelectedServices([...selectedServices, service.id]);
                    }
                  }}
                >
                  <View
                    style={[
                      styles.modalItemIcon,
                      { backgroundColor: service.color + "20" },
                    ]}
                  >
                    <Ionicons
                      name={service.icon}
                      size={22}
                      color={service.color}
                    />
                  </View>
                  <View style={styles.modalItemContent}>
                    <Text
                      style={[styles.modalItemTitle, { color: colors.text }]}
                    >
                      {service.label}
                    </Text>
                    <Text
                      style={[
                        styles.modalItemDesc,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {service.description}
                    </Text>
                  </View>
                  {selectedServices.includes(service.id) && (
                    <View
                      style={[
                        styles.modalCheck,
                        { backgroundColor: colors.primary },
                      ]}
                    >
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.modalButton} onPress={saveServices}>
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.modalButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.modalButtonText}>Enregistrer</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </BlurView>
      </Modal>

      {/* Modale Équipement */}
      <Modal
        visible={activeModal === "equipment"}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <BlurView intensity={90} tint={colorScheme} style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setActiveModal(null)}
          />
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
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Équipement
              </Text>
              <TouchableOpacity
                onPress={() => setActiveModal(null)}
                style={styles.modalClose}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {EQUIPMENT_LIST.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.modalItem,
                    { borderColor: colors.border },
                    selectedEquipment.includes(item.id) &&
                      styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    if (selectedEquipment.includes(item.id)) {
                      setSelectedEquipment(
                        selectedEquipment.filter((e) => e !== item.id)
                      );
                    } else {
                      setSelectedEquipment([...selectedEquipment, item.id]);
                    }
                  }}
                >
                  <View
                    style={[
                      styles.modalItemIcon,
                      { backgroundColor: colors.primary + "20" },
                    ]}
                  >
                    <Ionicons
                      name={item.icon}
                      size={22}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.modalItemContent}>
                    <Text
                      style={[styles.modalItemTitle, { color: colors.text }]}
                    >
                      {item.label}
                    </Text>
                    <Text
                      style={[
                        styles.modalItemDesc,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {item.category}
                    </Text>
                  </View>
                  {selectedEquipment.includes(item.id) && (
                    <View
                      style={[
                        styles.modalCheck,
                        { backgroundColor: colors.primary },
                      ]}
                    >
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={saveEquipment}
            >
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.modalButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.modalButtonText}>Enregistrer</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </BlurView>
      </Modal>

      {/* Modale Zone */}
      <Modal
        visible={activeModal === "zone"}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <BlurView intensity={90} tint={colorScheme} style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setActiveModal(null)}
          />
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
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Zone d'intervention
              </Text>
              <TouchableOpacity
                onPress={() => setActiveModal(null)}
                style={styles.modalClose}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text
                style={[styles.modalLabel, { color: colors.textSecondary }]}
              >
                Rayon d'action (km)
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.radiusScroll}
              >
                {[5, 10, 15, 20, 25, 30, 40, 50].map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.radiusButton,
                      parseInt(radius) === r && {
                        backgroundColor: colors.primary,
                      },
                    ]}
                    onPress={() => setRadius(r.toString())}
                  >
                    <Text
                      style={[
                        styles.radiusText,
                        {
                          color: parseInt(radius) === r ? "#fff" : colors.text,
                        },
                      ]}
                    >
                      {r} km
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text
                style={[
                  styles.modalLabel,
                  { color: colors.textSecondary, marginTop: 20 },
                ]}
              >
                Adresse
              </Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Votre adresse de base"
                placeholderTextColor={colors.placeholder}
                value={address}
                onChangeText={setAddress}
              />
            </View>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={saveServiceArea}
            >
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.modalButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.modalButtonText}>Enregistrer</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </BlurView>
      </Modal>

      {/* Modale Tarifs */}
      <Modal
        visible={activeModal === "pricing"}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <BlurView intensity={90} tint={colorScheme} style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setActiveModal(null)}
          />
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
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Tarifs
              </Text>
              <TouchableOpacity
                onPress={() => setActiveModal(null)}
                style={styles.modalClose}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalBody}>
                <View style={styles.priceRow}>
                  <View style={styles.priceInputContainer}>
                    <Text
                      style={[
                        styles.modalLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Prix de base ($)
                    </Text>
                    <TextInput
                      style={[
                        styles.priceInput,
                        {
                          backgroundColor: colors.background,
                          color: colors.text,
                          borderColor: colors.border,
                        },
                      ]}
                      placeholder="25"
                      placeholderTextColor={colors.placeholder}
                      value={basePrice}
                      onChangeText={setBasePrice}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.priceInputContainer}>
                    <Text
                      style={[
                        styles.modalLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Frais/km ($)
                    </Text>
                    <TextInput
                      style={[
                        styles.priceInput,
                        {
                          backgroundColor: colors.background,
                          color: colors.text,
                          borderColor: colors.border,
                        },
                      ]}
                      placeholder="1"
                      placeholderTextColor={colors.placeholder}
                      value={perKm}
                      onChangeText={setPerKm}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <Text
                  style={[
                    styles.modalLabel,
                    { color: colors.textSecondary, marginTop: 20 },
                  ]}
                >
                  Tarifs spécifiques
                </Text>
                {SERVICES_LIST.filter((s) =>
                  selectedServices.includes(s.id)
                ).map((service) => {
                  const existingPrice = pricingServices.find(
                    (p) => p.service === service.id
                  );
                  return (
                    <View key={service.id} style={styles.servicePriceRow}>
                      <Text
                        style={[
                          styles.servicePriceLabel,
                          { color: colors.text },
                        ]}
                      >
                        {service.label}
                      </Text>
                      <TextInput
                        style={[
                          styles.smallInput,
                          {
                            backgroundColor: colors.background,
                            color: colors.text,
                            borderColor: colors.border,
                          },
                        ]}
                        placeholder={basePrice}
                        placeholderTextColor={colors.placeholder}
                        value={existingPrice?.price?.toString() || ""}
                        onChangeText={(text) => {
                          const newPrice = parseFloat(text) || 0;
                          const newServices = pricingServices.filter(
                            (p) => p.service !== service.id
                          );
                          if (newPrice > 0) {
                            newServices.push({
                              service: service.id,
                              price: newPrice,
                            });
                          }
                          setPricingServices(newServices);
                        }}
                        keyboardType="numeric"
                      />
                    </View>
                  );
                })}
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.modalButton} onPress={savePricing}>
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.modalButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.modalButtonText}>Enregistrer</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </BlurView>
      </Modal>

      {/* Modale Documents */}
      <Modal
        visible={activeModal === "documents"}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <BlurView intensity={90} tint={colorScheme} style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setActiveModal(null)}
            activeOpacity={1}
          />
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
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Documents
              </Text>
              <TouchableOpacity
                onPress={() => setActiveModal(null)}
                style={styles.modalClose}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {["license", "insurance", "certification"].map((docType) => {
                const doc = documents[docType as keyof typeof documents];
                const status = getDocumentStatus(doc);

                return (
                  <View
                    key={docType}
                    style={[
                      styles.documentContainer,
                      { borderColor: colors.border },
                    ]}
                  >
                    <View style={styles.documentHeader}>
                      <View style={styles.documentTitleContainer}>
                        <View
                          style={[
                            styles.documentTypeIcon,
                            { backgroundColor: colors.primary + "15" },
                          ]}
                        >
                          <Ionicons
                            name={getDocumentIcon(docType)}
                            size={20}
                            color={colors.primary}
                          />
                        </View>
                        <View>
                          <Text
                            style={[
                              styles.documentType,
                              { color: colors.text },
                            ]}
                          >
                            {getDocumentLabel(docType)}
                          </Text>
                          {doc?.fileName && (
                            <Text
                              style={[
                                styles.documentFileName,
                                { color: colors.textSecondary },
                              ]}
                            >
                              {truncateFileName(doc.fileName)} •{" "}
                              {formatFileSize(doc.fileSize)}
                            </Text>
                          )}
                        </View>
                      </View>

                      <View
                        style={[
                          styles.documentStatusBadge,
                          { backgroundColor: status.color + "20" },
                        ]}
                      >
                        <Ionicons
                          name={status.icon}
                          size={12}
                          color={status.color}
                        />
                        <Text
                          style={[
                            styles.documentStatusText,
                            { color: status.color },
                          ]}
                        >
                          {status.label}
                        </Text>
                      </View>
                    </View>

                    {doc?.rejectionReason && (
                      <View style={styles.rejectionContainer}>
                        <Text
                          style={[
                            styles.rejectionText,
                            { color: colors.error },
                          ]}
                        >
                          {doc.rejectionReason}
                        </Text>
                      </View>
                    )}

                    {doc?.uploadedAt && (
                      <Text
                        style={[
                          styles.documentDate,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Uploadé le {formatDate(doc.uploadedAt)}
                      </Text>
                    )}

                    <View style={styles.documentActions}>
                      {(!doc || doc.status === "missing") && (
                        <TouchableOpacity
                          style={[
                            styles.documentActionButton,
                            { borderColor: colors.primary },
                          ]}
                          onPress={() => pickDocument(docType)}
                          disabled={uploadingDoc === docType}
                        >
                          {uploadingDoc === docType ? (
                            <View style={styles.uploadProgress}>
                              <ActivityIndicator
                                size="small"
                                color={colors.primary}
                              />
                              {docProgress[docType] !== undefined && (
                                <Text
                                  style={[
                                    styles.uploadProgressText,
                                    { color: colors.primary },
                                  ]}
                                >
                                  {docProgress[docType]}%
                                </Text>
                              )}
                            </View>
                          ) : (
                            <>
                              <Ionicons
                                name="cloud-upload-outline"
                                size={18}
                                color={colors.primary}
                              />
                              <Text
                                style={[
                                  styles.documentActionText,
                                  { color: colors.primary },
                                ]}
                              >
                                Uploader
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}

                      {doc?.url && doc.status !== "verified" && (
                        <>
                          {doc.status !== "pending" && (
                            <TouchableOpacity
                              style={[
                                styles.documentActionButton,
                                { borderColor: colors.primary },
                              ]}
                              onPress={() => pickDocument(docType)}
                              disabled={uploadingDoc === docType}
                            >
                              <Ionicons
                                name="refresh-outline"
                                size={18}
                                color={colors.primary}
                              />
                              <Text
                                style={[
                                  styles.documentActionText,
                                  { color: colors.primary },
                                ]}
                              >
                                Remplacer
                              </Text>
                            </TouchableOpacity>
                          )}

                          {doc.status !== "verified" && (
                            <TouchableOpacity
                              style={[
                                styles.documentActionButton,
                                { borderColor: colors.error },
                              ]}
                              onPress={() => deleteDocument(docType)}
                            >
                              <Ionicons
                                name="trash-outline"
                                size={18}
                                color={colors.error}
                              />
                              <Text
                                style={[
                                  styles.documentActionText,
                                  { color: colors.error },
                                ]}
                              >
                                Supprimer
                              </Text>
                            </TouchableOpacity>
                          )}
                        </>
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setActiveModal(null)}
            >
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.modalButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.modalButtonText}>Fermer</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </BlurView>
      </Modal>

      {/* Modale Préférences */}
      <Modal
        visible={activeModal === "preferences"}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <BlurView intensity={90} tint={colorScheme} style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setActiveModal(null)}
          />
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
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Préférences
              </Text>
              <TouchableOpacity
                onPress={() => setActiveModal(null)}
                style={styles.modalClose}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.preferenceSection, { color: colors.text }]}>
                Langue
              </Text>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.id}
                  style={[
                    styles.preferenceItem,
                    selectedLanguage === lang.id && {
                      backgroundColor: colors.primary + "10",
                    },
                  ]}
                  onPress={() => setSelectedLanguage(lang.id)}
                >
                  <Ionicons
                    name={lang.icon}
                    size={22}
                    color={
                      selectedLanguage === lang.id
                        ? colors.primary
                        : colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.preferenceText,
                      {
                        color:
                          selectedLanguage === lang.id
                            ? colors.primary
                            : colors.text,
                      },
                    ]}
                  >
                    {lang.label}
                  </Text>
                  {selectedLanguage === lang.id && (
                    <View
                      style={[
                        styles.preferenceCheck,
                        { backgroundColor: colors.primary },
                      ]}
                    >
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}

              <Text
                style={[
                  styles.preferenceSection,
                  { color: colors.text, marginTop: 20 },
                ]}
              >
                Thème
              </Text>
              {THEMES.map((theme) => (
                <TouchableOpacity
                  key={theme.id}
                  style={[
                    styles.preferenceItem,
                    selectedTheme === theme.id && {
                      backgroundColor: colors.primary + "10",
                    },
                  ]}
                  onPress={() =>
                    setSelectedTheme(theme.id as "light" | "dark" | "system")
                  }
                >
                  <Ionicons
                    name={theme.icon}
                    size={22}
                    color={
                      selectedTheme === theme.id
                        ? colors.primary
                        : colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.preferenceText,
                      {
                        color:
                          selectedTheme === theme.id
                            ? colors.primary
                            : colors.text,
                      },
                    ]}
                  >
                    {theme.label}
                  </Text>
                  {selectedTheme === theme.id && (
                    <View
                      style={[
                        styles.preferenceCheck,
                        { backgroundColor: colors.primary },
                      ]}
                    >
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}

              <Text
                style={[
                  styles.preferenceSection,
                  { color: colors.text, marginTop: 20 },
                ]}
              >
                Notifications
              </Text>

              <View
                style={[
                  styles.notificationItem,
                  { backgroundColor: colors.background },
                ]}
              >
                <View style={styles.notificationInfo}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.notificationText, { color: colors.text }]}
                  >
                    Email
                  </Text>
                </View>
                <Switch
                  value={notifications.email}
                  onValueChange={(value) =>
                    setNotifications({ ...notifications, email: value })
                  }
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>

              <View
                style={[
                  styles.notificationItem,
                  { backgroundColor: colors.background },
                ]}
              >
                <View style={styles.notificationInfo}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.notificationText, { color: colors.text }]}
                  >
                    SMS
                  </Text>
                </View>
                <Switch
                  value={notifications.sms}
                  onValueChange={(value) =>
                    setNotifications({ ...notifications, sms: value })
                  }
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>

              <View
                style={[
                  styles.notificationItem,
                  { backgroundColor: colors.background },
                ]}
              >
                <View style={styles.notificationInfo}>
                  <Ionicons
                    name="notifications-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.notificationText, { color: colors.text }]}
                  >
                    Push
                  </Text>
                </View>
                <Switch
                  value={notifications.push}
                  onValueChange={(value) =>
                    setNotifications({ ...notifications, push: value })
                  }
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={savePreferences}
            >
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.modalButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.modalButtonText}>Enregistrer</Text>
              </LinearGradient>
            </TouchableOpacity>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
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
  content: {
    padding: 20,
  },
  profileCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatarContainer: {
    position: "relative",
  },
  avatarGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    padding: 3,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 37,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: "row",
    gap: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "500",
  },
  certBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  certText: {
    fontSize: 11,
    fontWeight: "500",
  },
  contactSection: {
    marginTop: 16,
    gap: 8,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  contactText: {
    fontSize: 13,
    flex: 1,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  statBox: {
    width: (width - 52) / 2,
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
    gap: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
  },
  menuSection: {
    gap: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    gap: 12,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
  },
  footerSection: {
    gap: 12,
  },
  supportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 30,
    gap: 8,
  },
  supportText: {
    fontSize: 14,
    fontWeight: "500",
  },
  logoutButton: {
    borderRadius: 30,
    overflow: "hidden",
  },
  logoutGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 8,
  },
  logoutText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  versionText: {
    textAlign: "center",
    fontSize: 11,
    marginTop: 8,
    marginBottom: 20,
  },
  photoOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    gap: 16,
  },
  photoOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  photoOptionText: {
    flex: 1,
  },
  photoOptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  photoOptionDesc: {
    fontSize: 13,
  },
  // Modales - Styles généraux
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    borderRadius: 28,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  modalClose: {
    padding: 4,
  },
  modalBody: {
    gap: 10,
  },
  modalLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  modalInput: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 14,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    gap: 12,
  },
  modalItemSelected: {
    borderColor: "transparent",
    backgroundColor: "rgba(0,0,0,0.02)",
  },
  modalItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  modalItemContent: {
    flex: 1,
  },
  modalItemTitle: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 2,
  },
  modalItemDesc: {
    fontSize: 12,
  },
  modalCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  modalButton: {
    marginTop: 20,
    borderRadius: 30,
    overflow: "hidden",
  },
  modalButtonGradient: {
    padding: 16,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  radiusScroll: {
    flexDirection: "row",
  },
  radiusButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 8,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  radiusText: {
    fontSize: 13,
    fontWeight: "500",
  },
  priceRow: {
    flexDirection: "row",
    gap: 12,
  },
  priceInputContainer: {
    flex: 1,
  },
  priceInput: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 14,
    marginTop: 4,
  },
  servicePriceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  servicePriceLabel: {
    fontSize: 14,
  },
  smallInput: {
    width: 80,
    padding: 10,
    borderWidth: 1,
    borderRadius: 12,
    textAlign: "center",
    fontSize: 13,
  },

  // Styles spécifiques pour les documents
  documentContainer: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  documentHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  documentTitleContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    flex: 1,
  },
  documentTypeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  documentType: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  documentFileName: {
    fontSize: 10,
    marginTop: 2,
    flexShrink: 1,
  },
  documentStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
    flexShrink: 0,
    marginLeft: 8,
  },
  documentStatusText: {
    fontSize: 9,
    fontWeight: "600",
  },
  rejectionContainer: {
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  rejectionText: {
    fontSize: 11,
  },
  documentDate: {
    fontSize: 10,
    marginBottom: 8,
  },
  documentActions: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  documentActionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  documentActionText: {
    fontSize: 11,
    fontWeight: "500",
  },
  uploadProgress: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  uploadProgressText: {
    fontSize: 11,
    fontWeight: "500",
    minWidth: 30,
  },
  emptyText: {
    fontSize: 13,
    fontStyle: "italic",
    textAlign: "center",
    padding: 20,
  },

  // Styles pour les préférences
  preferenceSection: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },
  preferenceItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    marginBottom: 6,
    gap: 10,
  },
  preferenceText: {
    flex: 1,
    fontSize: 14,
  },
  preferenceCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  notificationInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  notificationText: {
    fontSize: 14,
  },
});
