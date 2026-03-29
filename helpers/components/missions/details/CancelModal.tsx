// helpers/components/missions/details/CancelModal.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Animated,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface CancelModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  colors: any;
  colorScheme: string | null;
}

// Raisons pré-définies
const QUICK_REASONS = [
  { id: "too_far", label: "Trop loin", icon: "location-outline" },
  {
    id: "client_unreachable",
    label: "Client non joignable",
    icon: "call-outline",
  },
  { id: "vehicle_issue", label: "Problème de véhicule", icon: "car-outline" },
  {
    id: "already_assigned",
    label: "Déjà assigné ailleurs",
    icon: "checkmark-circle-outline",
  },
  { id: "other", label: "Autre raison", icon: "help-circle-outline" },
];

export const CancelModal = ({
  visible,
  onClose,
  onConfirm,
  colors,
  colorScheme,
}: CancelModalProps) => {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedQuickReason, setSelectedQuickReason] = useState<string | null>(
    null
  );
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
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
      setReason("");
      setSelectedQuickReason(null);
    }
  }, [visible]);

  const handleQuickReason = (reasonId: string, reasonLabel: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedQuickReason(reasonId);
    setReason(reasonLabel);
  };

  const handleConfirm = async () => {
    if (!reason.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Erreur", "Veuillez indiquer une raison");
      return;
    }
    setIsSubmitting(true);
    await onConfirm(reason.trim());
    setIsSubmitting(false);
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <BlurView intensity={90} tint={colorScheme} style={styles.modalOverlay}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={Platform.OS === "ios" ? 50 : 0}
        >
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
              colors={[colors.error + "10", colors.error + "05"]}
              style={styles.modalGradient}
            >
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
              >
                {/* En-tête */}
                <View style={styles.modalHeader}>
                  <LinearGradient
                    colors={[colors.error + "20", colors.error + "10"]}
                    style={styles.iconWrapper}
                  >
                    <Ionicons
                      name="alert-circle"
                      size={32}
                      color={colors.error}
                    />
                  </LinearGradient>
                  <Text style={[styles.title, { color: colors.text }]}>
                    Annuler la mission
                  </Text>
                  <TouchableOpacity
                    onPress={onClose}
                    style={styles.closeButton}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="close"
                      size={22}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                {/* Message d'avertissement */}
                <Text
                  style={[styles.warningText, { color: colors.textSecondary }]}
                >
                  Cette action est irréversible. La mission sera perdue.
                </Text>

                {/* Raisons rapides */}
                <Text
                  style={[styles.quickLabel, { color: colors.textSecondary }]}
                >
                  Pourquoi annulez-vous ?
                </Text>

                <View style={styles.quickReasons}>
                  {QUICK_REASONS.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.reasonChip,
                        {
                          backgroundColor:
                            selectedQuickReason === item.id
                              ? colors.error + "15"
                              : colors.background,
                          borderColor:
                            selectedQuickReason === item.id
                              ? colors.error
                              : colors.border,
                        },
                      ]}
                      onPress={() => handleQuickReason(item.id, item.label)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={item.icon}
                        size={16}
                        color={
                          selectedQuickReason === item.id
                            ? colors.error
                            : colors.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.reasonChipText,
                          {
                            color:
                              selectedQuickReason === item.id
                                ? colors.error
                                : colors.text,
                          },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Champ texte personnalisé */}
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="Ou écrivez votre propre raison..."
                  placeholderTextColor={colors.placeholder}
                  multiline
                  numberOfLines={3}
                  value={reason}
                  onChangeText={setReason}
                  textAlignVertical="top"
                />

                {/* Boutons d'action */}
                <View style={styles.buttons}>
                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.cancelButton,
                      { borderColor: colors.border },
                    ]}
                    onPress={onClose}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.cancelButtonText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Retour
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.confirmButton]}
                    onPress={handleConfirm}
                    disabled={isSubmitting}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={[colors.error, colors.error + "CC"]}
                      style={styles.confirmGradient}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <Ionicons
                            name="trash-outline"
                            size={18}
                            color="#fff"
                          />
                          <Text style={styles.confirmButtonText}>
                            Confirmer
                          </Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </LinearGradient>
          </Animated.View>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  keyboardAvoidingView: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  modalContainer: {
    width: "90%",
    maxWidth: 400,
    maxHeight: SCREEN_HEIGHT * 0.8,
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
  scrollContent: {
    gap: 14,
    paddingBottom: 10,
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
  warningText: {
    fontSize: 13,
    lineHeight: 18,
  },
  quickLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
  },
  quickReasons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  reasonChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 30,
    borderWidth: 1,
    gap: 6,
  },
  reasonChipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    fontSize: 14,
    minHeight: 90,
    textAlignVertical: "top",
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    borderRadius: 30,
    overflow: "hidden",
  },
  cancelButton: {
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  confirmButton: {
    overflow: "hidden",
  },
  confirmGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
