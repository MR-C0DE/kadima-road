// helpers/components/missions/details/MissionHeader.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

interface MissionHeaderProps {
  status: string;
  statusConfig: { label: string; color: string; bgColor: string };
  isConnected: boolean;
  onBack: () => void;
  onMinimize: () => void;
  minimized: boolean;
  colors: any;
}

export const MissionHeader = ({
  status,
  statusConfig,
  isConnected,
  onBack,
  onMinimize,
  minimized,
  colors,
}: MissionHeaderProps) => {
  return (
    <LinearGradient
      colors={[colors.primary, colors.secondary]}
      style={styles.headerGradient}
    >
      <View style={styles.headerContent}>
        {/* ✅ Bouton retour simple - seulement l'icône */}
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>Mission</Text>
        </View>

        <TouchableOpacity
          onPress={onMinimize}
          style={styles.minimizeButton}
          activeOpacity={0.7}
        >
          <Ionicons
            name={minimized ? "expand" : "contract"}
            size={24}
            color="#fff"
          />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  headerGradient: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitles: { alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#fff" },
  minimizeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
});
