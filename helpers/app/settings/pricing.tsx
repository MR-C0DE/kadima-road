// helpers/app/settings/pricing.tsx
// Écran des tarifs - Prix de base, frais kilométriques, tarifs spécifiques

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  StatusBar,
  Animated,
  Modal,
  Dimensions,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../config/api";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";

const { width } = Dimensions.get("window");

// ============================================
// SERVICES DISPONIBLES POUR TARIFS SPÉCIFIQUES
// ============================================

const SERVICES = [
  {
    id: "battery",
    label: "Batterie",
    icon: "battery-dead",
    description: "Dépannage batterie",
    color: "#EF4444",
    defaultPrice: 25,
  },
  {
    id: "tire",
    label: "Pneu",
    icon: "car-sport",
    description: "Changement de pneu",
    color: "#F59E0B",
    defaultPrice: 30,
  },
  {
    id: "fuel",
    label: "Essence",
    icon: "water",
    description: "Livraison de carburant",
    color: "#3B82F6",
    defaultPrice: 35,
  },
  {
    id: "jumpstart",
    label: "Démarrage",
    icon: "flash",
    description: "Aide au démarrage",
    color: "#8B5CF6",
    defaultPrice: 25,
  },
  {
    id: "lockout",
    label: "Clés enfermées",
    icon: "key",
    description: "Ouverture de porte",
    color: "#EC4899",
    defaultPrice: 40,
  },
  {
    id: "towing",
    label: "Remorquage",
    icon: "car",
    description: "Remorquage léger",
    color: "#F97316",
    defaultPrice: 75,
  },
  {
    id: "diagnostic",
    label: "Diagnostic",
    icon: "medkit",
    description: "Diagnostic rapide",
    color: "#06B6D4",
    defaultPrice: 20,
  },
  {
    id: "minor_repair",
    label: "Petite réparation",
    icon: "construct",
    description: "Réparations mineures",
    color: "#10B981",
    defaultPrice: 45,
  },
];

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function PricingSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme ?? "light"];

  // États
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [basePrice, setBasePrice] = useState("25");
  const [perKm, setPerKm] = useState("1");
  const [servicePrices, setServicePrices] = useState<Record<string, number>>(
    {}
  );
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<{
    id: string;
    label: string;
    price: number;
  } | null>(null);
  const [editPrice, setEditPrice] = useState("");

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const expandAnim = useRef(new Animated.Value(0)).current;
  const itemsAnim = useRef([1, 2, 3].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    loadPricing();
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

  useEffect(() => {
    Animated.timing(expandAnim, {
      toValue: expanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [expanded]);

  // ============================================
  // CHARGEMENT DES TARIFS
  // ============================================

  const loadPricing = async () => {
    try {
      const response = await api.get("/helpers/profile/me");
      const profile = response.data.data;

      const pricing = profile.pricing || {};
      setBasePrice(pricing.basePrice?.toString() || "25");
      setPerKm(pricing.perKm?.toString() || "1");

      // Charger les tarifs spécifiques
      const prices: Record<string, number> = {};
      if (pricing.services) {
        pricing.services.forEach((s: any) => {
          prices[s.service] = s.price;
        });
      }
      setServicePrices(prices);

      // Charger les services sélectionnés
      setSelectedServices(profile.services || []);
    } catch (error) {
      console.error("Erreur chargement tarifs:", error);
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Impossible de charger vos tarifs",
        position: "bottom",
      });
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // SAUVEGARDE
  // ============================================

  const savePricing = async () => {
    if (saving) return;
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const pricingData = {
        basePrice: parseFloat(basePrice) || 0,
        perKm: parseFloat(perKm) || 0,
        services: Object.entries(servicePrices)
          .filter(([_, price]) => price > 0)
          .map(([service, price]) => ({
            service,
            price,
          })),
      };

      await api.put("/helpers/profile/me", {
        pricing: pricingData,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: "success",
        text1: "Tarifs mis à jour",
        text2: `Base: ${basePrice}$ + ${perKm}$/km`,
        position: "bottom",
        visibilityTime: 2000,
      });
    } catch (error: any) {
      console.error("Erreur sauvegarde tarifs:", error);
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: error.response?.data?.message || "Impossible de sauvegarder",
        position: "bottom",
      });
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // GESTION DES TARIFS SPÉCIFIQUES
  // ============================================

  const openEditModal = (serviceId: string) => {
    const service = SERVICES.find((s) => s.id === serviceId);
    if (!service) return;

    const currentPrice = servicePrices[serviceId] || service.defaultPrice;
    setEditingService({
      id: serviceId,
      label: service.label,
      price: currentPrice,
    });
    setEditPrice(currentPrice.toString());
    setEditModalVisible(true);
  };

  const saveServicePrice = () => {
    if (!editingService) return;

    const newPrice = parseFloat(editPrice);
    if (isNaN(newPrice) || newPrice < 0) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Veuillez entrer un prix valide",
        position: "bottom",
      });
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setServicePrices({
      ...servicePrices,
      [editingService.id]: newPrice,
    });
    setEditModalVisible(false);
    setEditingService(null);
  };

  const resetServicePrice = (serviceId: string) => {
    const service = SERVICES.find((s) => s.id === serviceId);
    if (!service) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newPrices = { ...servicePrices };
    delete newPrices[serviceId];
    setServicePrices(newPrices);
  };

  // ============================================
  // CALCULS
  // ============================================

  const calculateEstimate = (distance: number = 10) => {
    const base = parseFloat(basePrice) || 0;
    const km = parseFloat(perKm) || 0;
    return base + km * distance;
  };

  const expandHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 300],
  });

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
            <Ionicons name="cash" size={40} color="#fff" />
          </LinearGradient>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Chargement...
          </Text>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  const estimate = calculateEstimate();
  const hasCustomPrices = Object.keys(servicePrices).length > 0;

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
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tarifs</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        {/* Prix de base et frais/km */}
        <Animated.View
          style={[
            styles.priceCard,
            { backgroundColor: colors.surface },
            { transform: [{ scale: itemsAnim[0] }], opacity: itemsAnim[0] },
          ]}
        >
          <View style={styles.priceRow}>
            <View style={styles.priceInputContainer}>
              <Text
                style={[styles.priceLabel, { color: colors.textSecondary }]}
              >
                Prix de base
              </Text>
              <View
                style={[
                  styles.priceInputWrapper,
                  { borderColor: colors.border },
                ]}
              >
                <Text
                  style={[styles.currencySymbol, { color: colors.primary }]}
                >
                  $
                </Text>
                <TextInput
                  style={[styles.priceInput, { color: colors.text }]}
                  placeholder="25"
                  placeholderTextColor={colors.placeholder}
                  value={basePrice}
                  onChangeText={setBasePrice}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.priceInputContainer}>
              <Text
                style={[styles.priceLabel, { color: colors.textSecondary }]}
              >
                Frais par km
              </Text>
              <View
                style={[
                  styles.priceInputWrapper,
                  { borderColor: colors.border },
                ]}
              >
                <Text
                  style={[styles.currencySymbol, { color: colors.primary }]}
                >
                  $
                </Text>
                <TextInput
                  style={[styles.priceInput, { color: colors.text }]}
                  placeholder="1"
                  placeholderTextColor={colors.placeholder}
                  value={perKm}
                  onChangeText={setPerKm}
                  keyboardType="numeric"
                />
                <Text
                  style={[styles.unitText, { color: colors.textSecondary }]}
                >
                  /km
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Aperçu des prix */}
        <Animated.View
          style={[
            styles.previewCard,
            { backgroundColor: colors.surface },
            { transform: [{ scale: itemsAnim[1] }], opacity: itemsAnim[1] },
          ]}
        >
          <Text style={[styles.previewTitle, { color: colors.textSecondary }]}>
            Estimation pour 10 km
          </Text>
          <Text style={[styles.previewValue, { color: colors.success }]}>
            ${estimate.toFixed(2)}
          </Text>
          <Text style={[styles.previewHint, { color: colors.textSecondary }]}>
            {basePrice || "0"}$ de base + {perKm || "0"}$/km × 10km
          </Text>
        </Animated.View>

        {/* Tarifs spécifiques (dépliant) */}
        {selectedServices.length > 0 && (
          <Animated.View
            style={[
              styles.specificCard,
              { backgroundColor: colors.surface },
              { transform: [{ scale: itemsAnim[2] }], opacity: itemsAnim[2] },
            ]}
          >
            <TouchableOpacity
              style={styles.specificHeader}
              onPress={() => setExpanded(!expanded)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={[colors.primary + "20", colors.secondary + "10"]}
                style={styles.specificIcon}
              >
                <Ionicons name="pricetag" size={18} color={colors.primary} />
              </LinearGradient>
              <Text style={[styles.specificTitle, { color: colors.text }]}>
                Tarifs spécifiques
              </Text>
              <View style={styles.specificRight}>
                {hasCustomPrices && (
                  <View
                    style={[
                      styles.customBadge,
                      { backgroundColor: colors.primary + "15" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.customBadgeText,
                        { color: colors.primary },
                      ]}
                    >
                      {Object.keys(servicePrices).length}
                    </Text>
                  </View>
                )}
                <Ionicons
                  name={expanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={colors.textSecondary}
                />
              </View>
            </TouchableOpacity>

            <Animated.View style={{ height: expandHeight, overflow: "hidden" }}>
              <View style={styles.servicesList}>
                {SERVICES.filter((s) => selectedServices.includes(s.id)).map(
                  (service) => {
                    const customPrice = servicePrices[service.id];
                    const displayPrice = customPrice || service.defaultPrice;
                    const isCustom = !!customPrice;

                    return (
                      <View key={service.id} style={styles.serviceItem}>
                        <View style={styles.serviceLeft}>
                          <View
                            style={[
                              styles.serviceIcon,
                              { backgroundColor: service.color + "15" },
                            ]}
                          >
                            <Ionicons
                              name={service.icon}
                              size={20}
                              color={service.color}
                            />
                          </View>
                          <View>
                            <Text
                              style={[
                                styles.serviceLabel,
                                { color: colors.text },
                              ]}
                            >
                              {service.label}
                            </Text>
                            <Text
                              style={[
                                styles.servicePrice,
                                { color: colors.success },
                              ]}
                            >
                              ${displayPrice}
                              {isCustom && (
                                <Text
                                  style={[
                                    styles.customTag,
                                    { color: colors.primary },
                                  ]}
                                >
                                  {" "}
                                  (personnalisé)
                                </Text>
                              )}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.serviceActions}>
                          <TouchableOpacity
                            style={[
                              styles.serviceAction,
                              { borderColor: colors.border },
                            ]}
                            onPress={() => openEditModal(service.id)}
                          >
                            <Ionicons
                              name="create-outline"
                              size={16}
                              color={colors.primary}
                            />
                          </TouchableOpacity>
                          {isCustom && (
                            <TouchableOpacity
                              style={[
                                styles.serviceAction,
                                { borderColor: colors.border },
                              ]}
                              onPress={() => resetServicePrice(service.id)}
                            >
                              <Ionicons
                                name="refresh-outline"
                                size={16}
                                color={colors.error}
                              />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    );
                  }
                )}
              </View>
              <Text
                style={[styles.specificNote, { color: colors.textSecondary }]}
              >
                <Ionicons name="information-circle" size={12} /> Laissez vide
                pour utiliser le prix de base
              </Text>
            </Animated.View>
          </Animated.View>
        )}

        {/* Bouton de sauvegarde */}
        <Animated.View
          style={[
            styles.saveButtonContainer,
            { transform: [{ scale: itemsAnim[2] }], opacity: itemsAnim[2] },
          ]}
        >
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={savePricing}
            disabled={saving}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.saveButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Enregistrer</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.bottomSpace} />
      </Animated.ScrollView>

      {/* Modal édition tarif spécifique */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <BlurView
          intensity={90}
          style={styles.modalOverlay}
          tint={effectiveTheme === "dark" ? "dark" : "light"}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContainer}
          >
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
                    <Ionicons
                      name="pricetag"
                      size={24}
                      color={colors.primary}
                    />
                  </LinearGradient>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    Tarif personnalisé
                  </Text>
                  <TouchableOpacity
                    onPress={() => setEditModalVisible(false)}
                    style={styles.modalClose}
                  >
                    <Ionicons
                      name="close"
                      size={24}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                {editingService && (
                  <>
                    <Text
                      style={[styles.modalServiceLabel, { color: colors.text }]}
                    >
                      {editingService.label}
                    </Text>
                    <Text
                      style={[
                        styles.modalServiceDesc,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Prix recommandé: $
                      {
                        SERVICES.find((s) => s.id === editingService?.id)
                          ?.defaultPrice
                      }
                    </Text>

                    <View style={styles.modalPriceContainer}>
                      <Text
                        style={[
                          styles.modalCurrency,
                          { color: colors.primary },
                        ]}
                      >
                        $
                      </Text>
                      <TextInput
                        style={[
                          styles.modalPriceInput,
                          {
                            backgroundColor: colors.background,
                            borderColor: colors.border,
                            color: colors.text,
                          },
                        ]}
                        placeholder="0.00"
                        placeholderTextColor={colors.placeholder}
                        value={editPrice}
                        onChangeText={setEditPrice}
                        keyboardType="numeric"
                        autoFocus
                      />
                    </View>

                    <View style={styles.modalButtons}>
                      <TouchableOpacity
                        style={[
                          styles.modalBtn,
                          styles.modalBtnCancel,
                          { borderColor: colors.border },
                        ]}
                        onPress={() => setEditModalVisible(false)}
                      >
                        <Text style={{ color: colors.textSecondary }}>
                          Annuler
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.modalBtn,
                          styles.modalBtnSave,
                          { backgroundColor: colors.primary },
                        ]}
                        onPress={saveServicePrice}
                      >
                        <Text style={{ color: "#fff" }}>Enregistrer</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </LinearGradient>
            </Animated.View>
          </KeyboardAvoidingView>
        </BlurView>
      </Modal>

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
  priceCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  priceRow: {
    flexDirection: "row",
    gap: 12,
  },
  priceInputContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    marginBottom: 6,
    fontWeight: "500",
  },
  priceInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: "600",
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  unitText: {
    fontSize: 12,
    marginLeft: 4,
  },
  previewCard: {
    padding: 20,
    borderRadius: 24,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  previewTitle: {
    fontSize: 12,
    marginBottom: 4,
  },
  previewValue: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  previewHint: {
    fontSize: 11,
  },
  specificCard: {
    borderRadius: 24,
    marginBottom: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  specificHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  specificIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  specificTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  specificRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  customBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  customBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  servicesList: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  serviceItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  serviceLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  serviceLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  servicePrice: {
    fontSize: 13,
    fontWeight: "600",
  },
  customTag: {
    fontSize: 11,
    fontWeight: "normal",
  },
  serviceActions: {
    flexDirection: "row",
    gap: 8,
  },
  serviceAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  specificNote: {
    fontSize: 11,
    textAlign: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  saveButtonContainer: {
    marginTop: 8,
    marginBottom: 20,
  },
  saveButton: {
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 8,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
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
  modalContainer: {
    width: "90%",
    maxWidth: 400,
  },
  modalContent: {
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
  modalServiceLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  modalServiceDesc: {
    fontSize: 12,
    marginBottom: 20,
  },
  modalPriceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  modalCurrency: {
    fontSize: 24,
    fontWeight: "600",
    marginRight: 8,
  },
  modalPriceInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
  },
  modalBtnCancel: {
    borderWidth: 1,
  },
  modalBtnSave: {
    borderWidth: 0,
  },
});
