// helpers/components/profile/ProfileZoneModal.tsx

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

import { RADIUS_OPTIONS } from "./constants";

interface ProfileZoneModalProps {
  visible: boolean;
  radius: string;
  address: string;
  colors: any;
  colorScheme: string | null;
  onClose: () => void;
  onRadiusChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onSave: () => void;
}

export default function ProfileZoneModal({
  visible,
  radius,
  address,
  colors,
  colorScheme,
  onClose,
  onRadiusChange,
  onAddressChange,
  onSave,
}: ProfileZoneModalProps) {
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
                <Ionicons name="location" size={22} color={colors.primary} />
              </LinearGradient>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Zone d'intervention
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
            Définissez votre zone d'intervention
          </Text>

          {/* Corps du formulaire */}
          <View style={styles.modalBody}>
            {/* Rayon */}
            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>
              Rayon d'action (km)
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.radiusScroll}
              contentContainerStyle={styles.radiusScrollContent}
            >
              {RADIUS_OPTIONS.map((r) => {
                const isSelected = parseInt(radius) === r;
                return (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.radiusButton,
                      isSelected && { backgroundColor: colors.primary },
                    ]}
                    onPress={() => onRadiusChange(r.toString())}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.radiusText,
                        {
                          color: isSelected ? "#fff" : colors.text,
                          fontWeight: isSelected ? "600" : "500",
                        },
                      ]}
                    >
                      {r} km
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Adresse */}
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
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
            <Text style={[styles.inputHint, { color: colors.textSecondary }]}>
              <Ionicons name="information-circle-outline" size={12} /> Cette
              adresse sera utilisée comme point de départ pour vos interventions
            </Text>
          </View>

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
  modalBody: {
    gap: 12,
  },
  modalLabel: {
    fontSize: 13,
    marginBottom: 4,
    fontWeight: "500",
  },
  modalInput: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 14,
    minHeight: 60,
  },
  inputHint: {
    fontSize: 11,
    marginTop: 4,
    marginLeft: 4,
  },
  radiusScroll: {
    flexDirection: "row",
  },
  radiusScrollContent: {
    paddingRight: 20,
  },
  radiusButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 10,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  radiusText: {
    fontSize: 14,
  },
  saveButton: {
    marginTop: 20,
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
