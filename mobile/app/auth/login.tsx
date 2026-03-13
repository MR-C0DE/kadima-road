import React, { useState, useEffect } from "react";
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
  Dimensions,
  Animated,
  Easing,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../config/api";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";

const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [email, setEmail] = useState("test@email.com");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  // Animations
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const scaleAnim = useState(new Animated.Value(0.95))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
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
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    setLoading(true);
    try {
      // ✅ Route CORRECTE pour Kadima Road
      const response = await api.post("/auth/user/login", {
        email,
        password,
      });

      const { user, token } = response.data.data;
      await login(user, token);
    } catch (error) {
      Alert.alert(
        "Erreur",
        error.response?.data?.message || "Connexion échouée"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />

      {/* Fond avec dégradé */}
      <LinearGradient
        colors={
          colorScheme === "dark"
            ? ["#1A1A1A", "#0A0A0A"]
            : ["#FFFFFF", "#F5F5F5"]
        }
        style={StyleSheet.absoluteFill}
      />

      {/* Cercles décoratifs */}
      <View
        style={[
          styles.decorativeCircle,
          styles.circle1,
          { backgroundColor: colors.primary + "20" },
        ]}
      />
      <View
        style={[
          styles.decorativeCircle,
          styles.circle2,
          { backgroundColor: colors.secondary + "20" },
        ]}
      />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo / Icône */}
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.logoGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="car-sport" size={50} color="#FFFFFF" />
          </LinearGradient>
          <Text style={[styles.brandName, { color: colors.primary }]}>
            Kadima Road
          </Text>
          <Text style={[styles.brandTagline, { color: colors.textSecondary }]}>
            L'élite de l'assistance routière
          </Text>
        </View>

        {/* Formulaire */}
        <View style={styles.form}>
          {/* Email */}
          <Animated.View
            style={[
              styles.inputWrapper,
              {
                transform: [
                  {
                    scale: focusedInput === "email" ? 1.02 : 1,
                  },
                ],
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
                focusedInput === "email" ? colors.primary : colors.textSecondary
              }
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Email"
              placeholderTextColor={colors.placeholder}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              onFocus={() => setFocusedInput("email")}
              onBlur={() => setFocusedInput(null)}
            />
          </Animated.View>

          {/* Mot de passe */}
          <Animated.View
            style={[
              styles.inputWrapper,
              {
                transform: [
                  {
                    scale: focusedInput === "password" ? 1.02 : 1,
                  },
                ],
                borderColor:
                  focusedInput === "password" ? colors.primary : colors.border,
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
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              onFocus={() => setFocusedInput("password")}
              onBlur={() => setFocusedInput(null)}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </Animated.View>

          {/* Mot de passe oublié */}
          <TouchableOpacity style={styles.forgotButton}>
            <Text style={[styles.forgotText, { color: colors.primary }]}>
              Mot de passe oublié ?
            </Text>
          </TouchableOpacity>

          {/* Bouton connexion */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.loginButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>Se connecter</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Séparateur */}
          <View style={styles.separator}>
            <View
              style={[styles.separatorLine, { backgroundColor: colors.border }]}
            />
            <Text
              style={[styles.separatorText, { color: colors.textSecondary }]}
            >
              ou
            </Text>
            <View
              style={[styles.separatorLine, { backgroundColor: colors.border }]}
            />
          </View>

          {/* Boutons sociaux */}
          <View style={styles.socialButtons}>
            <TouchableOpacity
              style={[styles.socialButton, { borderColor: colors.border }]}
            >
              <Ionicons
                name="logo-google"
                size={24}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.socialButton, { borderColor: colors.border }]}
            >
              <Ionicons
                name="logo-apple"
                size={24}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.socialButton, { borderColor: colors.border }]}
            >
              <Ionicons
                name="logo-facebook"
                size={24}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Lien inscription */}
          <View style={styles.registerContainer}>
            <Text
              style={[styles.registerText, { color: colors.textSecondary }]}
            >
              Pas encore de compte ?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.push("/auth/register")}>
              <Text style={[styles.registerLink, { color: colors.primary }]}>
                S'inscrire
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
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
    top: -width * 0.3,
    right: -width * 0.2,
  },
  circle2: {
    bottom: -width * 0.3,
    left: -width * 0.2,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#B8860B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  brandName: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
    letterSpacing: 1,
  },
  brandTagline: {
    fontSize: 14,
    letterSpacing: 0.5,
  },
  form: {
    width: "100%",
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
  forgotButton: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: "600",
  },
  loginButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#B8860B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  separator: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  separatorLine: {
    flex: 1,
    height: 1,
  },
  separatorText: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  socialButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  registerText: {
    fontSize: 14,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
});
