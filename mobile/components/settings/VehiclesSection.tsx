// components/settings/VehiclesSection.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import SettingsSection from "./SettingsSection";
import { useTheme } from "../../contexts/ThemeContext";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useRouter } from "expo-router";

interface VehiclesSectionProps {
  userDetails: any;
}

const PAYMENT_METHODS = [
  { id: "card", label: "Carte bancaire", icon: "card-outline" },
  { id: "paypal", label: "PayPal", icon: "logo-paypal" },
  { id: "apple_pay", label: "Apple Pay", icon: "logo-apple" },
];

const ASSISTANCE_TYPES = [
  { id: "sos_first", label: "Toujours appeler un helper en priorité" },
  { id: "diagnostic_first", label: "D'abord le diagnostic IA, puis helper" },
  { id: "auto", label: "Automatique selon la gravité" },
];

export default function VehiclesSection({ userDetails }: VehiclesSectionProps) {
  const router = useRouter();
  const { effectiveTheme } = useTheme();
  const colorScheme = useColorScheme();
  const colors = Colors[effectiveTheme ?? "light"];

  const [defaultVehicleModalVisible, setDefaultVehicleModalVisible] =
    useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [assistanceModalVisible, setAssistanceModalVisible] = useState(false);

  const [selectedDefaultVehicle, setSelectedDefaultVehicle] = useState(
    userDetails?.vehicles?.find((v: any) => v.isDefault)?.licensePlate ||
      "Aucun"
  );
  const [selectedPayment, setSelectedPayment] = useState("card");
  const [selectedAssistance, setSelectedAssistance] = useState("sos_first");

  const vehicles = userDetails?.vehicles || [];

  const handleSelectDefaultVehicle = (vehicle: any) => {
    setSelectedDefaultVehicle(vehicle.licensePlate);
    setDefaultVehicleModalVisible(false);
    // TODO: Appeler API pour définir le véhicule par défaut
  };

  const handleSelectPayment = (methodId: string) => {
    setSelectedPayment(methodId);
    setPaymentModalVisible(false);
    // TODO: Sauvegarder préférence paiement
  };

  const handleSelectAssistance = (typeId: string) => {
    setSelectedAssistance(typeId);
    setAssistanceModalVisible(false);
    // TODO: Sauvegarder préférence assistance
  };

  const getPaymentLabel = () => {
    const method = PAYMENT_METHODS.find((m) => m.id === selectedPayment);
    return method?.label || "Carte bancaire";
  };

  const getAssistanceLabel = () => {
    const type = ASSISTANCE_TYPES.find((t) => t.id === selectedAssistance);
    return type?.label || "Toujours appeler un helper en priorité";
  };

  return (
    <>
      <SettingsSection title="Véhicules et assistance" icon="car-outline">
        {/* Véhicule par défaut */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setDefaultVehicleModalVisible(true)}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="star-outline" size={20} color={colors.primary} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>
              Véhicule par défaut
            </Text>
          </View>
          <View style={styles.menuItemRight}>
            <Text
              style={[styles.menuItemValue, { color: colors.textSecondary }]}
            >
              {selectedDefaultVehicle}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textSecondary}
            />
          </View>
        </TouchableOpacity>

        {/* Méthode de paiement par défaut */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setPaymentModalVisible(true)}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="card-outline" size={20} color={colors.primary} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>
              Méthode de paiement
            </Text>
          </View>
          <View style={styles.menuItemRight}>
            <Text
              style={[styles.menuItemValue, { color: colors.textSecondary }]}
            >
              {getPaymentLabel()}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textSecondary}
            />
          </View>
        </TouchableOpacity>

        {/* Type d'assistance préféré */}
        <TouchableOpacity
          style={[styles.menuItem, styles.lastItem]}
          onPress={() => setAssistanceModalVisible(true)}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="medkit-outline" size={20} color={colors.primary} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>
              Type d'assistance préféré
            </Text>
          </View>
          <View style={styles.menuItemRight}>
            <Text
              style={[styles.menuItemValue, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {getAssistanceLabel().substring(0, 20)}...
            </Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textSecondary}
            />
          </View>
        </TouchableOpacity>

        {/* Lien vers la gestion des véhicules */}
        <TouchableOpacity
          style={[styles.menuItem, styles.linkItem]}
          onPress={() => router.push("/vehicles")}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons
              name="settings-outline"
              size={20}
              color={colors.primary}
            />
            <Text style={[styles.menuItemText, { color: colors.primary }]}>
              Gérer mes véhicules
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </TouchableOpacity>
      </SettingsSection>

      {/* Modal Véhicule par défaut */}
      <Modal
        visible={defaultVehicleModalVisible}
        transparent
        animationType="fade"
      >
        <BlurView
          intensity={80}
          style={styles.modalOverlay}
          tint={effectiveTheme === "dark" ? "dark" : "light"}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Véhicule par défaut
              </Text>
              <TouchableOpacity
                onPress={() => setDefaultVehicleModalVisible(false)}
              >
                <Ionicons
                  name="close-outline"
                  size={24}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {vehicles.length > 0 ? (
                vehicles.map((vehicle: any) => (
                  <TouchableOpacity
                    key={vehicle._id}
                    style={[
                      styles.optionItem,
                      selectedDefaultVehicle === vehicle.licensePlate && {
                        backgroundColor: colors.primary + "10",
                      },
                    ]}
                    onPress={() => handleSelectDefaultVehicle(vehicle)}
                  >
                    <View>
                      <Text
                        style={[
                          styles.optionText,
                          {
                            color:
                              selectedDefaultVehicle === vehicle.licensePlate
                                ? colors.primary
                                : colors.text,
                          },
                        ]}
                      >
                        {vehicle.make} {vehicle.model}
                      </Text>
                      <Text
                        style={[
                          styles.optionSubtext,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {vehicle.licensePlate}
                      </Text>
                    </View>
                    {selectedDefaultVehicle === vehicle.licensePlate && (
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
                  <Text
                    style={[styles.emptyText, { color: colors.textSecondary }]}
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
          </View>
        </BlurView>
      </Modal>

      {/* Modal Méthode de paiement */}
      <Modal visible={paymentModalVisible} transparent animationType="fade">
        <BlurView
          intensity={80}
          style={styles.modalOverlay}
          tint={effectiveTheme === "dark" ? "dark" : "light"}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Méthode de paiement
              </Text>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <Ionicons
                  name="close-outline"
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
                  <Ionicons
                    name={method.icon}
                    size={22}
                    color={
                      selectedPayment === method.id
                        ? colors.primary
                        : colors.textSecondary
                    }
                  />
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
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </BlurView>
      </Modal>

      {/* Modal Type d'assistance */}
      <Modal visible={assistanceModalVisible} transparent animationType="fade">
        <BlurView
          intensity={80}
          style={styles.modalOverlay}
          tint={effectiveTheme === "dark" ? "dark" : "light"}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Type d'assistance préféré
              </Text>
              <TouchableOpacity
                onPress={() => setAssistanceModalVisible(false)}
              >
                <Ionicons
                  name="close-outline"
                  size={24}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            {ASSISTANCE_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.optionItem,
                  selectedAssistance === type.id && {
                    backgroundColor: colors.primary + "10",
                  },
                ]}
                onPress={() => handleSelectAssistance(type.id)}
              >
                <Text
                  style={[
                    styles.optionText,
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
                {selectedAssistance === type.id && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </BlurView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  linkItem: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: "500",
  },
  menuItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    justifyContent: "flex-end",
  },
  menuItemValue: {
    fontSize: 14,
    maxWidth: "60%",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    maxHeight: "80%",
    borderRadius: 28,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
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
  optionText: {
    fontSize: 15,
  },
  optionSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 30,
    gap: 16,
  },
  emptyText: {
    fontSize: 14,
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
