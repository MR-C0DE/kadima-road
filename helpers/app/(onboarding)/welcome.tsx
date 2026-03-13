import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

const STEPS = [
  {
    id: 1,
    title: "Services",
    description: "Choisissez vos services",
    icon: "construct",
    color: "#FF6B6B",
  },
  {
    id: 2,
    title: "Zone",
    description: "Définissez votre rayon d'action",
    icon: "location",
    color: "#4ECDC4",
  },
  {
    id: 3,
    title: "Tarifs",
    description: "Fixez vos prix",
    icon: "cash",
    color: "#45B7D1",
  },
  {
    id: 4,
    title: "Disponibilités",
    description: "Indiquez vos horaires",
    icon: "time",
    color: "#96CEB4",
  },
  {
    id: 5,
    title: "Équipement",
    description: "Votre matériel disponible",
    icon: "build",
    color: "#FFEAA7",
  },
  {
    id: 6,
    title: "Documents",
    description: "Téléchargez vos justificatifs",
    icon: "document",
    color: "#DDA0DD",
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const stepsAnim = STEPS.map(() => useRef(new Animated.Value(0)).current);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.stagger(
      80,
      stepsAnim.map((anim) =>
        Animated.spring(anim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        })
      )
    ).start();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
      />

      {/* Background gradient */}
      <LinearGradient
        colors={[
          colors.primary + "05",
          colors.secondary + "05",
          colors.background,
        ]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
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
        {/* Logo */}
        <Animated.View
          style={[styles.logoContainer, { transform: [{ scale: scaleAnim }] }]}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.logo}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="flash" size={36} color="#fff" />
          </LinearGradient>
        </Animated.View>

        {/* Titre */}
        <Text style={[styles.title, { color: colors.text }]}>
          Bienvenue dans l'aventure
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Complétez votre profil en 6 étapes
        </Text>

        {/* Grille des étapes - 2 colonnes */}
        <View style={styles.stepsGrid}>
          {STEPS.map((step, index) => {
            const translateY = stepsAnim[index].interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            });

            return (
              <Animated.View
                key={step.id}
                style={[
                  styles.stepCard,
                  {
                    opacity: stepsAnim[index],
                    transform: [{ translateY }],
                  },
                ]}
              >
                <View
                  style={[
                    styles.stepIcon,
                    { backgroundColor: step.color + "15" },
                  ]}
                >
                  <Ionicons
                    name={step.icon as any}
                    size={24}
                    color={step.color}
                  />
                </View>
                <Text style={[styles.stepTitle, { color: colors.text }]}>
                  {step.title}
                </Text>
                <Text
                  style={[
                    styles.stepDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  {step.description}
                </Text>
                <View
                  style={[
                    styles.stepNumber,
                    { backgroundColor: step.color + "15" },
                  ]}
                >
                  <Text style={[styles.stepNumberText, { color: step.color }]}>
                    {step.id}
                  </Text>
                </View>
              </Animated.View>
            );
          })}
        </View>

        {/* Bouton */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("/(onboarding)/services")}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.buttonText}>Commencer</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Moins de 5 minutes
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingBottom: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  logo: {
    width: 70,
    height: 70,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 30,
  },
  stepsGrid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignContent: "center",
    marginBottom: 20,
  },
  stepCard: {
    width: (width - 52) / 2,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
    marginBottom: 12,
    position: "relative",
  },
  stepIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 11,
    lineHeight: 14,
  },
  stepNumber: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumberText: {
    fontSize: 11,
    fontWeight: "600",
  },
  button: {
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonGradient: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  hint: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 12,
  },
});
