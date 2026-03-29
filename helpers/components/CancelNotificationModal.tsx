// helpers/components/CancelNotificationModal.tsx (version améliorée)
import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

const { width, height } = Dimensions.get("window");

export interface CancelNotificationModalProps {
  visible: boolean;
  missionId: string;
  missionTitle: string;
  reason?: string;
  cancelledBy: "user" | "helper" | "system";
  onClose: () => void;
  onDismiss?: () => void;
  autoCloseDelay?: number; // en secondes (0 = pas de fermeture auto)
  colors: any;
  colorScheme: string | null;
}

export const CancelNotificationModal = ({
  visible,
  missionId,
  missionTitle,
  reason,
  cancelledBy,
  onClose,
  onDismiss,
  autoCloseDelay = 0,
  colors,
  colorScheme,
}: CancelNotificationModalProps) => {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const autoCloseTimer = useRef<NodeJS.Timeout | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  // Gestion de la fermeture automatique
  useEffect(() => {
    if (visible && autoCloseDelay > 0) {
      // Animation de progression
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: autoCloseDelay * 1000,
        useNativeDriver: false,
      }).start();

      // Timer de fermeture
      autoCloseTimer.current = setTimeout(() => {
        if (onDismiss) onDismiss();
        onClose();
      }, autoCloseDelay * 1000);
    }

    return () => {
      if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [visible, autoCloseDelay, onClose, onDismiss]);

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
      progressAnim.setValue(0);
    }
  }, [visible]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const getIconAndColor = () => {
    switch (cancelledBy) {
      case "user":
        return {
          icon: "person",
          color: "#F59E0B",
          bgColor: "#F59E0B20",
          label: "Client",
        };
      case "helper":
        return {
          icon: "construct",
          color: "#EF4444",
          bgColor: "#EF444420",
          label: "Helper",
        };
      default:
        return {
          icon: "alert-circle",
          color: "#EF4444",
          bgColor: "#EF444420",
          label: "Système",
        };
    }
  };

  const getTitle = () => {
    switch (cancelledBy) {
      case "user":
        return "Mission annulée par le client";
      case "helper":
        return "Vous avez annulé la mission";
      default:
        return "Mission annulée";
    }
  };

  const getMessage = () => {
    if (reason) return reason;
    switch (cancelledBy) {
      case "user":
        return "Le client a annulé l'intervention. Cette mission n'est plus disponible.";
      case "helper":
        return "Vous avez annulé cette mission. Elle a été retirée de votre liste.";
      default:
        return "L'intervention a été annulée pour des raisons techniques.";
    }
  };

  const { icon, color, bgColor, label } = getIconAndColor();

  return (
    <Modal visible={visible} transparent animationType="none">
      <BlurView intensity={90} tint={colorScheme} style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={() => {
            if (onDismiss) onDismiss();
            onClose();
          }}
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
            colors={[bgColor, bgColor + "05"]}
            style={styles.modalGradient}
          >
            <View style={styles.modalHeader}>
              <LinearGradient
                colors={[color + "20", color + "10"]}
                style={[styles.iconContainer, { backgroundColor: bgColor }]}
              >
                <Ionicons name={icon} size={32} color={color} />
              </LinearGradient>
              <Text style={[styles.title, { color: colors.text }]}>
                {getTitle()}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  if (onDismiss) onDismiss();
                  onClose();
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              <Text style={[styles.missionName, { color: colors.primary }]}>
                {missionTitle}
              </Text>
              <Text style={[styles.message, { color: colors.textSecondary }]}>
                {getMessage()}
              </Text>
            </View>

            {autoCloseDelay > 0 && (
              <View style={styles.progressContainer}>
                <View
                  style={[
                    styles.progressBar,
                    { backgroundColor: colors.border },
                  ]}
                >
                  <Animated.View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: color,
                        width: progressWidth,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[styles.progressText, { color: colors.textSecondary }]}
                >
                  Fermeture automatique dans {autoCloseDelay} secondes
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.closeModalButton, { borderColor: colors.border }]}
              onPress={() => {
                if (onDismiss) onDismiss();
                onClose();
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.closeModalButtonText,
                  { color: colors.textSecondary },
                ]}
              >
                {autoCloseDelay > 0 ? "Fermer maintenant" : "Fermer"}
              </Text>
            </TouchableOpacity>
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
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 20,
  },
  modalGradient: {
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    marginBottom: 24,
  },
  missionName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  progressContainer: {
    marginBottom: 20,
    gap: 8,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    textAlign: "center",
  },
  closeModalButton: {
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1,
    alignItems: "center",
  },
  closeModalButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
