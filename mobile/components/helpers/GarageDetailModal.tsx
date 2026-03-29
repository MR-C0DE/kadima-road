// components/helpers/GarageDetailModal.tsx - Version avec icônes

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
  Share,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

interface GarageDetailModalProps {
  visible: boolean;
  garage: any;
  colors: any;
  onClose: () => void;
}

const formatDistance = (distance: number) => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }
  return `${distance.toFixed(1)} km`;
};

const getSourceBadge = (source: string) => {
  if (source === "partner") {
    return { label: "Partenaire", icon: "star", color: "#F59E0B" };
  }
  return { label: "Google", icon: "logo-google", color: "#6B7280" };
};

export default function GarageDetailModal({
  visible,
  garage,
  colors,
  onClose,
}: GarageDetailModalProps) {
  if (!garage) return null;

  const sourceBadge = getSourceBadge(garage.source);
  const hasPhone = garage.phone && garage.phone !== "Non disponible";
  const hasWebsite = garage.website && garage.website !== "";
  const hasOpeningHours = garage.openingHours && garage.openingHours !== "";
  const services = garage.services || [];

  const handleCall = () => {
    if (hasPhone) {
      Linking.openURL(`tel:${garage.phone}`);
    } else {
      Alert.alert("Information", "Numéro de téléphone non disponible");
    }
  };

  const handleWebsite = () => {
    if (hasWebsite) {
      Linking.openURL(garage.website);
    } else {
      Alert.alert("Information", "Site web non disponible");
    }
  };

  const handleDirections = () => {
    if (garage.location?.coordinates) {
      const [lng, lat] = garage.location.coordinates;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      Linking.openURL(url);
    } else {
      Alert.alert("Information", "Adresse non disponible");
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${garage.name}\n${garage.address}\nNote: ${
          garage.rating?.toFixed(1) || "Nouveau"
        }/5\nDistance: ${formatDistance(garage.distance)}\n${
          garage.phone ? `Tél: ${garage.phone}\n` : ""
        }${garage.website ? `Site: ${garage.website}` : ""}`,
      });
    } catch (error) {
      console.error("Erreur partage:", error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView
        intensity={90}
        style={styles.modalOverlay}
        tint={Platform.OS === "ios" ? "dark" : "default"}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          activeOpacity={1}
        />

        <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
          <LinearGradient
            colors={[colors.primary + "10", colors.secondary + "05"]}
            style={styles.modalGradient}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.headerLeft}>
                <LinearGradient
                  colors={[colors.primary + "20", colors.secondary + "10"]}
                  style={styles.modalIcon}
                >
                  <Ionicons name="business" size={28} color={colors.primary} />
                </LinearGradient>
                <View style={styles.headerText}>
                  <Text
                    style={[styles.garageName, { color: colors.text }]}
                    numberOfLines={2}
                  >
                    {garage.name}
                  </Text>
                  <View style={styles.sourceBadge}>
                    <Ionicons
                      name={sourceBadge.icon as any}
                      size={12}
                      color={sourceBadge.color}
                    />
                    <Text
                      style={[styles.sourceText, { color: sourceBadge.color }]}
                    >
                      {sourceBadge.label}
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Distance et note */}
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Ionicons name="location" size={18} color={colors.primary} />
                  <Text
                    style={[styles.infoText, { color: colors.textSecondary }]}
                  >
                    {formatDistance(garage.distance)}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="star" size={18} color="#FFD700" />
                  <Text
                    style={[styles.infoText, { color: colors.textSecondary }]}
                  >
                    {garage.rating?.toFixed(1) || "Nouveau"} / 5
                  </Text>
                </View>
              </View>

              {/* Adresse */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="location-outline"
                    size={18}
                    color={colors.primary}
                  />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Adresse
                  </Text>
                </View>
                <Text
                  style={[
                    styles.sectionContent,
                    { color: colors.textSecondary },
                  ]}
                  numberOfLines={3}
                >
                  {garage.address || "Adresse non disponible"}
                </Text>
              </View>

              {/* Services */}
              {services.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons
                      name="construct-outline"
                      size={18}
                      color={colors.primary}
                    />
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      Services
                    </Text>
                  </View>
                  <View style={styles.servicesContainer}>
                    {services.map((service: string) => (
                      <View
                        key={service}
                        style={[
                          styles.serviceTag,
                          { backgroundColor: colors.primary + "10" },
                        ]}
                      >
                        <Text
                          style={[
                            styles.serviceText,
                            { color: colors.primary },
                          ]}
                        >
                          {service}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Horaires */}
              {hasOpeningHours && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons
                      name="time-outline"
                      size={18}
                      color={colors.primary}
                    />
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      Horaires
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.sectionContent,
                      { color: colors.textSecondary },
                    ]}
                    numberOfLines={3}
                  >
                    {garage.openingHours}
                  </Text>
                </View>
              )}

              {/* Actions */}
              <View style={styles.actionsContainer}>
                {hasPhone && (
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: colors.success + "10" },
                    ]}
                    onPress={handleCall}
                  >
                    <Ionicons name="call" size={20} color={colors.success} />
                    <Text
                      style={[styles.actionText, { color: colors.success }]}
                    >
                      Appeler
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: colors.primary + "10" },
                  ]}
                  onPress={handleDirections}
                >
                  <Ionicons name="navigate" size={20} color={colors.primary} />
                  <Text style={[styles.actionText, { color: colors.primary }]}>
                    Itinéraire
                  </Text>
                </TouchableOpacity>
                {hasWebsite && (
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: colors.info + "10" },
                    ]}
                    onPress={handleWebsite}
                  >
                    <Ionicons name="globe" size={20} color={colors.info} />
                    <Text style={[styles.actionText, { color: colors.info }]}>
                      Site web
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: colors.textSecondary + "10" },
                  ]}
                  onPress={handleShare}
                >
                  <Ionicons
                    name="share"
                    size={20}
                    color={colors.textSecondary}
                  />
                  <Text
                    style={[styles.actionText, { color: colors.textSecondary }]}
                  >
                    Partager
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </LinearGradient>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center" },
  modalContainer: {
    width: "90%",
    maxHeight: "80%",
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 20,
  },
  modalGradient: { padding: 20 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  modalIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: { flex: 1 },
  garageName: { fontSize: 18, fontWeight: "bold", marginBottom: 4 },
  sourceBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  sourceText: { fontSize: 11, fontWeight: "500" },
  closeButton: { padding: 4 },
  infoRow: { flexDirection: "row", gap: 20, marginBottom: 20 },
  infoItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  infoText: { fontSize: 14 },
  section: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 14, fontWeight: "600" },
  sectionContent: { fontSize: 14, lineHeight: 20, marginLeft: 26 },
  servicesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginLeft: 26,
  },
  serviceTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  serviceText: { fontSize: 12, fontWeight: "500" },
  actionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
    marginBottom: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
  },
  actionText: { fontSize: 14, fontWeight: "500" },
});
