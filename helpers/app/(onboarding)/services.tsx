import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useOnboarding } from "../../contexts/OnboardingContext";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const SERVICES = [
  { id: "battery", label: "Batterie", icon: "battery-dead" },
  { id: "tire", label: "Pneu", icon: "car-sport" },
  { id: "fuel", label: "Essence", icon: "water" },
  { id: "towing", label: "Remorquage", icon: "construct" },
  { id: "lockout", label: "Clés enfermées", icon: "key" },
  { id: "diagnostic", label: "Diagnostic", icon: "medkit" },
];

export default function ServicesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { data, updateServices } = useOnboarding();

  const toggleService = (serviceId) => {
    const newServices = data.services.includes(serviceId)
      ? data.services.filter((id) => id !== serviceId)
      : [...data.services, serviceId];
    updateServices(newServices);
  };

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
        <Text style={styles.headerTitle}>Étape 1/6</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.progressFill,
            { backgroundColor: colors.primary, width: "16%" },
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          Quels services proposez-vous ?
        </Text>

        <View style={styles.servicesGrid}>
          {SERVICES.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={[
                styles.serviceCard,
                { borderColor: colors.border },
                data.services.includes(service.id) && {
                  backgroundColor: colors.primary + "15",
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => toggleService(service.id)}
            >
              <Ionicons
                name={service.icon}
                size={32}
                color={
                  data.services.includes(service.id)
                    ? colors.primary
                    : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.serviceLabel,
                  {
                    color: data.services.includes(service.id)
                      ? colors.primary
                      : colors.text,
                  },
                ]}
              >
                {service.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            { backgroundColor: colors.primary },
            data.services.length === 0 && styles.disabledButton,
          ]}
          onPress={() => router.push("/(onboarding)/zone")}
          disabled={data.services.length === 0}
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
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
  },
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
    justifyContent: "space-between",
  },
  serviceCard: {
    width: "30%",
    aspectRatio: 1,
    borderWidth: 1,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  serviceLabel: {
    marginTop: 8,
    fontSize: 12,
    textAlign: "center",
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
  disabledButton: {
    opacity: 0.5,
  },
});
