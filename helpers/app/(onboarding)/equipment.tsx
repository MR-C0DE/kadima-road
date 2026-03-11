import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useOnboarding } from "../../contexts/OnboardingContext";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const EQUIPMENT_ITEMS = [
  { id: "cables", label: "Câbles de démarrage", icon: "flash" },
  { id: "jack", label: "Cric", icon: "car" },
  { id: "triangle", label: "Triangle de signalisation", icon: "warning" },
  { id: "vest", label: "Gilet de sécurité", icon: "shirt" },
  { id: "tire_iron", label: "Clé à roue", icon: "construct" },
  { id: "compressor", label: "Compresseur", icon: "airplane" },
];

export default function EquipmentScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { data, updateEquipment } = useOnboarding();

  const toggleEquipment = (itemId) => {
    const newEquipment = data.equipment.includes(itemId)
      ? data.equipment.filter((id) => id !== itemId)
      : [...data.equipment, itemId];
    updateEquipment(newEquipment);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Étape 5/6</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.progressFill,
            { backgroundColor: colors.primary, width: "80%" },
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          Quel équipement possédez-vous ?
        </Text>

        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Sélectionnez l'équipement que vous avez pour vos interventions
        </Text>

        <View style={styles.equipmentList}>
          {EQUIPMENT_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.equipmentItem,
                { borderColor: colors.border },
                data.equipment.includes(item.id) && {
                  backgroundColor: colors.primary + "15",
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => toggleEquipment(item.id)}
            >
              <View style={styles.itemLeft}>
                <Ionicons
                  name={item.icon}
                  size={24}
                  color={
                    data.equipment.includes(item.id)
                      ? colors.primary
                      : colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.itemLabel,
                    {
                      color: data.equipment.includes(item.id)
                        ? colors.primary
                        : colors.text,
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </View>
              {data.equipment.includes(item.id) ? (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={colors.success}
                />
              ) : (
                <Ionicons
                  name="add-circle-outline"
                  size={24}
                  color={colors.textSecondary}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.note, { color: colors.textSecondary }]}>
          Note: Vous pourrez modifier votre équipement plus tard
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/(onboarding)/documents")}
        >
          <Text style={styles.nextButtonText}>Suivant</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  progressBar: {
    height: 4,
    width: "100%",
  },
  progressFill: {
    height: "100%",
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 30,
  },
  equipmentList: {
    gap: 12,
  },
  equipmentItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  itemLabel: {
    fontSize: 16,
  },
  note: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 20,
    textAlign: "center",
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  nextButton: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
