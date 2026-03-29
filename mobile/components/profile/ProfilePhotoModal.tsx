// components/profile/ProfilePhotoModal.tsx - Version design amélioré

import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../contexts/ThemeContext";
import { Colors } from "@/constants/theme";

interface ProfilePhotoModalProps {
  visible: boolean;
  onClose: () => void;
  onTakePhoto: () => void;
  onPickImage: () => void;
  onDeletePhoto: () => void;
  hasPhoto: boolean;
}

export default function ProfilePhotoModal({
  visible,
  onClose,
  onTakePhoto,
  onPickImage,
  onDeletePhoto,
  hasPhoto,
}: ProfilePhotoModalProps) {
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme ?? "light"];

  // Animations
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

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
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
      slideAnim.setValue(30);
    }
  }, [visible]);

  const handleOptionPress = (callback: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    callback();
  };

  const OptionItem = ({
    icon,
    title,
    description,
    onPress,
    color,
    gradient,
  }: {
    icon: string;
    title: string;
    description: string;
    onPress: () => void;
    color: string;
    gradient?: [string, string];
  }) => (
    <TouchableOpacity
      style={[styles.modalOption, { borderColor: colors.border }]}
      onPress={() => handleOptionPress(onPress)}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={gradient || [color + "20", color + "10"]}
        style={[styles.modalOptionIcon, { backgroundColor: color + "10" }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name={icon as any} size={26} color={color} />
      </LinearGradient>
      <View style={styles.modalOptionText}>
        <Text style={[styles.modalOptionTitle, { color: colors.text }]}>
          {title}
        </Text>
        <Text style={[styles.modalOptionDesc, { color: colors.textSecondary }]}>
          {description}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <BlurView
        intensity={Platform.OS === "ios" ? 80 : 60}
        style={styles.modalOverlay}
        tint={effectiveTheme === "dark" ? "dark" : "light"}
      >
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
              transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Header avec dégradé */}
          <LinearGradient
            colors={[colors.primary + "15", colors.secondary + "05"]}
            style={styles.modalHeaderGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <View
                  style={[
                    styles.modalHeaderIcon,
                    { backgroundColor: colors.primary + "15" },
                  ]}
                >
                  <Ionicons name="camera" size={22} color={colors.primary} />
                </View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Photo de profil
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons
                  name="close-outline"
                  size={22}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            <Text
              style={[styles.modalSubtitle, { color: colors.textSecondary }]}
            >
              Personnalisez votre avatar
            </Text>
          </LinearGradient>

          {/* Options */}
          <View style={styles.optionsContainer}>
            <OptionItem
              icon="camera-outline"
              title="Prendre une photo"
              description="Utiliser l'appareil photo"
              onPress={onTakePhoto}
              color={colors.primary}
              gradient={[colors.primary + "20", colors.primary + "05"]}
            />

            <OptionItem
              icon="images-outline"
              title="Choisir dans la galerie"
              description="Sélectionner une photo existante"
              onPress={onPickImage}
              color={colors.primary}
              gradient={[colors.primary + "20", colors.primary + "05"]}
            />

            {hasPhoto && (
              <OptionItem
                icon="trash-outline"
                title="Supprimer la photo"
                description="Revenir à l'avatar par défaut"
                onPress={onDeletePhoto}
                color={colors.error}
                gradient={[colors.error + "20", colors.error + "05"]}
              />
            )}
          </View>

          {/* Bouton Annuler */}
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.border }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.cancelButtonText, { color: colors.textSecondary }]}
            >
              Annuler
            </Text>
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
    maxWidth: 380,
    borderRadius: 32,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 20,
  },
  modalHeaderGradient: {
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  modalSubtitle: {
    fontSize: 13,
    marginLeft: 52,
  },
  optionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 8,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    gap: 14,
  },
  modalOptionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOptionText: {
    flex: 1,
  },
  modalOptionTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  modalOptionDesc: {
    fontSize: 12,
  },
  cancelButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 30,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "500",
  },
});
