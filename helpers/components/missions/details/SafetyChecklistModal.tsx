// helpers/components/missions/details/SafetyChecklistModal.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";

interface SafetyChecklistModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  colors: any;
  colorScheme: string | null;
  missionType?: string;
  isLoading?: boolean;
}

// Liste des vérifications de sécurité (AVANT DE PARTIR)
const getSafetyItems = (missionType?: string) => {
  const personalItems = [
    {
      id: "vest",
      label: "Gilet de sécurité",
      description: "Enfilé et visible",
      icon: "shirt-outline",
    },
    {
      id: "triangles",
      label: "Triangles de signalisation",
      description: "Présents dans le véhicule",
      icon: "warning-outline",
    },
    {
      id: "flashlight",
      label: "Lampe torche",
      description: "Pour intervention de nuit",
      icon: "flashlight-outline",
    },
    {
      id: "phone_charged",
      label: "Téléphone chargé",
      description: "Pour rester joignable",
      icon: "phone-portrait-outline",
    },
    {
      id: "gloves",
      label: "Gants de protection",
      description: "Pour se protéger les mains",
      icon: "hand-left-outline",
    },
  ];

  const equipmentItems: Array<{
    id: string;
    label: string;
    description: string;
    icon: string;
  }> = [];

  if (missionType === "battery") {
    equipmentItems.push({
      id: "cables",
      label: "Câbles de démarrage",
      description: "Pour démarrer la batterie",
      icon: "battery-dead",
    });
  }

  if (missionType === "tire") {
    equipmentItems.push({
      id: "jack",
      label: "Cric",
      description: "Pour soulever le véhicule",
      icon: "car-outline",
    });
    equipmentItems.push({
      id: "tire_iron",
      label: "Clé à roue",
      description: "Pour dévisser les écrous",
      icon: "construct-outline",
    });
  }

  if (missionType === "fuel") {
    equipmentItems.push({
      id: "fuel_can",
      label: "Bidon d'essence",
      description: "Pour ravitailler le client",
      icon: "water-outline",
    });
  }

  if (missionType === "towing") {
    equipmentItems.push({
      id: "tow_rope",
      label: "Câble de remorquage",
      description: "Pour remorquer",
      icon: "git-network-outline",
    });
  }

  return [...personalItems, ...equipmentItems];
};

export const SafetyChecklistModal = ({
  visible,
  onClose,
  onConfirm,
  colors,
  colorScheme,
  missionType,
  isLoading = false,
}: SafetyChecklistModalProps) => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const safetyItems = getSafetyItems(missionType);

  useEffect(() => {
    if (visible) {
      setCheckedItems({});
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const toggleItem = (itemId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCheckedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const selectAll = () => {
    const allChecked: Record<string, boolean> = {};
    safetyItems.forEach((item) => {
      allChecked[item.id] = true;
    });
    setCheckedItems(allChecked);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const isAllChecked = () => {
    return safetyItems.every((item) => checkedItems[item.id] === true);
  };

  const totalItems = safetyItems.length;
  const checkedCount = Object.keys(checkedItems).length;

  const handleConfirm = () => {
    if (!isAllChecked()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onConfirm();
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <BlurView intensity={90} tint={colorScheme} style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          activeOpacity={1}
        />

        <Animated.View
          style={[
            styles.modalContainer,
            {
              backgroundColor: colors.card,
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <LinearGradient
            colors={[colors.primary + "10", colors.secondary + "05"]}
            style={styles.modalGradient}
          >
            {/* En-tête */}
            <View style={styles.modalHeader}>
              <LinearGradient
                colors={[colors.warning + "20", colors.warning + "10"]}
                style={styles.iconWrapper}
              >
                <Ionicons
                  name="shield-checkmark"
                  size={28}
                  color={colors.warning}
                />
              </LinearGradient>
              <Text style={[styles.title, { color: colors.text }]}>
                Vérification avant départ
              </Text>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Message d'information */}
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Avant de partir, assurez-vous d'avoir tout le nécessaire.
            </Text>

            {/* Barre de progression */}
            <View style={styles.progressContainer}>
              <View
                style={[styles.progressBar, { backgroundColor: colors.border }]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: colors.success,
                      width: `${(checkedCount / totalItems) * 100}%`,
                    },
                  ]}
                />
              </View>
              <View style={styles.progressRow}>
                <Text
                  style={[styles.progressText, { color: colors.textSecondary }]}
                >
                  {checkedCount}/{totalItems} vérifiés
                </Text>
                <TouchableOpacity onPress={selectAll} activeOpacity={0.7}>
                  <Text
                    style={[styles.selectAllText, { color: colors.primary }]}
                  >
                    Tout cocher
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Liste des vérifications */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {safetyItems.map((item) => {
                const isChecked = checkedItems[item.id];
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.checklistItem,
                      {
                        backgroundColor: isChecked
                          ? colors.success + "10"
                          : colors.background,
                        borderColor: isChecked ? colors.success : colors.border,
                      },
                    ]}
                    onPress={() => toggleItem(item.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.checklistLeft}>
                      <View
                        style={[
                          styles.checklistIcon,
                          {
                            backgroundColor: isChecked
                              ? colors.success + "20"
                              : colors.primary + "10",
                          },
                        ]}
                      >
                        <Ionicons
                          name={item.icon}
                          size={20}
                          color={isChecked ? colors.success : colors.primary}
                        />
                      </View>
                      <View style={styles.checklistInfo}>
                        <Text
                          style={[
                            styles.checklistLabel,
                            { color: colors.text },
                          ]}
                        >
                          {item.label}
                        </Text>
                        <Text
                          style={[
                            styles.checklistDescription,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {item.description}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.checkbox,
                        {
                          borderColor: isChecked
                            ? colors.success
                            : colors.border,
                          backgroundColor: isChecked
                            ? colors.success
                            : "transparent",
                        },
                      ]}
                    >
                      {isChecked && (
                        <Ionicons name="checkmark" size={14} color="#fff" />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Bouton "En route" intégré - TOUJOURS VISIBLE */}
            <TouchableOpacity
              style={[
                styles.enRouteButton,
                {
                  backgroundColor: isAllChecked()
                    ? colors.success
                    : colors.disabled,
                },
              ]}
              onPress={handleConfirm}
              disabled={!isAllChecked() || isLoading}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={
                  isAllChecked()
                    ? [colors.success, colors.success + "CC"]
                    : [colors.disabled, colors.disabled]
                }
                style={styles.enRouteGradient}
              >
                <Ionicons name="car" size={22} color="#fff" />
                <Text style={styles.enRouteButtonText}>
                  {isLoading ? "Chargement..." : "En route"}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>

            {/* Note de sécurité */}
            <View style={styles.securityNote}>
              <Ionicons
                name="information-circle"
                size={14}
                color={colors.textSecondary}
              />
              <Text
                style={[
                  styles.securityNoteText,
                  { color: colors.textSecondary },
                ]}
              >
                Cette vérification est obligatoire avant chaque départ
              </Text>
            </View>
          </LinearGradient>
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
  modalContainer: {
    width: "90%",
    maxWidth: 400,
    maxHeight: "85%",
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
    gap: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 4,
  },
  progressContainer: {
    gap: 6,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  progressText: {
    fontSize: 11,
  },
  selectAllText: {
    fontSize: 11,
    fontWeight: "500",
  },
  scrollContent: {
    gap: 8,
    paddingVertical: 8,
    paddingBottom: 16,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  checklistLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  checklistIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  checklistInfo: {
    flex: 1,
  },
  checklistLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  checklistDescription: {
    fontSize: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  enRouteButton: {
    borderRadius: 40,
    overflow: "hidden",
    marginTop: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  enRouteGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 10,
  },
  enRouteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
    marginTop: 4,
    marginBottom: 4,
  },
  securityNoteText: {
    fontSize: 10,
  },
});
