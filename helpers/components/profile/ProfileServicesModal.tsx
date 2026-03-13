import React from "react";
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
import { LinearGradient } from "expo-linear-gradient";
import { SERVICES_LIST } from "./constants";

interface ProfileServicesModalProps {
  visible: boolean;
  selectedServices: string[];
  colors: any;
  colorScheme: string | null | undefined;
  scaleAnim: any;
  onClose: () => void;
  onToggleService: (serviceId: string) => void;
  onSave: () => void;
}

export default function ProfileServicesModal({
  visible,
  selectedServices,
  colors,
  colorScheme,
  scaleAnim,
  onClose,
  onToggleService,
  onSave,
}: ProfileServicesModalProps) {
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
              Services
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.modalClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {SERVICES_LIST.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={[
                  styles.modalItem,
                  { borderColor: colors.border },
                  selectedServices.includes(service.id) &&
                    styles.modalItemSelected,
                ]}
                onPress={() => onToggleService(service.id)}
              >
                <View
                  style={[
                    styles.modalItemIcon,
                    { backgroundColor: service.color + "20" },
                  ]}
                >
                  <Ionicons
                    name={service.icon}
                    size={22}
                    color={service.color}
                  />
                </View>
                <View style={styles.modalItemContent}>
                  <Text style={[styles.modalItemTitle, { color: colors.text }]}>
                    {service.label}
                  </Text>
                  <Text
                    style={[
                      styles.modalItemDesc,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {service.description}
                  </Text>
                </View>
                {selectedServices.includes(service.id) && (
                  <View
                    style={[
                      styles.modalCheck,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
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
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    gap: 12,
  },
  modalItemSelected: {
    borderColor: "transparent",
    backgroundColor: "rgba(0,0,0,0.02)",
  },
  modalItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  modalItemContent: {
    flex: 1,
  },
  modalItemTitle: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 2,
  },
  modalItemDesc: {
    fontSize: 12,
  },
  modalCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
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
