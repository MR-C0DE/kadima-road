import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { HelperProfile, ModalType } from "./types";

interface ProfileMenuProps {
  profile: HelperProfile | null;
  colors: any;
  onMenuItemPress: (modalType: ModalType) => void;
}

export default function ProfileMenu({
  profile,
  colors,
  onMenuItemPress,
}: ProfileMenuProps) {
  return (
    <View style={styles.menuSection}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Gestion</Text>

      <TouchableOpacity
        style={[styles.menuItem, { backgroundColor: colors.card }]}
        onPress={() => onMenuItemPress("services")}
      >
        <LinearGradient
          colors={[colors.primary + "20", colors.secondary + "10"]}
          style={styles.menuIconContainer}
        >
          <Ionicons name="construct" size={24} color={colors.primary} />
        </LinearGradient>
        <View style={styles.menuContent}>
          <Text style={[styles.menuTitle, { color: colors.text }]}>
            Services
          </Text>
          <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
            {profile?.services?.length || 0} services proposés
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.menuItem, { backgroundColor: colors.card }]}
        onPress={() => onMenuItemPress("equipment")}
      >
        <LinearGradient
          colors={[colors.primary + "20", colors.secondary + "10"]}
          style={styles.menuIconContainer}
        >
          <Ionicons name="build" size={24} color={colors.primary} />
        </LinearGradient>
        <View style={styles.menuContent}>
          <Text style={[styles.menuTitle, { color: colors.text }]}>
            Équipement
          </Text>
          <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
            {profile?.equipment?.length || 0} équipements
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.menuItem, { backgroundColor: colors.card }]}
        onPress={() => onMenuItemPress("zone")}
      >
        <LinearGradient
          colors={[colors.primary + "20", colors.secondary + "10"]}
          style={styles.menuIconContainer}
        >
          <Ionicons name="location" size={24} color={colors.primary} />
        </LinearGradient>
        <View style={styles.menuContent}>
          <Text style={[styles.menuTitle, { color: colors.text }]}>
            Zone d'intervention
          </Text>
          <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
            {profile?.serviceArea.radius || 20} km -{" "}
            {profile?.serviceArea.address || "Adresse non définie"}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.menuItem, { backgroundColor: colors.card }]}
        onPress={() => onMenuItemPress("pricing")}
      >
        <LinearGradient
          colors={[colors.primary + "20", colors.secondary + "10"]}
          style={styles.menuIconContainer}
        >
          <Ionicons name="cash" size={24} color={colors.primary} />
        </LinearGradient>
        <View style={styles.menuContent}>
          <Text style={[styles.menuTitle, { color: colors.text }]}>Tarifs</Text>
          <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
            ${profile?.pricing.basePrice || 25} de base + $
            {profile?.pricing.perKm || 1}/km
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.menuItem, { backgroundColor: colors.card }]}
        onPress={() => onMenuItemPress("documents")}
      >
        <LinearGradient
          colors={[colors.primary + "20", colors.secondary + "10"]}
          style={styles.menuIconContainer}
        >
          <Ionicons name="document" size={24} color={colors.primary} />
        </LinearGradient>
        <View style={styles.menuContent}>
          <Text style={[styles.menuTitle, { color: colors.text }]}>
            Documents
          </Text>
          <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
            {profile?.documents?.length || 0} documents
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.menuItem, { backgroundColor: colors.card }]}
        onPress={() => onMenuItemPress("preferences")}
      >
        <LinearGradient
          colors={[colors.primary + "20", colors.secondary + "10"]}
          style={styles.menuIconContainer}
        >
          <Ionicons name="settings" size={24} color={colors.primary} />
        </LinearGradient>
        <View style={styles.menuContent}>
          <Text style={[styles.menuTitle, { color: colors.text }]}>
            Préférences
          </Text>
          <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
            Langue, thème, notifications
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  menuSection: {
    gap: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    gap: 12,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
  },
});
