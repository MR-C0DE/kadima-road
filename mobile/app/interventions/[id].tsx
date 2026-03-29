// app/interventions/[id].tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Dimensions,
  Platform,
  StatusBar,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { Colors } from "@/constants/theme";
import { api } from "../../config/api";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");

interface Intervention {
  _id: string;
  type: string;
  status: string;
  createdAt: string;
  completedAt?: string;
  problem?: {
    description: string;
    category: string;
    severity: string;
    photos?: string[];
  };
  location: {
    address: string;
    coordinates: [number, number];
  };
  helper?: {
    _id: string;
    user: {
      firstName: string;
      lastName: string;
      phone: string;
      photo?: string;
    };
    rating?: number;
  };
  vehicle?: {
    make: string;
    model: string;
    year: number;
    licensePlate: string;
  };
  pricing?: {
    estimated: number;
    final: number;
    distance: number;
    duration: number;
  };
  timeline: Array<{
    status: string;
    timestamp: Date;
    note?: string;
  }>;
  review?: {
    rating: number;
    comment: string;
    createdAt: Date;
  };
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case "completed":
      return {
        color: "#22C55E",
        bgColor: "#22C55E15",
        text: "Terminée",
        icon: "checkmark-circle",
      };
    case "pending":
      return {
        color: "#F59E0B",
        bgColor: "#F59E0B15",
        text: "En attente",
        icon: "time",
      };
    case "accepted":
      return {
        color: "#3B82F6",
        bgColor: "#3B82F615",
        text: "Acceptée",
        icon: "checkmark-circle",
      };
    case "en_route":
      return {
        color: "#8B5CF6",
        bgColor: "#8B5CF615",
        text: "En route",
        icon: "car",
      };
    case "arrived":
      return {
        color: "#22C55E",
        bgColor: "#22C55E15",
        text: "Arrivé",
        icon: "location",
      };
    case "in_progress":
      return {
        color: "#F59E0B",
        bgColor: "#F59E0B15",
        text: "En cours",
        icon: "construct",
      };
    case "cancelled":
      return {
        color: "#EF4444",
        bgColor: "#EF444415",
        text: "Annulée",
        icon: "close-circle",
      };
    default:
      return {
        color: "#6B7280",
        bgColor: "#6B728015",
        text: status,
        icon: "help-circle",
      };
  }
};

const getSeverityConfig = (severity: string) => {
  switch (severity) {
    case "critical":
      return { color: "#EF4444", text: "Critique", icon: "alert-circle" };
    case "high":
      return { color: "#F97316", text: "Élevée", icon: "warning" };
    case "medium":
      return { color: "#F59E0B", text: "Moyenne", icon: "alert" };
    case "low":
      return { color: "#22C55E", text: "Faible", icon: "information-circle" };
    default:
      return { color: "#6B7280", text: "Non spécifiée", icon: "help-circle" };
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
  }).format(price);
};

export default function InterventionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme ?? "light"];

  const [intervention, setIntervention] = useState<Intervention | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (id) {
      loadIntervention();
    }
  }, [id]);

  // Ajouter dans le useEffect
  useEffect(() => {
    if (!id) return;

    loadIntervention();

    // Connexion WebSocket
    const socket = require("../../services/socket").getSocket();
    if (socket) {
      const handleStatusUpdate = (data: any) => {
        if (data.interventionId === id) {
          setIntervention((prev: any) => ({ ...prev, status: data.status }));

          // Vibration selon le type de statut
          if (data.status === "en_route")
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          else if (data.status === "arrived")
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          else if (data.status === "in_progress")
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          else if (data.status === "completed")
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          else if (data.status === "cancelled")
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

          // Afficher un toast
          Toast.show({
            type: data.status === "cancelled" ? "error" : "success",
            text1: getStatusMessage(data.status),
            position: "bottom",
            visibilityTime: 2000,
          });

          if (data.status === "completed") {
            setTimeout(() => {
              router.push(`/interventions/${id}/review`);
            }, 1500);
          }
        }
      };

      socket.on("status-update", handleStatusUpdate);

      return () => {
        socket.off("status-update", handleStatusUpdate);
      };
    }
  }, [id]);

  const loadIntervention = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/interventions/${id}`);
      console.log("Intervention reçue:", response.data.data);
      setIntervention(response.data.data);
    } catch (error) {
      console.error("Erreur chargement intervention:", error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCallHelper = () => {
    if (intervention?.helper?.user?.phone) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Linking.openURL(`tel:${intervention.helper.user.phone}`);
    }
  };

  const handleOpenMaps = () => {
    if (intervention?.location?.coordinates) {
      const [lng, lat] = intervention.location.coordinates;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      Linking.openURL(url);
    }
  };

  const handleAddReview = () => {
    if (intervention?.status === "completed") {
      router.push(`/interventions/${id}/review`);
    } else {
      Alert.alert(
        "Info",
        "Vous pourrez évaluer cette intervention une fois terminée"
      );
    }
  };

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Chargement...
        </Text>
      </View>
    );
  }

  if (error || !intervention) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={60} color={colors.error} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            Intervention non trouvée
          </Text>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            L'intervention que vous recherchez n'existe pas ou a été supprimée.
          </Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const statusConfig = getStatusConfig(intervention.status);
  const severityConfig = getSeverityConfig(
    intervention.problem?.severity || "medium"
  );
  const isCompleted = intervention.status === "completed";
  const hasHelper = !!intervention.helper;
  const hasVehicle = !!intervention.vehicle;
  const hasPricing = !!intervention.pricing?.final;
  const hasReview = !!intervention.review;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Header avec gradient */}
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Détails de l'intervention</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Type et statut */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.typeRow}>
            <View
              style={[
                styles.typeIcon,
                { backgroundColor: colors.primary + "10" },
              ]}
            >
              <Ionicons
                name={
                  intervention.type === "sos" ? "alert-circle" : "construct"
                }
                size={24}
                color={colors.primary}
              />
            </View>
            <Text style={[styles.typeText, { color: colors.text }]}>
              {intervention.type === "sos" ? "SOS Urgence" : "Assistance"}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusConfig.bgColor },
            ]}
          >
            <Ionicons
              name={statusConfig.icon as any}
              size={16}
              color={statusConfig.color}
            />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.text}
            </Text>
          </View>
        </View>

        {/* Problème */}
        {intervention.problem?.description && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.cardHeader}>
              <Ionicons
                name="document-text-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Problème
              </Text>
            </View>
            <Text
              style={[
                styles.problemDescription,
                { color: colors.textSecondary },
              ]}
            >
              {intervention.problem.description}
            </Text>
            <View style={styles.severityRow}>
              <Ionicons
                name={severityConfig.icon as any}
                size={16}
                color={severityConfig.color}
              />
              <Text
                style={[styles.severityText, { color: severityConfig.color }]}
              >
                Gravité : {severityConfig.text}
              </Text>
            </View>
          </View>
        )}

        {/* Véhicule */}
        {hasVehicle && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="car-outline" size={20} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Véhicule
              </Text>
            </View>
            <Text style={[styles.vehicleText, { color: colors.text }]}>
              {intervention.vehicle?.make} {intervention.vehicle?.model} (
              {intervention.vehicle?.year})
            </Text>
            <Text
              style={[styles.vehiclePlate, { color: colors.textSecondary }]}
            >
              {intervention.vehicle?.licensePlate}
            </Text>
          </View>
        )}

        {/* Localisation */}
        {intervention.location?.address && (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.surface }]}
            onPress={handleOpenMaps}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <Ionicons
                name="location-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Localisation
              </Text>
              <Ionicons name="map-outline" size={20} color={colors.primary} />
            </View>
            <Text
              style={[styles.locationText, { color: colors.textSecondary }]}
            >
              {intervention.location.address}
            </Text>
            <Text style={[styles.mapHint, { color: colors.primary }]}>
              Appuyez pour voir l'itinéraire
            </Text>
          </TouchableOpacity>
        )}

        {/* Helper */}
        {hasHelper && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.cardHeader}>
              <Ionicons
                name="person-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Helper
              </Text>
            </View>
            <View style={styles.helperRow}>
              <View
                style={[
                  styles.helperAvatar,
                  { backgroundColor: colors.primary + "20" },
                ]}
              >
                <Text style={[styles.helperInitial, { color: colors.primary }]}>
                  {intervention.helper?.user?.firstName?.[0]}
                  {intervention.helper?.user?.lastName?.[0]}
                </Text>
              </View>
              <View style={styles.helperInfo}>
                <Text style={[styles.helperName, { color: colors.text }]}>
                  {intervention.helper?.user?.firstName}{" "}
                  {intervention.helper?.user?.lastName}
                </Text>
                <View style={styles.helperRating}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text
                    style={[
                      styles.helperRatingText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {intervention.helper?.rating?.toFixed(1) || "5.0"}
                  </Text>
                </View>
                {intervention.helper?.user?.phone && (
                  <Text
                    style={[
                      styles.helperPhone,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {intervention.helper.user.phone}
                  </Text>
                )}
              </View>
              {intervention.helper?.user?.phone && (
                <TouchableOpacity
                  style={[
                    styles.callButton,
                    { backgroundColor: colors.success },
                  ]}
                  onPress={handleCallHelper}
                >
                  <Ionicons name="call" size={20} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Prix */}
        {hasPricing && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="cash-outline" size={20} color={colors.success} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Paiement
              </Text>
            </View>
            <View style={styles.priceRow}>
              <Text
                style={[styles.priceLabel, { color: colors.textSecondary }]}
              >
                Total
              </Text>
              <Text style={[styles.priceValue, { color: colors.success }]}>
                {formatPrice(intervention.pricing!.final)}
              </Text>
            </View>
            {intervention.pricing?.distance && (
              <View style={styles.priceRow}>
                <Text
                  style={[styles.priceLabel, { color: colors.textSecondary }]}
                >
                  Distance
                </Text>
                <Text style={[styles.priceDetail, { color: colors.text }]}>
                  {intervention.pricing.distance.toFixed(1)} km
                </Text>
              </View>
            )}
            {intervention.pricing?.duration && (
              <View style={styles.priceRow}>
                <Text
                  style={[styles.priceLabel, { color: colors.textSecondary }]}
                >
                  Durée
                </Text>
                <Text style={[styles.priceDetail, { color: colors.text }]}>
                  {intervention.pricing.duration} min
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Timeline */}
        {intervention.timeline && intervention.timeline.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Chronologie
              </Text>
            </View>
            {intervention.timeline.map((event, index) => {
              const eventConfig = getStatusConfig(event.status);
              const isLast = index === intervention.timeline.length - 1;
              return (
                <View key={index} style={styles.timelineItem}>
                  {!isLast && (
                    <View
                      style={[
                        styles.timelineLine,
                        { backgroundColor: colors.border },
                      ]}
                    />
                  )}
                  <View
                    style={[
                      styles.timelineDot,
                      { backgroundColor: eventConfig.color },
                    ]}
                  />
                  <View style={styles.timelineContent}>
                    <Text
                      style={[
                        styles.timelineStatus,
                        { color: eventConfig.color },
                      ]}
                    >
                      {eventConfig.text}
                    </Text>
                    <Text
                      style={[
                        styles.timelineDate,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {formatDate(event.timestamp.toString())}
                    </Text>
                    {event.note && (
                      <Text
                        style={[
                          styles.timelineNote,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {event.note}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Avis - SI DÉJÀ FAIT */}
        {hasReview && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="star" size={20} color="#FFD700" />
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Votre avis
              </Text>
            </View>
            <View style={styles.reviewRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={
                    star <= (intervention.review?.rating || 0)
                      ? "star"
                      : "star-outline"
                  }
                  size={20}
                  color="#FFD700"
                />
              ))}
            </View>
            {intervention.review?.comment && (
              <Text
                style={[styles.reviewComment, { color: colors.textSecondary }]}
              >
                {intervention.review.comment}
              </Text>
            )}
          </View>
        )}

        {/* Bouton évaluation - SI PAS ENCORE FAIT */}
        {!hasReview && isCompleted && (
          <TouchableOpacity
            style={[styles.reviewButton, { backgroundColor: colors.primary }]}
            onPress={handleAddReview}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.reviewGradient}
            >
              <Ionicons name="star-outline" size={20} color="#fff" />
              <Text style={styles.reviewButtonText}>
                Évaluer cette intervention
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: { fontSize: 14 },
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
    gap: 12,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  typeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  typeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  typeText: {
    fontSize: 16,
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
  },
  problemDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  severityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  severityText: {
    fontSize: 13,
    fontWeight: "500",
  },
  vehicleText: {
    fontSize: 15,
    fontWeight: "500",
  },
  vehiclePlate: {
    fontSize: 13,
  },
  locationText: {
    fontSize: 14,
    lineHeight: 20,
  },
  mapHint: {
    fontSize: 12,
    marginTop: 4,
  },
  helperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  helperAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  helperInitial: {
    fontSize: 22,
    fontWeight: "bold",
  },
  helperInfo: {
    flex: 1,
  },
  helperName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  helperRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  helperRatingText: {
    fontSize: 12,
  },
  helperPhone: {
    fontSize: 12,
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 14,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  priceDetail: {
    fontSize: 14,
  },
  timelineItem: {
    flexDirection: "row",
    marginLeft: 12,
    marginBottom: 20,
    position: "relative",
  },
  timelineLine: {
    position: "absolute",
    left: 9,
    top: 28,
    bottom: -20,
    width: 2,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    marginBottom: 4,
  },
  timelineStatus: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  timelineDate: {
    fontSize: 11,
    marginBottom: 4,
  },
  timelineNote: {
    fontSize: 12,
  },
  reviewRow: {
    flexDirection: "row",
    gap: 4,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
  },
  reviewButton: {
    borderRadius: 30,
    overflow: "hidden",
    marginTop: 8,
  },
  reviewGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  reviewButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  bottomSpace: {
    height: 20,
  },
});
