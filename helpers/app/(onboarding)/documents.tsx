import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useOnboarding } from "../../contexts/OnboardingContext";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const DOCUMENTS = [
  { id: "license", label: "Permis de conduire", icon: "id-card" },
  { id: "insurance", label: "Attestation d'assurance", icon: "shield" },
  { id: "identity", label: "Pièce d'identité", icon: "person" },
];

export default function DocumentsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { data, updateDocuments } = useOnboarding();

  const toggleDocument = (docId) => {
    updateDocuments({
      ...data.documents,
      [docId]: !data.documents[docId],
    });
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
        <Text style={styles.headerTitle}>Étape 6/6</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.progressFill,
            { backgroundColor: colors.primary, width: "100%" },
          ]}
        />
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          Documents (optionnel)
        </Text>

        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Ces documents nous aident à vérifier votre profil plus rapidement
        </Text>

        {DOCUMENTS.map((doc) => (
          <TouchableOpacity
            key={doc.id}
            style={[
              styles.documentCard,
              { borderColor: colors.border },
              data.documents[doc.id] && {
                backgroundColor: colors.success + "15",
                borderColor: colors.success,
              },
            ]}
            onPress={() => toggleDocument(doc.id)}
          >
            <View style={styles.documentLeft}>
              <Ionicons
                name={doc.icon}
                size={24}
                color={data.documents[doc.id] ? colors.success : colors.primary}
              />
              <Text style={[styles.documentLabel, { color: colors.text }]}>
                {doc.label}
              </Text>
            </View>
            <Ionicons
              name={
                data.documents[doc.id]
                  ? "checkmark-circle"
                  : "cloud-upload-outline"
              }
              size={24}
              color={data.documents[doc.id] ? colors.success : colors.primary}
            />
          </TouchableOpacity>
        ))}

        <Text style={[styles.note, { color: colors.textSecondary }]}>
          Note: Vous pourrez toujours ajouter ces documents plus tard
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/(onboarding)/success")}
        >
          <Text style={styles.nextButtonText}>Terminer</Text>
          <Ionicons name="checkmark" size={20} color="#fff" />
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
    flex: 1,
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
  documentCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
  },
  documentLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  documentLabel: {
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
