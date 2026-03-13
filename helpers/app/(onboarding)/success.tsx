import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Animated,
  Platform,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { useOnboarding } from "../../contexts/OnboardingContext";
import { api } from "../../config/api";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

const { width, height } = Dimensions.get("window");

export default function SuccessScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { data, resetData } = useOnboarding();
  const [loading, setLoading] = useState(false);

  // Animations
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animation séquentielle
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Animation de rotation pour l'icône
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animation de confettis
    Animated.loop(
      Animated.sequence([
        Animated.timing(confettiAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(confettiAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "10deg"],
  });

  const confetti1Y = confettiAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, height],
  });

  const confetti2Y = confettiAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, height],
  });

  const confetti3Y = confettiAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-150, height],
  });

  const confettiRotate = confettiAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const handleComplete = async () => {
    setLoading(true);

    try {
      const helperData = {
        address: data.address,
        services: data.services,
        equipment: data.equipment.map((name: string) => ({
          name,
          has: true,
          lastChecked: new Date().toISOString(),
        })),
        serviceArea: {
          radius: parseInt(data.radius) || 20,
        },
        pricing: {
          basePrice: parseInt(data.basePrice) || 25,
          perKm: parseInt(data.perKm) || 1,
        },
        availability: {
          schedule: Object.entries(data.availability)
            .filter(([_, active]) => active)
            .map(([day]) => ({
              day,
              startTime: "09:00",
              endTime: "18:00",
            })),
        },
      };

      const response = await api.put("/helpers/profile/me", helperData);

      resetData();
      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert(
        "Erreur",
        error.response?.data?.message || "Impossible de configurer le profil",
        [{ text: "OK", onPress: () => router.replace("/(tabs)") }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
      />

      {/* Confettis animés */}
      <Animated.View
        style={[
          styles.confetti,
          {
            backgroundColor: colors.primary,
            left: "10%",
            transform: [{ translateY: confetti1Y }, { rotate: confettiRotate }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.confetti,
          {
            backgroundColor: colors.secondary,
            left: "30%",
            transform: [{ translateY: confetti2Y }, { rotate: confettiRotate }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.confetti,
          {
            backgroundColor: colors.success,
            left: "50%",
            transform: [{ translateY: confetti3Y }, { rotate: confettiRotate }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.confetti,
          {
            backgroundColor: colors.primary,
            left: "70%",
            transform: [{ translateY: confetti1Y }, { rotate: confettiRotate }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.confetti,
          {
            backgroundColor: colors.secondary,
            left: "90%",
            transform: [{ translateY: confetti2Y }, { rotate: confettiRotate }],
          },
        ]}
      />

      {/* Contenu principal */}
      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Icône avec animation */}
        <Animated.View style={{ transform: [{ rotate }] }}>
          <LinearGradient
            colors={[colors.success + "30", colors.success + "10"]}
            style={styles.iconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.success + "20" },
              ]}
            >
              <Ionicons
                name="checkmark-done"
                size={64}
                color={colors.success}
              />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Texte avec animation */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={[styles.title, { color: colors.text }]}>
            Félicitations ! 🎉
          </Text>

          <Text style={[styles.message, { color: colors.textSecondary }]}>
            Votre profil helper est maintenant prêt. Vous pouvez commencer à
            recevoir des missions !
          </Text>
        </Animated.View>

        {/* Statistiques avec animation */}
        <Animated.View
          style={[
            styles.statsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={[colors.card, colors.card]}
            style={styles.statsCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Ionicons name="construct" size={20} color={colors.primary} />
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {data.services.length}
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Services
                </Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Ionicons name="location" size={20} color={colors.primary} />
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {data.radius} km
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Rayon
                </Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Ionicons name="cash" size={20} color={colors.primary} />
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {data.basePrice}$
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Tarif
                </Text>
              </View>
            </View>

            {/* Jours travaillés */}
            <View style={styles.daysContainer}>
              {Object.entries(data.availability)
                .filter(([_, active]) => active)
                .map(([day]) => (
                  <View
                    key={day}
                    style={[
                      styles.dayBadge,
                      { backgroundColor: colors.primary + "15" },
                    ]}
                  >
                    <Text style={[styles.dayText, { color: colors.primary }]}>
                      {day.slice(0, 3).toUpperCase()}
                    </Text>
                  </View>
                ))}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Bouton avec animation */}
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleComplete}
            disabled={loading}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.startButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.startButtonText}>
                    Commencer l'aventure
                  </Text>
                  <Ionicons name="rocket" size={20} color="#fff" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <Text style={[styles.hintText, { color: colors.textSecondary }]}>
            Prêt à aider des conducteurs
          </Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  confetti: {
    position: "absolute",
    width: 10,
    height: 30,
    borderRadius: 5,
    opacity: 0.3,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  iconGradient: {
    padding: 15,
    borderRadius: 100,
    marginBottom: 30,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 36,
    fontWeight: "700",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  statsContainer: {
    width: "100%",
    marginBottom: 30,
  },
  statsCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  daysContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  dayBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  dayText: {
    fontSize: 11,
    fontWeight: "600",
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
  },
  startButton: {
    borderRadius: 30,
    overflow: "hidden",
    width: "100%",
    maxWidth: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  startButtonGradient: {
    flexDirection: "row",
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  startButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  hintText: {
    fontSize: 13,
    marginTop: 12,
  },
});
