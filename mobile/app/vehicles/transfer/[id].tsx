import React, { useState, useEffect } from "react";
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
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { api } from "../../../config/api";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

export default function TransferVehicleScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    email: "",
    price: "",
  });
  const [searching, setSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<any>(null);

  useEffect(() => {
    loadVehicle();
  }, [id]);

  const loadVehicle = async () => {
    try {
      const response = await api.get(`/vehicles/${id}`);
      setVehicle(response.data.data);
    } catch (error) {
      Alert.alert("Erreur", "Impossible de charger le véhicule");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const searchUser = async () => {
    if (!form.email.trim()) {
      Alert.alert("Erreur", "Veuillez entrer un email");
      return;
    }

    setSearching(true);
    try {
      const response = await api.get(`/users/search?email=${form.email}`);
      if (response.data.data) {
        setFoundUser(response.data.data);
      } else {
        Alert.alert("Non trouvé", "Aucun utilisateur avec cet email");
        setFoundUser(null);
      }
    } catch (error) {
      Alert.alert("Erreur", "Utilisateur non trouvé");
      setFoundUser(null);
    } finally {
      setSearching(false);
    }
  };

  const handleTransfer = async () => {
    if (!foundUser) {
      Alert.alert("Erreur", "Veuillez d'abord trouver un utilisateur");
      return;
    }

    Alert.alert(
      "Confirmer le transfert",
      `Voulez-vous vraiment transférer ${vehicle?.make} ${vehicle?.model} à ${foundUser.firstName} ${foundUser.lastName} ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Transférer",
          style: "destructive",
          onPress: async () => {
            setSending(true);
            try {
              await api.post(`/vehicles/${id}/transfer`, {
                newOwnerId: foundUser._id,
                price: parseFloat(form.price) || undefined,
              });
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
              Alert.alert("Succès", "Véhicule transféré avec succès", [
                { text: "OK", onPress: () => router.replace("/vehicles") },
              ]);
            } catch (error: any) {
              Alert.alert(
                "Erreur",
                error.response?.data?.message || "Erreur lors du transfert"
              );
            } finally {
              setSending(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transférer le véhicule</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Véhicule info */}
        <View style={[styles.vehicleCard, { backgroundColor: colors.card }]}>
          <View style={styles.vehicleIcon}>
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.iconGradient}
            >
              <Ionicons name="car" size={28} color="#fff" />
            </LinearGradient>
          </View>
          <View style={styles.vehicleInfo}>
            <Text style={[styles.vehicleName, { color: colors.text }]}>
              {vehicle.make} {vehicle.model}
            </Text>
            <Text
              style={[styles.vehiclePlate, { color: colors.textSecondary }]}
            >
              {vehicle.licensePlate}
            </Text>
            <Text
              style={[styles.vehicleMileage, { color: colors.textSecondary }]}
            >
              {vehicle.currentMileage.toLocaleString()} km
            </Text>
          </View>
        </View>

        {/* Recherche utilisateur */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Nouveau propriétaire
          </Text>
          <View style={styles.searchContainer}>
            <TextInput
              style={[
                styles.searchInput,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Email du nouveau propriétaire"
              placeholderTextColor={colors.placeholder}
              value={form.email}
              onChangeText={(text) => {
                setForm({ ...form, email: text });
                setFoundUser(null);
              }}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TouchableOpacity
              style={[styles.searchButton, { backgroundColor: colors.primary }]}
              onPress={searchUser}
              disabled={searching}
            >
              {searching ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="search" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>

          {foundUser && (
            <View style={[styles.userCard, { backgroundColor: colors.card }]}>
              <View style={styles.userAvatar}>
                <LinearGradient
                  colors={[colors.primary, colors.secondary]}
                  style={styles.avatarGradient}
                >
                  <Text style={styles.avatarText}>
                    {foundUser.firstName?.[0]}
                    {foundUser.lastName?.[0]}
                  </Text>
                </LinearGradient>
              </View>
              <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: colors.text }]}>
                  {foundUser.firstName} {foundUser.lastName}
                </Text>
                <Text
                  style={[styles.userEmail, { color: colors.textSecondary }]}
                >
                  {foundUser.email}
                </Text>
              </View>
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={colors.success}
              />
            </View>
          )}
        </View>

        {/* Prix de vente (optionnel) */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Prix de vente (optionnel)
          </Text>
          <TextInput
            style={[
              styles.priceInput,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="Montant en CAD"
            placeholderTextColor={colors.placeholder}
            value={form.price}
            onChangeText={(text) => setForm({ ...form, price: text })}
            keyboardType="numeric"
          />
        </View>

        {/* Avertissement */}
        <View
          style={[styles.warningCard, { backgroundColor: colors.error + "10" }]}
        >
          <Ionicons name="warning" size={20} color={colors.error} />
          <Text style={[styles.warningText, { color: colors.error }]}>
            Cette action est irréversible. Le véhicule sera transféré au nouveau
            propriétaire et vous ne pourrez plus y accéder.
          </Text>
        </View>

        {/* Bouton de transfert */}
        <TouchableOpacity
          style={[
            styles.transferButton,
            { backgroundColor: foundUser ? colors.success : colors.disabled },
          ]}
          onPress={handleTransfer}
          disabled={!foundUser || sending}
          activeOpacity={0.8}
        >
          {sending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="swap-horizontal" size={20} color="#fff" />
              <Text style={styles.transferButtonText}>
                Transférer le véhicule
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 60,
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
  headerButton: {
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
    padding: 20,
    gap: 20,
  },
  vehicleCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    gap: 16,
  },
  vehicleIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: "hidden",
  },
  iconGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  vehiclePlate: {
    fontSize: 13,
    marginBottom: 2,
  },
  vehicleMileage: {
    fontSize: 12,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    gap: 12,
  },
  searchInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  searchButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    gap: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
  },
  avatarGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
  },
  priceInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  warningCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  transferButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 30,
    gap: 8,
  },
  transferButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
