// app/sos/index.tsx - Version avec flèche de retour (comme les autres pages)

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Animated,
  Easing,
  Platform,
  Modal,
  FlatList,
  StatusBar,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../config/api";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";
import * as Location from "expo-location";

const { width, height } = Dimensions.get("window");

// Types
interface Vehicle {
  _id?: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  isDefault: boolean;
}

// Types de problèmes SOS
const SOS_CASES = [
  {
    id: "accident",
    label: "Accident",
    icon: "car",
    description: "Accident de la route",
    gradient: ["#E63946", "#B71C1C"],
    severity: "critical",
  },
  {
    id: "battery",
    label: "Batterie",
    icon: "battery-dead",
    description: "Batterie à plat",
    gradient: ["#D4AF37", "#B8860B"],
    severity: "medium",
  },
  {
    id: "tire",
    label: "Pneu crevé",
    icon: "car-sport",
    description: "Changement de roue",
    gradient: ["#800020", "#4A0010"],
    severity: "medium",
  },
  {
    id: "fuel",
    label: "Panne essence",
    icon: "water",
    description: "Plus de carburant",
    gradient: ["#2C2C2C", "#1A1A1A"],
    severity: "low",
  },
  {
    id: "engine",
    label: "Panne moteur",
    icon: "cog",
    description: "Moteur qui ne démarre pas",
    gradient: ["#E63946", "#B71C1C"],
    severity: "high",
  },
  {
    id: "lockout",
    label: "Clé enfermée",
    icon: "key",
    description: "Clés à l'intérieur",
    gradient: ["#D4AF37", "#B8860B"],
    severity: "low",
  },
  {
    id: "towing",
    label: "Remorquage",
    icon: "car",
    description: "Besoin d'une dépanneuse",
    gradient: ["#800020", "#4A0010"],
    severity: "high",
  },
  {
    id: "other",
    label: "Autre",
    icon: "help-circle",
    description: "Problème non listé",
    gradient: ["#2C2C2C", "#1A1A1A"],
    severity: "medium",
  },
];

export default function SOSScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // États
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [customProblem, setCustomProblem] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [showVehicleModal, setShowVehicleModal] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
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

    getLocation();
    loadVehicles();
  }, []);

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission refusée",
          "La géolocalisation est nécessaire pour les alertes SOS",
          [
            { text: "Annuler", onPress: () => router.back() },
            { text: "Réessayer", onPress: getLocation },
          ]
        );
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });
      setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
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

  const loadVehicles = async () => {
    try {
      setLoadingVehicles(true);
      const response = await api.get("/auth/user/me");
      const userData = response.data.data;
      const vehiclesList = userData?.vehicles || [];
      setVehicles(vehiclesList);
      const defaultVehicle = vehiclesList.find(
        (v: Vehicle) => v.isDefault === true
      );
      const firstVehicle = vehiclesList[0];
      if (defaultVehicle) setSelectedVehicle(defaultVehicle);
      else if (firstVehicle) setSelectedVehicle(firstVehicle);
    } catch (error) {
      console.error("Erreur chargement véhicules:", error);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const refreshLocation = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await getLocation();
  };

  const handleEmergencyCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      "Appeler les secours",
      "Voulez-vous appeler les services d'urgence ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Appeler le 911",
          onPress: () => Linking.openURL("tel:911"),
          style: "destructive",
        },
      ]
    );
  };

  const handleSendSOS = async () => {
    if (!selectedCase) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Erreur", "Veuillez sélectionner un type de problème");
      return;
    }

    if (!selectedVehicle) {
      Alert.alert("Erreur", "Veuillez sélectionner un véhicule");
      return;
    }

    if (selectedCase === "other" && !customProblem.trim()) {
      Alert.alert("Erreur", "Veuillez décrire le problème");
      return;
    }

    if (!location) {
      Alert.alert("Erreur", "Position non disponible");
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLoading(true);

    try {
      const selectedCaseData = SOS_CASES.find((c) => c.id === selectedCase);
      const problemDescription =
        selectedCase === "other"
          ? customProblem
          : selectedCaseData?.description || "";

      const response = await api.post("/sos", {
        location: {
          coordinates: [location.lng, location.lat],
          address,
          accuracy: 10,
        },
        vehicleId: selectedVehicle._id,
        vehicle: {
          make: selectedVehicle.make,
          model: selectedVehicle.model,
          year: selectedVehicle.year,
          licensePlate: selectedVehicle.licensePlate,
        },
        problem: {
          description: problemDescription,
          category: selectedCase,
          severity: selectedCaseData?.severity || "medium",
        },
      });

      router.push({
        pathname: "/sos/waiting",
        params: {
          sosId: response.data.data.sosAlert._id,
        },
      });
    } catch (error: any) {
      Alert.alert(
        "Erreur",
        error.response?.data?.message || "Impossible d'envoyer l'alerte SOS"
      );
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    if (!selectedCase) return false;
    if (!selectedVehicle) return false;
    if (selectedCase === "other") return customProblem.trim().length > 0;
    return true;
  };

  const renderVehicleModal = () => (
    <Modal
      visible={showVehicleModal}
      animationType="slide"
      transparent
      onRequestClose={() => setShowVehicleModal(false)}
    >
      <BlurView intensity={80} tint={colorScheme} style={styles.modalOverlay}>
        <View
          style={[styles.modalContent, { backgroundColor: colors.surface }]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Sélectionner un véhicule
            </Text>
            <TouchableOpacity onPress={() => setShowVehicleModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {loadingVehicles ? (
            <View style={styles.loadingVehicles}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text
                style={[styles.loadingText, { color: colors.textSecondary }]}
              >
                Chargement...
              </Text>
            </View>
          ) : vehicles.length === 0 ? (
            <View style={styles.emptyVehicles}>
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
                style={[
                  styles.addVehicleButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => {
                  setShowVehicleModal(false);
                  router.push("/vehicles/add");
                }}
              >
                <Text style={styles.addVehicleButtonText}>
                  Ajouter un véhicule
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={vehicles}
              keyExtractor={(item, index) => item._id || index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.vehicleItem,
                    { borderColor: colors.border },
                    selectedVehicle?._id === item._id && {
                      borderColor: colors.primary,
                      backgroundColor: colors.primary + "10",
                    },
                  ]}
                  onPress={() => {
                    setSelectedVehicle(item);
                    setShowVehicleModal(false);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <View style={styles.vehicleInfo}>
                    <View
                      style={[
                        styles.vehicleIcon,
                        { backgroundColor: colors.primary + "10" },
                      ]}
                    >
                      <Ionicons name="car" size={24} color={colors.primary} />
                    </View>
                    <View>
                      <Text
                        style={[styles.vehicleName, { color: colors.text }]}
                      >
                        {item.make} {item.model} {item.year}
                      </Text>
                      <Text
                        style={[
                          styles.vehicleDetailsText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {item.licensePlate}
                      </Text>
                    </View>
                  </View>
                  {item.isDefault && (
                    <View
                      style={[
                        styles.defaultBadge,
                        { backgroundColor: colors.success },
                      ]}
                    >
                      <Text style={styles.defaultBadgeText}>Principal</Text>
                    </View>
                  )}
                  {selectedVehicle?._id === item._id && (
                    <View
                      style={[
                        styles.selectedBadge,
                        { backgroundColor: colors.primary },
                      ]}
                    >
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </BlurView>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      <Animated.View
        style={[
          styles.decorativeCircle,
          styles.circle1,
          {
            backgroundColor: colors.primary + "08",
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.decorativeCircle,
          styles.circle2,
          {
            backgroundColor: colors.secondary + "08",
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
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
          {/* Header avec gradient et flèche de retour */}
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.headerContent}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>SOS Urgence</Text>
              <View style={{ width: 40 }} />
            </View>
          </LinearGradient>

          {/* Bouton 911 */}
          <View style={styles.emergencyContainer}>
            <TouchableOpacity
              style={styles.emergencyCall}
              onPress={handleEmergencyCall}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#2C2C2C", "#1A1A1A"]}
                style={styles.emergencyGradient}
              >
                <View style={styles.emergencyContent}>
                  <Ionicons name="call" size={32} color="#fff" />
                  <View>
                    <Text style={styles.emergencyTitle}>Appeler le 911</Text>
                    <Text style={styles.emergencySubtitle}>Secours</Text>
                  </View>
                  <View style={styles.emergencyBadge}>
                    <Text style={styles.emergencyBadgeText}>24/7</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Localisation */}
          <TouchableOpacity
            style={[styles.locationCard, { backgroundColor: colors.surface }]}
            onPress={refreshLocation}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[colors.primary + "10", colors.secondary + "05"]}
              style={styles.locationGradient}
            >
              <View style={styles.locationIcon}>
                <Ionicons name="location" size={20} color={colors.primary} />
              </View>
              <View style={styles.locationInfo}>
                <Text style={[styles.locationLabel, { color: colors.primary }]}>
                  Votre position
                </Text>
                <Text
                  style={[styles.locationAddress, { color: colors.text }]}
                  numberOfLines={2}
                >
                  {address || "Recherche de votre position..."}
                </Text>
              </View>
              <Ionicons name="refresh" size={18} color={colors.textSecondary} />
            </LinearGradient>
          </TouchableOpacity>

          {/* Sélecteur de véhicule */}
          <TouchableOpacity
            style={[
              styles.vehicleSelector,
              { backgroundColor: colors.surface },
              !selectedVehicle && styles.vehicleSelectorError,
            ]}
            onPress={() => setShowVehicleModal(true)}
            disabled={loadingVehicles}
          >
            <View style={styles.vehicleSelectorContent}>
              <View
                style={[
                  styles.vehicleSelectorIcon,
                  { backgroundColor: colors.primary + "10" },
                ]}
              >
                <Ionicons
                  name="car"
                  size={20}
                  color={selectedVehicle ? colors.primary : colors.error}
                />
              </View>
              <View style={styles.vehicleSelectorInfo}>
                <Text
                  style={[
                    styles.vehicleSelectorLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  Véhicule {!selectedVehicle && "*"}
                </Text>
                <Text
                  style={[
                    styles.vehicleSelectorValue,
                    { color: selectedVehicle ? colors.text : colors.error },
                  ]}
                >
                  {loadingVehicles
                    ? "Chargement..."
                    : selectedVehicle
                    ? `${selectedVehicle.make} ${selectedVehicle.model} - ${selectedVehicle.licensePlate}`
                    : "Aucun véhicule sélectionné"}
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          {/* Titre */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Que s'est-il passé ?
          </Text>

          {/* Grille des types de problèmes */}
          <View style={styles.casesGrid}>
            {SOS_CASES.map((caseItem, index) => (
              <Animated.View
                key={caseItem.id}
                style={[
                  styles.caseWrapper,
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
                <TouchableOpacity
                  style={[
                    styles.caseButton,
                    selectedCase === caseItem.id && styles.caseButtonSelected,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedCase(caseItem.id);
                  }}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={
                      selectedCase === caseItem.id
                        ? caseItem.gradient
                        : ["transparent", "transparent"]
                    }
                    style={[
                      styles.caseGradient,
                      selectedCase !== caseItem.id && {
                        borderWidth: 1,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={caseItem.icon}
                      size={32}
                      color={
                        selectedCase === caseItem.id ? "#fff" : colors.primary
                      }
                    />
                    <Text
                      style={[
                        styles.caseLabel,
                        {
                          color:
                            selectedCase === caseItem.id ? "#fff" : colors.text,
                          fontWeight:
                            selectedCase === caseItem.id ? "bold" : "normal",
                        },
                      ]}
                    >
                      {caseItem.label}
                    </Text>
                    <Text
                      style={[
                        styles.caseDescription,
                        {
                          color:
                            selectedCase === caseItem.id
                              ? "#fff"
                              : colors.textSecondary,
                        },
                      ]}
                    >
                      {caseItem.description}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>

          {/* Champ de description pour "Autre" */}
          {selectedCase === "other" && (
            <Animated.View
              style={[
                styles.otherContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <LinearGradient
                colors={[colors.primary + "10", colors.secondary + "05"]}
                style={styles.otherCard}
              >
                <View style={styles.otherHeader}>
                  <Ionicons
                    name="create-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={[styles.otherTitle, { color: colors.text }]}>
                    Décrivez le problème
                  </Text>
                  <Text style={[styles.otherRequired, { color: colors.error }]}>
                    *
                  </Text>
                </View>

                <TextInput
                  style={[
                    styles.otherInput,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="Ex: Bruit bizarre, fumée, voyant allumé, odeur suspecte..."
                  placeholderTextColor={colors.placeholder}
                  multiline
                  numberOfLines={4}
                  value={customProblem}
                  onChangeText={setCustomProblem}
                  textAlignVertical="top"
                />

                <Text
                  style={[styles.otherHint, { color: colors.textSecondary }]}
                >
                  <Ionicons name="information-circle" size={12} /> Une
                  description précise permet aux helpers de mieux vous aider
                </Text>
              </LinearGradient>
            </Animated.View>
          )}

          {/* Bouton d'envoi SOS */}
          <View style={styles.buttonContainer}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={[
                  styles.sosButton,
                  (!isFormValid() || loadingVehicles) && styles.disabledButton,
                ]}
                onPress={handleSendSOS}
                disabled={loading || !isFormValid() || loadingVehicles}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    isFormValid() && !loadingVehicles
                      ? selectedCase
                        ? SOS_CASES.find((c) => c.id === selectedCase)
                            ?.gradient || [colors.primary, colors.secondary]
                        : [colors.primary, colors.secondary]
                      : [colors.disabled, colors.disabled]
                  }
                  style={styles.sosButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="alert-circle" size={24} color="#fff" />
                      <Text style={styles.sosButtonText}>Envoyer SOS</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Note d'information */}
          <View style={styles.infoContainer}>
            <Ionicons
              name="information-circle"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              En envoyant ce SOS, votre position sera partagée avec les helpers
              à proximité
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {renderVehicleModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    bottom: -height * 0.3,
    left: -width * 0.3,
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
  },
  emergencyContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  emergencyCall: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  emergencyGradient: {
    padding: 16,
  },
  emergencyContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  emergencyTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  emergencySubtitle: {
    color: "#fff",
    fontSize: 12,
    opacity: 0.8,
  },
  emergencyBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  emergencyBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  locationCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    marginBottom: 20,
    overflow: "hidden",
  },
  locationGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.03)",
    justifyContent: "center",
    alignItems: "center",
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 14,
    fontWeight: "500",
  },
  vehicleSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  vehicleSelectorError: {
    borderWidth: 1,
    borderColor: "#F44336",
  },
  vehicleSelectorContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  vehicleSelectorIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  vehicleSelectorInfo: {
    flex: 1,
  },
  vehicleSelectorLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  vehicleSelectorValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  casesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  caseWrapper: {
    width: "48%",
    marginBottom: 12,
  },
  caseButton: {
    borderRadius: 20,
    overflow: "hidden",
  },
  caseButtonSelected: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  caseGradient: {
    padding: 20,
    alignItems: "center",
    borderRadius: 20,
    minHeight: 140,
  },
  caseLabel: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  caseDescription: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 4,
  },
  otherContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  otherCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  otherHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  otherTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  otherRequired: {
    fontSize: 16,
    fontWeight: "600",
  },
  otherInput: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    fontSize: 15,
    minHeight: 110,
    textAlignVertical: "top",
  },
  otherHint: {
    fontSize: 12,
    marginTop: 12,
    textAlign: "center",
  },
  buttonContainer: {
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 20,
  },
  sosButton: {
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#E63946",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  sosButtonGradient: {
    flexDirection: "row",
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  sosButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  disabledButton: {
    opacity: 0.6,
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  infoText: {
    fontSize: 12,
    textAlign: "center",
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  loadingVehicles: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  vehicleItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  vehicleInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  vehicleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  vehicleName: {
    fontSize: 15,
    fontWeight: "600",
  },
  vehicleDetailsText: {
    fontSize: 12,
    marginTop: 2,
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  selectedBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyVehicles: {
    alignItems: "center",
    padding: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  addVehicleButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addVehicleButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
