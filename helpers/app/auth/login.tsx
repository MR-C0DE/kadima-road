import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
  Dimensions,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../config/api";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // États
  const [step, setStep] = useState<"email" | "password">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");

  // Refs pour les inputs
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const emailSlideAnim = useRef(new Animated.Value(0)).current;
  const passwordSlideAnim = useRef(new Animated.Value(50)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

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
    ]).start();
  }, []);

  useEffect(() => {
    if (step === "email") {
      Animated.timing(emailSlideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();
      // Focus automatique sur l'input email
      setTimeout(() => emailInputRef.current?.focus(), 100);
    } else {
      Animated.timing(passwordSlideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();
      // Focus automatique sur l'input password
      setTimeout(() => passwordInputRef.current?.focus(), 100);
    }
  }, [step]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "L'email est requis";
    if (!emailRegex.test(email)) return "Format d'email invalide";
    return "";
  };

  const handleEmailSubmit = () => {
    const error = validateEmail(email);
    if (error) {
      setEmailError(error);
      return;
    }
    setEmailError("");
    setStep("password");
  };

  const handleLogin = async () => {
    if (!password) {
      Alert.alert("Erreur", "Veuillez entrer votre mot de passe");
      return;
    }

    Animated.sequence([
      Animated.spring(buttonScale, {
        toValue: 0.97,
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

    // Cacher le clavier avant la requête
    Keyboard.dismiss();

    setLoading(true);
    try {
      const response = await api.post("/auth/helper/login", {
        email: email.toLowerCase().trim(),
        password,
      });

      const { user, token } = response.data.data;
      await login(user, token);
      router.replace("/(tabs)");
    } catch (error: any) {
      let message = "Connexion échouée";
      if (error.response?.status === 401) {
        message = "Email ou mot de passe incorrect";
      }
      Alert.alert("Erreur", message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep("email");
    setPassword("");
  };

  // Fonction pour fermer le clavier quand on clique en dehors
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar
          barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        />

        {/* Header avec progression */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressDot,
                step === "email" && styles.progressDotActive,
                { backgroundColor: colors.primary },
              ]}
            />
            <View
              style={[styles.progressLine, { backgroundColor: colors.border }]}
            />
            <View
              style={[
                styles.progressDot,
                step === "password" && styles.progressDotActive,
                { backgroundColor: colors.primary },
              ]}
            />
          </View>
        </Animated.View>

        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
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
            {/* Logo */}
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.logo}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="flash" size={32} color="#fff" />
              </LinearGradient>
            </View>

            {/* Étape Email */}
            {step === "email" && (
              <Animated.View
                style={{ transform: [{ translateX: emailSlideAnim }] }}
              >
                <Text style={[styles.title, { color: colors.text }]}>
                  Quel est votre email?
                </Text>
                <Text
                  style={[styles.subtitle, { color: colors.textSecondary }]}
                >
                  Pour accéder à votre espace helper
                </Text>

                <TouchableWithoutFeedback
                  onPress={() => emailInputRef.current?.focus()}
                >
                  <View
                    style={[
                      styles.inputContainer,
                      {
                        borderColor: emailError ? colors.error : colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color={colors.primary}
                    />
                    <TextInput
                      ref={emailInputRef}
                      style={[styles.input, { color: colors.text }]}
                      placeholder="jean.dupont@email.com"
                      placeholderTextColor={colors.placeholder}
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        if (emailError) setEmailError("");
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      textContentType="emailAddress"
                      autoFocus
                      returnKeyType="next"
                      onSubmitEditing={handleEmailSubmit}
                    />
                  </View>
                </TouchableWithoutFeedback>

                {emailError ? (
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    {emailError}
                  </Text>
                ) : null}

                <TouchableOpacity
                  style={[styles.button, { backgroundColor: colors.primary }]}
                  onPress={handleEmailSubmit}
                  activeOpacity={0.9}
                >
                  <Text style={styles.buttonText}>Continuer</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Étape Mot de passe */}
            {step === "password" && (
              <Animated.View
                style={{ transform: [{ translateX: passwordSlideAnim }] }}
              >
                <TouchableOpacity
                  onPress={handleBack}
                  style={styles.backButton}
                >
                  <Ionicons
                    name="arrow-back"
                    size={22}
                    color={colors.textSecondary}
                  />
                  <Text
                    style={[styles.backText, { color: colors.textSecondary }]}
                  >
                    Modifier l'email
                  </Text>
                </TouchableOpacity>

                <Text style={[styles.title, { color: colors.text }]}>
                  Bienvenue,{" "}
                  <Text style={{ color: colors.primary }}>
                    {email.split("@")[0]}
                  </Text>
                </Text>
                <Text
                  style={[styles.subtitle, { color: colors.textSecondary }]}
                >
                  Entrez votre mot de passe
                </Text>

                <TouchableWithoutFeedback
                  onPress={() => passwordInputRef.current?.focus()}
                >
                  <View
                    style={[
                      styles.inputContainer,
                      { borderColor: colors.border },
                    ]}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={colors.primary}
                    />
                    <TextInput
                      ref={passwordInputRef}
                      style={[styles.input, { color: colors.text }]}
                      placeholder="Mot de passe"
                      placeholderTextColor={colors.placeholder}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoComplete="password"
                      textContentType="password"
                      autoFocus
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
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
                </TouchableWithoutFeedback>

                <TouchableOpacity style={styles.forgotContainer}>
                  <Text style={[styles.forgotText, { color: colors.primary }]}>
                    Mot de passe oublié?
                  </Text>
                </TouchableOpacity>

                <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.primary }]}
                    onPress={handleLogin}
                    disabled={loading}
                    activeOpacity={0.9}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Text style={styles.buttonText}>Se connecter</Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                      </>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              </Animated.View>
            )}

            {/* Lien inscription */}
            <View style={styles.registerContainer}>
              <Text
                style={[styles.registerText, { color: colors.textSecondary }]}
              >
                Pas encore de compte?
              </Text>
              <TouchableOpacity onPress={() => router.push("/auth/register")}>
                <Text style={[styles.registerLink, { color: colors.primary }]}>
                  Créer un compte helper
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>

        {/* Version app */}
        <Text style={[styles.versionText, { color: colors.textSecondary }]}>
          Version 1.0.0
        </Text>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 24,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.3,
  },
  progressDotActive: {
    width: 20,
    opacity: 1,
  },
  progressLine: {
    width: 40,
    height: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
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
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    gap: 10,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginBottom: 16,
    marginLeft: 4,
  },
  button: {
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 24,
  },
  backText: {
    fontSize: 14,
  },
  forgotContainer: {
    alignItems: "flex-end",
    marginTop: 8,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: "500",
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 40,
  },
  registerText: {
    fontSize: 14,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: "600",
  },
  versionText: {
    textAlign: "center",
    fontSize: 12,
    marginBottom: Platform.OS === "ios" ? 30 : 20,
  },
});
