import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HelperProfile } from "./types";

const { width } = Dimensions.get("window");

interface ProfileStatsProps {
  profile: HelperProfile | null;
  colors: any;
}

export default function ProfileStats({ profile, colors }: ProfileStatsProps) {
  return (
    <View style={styles.statsGrid}>
      <View style={[styles.statBox, { backgroundColor: colors.card }]}>
        <Ionicons name="car" size={24} color={colors.primary} />
        <Text style={[styles.statNumber, { color: colors.text }]}>
          {profile?.stats.totalInterventions || 0}
        </Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
          Interventions
        </Text>
      </View>

      <View style={[styles.statBox, { backgroundColor: colors.card }]}>
        <Ionicons name="star" size={24} color="#FFD700" />
        <Text style={[styles.statNumber, { color: colors.text }]}>
          {profile?.stats.averageRating?.toFixed(1) || "0.0"}
        </Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
          Note
        </Text>
      </View>

      <View style={[styles.statBox, { backgroundColor: colors.card }]}>
        <Ionicons name="trending-up" size={24} color="#4CAF50" />
        <Text style={[styles.statNumber, { color: colors.text }]}>
          {profile?.stats.responseRate || 0}%
        </Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
          Acceptation
        </Text>
      </View>

      <View style={[styles.statBox, { backgroundColor: colors.card }]}>
        <Ionicons name="wallet" size={24} color="#FF9800" />
        <Text style={[styles.statNumber, { color: colors.text }]}>
          ${profile?.stats.totalEarnings?.toFixed(0) || 0}
        </Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
          Gains
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  statBox: {
    width: (width - 52) / 2,
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
    gap: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
  },
});
