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

// ============================================
// CONSTANTES
// ============================================
const RADIUS_OPTIONS = [5, 10, 15, 20, 25, 30, 40, 50];

const CITIES = [
  {
    id: "ottawa",
    name: "Ottawa",
    coordinates: [-75.6919, 45.4215],
    address: "Ottawa, ON",
  },
  {
    id: "gatineau",
    name: "Gatineau",
    coordinates: [-75.7122, 45.4764],
    address: "Gatineau, QC",
  },
];

export default function ZoneScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { data, updateZone } = useOnboarding();

  // ============================================
  // FONCTION POUR EXTRAIRE LE RAYON (sécurisée)
  // ============================================
  const getRadiusValue = () => {
    if (!data.radius) return "20";

    // Si data.radius est un objet (nouveau format)
    if (typeof data.radius === "object" && data.radius !== null) {
      return data.radius.radius || "20";
    }

    // Si data.radius est une string (ancien format)
    return data.radius;
  };

  // ============================================
  // FONCTION POUR EXTRAIRE LA VILLE
  // ============================================
  const getCityId = () => {
    if (!data.city) return null;
    return data.city;
  };

  // ============================================
  // ÉTATS LOCAUX
  // ============================================
  const [selectedCity, setSelectedCity] = useState<string | null>(getCityId());
  const [citySelectorVisible, setCitySelectorVisible] = useState(false);
  const [customAddress, setCustomAddress] = useState(data.address || "");
  const [radius, setRadius] = useState(getRadiusValue());

  // ============================================
  // ANIMATIONS
  // ============================================
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

  // ============================================
  // METTRE À JOUR LE CONTEXTE
  // ============================================
  const handleUpdateZone = () => {
    if (!selectedCity) {
      // Si pas de ville sélectionnée, utiliser les coordonnées par défaut (Ottawa)
      const defaultCity = CITIES[0];
      updateZone({
        radius: radius,
        address: customAddress || defaultCity.address,
        city: defaultCity.id,
        coordinates: defaultCity.coordinates,
      });
    } else {
      const city = CITIES.find((c) => c.id === selectedCity);
      updateZone({
        radius: radius,
        address: customAddress || city?.address || "",
        city: selectedCity,
        coordinates: city?.coordinates || CITIES[0].coordinates,
      });
    }
  };

  const handleNext = () => {
    handleUpdateZone();
    router.push("/(onboarding)/pricing");
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["16.6%", "33.2%"],
  });

  // ============================================
  // RENDER DU SÉLECTEUR DE VILLE
  // ============================================
  const renderCitySelector = () => (
    <View style={styles.citySection}>
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
        Ville d'intervention *
      </Text>

      <TouchableOpacity
        style={[
          styles.citySelector,
          {
            backgroundColor: colors.card,
            borderColor: selectedCity ? colors.primary : colors.border,
          },
        ]}
        onPress={() => setCitySelectorVisible(!citySelectorVisible)}
      >
        <View style={styles.citySelectorContent}>
          <Ionicons
            name="business"
            size={20}
            color={selectedCity ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.citySelectorText,
              { color: selectedCity ? colors.primary : colors.textSecondary },
            ]}
          >
            {selectedCity
              ? CITIES.find((c) => c.id === selectedCity)?.name
              : "Choisissez votre ville"}
          </Text>
        </View>
        <Ionicons
          name={citySelectorVisible ? "chevron-up" : "chevron-down"}
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {citySelectorVisible && (
        <View style={[styles.cityList, { backgroundColor: colors.card }]}>
          {CITIES.map((city) => (
            <TouchableOpacity
              key={city.id}
              style={[
                styles.cityItem,
                selectedCity === city.id && {
                  backgroundColor: colors.primary + "10",
                },
              ]}
              onPress={() => {
                setSelectedCity(city.id);
                setCitySelectorVisible(false);
                if (!customAddress) {
                  setCustomAddress(city.address);
                }
              }}
            >
              <Ionicons
                name="location"
                size={20}
                color={
                  selectedCity === city.id
                    ? colors.primary
                    : colors.textSecondary
                }
              />
              <View style={styles.cityItemInfo}>
                <Text
                  style={[
                    styles.cityItemName,
                    {
                      color:
                        selectedCity === city.id ? colors.primary : colors.text,
                    },
                  ]}
                >
                  {city.name}
                </Text>
                <Text
                  style={[
                    styles.cityItemAddress,
                    { color: colors.textSecondary },
                  ]}
                >
                  {city.address}
                </Text>
              </View>
              {selectedCity === city.id && (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={colors.primary}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

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
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: colors.text }]}>
              Zone d'intervention
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Choisissez votre ville et rayon d'action
            </Text>
          </View>

          {/* Sélecteur de ville */}
          {renderCitySelector()}

          {/* Rayon actuel */}
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
              {/* ⚡ CORRECTION ICI : utiliser radius (state local) au lieu de data.radius */}
              <Text style={[styles.currentRadiusValue, { color: colors.text }]}>
                {radius} km
              </Text>
            </View>
          </View>

          {/* Sélecteur de rayon */}
          <View style={styles.radiusSection}>
            <Text
              style={[styles.sectionLabel, { color: colors.textSecondary }]}
            >
              Rayon d'action
            </Text>
            <View style={styles.radiusGrid}>
              {RADIUS_OPTIONS.map((value) => {
                const isSelected = radius === value.toString();

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
                    onPress={() => setRadius(value.toString())}
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
                Adresse précise
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
                value={customAddress}
                onChangeText={setCustomAddress}
              />
            </View>
          </View>

          <View style={styles.bottomSpace} />
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            (!selectedCity || !radius) && styles.disabledButton,
          ]}
          onPress={handleNext}
          disabled={!selectedCity || !radius}
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

// ============================================
// STYLES
// ============================================
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
  citySection: {
    marginBottom: 24,
  },
  citySelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 56,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  citySelectorContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  citySelectorText: {
    fontSize: 15,
  },
  cityList: {
    marginTop: 8,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  cityItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  cityItemInfo: {
    flex: 1,
  },
  cityItemName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  cityItemAddress: {
    fontSize: 12,
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
