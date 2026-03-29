// app/helpers/request.tsx - Version améliorée avec design moderne

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
  Keyboard,
  Dimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { api } from "../../config/api";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";

const { width } = Dimensions.get("window");

// Types de problèmes
const PROBLEM_CATEGORIES = [
  { id: "battery", label: "Batterie", icon: "battery-dead", color: "#EF4444" },
  { id: "tire", label: "Pneu crevé", icon: "car-sport", color: "#F59E0B" },
  { id: "fuel", label: "Panne d'essence", icon: "water", color: "#3B82F6" },
  { id: "engine", label: "Problème moteur", icon: "cog", color: "#EF4444" },
  {
    id: "electrical",
    label: "Problème électrique",
    icon: "flash",
    color: "#8B5CF6",
  },
  { id: "accident", label: "Accident", icon: "alert-circle", color: "#EF4444" },
  { id: "other", label: "Autre", icon: "help-circle", color: "#6B7280" },
];

// Sévérités
const SEVERITY_LEVELS = [
  {
    id: "low",
    label: "Faible",
    description: "Peut attendre",
    color: "#22C55E",
    icon: "thermometer-outline",
  },
  {
    id: "medium",
    label: "Moyenne",
    description: "Besoin d'aide rapide",
    color: "#F59E0B",
    icon: "alert-outline",
  },
  {
    id: "high",
    label: "Élevée",
    description: "Urgent",
    color: "#EF4444",
    icon: "warning-outline",
  },
  {
    id: "critical",
    label: "Critique",
    description: "Danger immédiat",
    color: "#DC2626",
    icon: "alert-circle",
  },
];

export default function AssistanceRequestScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme ?? "light"];

  // Type d'assistance (helper, garage, towing)
  const type = params.type as "helpers" | "garages" | "towing";
  const providerId = params.id as string;
  const providerName = params.name as string;
  const providerDistance = parseFloat(params.distance as string) || 0;

  // États du formulaire
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("other");
  const [selectedSeverity, setSelectedSeverity] = useState("medium");
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [sending, setSending] = useState(false);
  const [location, setLocation] = useState<any>(null);
  const [address, setAddress] = useState("");
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    loadVehicles();
    getLocation();
  }, []);

  const loadVehicles = async () => {
    try {
      const response = await api.get("/vehicles");
      setVehicles(response.data.data || []);
      const defaultVehicle = response.data.data?.find((v: any) => v.isDefault);
      if (defaultVehicle) setSelectedVehicle(defaultVehicle);
      else if (response.data.data?.length > 0)
        setSelectedVehicle(response.data.data[0]);
    } catch (error) {
      console.error("Erreur chargement véhicules:", error);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Toast.show({
          type: "error",
          text1: "Permission refusée",
          text2: "La géolocalisation est nécessaire",
          position: "bottom",
        });
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation({
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      });

      const addressResult = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (addressResult[0]) {
        const addr = addressResult[0];
        setAddress(
          `${addr.street || ""} ${addr.city || ""} ${
            addr.region || ""
          }`.trim() || "Position obtenue"
        );
      }
    } catch (error) {
      console.error("Erreur localisation:", error);
    }
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Toast.show({
        type: "error",
        text1: "Permission refusée",
        text2: "Impossible d'accéder à la galerie",
        position: "bottom",
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setUploadingPhotos(true);
      setPhotos([...photos, result.assets[0].uri]);
      setUploadingPhotos(false);
    }
  };

  const removePhoto = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Veuillez décrire le problème",
        position: "bottom",
      });
      return;
    }

    if (!selectedVehicle) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Veuillez sélectionner un véhicule",
        position: "bottom",
      });
      return;
    }

    if (!location) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Position non disponible",
        position: "bottom",
      });
      return;
    }

    // Animation du bouton
    Animated.sequence([
      Animated.spring(buttonScale, {
        toValue: 0.95,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSending(true);

    try {
      const requestData = {
        type:
          type === "helpers"
            ? "helper"
            : type === "garages"
            ? "garage"
            : "towing",
        targetId: providerId,
        vehicleId: selectedVehicle._id,
        problem: {
          description: description.trim(),
          category: selectedCategory,
          severity: selectedSeverity,
          photos: photos,
        },
        location: {
          coordinates: [location.lng, location.lat],
          address: address,
        },
      };

      const response = await api.post("/assistance/request", requestData);

      Toast.show({
        type: "success",
        text1: "Demande envoyée !",
        text2: `${providerName} a été notifié`,
        position: "bottom",
        visibilityTime: 3000,
      });

      // Rediriger vers le suivi de la demande
      setTimeout(() => {
        router.push({
          pathname: "/helpers/tracking",
          params: {
            requestId: response.data.data.requestId,
            providerName,
            eta: response.data.data.eta,
          },
        });
      }, 1500);
    } catch (error: any) {
      console.error("Erreur envoi demande:", error);
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2:
          error.response?.data?.message || "Impossible d'envoyer la demande",
        position: "bottom",
      });
    } finally {
      setSending(false);
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case "helpers":
        return "people";
      case "garages":
        return "business";
      case "towing":
        return "car";
      default:
        return "help-circle";
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case "helpers":
        return colors.primary;
      case "garages":
        return "#3B82F6";
      case "towing":
        return "#F59E0B";
      default:
        return colors.primary;
    }
  };

  const getTypeTitle = () => {
    switch (type) {
      case "helpers":
        return "Demander de l'aide";
      case "garages":
        return "Demander un devis";
      case "towing":
        return "Demander un remorquage";
      default:
        return "Demander de l'aide";
    }
  };

  const formatDistance = (distance: number) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    }
    return `${distance.toFixed(1)} km`;
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
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
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{getTypeTitle()}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Informations du prestataire */}
        <View style={styles.providerInfo}>
          <View style={styles.providerBadge}>
            <Ionicons name={getTypeIcon()} size={14} color={getTypeColor()} />
            <Text style={[styles.providerBadgeText, { color: getTypeColor() }]}>
              {type === "helpers"
                ? "Helper"
                : type === "garages"
                ? "Garage"
                : "Remorquage"}
            </Text>
          </View>
          <Text style={styles.providerName}>{providerName}</Text>
          <Text style={styles.providerDistance}>
            À {formatDistance(providerDistance)}
          </Text>
        </View>
      </LinearGradient>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        {/* Véhicule */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={[colors.primary + "20", colors.secondary + "10"]}
              style={styles.sectionIcon}
            >
              <Ionicons name="car-outline" size={18} color={colors.primary} />
            </LinearGradient>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Véhicule concerné
            </Text>
          </View>

          {loadingVehicles ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : vehicles.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.vehicleScroll}
            >
              {vehicles.map((vehicle) => (
                <TouchableOpacity
                  key={vehicle._id}
                  style={[
                    styles.vehicleChip,
                    {
                      backgroundColor:
                        selectedVehicle?._id === vehicle._id
                          ? colors.primary + "20"
                          : colors.background,
                      borderColor:
                        selectedVehicle?._id === vehicle._id
                          ? colors.primary
                          : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedVehicle(vehicle)}
                >
                  <Text
                    style={[
                      styles.vehicleChipText,
                      {
                        color:
                          selectedVehicle?._id === vehicle._id
                            ? colors.primary
                            : colors.text,
                      },
                    ]}
                  >
                    {vehicle.make} {vehicle.model}
                  </Text>
                  {vehicle.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Principal</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <TouchableOpacity
              style={[styles.addVehicleButton, { borderColor: colors.border }]}
              onPress={() => router.push("/vehicles/add")}
            >
              <Ionicons name="add" size={20} color={colors.primary} />
              <Text style={[styles.addVehicleText, { color: colors.primary }]}>
                Ajouter un véhicule
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Description du problème */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={[colors.primary + "20", colors.secondary + "10"]}
              style={styles.sectionIcon}
            >
              <Ionicons
                name="document-text-outline"
                size={18}
                color={colors.primary}
              />
            </LinearGradient>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Décrivez le problème
            </Text>
          </View>

          <TextInput
            style={[
              styles.descriptionInput,
              {
                backgroundColor: colors.background,
                borderColor:
                  focusedInput === "description"
                    ? colors.primary
                    : colors.border,
                borderWidth: focusedInput === "description" ? 2 : 1,
                color: colors.text,
              },
            ]}
            placeholder="Ex: Ma voiture ne démarre pas, je n'entends rien..."
            placeholderTextColor={colors.placeholder}
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
            onFocus={() => setFocusedInput("description")}
            onBlur={() => setFocusedInput(null)}
            textAlignVertical="top"
          />
        </View>

        {/* Catégorie */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={[colors.primary + "20", colors.secondary + "10"]}
              style={styles.sectionIcon}
            >
              <Ionicons name="apps-outline" size={18} color={colors.primary} />
            </LinearGradient>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Type de problème
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
          >
            {PROBLEM_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor:
                      selectedCategory === cat.id
                        ? cat.color + "20"
                        : colors.background,
                    borderColor:
                      selectedCategory === cat.id ? cat.color : colors.border,
                  },
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Ionicons
                  name={cat.icon}
                  size={18}
                  color={
                    selectedCategory === cat.id
                      ? cat.color
                      : colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.categoryChipText,
                    {
                      color:
                        selectedCategory === cat.id ? cat.color : colors.text,
                    },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Sévérité */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={[colors.primary + "20", colors.secondary + "10"]}
              style={styles.sectionIcon}
            >
              <Ionicons
                name="warning-outline"
                size={18}
                color={colors.primary}
              />
            </LinearGradient>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Urgence
            </Text>
          </View>

          <View style={styles.severityGrid}>
            {SEVERITY_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.id}
                style={[
                  styles.severityCard,
                  {
                    backgroundColor:
                      selectedSeverity === level.id
                        ? level.color + "20"
                        : colors.background,
                    borderColor:
                      selectedSeverity === level.id
                        ? level.color
                        : colors.border,
                  },
                ]}
                onPress={() => setSelectedSeverity(level.id)}
              >
                <Ionicons
                  name={level.icon}
                  size={24}
                  color={
                    selectedSeverity === level.id
                      ? level.color
                      : colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.severityLabel,
                    {
                      color:
                        selectedSeverity === level.id
                          ? level.color
                          : colors.text,
                    },
                  ]}
                >
                  {level.label}
                </Text>
                <Text
                  style={[
                    styles.severityDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  {level.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Photos */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={[colors.primary + "20", colors.secondary + "10"]}
              style={styles.sectionIcon}
            >
              <Ionicons
                name="camera-outline"
                size={18}
                color={colors.primary}
              />
            </LinearGradient>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Photos (optionnel)
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.photosScroll}
          >
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoContainer}>
                <Image source={{ uri: photo }} style={styles.photo} />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => removePhoto(index)}
                >
                  <Ionicons
                    name="close-circle"
                    size={24}
                    color={colors.error}
                  />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={[styles.addPhotoButton, { borderColor: colors.border }]}
              onPress={pickImage}
              disabled={uploadingPhotos}
            >
              {uploadingPhotos ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Ionicons name="add" size={24} color={colors.primary} />
                  <Text
                    style={[styles.addPhotoText, { color: colors.primary }]}
                  >
                    Ajouter
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Localisation */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={[colors.primary + "20", colors.secondary + "10"]}
              style={styles.sectionIcon}
            >
              <Ionicons
                name="location-outline"
                size={18}
                color={colors.primary}
              />
            </LinearGradient>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Position
            </Text>
          </View>

          <View style={styles.locationContainer}>
            <Ionicons name="location" size={20} color={colors.primary} />
            <Text
              style={[styles.locationText, { color: colors.textSecondary }]}
              numberOfLines={2}
            >
              {address || "Recherche de votre position..."}
            </Text>
            <TouchableOpacity onPress={getLocation}>
              <Ionicons name="refresh" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bouton d'envoi */}
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
            disabled={sending}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.submitGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {sending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="send-outline" size={20} color="#fff" />
                  <Text style={styles.submitButtonText}>
                    Envoyer la demande
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.bottomSpace} />
      </Animated.ScrollView>

      <Toast />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 16,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  backButton: {
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
    flex: 1,
    textAlign: "center",
  },
  providerInfo: {
    alignItems: "center",
    marginTop: 16,
    paddingHorizontal: 20,
  },
  providerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  providerBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  providerName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  providerDistance: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.8,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  sectionCard: {
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  vehicleScroll: {
    flexDirection: "row",
  },
  vehicleChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1,
    marginRight: 10,
    gap: 8,
  },
  vehicleChipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  defaultBadge: {
    backgroundColor: "#22C55E",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  defaultBadgeText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "600",
  },
  addVehicleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  addVehicleText: {
    fontSize: 14,
    fontWeight: "500",
  },
  descriptionInput: {
    borderRadius: 16,
    padding: 14,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: "top",
  },
  categoryScroll: {
    flexDirection: "row",
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1,
    marginRight: 10,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  severityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  severityCard: {
    flex: 1,
    minWidth: (width - 52) / 2,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    gap: 8,
  },
  severityLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  severityDescription: {
    fontSize: 10,
    textAlign: "center",
  },
  photosScroll: {
    flexDirection: "row",
  },
  photoContainer: {
    position: "relative",
    marginRight: 12,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  removePhotoButton: {
    position: "absolute",
    top: -8,
    right: -8,
  },
  addPhotoButton: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  addPhotoText: {
    fontSize: 10,
    fontWeight: "500",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
  },
  submitButton: {
    borderRadius: 30,
    overflow: "hidden",
    marginTop: 8,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomSpace: {
    height: 20,
  },
});
