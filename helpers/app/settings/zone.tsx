// helpers/app/settings/zone.tsx
// Écran de zone d'intervention - Rayon et adresse

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  StatusBar,
  Animated,
  Modal,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../config/api";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import Toast from "react-native-toast-message";

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

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function ZoneSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme ?? "light"];

  // États
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [radius, setRadius] = useState("20");
  const [address, setAddress] = useState("");
  const [coordinates, setCoordinates] = useState<[number, number]>([
    -75.6919, 45.4215,
  ]);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [citySelectorVisible, setCitySelectorVisible] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const itemsAnim = useRef([1, 2, 3].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    loadZone();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    itemsAnim.forEach((anim, index) => {
      Animated.spring(anim, {
        toValue: 1,
        delay: 200 + index * 100,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  // ============================================
  // CHARGEMENT DE LA ZONE
  // ============================================

  const loadZone = async () => {
    try {
      const response = await api.get("/helpers/profile/me");
      const profile = response.data.data;

      const serviceArea = profile.serviceArea || {};
      const rad = serviceArea.radius || 20;
      const addr = profile.address || serviceArea.address || "";
      const coords = serviceArea.coordinates || [-75.6919, 45.4215];

      setRadius(rad.toString());
      setAddress(addr);
      setCoordinates(coords);

      // Déterminer la ville sélectionnée
      const city = CITIES.find(
        (c) =>
          Math.abs(c.coordinates[0] - coords[0]) < 0.01 &&
          Math.abs(c.coordinates[1] - coords[1]) < 0.01
      );
      if (city) {
        setSelectedCity(city.id);
      }
    } catch (error) {
      console.error("Erreur chargement zone:", error);
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Impossible de charger votre zone d'intervention",
        position: "bottom",
      });
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // SAUVEGARDE
  // ============================================

  const saveZone = async () => {
    if (saving) return;
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Déterminer les coordonnées finales
      let finalCoordinates = coordinates;
      let finalAddress = address;

      if (selectedCity) {
        const city = CITIES.find((c) => c.id === selectedCity);
        if (city) {
          finalCoordinates = city.coordinates;
          if (!finalAddress) {
            finalAddress = city.address;
          }
        }
      }

      // Mettre à jour la zone d'intervention
      await api.put("/helpers/profile/me", {
        serviceArea: {
          type: "Point",
          coordinates: finalCoordinates,
          radius: parseInt(radius) || 20,
          address: finalAddress,
        },
        address: finalAddress,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: "success",
        text1: "Zone mise à jour",
        text2: `Rayon: ${radius} km - ${finalAddress || "Position définie"}`,
        position: "bottom",
        visibilityTime: 2000,
      });
    } catch (error: any) {
      console.error("Erreur sauvegarde zone:", error);
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: error.response?.data?.message || "Impossible de sauvegarder",
        position: "bottom",
      });
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // GÉOLOCALISATION
  // ============================================

  const getCurrentLocation = async () => {
    setGettingLocation(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Toast.show({
          type: "error",
          text1: "Permission refusée",
          text2: "Activez la localisation pour utiliser cette fonction",
          position: "bottom",
        });
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = loc.coords;
      setCoordinates([longitude, latitude]);

      // Reverse geocoding pour obtenir l'adresse
      const addressResult = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addressResult[0]) {
        const addr = addressResult[0];
        const formattedAddress = `${addr.street || ""} ${addr.city || ""} ${
          addr.region || ""
        }`.trim();
        setAddress(formattedAddress);
      }

      // Vérifier si la position correspond à une ville prédéfinie
      const matchedCity = CITIES.find(
        (c) =>
          Math.abs(c.coordinates[0] - longitude) < 0.1 &&
          Math.abs(c.coordinates[1] - latitude) < 0.1
      );
      if (matchedCity) {
        setSelectedCity(matchedCity.id);
      } else {
        setSelectedCity(null);
      }

      Toast.show({
        type: "success",
        text1: "Position obtenue",
        text2: "Votre position actuelle a été définie",
        position: "bottom",
        visibilityTime: 1500,
      });
    } catch (error) {
      console.error("Erreur géolocalisation:", error);
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Impossible d'obtenir votre position",
        position: "bottom",
      });
    } finally {
      setGettingLocation(false);
    }
  };

  // ============================================
  // RENDU DU SÉLECTEUR DE VILLE
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
            backgroundColor: colors.surface,
            borderColor: selectedCity ? colors.primary : colors.border,
          },
        ]}
        onPress={() => setCitySelectorVisible(!citySelectorVisible)}
        activeOpacity={0.7}
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
        <View style={[styles.cityList, { backgroundColor: colors.surface }]}>
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
                setCoordinates(city.coordinates);
                setAddress(city.address);
                setCitySelectorVisible(false);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

  // ============================================
  // RENDU
  // ============================================

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.loadingLogo}
          >
            <Ionicons name="location" size={40} color="#fff" />
          </LinearGradient>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Chargement...
          </Text>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Zone d'intervention</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        {/* Sélecteur de ville */}
        <Animated.View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.surface },
            { transform: [{ scale: itemsAnim[0] }], opacity: itemsAnim[0] },
          ]}
        >
          {renderCitySelector()}
        </Animated.View>

        {/* Rayon d'action */}
        <Animated.View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.surface },
            { transform: [{ scale: itemsAnim[1] }], opacity: itemsAnim[1] },
          ]}
        >
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Rayon d'action (km)
          </Text>

          <View style={styles.radiusContainer}>
            {RADIUS_OPTIONS.map((r) => {
              const isSelected = parseInt(radius) === r;
              return (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.radiusButton,
                    isSelected && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setRadius(r.toString());
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.radiusText,
                      {
                        color: isSelected ? "#fff" : colors.text,
                        fontWeight: isSelected ? "600" : "500",
                      },
                    ]}
                  >
                    {r} km
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        {/* Adresse et position */}
        <Animated.View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.surface },
            { transform: [{ scale: itemsAnim[2] }], opacity: itemsAnim[2] },
          ]}
        >
          <View style={styles.addressHeader}>
            <Ionicons name="home-outline" size={20} color={colors.primary} />
            <Text style={[styles.addressTitle, { color: colors.text }]}>
              Adresse précise
            </Text>
            <Text style={[styles.optionalTag, { color: colors.textSecondary }]}>
              Optionnel
            </Text>
          </View>

          <View
            style={[
              styles.inputContainer,
              {
                borderColor: colors.border,
                backgroundColor: colors.background,
              },
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
              value={address}
              onChangeText={setAddress}
            />
          </View>

          <TouchableOpacity
            style={[styles.locationButton, { borderColor: colors.border }]}
            onPress={getCurrentLocation}
            disabled={gettingLocation}
            activeOpacity={0.7}
          >
            {gettingLocation ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Ionicons
                  name="navigate-outline"
                  size={18}
                  color={colors.primary}
                />
                <Text
                  style={[styles.locationButtonText, { color: colors.primary }]}
                >
                  Utiliser ma position actuelle
                </Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={[styles.inputHint, { color: colors.textSecondary }]}>
            <Ionicons name="information-circle-outline" size={12} /> Cette
            adresse sera utilisée comme point de départ pour vos interventions
          </Text>
        </Animated.View>

        {/* Carte résumé */}
        <Animated.View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.surface },
            { transform: [{ scale: itemsAnim[2] }], opacity: itemsAnim[2] },
          ]}
        >
          <LinearGradient
            colors={[colors.primary + "10", colors.secondary + "05"]}
            style={styles.summaryGradient}
          >
            <View style={styles.summaryHeader}>
              <Ionicons name="location" size={20} color={colors.primary} />
              <Text style={[styles.summaryTitle, { color: colors.text }]}>
                Résumé
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text
                  style={[styles.summaryLabel, { color: colors.textSecondary }]}
                >
                  Ville
                </Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {selectedCity
                    ? CITIES.find((c) => c.id === selectedCity)?.name
                    : "Non définie"}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text
                  style={[styles.summaryLabel, { color: colors.textSecondary }]}
                >
                  Rayon
                </Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {radius} km
                </Text>
              </View>
            </View>

            {address ? (
              <View style={styles.summaryAddress}>
                <Ionicons
                  name="home-outline"
                  size={14}
                  color={colors.primary}
                />
                <Text
                  style={[
                    styles.summaryAddressText,
                    { color: colors.textSecondary },
                  ]}
                  numberOfLines={2}
                >
                  {address}
                </Text>
              </View>
            ) : null}

            <View style={styles.summaryNote}>
              <Ionicons name="radio" size={12} color={colors.primary} />
              <Text
                style={[
                  styles.summaryNoteText,
                  { color: colors.textSecondary },
                ]}
              >
                Zone d'intervention: {radius} km autour de{" "}
                {selectedCity
                  ? CITIES.find((c) => c.id === selectedCity)?.name
                  : "votre position"}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Bouton de sauvegarde */}
        <Animated.View
          style={[
            styles.saveButtonContainer,
            { transform: [{ scale: itemsAnim[2] }], opacity: itemsAnim[2] },
          ]}
        >
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={saveZone}
            disabled={saving}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.saveButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Enregistrer</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.bottomSpace} />
      </Animated.ScrollView>

      <Toast />
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  loadingLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
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
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  sectionCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 12,
  },
  citySection: {
    gap: 8,
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
  radiusContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  radiusButton: {
    width: (width - 64) / 4,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  radiusText: {
    fontSize: 14,
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
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    marginTop: 12,
    borderRadius: 25,
    borderWidth: 1,
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  inputHint: {
    fontSize: 11,
    marginTop: 8,
    marginLeft: 4,
  },
  summaryCard: {
    borderRadius: 24,
    marginBottom: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryGradient: {
    padding: 20,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: "center",
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "600",
  },
  summaryDivider: {
    width: 1,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  summaryAddress: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    marginBottom: 12,
  },
  summaryAddressText: {
    flex: 1,
    fontSize: 13,
  },
  summaryNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  summaryNoteText: {
    fontSize: 12,
    flex: 1,
  },
  saveButtonContainer: {
    marginTop: 8,
    marginBottom: 20,
  },
  saveButton: {
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 8,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomSpace: {
    height: 20,
  },
});
