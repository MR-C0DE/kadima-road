// app/history/index.tsx - Version complète corrigée

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  StatusBar,
  Animated,
  Dimensions,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { api } from "../../config/api";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
  };
  pricing?: {
    final: number;
  };
  helper?: {
    user: {
      firstName: string;
      lastName: string;
    };
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
    case "cancelled":
      return {
        color: "#EF4444",
        bgColor: "#EF444415",
        text: "Annulée",
        icon: "close-circle",
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
    default:
      return {
        color: "#6B7280",
        bgColor: "#6B728015",
        text: "En cours",
        icon: "time",
      };
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `Aujourd'hui à ${date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

// Filtres
const FILTERS = [
  { id: "all", label: "Tous", icon: "apps" },
  { id: "completed", label: "Terminés", icon: "checkmark-circle" },
  { id: "pending", label: "En attente", icon: "time" },
  { id: "cancelled", label: "Annulés", icon: "close-circle" },
  { id: "sos", label: "SOS", icon: "alert-circle" },
];

// Composant de carte d'intervention
const HistoryCard = ({
  intervention,
  colors,
  onPress,
  index,
}: {
  intervention: Intervention;
  colors: any;
  onPress: () => void;
  index: number;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.spring(translateX, {
        toValue: 0,
        friction: 6,
        tension: 40,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const statusConfig = getStatusConfig(intervention.status);
  const isSOS = intervention.type === "sos";
  const hasPrice =
    intervention.pricing?.final && intervention.pricing.final > 0;
  const hasHelper = intervention.helper && intervention.helper.user;

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }, { translateX }],
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.surface }]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <LinearGradient
          colors={[colors.primary + "05", colors.secondary + "02"]}
          style={styles.cardBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        <View style={styles.cardHeader}>
          <View style={styles.typeContainer}>
            <LinearGradient
              colors={
                isSOS
                  ? [colors.error + "20", colors.error + "10"]
                  : [colors.primary + "15", colors.secondary + "05"]
              }
              style={styles.typeIcon}
            >
              <Ionicons
                name={isSOS ? "alert-circle" : "construct"}
                size={18}
                color={isSOS ? colors.error : colors.primary}
              />
            </LinearGradient>
            <Text style={[styles.typeText, { color: colors.text }]}>
              {isSOS ? "SOS Urgence" : "Assistance"}
            </Text>
            {isSOS && (
              <View
                style={[
                  styles.sosBadge,
                  { backgroundColor: colors.error + "15" },
                ]}
              >
                <Text style={[styles.sosBadgeText, { color: colors.error }]}>
                  URGENT
                </Text>
              </View>
            )}
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusConfig.bgColor },
            ]}
          >
            <Ionicons
              name={statusConfig.icon}
              size={10}
              color={statusConfig.color}
            />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.text}
            </Text>
          </View>
        </View>

        <Text
          style={[styles.description, { color: colors.textSecondary }]}
          numberOfLines={2}
        >
          {intervention.problem?.description || "Intervention sans description"}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.footerLeft}>
            <View style={styles.dateContainer}>
              <Ionicons
                name="calendar-outline"
                size={12}
                color={colors.textSecondary}
              />
              <Text style={[styles.date, { color: colors.textSecondary }]}>
                {formatDate(intervention.createdAt)}
              </Text>
            </View>

            {hasHelper && (
              <View style={styles.helperContainer}>
                <Ionicons
                  name="person-outline"
                  size={12}
                  color={colors.textSecondary}
                />
                <Text
                  style={[styles.helperName, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {intervention.helper.user.firstName}{" "}
                  {intervention.helper.user.lastName}
                </Text>
              </View>
            )}
          </View>

          {hasPrice && (
            <View
              style={[
                styles.priceBadge,
                { backgroundColor: colors.success + "10" },
              ]}
            >
              <Ionicons name="cash-outline" size={12} color={colors.success} />
              <Text style={[styles.price, { color: colors.success }]}>
                {formatPrice(intervention.pricing!.final)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.footerArrow}>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textSecondary}
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function HistoryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme ?? "light"];

  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [filteredInterventions, setFilteredInterventions] = useState<
    Intervention[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const filterAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadHistory();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  useEffect(() => {
    applyFilter();
  }, [selectedFilter, interventions]);

  const loadHistory = async () => {
    try {
      const response = await api.get("/interventions");
      const data = response.data.data || [];
      const sorted = data.sort(
        (a: Intervention, b: Intervention) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setInterventions(sorted);
    } catch (error) {
      console.error("Erreur chargement historique:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilter = () => {
    if (selectedFilter === "all") {
      setFilteredInterventions(interventions);
      return;
    }
    if (selectedFilter === "sos") {
      setFilteredInterventions(interventions.filter((i) => i.type === "sos"));
      return;
    }
    setFilteredInterventions(
      interventions.filter((i) => i.status === selectedFilter)
    );
  };

  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await loadHistory();
  };

  const handleFilterSelect = (filterId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedFilter(filterId);

    Animated.sequence([
      Animated.timing(filterAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(filterAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getFilterCount = (filterId: string) => {
    if (filterId === "all") return interventions.length;
    if (filterId === "sos")
      return interventions.filter((i) => i.type === "sos").length;
    return interventions.filter((i) => i.status === filterId).length;
  };

  if (loading && !refreshing) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.loadingLogo}
        >
          <Ionicons name="time-outline" size={40} color="#fff" />
        </LinearGradient>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Chargement de l'historique...
        </Text>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const hasInterventions = filteredInterventions.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
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

          <Text style={styles.headerTitle}>Historique</Text>

          <View style={styles.headerRight}>
            <Text style={[styles.countBadge, { color: colors.primary }]}>
              {interventions.length}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Filtres */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
        style={styles.filtersScrollView}
      >
        {FILTERS.map((filter) => {
          const isActive = selectedFilter === filter.id;
          const count = getFilterCount(filter.id);
          return (
            <Animated.View
              key={filter.id}
              style={{
                transform: [
                  {
                    scale: isActive
                      ? filterAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 0.95],
                        })
                      : 1,
                  },
                ],
              }}
            >
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  isActive && { backgroundColor: colors.primary },
                ]}
                onPress={() => handleFilterSelect(filter.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={filter.icon}
                  size={16}
                  color={isActive ? "#fff" : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.filterText,
                    { color: isActive ? "#fff" : colors.textSecondary },
                  ]}
                >
                  {filter.label}
                </Text>
                {count > 0 && (
                  <View
                    style={[
                      styles.filterCount,
                      { backgroundColor: isActive ? "#fff" : colors.border },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterCountText,
                        {
                          color: isActive
                            ? colors.primary
                            : colors.textSecondary,
                        },
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </ScrollView>

      {/* Liste des interventions */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        {hasInterventions ? (
          filteredInterventions.map((intervention, index) => (
            <HistoryCard
              key={intervention._id}
              intervention={intervention}
              colors={colors}
              onPress={() => router.push(`/interventions/${intervention._id}`)}
              index={index}
            />
          ))
        ) : (
          <View
            style={[styles.emptyContainer, { backgroundColor: colors.surface }]}
          >
            <LinearGradient
              colors={[colors.primary + "20", colors.secondary + "10"]}
              style={styles.emptyIcon}
            >
              <Ionicons name="time-outline" size={48} color={colors.primary} />
            </LinearGradient>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {selectedFilter === "all"
                ? "Aucune intervention"
                : `Aucune intervention ${
                    selectedFilter === "completed"
                      ? "terminée"
                      : selectedFilter === "pending"
                      ? "en attente"
                      : selectedFilter === "cancelled"
                      ? "annulée"
                      : "SOS"
                  }`}
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {selectedFilter === "all"
                ? "Vos interventions apparaîtront ici"
                : "Essayez un autre filtre"}
            </Text>
            <TouchableOpacity
              style={[styles.sosButton, { backgroundColor: colors.error }]}
              onPress={() => router.push("/sos")}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.error, colors.error + "CC"]}
                style={styles.sosGradient}
              >
                <Ionicons name="alert-circle" size={18} color="#fff" />
                <Text style={styles.sosButtonText}>SOS Urgence</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomSpace} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  loadingLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
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
    flex: 1,
    textAlign: "center",
  },
  headerRight: {
    width: 40,
    alignItems: "flex-end",
  },
  countBadge: {
    fontSize: 14,
    fontWeight: "600",
  },
  filtersScrollView: {
    flexGrow: 0,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 0,
    gap: 10,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 25,
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  filterText: {
    fontSize: 13,
    fontWeight: "500",
  },
  filterCount: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 2,
  },
  filterCountText: {
    fontSize: 10,
    fontWeight: "600",
  },
  scrollContent: {
    padding: 16,
    paddingTop: 12,
    gap: 12,
    paddingBottom: 30,
  },
  cardWrapper: {
    marginBottom: 0,
  },
  card: {
    borderRadius: 20,
    padding: 16,
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
    opacity: 0.5,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  typeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  sosBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  sosBadgeText: {
    fontSize: 8,
    fontWeight: "700",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLeft: {
    gap: 6,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  date: {
    fontSize: 10,
  },
  helperContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  helperName: {
    fontSize: 10,
    maxWidth: width * 0.4,
  },
  priceBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  price: {
    fontSize: 12,
    fontWeight: "600",
  },
  footerArrow: {
    position: "absolute",
    right: 16,
    top: "50%",
    marginTop: -9,
  },
  emptyContainer: {
    alignItems: "center",
    padding: 40,
    borderRadius: 24,
    gap: 16,
    marginTop: 20,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  sosButton: {
    borderRadius: 30,
    overflow: "hidden",
    marginTop: 8,
  },
  sosGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  sosButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  bottomSpace: {
    height: 20,
  },
});
