import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Dimensions,
  Animated,
  Easing,
  Platform,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../config/api";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");

interface EarningsStats {
  todayEarnings: number;
  weekEarnings: number;
  monthEarnings: number;
  totalEarnings: number;
  pendingEarnings: number;
  completedMissions: number;
  averagePerMission: number;
  responseRate: number;
  cancellationRate: number;
}

interface Transaction {
  _id: string;
  date: string;
  amount: number;
  type: string;
  status: "completed" | "pending" | "cancelled";
  client: {
    firstName: string;
    lastName: string;
  };
  missionType: string;
}

export default function GainsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // États
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<EarningsStats>({
    todayEarnings: 0,
    weekEarnings: 0,
    monthEarnings: 0,
    totalEarnings: 0,
    pendingEarnings: 0,
    completedMissions: 0,
    averagePerMission: 0,
    responseRate: 100,
    cancellationRate: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "day" | "week" | "month" | "year"
  >("week");

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    loadEarnings();
  }, []);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [selectedPeriod]);

  const loadEarnings = async () => {
    try {
      const statsResponse = await api.get("/helpers/earnings/stats");
      setStats(statsResponse.data.data);

      const transactionsResponse = await api.get(
        `/helpers/earnings/transactions?period=${selectedPeriod}`
      );
      setTransactions(transactionsResponse.data.data || []);
    } catch (error) {
      console.log("Erreur chargement gains:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await loadEarnings();
    setRefreshing(false);
  };

  const getPeriodEarnings = () => {
    switch (selectedPeriod) {
      case "day":
        return stats.todayEarnings || 0;
      case "week":
        return stats.weekEarnings || 0;
      case "month":
        return stats.monthEarnings || 0;
      case "year":
        return stats.totalEarnings || 0;
      default:
        return 0;
    }
  };

  const getPeriodPercentage = () => {
    const earnings = getPeriodEarnings();
    return stats.totalEarnings > 0 ? (earnings / stats.totalEarnings) * 100 : 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return colors.success;
      case "pending":
        return colors.warning;
      case "cancelled":
        return colors.error;
      default:
        return colors.icon;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return "checkmark-circle";
      case "pending":
        return "time";
      case "cancelled":
        return "close-circle";
      default:
        return "ellipse";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Terminée";
      case "pending":
        return "En attente";
      case "cancelled":
        return "Annulée";
      default:
        return "";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="dark-content" />
        <Animated.View
          style={[
            styles.loadingContent,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.loadingLogo}
          >
            <Ionicons name="wallet" size={40} color="#fff" />
          </LinearGradient>
          <Text style={[styles.loadingText, { color: colors.primary }]}>
            Kadima
          </Text>
          <ActivityIndicator size="large" color={colors.primary} />
        </Animated.View>
      </View>
    );
  }

  const periodEarnings = getPeriodEarnings();
  const periodPercentage = getPeriodPercentage();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Header avec dégradé et flèche retour */}
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Gains</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.headerButton}>
            <Ionicons
              name="refresh"
              size={24}
              color="#fff"
              style={{
                transform: [{ rotate: refreshing ? "180deg" : "0deg" }],
              }}
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Carte de gains totaux */}
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.totalCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.totalCardTop}>
              <Text style={styles.totalCardLabel}>Gains totaux</Text>
              <View style={styles.totalCardBadge}>
                <Ionicons name="ribbon" size={12} color="#fff" />
                <Text style={styles.totalCardBadgeText}>Top helper</Text>
              </View>
            </View>

            <Text style={styles.totalCardValue}>
              ${stats.totalEarnings.toFixed(2)}
            </Text>

            <View style={styles.totalCardFooter}>
              <View style={styles.totalCardFooterItem}>
                <Ionicons name="car" size={14} color="#fff" />
                <Text style={styles.totalCardFooterText}>
                  {stats.completedMissions} missions
                </Text>
              </View>
              <View style={styles.totalCardFooterItem}>
                <Ionicons name="trending-up" size={14} color="#fff" />
                <Text style={styles.totalCardFooterText}>
                  ${stats.averagePerMission.toFixed(2)}/mission
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* Sélecteur de période */}
          <View
            style={[styles.periodContainer, { backgroundColor: colors.card }]}
          >
            <View style={styles.periodSelector}>
              {["day", "week", "month", "year"].map((period) => (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.periodButton,
                    selectedPeriod === period && {
                      backgroundColor: colors.primary + "10",
                    },
                  ]}
                  onPress={() => setSelectedPeriod(period as any)}
                >
                  <Text
                    style={[
                      styles.periodButtonText,
                      {
                        color:
                          selectedPeriod === period
                            ? colors.primary
                            : colors.textSecondary,
                      },
                    ]}
                  >
                    {period === "day" && "Jour"}
                    {period === "week" && "Semaine"}
                    {period === "month" && "Mois"}
                    {period === "year" && "Année"}
                  </Text>
                  {selectedPeriod === period && (
                    <View
                      style={[
                        styles.periodActiveDot,
                        { backgroundColor: colors.primary },
                      ]}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.periodEarnings}>
              <Text
                style={[
                  styles.periodEarningsLabel,
                  { color: colors.textSecondary },
                ]}
              >
                Gains de la période
              </Text>
              <Text
                style={[styles.periodEarningsValue, { color: colors.text }]}
              >
                ${periodEarnings.toFixed(2)}
              </Text>
            </View>

            <View style={styles.periodProgress}>
              <View
                style={[styles.progressBar, { backgroundColor: colors.border }]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: colors.primary,
                      width: `${periodPercentage}%`,
                    },
                  ]}
                />
              </View>
              <Text
                style={[styles.progressText, { color: colors.textSecondary }]}
              >
                {periodPercentage.toFixed(1)}%
              </Text>
            </View>
          </View>

          {/* Stats rapides */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <View
                style={[
                  styles.statIcon,
                  { backgroundColor: colors.warning + "15" },
                ]}
              >
                <Ionicons name="time" size={20} color={colors.warning} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                ${stats.pendingEarnings.toFixed(2)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                En attente
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <View
                style={[
                  styles.statIcon,
                  { backgroundColor: colors.success + "15" },
                ]}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.success}
                />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stats.responseRate}%
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Réponse
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <View
                style={[
                  styles.statIcon,
                  { backgroundColor: colors.error + "15" },
                ]}
              >
                <Ionicons name="close-circle" size={20} color={colors.error} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stats.cancellationRate}%
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Annulations
              </Text>
            </View>
          </View>

          {/* Transactions */}
          <View style={styles.transactionsSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Dernières transactions
              </Text>
              <TouchableOpacity>
                <Text style={[styles.sectionLink, { color: colors.primary }]}>
                  Voir tout
                </Text>
              </TouchableOpacity>
            </View>

            {transactions.length > 0 ? (
              transactions.slice(0, 5).map((transaction, index) => (
                <Animated.View
                  key={transaction._id}
                  style={[
                    styles.transactionCard,
                    { backgroundColor: colors.card },
                    index === 0 && styles.firstTransaction,
                  ]}
                >
                  <View style={styles.transactionLeft}>
                    <View
                      style={[
                        styles.transactionIcon,
                        {
                          backgroundColor:
                            getStatusColor(transaction.status) + "15",
                        },
                      ]}
                    >
                      <Ionicons
                        name={getStatusIcon(transaction.status)}
                        size={20}
                        color={getStatusColor(transaction.status)}
                      />
                    </View>

                    <View style={styles.transactionInfo}>
                      <Text
                        style={[styles.transactionType, { color: colors.text }]}
                      >
                        {transaction.missionType}
                      </Text>
                      <Text
                        style={[
                          styles.transactionClient,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {transaction.client.firstName}{" "}
                        {transaction.client.lastName}
                      </Text>
                      <View style={styles.transactionMeta}>
                        <Ionicons
                          name="calendar-outline"
                          size={10}
                          color={colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.transactionDate,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {formatDate(transaction.date)} •{" "}
                          {formatTime(transaction.date)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.transactionRight}>
                    <Text
                      style={[
                        styles.transactionAmount,
                        { color: getStatusColor(transaction.status) },
                      ]}
                    >
                      {transaction.status === "completed" ? "+" : ""}$
                      {transaction.amount.toFixed(2)}
                    </Text>
                    <View
                      style={[
                        styles.transactionStatusBadge,
                        {
                          backgroundColor:
                            getStatusColor(transaction.status) + "15",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.transactionStatusText,
                          { color: getStatusColor(transaction.status) },
                        ]}
                      >
                        {getStatusText(transaction.status)}
                      </Text>
                    </View>
                  </View>
                </Animated.View>
              ))
            ) : (
              <View
                style={[
                  styles.emptyContainer,
                  { backgroundColor: colors.card },
                ]}
              >
                <LinearGradient
                  colors={[colors.primary + "10", colors.secondary + "05"]}
                  style={styles.emptyIcon}
                >
                  <Ionicons
                    name="card-outline"
                    size={32}
                    color={colors.textSecondary}
                  />
                </LinearGradient>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  Aucune transaction
                </Text>
                <Text
                  style={[styles.emptyText, { color: colors.textSecondary }]}
                >
                  Vos gains apparaîtront ici après vos premières missions
                </Text>
              </View>
            )}
          </View>

          {/* Espace pour la tab bar */}
          <View style={styles.bottomSpace} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  loadingContent: {
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
  loadingText: {
    fontSize: 18,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  totalCard: {
    padding: 20,
    borderRadius: 24,
    gap: 12,
  },
  totalCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalCardLabel: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
  },
  totalCardBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  totalCardBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "500",
  },
  totalCardValue: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#fff",
  },
  totalCardFooter: {
    flexDirection: "row",
    gap: 16,
  },
  totalCardFooterItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  totalCardFooterText: {
    color: "#fff",
    fontSize: 12,
    opacity: 0.9,
  },
  periodContainer: {
    padding: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  periodSelector: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 12,
    position: "relative",
  },
  periodButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
  periodActiveDot: {
    position: "absolute",
    bottom: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  periodEarnings: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  periodEarningsLabel: {
    fontSize: 13,
  },
  periodEarningsValue: {
    fontSize: 22,
    fontWeight: "bold",
  },
  periodProgress: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    fontWeight: "500",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  statValue: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
  },
  transactionsSection: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: "500",
  },
  transactionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  firstTransaction: {
    borderWidth: 1,
    borderColor: "rgba(184, 134, 11, 0.3)",
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  transactionInfo: {
    flex: 1,
    gap: 2,
  },
  transactionType: {
    fontSize: 14,
    fontWeight: "600",
  },
  transactionClient: {
    fontSize: 12,
  },
  transactionMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  transactionDate: {
    fontSize: 10,
  },
  transactionRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "700",
  },
  transactionStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  transactionStatusText: {
    fontSize: 9,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    padding: 32,
    borderRadius: 20,
    gap: 12,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 13,
    textAlign: "center",
  },
  bottomSpace: {
    height: 80,
  },
});
