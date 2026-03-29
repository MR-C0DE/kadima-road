// helpers/components/profile/ProfileEquipmentModal.tsx

import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Animated, // ← Importer Animated depuis react-native
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

import { EQUIPMENT_LIST } from "./constants";

interface ProfileEquipmentModalProps {
  visible: boolean;
  selectedEquipment: string[];
  colors: any;
  colorScheme: string | null;
  onClose: () => void;
  onToggleEquipment: (equipmentId: string) => void;
  onSave: () => void;
}

export default function ProfileEquipmentModal({
  visible,
  selectedEquipment,
  colors,
  colorScheme,
  onClose,
  onToggleEquipment,
  onSave,
}: ProfileEquipmentModalProps) {
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
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              <LinearGradient
                colors={[colors.primary + "20", colors.secondary + "10"]}
                style={styles.modalHeaderIcon}
              >
                <Ionicons name="build" size={22} color={colors.primary} />
              </LinearGradient>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Équipement
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

          <Text
            style={[styles.modalDescription, { color: colors.textSecondary }]}
          >
            Sélectionnez l'équipement dont vous disposez
          </Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.equipmentGrid}>
              {EQUIPMENT_LIST.map((item) => {
                const isSelected = selectedEquipment.includes(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.equipmentCard,
                      {
                        backgroundColor: colors.background,
                        borderColor: isSelected
                          ? colors.primary
                          : colors.border,
                      },
                    ]}
                    onPress={() => onToggleEquipment(item.id)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.equipmentIcon,
                        {
                          backgroundColor: isSelected
                            ? colors.primary + "20"
                            : colors.primary + "10",
                        },
                      ]}
                    >
                      <Ionicons
                        name={item.icon as any}
                        size={28}
                        color={
                          isSelected ? colors.primary : colors.textSecondary
                        }
                      />
                    </View>
                    <Text
                      style={[
                        styles.equipmentLabel,
                        {
                          color: isSelected ? colors.primary : colors.text,
                          fontWeight: isSelected ? "600" : "500",
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                    <Text
                      style={[
                        styles.equipmentCategory,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {item.category}
                    </Text>
                    {isSelected && (
                      <View
                        style={[
                          styles.selectedBadge,
                          { backgroundColor: colors.primary },
                        ]}
                      >
                        <Ionicons name="checkmark" size={14} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

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
  equipmentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  equipmentCard: {
    width: "48%",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    position: "relative",
  },
  equipmentIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  equipmentLabel: {
    fontSize: 14,
    marginBottom: 4,
    textAlign: "center",
  },
  equipmentCategory: {
    fontSize: 11,
    textAlign: "center",
  },
  selectedBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
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
