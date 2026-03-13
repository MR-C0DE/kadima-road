import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
  Easing,
} from "react-native";
import { useRouter } from "expo-router";
import { api } from "../../config/api";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";

const { width } = Dimensions.get("window");

export default function RegisterScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [step, setStep] = useState(1);

  // Animations
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
    ]).start();
  }, []);

  useEffect(() => {
    // Animation de la barre de progression
    Animated.timing(progressAnim, {
      toValue: step / 2,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [step]);

  const validateStep1 = () => {
    if (!form.firstName || !form.lastName || !form.email || !form.phone) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!form.password || !form.confirmPassword) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return false;
    }
    if (form.password !== form.confirmPassword) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas");
      return false;
    }
    if (form.password.length < 6) {
      Alert.alert(
        "Erreur",
        "Le mot de passe doit contenir au moins 6 caractères"
      );
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  const handleRegister = async () => {
    if (!validateStep2()) return;

    setLoading(true);
    try {
      // ✅ Route CORRECTE pour Kadima Road
      const response = await api.post("/auth/user/register", {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });

      Alert.alert(
        "Succès",
        "Inscription réussie ! Vous pouvez maintenant vous connecter.",
        [{ text: "OK", onPress: () => router.push("/auth/login") }]
      );
    } catch (error) {
      Alert.alert(
        "Erreur",
        error.response?.data?.message || "Inscription échouée"
      );
    } finally {
      setLoading(false);
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />

      <LinearGradient
        colors={
          colorScheme === "dark"
            ? ["#1A1A1A", "#0A0A0A"]
            : ["#FFFFFF", "#F5F5F5"]
        }
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Header avec retour */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => (step === 1 ? router.back() : handleBack())}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {step === 1 ? "Créer un compte" : "Sécurité"}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Barre de progression */}
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.primary,
                width: progressWidth,
              },
            ]}
          />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {step === 1 ? (
            // Étape 1 : Informations personnelles
            <Animated.View style={styles.stepContainer}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Informations personnelles
              </Text>
              <Text
                style={[styles.stepSubtitle, { color: colors.textSecondary }]}
              >
                Pour commencer, dites-nous qui vous êtes
              </Text>

              {/* Prénom */}
              <View
                style={[
                  styles.inputWrapper,
                  {
                    borderColor:
                      focusedInput === "firstName"
                        ? colors.primary
                        : colors.border,
                    borderWidth: focusedInput === "firstName" ? 2 : 1,
                  },
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={
                    focusedInput === "firstName"
                      ? colors.primary
                      : colors.textSecondary
                  }
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Prénom"
                  placeholderTextColor={colors.placeholder}
                  value={form.firstName}
                  onChangeText={(text) => setForm({ ...form, firstName: text })}
                  onFocus={() => setFocusedInput("firstName")}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>

              {/* Nom */}
              <View
                style={[
                  styles.inputWrapper,
                  {
                    borderColor:
                      focusedInput === "lastName"
                        ? colors.primary
                        : colors.border,
                    borderWidth: focusedInput === "lastName" ? 2 : 1,
                  },
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={
                    focusedInput === "lastName"
                      ? colors.primary
                      : colors.textSecondary
                  }
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Nom"
                  placeholderTextColor={colors.placeholder}
                  value={form.lastName}
                  onChangeText={(text) => setForm({ ...form, lastName: text })}
                  onFocus={() => setFocusedInput("lastName")}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>

              {/* Email */}
              <View
                style={[
                  styles.inputWrapper,
                  {
                    borderColor:
                      focusedInput === "email" ? colors.primary : colors.border,
                    borderWidth: focusedInput === "email" ? 2 : 1,
                  },
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={
                    focusedInput === "email"
                      ? colors.primary
                      : colors.textSecondary
                  }
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Email"
                  placeholderTextColor={colors.placeholder}
                  value={form.email}
                  onChangeText={(text) => setForm({ ...form, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => setFocusedInput("email")}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>

              {/* Téléphone */}
              <View
                style={[
                  styles.inputWrapper,
                  {
                    borderColor:
                      focusedInput === "phone" ? colors.primary : colors.border,
                    borderWidth: focusedInput === "phone" ? 2 : 1,
                  },
                ]}
              >
                <Ionicons
                  name="call-outline"
                  size={20}
                  color={
                    focusedInput === "phone"
                      ? colors.primary
                      : colors.textSecondary
                  }
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Téléphone"
                  placeholderTextColor={colors.placeholder}
                  value={form.phone}
                  onChangeText={(text) => setForm({ ...form, phone: text })}
                  keyboardType="phone-pad"
                  onFocus={() => setFocusedInput("phone")}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
            </Animated.View>
          ) : (
            // Étape 2 : Sécurité
            <Animated.View style={styles.stepContainer}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Sécurité
              </Text>
              <Text
                style={[styles.stepSubtitle, { color: colors.textSecondary }]}
              >
                Choisissez un mot de passe sécurisé
              </Text>

              {/* Mot de passe */}
              <View
                style={[
                  styles.inputWrapper,
                  {
                    borderColor:
                      focusedInput === "password"
                        ? colors.primary
                        : colors.border,
                    borderWidth: focusedInput === "password" ? 2 : 1,
                  },
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={
                    focusedInput === "password"
                      ? colors.primary
                      : colors.textSecondary
                  }
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Mot de passe"
                  placeholderTextColor={colors.placeholder}
                  value={form.password}
                  onChangeText={(text) => setForm({ ...form, password: text })}
                  secureTextEntry={!showPassword}
                  onFocus={() => setFocusedInput("password")}
                  onBlur={() => setFocusedInput(null)}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {/* Confirmation */}
              <View
                style={[
                  styles.inputWrapper,
                  {
                    borderColor:
                      focusedInput === "confirmPassword"
                        ? colors.primary
                        : colors.border,
                    borderWidth: focusedInput === "confirmPassword" ? 2 : 1,
                  },
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={
                    focusedInput === "confirmPassword"
                      ? colors.primary
                      : colors.textSecondary
                  }
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Confirmer le mot de passe"
                  placeholderTextColor={colors.placeholder}
                  value={form.confirmPassword}
                  onChangeText={(text) =>
                    setForm({ ...form, confirmPassword: text })
                  }
                  secureTextEntry={!showConfirmPassword}
                  onFocus={() => setFocusedInput("confirmPassword")}
                  onBlur={() => setFocusedInput(null)}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={
                      showConfirmPassword ? "eye-off-outline" : "eye-outline"
                    }
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {/* Critères de mot de passe */}
              <View style={styles.criteriaContainer}>
                <Text style={[styles.criteriaTitle, { color: colors.text }]}>
                  Votre mot de passe doit contenir :
                </Text>
                <View style={styles.criteriaItem}>
                  <Ionicons
                    name={
                      form.password.length >= 6
                        ? "checkmark-circle"
                        : "ellipse-outline"
                    }
                    size={20}
                    color={
                      form.password.length >= 6
                        ? colors.success
                        : colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.criteriaText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Au moins 6 caractères
                  </Text>
                </View>
                <View style={styles.criteriaItem}>
                  <Ionicons
                    name={
                      /[A-Z]/.test(form.password)
                        ? "checkmark-circle"
                        : "ellipse-outline"
                    }
                    size={20}
                    color={
                      /[A-Z]/.test(form.password)
                        ? colors.success
                        : colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.criteriaText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Une lettre majuscule
                  </Text>
                </View>
                <View style={styles.criteriaItem}>
                  <Ionicons
                    name={
                      /[0-9]/.test(form.password)
                        ? "checkmark-circle"
                        : "ellipse-outline"
                    }
                    size={20}
                    color={
                      /[0-9]/.test(form.password)
                        ? colors.success
                        : colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.criteriaText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Un chiffre
                  </Text>
                </View>
              </View>
            </Animated.View>
          )}
        </ScrollView>

        {/* Bouton d'action */}
        <TouchableOpacity
          onPress={step === 1 ? handleNext : handleRegister}
          disabled={loading}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.actionButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.actionButtonText}>
                {step === 1 ? "Continuer" : "S'inscrire"}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 32,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  scrollContent: {
    flexGrow: 1,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    marginBottom: 32,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    borderRadius: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    fontWeight: "500",
  },
  criteriaContainer: {
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.03)",
  },
  criteriaTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  criteriaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  criteriaText: {
    marginLeft: 12,
    fontSize: 14,
  },
  actionButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 20,
    shadowColor: "#B8860B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },
});
