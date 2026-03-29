// components/helpers/TowingDetailModal.tsx - Version avec icônes

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

interface TowingDetailModalProps {
  visible: boolean;
  towing: any;
  colors: any;
  onClose: () => void;
}

const formatDistance = (distance: number) => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }
  return `${distance.toFixed(1)} km`;
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

const getSourceBadge = (source: string) => {
  if (source === "partner") {
    return { label: "Partenaire", icon: "star", color: "#F59E0B" };
  }
  return { label: "Google", icon: "logo-google", color: "#6B7280" };
};

export default function TowingDetailModal({
  visible,
  towing,
  colors,
  onClose,
}: TowingDetailModalProps) {
  if (!towing) return null;

  const sourceBadge = getSourceBadge(towing.source);
  const hasPhone = towing.phone && towing.phone !== "Non disponible";
  const hasWebsite = towing.website && towing.website !== "";
  const basePrice = towing.pricing?.basePrice || 75;
  const perKm = towing.pricing?.perKm || 2;
  const estimatedPrice =
    towing.estimatedPrice || basePrice + perKm * (towing.distance || 0);
  const isAfterHours = towing.isAfterHours || false;
  const vehicleTypes = towing.vehicleTypes || ["voiture", "suv"];

  const handleCall = () => {
    if (hasPhone) {
      Linking.openURL(`tel:${towing.phone}`);
    } else {
      Alert.alert("Information", "Numéro de téléphone non disponible");
    }
  };

  const handleWebsite = () => {
    if (hasWebsite) {
      Linking.openURL(towing.website);
    } else {
      Alert.alert("Information", "Site web non disponible");
    }
  };

  const handleDirections = () => {
    if (towing.location?.coordinates) {
      const [lng, lat] = towing.location.coordinates;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      Linking.openURL(url);
    } else {
      Alert.alert("Information", "Adresse non disponible");
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${towing.name}\n${
          towing.address || "Adresse non disponible"
        }\nNote: ${
          towing.rating?.toFixed(1) || "Nouveau"
        }/5\nDistance: ${formatDistance(
          towing.distance
        )}\nEstimation: ${formatPrice(estimatedPrice)}\n${
          towing.available24h ? "Disponible 24/7\n" : ""
        }${towing.phone ? `Tél: ${towing.phone}\n` : ""}${
          towing.website ? `Site: ${towing.website}` : ""
        }`,
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
            colors={[colors.warning + "10", colors.primary + "05"]}
            style={styles.modalGradient}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.headerLeft}>
                <LinearGradient
                  colors={[colors.warning + "20", colors.warning + "10"]}
                  style={styles.modalIcon}
                >
                  <Ionicons name="car" size={28} color={colors.warning} />
                </LinearGradient>
                <View style={styles.headerText}>
                  <Text
                    style={[styles.towingName, { color: colors.text }]}
                    numberOfLines={2}
                  >
                    {towing.name}
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
              {/* Badge 24/7 */}
              {towing.available24h && (
                <View
                  style={[
                    styles.badge247,
                    { backgroundColor: colors.success + "15" },
                  ]}
                >
                  <Ionicons name="time" size={14} color={colors.success} />
                  <Text
                    style={[styles.badge247Text, { color: colors.success }]}
                  >
                    Disponible 24h/24, 7j/7
                  </Text>
                </View>
              )}

              {/* Distance et note */}
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Ionicons name="location" size={18} color={colors.warning} />
                  <Text
                    style={[styles.infoText, { color: colors.textSecondary }]}
                  >
                    {formatDistance(towing.distance)}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="star" size={18} color="#FFD700" />
                  <Text
                    style={[styles.infoText, { color: colors.textSecondary }]}
                  >
                    {towing.rating?.toFixed(1) || "Nouveau"} / 5
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
                  {towing.address || "Adresse non disponible"}
                </Text>
              </View>

              {/* Types de véhicules */}
              {vehicleTypes.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons
                      name="car-outline"
                      size={18}
                      color={colors.warning}
                    />
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      Véhicules acceptés
                    </Text>
                  </View>
                  <View style={styles.vehicleTypesContainer}>
                    {vehicleTypes.map((type: string) => (
                      <View
                        key={type}
                        style={[
                          styles.vehicleTag,
                          { backgroundColor: colors.warning + "10" },
                        ]}
                      >
                        <Text
                          style={[
                            styles.vehicleText,
                            { color: colors.warning },
                          ]}
                        >
                          {type}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Tarifs */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="cash-outline"
                    size={18}
                    color={colors.success}
                  />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Tarifs
                  </Text>
                </View>
                <View
                  style={[
                    styles.pricingCard,
                    { backgroundColor: colors.background },
                  ]}
                >
                  <View style={styles.pricingRow}>
                    <Text
                      style={[
                        styles.pricingLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Prix de base
                    </Text>
                    <Text style={[styles.pricingValue, { color: colors.text }]}>
                      {formatPrice(basePrice)}
                    </Text>
                  </View>
                  <View style={styles.pricingRow}>
                    <Text
                      style={[
                        styles.pricingLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Frais par km
                    </Text>
                    <Text style={[styles.pricingValue, { color: colors.text }]}>
                      {formatPrice(perKm)}/km
                    </Text>
                  </View>
                  {isAfterHours && (
                    <View style={styles.pricingRow}>
                      <Text
                        style={[styles.pricingLabel, { color: colors.warning }]}
                      >
                        Supplément nuit/week-end
                      </Text>
                      <Text
                        style={[styles.pricingValue, { color: colors.warning }]}
                      >
                        {formatPrice(towing.pricing?.afterHours || 50)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.pricingDivider} />
                  <View style={styles.pricingRow}>
                    <Text
                      style={[
                        styles.pricingLabel,
                        { color: colors.success, fontWeight: "bold" },
                      ]}
                    >
                      Estimation
                    </Text>
                    <Text
                      style={[
                        styles.pricingValue,
                        { color: colors.success, fontWeight: "bold" },
                      ]}
                    >
                      {formatPrice(estimatedPrice)}
                    </Text>
                  </View>
                </View>
              </View>

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
                    { backgroundColor: colors.warning + "10" },
                  ]}
                  onPress={handleDirections}
                >
                  <Ionicons name="navigate" size={20} color={colors.warning} />
                  <Text style={[styles.actionText, { color: colors.warning }]}>
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
  towingName: { fontSize: 18, fontWeight: "bold", marginBottom: 4 },
  sourceBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  sourceText: { fontSize: 11, fontWeight: "500" },
  closeButton: { padding: 4 },
  badge247: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  badge247Text: { fontSize: 12, fontWeight: "600" },
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
  vehicleTypesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginLeft: 26,
  },
  vehicleTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  vehicleText: { fontSize: 12, fontWeight: "500" },
  pricingCard: { borderRadius: 16, padding: 12, gap: 8, marginLeft: 26 },
  pricingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pricingLabel: { fontSize: 13 },
  pricingValue: { fontSize: 14, fontWeight: "500" },
  pricingDivider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.05)",
    marginVertical: 6,
  },
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
