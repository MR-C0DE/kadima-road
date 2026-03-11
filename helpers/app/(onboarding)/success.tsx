import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useOnboarding } from "../../contexts/OnboardingContext";
import { api } from "../../config/api";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function SuccessScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { data, resetData } = useOnboarding();
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    setLoading(true);
    try {
      const helperData = {
        services: data.services,
        equipment: data.equipment,
        serviceArea: {
          radius: parseInt(data.radius),
          coordinates: [-75.6919, 45.4215], // Ottawa par défaut
        },
        pricing: {
          basePrice: parseInt(data.basePrice),
          perKm: parseInt(data.perKm),
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

      console.log("📤 Envoi des données helper:", helperData);

      const response = await api.post("/helpers/register", helperData);

      console.log("✅ Réponse:", response.data);

      resetData();
      router.replace("/(tabs)/home");
    } catch (error) {
      console.error("❌ Erreur:", error.response?.data || error.message);
      Alert.alert(
        "Erreur",
        error.response?.data?.message || "Impossible de créer le profil helper"
      );
    } finally {
      setLoading(false);
    }
  };

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
            { backgroundColor: colors.success + "20" },
          ]}
        >
          <Ionicons name="checkmark-circle" size={80} color={colors.success} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          Félicitations !
        </Text>

        <Text style={[styles.message, { color: colors.textSecondary }]}>
          Votre profil helper a été créé avec succès. Vous pouvez maintenant
          commencer à recevoir des missions.
        </Text>

        <TouchableOpacity
          style={styles.startButton}
          onPress={handleComplete}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.startButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.startButtonText}>Commencer</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
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
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  startButton: {
    borderRadius: 30,
    overflow: "hidden",
    width: "100%",
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
