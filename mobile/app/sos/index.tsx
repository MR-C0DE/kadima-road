import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Linking,
  Dimensions,
  Animated,
  Easing,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { api } from "../../config/api";
import { useAuth } from "../../contexts/AuthContext";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";

const { width, height } = Dimensions.get("window");

// Liste des cas SOS prédéfinis avec couleurs
const SOS_CASES = [
  {
    id: "accident",
    label: "Accident",
    icon: "car",
    description: "Accident de la route",
    gradient: ["#E63946", "#B71C1C"],
  },
  {
    id: "battery",
    label: "Batterie",
    icon: "battery-dead",
    description: "Batterie à plat",
    gradient: ["#D4AF37", "#B8860B"],
  },
  {
    id: "tire",
    label: "Pneu crevé",
    icon: "car-sport",
    description: "Changement de roue",
    gradient: ["#800020", "#4A0010"],
  },
  {
    id: "fuel",
    label: "Panne essence",
    icon: "water",
    description: "Plus de carburant",
    gradient: ["#2C2C2C", "#1A1A1A"],
  },
  {
    id: "engine",
    label: "Panne moteur",
    icon: "cog",
    description: "Moteur qui ne démarre pas",
    gradient: ["#E63946", "#B71C1C"],
  },
  {
    id: "lockout",
    label: "Clé enfermée",
    icon: "key",
    description: "Clés à l'intérieur",
    gradient: ["#D4AF37", "#B8860B"],
  },
  {
    id: "towing",
    label: "Remorquage",
    icon: "trailer",
    description: "Besoin d'une dépanneuse",
    gradient: ["#800020", "#4A0010"],
  },
  {
    id: "other",
    label: "Autre",
    icon: "help-circle",
    description: "Problème non listé",
    gradient: ["#2C2C2C", "#1A1A1A"],
  },
];

export default function SOSScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState("");
  const [selectedCase, setSelectedCase] = useState(null);
  const [customProblem, setCustomProblem] = useState("");
  const [step, setStep] = useState(1);

  useEffect(() => {
    // Animations d'entrée
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Animation de pulsation pour le bouton 911
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
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

    getLocation();
  }, []);

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission refusée",
          "La géolocalisation est nécessaire pour les alertes SOS"
        );
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation({
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      });

      const addressResult = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (addressResult[0]) {
        const addr = addressResult[0];
        setAddress(
          `${addr.street || ""} ${addr.city || ""} ${addr.region || ""}`.trim()
        );
      }

      setStep(2);
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'obtenir votre position");
    }
  };

  const handleSendSOS = async () => {
    if (!selectedCase) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert("Erreur", "Veuillez sélectionner un type de problème");
      return;
    }

    if (selectedCase === "other" && !customProblem.trim()) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert("Erreur", "Veuillez décrire le problème");
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setLoading(true);
    try {
      const problemDescription =
        selectedCase === "other"
          ? customProblem
          : SOS_CASES.find((c) => c.id === selectedCase)?.description;

      await api.post("/sos", {
        location: {
          coordinates: [location.lng, location.lat],
          address: address,
        },
        problem: {
          description: problemDescription,
          category: selectedCase,
          severity: "critical",
        },
      });

      Alert.alert(
        "SOS Envoyé",
        "Un helper va vous contacter dans quelques minutes.",
        [
          {
            text: "OK",
            onPress: () => router.push("/(tabs)"),
          },
        ]
      );
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'envoyer l'alerte SOS");
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyCall = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    Alert.alert("Appeler les secours", "Voulez-vous appeler le 911 ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Appeler",
        onPress: () => Linking.openURL("tel:911"),
        style: "destructive",
      },
    ]);
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Fond avec dégradé */}
      <LinearGradient
        colors={
          colorScheme === "dark"
            ? ["rgba(230,57,70,0.05)", "rgba(128,0,32,0.05)"]
            : ["rgba(230,57,70,0.02)", "rgba(128,0,32,0.02)"]
        }
        style={StyleSheet.absoluteFill}
      />

      {/* Cercles décoratifs */}
      <Animated.View
        style={[
          styles.decorativeCircle,
          styles.circle1,
          {
            backgroundColor: colors.tint + "10",
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

      {/* Header avec retour */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={[styles.backButton, { borderColor: colors.border }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            SOS Urgence
          </Text>
          <Text
            style={[styles.headerSubtitle, { color: colors.textSecondary }]}
          >
            Assistance immédiate
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
            },
          ]}
        >
          {/* Bouton appel d'urgence */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={styles.emergencyCallContainer}
              onPress={handleEmergencyCall}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#2C2C2C", "#1A1A1A"]}
                style={styles.emergencyCallGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.emergencyCallContent}>
                  <Ionicons name="call" size={32} color="#fff" />
                  <View style={styles.emergencyCallTexts}>
                    <Text style={styles.emergencyCallTitle}>
                      Appeler le 911
                    </Text>
                    <Text style={styles.emergencyCallSubtitle}>
                      Secours d'urgence
                    </Text>
                  </View>
                  <View style={styles.emergencyBadge}>
                    <Text style={styles.emergencyBadgeText}>24/7</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Étape 1: Localisation */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.stepText, { color: colors.textSecondary }]}>
                Recherche de votre position...
              </Text>
              <Text
                style={[styles.stepSubtext, { color: colors.textSecondary }]}
              >
                Veuillez activer votre GPS
              </Text>
            </View>
          )}

          {/* Étape 2: Choix du cas */}
          {step === 2 && (
            <View style={styles.casesContainer}>
              <View style={styles.locationInfo}>
                <Ionicons name="location" size={20} color={colors.primary} />
                <Text
                  style={[styles.locationText, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {address || "Position obtenue"}
                </Text>
              </View>

              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Que s'est-il passé ?
              </Text>

              <View style={styles.casesGrid}>
                {SOS_CASES.map((caseItem, index) => (
                  <Animated.View
                    key={caseItem.id}
                    style={[
                      styles.caseWrapper,
                      {
                        opacity: fadeAnim,
                        transform: [
                          {
                            translateY: slideAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, 30 * (index + 1)],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={[
                        styles.caseButton,
                        selectedCase === caseItem.id &&
                          styles.caseButtonSelected,
                      ]}
                      onPress={() => {
                        if (Platform.OS !== "web") {
                          Haptics.impactAsync(
                            Haptics.ImpactFeedbackStyle.Light
                          );
                        }
                        setSelectedCase(caseItem.id);
                      }}
                      activeOpacity={0.7}
                    >
                      <LinearGradient
                        colors={
                          selectedCase === caseItem.id
                            ? caseItem.gradient
                            : ["transparent", "transparent"]
                        }
                        style={[
                          styles.caseGradient,
                          !selectedCase === caseItem.id && {
                            borderWidth: 1,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <Ionicons
                          name={caseItem.icon}
                          size={32}
                          color={
                            selectedCase === caseItem.id
                              ? "#fff"
                              : colors.primary
                          }
                        />
                        <Text
                          style={[
                            styles.caseLabel,
                            {
                              color:
                                selectedCase === caseItem.id
                                  ? "#fff"
                                  : colors.text,
                            },
                          ]}
                        >
                          {caseItem.label}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>

              {/* Champ pour "Autre" */}
              {selectedCase === "other" && (
                <Animated.View
                  style={[
                    styles.otherContainer,
                    {
                      opacity: fadeAnim,
                      transform: [{ scale: scaleAnim }],
                    },
                  ]}
                >
                  <Text style={[styles.label, { color: colors.text }]}>
                    Décrivez le problème
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                    placeholder="Ex: Bruit bizarre, fumée, etc."
                    placeholderTextColor={colors.placeholder}
                    multiline
                    numberOfLines={4}
                    value={customProblem}
                    onChangeText={setCustomProblem}
                    textAlignVertical="top"
                  />
                </Animated.View>
              )}

              {/* Boutons d'action */}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.cancelButton, { borderColor: colors.border }]}
                  onPress={() => router.back()}
                >
                  <Text
                    style={[
                      styles.cancelButtonText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Annuler
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    !selectedCase && styles.sendButtonDisabled,
                  ]}
                  onPress={handleSendSOS}
                  disabled={loading || !selectedCase}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={
                      selectedCase
                        ? SOS_CASES.find((c) => c.id === selectedCase)
                            ?.gradient || [colors.primary, colors.secondary]
                        : [colors.disabled, colors.disabled]
                    }
                    style={styles.sendButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="send" size={20} color="#fff" />
                        <Text style={styles.sendButtonText}>Envoyer SOS</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Blur overlay pour le chargement */}
      {loading && (
        <BlurView
          intensity={80}
          tint={colorScheme}
          style={styles.loadingOverlay}
        >
          <View
            style={[styles.loadingCard, { backgroundColor: colors.surface }]}
          >
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Envoi de l'alerte...
            </Text>
          </View>
        </BlurView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 12,
    textAlign: "center",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emergencyCallContainer: {
    marginBottom: 30,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  emergencyCallGradient: {
    padding: 16,
  },
  emergencyCallContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  emergencyCallTexts: {
    flex: 1,
  },
  emergencyCallTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  emergencyCallSubtitle: {
    color: "#fff",
    fontSize: 12,
    opacity: 0.8,
    marginTop: 2,
  },
  emergencyBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  emergencyBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  stepContainer: {
    padding: 40,
    alignItems: "center",
  },
  stepText: {
    fontSize: 16,
    marginTop: 20,
  },
  stepSubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  casesContainer: {
    flex: 1,
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.03)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  casesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  caseWrapper: {
    width: "48%",
    marginBottom: 12,
  },
  caseButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  caseButtonSelected: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  caseGradient: {
    padding: 16,
    alignItems: "center",
    borderRadius: 16,
  },
  caseLabel: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  otherContainer: {
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  input: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 120,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  sendButton: {
    flex: 2,
    borderRadius: 16,
    overflow: "hidden",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingCard: {
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "500",
  },
});
