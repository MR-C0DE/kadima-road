// hooks/useProfileData.ts - Version avec stats et données complètes

import { useState, useEffect, useCallback, useRef } from "react";
import { useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { api } from "../config/api";
import Toast from "react-native-toast-message";
import * as Haptics from "expo-haptics";

const CACHE_KEY = "user_profile_cache";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const DEBOUNCE_DELAY = 2000; // 2 secondes entre les requêtes

// Interface pour les données utilisateur complètes
interface UserStats {
  totalInterventions: number;
  completedInterventions: number;
  totalSpent: number;
  averageRating: number;
  vehiclesCount: number;
  memberSince: string;
}

interface UserVehicle {
  _id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  color?: string;
  currentMileage: number;
  isDefault?: boolean;
  aiProfile?: {
    reliabilityScore: number;
    healthScore: number;
  };
}

interface UserDetails {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  photo?: string;
  isHelper: boolean;
  role: string;
  isVerified: boolean;
  createdAt: string;
  vehicles: UserVehicle[];
  stats: {
    interventionsAsUser: number;
    totalSpent: number;
    rating: number;
    // Stats supplémentaires de /users/stats/me
    totalInterventions?: number;
    completedInterventions?: number;
    averageRating?: number;
    vehiclesCount?: number;
    memberSince?: string;
  };
  recentInterventions?: any[];
  preferences?: {
    language: string;
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
  emergencyContacts?: Array<{
    _id: string;
    name: string;
    phone: string;
    relationship: string;
  }>;
}

export function useProfileData() {
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);

  const lastFetchRef = useRef<number>(0);
  const isFetchingRef = useRef<boolean>(false);

  // ============================================
  // FONCTION PRINCIPALE DE CHARGEMENT
  // ============================================
  const fetchUserProfile = async (forceRefresh = false) => {
    // Éviter les appels multiples simultanés
    if (isFetchingRef.current) {
      console.log("⚠️ Fetch déjà en cours, ignoré");
      return;
    }

    // Vérifier le délai minimum entre les requêtes
    const now = Date.now();
    if (!forceRefresh && now - lastFetchRef.current < DEBOUNCE_DELAY) {
      console.log("⏳ Trop de requêtes, attente...");
      return;
    }

    isFetchingRef.current = true;

    try {
      // 1. Vérifier le cache
      if (!forceRefresh) {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION && data) {
            console.log("📦 Données chargées depuis le cache");
            setUserDetails(data);
            setLoading(false);
            lastFetchRef.current = now;
            isFetchingRef.current = false;
            return;
          }
        }
      }

      console.log("🌐 Chargement des données depuis l'API...");

      // 2. Appels API parallèles
      const [userResponse, statsResponse, interventionsResponse] =
        await Promise.all([
          api.get("/auth/user/me"),
          api.get("/users/stats/me"),
          api.get("/interventions").catch(() => ({ data: { data: [] } })), // Non bloquant
        ]);

      const userData = userResponse.data.data;
      const statsData = statsResponse.data.data;
      const interventions = interventionsResponse.data?.data || [];

      // 3. Fusionner les données
      const mergedData: UserDetails = {
        ...userData,
        stats: {
          // Stats de base
          interventionsAsUser: userData.stats?.interventionsAsUser || 0,
          totalSpent: userData.stats?.totalSpent || 0,
          rating: userData.stats?.rating || 0,
          // Stats supplémentaires
          totalInterventions: statsData.totalInterventions || 0,
          completedInterventions: statsData.completedInterventions || 0,
          averageRating: statsData.averageRating || 0,
          vehiclesCount:
            statsData.vehiclesCount || userData.vehicles?.length || 0,
          memberSince: statsData.memberSince || userData.createdAt,
        },
        recentInterventions: interventions.slice(0, 5), // Dernières 5 interventions
      };

      console.log("✅ Données fusionnées:", {
        firstName: mergedData.firstName,
        vehiclesCount: mergedData.stats.vehiclesCount,
        totalInterventions: mergedData.stats.totalInterventions,
      });

      // 4. Sauvegarder dans le cache
      await AsyncStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ data: mergedData, timestamp: Date.now() })
      );

      setUserDetails(mergedData);
      lastFetchRef.current = now;
    } catch (error: any) {
      console.error("❌ Erreur chargement profil:", error.message);

      // En cas d'erreur 429, utiliser le cache même s'il est expiré
      if (error.response?.status === 429) {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data } = JSON.parse(cached);
          console.log("📦 Utilisation du cache (rate limit)");
          setUserDetails(data);
        }
      }

      // Afficher une erreur seulement si on n'a pas de données
      if (!userDetails) {
        Toast.show({
          type: "error",
          text1: "Erreur",
          text2: "Impossible de charger votre profil",
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  };

  // ============================================
  // RAFRAÎCHISSEMENT
  // ============================================
  const onRefresh = useCallback(async () => {
    if (isFetchingRef.current) return;
    console.log("🔄 Rafraîchissement manuel...");
    setRefreshing(true);
    await fetchUserProfile(true);
  }, []);

  // ============================================
  // CHARGEMENT INITIAL
  // ============================================
  useEffect(() => {
    fetchUserProfile();
  }, []);

  // ============================================
  // RAFRAÎCHISSEMENT AU FOCUS (avec debounce)
  // ============================================
  useFocusEffect(
    useCallback(() => {
      const timeout = setTimeout(() => {
        fetchUserProfile(true);
      }, 500);
      return () => clearTimeout(timeout);
    }, [])
  );

  // ============================================
  // GESTION DE LA PHOTO DE PROFIL
  // ============================================

  // Prendre une photo
  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Permission appareil photo refusée",
      });
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      await uploadPhoto(result.assets[0].uri);
    }
  };

  // Choisir depuis la galerie
  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Permission galerie refusée",
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      await uploadPhoto(result.assets[0].uri);
    }
  };

  // Upload de la photo
  const uploadPhoto = async (uri: string) => {
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("photo", {
        uri,
        type: "image/jpeg",
        name: "profile.jpg",
      } as any);

      await api.post("/users/profile/photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await fetchUserProfile(true); // Recharger les données

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: "success",
        text1: "Succès",
        text2: "Photo de profil mise à jour",
      });
      setPhotoModalVisible(false);
    } catch (error: any) {
      console.error("❌ Erreur upload photo:", error.message);
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2:
          error.response?.data?.message ||
          "Impossible de mettre à jour la photo",
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Supprimer la photo
  const handleDeletePhoto = async () => {
    setUploadingPhoto(true);
    try {
      await api.delete("/users/profile/photo");
      await fetchUserProfile(true);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: "success",
        text1: "Succès",
        text2: "Photo de profil supprimée",
      });
      setPhotoModalVisible(false);
    } catch (error: any) {
      console.error("❌ Erreur suppression photo:", error.message);
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2:
          error.response?.data?.message || "Impossible de supprimer la photo",
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  // ============================================
  // FONCTIONS UTILITAIRES
  // ============================================

  // Calculer la distance totale parcourue (tous véhicules)
  const getTotalDistance = useCallback((): number => {
    if (!userDetails?.vehicles) return 0;
    return userDetails.vehicles.reduce(
      (acc, v) => acc + (v.currentMileage || 0),
      0
    );
  }, [userDetails]);

  // Obtenir le véhicule principal
  const getMainVehicle = useCallback((): UserVehicle | null => {
    if (!userDetails?.vehicles?.length) return null;
    const defaultVehicle = userDetails.vehicles.find((v) => v.isDefault);
    return defaultVehicle || userDetails.vehicles[0];
  }, [userDetails]);

  // Obtenir le nombre de badges débloqués
  const getBadges = useCallback((): Array<{
    icon: string;
    label: string;
    color: string;
  }> => {
    const badges: Array<{ icon: string; label: string; color: string }> = [];
    const stats = userDetails?.stats;
    const totalDistance = getTotalDistance();

    if (
      (stats?.completedInterventions || stats?.interventionsAsUser || 0) >= 10
    ) {
      badges.push({ icon: "ribbon", label: "Fidèle", color: "#3B82F6" });
    }
    if (userDetails?.isHelper) {
      badges.push({ icon: "star", label: "Helper Certifié", color: "#22C55E" });
    }
    if (
      (stats?.averageRating || 0) >= 4.8 &&
      (stats?.completedInterventions || 0) >= 5
    ) {
      badges.push({ icon: "trophy", label: "Top Note", color: "#F59E0B" });
    }
    if (totalDistance >= 10000) {
      badges.push({ icon: "earth", label: "Grand Voyageur", color: "#06B6D4" });
    }

    return badges;
  }, [userDetails, getTotalDistance]);

  return {
    // Données
    userDetails,
    loading,
    refreshing,
    uploadingPhoto,
    photoModalVisible,
    setPhotoModalVisible,

    // Actions
    onRefresh,
    handlePickImage,
    handleTakePhoto,
    handleDeletePhoto,

    // Utilitaires
    getTotalDistance,
    getMainVehicle,
    getBadges,
  };
}
