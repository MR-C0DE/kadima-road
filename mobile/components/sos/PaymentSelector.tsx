// components/sos/PaymentSelector.tsx - Version sans paiement
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface PaymentSelectorProps {
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
  colors: any;
}

export const PaymentSelector = ({
  amount,
  onSuccess,
  onCancel,
  colors,
}: PaymentSelectorProps) => {
  const handleContinue = () => {
    // Simuler un paiement réussi
    onSuccess("simulated_payment_" + Date.now());
  };

  return (
    <View style={styles.container}>
      {/* Montant */}
      <View style={[styles.amountCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>
          Montant estimé
        </Text>
        <Text style={[styles.amountValue, { color: colors.primary }]}>
          ${amount.toFixed(2)}
        </Text>
        <Text style={[styles.amountHint, { color: colors.textSecondary }]}>
          Paiement à la fin de l'intervention
        </Text>
      </View>

      {/* Boutons */}
      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.cancelButton, { borderColor: colors.border }]}
          onPress={onCancel}
        >
          <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
            Annuler
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.payButton, { backgroundColor: colors.primary }]}
          onPress={handleContinue}
        >
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.payButtonText}>Continuer</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.note, { color: colors.textSecondary }]}>
        Le paiement sera prélevé après l'intervention
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 20,
  },
  amountCard: {
    padding: 24,
    borderRadius: 24,
    alignItems: "center",
    gap: 8,
  },
  amountLabel: {
    fontSize: 14,
  },
  amountValue: {
    fontSize: 40,
    fontWeight: "bold",
  },
  amountHint: {
    fontSize: 12,
    textAlign: "center",
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 30,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "500",
  },
  payButton: {
    flex: 2,
    padding: 16,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  payButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  note: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 20,
  },
});
