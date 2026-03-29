// app/settings/vehicles.tsx - Version design moderne avec backend complet

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Platform,
  StatusBar,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import { api } from "../../config/api";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";

interface Vehicle {
  _id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  isDefault?: boolean;
}

const PAYMENT_METHODS = [
  { id: "card", label: "Carte bancaire", icon: "card-outline" },
  { id: "paypal", label: "PayPal", icon: "logo-paypal" },
  { id: "apple_pay", label: "Apple Pay", icon: "logo-apple" },
  { id: "google_pay", label: "Google Pay", icon: "logo-google" },
];

const ASSISTANCE_TYPES = [
  {
    id: "sos_first",
    label: "Toujours appeler un helper en priorité",
    description: "Un helper est contacté immédiatement",
  },
  {
    id: "diagnostic_first",
    label: "D'abord le diagnostic IA, puis helper",
    description: "Analyse IA d'abord, puis helper si nécessaire",
  },
  {
    id: "auto",
    label: "Automatique selon la gravité",
    description: "L'IA décide de la meilleure action",
  },
];

export default function VehiclesSettingsScreen() {
  const router = useRouter();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme ?? "light"];

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [selectedDefaultVehicle, setSelectedDefaultVehicle] =
    useState<Vehicle | null>(null);
  const [selectedPayment, setSelectedPayment] = useState("card");
  const [selectedAssistance, setSelectedAssistance] = useState("sos_first");
  const [updatingDefault, setUpdatingDefault] = useState(false);

  // Modales
  const [defaultVehicleModalVisible, setDefaultVehicleModalVisible] =
    useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [assistanceModalVisible, setAssistanceModalVisible] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const itemsAnim = useRef(
    [1, 2, 3, 4].map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    loadVehicles();
    loadSettings();
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

    itemsAnim.forEach((anim, index) => {
      Animated.spring(anim, {
        toValue: 1,
        delay: 200 + index * 100,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const loadVehicles = async () => {
    try {
      setLoadingVehicles(true);
      const response = await api.get("/vehicles");
      const vehiclesList = response.data.data || [];
      setVehicles(vehiclesList);

      // Récupérer le véhicule par défaut depuis le backend
      const defaultVehicleResponse = await api.get("/users/default-vehicle");
      if (defaultVehicleResponse.data.data) {
        setSelectedDefaultVehicle(defaultVehicleResponse.data.data);
      } else if (vehiclesList.length > 0) {
        setSelectedDefaultVehicle(vehiclesList[0]);
      }
    } catch (error) {
      console.error("Erreur chargement véhicules:", error);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await api.get("/users/settings");
      const preferences = response.data.data || {};
      if (preferences.paymentMethod)
        setSelectedPayment(preferences.paymentMethod);
      if (preferences.assistanceType)
        setSelectedAssistance(preferences.assistanceType);
    } catch (error) {
      console.error("Erreur chargement paramètres:", error);
    }
  };

  const saveDefaultVehicle = async (vehicle: Vehicle) => {
    if (updatingDefault) return;
    setUpdatingDefault(true);
    try {
      await api.put("/users/default-vehicle", { vehicleId: vehicle._id });
      setSelectedDefaultVehicle(vehicle);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      console.error("Erreur sauvegarde véhicule par défaut:", error);
    } finally {
      setUpdatingDefault(false);
    }
  };

  const handleSelectDefaultVehicle = async (vehicle: Vehicle) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await saveDefaultVehicle(vehicle);
    setDefaultVehicleModalVisible(false);
  };

  const handleSelectPayment = async (methodId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPayment(methodId);
    try {
      await api.put("/users/settings", { paymentMethod: methodId });
    } catch (error) {
      console.error("Erreur sauvegarde méthode paiement:", error);
    }
    setPaymentModalVisible(false);
  };

  const handleSelectAssistance = async (typeId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAssistance(typeId);
    try {
      await api.put("/users/settings", { assistanceType: typeId });
    } catch (error) {
      console.error("Erreur sauvegarde type assistance:", error);
    }
    setAssistanceModalVisible(false);
  };

  const getPaymentLabel = () => {
    const method = PAYMENT_METHODS.find((m) => m.id === selectedPayment);
    return method?.label || "Carte bancaire";
  };

  const getPaymentIcon = () => {
    const method = PAYMENT_METHODS.find((m) => m.id === selectedPayment);
    return method?.icon || "card-outline";
  };

  const getAssistanceLabel = () => {
    const type = ASSISTANCE_TYPES.find((t) => t.id === selectedAssistance);
    return type?.label || "Toujours appeler un helper en priorité";
  };

  const getAssistanceDescription = () => {
    const type = ASSISTANCE_TYPES.find((t) => t.id === selectedAssistance);
    return type?.description || "";
  };

  const getVehicleDisplayName = (vehicle: Vehicle) => {
    return `${vehicle.make} ${vehicle.model} (${vehicle.year}) - ${vehicle.licensePlate}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Header avec gradient */}
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
          <Text style={styles.headerTitle}>Véhicules et assistance</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        {/* Véhicule par défaut */}
        <Animated.View
          style={[
            styles.menuItem,
            { backgroundColor: colors.surface },
            { transform: [{ scale: itemsAnim[0] }], opacity: itemsAnim[0] },
          ]}
        >
          <TouchableOpacity
            style={styles.menuItemContent}
            onPress={() => setDefaultVehicleModalVisible(true)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[colors.primary + "20", colors.primary + "10"]}
              style={styles.menuIcon}
            >
              <Ionicons name="star-outline" size={22} color={colors.primary} />
            </LinearGradient>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>
                Véhicule par défaut
              </Text>
              <Text
                style={[styles.menuSubtitle, { color: colors.textSecondary }]}
              >
                {loadingVehicles
                  ? "Chargement..."
                  : selectedDefaultVehicle
                  ? getVehicleDisplayName(selectedDefaultVehicle)
                  : "Aucun véhicule sélectionné"}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Méthode de paiement */}
        <Animated.View
          style={[
            styles.menuItem,
            { backgroundColor: colors.surface },
            { transform: [{ scale: itemsAnim[1] }], opacity: itemsAnim[1] },
          ]}
        >
          <TouchableOpacity
            style={styles.menuItemContent}
            onPress={() => setPaymentModalVisible(true)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[colors.primary + "20", colors.primary + "10"]}
              style={styles.menuIcon}
            >
              <Ionicons
                name={getPaymentIcon()}
                size={22}
                color={colors.primary}
              />
            </LinearGradient>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>
                Méthode de paiement
              </Text>
              <Text
                style={[styles.menuSubtitle, { color: colors.textSecondary }]}
              >
                {getPaymentLabel()}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Type d'assistance préféré */}
        <Animated.View
          style={[
            styles.menuItem,
            { backgroundColor: colors.surface },
            { transform: [{ scale: itemsAnim[2] }], opacity: itemsAnim[2] },
          ]}
        >
          <TouchableOpacity
            style={styles.menuItemContent}
            onPress={() => setAssistanceModalVisible(true)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[colors.primary + "20", colors.primary + "10"]}
              style={styles.menuIcon}
            >
              <Ionicons
                name="medkit-outline"
                size={22}
                color={colors.primary}
              />
            </LinearGradient>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>
                Type d'assistance préféré
              </Text>
              <Text
                style={[styles.menuSubtitle, { color: colors.textSecondary }]}
              >
                {getAssistanceLabel()}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Gérer mes véhicules - Lien vers la liste */}
        <Animated.View
          style={[
            styles.menuItem,
            styles.linkItem,
            { backgroundColor: colors.surface },
            { transform: [{ scale: itemsAnim[3] }], opacity: itemsAnim[3] },
          ]}
        >
          <TouchableOpacity
            style={styles.menuItemContent}
            onPress={() => router.push("/vehicles")}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[colors.primary + "20", colors.primary + "10"]}
              style={styles.menuIcon}
            >
              <Ionicons
                name="settings-outline"
                size={22}
                color={colors.primary}
              />
            </LinearGradient>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuTitle, { color: colors.primary }]}>
                Gérer mes véhicules
              </Text>
              <Text
                style={[styles.menuSubtitle, { color: colors.textSecondary }]}
              >
                Ajouter, modifier ou supprimer vos véhicules
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.bottomSpace} />
      </Animated.ScrollView>

      {/* Modal Véhicule par défaut */}
      <Modal
        visible={defaultVehicleModalVisible}
        transparent
        animationType="fade"
      >
        <BlurView
          intensity={90}
          style={styles.modalOverlay}
          tint={effectiveTheme === "dark" ? "dark" : "light"}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setDefaultVehicleModalVisible(false)}
            activeOpacity={1}
          />
          <Animated.View
            style={[
              styles.modalContent,
              { backgroundColor: colors.card },
              {
                transform: [
                  {
                    scale: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={[colors.primary + "10", colors.secondary + "05"]}
              style={styles.modalGradient}
            >
              <View style={styles.modalHeader}>
                <LinearGradient
                  colors={[colors.primary + "20", colors.primary + "10"]}
                  style={styles.modalIcon}
                >
                  <Ionicons name="star" size={24} color={colors.primary} />
                </LinearGradient>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Véhicule par défaut
                </Text>
                <TouchableOpacity
                  onPress={() => setDefaultVehicleModalVisible(false)}
                  style={styles.modalClose}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {loadingVehicles ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text
                      style={[
                        styles.loadingText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Chargement...
                    </Text>
                  </View>
                ) : vehicles.length > 0 ? (
                  vehicles.map((vehicle) => (
                    <TouchableOpacity
                      key={vehicle._id}
                      style={[
                        styles.vehicleOption,
                        selectedDefaultVehicle?._id === vehicle._id && {
                          backgroundColor: colors.primary + "10",
                          borderColor: colors.primary,
                        },
                      ]}
                      onPress={() => handleSelectDefaultVehicle(vehicle)}
                    >
                      <View style={styles.vehicleOptionContent}>
                        <LinearGradient
                          colors={[
                            colors.primary + "15",
                            colors.primary + "05",
                          ]}
                          style={styles.vehicleIcon}
                        >
                          <Ionicons
                            name="car"
                            size={20}
                            color={colors.primary}
                          />
                        </LinearGradient>
                        <View>
                          <Text
                            style={[
                              styles.vehicleName,
                              {
                                color:
                                  selectedDefaultVehicle?._id === vehicle._id
                                    ? colors.primary
                                    : colors.text,
                              },
                            ]}
                          >
                            {vehicle.make} {vehicle.model}
                          </Text>
                          <Text
                            style={[
                              styles.vehiclePlate,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {vehicle.licensePlate} • {vehicle.year}
                          </Text>
                        </View>
                      </View>
                      {selectedDefaultVehicle?._id === vehicle._id && (
                        <Ionicons
                          name="checkmark"
                          size={20}
                          color={colors.primary}
                        />
                      )}
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyContainer}>
                    <Ionicons
                      name="car-outline"
                      size={48}
                      color={colors.textSecondary}
                    />
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
                        styles.addButton,
                        { backgroundColor: colors.primary },
                      ]}
                      onPress={() => {
                        setDefaultVehicleModalVisible(false);
                        router.push("/vehicles/add");
                      }}
                    >
                      <Text style={styles.addButtonText}>
                        Ajouter un véhicule
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            </LinearGradient>
          </Animated.View>
        </BlurView>
      </Modal>

      {/* Modal Méthode de paiement */}
      <Modal visible={paymentModalVisible} transparent animationType="fade">
        <BlurView
          intensity={90}
          style={styles.modalOverlay}
          tint={effectiveTheme === "dark" ? "dark" : "light"}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setPaymentModalVisible(false)}
            activeOpacity={1}
          />
          <Animated.View
            style={[
              styles.modalContent,
              { backgroundColor: colors.card },
              {
                transform: [
                  {
                    scale: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={[colors.primary + "10", colors.secondary + "05"]}
              style={styles.modalGradient}
            >
              <View style={styles.modalHeader}>
                <LinearGradient
                  colors={[colors.primary + "20", colors.primary + "10"]}
                  style={styles.modalIcon}
                >
                  <Ionicons name="card" size={24} color={colors.primary} />
                </LinearGradient>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Méthode de paiement
                </Text>
                <TouchableOpacity
                  onPress={() => setPaymentModalVisible(false)}
                  style={styles.modalClose}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {PAYMENT_METHODS.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.optionItem,
                    selectedPayment === method.id && {
                      backgroundColor: colors.primary + "10",
                    },
                  ]}
                  onPress={() => handleSelectPayment(method.id)}
                >
                  <View style={styles.optionLeft}>
                    <LinearGradient
                      colors={[colors.primary + "15", colors.primary + "05"]}
                      style={styles.optionIcon}
                    >
                      <Ionicons
                        name={method.icon}
                        size={22}
                        color={
                          selectedPayment === method.id
                            ? colors.primary
                            : colors.textSecondary
                        }
                      />
                    </LinearGradient>
                    <Text
                      style={[
                        styles.optionText,
                        {
                          color:
                            selectedPayment === method.id
                              ? colors.primary
                              : colors.text,
                        },
                      ]}
                    >
                      {method.label}
                    </Text>
                  </View>
                  {selectedPayment === method.id && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </LinearGradient>
          </Animated.View>
        </BlurView>
      </Modal>

      {/* Modal Type d'assistance */}
      <Modal visible={assistanceModalVisible} transparent animationType="fade">
        <BlurView
          intensity={90}
          style={styles.modalOverlay}
          tint={effectiveTheme === "dark" ? "dark" : "light"}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setAssistanceModalVisible(false)}
            activeOpacity={1}
          />
          <Animated.View
            style={[
              styles.modalContent,
              { backgroundColor: colors.card },
              {
                transform: [
                  {
                    scale: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={[colors.primary + "10", colors.secondary + "05"]}
              style={styles.modalGradient}
            >
              <View style={styles.modalHeader}>
                <LinearGradient
                  colors={[colors.primary + "20", colors.primary + "10"]}
                  style={styles.modalIcon}
                >
                  <Ionicons name="medkit" size={24} color={colors.primary} />
                </LinearGradient>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Type d'assistance préféré
                </Text>
                <TouchableOpacity
                  onPress={() => setAssistanceModalVisible(false)}
                  style={styles.modalClose}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {ASSISTANCE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.assistanceOption,
                    selectedAssistance === type.id && {
                      backgroundColor: colors.primary + "10",
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => handleSelectAssistance(type.id)}
                >
                  <View style={styles.assistanceContent}>
                    <Text
                      style={[
                        styles.assistanceLabel,
                        {
                          color:
                            selectedAssistance === type.id
                              ? colors.primary
                              : colors.text,
                        },
                      ]}
                    >
                      {type.label}
                    </Text>
                    <Text
                      style={[
                        styles.assistanceDescription,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {type.description}
                    </Text>
                  </View>
                  {selectedAssistance === type.id && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
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
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  menuItem: {
    borderRadius: 20,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
  },
  linkItem: {
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.3)",
  },
  bottomSpace: {
    height: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 20,
  },
  modalGradient: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  modalIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  modalClose: {
    padding: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  vehicleOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    marginBottom: 8,
  },
  vehicleOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  vehicleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  vehicleName: {
    fontSize: 15,
    fontWeight: "600",
  },
  vehiclePlate: {
    fontSize: 12,
    marginTop: 2,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  optionText: {
    fontSize: 15,
  },
  assistanceOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    marginBottom: 8,
  },
  assistanceContent: {
    flex: 1,
  },
  assistanceLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  assistanceDescription: {
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: "center",
    padding: 40,
    gap: 16,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  addButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
