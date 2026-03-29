// helpers/components/missions/MissionsHeader.tsx
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

interface MissionsHeaderProps {
  onBack: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  colors: any;
}

export const MissionsHeader = ({
  onBack,
  onRefresh,
  refreshing,
  colors,
}: MissionsHeaderProps) => {
  return (
    <LinearGradient
      colors={[colors.primary, colors.secondary]}
      style={styles.header}
    >
      <View style={styles.headerContent}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.headerButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Missions</Text>
        <TouchableOpacity
          onPress={onRefresh}
          style={styles.headerButton}
          activeOpacity={0.7}
        >
          <Ionicons
            name="refresh"
            size={24}
            color="#fff"
            style={{ transform: [{ rotate: refreshing ? "180deg" : "0deg" }] }}
          />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
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
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#fff" },
});
