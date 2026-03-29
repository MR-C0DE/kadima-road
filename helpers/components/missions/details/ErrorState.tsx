// helpers/components/missions/details/ErrorState.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ErrorStateProps {
  colors: any;
  onRetry: () => void;
}

export const ErrorState = ({ colors, onRetry }: ErrorStateProps) => {
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Ionicons name="alert-circle" size={60} color={colors.error} />
      <Text style={[styles.errorText, { color: colors.text }]}>
        Mission non trouvée
      </Text>
      <TouchableOpacity
        style={[styles.backButton, { backgroundColor: colors.primary }]}
        onPress={onRetry}
        activeOpacity={0.7}
      >
        <Text style={styles.backButtonText}>Réessayer</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 20,
  },
  errorText: { fontSize: 18, fontWeight: "600", textAlign: "center" },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
  },
  backButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
