import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const handleLogout = () => {
    Alert.alert("Déconnexion", "Voulez-vous vraiment vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Se déconnecter",
        onPress: async () => {
          await logout();
          router.replace("/auth/login");
        },
        style: "destructive",
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* En-tête du profil */}
      <View style={styles.header}>
        <View
          style={[
            styles.avatarContainer,
            { backgroundColor: colors.primary + "20" },
          ]}
        >
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {user?.name?.[0] || "H"}
          </Text>
        </View>
        <Text style={[styles.name, { color: colors.text }]}>
          {user?.name || "Helper"}
        </Text>
        <Text style={[styles.email, { color: colors.textSecondary }]}>
          {user?.email || "helper@kadima.com"}
        </Text>
      </View>

      {/* Bouton de déconnexion */}
      <TouchableOpacity
        style={[styles.logoutButton, { borderColor: colors.border }]}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={24} color={colors.error} />
        <Text style={[styles.logoutText, { color: colors.error }]}>
          Se déconnecter
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 30,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "bold",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
    padding: 16,
    borderWidth: 1,
    borderRadius: 30,
    gap: 10,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
