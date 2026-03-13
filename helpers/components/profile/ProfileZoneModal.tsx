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
import Animated from "react-native-reanimated";
import { RADIUS_OPTIONS } from "./constants";

// Définir le composant avec un export par défaut
const ProfileZoneModal = ({
  visible,
  radius,
  address,
  colors,
  colorScheme,
  scaleAnim,
  onClose,
  onRadiusChange,
  onAddressChange,
  onSave,
}: {
  visible: boolean;
  radius: string;
  address: string;
  colors: any;
  colorScheme: string | null | undefined;
  scaleAnim: Animated.SharedValue<number>;
  onClose: () => void;
  onRadiusChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onSave: () => void;
}) => {
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
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Zone d'intervention
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.modalClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>
              Rayon d'action
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.radiusScroll}
            >
              {RADIUS_OPTIONS.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.radiusButton,
                    { backgroundColor: colors.background },
                    parseInt(radius) === r && {
                      backgroundColor: colors.primary,
                    },
                  ]}
                  onPress={() => onRadiusChange(r.toString())}
                >
                  <Text
                    style={[
                      styles.radiusText,
                      { color: colors.text },
                      parseInt(radius) === r && {
                        color: "#fff",
                      },
                    ]}
                  >
                    {r} km
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text
              style={[
                styles.modalLabel,
                { color: colors.textSecondary, marginTop: 20 },
              ]}
            >
              Adresse
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Votre adresse de base"
              placeholderTextColor={colors.placeholder}
              value={address}
              onChangeText={onAddressChange}
            />
          </View>

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
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
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
  modalInput: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 14,
  },
  radiusScroll: {
    flexDirection: "row",
  },
  radiusButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 8,
  },
  radiusText: {
    fontSize: 13,
    fontWeight: "500",
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

// Export par défaut
export default ProfileZoneModal;
