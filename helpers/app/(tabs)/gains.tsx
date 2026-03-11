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
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../config/api";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";

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
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("week");
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
  const earningsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animations d'entrée
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

    // Animation des gains
    Animated.timing(earningsAnim, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    loadEarnings();
  }, []);

  useEffect(() => {
    // Animation quand on change de période
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
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
      // Charger les statistiques
      const statsResponse = await api.get("/helpers/earnings/stats");
      setStats(statsResponse.data.data);

      // Charger les transactions selon la période
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#4CAF50";
      case "pending":
        return "#FF9800";
      case "cancelled":
        return "#E63946";
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const earningsValue = earningsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, stats[`${selectedPeriod}Earnings`]],
  });

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={[colors.primary + "20", colors.secondary + "20"]}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View
          style={[
            styles.loadingContent,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View
            style={[
              styles.loadingLogo,
              { backgroundColor: colors.primary + "15" },
            ]}
          >
            <Ionicons name="wallet" size={60} color={colors.primary} />
          </View>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Chargement de vos gains...
          </Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* En-tête */}
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={styles.headerTitle}>Mes gains</Text>
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
          {/* Carte de gains principaux */}
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.mainEarningsCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.mainEarningsLabel}>Gains totaux</Text>
            <Animated.Text style={styles.mainEarningsValue}>
              {stats.totalEarnings.toFixed(2)} €
            </Animated.Text>
            <View style={styles.mainEarningsSub}>
              <Text style={styles.mainEarningsSubText}>
                {stats.completedMissions} missions complétées
              </Text>
            </View>
          </LinearGradient>

          {/* Sélecteur de période */}
          <View style={styles.periodSelector}>
            {["day", "week", "month", "year"].map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  selectedPeriod === period && {
                    backgroundColor: colors.primary,
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
                          ? "#fff"
                          : colors.textSecondary,
                    },
                  ]}
                >
                  {period === "day" && "Jour"}
                  {period === "week" && "Semaine"}
                  {period === "month" && "Mois"}
                  {period === "year" && "Année"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Gains de la période */}
          <View style={styles.periodEarningsCard}>
            <Text
              style={[
                styles.periodEarningsLabel,
                { color: colors.textSecondary },
              ]}
            >
              Gains de la période
            </Text>
            <Animated.Text
              style={[styles.periodEarningsValue, { color: colors.primary }]}
            >
              {stats[`${selectedPeriod}Earnings`]?.toFixed(2)} €
            </Animated.Text>
          </View>

          {/* Statistiques en grille */}
          <View style={styles.statsGrid}>
            <LinearGradient
              colors={[colors.primary + "10", colors.secondary + "05"]}
              style={styles.statCard}
            >
              <Ionicons name="time" size={24} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stats.pendingEarnings.toFixed(2)} €
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                En attente
              </Text>
            </LinearGradient>

            <LinearGradient
              colors={[colors.primary + "10", colors.secondary + "05"]}
              style={styles.statCard}
            >
              <Ionicons name="calculator" size={24} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stats.averagePerMission.toFixed(2)} €
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Moyenne/mission
              </Text>
            </LinearGradient>

            <LinearGradient
              colors={[colors.primary + "10", colors.secondary + "05"]}
              style={styles.statCard}
            >
              <Ionicons name="trending-up" size={24} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stats.responseRate}%
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Taux de réponse
              </Text>
            </LinearGradient>

            <LinearGradient
              colors={[colors.primary + "10", colors.secondary + "05"]}
              style={styles.statCard}
            >
              <Ionicons name="close-circle" size={24} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stats.cancellationRate}%
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Annulations
              </Text>
            </LinearGradient>
          </View>

          {/* Historique des transactions */}
          <View style={styles.transactionsSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Dernières transactions
              </Text>
            </View>

            {transactions.length > 0 ? (
              transactions.map((transaction, index) => (
                <Animated.View
                  key={transaction._id}
                  style={[
                    styles.transactionCard,
                    {
                      opacity: fadeAnim,
                      transform: [
                        {
                          translateX: slideAnim.interpolate({
                            inputRange: [0, 50],
                            outputRange: [0, 20 * (index + 1)],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={[colors.surface, colors.surface]}
                    style={styles.transactionGradient}
                  >
                    <View style={styles.transactionLeft}>
                      <View
                        style={[
                          styles.transactionIcon,
                          { backgroundColor: colors.primary + "10" },
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
                          style={[
                            styles.transactionType,
                            { color: colors.text },
                          ]}
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
                        <Text
                          style={[
                            styles.transactionDate,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {formatDate(transaction.date)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.transactionRight}>
                      <Text
                        style={[
                          styles.transactionAmount,
                          {
                            color:
                              transaction.status === "completed"
                                ? colors.success
                                : transaction.status === "pending"
                                ? colors.warning
                                : colors.error,
                          },
                        ]}
                      >
                        {transaction.status === "completed" ? "+" : ""}
                        {transaction.amount.toFixed(2)} €
                      </Text>
                      <View
                        style={[
                          styles.transactionStatus,
                          {
                            backgroundColor:
                              getStatusColor(transaction.status) + "20",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.transactionStatusText,
                            { color: getStatusColor(transaction.status) },
                          ]}
                        >
                          {transaction.status === "completed"
                            ? "Terminé"
                            : transaction.status === "pending"
                            ? "En attente"
                            : "Annulé"}
                        </Text>
                      </View>
                    </View>
                  </LinearGradient>
                </Animated.View>
              ))
            ) : (
              <BlurView
                intensity={30}
                tint={colorScheme}
                style={styles.emptyContainer}
              >
                <View
                  style={[
                    styles.emptyIcon,
                    { backgroundColor: colors.primary + "10" },
                  ]}
                >
                  <Ionicons
                    name="card-outline"
                    size={50}
                    color={colors.primary}
                  />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  Aucune transaction
                </Text>
                <Text
                  style={[styles.emptyText, { color: colors.textSecondary }]}
                >
                  Vos gains apparaîtront ici après vos premières missions
                </Text>
              </BlurView>
            )}
          </View>
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
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  loadingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  loadingLogo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 20,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  mainEarningsCard: {
    padding: 25,
    borderRadius: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  mainEarningsLabel: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
    marginBottom: 8,
  },
  mainEarningsValue: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  mainEarningsSub: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  mainEarningsSubText: {
    fontSize: 13,
    color: "#fff",
    opacity: 0.8,
  },
  periodSelector: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 30,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 26,
    alignItems: "center",
  },
  periodButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
  periodEarningsCard: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  periodEarningsLabel: {
    fontSize: 14,
    marginBottom: 5,
  },
  periodEarningsValue: {
    fontSize: 32,
    fontWeight: "bold",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    width: (width - 50) / 2,
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
    gap: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 11,
    textAlign: "center",
  },
  transactionsSection: {
    marginTop: 10,
    gap: 15,
  },
  sectionHeader: {
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  transactionCard: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionGradient: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  transactionLeft: {
    flexDirection: "row",
    gap: 12,
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  transactionInfo: {
    gap: 2,
    flex: 1,
  },
  transactionType: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  transactionClient: {
    fontSize: 12,
  },
  transactionDate: {
    fontSize: 11,
    marginTop: 2,
  },
  transactionRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  transactionStatus: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  transactionStatusText: {
    fontSize: 9,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  emptyContainer: {
    alignItems: "center",
    padding: 50,
    borderRadius: 20,
    overflow: "hidden",
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
});
