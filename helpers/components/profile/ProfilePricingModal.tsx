import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { SERVICES_LIST } from "./constants";
import { PricingService } from "./types";

interface ProfilePricingModalProps {
  visible: boolean;
  basePrice: string;
  perKm: string;
  selectedServices: string[];
  pricingServices: PricingService[];
  colors: any;
  colorScheme: string | null | undefined;
  scaleAnim: any;
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
  scaleAnim,
  onClose,
  onBasePriceChange,
  onPerKmChange,
  onPricingServiceChange,
  onSave,
}: ProfilePricingModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={90} tint={colorScheme} style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
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
            <TouchableOpacity onPress={onClose} style={styles.modalClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalBody}>
              <View style={styles.priceRow}>
                <View style={styles.priceInputContainer}>
                  <Text
                    style={[styles.modalLabel, { color: colors.textSecondary }]}
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
                    onChangeText={onBasePriceChange}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.priceInputContainer}>
                  <Text
                    style={[styles.modalLabel, { color: colors.textSecondary }]}
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
                    onChangeText={onPerKmChange}
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
              {SERVICES_LIST.filter((s) => selectedServices.includes(s.id)).map(
                (service) => {
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
                        onChangeText={(text) =>
                          onPricingServiceChange(service.id, text)
                        }
                        keyboardType="numeric"
                      />
                    </View>
                  );
                }
              )}
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.modalButton} onPress={onSave}>
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
  );
}

// Note: Importer Animated
import Animated from "react-native-reanimated";

const styles = StyleSheet.create({
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
});
