import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { useOnboarding } from "../../contexts/OnboardingContext";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function ZoneScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { data, updateZone } = useOnboarding();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Étape 2/6</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.progressFill,
            { backgroundColor: colors.primary, width: "32%" },
          ]}
        />
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          Zone d'intervention
        </Text>

        <Text style={[styles.label, { color: colors.textSecondary }]}>
          Rayon d'action (km)
        </Text>
        <View style={styles.radiusContainer}>
          {[5, 10, 15, 20, 25, 30].map((r) => (
            <TouchableOpacity
              key={r}
              style={[
                styles.radiusButton,
                { borderColor: colors.border },
                data.radius === r.toString() && {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => updateZone(r.toString(), data.address)}
            >
              <Text
                style={[
                  styles.radiusText,
                  {
                    color: data.radius === r.toString() ? "#fff" : colors.text,
                  },
                ]}
              >
                {r} km
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text
          style={[styles.label, { color: colors.textSecondary, marginTop: 20 }]}
        >
          Adresse de base (optionnelle)
        </Text>
        <TextInput
          style={[
            styles.input,
            { borderColor: colors.border, color: colors.text },
          ]}
          placeholder="Ex: 123 rue Principale, Ottawa"
          placeholderTextColor={colors.placeholder}
          value={data.address}
          onChangeText={(text) => updateZone(data.radius, text)}
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/(onboarding)/pricing")}
        >
          <Text style={styles.nextButtonText}>Suivant</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  progressBar: {
    height: 4,
    width: "100%",
  },
  progressFill: {
    height: "100%",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
  },
  label: {
    fontSize: 14,
    marginBottom: 10,
  },
  radiusContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  radiusButton: {
    width: "30%",
    padding: 12,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
  },
  radiusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  nextButton: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
