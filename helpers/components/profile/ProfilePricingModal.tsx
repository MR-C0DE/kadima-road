// helpers/components/profile/ProfilePricingModal.tsx

import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

import { SERVICES_LIST } from "./constants";

interface PricingService {
  service: string;
  price: number;
}

interface ProfilePricingModalProps {
  visible: boolean;
  basePrice: string;
  perKm: string;
  selectedServices: string[];
  pricingServices: PricingService[];
  colors: any;
  colorScheme: string | null;
  onClose: () => void;
  onBasePriceChange: (value: string) => void;
  onPerKmChange: (value: string) => void;
  onPricingServiceChange: (serviceId: string, price: string) => void;
  onSave: () => void;
}

export default function ProfilePricingModal({
  visible,
  basePrice,
  perKm,
  selectedServices,
  pricingServices,
  colors,
  colorScheme,
  onClose,
  onBasePriceChange,
  onPerKmChange,
  onPricingServiceChange,
  onSave,
}: ProfilePricingModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0.9);
    }
  }, [visible]);

  const calculateTotal = () => {
    const base = parseFloat(basePrice) || 0;
    const km = parseFloat(perKm) || 0;
    return base + km * 10; // Exemple pour 10km
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={90} tint={colorScheme} style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onClose}
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
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              <LinearGradient
                colors={[colors.primary + "20", colors.secondary + "10"]}
                style={styles.modalHeaderIcon}
              >
                <Ionicons name="cash" size={22} color={colors.primary} />
              </LinearGradient>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Tarifs
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.modalClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Description */}
          <Text
            style={[styles.modalDescription, { color: colors.textSecondary }]}
          >
            Définissez vos tarifs pour les interventions
          </Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Prix de base et frais/km */}
            <View style={styles.priceRow}>
              <View style={styles.priceInputContainer}>
                <Text
                  style={[styles.inputLabel, { color: colors.textSecondary }]}
                >
                  Prix de base ($)
                </Text>
                <View
                  style={[styles.inputWrapper, { borderColor: colors.border }]}
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
                    onChangeText={onBasePriceChange}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.priceInputContainer}>
                <Text
                  style={[styles.inputLabel, { color: colors.textSecondary }]}
                >
                  Frais/km ($)
                </Text>
                <View
                  style={[styles.inputWrapper, { borderColor: colors.border }]}
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
                    onChangeText={onPerKmChange}
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

            {/* Aperçu du prix */}
            <View
              style={[
                styles.previewCard,
                { backgroundColor: colors.background },
              ]}
            >
              <Text
                style={[styles.previewTitle, { color: colors.textSecondary }]}
              >
                Estimation pour 10km
              </Text>
              <Text style={[styles.previewValue, { color: colors.success }]}>
                ${calculateTotal().toFixed(2)}
              </Text>
              <Text
                style={[styles.previewHint, { color: colors.textSecondary }]}
              >
                {basePrice || "0"}$ de base + {perKm || "0"}$/km × 10km
              </Text>
            </View>

            {/* Tarifs spécifiques par service */}
            {selectedServices && selectedServices.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Tarifs spécifiques
                </Text>
                <Text
                  style={[
                    styles.sectionSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  Optionnel - Laissez vide pour utiliser le prix de base
                </Text>

                {SERVICES_LIST.filter((s) =>
                  selectedServices.includes(s.id)
                ).map((service) => {
                  const existingPrice = pricingServices?.find(
                    (p) => p.service === service.id
                  );
                  return (
                    <View key={service.id} style={styles.servicePriceRow}>
                      <View style={styles.serviceIconContainer}>
                        <LinearGradient
                          colors={[service.color + "20", service.color + "10"]}
                          style={styles.serviceIcon}
                        >
                          <Ionicons
                            name={service.icon}
                            size={20}
                            color={service.color}
                          />
                        </LinearGradient>
                      </View>
                      <View style={styles.serviceInfo}>
                        <Text
                          style={[styles.serviceLabel, { color: colors.text }]}
                        >
                          {service.label}
                        </Text>
                        <Text
                          style={[
                            styles.serviceDesc,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {service.description}
                        </Text>
                      </View>
                      <View style={styles.servicePriceInputWrapper}>
                        <Text
                          style={[
                            styles.currencySymbolSmall,
                            { color: colors.primary },
                          ]}
                        >
                          $
                        </Text>
                        <TextInput
                          style={[
                            styles.servicePriceInput,
                            {
                              backgroundColor: colors.background,
                              borderColor: colors.border,
                              color: colors.text,
                            },
                          ]}
                          placeholder={basePrice}
                          placeholderTextColor={colors.placeholder}
                          value={existingPrice?.price?.toString() || ""}
                          onChangeText={(text) =>
                            onPricingServiceChange(service.id, text)
                          }
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                  );
                })}
              </>
            )}
          </ScrollView>

          {/* Bouton de sauvegarde */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={onSave}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.saveButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="save-outline" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "85%",
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
    marginBottom: 12,
  },
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalHeaderIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  modalClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  modalDescription: {
    fontSize: 14,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  priceRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  priceInputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    marginBottom: 6,
    fontWeight: "500",
  },
  inputWrapper: {
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
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 20,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginBottom: 12,
  },
  servicePriceRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
    gap: 12,
  },
  serviceIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  serviceInfo: {
    flex: 1,
  },
  serviceLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  serviceDesc: {
    fontSize: 11,
  },
  servicePriceInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  currencySymbolSmall: {
    fontSize: 14,
    fontWeight: "600",
  },
  servicePriceInput: {
    width: 70,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 10,
    textAlign: "center",
    fontSize: 14,
  },
  saveButton: {
    marginTop: 16,
    borderRadius: 30,
    overflow: "hidden",
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
});
