import React, { useState, useRef, useEffect } from "react";
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
  Animated,
  Dimensions,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { api } from "../../config/api";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

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
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

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
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const validateField = (field: string, value: string) => {
    let error = "";
    switch (field) {
      case "firstName":
      case "lastName":
        if (!value) error = "Ce champ est requis";
        else if (value.length < 2) error = "Minimum 2 caractères";
        break;
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) error = "L'email est requis";
        else if (!emailRegex.test(value)) error = "Format d'email invalide";
        break;
      case "phone":
        const phoneRegex = /^[0-9]{10}$/;
        if (!value) error = "Le téléphone est requis";
        else if (!phoneRegex.test(value.replace(/\s/g, "")))
          error = "Format: 0612345678";
        break;
      case "password":
        if (!value) error = "Le mot de passe est requis";
        else if (value.length < 6) error = "Minimum 6 caractères";
        break;
      case "confirmPassword":
        if (!value) error = "Confirmation requise";
        else if (value !== form.password)
          error = "Les mots de passe ne correspondent pas";
        break;
    }
    return error;
  };

  const handleChange = (field: string, value: string) => {
    setForm({ ...form, [field]: value });
    const error = validateField(field, value);
    setErrors({ ...errors, [field]: error });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    Object.keys(form).forEach((key) => {
      const error = validateField(key, form[key as keyof typeof form]);
      if (error) newErrors[key] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      Alert.alert("Erreur", "Veuillez corriger les erreurs dans le formulaire");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/helper/register", {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email.toLowerCase().trim(),
        phone: form.phone.replace(/\s/g, ""),
        password: form.password,
      });

      Alert.alert(
        "✅ Compte créé !",
        "Votre compte helper a été créé avec succès. Vous pouvez maintenant vous connecter.",
        [{ text: "Se connecter", onPress: () => router.push("/auth/login") }]
      );
    } catch (error: any) {
      Alert.alert(
        "Erreur",
        error.response?.data?.message || "Inscription échouée"
      );
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    field: string,
    placeholder: string,
    icon: string,
    options: any = {}
  ) => {
    const isFocused = focusedInput === field;
    const hasError = errors[field];
    const isPassword = field.includes("password");

    return (
      <Animated.View key={field} style={{ opacity: fadeAnim }}>
        <View style={styles.inputWrapper}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            {placeholder}
          </Text>
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: colors.card,
                borderColor: hasError
                  ? colors.error
                  : isFocused
                  ? colors.primary
                  : colors.border,
              },
            ]}
          >
            <Ionicons
              name={icon}
              size={20}
              color={
                hasError
                  ? colors.error
                  : isFocused
                  ? colors.primary
                  : colors.textSecondary
              }
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={placeholder}
              placeholderTextColor={colors.placeholder}
              value={form[field as keyof typeof form]}
              onChangeText={(text) => handleChange(field, text)}
              onFocus={() => setFocusedInput(field)}
              onBlur={() => setFocusedInput(null)}
              secureTextEntry={
                isPassword &&
                (field === "password" ? !showPassword : !showConfirmPassword)
              }
              keyboardType={options.keyboardType || "default"}
              autoCapitalize={options.autoCapitalize || "none"}
            />
            {isPassword && (
              <TouchableOpacity
                onPress={() =>
                  field === "password"
                    ? setShowPassword(!showPassword)
                    : setShowConfirmPassword(!showConfirmPassword)
                }
              >
                <Ionicons
                  name={
                    (field === "password" ? showPassword : showConfirmPassword)
                      ? "eye-off-outline"
                      : "eye-outline"
                  }
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>
          {hasError ? (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {hasError}
            </Text>
          ) : null}
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
      />

      {/* Header avec retour */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.card }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
      </Animated.View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
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
            {/* Logo et titre */}
            <Animated.View
              style={[
                styles.titleContainer,
                { transform: [{ scale: scaleAnim }] },
              ]}
            >
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.logo}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="flash" size={32} color="#fff" />
              </LinearGradient>
              <Text style={[styles.title, { color: colors.text }]}>
                Devenir Helper
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Rejoignez notre communauté de professionnels
              </Text>
            </Animated.View>

            {/* Formulaire */}
            <View style={styles.form}>
              {renderInput("firstName", "Prénom", "person-outline", {
                autoCapitalize: "words",
              })}
              {renderInput("lastName", "Nom", "person-outline", {
                autoCapitalize: "words",
              })}
              {renderInput("email", "Email", "mail-outline", {
                keyboardType: "email-address",
              })}
              {renderInput("phone", "Téléphone", "call-outline", {
                keyboardType: "phone-pad",
              })}
              {renderInput("password", "Mot de passe", "lock-closed-outline")}
              {renderInput(
                "confirmPassword",
                "Confirmer",
                "lock-closed-outline"
              )}
            </View>

            {/* Bouton d'inscription */}
            <Animated.View style={{ opacity: fadeAnim }}>
              <TouchableOpacity
                style={styles.registerButton}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[colors.primary, colors.secondary]}
                  style={styles.registerButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.registerButtonText}>
                        Créer mon compte
                      </Text>
                      <Ionicons name="arrow-forward" size={20} color="#fff" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.loginContainer}>
                <Text
                  style={[styles.loginText, { color: colors.textSecondary }]}
                >
                  Déjà un compte ?
                </Text>
                <TouchableOpacity onPress={() => router.push("/auth/login")}>
                  <Text style={[styles.loginLink, { color: colors.primary }]}>
                    Se connecter
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Version app */}
            <Text style={[styles.versionText, { color: colors.textSecondary }]}>
              Version 1.0.0
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    left: 20,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 40,
    marginTop: 40,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  form: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    marginBottom: 24,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 6,
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
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 15,
  },
  errorText: {
    fontSize: 11,
    marginTop: 4,
    marginLeft: 4,
  },
  registerButton: {
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    maxWidth: 400,
    alignSelf: "center",
    width: "100%",
  },
  registerButtonGradient: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 20,
  },
  loginText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: "600",
  },
  versionText: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 30,
  },
});
