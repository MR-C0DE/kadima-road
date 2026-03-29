// app/vehicles/add.tsx - Version design moderne

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
  Keyboard,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { api } from "../../config/api";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";

const { width } = Dimensions.get("window");

// Options pour les sélecteurs en chips
const FUEL_TYPES = [
  { id: "essence", label: "Essence", icon: "water", color: "#3B82F6" },
  { id: "diesel", label: "Diesel", icon: "water", color: "#6B7280" },
  {
    id: "electrique",
    label: "Électrique",
    icon: "battery-charging",
    color: "#22C55E",
  },
  { id: "hybride", label: "Hybride", icon: "leaf", color: "#F59E0B" },
  { id: "gpl", label: "GPL", icon: "flame", color: "#EF4444" },
];

const TRANSMISSION_TYPES = [
  { id: "manuelle", label: "Manuelle", icon: "settings", color: "#3B82F6" },
  {
    id: "automatique",
    label: "Automatique",
    icon: "settings",
    color: "#22C55E",
  },
  {
    id: "semi-automatique",
    label: "Semi-auto",
    icon: "settings",
    color: "#F59E0B",
  },
  { id: "cvt", label: "CVT", icon: "settings", color: "#8B5CF6" },
];

// Champs du formulaire avec validation
interface FormField {
  field: keyof FormData;
  label: string;
  placeholder: string;
  icon: string;
  keyboardType?: "default" | "numeric" | "email-address";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  required: boolean;
  maxLength?: number;
}

const FORM_FIELDS: FormField[] = [
  {
    field: "make",
    label: "Marque",
    placeholder: "Ex: Toyota, Honda, BMW",
    icon: "car",
    autoCapitalize: "words",
    required: true,
  },
  {
    field: "model",
    label: "Modèle",
    placeholder: "Ex: Corolla, Civic, X5",
    icon: "car-sport",
    autoCapitalize: "words",
    required: true,
  },
  {
    field: "year",
    label: "Année",
    placeholder: "Ex: 2020",
    icon: "calendar",
    keyboardType: "numeric",
    required: true,
    maxLength: 4,
  },
  {
    field: "licensePlate",
    label: "Plaque d'immatriculation",
    placeholder: "Ex: ABC 123",
    icon: "id-card",
    autoCapitalize: "characters",
    required: true,
  },
  {
    field: "color",
    label: "Couleur",
    placeholder: "Ex: Rouge, Bleu, Noir",
    icon: "color-palette",
    autoCapitalize: "words",
    required: false,
  },
  {
    field: "vin",
    label: "Numéro VIN (optionnel)",
    placeholder: "17 caractères",
    icon: "qr-code",
    autoCapitalize: "characters",
    required: false,
    maxLength: 17,
  },
  {
    field: "currentMileage",
    label: "Kilométrage actuel",
    placeholder: "Ex: 45000",
    icon: "speedometer",
    keyboardType: "numeric",
    required: false,
  },
];

export default function AddVehicleScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [form, setForm] = useState({
    make: "",
    model: "",
    year: "",
    licensePlate: "",
    color: "",
    vin: "",
    fuelType: "essence",
    transmission: "manuelle",
    currentMileage: "",
  });

  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Validation en temps réel
  const validateField = (field: string, value: string): string => {
    switch (field) {
      case "make":
        if (!value.trim()) return "La marque est requise";
        if (value.length < 2) return "Minimum 2 caractères";
        return "";
      case "model":
        if (!value.trim()) return "Le modèle est requis";
        if (value.length < 2) return "Minimum 2 caractères";
        return "";
      case "year":
        if (!value.trim()) return "L'année est requise";
        const year = parseInt(value);
        const currentYear = new Date().getFullYear();
        if (isNaN(year)) return "Année invalide";
        if (year < 1900) return "Année trop ancienne";
        if (year > currentYear + 1) return "Année future";
        return "";
      case "licensePlate":
        if (!value.trim()) return "La plaque est requise";
        if (value.length < 3) return "Plaque trop courte";
        return "";
      case "vin":
        if (value && value.length !== 17)
          return "Le VIN doit contenir 17 caractères";
        return "";
      default:
        return "";
    }
  };

  const handleChange = (field: string, value: string) => {
    setForm({ ...form, [field]: value });
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const isFormValid = () => {
    const requiredFields = FORM_FIELDS.filter((f) => f.required);
    for (const field of requiredFields) {
      const value = form[field.field as keyof typeof form];
      if (!value.trim()) {
        setErrors((prev) => ({
          ...prev,
          [field.field]: `${field.label} est requise`,
        }));
        return false;
      }
      const error = validateField(field.field, value);
      if (error) {
        setErrors((prev) => ({ ...prev, [field.field]: error }));
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: "error",
        text1: "Formulaire incomplet",
        text2: "Veuillez remplir tous les champs obligatoires",
        position: "bottom",
      });
      return;
    }

    // Animation du bouton
    Animated.sequence([
      Animated.spring(buttonScale, {
        toValue: 0.95,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    Keyboard.dismiss();
    setLoading(true);

    try {
      const vehicleData = {
        make: form.make.trim(),
        model: form.model.trim(),
        year: parseInt(form.year, 10),
        licensePlate: form.licensePlate.toUpperCase().trim(),
        color: form.color?.trim() || undefined,
        vin: form.vin?.trim().toUpperCase() || undefined,
        fuelType: form.fuelType,
        transmission: form.transmission,
        currentMileage: form.currentMileage
          ? parseInt(form.currentMileage, 10)
          : 0,
      };

      await api.post("/vehicles", vehicleData);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Animation de succès
      Animated.sequence([
        Animated.timing(successAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(successAnim, {
          toValue: 0,
          duration: 300,
          delay: 1500,
          useNativeDriver: true,
        }),
      ]).start();

      Toast.show({
        type: "success",
        text1: "🎉 Véhicule ajouté",
        text2: `${form.make} ${form.model} a été ajouté avec succès`,
        position: "bottom",
        visibilityTime: 3000,
      });

      setTimeout(() => router.back(), 1500);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: error.response?.data?.message || "Erreur lors de l'ajout",
        position: "bottom",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (field: FormField) => {
    const isFocused = focusedInput === field.field;
    const hasError = !!errors[field.field];
    const value = form[field.field as keyof typeof form];
    const translateY = slideAnim.interpolate({
      inputRange: [0, 50],
      outputRange: [20, 0],
    });

    return (
      <Animated.View
        key={field.field}
        style={[
          styles.inputWrapper,
          {
            opacity: fadeAnim,
            transform: [{ translateY }],
          },
        ]}
      >
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
          {field.label}
          {field.required && <Text style={{ color: colors.error }}> *</Text>}
        </Text>

        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: colors.surface,
              borderColor: hasError
                ? colors.error
                : isFocused
                ? colors.primary
                : colors.border,
              borderWidth: isFocused || hasError ? 2 : 1,
            },
          ]}
        >
          <LinearGradient
            colors={[colors.primary + "15", colors.primary + "05"]}
            style={styles.inputIconBg}
          >
            <Ionicons
              name={field.icon}
              size={18}
              color={
                hasError
                  ? colors.error
                  : isFocused
                  ? colors.primary
                  : colors.textSecondary
              }
            />
          </LinearGradient>

          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder={field.placeholder}
            placeholderTextColor={colors.placeholder}
            value={value}
            onChangeText={(text) => handleChange(field.field, text)}
            onFocus={() => setFocusedInput(field.field)}
            onBlur={() => setFocusedInput(null)}
            keyboardType={field.keyboardType || "default"}
            autoCapitalize={field.autoCapitalize || "none"}
            maxLength={field.maxLength}
          />
        </View>

        {hasError && (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {errors[field.field]}
          </Text>
        )}
      </Animated.View>
    );
  };

  const renderFuelSelector = () => {
    const translateY = slideAnim.interpolate({
      inputRange: [0, 50],
      outputRange: [20, 0],
    });

    return (
      <Animated.View
        style={[
          styles.selectorWrapper,
          {
            opacity: fadeAnim,
            transform: [{ translateY }],
          },
        ]}
      >
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
          Type de carburant
        </Text>
        <View style={styles.chipsContainer}>
          {FUEL_TYPES.map((fuel) => {
            const isSelected = form.fuelType === fuel.id;
            return (
              <TouchableOpacity
                key={fuel.id}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected
                      ? fuel.color + "20"
                      : colors.surface,
                    borderColor: isSelected ? fuel.color : colors.border,
                  },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setForm({ ...form, fuelType: fuel.id });
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={fuel.icon}
                  size={16}
                  color={isSelected ? fuel.color : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: isSelected ? fuel.color : colors.text,
                      fontWeight: isSelected ? "600" : "500",
                    },
                  ]}
                >
                  {fuel.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>
    );
  };

  const renderTransmissionSelector = () => {
    const translateY = slideAnim.interpolate({
      inputRange: [0, 50],
      outputRange: [20, 0],
    });

    return (
      <Animated.View
        style={[
          styles.selectorWrapper,
          {
            opacity: fadeAnim,
            transform: [{ translateY }],
          },
        ]}
      >
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
          Transmission
        </Text>
        <View style={styles.chipsContainer}>
          {TRANSMISSION_TYPES.map((trans) => {
            const isSelected = form.transmission === trans.id;
            return (
              <TouchableOpacity
                key={trans.id}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected
                      ? trans.color + "20"
                      : colors.surface,
                    borderColor: isSelected ? trans.color : colors.border,
                  },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setForm({ ...form, transmission: trans.id });
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={trans.icon}
                  size={16}
                  color={isSelected ? trans.color : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: isSelected ? trans.color : colors.text,
                      fontWeight: isSelected ? "600" : "500",
                    },
                  ]}
                >
                  {trans.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" />

      {/* Header avec dégradé moderne */}
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

          <View style={styles.headerTitleContainer}>
            <LinearGradient
              colors={["rgba(255,255,255,0.2)", "transparent"]}
              style={styles.headerIconBg}
            >
              <Ionicons name="car-outline" size={24} color="#fff" />
            </LinearGradient>
            <Text style={styles.headerTitle}>Ajouter un véhicule</Text>
          </View>

          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.form}>
          {/* Section Informations principales */}
          <Animated.View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.surface },
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={[colors.primary + "20", colors.secondary + "10"]}
                style={styles.sectionIcon}
              >
                <Ionicons name="car-outline" size={20} color={colors.primary} />
              </LinearGradient>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Informations principales
              </Text>
            </View>

            {FORM_FIELDS.slice(0, 4).map(renderInput)}
          </Animated.View>

          {/* Section Détails techniques */}
          <Animated.View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.surface },
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={[colors.primary + "20", colors.secondary + "10"]}
                style={styles.sectionIcon}
              >
                <Ionicons
                  name="settings-outline"
                  size={20}
                  color={colors.primary}
                />
              </LinearGradient>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Détails techniques
              </Text>
            </View>

            {FORM_FIELDS.slice(4, 6).map(renderInput)}
            {renderFuelSelector()}
            {renderTransmissionSelector()}
            {FORM_FIELDS.slice(6, 7).map(renderInput)}
          </Animated.View>
        </View>

        {/* Bouton d'ajout avec animation */}
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: buttonScale }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.submitGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.submitButtonText}>Ajout en cours...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color="#fff" />
                  <Text style={styles.submitButtonText}>
                    Ajouter le véhicule
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Animation de succès */}
        <Animated.View
          style={[
            styles.successOverlay,
            {
              opacity: successAnim,
              transform: [
                {
                  scale: successAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.5, 1.2, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={[colors.success + "CC", colors.success]}
            style={styles.successCircle}
          >
            <Ionicons name="checkmark" size={48} color="#fff" />
          </LinearGradient>
        </Animated.View>

        <View style={styles.bottomSpace} />
      </ScrollView>

      <Toast />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  form: {
    gap: 16,
  },
  sectionCard: {
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  inputWrapper: {
    gap: 8,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  inputIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: "100%",
  },
  errorText: {
    fontSize: 11,
    marginLeft: 12,
    marginTop: 4,
  },
  selectorWrapper: {
    gap: 8,
    marginBottom: 20,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1,
    gap: 8,
  },
  chipText: {
    fontSize: 14,
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 20,
  },
  submitButton: {
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 10,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  successOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 24,
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomSpace: {
    height: 20,
  },
});
