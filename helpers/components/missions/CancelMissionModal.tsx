// helpers/components/missions/CancelMissionModal.tsx
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
  Animated, // ← AJOUTER CET IMPORT
  Alert, // ← AJOUTER CET IMPORT (manquait aussi)
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";

interface CancelMissionModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  colors: any;
  colorScheme: string | null;
}

export const CancelMissionModal = ({
  visible,
  onClose,
  onConfirm,
  colors,
  colorScheme,
}: CancelMissionModalProps) => {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    }
  }, [visible]);

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
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.cancelModalContainer,
            {
              backgroundColor: colors.card,
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <LinearGradient
            colors={[colors.error + "15", colors.error + "05"]}
            style={styles.cancelModalGradient}
          >
            <View style={styles.cancelModalHeader}>
              <LinearGradient
                colors={[colors.error + "20", colors.error + "10"]}
                style={styles.cancelModalIcon}
              >
                <Ionicons name="alert-circle" size={28} color={colors.error} />
              </LinearGradient>
              <Text style={[styles.cancelModalTitle, { color: colors.text }]}>
                Annuler la mission
              </Text>
              <TouchableOpacity
                onPress={onClose}
                style={styles.cancelModalClose}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text
              style={[
                styles.cancelModalSubtitle,
                { color: colors.textSecondary },
              ]}
            >
              Pourquoi annulez-vous cette mission ?
            </Text>

            <TextInput
              style={[
                styles.cancelModalInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Ex: Problème de véhicule, client non joignable..."
              placeholderTextColor={colors.placeholder}
              multiline
              numberOfLines={3}
              value={reason}
              onChangeText={setReason}
              textAlignVertical="top"
              autoFocus
            />

            <View style={styles.cancelModalButtons}>
              <TouchableOpacity
                style={[
                  styles.cancelModalBtn,
                  styles.cancelModalBtnCancel,
                  { borderColor: colors.border },
                ]}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={{ color: colors.textSecondary }}>Retour</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.cancelModalBtn,
                  styles.cancelModalBtnConfirm,
                  { backgroundColor: colors.error },
                ]}
                onPress={handleConfirm}
                disabled={isSubmitting}
                activeOpacity={0.7}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "600" }}>
                    Confirmer l'annulation
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <Text
              style={[styles.cancelModalNote, { color: colors.textSecondary }]}
            >
              <Ionicons name="information-circle" size={12} /> Cette action est
              irréversible
            </Text>
          </LinearGradient>
        </Animated.View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center" },
  cancelModalContainer: {
    width: "90%",
    maxWidth: 400,
    borderRadius: 32,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 20,
  },
  cancelModalGradient: { padding: 24 },
  cancelModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  cancelModalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cancelModalTitle: { fontSize: 20, fontWeight: "700", flex: 1 },
  cancelModalClose: { padding: 4 },
  cancelModalSubtitle: { fontSize: 14, marginBottom: 16 },
  cancelModalInput: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  cancelModalButtons: { flexDirection: "row", gap: 12, marginBottom: 16 },
  cancelModalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelModalBtnCancel: { borderWidth: 1 },
  cancelModalBtnConfirm: { borderWidth: 0 },
  cancelModalNote: { fontSize: 11, textAlign: "center", opacity: 0.7 },
});
