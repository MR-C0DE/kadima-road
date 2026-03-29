// helpers/components/profile/ProfileMenu.tsx
// Version avec titres, sans lignes séparatrices, design amélioré

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { HelperProfile } from "./types";

interface ProfileMenuProps {
  profile: HelperProfile | null;
  colors: any;
  onMenuItemPress: (itemId: string) => void;
}

export default function ProfileMenu({
  profile,
  colors,
  onMenuItemPress,
}: ProfileMenuProps) {
  // Utilitaires pour les compteurs
  const getServiceCount = () => profile?.services?.length || 0;
  const getEquipmentCount = () => profile?.equipment?.length || 0;
  const getDocumentCount = () =>
    Object.values(profile?.documents || {}).filter((d: any) => d?.url).length;

  return (
    <View style={styles.menuSection}>
      {/* ============================================
          SECTION GESTION (titre stylisé)
      ============================================ */}
      <View style={styles.sectionHeader}>
        <LinearGradient
          colors={[colors.primary + "20", colors.secondary + "10"]}
          style={styles.sectionIcon}
        >
          <Ionicons name="settings-outline" size={14} color={colors.primary} />
        </LinearGradient>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Gestion
        </Text>
      </View>

      {/* Services */}
      <TouchableOpacity
        style={[styles.menuItem, { backgroundColor: colors.card }]}
        onPress={() => onMenuItemPress("services")}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={[colors.primary + "20", colors.secondary + "10"]}
          style={styles.menuIconContainer}
        >
          <Ionicons name="construct" size={22} color={colors.primary} />
        </LinearGradient>
        <View style={styles.menuContent}>
          <Text style={[styles.menuTitle, { color: colors.text }]}>
            Services
          </Text>
          <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
            {getServiceCount()} service{getServiceCount() !== 1 ? "s" : ""}{" "}
            proposé{getServiceCount() !== 1 ? "s" : ""}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {/* Équipement */}
      <TouchableOpacity
        style={[styles.menuItem, { backgroundColor: colors.card }]}
        onPress={() => onMenuItemPress("equipment")}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={[colors.primary + "20", colors.secondary + "10"]}
          style={styles.menuIconContainer}
        >
          <Ionicons name="build" size={22} color={colors.primary} />
        </LinearGradient>
        <View style={styles.menuContent}>
          <Text style={[styles.menuTitle, { color: colors.text }]}>
            Équipement
          </Text>
          <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
            {getEquipmentCount()} équipement
            {getEquipmentCount() !== 1 ? "s" : ""}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {/* Zone d'intervention */}
      <TouchableOpacity
        style={[styles.menuItem, { backgroundColor: colors.card }]}
        onPress={() => onMenuItemPress("zone")}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={[colors.primary + "20", colors.secondary + "10"]}
          style={styles.menuIconContainer}
        >
          <Ionicons name="location" size={22} color={colors.primary} />
        </LinearGradient>
        <View style={styles.menuContent}>
          <Text style={[styles.menuTitle, { color: colors.text }]}>
            Zone d'intervention
          </Text>
          <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
            {profile?.serviceArea.radius || 20} km -{" "}
            {profile?.address ||
              profile?.serviceArea?.address ||
              "Adresse non définie"}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {/* Tarifs */}
      <TouchableOpacity
        style={[styles.menuItem, { backgroundColor: colors.card }]}
        onPress={() => onMenuItemPress("pricing")}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={[colors.primary + "20", colors.secondary + "10"]}
          style={styles.menuIconContainer}
        >
          <Ionicons name="cash" size={22} color={colors.primary} />
        </LinearGradient>
        <View style={styles.menuContent}>
          <Text style={[styles.menuTitle, { color: colors.text }]}>Tarifs</Text>
          <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
            {profile?.pricing.basePrice || 25}$ de base +{" "}
            {profile?.pricing.perKm || 1}$/km
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {/* Documents */}
      <TouchableOpacity
        style={[styles.menuItem, { backgroundColor: colors.card }]}
        onPress={() => onMenuItemPress("documents")}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={[colors.primary + "20", colors.secondary + "10"]}
          style={styles.menuIconContainer}
        >
          <Ionicons name="document" size={22} color={colors.primary} />
        </LinearGradient>
        <View style={styles.menuContent}>
          <Text style={[styles.menuTitle, { color: colors.text }]}>
            Documents
          </Text>
          <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
            {getDocumentCount()} document{getDocumentCount() !== 1 ? "s" : ""}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {/* ============================================
          SECTION PRÉFÉRENCES (titre stylisé)
      ============================================ */}
      <View style={styles.sectionHeader}>
        <LinearGradient
          colors={[colors.primary + "20", colors.secondary + "10"]}
          style={styles.sectionIcon}
        >
          <Ionicons name="heart-outline" size={14} color={colors.primary} />
        </LinearGradient>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Préférences
        </Text>
      </View>

      {/* Apparence */}
      <TouchableOpacity
        style={[styles.menuItem, { backgroundColor: colors.card }]}
        onPress={() => onMenuItemPress("appearance")}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={[colors.primary + "20", colors.secondary + "10"]}
          style={styles.menuIconContainer}
        >
          <Ionicons name="color-palette" size={22} color={colors.primary} />
        </LinearGradient>
        <View style={styles.menuContent}>
          <Text style={[styles.menuTitle, { color: colors.text }]}>
            Apparence
          </Text>
          <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
            Thème, langue
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {/* Notifications */}
      <TouchableOpacity
        style={[styles.menuItem, { backgroundColor: colors.card }]}
        onPress={() => onMenuItemPress("notifications")}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={[colors.primary + "20", colors.secondary + "10"]}
          style={styles.menuIconContainer}
        >
          <Ionicons name="notifications" size={22} color={colors.primary} />
        </LinearGradient>
        <View style={styles.menuContent}>
          <Text style={[styles.menuTitle, { color: colors.text }]}>
            Notifications
          </Text>
          <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
            Push, email, SMS
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {/* ============================================
          SECTION COMPTE (titre stylisé)
      ============================================ */}
      <View style={styles.sectionHeader}>
        <LinearGradient
          colors={[colors.primary + "20", colors.secondary + "10"]}
          style={styles.sectionIcon}
        >
          <Ionicons name="person-outline" size={14} color={colors.primary} />
        </LinearGradient>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Compte
        </Text>
      </View>

      {/* Compte et sécurité */}
      <TouchableOpacity
        style={[styles.menuItem, { backgroundColor: colors.card }]}
        onPress={() => onMenuItemPress("account")}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={[colors.primary + "20", colors.secondary + "10"]}
          style={styles.menuIconContainer}
        >
          <Ionicons name="person" size={22} color={colors.primary} />
        </LinearGradient>
        <View style={styles.menuContent}>
          <Text style={[styles.menuTitle, { color: colors.text }]}>
            Compte et sécurité
          </Text>
          <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
            Profil, mot de passe
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {/* Aide et support */}
      <TouchableOpacity
        style={[styles.menuItem, { backgroundColor: colors.card }]}
        onPress={() => onMenuItemPress("support")}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={[colors.primary + "20", colors.secondary + "10"]}
          style={styles.menuIconContainer}
        >
          <Ionicons name="help-circle" size={22} color={colors.primary} />
        </LinearGradient>
        <View style={styles.menuContent}>
          <Text style={[styles.menuTitle, { color: colors.text }]}>
            Aide et support
          </Text>
          <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
            Centre d'aide, contact
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {/* À propos */}
      <TouchableOpacity
        style={[styles.menuItem, { backgroundColor: colors.card }]}
        onPress={() => onMenuItemPress("about")}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={[colors.primary + "20", colors.secondary + "10"]}
          style={styles.menuIconContainer}
        >
          <Ionicons
            name="information-circle"
            size={22}
            color={colors.primary}
          />
        </LinearGradient>
        <View style={styles.menuContent}>
          <Text style={[styles.menuTitle, { color: colors.text }]}>
            À propos
          </Text>
          <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
            Version, conditions
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
    gap: 8,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 18,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
