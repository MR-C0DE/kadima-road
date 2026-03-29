// app/sos/waiting.tsx - VERSION CORRIGÉE (arrête le polling avant redirection)
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  Animated,
  Easing,
  Platform,
  StatusBar,
  Modal,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "../../contexts/AuthContext";
import { useSOS } from "../../contexts/SOSContext";
import { api } from "../../config/api";
import * as Haptics from "expo-haptics";

const { width, height } = Dimensions.get("window");

export default function SOSWaitingScreen() {
  const router = useRouter();
  const { sosId } = useLocalSearchParams();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { startSOS, updateSOSStatus, clearSOS } = useSOS();

  const [timeElapsed, setTimeElapsed] = useState(0);
  const [helperFound, setHelperFound] = useState(false);
  const [showMinimized, setShowMinimized] = useState(false);

  // Refs CRITIQUES
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const hasRedirectedRef = useRef(false); // ← Bloque les redirections multiples
  const isPollingActiveRef = useRef(true);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // ============================================
  // 1. NETTOYAGE COMPLET
  // ============================================
  const clearAll = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    isPollingActiveRef.current = false;
  }, []);

  // ============================================
  // 2. REDIRECTION UNIQUE
  // ============================================
  const redirectToTracking = useCallback(
    (interventionId: string) => {
      if (hasRedirectedRef.current) {
        console.log("⏭️ Redirection déjà effectuée, ignorée");
        return;
      }
      if (!isMountedRef.current) {
        console.log("⏭️ Composant démonté, redirection ignorée");
        return;
      }

      console.log(`🟡 Redirection unique vers tracking/${interventionId}`);
      hasRedirectedRef.current = true;

      // Nettoyer TOUT avant de rediriger
      clearAll();

      // Petit délai pour que le nettoyage soit effectif
      setTimeout(() => {
        if (isMountedRef.current) {
          router.replace(`/sos/tracking/${interventionId}`);
        }
      }, 100);
    },
    [router, clearAll]
  );

  // ============================================
  // 3. VÉRIFICATION DU STATUT SOS
  // ============================================
  const checkSOSStatus = useCallback(async () => {
    if (!sosId || hasRedirectedRef.current || !isPollingActiveRef.current)
      return;

    try {
      const response = await api.get(`/sos/${sosId}`);
      const alert = response.data.data;

      if (!isMountedRef.current || hasRedirectedRef.current) return;

      console.log(`📡 Statut SOS: ${alert.status}`);

      // Helper trouvé !
      if (alert.status === "dispatched" && alert.intervention) {
        console.log(
          "✅ Helper trouvé! Intervention ID:",
          alert.intervention._id
        );

        // Mettre à jour le contexte
        updateSOSStatus("dispatched", alert.intervention.helper);

        // Nettoyer et rediriger
        clearAll();
        redirectToTracking(alert.intervention._id);
        return;
      }

      // SOS annulé
      if (alert.status === "cancelled") {
        console.log("❌ SOS annulé");
        clearAll();
        if (!hasRedirectedRef.current) {
          hasRedirectedRef.current = true;
          setTimeout(() => {
            if (isMountedRef.current) {
              router.replace("/(tabs)");
            }
          }, 100);
        }
        return;
      }
    } catch (error) {
      console.error("Erreur vérification statut SOS:", error);
    }
  }, [sosId, updateSOSStatus, redirectToTracking, router]);

  // ============================================
  // 4. POLLING
  // ============================================
  const startPolling = useCallback(() => {
    if (!isPollingActiveRef.current) return;

    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(() => {
      if (
        isMountedRef.current &&
        !hasRedirectedRef.current &&
        isPollingActiveRef.current
      ) {
        checkSOSStatus();
      }
    }, 3000);
  }, [checkSOSStatus]);

  // ============================================
  // 5. TIMER
  // ============================================
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (isMountedRef.current && !hasRedirectedRef.current) {
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
      }
    }, 1000);
  }, [progressAnim]);

  // ============================================
  // 6. INITIALISATION UNIQUE
  // ============================================
  useEffect(() => {
    isMountedRef.current = true;
    hasRedirectedRef.current = false;
    isPollingActiveRef.current = true;

    console.log("🚀 SOSWaitingScreen initialisé pour SOS ID:", sosId);

    // Animations d'entrée
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Animation de pulsation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Démarrer les timers
    startPolling();
    startTimer();

    // Sauvegarder le SOS dans le contexte
    if (sosId) {
      startSOS(sosId as string, "simulated_payment");
    }

    return () => {
      console.log("🧹 Nettoyage de SOSWaitingScreen");
      isMountedRef.current = false;
      clearAll();
    };
  }, []); // ⚠️ Dépendances vides pour ne s'exécuter qu'une fois

  // ============================================
  // 7. ACTIONS
  // ============================================
  const handleCancel = () => {
    Alert.alert(
      "Annuler la recherche",
      "Voulez-vous vraiment annuler cette alerte SOS ?",
      [
        { text: "Non", style: "cancel" },
        {
          text: "Oui, annuler",
          style: "destructive",
          onPress: async () => {
            console.log("🟡 Annulation SOS demandée");
            clearAll();

            try {
              await api.put(`/sos/${sosId}/cancel`);
            } catch (error) {
              console.error("Erreur annulation:", error);
            }

            clearSOS();

            if (!hasRedirectedRef.current) {
              hasRedirectedRef.current = true;
              setTimeout(() => {
                if (isMountedRef.current) {
                  router.back();
                }
              }, 100);
            }
          },
        },
      ]
    );
  };

  const handleMinimize = () => {
    setShowMinimized(true);
  };

  const handleResume = () => {
    setShowMinimized(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  // ============================================
  // 8. RENDU (état minimisé)
  // ============================================
  if (showMinimized) {
    return (
      <TouchableOpacity
        style={[styles.minimizedBadge, { backgroundColor: colors.primary }]}
        onPress={handleResume}
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

  // ============================================
  // 9. RENDU (écran de recherche)
  // ============================================
  return (
    <Modal
      visible={true}
      transparent
      animationType="fade"
      onRequestClose={handleMinimize}
    >
      <View
        style={[styles.modalOverlay, { backgroundColor: colors.background }]}
      >
        {/* Cercles décoratifs */}
        <Animated.View
          style={[
            styles.decorativeCircle,
            styles.circle1,
            {
              backgroundColor: colors.primary + "08",
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.decorativeCircle,
            styles.circle2,
            {
              backgroundColor: colors.secondary + "08",
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />

        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.headerContent}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleMinimize}
              >
                <Ionicons name="chevron-down" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Recherche en cours</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCancel}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Contenu principal */}
          <View style={styles.waitingContent}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.searchIcon}
              >
                <Ionicons name="search" size={48} color="#fff" />
              </LinearGradient>
            </Animated.View>

            <Text style={[styles.waitingTitle, { color: colors.text }]}>
              Recherche d'un helper...
            </Text>

            <Text
              style={[styles.waitingSubtitle, { color: colors.textSecondary }]}
            >
              Temps écoulé: {formatTime(timeElapsed)}
            </Text>

            <View style={styles.progressContainer}>
              <View
                style={[styles.progressBar, { backgroundColor: colors.border }]}
              >
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: colors.primary,
                      width: progressWidth,
                    },
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

            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={[styles.minimizeButton, { borderColor: colors.border }]}
                onPress={handleMinimize}
              >
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={colors.textSecondary}
                />
                <Text
                  style={[styles.minimizeText, { color: colors.textSecondary }]}
                >
                  Réduire
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.error }]}
                onPress={handleCancel}
              >
                <Ionicons name="close" size={20} color={colors.error} />
                <Text style={[styles.cancelText, { color: colors.error }]}>
                  Annuler la recherche
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.note, { color: colors.textSecondary }]}>
              <Ionicons name="information-circle" size={12} /> Restez à
              proximité de votre véhicule, un helper pourrait arriver rapidement
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
  },
  decorativeCircle: {
    position: "absolute",
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
  },
  circle1: {
    top: -width * 0.2,
    right: -width * 0.2,
  },
  circle2: {
    bottom: -height * 0.3,
    left: -width * 0.3,
  },
  content: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  waitingContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 24,
  },
  searchIcon: {
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
  waitingTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  waitingSubtitle: {
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
  buttonsContainer: {
    width: "100%",
    gap: 12,
    marginTop: 20,
  },
  minimizeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 30,
    borderWidth: 1,
    gap: 8,
  },
  minimizeText: {
    fontSize: 14,
    fontWeight: "500",
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 30,
    borderWidth: 1,
    gap: 8,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "500",
  },
  note: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 20,
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
