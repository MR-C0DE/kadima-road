import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Easing,
  Platform,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

const { width, height } = Dimensions.get("window");

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // État pour les fonctionnalités rapides
  const [quickActions] = useState([
    {
      id: "sos",
      title: "SOS Urgence",
      icon: "alert-circle",
      gradient: ["#E63946", "#B71C1C"],
      route: "/sos",
    },
    {
      id: "diagnostic",
      title: "Diagnostic IA",
      icon: "medkit",
      gradient: ["#D4AF37", "#B8860B"],
      route: "/diagnostic",
    },
    {
      id: "helpers",
      title: "Helpers",
      icon: "people",
      gradient: ["#800020", "#4A0010"],
      route: "/helpers",
    },
    {
      id: "history",
      title: "Historique",
      icon: "time",
      gradient: ["#2C2C2C", "#1A1A1A"],
      route: "/interventions",
    },
  ]);

  useEffect(() => {
    // Animations d'entrée
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Animation de pulsation pour le bouton SOS
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
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
  }, []);

  const handleSOSPress = () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    router.push("/sos");
  };

  const handleQuickAction = (action) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(action.route);
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Fond avec dégradé */}
      <LinearGradient
        colors={
          colorScheme === "dark"
            ? ["rgba(184,134,11,0.05)", "rgba(128,0,32,0.05)"]
            : ["rgba(212,175,55,0.03)", "rgba(128,0,32,0.02)"]
        }
        style={StyleSheet.absoluteFill}
      />

      {/* Cercles décoratifs */}
      <Animated.View
        style={[
          styles.decorativeCircle,
          styles.circle1,
          {
            backgroundColor: colors.primary + "10",
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.decorativeCircle,
          styles.circle2,
          {
            backgroundColor: colors.secondary + "10",
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
          },
        ]}
      >
        {/* Header avec profil */}
        <Animated.View style={[styles.header, { transform: [{ rotate }] }]}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              Bon retour parmi nous,
            </Text>
            <Text style={[styles.userName, { color: colors.text }]}>
              {user?.name || "Cher Conducteur"}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.profileButton, { borderColor: colors.border }]}
            onPress={() => router.push("/(tabs)/profile")}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.profileGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.profileInitial}>
                {user?.name?.[0] || "U"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Bouton SOS principal */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[styles.sosButton, { shadowColor: colors.primary }]}
            onPress={handleSOSPress}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#E63946", "#B71C1C"]}
              style={styles.sosGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="alert-circle" size={80} color="#fff" />
              <Text style={styles.sosText}>SOS URGENCE</Text>
              <View style={styles.sosBadge}>
                <Text style={styles.sosBadgeText}>24/7</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Message de bienvenue */}
        <View style={styles.welcomeCard}>
          <LinearGradient
            colors={[colors.primary + "20", colors.secondary + "10"]}
            style={styles.welcomeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons
              name="shield-checkmark"
              size={24}
              color={colors.primary}
            />
            <View style={styles.welcomeTextContainer}>
              <Text style={[styles.welcomeTitle, { color: colors.text }]}>
                Protection totale
              </Text>
              <Text
                style={[
                  styles.welcomeSubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                Assistance disponible 24h/24, 7j/7
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Actions rapides */}
        <View style={styles.quickActionsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Actions rapides
          </Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <Animated.View
                key={action.id}
                style={[
                  styles.quickActionWrapper,
                  {
                    opacity: fadeAnim,
                    transform: [
                      {
                        translateY: slideAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 50 * (index + 1)],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.quickAction}
                  onPress={() => handleQuickAction(action)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={action.gradient}
                    style={styles.quickActionGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name={action.icon} size={30} color="#fff" />
                  </LinearGradient>
                  <Text
                    style={[styles.quickActionTitle, { color: colors.text }]}
                  >
                    {action.title}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Statistiques rapides */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="car" size={24} color={colors.primary} />
            <Text style={[styles.statNumber, { color: colors.text }]}>0</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Véhicules
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="time" size={24} color={colors.primary} />
            <Text style={[styles.statNumber, { color: colors.text }]}>0</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Interventions
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="star" size={24} color={colors.primary} />
            <Text style={[styles.statNumber, { color: colors.text }]}>5.0</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Note
            </Text>
          </View>
        </View>

        {/* Dernières interventions (placeholder) */}
        <View style={styles.recentContainer}>
          <View style={styles.recentHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Dernières interventions
            </Text>
            <TouchableOpacity onPress={() => router.push("/interventions")}>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>
                Voir tout
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={[styles.recentCard, { backgroundColor: colors.surface }]}
          >
            <View style={styles.recentIcon}>
              <Ionicons
                name="checkmark-circle"
                size={40}
                color={colors.success}
              />
            </View>
            <View style={styles.recentInfo}>
              <Text style={[styles.recentTitle, { color: colors.text }]}>
                Aucune intervention
              </Text>
              <Text
                style={[styles.recentDate, { color: colors.textSecondary }]}
              >
                Commencez par utiliser SOS ou Diagnostic
              </Text>
            </View>
          </View>
        </View>

        {/* Tips de sécurité */}
        <View style={[styles.tipCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="bulb" size={24} color={colors.primary} />
          <View style={styles.tipContent}>
            <Text style={[styles.tipTitle, { color: colors.text }]}>
              Astuce du jour
            </Text>
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              En cas de panne, activez vos feux de détresse et placez le
              triangle de signalisation à 30 mètres.
            </Text>
          </View>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
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
    bottom: -width * 0.2,
    left: -width * 0.2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  greeting: {
    fontSize: 14,
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
  },
  profileButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    overflow: "hidden",
  },
  profileGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  profileInitial: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  sosButton: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    alignSelf: "center",
    marginBottom: 30,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    overflow: "hidden",
  },
  sosGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  sosText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
    letterSpacing: 1,
  },
  sosBadge: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "rgba(255,255,255,0.3)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  sosBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  welcomeCard: {
    marginBottom: 30,
    borderRadius: 16,
    overflow: "hidden",
  },
  welcomeGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  welcomeSubtitle: {
    fontSize: 14,
  },
  quickActionsContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickActionWrapper: {
    width: "48%",
    marginBottom: 16,
  },
  quickAction: {
    alignItems: "center",
  },
  quickActionGradient: {
    width: 70,
    height: 70,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
  },
  recentContainer: {
    marginBottom: 30,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "600",
  },
  recentCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recentIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  recentInfo: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  recentDate: {
    fontSize: 14,
  },
  tipCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
