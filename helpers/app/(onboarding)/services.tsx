import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { useOnboarding } from "../../contexts/OnboardingContext";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const SERVICES = [
  {
    id: "battery",
    label: "Batterie",
    icon: "battery-dead",
    color: "#FF6B6B",
    description: "Dépannage batterie",
  },
  {
    id: "tire",
    label: "Pneu",
    icon: "car-sport",
    color: "#4ECDC4",
    description: "Changement de pneu",
  },
  {
    id: "fuel",
    label: "Essence",
    icon: "water",
    color: "#45B7D1",
    description: "Livraison carburant",
  },
  {
    id: "towing",
    label: "Remorquage",
    icon: "construct",
    color: "#96CEB4",
    description: "Remorquage léger",
  },
  {
    id: "lockout",
    label: "Clés",
    icon: "key",
    color: "#FFEAA7",
    description: "Ouverture de porte",
  },
  {
    id: "diagnostic",
    label: "Diagnostic",
    icon: "medkit",
    color: "#DDA0DD",
    description: "Diagnostic rapide",
  },
];

export default function ServicesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { data, updateServices } = useOnboarding();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  const toggleService = (serviceId: string) => {
    const newServices = data.services.includes(serviceId)
      ? data.services.filter((id) => id !== serviceId)
      : [...data.services, serviceId];
    updateServices(newServices);
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "16.6%"],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Étape 1/6</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Barre de progression */}
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBar,
              { backgroundColor: "rgba(255,255,255,0.2)" },
            ]}
          >
            <Animated.View
              style={[
                styles.progressFill,
                { backgroundColor: "#fff", width: progressWidth },
              ]}
            />
          </View>
        </View>
      </LinearGradient>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Titre avec animation */}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            Vos services
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Sélectionnez les services que vous proposez
          </Text>
          <View
            style={[
              styles.selectionBadge,
              { backgroundColor: colors.primary + "15" },
            ]}
          >
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={colors.primary}
            />
            <Text style={[styles.selectionText, { color: colors.primary }]}>
              {data.services.length} service
              {data.services.length !== 1 ? "s" : ""} sélectionné
              {data.services.length !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        {/* Grille des services */}
        <View style={styles.servicesGrid}>
          {SERVICES.map((service, index) => {
            const isSelected = data.services.includes(service.id);
            const scaleAnim = useRef(new Animated.Value(1)).current;

            const handlePress = () => {
              Animated.sequence([
                Animated.spring(scaleAnim, {
                  toValue: 0.95,
                  friction: 3,
                  useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                  toValue: 1,
                  friction: 3,
                  useNativeDriver: true,
                }),
              ]).start();
              toggleService(service.id);
            };

            return (
              <Animated.View
                key={service.id}
                style={[
                  styles.serviceWrapper,
                  {
                    transform: [{ scale: scaleAnim }],
                    opacity: fadeAnim,
                  },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.serviceCard,
                    { borderColor: isSelected ? service.color : colors.border },
                    isSelected && { backgroundColor: service.color + "10" },
                  ]}
                  onPress={handlePress}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.serviceIcon,
                      { backgroundColor: service.color + "15" },
                    ]}
                  >
                    <Ionicons
                      name={service.icon}
                      size={28}
                      color={isSelected ? service.color : colors.textSecondary}
                    />
                  </View>
                  <Text
                    style={[
                      styles.serviceLabel,
                      { color: isSelected ? service.color : colors.text },
                    ]}
                  >
                    {service.label}
                  </Text>
                  <Text
                    style={[
                      styles.serviceDescription,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {service.description}
                  </Text>

                  {isSelected && (
                    <View
                      style={[
                        styles.selectedBadge,
                        { backgroundColor: service.color },
                      ]}
                    >
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </Animated.View>

      {/* Footer avec bouton suivant */}
      <Animated.View
        style={[
          styles.footer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.nextButton,
            { backgroundColor: colors.primary },
            data.services.length === 0 && styles.disabledButton,
          ]}
          onPress={() => router.push("/(onboarding)/zone")}
          disabled={data.services.length === 0}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.nextButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.nextButtonText}>Continuer</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        <Text style={[styles.hintText, { color: colors.textSecondary }]}>
          Vous pourrez modifier ces choix plus tard
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 15,
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
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  headerRight: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: 20,
  },
  progressBar: {
    height: 4,
    width: "100%",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  titleContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 12,
  },
  selectionBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  selectionText: {
    fontSize: 13,
    fontWeight: "500",
  },
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  serviceWrapper: {
    width: (width - 52) / 2,
  },
  serviceCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    position: "relative",
  },
  serviceIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  serviceLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 11,
    textAlign: "center",
  },
  selectedBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 10,
  },
  nextButton: {
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  nextButtonGradient: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  disabledButton: {
    opacity: 0.5,
  },
  hintText: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 12,
  },
});
