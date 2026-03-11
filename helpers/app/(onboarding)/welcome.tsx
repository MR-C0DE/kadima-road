import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

export default function WelcomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={
          colorScheme === "dark"
            ? [colors.primary + "20", colors.secondary + "20"]
            : [colors.primary + "10", colors.secondary + "10"]
        }
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: colors.primary + "15" },
          ]}
        >
          <Ionicons name="car-sport" size={80} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          Bienvenue dans Kadima Helpers !
        </Text>

        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Complétez votre profil pour commencer à aider les conducteurs et
          gagner de l'argent.
        </Text>

        <View style={styles.stepsContainer}>
          <View style={styles.step}>
            <View
              style={[
                styles.stepNumber,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Text style={[styles.stepNumberText, { color: colors.primary }]}>
                1
              </Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Services
              </Text>
              <Text
                style={[
                  styles.stepDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Choisissez vos services
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View
              style={[
                styles.stepNumber,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Text style={[styles.stepNumberText, { color: colors.primary }]}>
                2
              </Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Zone
              </Text>
              <Text
                style={[
                  styles.stepDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Définissez votre rayon d'action
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View
              style={[
                styles.stepNumber,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Text style={[styles.stepNumberText, { color: colors.primary }]}>
                3
              </Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Tarifs
              </Text>
              <Text
                style={[
                  styles.stepDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Fixez vos prix
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View
              style={[
                styles.stepNumber,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Text style={[styles.stepNumberText, { color: colors.primary }]}>
                4
              </Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Disponibilités
              </Text>
              <Text
                style={[
                  styles.stepDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Indiquez vos horaires
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View
              style={[
                styles.stepNumber,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Text style={[styles.stepNumberText, { color: colors.primary }]}>
                5
              </Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Équipement
              </Text>
              <Text
                style={[
                  styles.stepDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Votre matériel disponible
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View
              style={[
                styles.stepNumber,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Text style={[styles.stepNumberText, { color: colors.primary }]}>
                6
              </Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Documents
              </Text>
              <Text
                style={[
                  styles.stepDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Téléchargez vos justificatifs
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.startButton}
          onPress={() => router.push("/(onboarding)/services")}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.startButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.startButtonText}>Commencer</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
    paddingTop: 60,
    paddingBottom: 30,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  stepsContainer: {
    gap: 15,
    marginBottom: 40,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: 13,
  },
  startButton: {
    borderRadius: 30,
    overflow: "hidden",
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
    fontWeight: "bold",
  },
});
