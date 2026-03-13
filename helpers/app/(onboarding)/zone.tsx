import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
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

const RADIUS_OPTIONS = [5, 10, 15, 20, 25, 30, 40, 50];

export default function ZoneScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { data, updateZone } = useOnboarding();

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

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["16.6%", "33.2%"],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Header fixe */}
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
          <Text style={styles.headerTitle}>Étape 2/6</Text>
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

      {/* Contenu scrollable */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Titre */}
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: colors.text }]}>
              Zone d'intervention
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Choisissez votre rayon d'action
            </Text>
          </View>

          {/* Rayon actuel (affichage) */}
          <View
            style={[styles.currentRadiusCard, { backgroundColor: colors.card }]}
          >
            <Ionicons name="radio" size={24} color={colors.primary} />
            <View style={styles.currentRadiusTexts}>
              <Text
                style={[
                  styles.currentRadiusLabel,
                  { color: colors.textSecondary },
                ]}
              >
                Rayon sélectionné
              </Text>
              <Text style={[styles.currentRadiusValue, { color: colors.text }]}>
                {data.radius || "20"} km
              </Text>
            </View>
          </View>

          {/* Sélecteur de rayon - 4 colonnes */}
          <View style={styles.radiusSection}>
            <Text
              style={[styles.sectionLabel, { color: colors.textSecondary }]}
            >
              Rayon d'action
            </Text>
            <View style={styles.radiusGrid}>
              {RADIUS_OPTIONS.map((value) => {
                const isSelected = data.radius === value.toString();

                return (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.radiusButton,
                      {
                        backgroundColor: isSelected
                          ? colors.primary
                          : colors.card,
                        borderColor: isSelected
                          ? colors.primary
                          : colors.border,
                      },
                    ]}
                    onPress={() => updateZone(value.toString(), data.address)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.radiusValue,
                        { color: isSelected ? "#fff" : colors.text },
                      ]}
                    >
                      {value}
                    </Text>
                    <Text
                      style={[
                        styles.radiusUnit,
                        { color: isSelected ? "#fff" : colors.textSecondary },
                      ]}
                    >
                      km
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Adresse */}
          <View style={styles.addressSection}>
            <View style={styles.addressHeader}>
              <Ionicons name="home-outline" size={20} color={colors.primary} />
              <Text style={[styles.addressTitle, { color: colors.text }]}>
                Adresse de base
              </Text>
              <Text
                style={[styles.optionalTag, { color: colors.textSecondary }]}
              >
                Optionnel
              </Text>
            </View>

            <View
              style={[
                styles.inputContainer,
                { borderColor: colors.border, backgroundColor: colors.card },
              ]}
            >
              <Ionicons
                name="location-outline"
                size={20}
                color={colors.primary}
              />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="123 rue Principale, Ottawa"
                placeholderTextColor={colors.placeholder}
                value={data.address}
                onChangeText={(text) => updateZone(data.radius, text)}
              />
            </View>
          </View>

          {/* Espace pour éviter que le bouton cache le contenu */}
          <View style={styles.bottomSpace} />
        </Animated.View>
      </ScrollView>

      {/* Footer fixe avec bouton */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.nextButton, !data.radius && styles.disabledButton]}
          onPress={() => router.push("/(onboarding)/pricing")}
          disabled={!data.radius}
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
      </View>
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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  titleContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
  },
  currentRadiusCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    marginBottom: 24,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  currentRadiusTexts: {
    flex: 1,
  },
  currentRadiusLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  currentRadiusValue: {
    fontSize: 20,
    fontWeight: "600",
  },
  radiusSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 12,
  },
  radiusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  radiusButton: {
    width: (width - 64) / 4,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  radiusValue: {
    fontSize: 18,
    fontWeight: "600",
  },
  radiusUnit: {
    fontSize: 11,
  },
  addressSection: {
    marginBottom: 20,
  },
  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  optionalTag: {
    fontSize: 12,
    marginLeft: "auto",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    gap: 10,
    height: 56,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 15,
  },
  bottomSpace: {
    height: 30,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
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
});
