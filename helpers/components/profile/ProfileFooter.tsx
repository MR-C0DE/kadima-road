import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

interface ProfileFooterProps {
  colors: any;
  onLogout: () => void;
}

export default function ProfileFooter({
  colors,
  onLogout,
}: ProfileFooterProps) {
  return (
    <View style={styles.footerSection}>
      <TouchableOpacity
        style={[styles.supportButton, { backgroundColor: colors.card }]}
        onPress={() => Linking.openURL("mailto:support@kadimaroad.com")}
      >
        <Ionicons name="help-circle-outline" size={20} color={colors.primary} />
        <Text style={[styles.supportText, { color: colors.text }]}>
          Centre d'aide
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
        <LinearGradient
          colors={["#F44336", "#D32F2F"]}
          style={styles.logoutGradient}
        >
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </LinearGradient>
      </TouchableOpacity>
      <Text style={[styles.versionText, { color: colors.textSecondary }]}>
        Version 1.0.0
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footerSection: { gap: 12 },
  supportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 30,
    gap: 8,
  },
  supportText: { fontSize: 14, fontWeight: "500" },
  logoutButton: { borderRadius: 30, overflow: "hidden" },
  logoutGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 8,
  },
  logoutText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  versionText: {
    textAlign: "center",
    fontSize: 11,
    marginTop: 8,
    marginBottom: 20,
  },
});
