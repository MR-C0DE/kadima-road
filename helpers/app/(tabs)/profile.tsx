// helpers/app/(tabs)/profile.tsx - AJOUTER useFocusEffect

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  StatusBar,
  Platform,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router"; // ← AJOUTER useFocusEffect
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { api } from "../../config/api";
import { Colors } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";

// Composants modulaires
import {
  ProfileHeader,
  ProfileStats,
  ProfileMenu,
  ProfileFooter,
  ProfilePhotoModal,
  HelperProfile,
} from "../../components/profile";

// Constantes
const CACHE_KEY = "helper_profile_cache";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default function ProfileScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const { effectiveTheme, theme: contextTheme, setTheme } = useTheme();
  const colors = Colors[effectiveTheme ?? "light"];

  // États principaux
  const [profile, setProfile] = useState<HelperProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);

  // États pour les formulaires (gardés pour l'affichage)
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [pricingServices, setPricingServices] = useState<any[]>([]);
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

  // Refs
  const isMountedRef = useRef(true);
  const isFetchingRef = useRef(false);

  // ============================================
  // SYNC THÈME
  // ============================================
  useEffect(() => {
    if (contextTheme) {
      setSelectedTheme(contextTheme);
    }
  }, [contextTheme]);

  // ============================================
  // CHARGEMENT
  // ============================================
  const loadProfile = useCallback(
    async (forceRefresh = false) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        if (!forceRefresh) {
          const cached = await AsyncStorage.getItem(CACHE_KEY);
          if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_DURATION && data) {
              setProfile(data);
              setSelectedServices(data.services || []);
              setSelectedEquipment(
                data.equipment?.map((e: any) => e.name) || []
              );
              setBasePrice(data.pricing?.basePrice?.toString() || "");
              setPerKm(data.pricing?.perKm?.toString() || "");
              setPricingServices(data.pricing?.services || []);
              setRadius(data.serviceArea?.radius?.toString() || "20");
              setAddress(data.address || data.serviceArea?.address || "");
              setNotifications(
                data.preferences?.notifications || {
                  email: true,
                  sms: true,
                  push: true,
                }
              );
              setSelectedLanguage(data.preferences?.language || "fr");

              if (!contextTheme) {
                const savedTheme = data.preferences?.theme || "system";
                setSelectedTheme(savedTheme);
                setTheme(savedTheme);
              }

              setLoading(false);
              isFetchingRef.current = false;
              return;
            }
          }
        }

        const [profileResponse, documentsResponse] = await Promise.all([
          api.get("/helpers/profile/me"),
          api.get("/documents").catch(() => ({ data: { data: {} } })),
        ]);

        const profileData = profileResponse.data.data;
        const documentsData = documentsResponse.data?.data || {};

        const mergedData = {
          ...profileData,
          documents: documentsData,
        };

        setProfile(mergedData);
        setSelectedServices(mergedData.services || []);
        setSelectedEquipment(
          mergedData.equipment?.map((e: any) => e.name) || []
        );
        setBasePrice(mergedData.pricing?.basePrice?.toString() || "");
        setPerKm(mergedData.pricing?.perKm?.toString() || "");
        setPricingServices(mergedData.pricing?.services || []);
        setRadius(mergedData.serviceArea?.radius?.toString() || "20");
        setAddress(mergedData.address || mergedData.serviceArea?.address || "");
        setNotifications(
          mergedData.preferences?.notifications || {
            email: true,
            sms: true,
            push: true,
          }
        );
        setSelectedLanguage(mergedData.preferences?.language || "fr");

        if (!contextTheme) {
          const themeFromApi = mergedData.preferences?.theme || "system";
          setSelectedTheme(themeFromApi);
          setTheme(themeFromApi);
        } else {
          setSelectedTheme(contextTheme);
        }

        await AsyncStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ data: mergedData, timestamp: Date.now() })
        );
      } catch (error) {
        console.error("Erreur chargement profil:", error);
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
        isFetchingRef.current = false;
      }
    },
    [setTheme, contextTheme]
  );

  useEffect(() => {
    isMountedRef.current = true;
    loadProfile();
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ✅ AJOUTER CETTE SECTION - Recharge automatiquement quand on revient sur l'écran
  useFocusEffect(
    useCallback(() => {
      // Recharger les données à chaque focus
      loadProfile(true);
      return () => {};
    }, [])
  );

  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await loadProfile(true);
  };

  // ============================================
  // PHOTO DE PROFIL
  // ============================================

  const uploadPhoto = async (uri: string) => {
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("photo", {
        uri,
        type: "image/jpeg",
        name: `profile_${Date.now()}.jpg`,
      } as any);

      await api.post("/helpers/profile/photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await loadProfile(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Succès", "Photo de profil mise à jour");
    } catch (error) {
      Alert.alert("Erreur", "Impossible de télécharger l'image");
    } finally {
      setUploadingPhoto(false);
      setPhotoModalVisible(false);
    }
  };

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission refusée",
        "Vous devez autoriser l'accès à la caméra"
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await uploadPhoto(result.assets[0].uri);
    }
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission refusée",
        "Vous devez autoriser l'accès à la galerie"
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await uploadPhoto(result.assets[0].uri);
    }
  };

  const handleDeletePhoto = async () => {
    setUploadingPhoto(true);
    try {
      await api.delete("/helpers/profile/photo");
      await loadProfile(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Succès", "Photo supprimée");
    } catch (error) {
      Alert.alert("Erreur", "Impossible de supprimer la photo");
    } finally {
      setUploadingPhoto(false);
      setPhotoModalVisible(false);
    }
  };

  // ============================================
  // NAVIGATION VERS LES PARAMÈTRES
  // ============================================

  const handleMenuItemPress = (itemId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    switch (itemId) {
      case "services":
        router.push("/settings/services");
        break;
      case "equipment":
        router.push("/settings/equipment");
        break;
      case "zone":
        router.push("/settings/zone");
        break;
      case "pricing":
        router.push("/settings/pricing");
        break;
      case "documents":
        router.push("/settings/documents");
        break;
      case "appearance":
        router.push("/settings/appearance");
        break;
      case "notifications":
        router.push("/settings/notifications");
        break;
      case "account":
        router.push("/settings/account");
        break;
      case "support":
        router.push("/settings/support");
        break;
      case "about":
        router.push("/settings/about");
        break;
      default:
        router.push("/settings");
    }
  };

  // ============================================
  // RENDU
  // ============================================

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.loadingLogo}
          >
            <Ionicons name="person" size={40} color="#fff" />
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

      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profil</Text>
          <TouchableOpacity
            onPress={onRefresh}
            style={styles.headerButton}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.content}>
          <ProfileHeader
            profile={profile}
            colors={colors}
            onPhotoPress={() => setPhotoModalVisible(true)}
            uploadingPhoto={uploadingPhoto}
          />
          <ProfileStats profile={profile} colors={colors} />

          {/* Menu - redirige vers /settings */}
          <ProfileMenu
            profile={profile}
            colors={colors}
            onMenuItemPress={handleMenuItemPress}
          />

          <ProfileFooter
            colors={colors}
            onLogout={() => {
              Alert.alert(
                "Déconnexion",
                "Voulez-vous vraiment vous déconnecter ?",
                [
                  { text: "Annuler", style: "cancel" },
                  {
                    text: "Se déconnecter",
                    onPress: logout,
                    style: "destructive",
                  },
                ]
              );
            }}
          />
        </View>
      </ScrollView>

      {/* Modal photo de profil */}
      <ProfilePhotoModal
        visible={photoModalVisible}
        colors={colors}
        colorScheme={effectiveTheme}
        onClose={() => setPhotoModalVisible(false)}
        onTakePhoto={handleTakePhoto}
        onPickImage={handlePickImage}
        onDeletePhoto={handleDeletePhoto}
        hasPhoto={!!profile?.photo}
      />
    </View>
  );
}

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
    fontSize: 14,
  },
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
  content: {
    padding: 20,
  },
});
