import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { HelperProfile } from "./types";
import { getStatusColor, getStatusText } from "./constants";

interface ProfileHeaderProps {
  profile: HelperProfile | null;
  colors: any;
  onPhotoPress: () => void;
}

export default function ProfileHeader({
  profile,
  colors,
  onPhotoPress,
}: ProfileHeaderProps) {
  return (
    <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
      <View style={styles.profileHeader}>
        <TouchableOpacity onPress={onPhotoPress} style={styles.avatarContainer}>
          {profile?.user.photo ? (
            <Image
              source={{ uri: profile.user.photo }}
              style={styles.avatarImage}
            />
          ) : (
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.avatarGradient}
            >
              <View style={styles.avatarInner}>
                <Text style={styles.avatarText}>
                  {profile?.user.firstName?.[0]}
                  {profile?.user.lastName?.[0]}
                </Text>
              </View>
            </LinearGradient>
          )}
          <View style={[styles.editBadge, { backgroundColor: colors.primary }]}>
            <Ionicons name="camera" size={12} color="#fff" />
          </View>
        </TouchableOpacity>

        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: colors.text }]}>
            {profile?.user.firstName} {profile?.user.lastName}
          </Text>
          <View style={styles.badgeContainer}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    getStatusColor(profile?.status || "pending") + "20",
                },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: getStatusColor(
                      profile?.status || "pending"
                    ),
                  },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(profile?.status || "pending") },
                ]}
              >
                {getStatusText(profile?.status || "pending")}
              </Text>
            </View>

            {profile?.certification.isCertified && (
              <View
                style={[
                  styles.certBadge,
                  { backgroundColor: "#4CAF50" + "20" },
                ]}
              >
                <Ionicons name="ribbon" size={12} color="#4CAF50" />
                <Text style={[styles.certText, { color: "#4CAF50" }]}>
                  Certifié
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.contactSection}>
        <View style={styles.contactRow}>
          <Ionicons name="mail-outline" size={18} color={colors.primary} />
          <Text style={[styles.contactText, { color: colors.text }]}>
            {profile?.user.email}
          </Text>
        </View>
        <View style={styles.contactRow}>
          <Ionicons name="call-outline" size={18} color={colors.primary} />
          <Text style={[styles.contactText, { color: colors.text }]}>
            {profile?.user.phone}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatarContainer: {
    position: "relative",
  },
  avatarGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    padding: 3,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 37,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: "row",
    gap: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "500",
  },
  certBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  certText: {
    fontSize: 11,
    fontWeight: "500",
  },
  contactSection: {
    marginTop: 16,
    gap: 8,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  contactText: {
    fontSize: 13,
    flex: 1,
  },
});
