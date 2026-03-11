import React, { useState } from "react";
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
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../config/api";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    setLoading(true);
    try {
      // Route spécifique pour les helpers
      const response = await api.post("/auth/helper/login", {
        email,
        password,
      });

      const { user, token, helper } = response.data.data;

      // Stocker aussi les infos du helper si nécessaire
      await login(user, token);

      // Redirection vers l'accueil helper
      router.replace("/(tabs)");
    } catch (error) {
      // Gestion des erreurs spécifiques
      if (error.response?.status === 403) {
        Alert.alert(
          "Accès refusé",
          error.response?.data?.message ||
            "Cette application est réservée aux helpers"
        );
      } else {
        Alert.alert(
          "Erreur",
          error.response?.data?.message || "Connexion échouée"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient
        colors={
          colorScheme === "dark"
            ? [colors.primary + "20", colors.secondary + "20"]
            : [colors.primary + "10", colors.secondary + "10"]
        }
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        {/* Logo / Icône */}
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.logoGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="construct" size={50} color="#fff" />
          </LinearGradient>
          <Text style={[styles.brandName, { color: colors.primary }]}>
            Kadima Helpers
          </Text>
          <Text style={[styles.brandTagline, { color: colors.textSecondary }]}>
            Espace professionnel
          </Text>
        </View>

        <View style={styles.form}>
          {/* Email */}
          <View style={[styles.inputContainer, { borderColor: colors.border }]}>
            <Ionicons
              name="mail-outline"
              size={20}
              color={colors.primary}
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
            />
          </View>

          {/* Mot de passe */}
          <View style={[styles.inputContainer, { borderColor: colors.border }]}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={colors.primary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Mot de passe"
              placeholderTextColor={colors.placeholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Bouton connexion */}
          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: colors.primary }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Se connecter</Text>
            )}
          </TouchableOpacity>

          {/* Lien inscription */}
          <View style={styles.registerContainer}>
            <Text
              style={[styles.registerText, { color: colors.textSecondary }]}
            >
              Pas encore de compte ?
            </Text>
            <TouchableOpacity onPress={() => router.push("/auth/register")}>
              <Text style={[styles.registerLink, { color: colors.primary }]}>
                S'inscrire comme helper
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  brandName: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 5,
  },
  brandTagline: {
    fontSize: 14,
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 55,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 16,
  },
  loginButton: {
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  registerContainer: {
    alignItems: "center",
    marginTop: 20,
    gap: 5,
  },
  registerText: {
    fontSize: 14,
  },
  registerLink: {
    fontSize: 16,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
