// helpers/app/settings/services.tsx
// Écran des services proposés - Sauvegarde en temps réel

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../config/api";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";

// ============================================
// SERVICES DISPONIBLES
// ============================================

const AVAILABLE_SERVICES = [
  {
    id: "battery",
    label: "Batterie",
    icon: "battery-dead",
    description: "Dépannage batterie, démarrage assisté",
    color: "#EF4444",
    price: 25,
  },
  {
    id: "tire",
    label: "Pneu",
    icon: "car-sport",
    description: "Changement de pneu, crevaison",
    color: "#F59E0B",
    price: 30,
  },
  {
    id: "fuel",
    label: "Essence",
    icon: "water",
    description: "Livraison de carburant",
    color: "#3B82F6",
    price: 35,
  },
  {
    id: "jumpstart",
    label: "Démarrage",
    icon: "flash",
    description: "Aide au démarrage",
    color: "#8B5CF6",
    price: 25,
  },
  {
    id: "lockout",
    label: "Clés enfermées",
    icon: "key",
    description: "Ouverture de porte",
    color: "#EC4899",
    price: 40,
  },
  {
    id: "towing",
    label: "Remorquage",
    icon: "car",
    description: "Remorquage léger",
    color: "#F97316",
    price: 75,
  },
  {
    id: "diagnostic",
    label: "Diagnostic",
    icon: "medkit",
    description: "Diagnostic rapide",
    color: "#06B6D4",
    price: 20,
  },
  {
    id: "minor_repair",
    label: "Petite réparation",
    icon: "construct",
    description: "Réparations mineures",
    color: "#10B981",
    price: 45,
  },
];

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function ServicesSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme ?? "light"];

  // États
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [servicePrices, setServicePrices] = useState<Record<string, number>>(
    {}
  );

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const itemsAnim = useRef(
    AVAILABLE_SERVICES.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    loadServices();
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
        delay: 200 + index * 50,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  // ============================================
  // CHARGEMENT DES SERVICES
  // ============================================

  const loadServices = async () => {
    try {
      const response = await api.get("/helpers/profile/me");
      const profile = response.data.data;

      const services = profile.services || [];
      setSelectedServices(services);

      // Charger les prix spécifiques si existants
      const prices: Record<string, number> = {};
      if (profile.pricing?.services) {
        profile.pricing.services.forEach((s: any) => {
          prices[s.service] = s.price;
        });
      }
      setServicePrices(prices);
    } catch (error) {
      console.error("Erreur chargement services:", error);
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Impossible de charger vos services",
        position: "bottom",
      });
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // SAUVEGARDE EN TEMPS RÉEL
  // ============================================

  const saveServices = async (newServices: string[]) => {
    if (saving) return;
    setSaving(true);

    try {
      // Mettre à jour la liste des services
      await api.put("/helpers/profile/me", {
        services: newServices,
        pricing: {
          ...(await getCurrentPricing()),
          services: newServices.map((serviceId) => ({
            service: serviceId,
            price: servicePrices[serviceId] || getDefaultPrice(serviceId),
          })),
        },
      });

      Toast.show({
        type: "success",
        text1: "Services mis à jour",
        text2: `${newServices.length} service${
          newServices.length !== 1 ? "s" : ""
        } sélectionné${newServices.length !== 1 ? "s" : ""}`,
        position: "bottom",
        visibilityTime: 1500,
      });
    } catch (error: any) {
      console.error("Erreur sauvegarde services:", error);
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: error.response?.data?.message || "Impossible de sauvegarder",
        position: "bottom",
      });
      // Recharger pour réinitialiser
      await loadServices();
    } finally {
      setSaving(false);
    }
  };

  const getCurrentPricing = async () => {
    try {
      const response = await api.get("/helpers/profile/me");
      return response.data.data.pricing || { basePrice: 25, perKm: 1 };
    } catch (error) {
      return { basePrice: 25, perKm: 1 };
    }
  };

  const getDefaultPrice = (serviceId: string): number => {
    const service = AVAILABLE_SERVICES.find((s) => s.id === serviceId);
    return service?.price || 25;
  };

  // ============================================
  // GESTION DES SERVICES
  // ============================================

  const toggleService = async (serviceId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    let newServices: string[];
    if (selectedServices.includes(serviceId)) {
      newServices = selectedServices.filter((id) => id !== serviceId);
    } else {
      newServices = [...selectedServices, serviceId];
    }

    setSelectedServices(newServices);
    await saveServices(newServices);
  };

  const updateServicePrice = async (serviceId: string, price: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newPrices = { ...servicePrices, [serviceId]: price };
    setServicePrices(newPrices);

    try {
      const currentPricing = await getCurrentPricing();
      await api.put("/helpers/profile/me", {
        pricing: {
          ...currentPricing,
          services: selectedServices.map((id) => ({
            service: id,
            price: newPrices[id] || getDefaultPrice(id),
          })),
        },
      });

      Toast.show({
        type: "success",
        text1: "Prix mis à jour",
        text2: `Tarif spécifique enregistré`,
        position: "bottom",
        visibilityTime: 1000,
      });
    } catch (error) {
      console.error("Erreur mise à jour prix:", error);
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Impossible de mettre à jour le prix",
        position: "bottom",
      });
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
            <Ionicons name="construct" size={40} color="#fff" />
          </LinearGradient>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Chargement...
          </Text>
          <ActivityIndicator size="large" color={colors.primary} />
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
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Services</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        {/* En-tête avec compteur */}
        <View style={styles.counterContainer}>
          <LinearGradient
            colors={[colors.primary + "20", colors.secondary + "10"]}
            style={styles.counterBadge}
          >
            <Ionicons name="construct" size={12} color={colors.primary} />
            <Text style={[styles.counterText, { color: colors.primary }]}>
              {selectedServices.length} / {AVAILABLE_SERVICES.length} services
            </Text>
          </LinearGradient>
        </View>

        {/* Liste des services */}
        <View style={styles.servicesGrid}>
          {AVAILABLE_SERVICES.map((service, index) => {
            const isSelected = selectedServices.includes(service.id);
            const customPrice = servicePrices[service.id];
            const displayPrice = customPrice || service.price;

            return (
              <Animated.View
                key={service.id}
                style={[
                  styles.serviceCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isSelected ? service.color : colors.border,
                    opacity: itemsAnim[index],
                    transform: [
                      {
                        translateY: itemsAnim[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [30, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.serviceContent}
                  onPress={() => toggleService(service.id)}
                  activeOpacity={0.7}
                  disabled={saving}
                >
                  <View
                    style={[
                      styles.serviceIcon,
                      {
                        backgroundColor: isSelected
                          ? service.color + "20"
                          : colors.background,
                      },
                    ]}
                  >
                    <Ionicons
                      name={service.icon}
                      size={28}
                      color={isSelected ? service.color : colors.textSecondary}
                    />
                  </View>

                  <View style={styles.serviceInfo}>
                    <Text
                      style={[
                        styles.serviceLabel,
                        {
                          color: isSelected ? service.color : colors.text,
                          fontWeight: isSelected ? "600" : "500",
                        },
                      ]}
                    >
                      {service.label}
                    </Text>
                    <Text
                      style={[
                        styles.serviceDescription,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {service.description}
                    </Text>

                    {/* Prix spécifique */}
                    <View style={styles.priceRow}>
                      <Text
                        style={[
                          styles.priceLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Prix recommandé
                      </Text>
                      <Text
                        style={[styles.priceValue, { color: colors.success }]}
                      >
                        ${service.price}
                      </Text>
                    </View>

                    {isSelected &&
                      customPrice &&
                      customPrice !== service.price && (
                        <View style={styles.customPriceRow}>
                          <Ionicons
                            name="cash-outline"
                            size={12}
                            color={colors.primary}
                          />
                          <Text
                            style={[
                              styles.customPriceText,
                              { color: colors.primary },
                            ]}
                          >
                            Tarif personnalisé: ${customPrice}
                          </Text>
                        </View>
                      )}
                  </View>

                  {isSelected && (
                    <View
                      style={[
                        styles.selectedBadge,
                        { backgroundColor: service.color },
                      ]}
                    >
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>

                {/* Bouton de prix personnalisé (si service sélectionné) */}
                {isSelected && (
                  <TouchableOpacity
                    style={[
                      styles.priceButton,
                      { borderColor: service.color + "40" },
                    ]}
                    onPress={() => {
                      // TODO: Ouvrir modal pour modifier le prix
                      Toast.show({
                        type: "info",
                        text1: "Tarif personnalisé",
                        text2: "Cette fonctionnalité arrive bientôt",
                        position: "bottom",
                      });
                    }}
                  >
                    <Ionicons
                      name="pricetag-outline"
                      size={14}
                      color={service.color}
                    />
                    <Text
                      style={[styles.priceButtonText, { color: service.color }]}
                    >
                      Personnaliser le tarif
                    </Text>
                  </TouchableOpacity>
                )}
              </Animated.View>
            );
          })}
        </View>

        {/* Note informative */}
        <View style={[styles.noteCard, { backgroundColor: colors.surface }]}>
          <LinearGradient
            colors={[colors.primary + "05", colors.secondary + "02"]}
            style={styles.noteGradient}
          >
            <Ionicons
              name="information-circle"
              size={24}
              color={colors.primary}
            />
            <View style={styles.noteContent}>
              <Text style={[styles.noteTitle, { color: colors.text }]}>
                À propos des services
              </Text>
              <Text style={[styles.noteText, { color: colors.textSecondary }]}>
                Les services que vous sélectionnez apparaîtront aux conducteurs.
                Vous pouvez personnaliser les tarifs pour chaque service.
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Indicateur de sauvegarde */}
        {saving && (
          <View style={styles.savingIndicator}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.savingText, { color: colors.textSecondary }]}>
              Sauvegarde...
            </Text>
          </View>
        )}

        <View style={styles.bottomSpace} />
      </Animated.ScrollView>

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
  counterContainer: {
    alignItems: "flex-end",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  counterBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  counterText: {
    fontSize: 12,
    fontWeight: "500",
  },
  servicesGrid: {
    gap: 12,
    marginBottom: 20,
  },
  serviceCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  serviceContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
  },
  serviceIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  serviceInfo: {
    flex: 1,
  },
  serviceLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  serviceDescription: {
    fontSize: 12,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  priceLabel: {
    fontSize: 11,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  customPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  customPriceText: {
    fontSize: 11,
    fontWeight: "500",
  },
  selectedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  priceButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderTopWidth: 1,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 20,
  },
  priceButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  noteCard: {
    borderRadius: 20,
    marginTop: 8,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  noteGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  noteText: {
    fontSize: 12,
    lineHeight: 16,
  },
  savingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  savingText: {
    fontSize: 12,
  },
  bottomSpace: {
    height: 20,
  },
});
