// components/profile/PersonalInfoCard.tsx - Version avec copie et bouton modifier

import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Animated,
  ActivityIndicator, // ✅ AJOUT DE L'IMPORT MANQUANT
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import { Colors } from "@/constants/theme";
import Toast from "react-native-toast-message";

interface PersonalInfoCardProps {
  userDetails: any;
}

// Composant InfoRow avec animation au toucher
const InfoRow = ({
  icon,
  value,
  label,
  colors,
  isLink = false,
  onPress,
  isCopiable = false,
  copyValue,
}: {
  icon: string;
  value: string;
  label: string;
  colors: any;
  isLink?: boolean;
  onPress?: () => void;
  isCopiable?: boolean;
  copyValue?: string;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (isLink || isCopiable) {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }).start();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    if (isLink || isCopiable) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleCopy = async () => {
    if (!isCopiable || !copyValue) return;
    await Clipboard.setStringAsync(copyValue);
    Toast.show({
      type: "success",
      text1: "Copié !",
      text2: `${label} copié dans le presse-papier`,
      position: "bottom",
      visibilityTime: 2000,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handlePress = () => {
    if (isCopiable) {
      handleCopy();
    } else if (onPress) {
      onPress();
    }
  };

  return (
    <Animated.View
      style={[
        styles.infoRow,
        { transform: [{ scale: scaleAnim }] },
        (isLink || isCopiable) && styles.infoRowPressable,
      ]}
    >
      <TouchableOpacity
        style={styles.infoRowTouchable}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        disabled={!isLink && !isCopiable}
      >
        <LinearGradient
          colors={[colors.primary + "15", colors.primary + "05"]}
          style={styles.infoIconBg}
        >
          <Ionicons name={icon as any} size={18} color={colors.primary} />
        </LinearGradient>

        <View style={styles.infoContent}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
            {label}
          </Text>
          <Text
            style={[styles.infoText, { color: colors.text }]}
            numberOfLines={1}
          >
            {value || "Non renseigné"}
          </Text>
        </View>

        {(isLink || isCopiable) && (
          <LinearGradient
            colors={[colors.primary + "10", colors.primary + "05"]}
            style={styles.actionIcon}
          >
            <Ionicons
              name={isCopiable ? "copy-outline" : "chevron-forward"}
              size={16}
              color={colors.primary}
            />
          </LinearGradient>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Fonctions utilitaires
const formatPhoneNumber = (phone: string) => {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `+1 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(
      6,
      10
    )}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith("1")) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(
      7,
      11
    )}`;
  }
  return phone;
};

const formatMemberSince = (dateString?: string) => {
  if (!dateString) return "Date inconnue";
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
};

export default function PersonalInfoCard({
  userDetails,
}: PersonalInfoCardProps) {
  const router = useRouter();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme ?? "light"];
  const [sharing, setSharing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const shareProfile = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      await Share.share({
        message: `🚗 ${userDetails?.firstName} ${userDetails?.lastName}\n📧 ${userDetails?.email}\n📞 ${userDetails?.phone}\n\nPartagé depuis Kadima Road`,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.log("Erreur partage:", error);
    } finally {
      setSharing(false);
    }
  };

  const handleEditProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/settings/account");
  };

  const phoneNumber = userDetails?.phone
    ? formatPhoneNumber(userDetails.phone)
    : null;

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        },
      ]}
    >
      {/* Fond décoratif glassmorphism */}
      <LinearGradient
        colors={[colors.primary + "08", colors.secondary + "03"]}
        style={styles.cardBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* En-tête avec bouton modifier */}
      <View style={styles.cardHeader}>
        <LinearGradient
          colors={[colors.primary + "20", colors.secondary + "10"]}
          style={styles.cardIcon}
        >
          <Ionicons name="person" size={20} color={colors.primary} />
        </LinearGradient>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          Informations personnelles
        </Text>

        {/* Bouton modifier */}
        <TouchableOpacity
          onPress={handleEditProfile}
          style={styles.editButton}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={[colors.primary + "15", colors.primary + "05"]}
            style={styles.editIcon}
          >
            <Ionicons name="create-outline" size={16} color={colors.primary} />
          </LinearGradient>
        </TouchableOpacity>

        {/* Bouton partage */}
        <TouchableOpacity
          onPress={shareProfile}
          disabled={sharing}
          style={styles.shareButton}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={[colors.primary + "15", colors.primary + "05"]}
            style={styles.shareIcon}
          >
            {sharing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="share-outline" size={16} color={colors.primary} />
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Contenu des informations */}
      <View style={styles.cardContent}>
        <InfoRow
          icon="person-outline"
          value={`${userDetails?.firstName} ${userDetails?.lastName}`}
          label="Nom complet"
          colors={colors}
        />

        {phoneNumber && (
          <InfoRow
            icon="call-outline"
            value={phoneNumber}
            label="Téléphone"
            colors={colors}
            isCopiable={true}
            copyValue={userDetails?.phone}
          />
        )}

        <InfoRow
          icon="mail-outline"
          value={userDetails?.email || "Non renseigné"}
          label="Email"
          colors={colors}
          isCopiable={true}
          copyValue={userDetails?.email}
        />

        <InfoRow
          icon="calendar-outline"
          value={`Membre depuis ${formatMemberSince(userDetails?.createdAt)}`}
          label="Date d'inscription"
          colors={colors}
        />

        {/* Section des contacts d'urgence (si existants) */}
        {userDetails?.emergencyContacts &&
          userDetails.emergencyContacts.length > 0 && (
            <View style={styles.emergencySection}>
              <View style={styles.emergencyHeader}>
                <Ionicons
                  name="warning-outline"
                  size={14}
                  color={colors.error}
                />
                <Text style={[styles.emergencyTitle, { color: colors.error }]}>
                  Contacts d'urgence
                </Text>
              </View>
              {userDetails.emergencyContacts
                .slice(0, 2)
                .map((contact: any, index: number) => (
                  <InfoRow
                    key={contact._id || index}
                    icon="person-circle-outline"
                    value={`${contact.name} • ${formatPhoneNumber(
                      contact.phone
                    )}`}
                    label={contact.relationship || "Contact"}
                    colors={colors}
                    isCopiable={true}
                    copyValue={contact.phone}
                  />
                ))}
              {userDetails.emergencyContacts.length > 2 && (
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() => router.push("/settings/emergency")}
                >
                  <Text style={[styles.viewAllText, { color: colors.primary }]}>
                    +{userDetails.emergencyContacts.length - 2} autres contacts
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              )}
            </View>
          )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    position: "relative",
    overflow: "hidden",
  },
  cardBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    letterSpacing: -0.3,
  },
  editButton: {
    padding: 4,
  },
  editIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  shareButton: {
    padding: 4,
  },
  shareIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    gap: 14,
  },
  infoRow: {
    borderRadius: 16,
    overflow: "hidden",
  },
  infoRowPressable: {
    // Style pour les lignes interactives
  },
  infoRowTouchable: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 12,
  },
  infoIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  infoText: {
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: -0.2,
  },
  actionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  // Section contacts d'urgence
  emergencySection: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  emergencyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  emergencyTitle: {
    fontSize: 12,
    fontWeight: "600",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    paddingTop: 8,
    marginTop: 4,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
