// components/sos/SOSWaitingScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useSOS } from "../../contexts/SOSContext";
import { useSOSPolling } from "../../hooks/useSOS";
import * as Haptics from "expo-haptics";

const { width, height } = Dimensions.get("window");

interface SOSWaitingScreenProps {
  visible: boolean;
  onMinimize: () => void;
  onClose: () => void;
  colors: any;
  colorScheme: string | null;
  onHelperFound: () => void;
}

export const SOSWaitingScreen = ({
  visible,
  onMinimize,
  onClose,
  colors,
  colorScheme,
  onHelperFound,
}: SOSWaitingScreenProps) => {
  const { sosState, cancelSOS } = useSOS();
  const { isWaiting } = useSOSPolling();
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [progressAnim] = useState(new Animated.Value(0));
  const [showMinimized, setShowMinimized] = useState(false);

  useEffect(() => {
    if (!visible || !isWaiting) return;

    const timer = setInterval(() => {
      setTimeElapsed((prev) => {
        const newTime = prev + 1;
        const progress = Math.min(newTime / 300, 1);
        Animated.timing(progressAnim, {
          toValue: progress,
          duration: 1000,
          useNativeDriver: false,
        }).start();
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, isWaiting]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (sosState.activeSOS?.status === "dispatched") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onHelperFound();
    }
  }, [sosState.activeSOS?.status]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  if (showMinimized) {
    return (
      <TouchableOpacity
        style={[styles.minimizedBadge, { backgroundColor: colors.primary }]}
        onPress={() => setShowMinimized(false)}
        activeOpacity={0.8}
      >
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <ActivityIndicator size="small" color="#fff" />
        </Animated.View>
        <Text style={styles.minimizedText}>{formatTime(timeElapsed)}</Text>
        <Ionicons name="chevron-up" size={16} color="#fff" />
      </TouchableOpacity>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onMinimize}
    >
      <BlurView intensity={90} tint={colorScheme} style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onMinimize}
          activeOpacity={1}
        />

        <View style={[styles.container, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={onMinimize}
              style={styles.minimizeButton}
            >
              <Ionicons
                name="chevron-down"
                size={24}
                color={colors.textSecondary}
              />
              <Text
                style={[styles.minimizeText, { color: colors.textSecondary }]}
              >
                Réduire
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.iconContainer}
              >
                <Ionicons name="search" size={48} color="#fff" />
              </LinearGradient>
            </Animated.View>

            <Text style={[styles.title, { color: colors.text }]}>
              Recherche d'un helper...
            </Text>

            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Temps écoulé: {formatTime(timeElapsed)}
            </Text>

            <View style={styles.progressContainer}>
              <View
                style={[styles.progressBar, { backgroundColor: colors.border }]}
              >
                <Animated.View
                  style={[
                    styles.progressFill,
                    { backgroundColor: colors.primary, width: progressWidth },
                  ]}
                />
              </View>
              <Text
                style={[styles.progressText, { color: colors.textSecondary }]}
              >
                {timeElapsed < 30
                  ? "Nous recherchons le helper le plus proche..."
                  : timeElapsed < 60
                  ? "Toujours en recherche..."
                  : timeElapsed < 120
                  ? "Cela prend plus de temps que prévu..."
                  : "Nous élargissons la zone de recherche..."}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.border }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                cancelSOS();
                onClose();
              }}
            >
              <Text style={[styles.cancelText, { color: colors.error }]}>
                Annuler la recherche
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  container: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    minHeight: height * 0.5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  minimizeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  minimizeText: {
    fontSize: 14,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    alignItems: "center",
    gap: 20,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
  },
  progressContainer: {
    width: "100%",
    gap: 12,
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
  progressText: {
    fontSize: 13,
    textAlign: "center",
  },
  cancelButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    borderWidth: 1,
    marginTop: 20,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  minimizedBadge: {
    position: "absolute",
    bottom: 80,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 40,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  minimizedText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
