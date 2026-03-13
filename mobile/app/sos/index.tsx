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
  AppState,
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
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

const { width, height } = Dimensions.get("window");

// Types pour l'alerte SOS
interface SOSAlert {
  _id: string;
  status: "active" | "dispatched" | "resolved" | "cancelled";
  location: {
    coordinates: [number, number];
    address: string;
  };
  problem: {
    description: string;
    category: string;
    severity: string;
  };
  notifications: {
    nearbyHelpers: Array<{
      helper: {
        _id: string;
        user: {
          firstName: string;
          lastName: string;
          phone: string;
        };
        distance: number;
        eta?: number;
      };
      distance: number;
      responded: boolean;
      responseTime?: number;
    }>;
  };
  intervention?: {
    _id: string;
    helper: {
      _id: string;
      user: {
        firstName: string;
        lastName: string;
        phone: string;
        photo?: string;
      };
    };
    status: string;
    eta?: number;
  };
  createdAt: string;
}

const SOS_CASES = [
  {
    id: "accident",
    label: "Accident",
    icon: "car",
    description: "Accident de la route",
    gradient: ["#E63946", "#B71C1C"],
    severity: "critical",
  },
  {
    id: "battery",
    label: "Batterie",
    icon: "battery-dead",
    description: "Batterie à plat",
    gradient: ["#D4AF37", "#B8860B"],
    severity: "medium",
  },
  {
    id: "tire",
    label: "Pneu crevé",
    icon: "car-sport",
    description: "Changement de roue",
    gradient: ["#800020", "#4A0010"],
    severity: "medium",
  },
  {
    id: "fuel",
    label: "Panne essence",
    icon: "water",
    description: "Plus de carburant",
    gradient: ["#2C2C2C", "#1A1A1A"],
    severity: "low",
  },
  {
    id: "engine",
    label: "Panne moteur",
    icon: "cog",
    description: "Moteur qui ne démarre pas",
    gradient: ["#E63946", "#B71C1C"],
    severity: "high",
  },
  {
    id: "lockout",
    label: "Clé enfermée",
    icon: "key",
    description: "Clés à l'intérieur",
    gradient: ["#D4AF37", "#B8860B"],
    severity: "low",
  },
  {
    id: "towing",
    label: "Remorquage",
    icon: "trailer",
    description: "Besoin d'une dépanneuse",
    gradient: ["#800020", "#4A0010"],
    severity: "high",
  },
  {
    id: "other",
    label: "Autre",
    icon: "help-circle",
    description: "Problème non listé",
    gradient: ["#2C2C2C", "#1A1A1A"],
    severity: "medium",
  },
];

export default function SOSScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // États principaux
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [address, setAddress] = useState("");
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [customProblem, setCustomProblem] = useState("");
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: localisation, 2: choix, 3: recherche, 4: suivi

  // États pour le suivi de l'alerte
  const [currentAlert, setCurrentAlert] = useState<SOSAlert | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
    null
  );
  const [nearbyHelpersCount, setNearbyHelpersCount] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Timer pour le temps écoulé
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

    // Animation de pulsation
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

    // Cleanup à la fin
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Effet pour le polling quand une alerte est active
  useEffect(() => {
    if (step === 3 && currentAlert) {
      // Commencer le polling
      const interval = setInterval(() => {
        checkAlertStatus(currentAlert._id);
      }, 3000); // Vérifier toutes les 3 secondes
      setPollingInterval(interval);

      // Démarrer le timer
      timerRef.current = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);

      return () => {
        clearInterval(interval);
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [step, currentAlert]);

  // ============================================
  // FONCTIONS DE LOCALISATION
  // ============================================

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission refusée",
          "La géolocalisation est nécessaire pour les alertes SOS",
          [
            { text: "Annuler", onPress: () => router.back() },
            { text: "Réessayer", onPress: getLocation },
          ]
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

      // Obtenir l'adresse
      const addressResult = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (addressResult[0]) {
        const addr = addressResult[0];
        setAddress(
          `${addr.street || ""} ${addr.city || ""} ${
            addr.region || ""
          }`.trim() || "Position obtenue"
        );
      }

      setStep(2);
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'obtenir votre position");
    }
  };

  // ============================================
  // FONCTIONS DE L'ALERTE SOS
  // ============================================

  const handleSendSOS = async () => {
    if (!selectedCase) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Erreur", "Veuillez sélectionner un type de problème");
      return;
    }

    if (selectedCase === "other" && !customProblem.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Erreur", "Veuillez décrire le problème");
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLoading(true);

    try {
      const selectedCaseData = SOS_CASES.find((c) => c.id === selectedCase);
      const problemDescription =
        selectedCase === "other"
          ? customProblem
          : selectedCaseData?.description || "";

      // 1. Créer l'alerte SOS
      const response = await api.post("/sos", {
        location: {
          coordinates: [location!.lng, location!.lat],
          address: address,
        },
        problem: {
          description: problemDescription,
          category: selectedCase,
          severity: selectedCaseData?.severity || "medium",
        },
        vehicle: user?.vehicles?.[0] || {}, // Véhicule par défaut
      });

      const alertData = response.data.data.sosAlert;
      setCurrentAlert(alertData);
      setNearbyHelpersCount(
        alertData.notifications?.nearbyHelpers?.length || 0
      );

      // 2. Passer à l'étape de recherche
      setStep(3);
    } catch (error: any) {
      console.error("Erreur envoi SOS:", error);
      Alert.alert(
        "Erreur",
        error.response?.data?.message || "Impossible d'envoyer l'alerte SOS"
      );
    } finally {
      setLoading(false);
    }
  };

  const checkAlertStatus = async (alertId: string) => {
    try {
      const response = await api.get(`/sos/${alertId}`);
      const alert = response.data.data;

      setCurrentAlert(alert);

      // Si un helper a accepté
      if (alert.status === "dispatched" && alert.intervention) {
        setStep(4); // Passer à l'étape de suivi
        if (pollingInterval) clearInterval(pollingInterval);
        if (timerRef.current) clearInterval(timerRef.current);

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Notification
        Alert.alert(
          "✅ Helper trouvé !",
          `${alert.intervention.helper.user.firstName} ${alert.intervention.helper.user.lastName} a accepté votre demande et arrive.`,
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Erreur vérification statut:", error);
    }
  };

  const cancelSOS = async () => {
    if (!currentAlert) {
      router.back();
      return;
    }

    Alert.alert(
      "Annuler l'alerte",
      "Voulez-vous vraiment annuler cette alerte SOS ?",
      [
        { text: "Non", style: "cancel" },
        {
          text: "Oui, annuler",
          style: "destructive",
          onPress: async () => {
            try {
              await api.put(`/sos/${currentAlert._id}/cancel`);
              if (pollingInterval) clearInterval(pollingInterval);
              if (timerRef.current) clearInterval(timerRef.current);
              router.back();
            } catch (error) {
              Alert.alert("Erreur", "Impossible d'annuler l'alerte");
            }
          },
        },
      ]
    );
  };

  const handleEmergencyCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert("Appeler les secours", "Voulez-vous appeler le 911 ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Appeler",
        onPress: () => Linking.openURL("tel:911"),
        style: "destructive",
      },
    ]);
  };

  const contactHelper = () => {
    if (currentAlert?.intervention?.helper?.user?.phone) {
      Linking.openURL(`tel:${currentAlert.intervention.helper.user.phone}`);
    }
  };

  // ============================================
  // FONCTIONS DE FORMATAGE
  // ============================================

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // ============================================
  // RENDER DES ÉTAPES
  // ============================================

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.stepText, { color: colors.textSecondary }]}>
        Recherche de votre position...
      </Text>
      <Text style={[styles.stepSubtext, { color: colors.textSecondary }]}>
        Veuillez activer votre GPS
      </Text>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.casesContainer}>
      <View style={[styles.locationInfo, { backgroundColor: colors.surface }]}>
        <Ionicons name="location" size={20} color={colors.primary} />
        <Text
          style={[styles.locationText, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {address}
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
                selectedCase === caseItem.id && styles.caseButtonSelected,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
                  selectedCase !== caseItem.id && {
                    borderWidth: 1,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons
                  name={caseItem.icon}
                  size={32}
                  color={selectedCase === caseItem.id ? "#fff" : colors.primary}
                />
                <Text
                  style={[
                    styles.caseLabel,
                    {
                      color:
                        selectedCase === caseItem.id ? "#fff" : colors.text,
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

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.cancelButton, { borderColor: colors.border }]}
          onPress={() => router.back()}
        >
          <Text
            style={[styles.cancelButtonText, { color: colors.textSecondary }]}
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
                ? SOS_CASES.find((c) => c.id === selectedCase)?.gradient || [
                    colors.primary,
                    colors.secondary,
                  ]
                : [colors.disabled, colors.disabled]
            }
            style={styles.sendButtonGradient}
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
  );

  const renderStep3 = () => {
    // Animation de la barre de progression
    const progress = progressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ["0%", "100%"],
    });

    return (
      <View style={styles.searchContainer}>
        <View style={[styles.searchCard, { backgroundColor: colors.surface }]}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.searchIconContainer}
            >
              <Ionicons name="search" size={40} color="#fff" />
            </LinearGradient>
          </Animated.View>

          <Text style={[styles.searchTitle, { color: colors.text }]}>
            Recherche d'un helper
          </Text>

          <Text
            style={[styles.searchSubtitle, { color: colors.textSecondary }]}
          >
            {nearbyHelpersCount} helper{nearbyHelpersCount > 1 ? "s" : ""} à
            proximité
          </Text>

          <View style={styles.timerContainer}>
            <Ionicons name="time-outline" size={24} color={colors.primary} />
            <Text style={[styles.timerText, { color: colors.text }]}>
              {formatTime(timeElapsed)}
            </Text>
          </View>

          <View
            style={[
              styles.progressBarContainer,
              { backgroundColor: colors.border },
            ]}
          >
            <Animated.View
              style={[
                styles.progressBar,
                {
                  backgroundColor: colors.primary,
                  width: progress,
                },
              ]}
            />
          </View>

          <Text style={[styles.searchHint, { color: colors.textSecondary }]}>
            Nous recherchons le helper le plus proche...
          </Text>

          <TouchableOpacity
            style={[styles.cancelSearchButton, { borderColor: colors.border }]}
            onPress={cancelSOS}
          >
            <Text style={[styles.cancelSearchText, { color: colors.error }]}>
              Annuler la recherche
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderStep4 = () => {
    if (!currentAlert?.intervention) return null;

    const helper = currentAlert.intervention.helper;
    const eta = currentAlert.intervention.eta || 15;

    return (
      <View style={styles.trackingContainer}>
        <View
          style={[styles.trackingCard, { backgroundColor: colors.surface }]}
        >
          <View style={styles.helperHeader}>
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.helperAvatar}
            >
              <Text style={styles.helperAvatarText}>
                {helper.user.firstName[0]}
                {helper.user.lastName[0]}
              </Text>
            </LinearGradient>
            <View style={styles.helperInfo}>
              <Text style={[styles.helperName, { color: colors.text }]}>
                {helper.user.firstName} {helper.user.lastName}
              </Text>
              <Text style={[styles.helperStatus, { color: colors.success }]}>
                En route vers vous
              </Text>
            </View>
          </View>

          <View style={styles.etaContainer}>
            <Ionicons name="car" size={24} color={colors.primary} />
            <View style={styles.etaInfo}>
              <Text style={[styles.etaLabel, { color: colors.textSecondary }]}>
                Arrivée estimée
              </Text>
              <Text style={[styles.etaValue, { color: colors.text }]}>
                {eta} minutes
              </Text>
            </View>
          </View>

          <View style={styles.trackingActions}>
            <TouchableOpacity
              style={[
                styles.trackingButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={contactHelper}
            >
              <Ionicons name="call" size={20} color="#fff" />
              <Text style={styles.trackingButtonText}>Appeler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.trackingButton, { backgroundColor: colors.error }]}
              onPress={cancelSOS}
            >
              <Ionicons name="close" size={20} color="#fff" />
              <Text style={styles.trackingButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.trackingHint, { color: colors.textSecondary }]}>
            Vous pouvez suivre l'arrivée du helper sur la carte
          </Text>
        </View>
      </View>
    );
  };

  // ============================================
  // RENDER PRINCIPAL
  // ============================================

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={
          colorScheme === "dark"
            ? ["rgba(230,57,70,0.05)", "rgba(128,0,32,0.05)"]
            : ["rgba(230,57,70,0.02)", "rgba(128,0,32,0.02)"]
        }
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        style={[
          styles.decorativeCircle,
          styles.circle1,
          {
            backgroundColor: colors.primary + "10",
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
          onPress={step > 2 ? cancelSOS : () => router.back()}
        >
          <Ionicons
            name={step > 2 ? "close" : "arrow-back"}
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {step === 1 && "Localisation"}
            {step === 2 && "SOS Urgence"}
            {step === 3 && "Recherche en cours"}
            {step === 4 && "Helper trouvé !"}
          </Text>
          <Text
            style={[styles.headerSubtitle, { color: colors.textSecondary }]}
          >
            {step === 1 && "Recherche GPS"}
            {step === 2 && "Choisissez le problème"}
            {step === 3 && "Patiente un instant"}
            {step === 4 && "Il arrive !"}
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
          {/* Bouton appel d'urgence (toujours visible sauf étape 3-4) */}
          {step < 3 && (
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={styles.emergencyCallContainer}
                onPress={handleEmergencyCall}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#2C2C2C", "#1A1A1A"]}
                  style={styles.emergencyCallGradient}
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
          )}

          {/* Étapes */}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </Animated.View>
      </ScrollView>

      {/* Overlay de chargement */}
      {loading && step === 2 && (
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

// ============================================
// STYLES
// ============================================

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
  // Styles pour l'étape 3 (recherche)
  searchContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  searchCard: {
    width: "100%",
    padding: 30,
    borderRadius: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  searchIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  searchTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
  },
  searchSubtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  timerText: {
    fontSize: 32,
    fontWeight: "bold",
  },
  progressBarContainer: {
    width: "100%",
    height: 8,
    borderRadius: 4,
    marginBottom: 16,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },
  searchHint: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: "center",
  },
  cancelSearchButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    borderWidth: 1,
  },
  cancelSearchText: {
    fontSize: 16,
    fontWeight: "600",
  },
  // Styles pour l'étape 4 (suivi)
  trackingContainer: {
    flex: 1,
    paddingVertical: 20,
  },
  trackingCard: {
    padding: 24,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  helperHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
  },
  helperAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  helperAvatarText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  helperInfo: {
    flex: 1,
  },
  helperName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  helperStatus: {
    fontSize: 14,
    fontWeight: "600",
  },
  etaContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.03)",
  },
  etaInfo: {
    flex: 1,
  },
  etaLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  etaValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  trackingActions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  trackingButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 25,
    gap: 8,
  },
  trackingButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  trackingHint: {
    fontSize: 14,
    textAlign: "center",
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
