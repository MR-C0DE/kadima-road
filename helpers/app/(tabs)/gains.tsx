// helpers/app/(tabs)/gains.tsx - Version avec ligne de tendance corrigée

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
  Platform,
  StatusBar,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../config/api";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { LineChart } from "react-native-gifted-charts";

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

interface ChartData {
  day: string;
  value: number;
  label: string;
  date: Date;
}

// Options de période
const PERIODS = [
  { id: "day", label: "Jour", icon: "sunny", days: 1 },
  { id: "week", label: "Semaine", icon: "calendar", days: 7 },
  { id: "month", label: "Mois", icon: "calendar", days: 30 },
  { id: "year", label: "Année", icon: "calendar", days: 365 },
];

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
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<ChartData | null>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const chartAnim = useRef(new Animated.Value(0)).current;

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
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(headerAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(chartAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    loadEarnings();
  }, []);

  useEffect(() => {
    loadChartData();
    loadTransactions();
  }, [selectedPeriod]);

  const loadEarnings = async () => {
    try {
      const statsResponse = await api.get("/helpers/earnings/stats");
      setStats(statsResponse.data.data);
    } catch (error) {
      console.log("Erreur chargement gains:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadChartData = async () => {
    try {
      const response = await api.get(
        `/helpers/earnings/transactions?period=${selectedPeriod}`
      );
      const transactions = response.data.data || [];

      // Agréger les données pour le graphique avec dates complètes
      const aggregated: Record<string, { value: number; date: Date }> = {};

      transactions.forEach((t: any) => {
        const date = new Date(t.date);
        let key = "";

        if (selectedPeriod === "day") {
          key = date.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            hour12: false,
          });
        } else if (selectedPeriod === "week") {
          key = date.toLocaleDateString("fr-FR", { weekday: "short" });
        } else if (selectedPeriod === "month") {
          key = date.toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
          });
        } else {
          key = date.toLocaleDateString("fr-FR", {
            month: "short",
            year: "2-digit",
          });
        }

        if (!aggregated[key]) {
          aggregated[key] = { value: 0, date };
        }
        aggregated[key].value += t.amount;
      });

      // Trier par date
      const chartDataArray = Object.entries(aggregated)
        .map(([label, { value, date }]) => ({
          day: label,
          value,
          label,
          date,
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      setChartData(chartDataArray);
    } catch (error) {
      console.log("Erreur chargement graphique:", error);
      // Données mockées pour l'affichage
      const mockData: ChartData[] = generateMockData();
      setChartData(mockData);
    }
  };

  const generateMockData = (): ChartData[] => {
    const mockData: ChartData[] = [];
    const now = new Date();

    if (selectedPeriod === "day") {
      for (let i = 0; i < 12; i++) {
        const date = new Date(now);
        date.setHours(8 + i);
        mockData.push({
          day: `${8 + i}h`,
          value: Math.floor(Math.random() * 50) + 10,
          label: `${8 + i}h`,
          date,
        });
      }
    } else if (selectedPeriod === "week") {
      const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
      days.forEach((day, index) => {
        const date = new Date(now);
        date.setDate(now.getDate() - (6 - index));
        mockData.push({
          day,
          value: Math.floor(Math.random() * 100) + 20,
          label: day,
          date,
        });
      });
    } else if (selectedPeriod === "month") {
      for (let i = 0; i < 4; i++) {
        const date = new Date(now);
        date.setDate(now.getDate() - (3 - i) * 7);
        mockData.push({
          day: `Sem ${i + 1}`,
          value: Math.floor(Math.random() * 300) + 100,
          label: `Sem ${i + 1}`,
          date,
        });
      }
    } else {
      const months = [
        "Jan",
        "Fév",
        "Mar",
        "Avr",
        "Mai",
        "Juin",
        "Juil",
        "Aoû",
        "Sep",
        "Oct",
        "Nov",
        "Déc",
      ];
      months.forEach((month, index) => {
        const date = new Date(now.getFullYear(), index, 1);
        mockData.push({
          day: month,
          value: Math.floor(Math.random() * 500) + 200,
          label: month,
          date,
        });
      });
    }

    return mockData;
  };

  const loadTransactions = async () => {
    try {
      const response = await api.get(
        `/helpers/earnings/transactions?period=${selectedPeriod}`
      );
      setTransactions(response.data.data || []);
    } catch (error) {
      console.log("Erreur chargement transactions:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Promise.all([loadEarnings(), loadChartData(), loadTransactions()]);
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
        return "#22C55E";
      case "pending":
        return "#F59E0B";
      case "cancelled":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getStatusIcon = (status: string): keyof typeof Ionicons.glyphMap => {
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
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("fr-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getMaxChartValue = () => {
    if (chartData.length === 0) return 100;

    const dataValues = chartData.map((d) => d.value);
    const maxDataValue = Math.max(...dataValues);

    // Calculer la ligne de tendance pour connaître sa valeur maximale
    const trendValues = calculateTrendLineValues();
    const maxTrendValue = trendValues.length > 0 ? Math.max(...trendValues) : 0;

    // Prendre le maximum entre les données réelles et la tendance, avec une marge de 20%
    const maxValue = Math.max(maxDataValue, maxTrendValue);
    return Math.ceil(maxValue * 1.2);
  };

  // Calcul des valeurs de la ligne de tendance sans limite
  const calculateTrendLineValues = (): number[] => {
    if (chartData.length < 2) return [];

    const n = chartData.length;
    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumX2 = 0;

    chartData.forEach((point, index) => {
      const x = index;
      const y = point.value;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculer toutes les valeurs de tendance
    return chartData.map((_, index) => {
      let value = intercept + slope * index;
      // Éviter les valeurs négatives
      return Math.max(0, value);
    });
  };

  // Calcul de la ligne de tendance avec normalisation pour rester dans les limites
  const calculateTrendLine = () => {
    if (chartData.length < 2) return [];

    const n = chartData.length;
    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumX2 = 0;

    chartData.forEach((point, index) => {
      const x = index;
      const y = point.value;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculer toutes les valeurs de tendance
    const trendValues = chartData.map((_, index) => {
      let value = intercept + slope * index;
      return Math.max(0, value);
    });

    // Trouver la valeur maximale des données réelles et de la tendance
    const maxDataValue = Math.max(...chartData.map((d) => d.value));
    const maxTrendValue = Math.max(...trendValues);
    const globalMax = Math.max(maxDataValue, maxTrendValue);

    // Normaliser les valeurs de tendance pour qu'elles ne dépassent pas 20% de plus que le maximum réel
    // Cela évite que la ligne de tendance sorte du graphique
    const normalizedTrendValues = trendValues.map((value) => {
      if (globalMax > maxDataValue * 1.2) {
        // Si la tendance est trop élevée, la limiter
        return Math.min(value, maxDataValue * 1.2);
      }
      return value;
    });

    return normalizedTrendValues.map((value) => ({
      value,
      dataPointText: "",
    }));
  };

  const trendLineData = calculateTrendLine();

  // Formatage des données pour le graphique
  const lineChartData = chartData.map((item, index) => ({
    value: item.value,
    label: item.label,
    dataPointText: formatMoney(item.value),
    labelComponent: () => (
      <Text style={[styles.xAxisLabel, { color: colors.textSecondary }]}>
        {item.label}
      </Text>
    ),
  }));

  const headerTranslateY = headerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 0],
  });

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.loadingLogo}
          >
            <Ionicons name="wallet" size={48} color="#fff" />
          </LinearGradient>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Chargement de vos gains...
          </Text>
        </View>
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

      {/* Header avec dégradé animé */}
      <Animated.View style={{ transform: [{ translateY: headerTranslateY }] }}>
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
              <Animated.View
                style={{
                  transform: [{ rotate: refreshing ? "180deg" : "0deg" }],
                }}
              >
                <Ionicons name="refresh" size={24} color="#fff" />
              </Animated.View>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <Animated.View
          style={[
            styles.content,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Carte de gains totaux */}
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.totalCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.totalCardTop}>
                <Text style={styles.totalCardLabel}>Gains totaux</Text>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <View style={styles.totalCardBadge}>
                    <Ionicons name="trophy" size={12} color="#fff" />
                    <Text style={styles.totalCardBadgeText}>Top helper</Text>
                  </View>
                </Animated.View>
              </View>

              <Text style={styles.totalCardValue}>
                {formatMoney(stats.totalEarnings)}
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
                    {formatMoney(stats.averagePerMission)}/mission
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Graphique d'évolution des gains avec ligne de tendance */}
          <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
            <View style={styles.chartHeader}>
              <View style={styles.chartTitleContainer}>
                <LinearGradient
                  colors={[colors.primary + "20", colors.secondary + "10"]}
                  style={styles.chartIcon}
                >
                  <Ionicons
                    name="trending-up"
                    size={16}
                    color={colors.primary}
                  />
                </LinearGradient>
                <Text style={[styles.chartTitle, { color: colors.text }]}>
                  Évolution des gains
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  { backgroundColor: colors.primary + "10" },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={colors.primary}
                />
                <Text
                  style={[styles.periodButtonText, { color: colors.primary }]}
                >
                  {PERIODS.find((p) => p.id === selectedPeriod)?.label}
                </Text>
              </TouchableOpacity>
            </View>

            {chartData.length > 0 ? (
              <Animated.View style={{ opacity: chartAnim }}>
                <LineChart
                  data={lineChartData}
                  data2={trendLineData}
                  height={220}
                  width={width - 64}
                  spacing={
                    selectedPeriod === "day"
                      ? 28
                      : selectedPeriod === "week"
                      ? 32
                      : 40
                  }
                  initialSpacing={10}
                  color={colors.primary}
                  color2={colors.warning}
                  dataPointsColor={colors.primary}
                  dataPointsColor2={colors.warning}
                  dataPointsRadius={4}
                  dataPointsRadius2={3}
                  textColor={colors.textSecondary}
                  textFontSize={10}
                  thickness={2.5}
                  thickness2={2}
                  hideDataPoints={false}
                  isAnimated
                  animationDuration={1000}
                  yAxisColor={colors.border}
                  xAxisColor={colors.border}
                  yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
                  xAxisLabelTextStyle={styles.xAxisLabel}
                  rulesType="solid"
                  rulesColor={colors.border}
                  showVerticalLines={false}
                  showValuesAsDataPointsText={false}
                  curved
                  areaChart
                  startFillColor={colors.primary + "20"}
                  endFillColor={colors.primary + "00"}
                  startFillColor2={colors.warning + "10"}
                  endFillColor2={colors.warning + "00"}
                  noOfSections={5}
                  maxValue={getMaxChartValue()}
                  stepValue={Math.ceil(getMaxChartValue() / 5)}
                  pointerConfig={{
                    pointerStripHeight: 220,
                    pointerStripColor: colors.primary,
                    pointerStripWidth: 2,
                    pointerColor: colors.primary,
                    radius: 6,
                    pointerLabelWidth: 100,
                    pointerLabelHeight: 40,
                    activatePointersOnLongPress: true,
                    autoAdjustPointerLabelPosition: true,
                    pointerLabelComponent: (items: any) => {
                      const value = items[0]?.value;
                      return (
                        <View
                          style={[
                            styles.pointerLabel,
                            { backgroundColor: colors.card },
                          ]}
                        >
                          <Text
                            style={[
                              styles.pointerLabelText,
                              { color: colors.text },
                            ]}
                          >
                            {formatMoney(value)}
                          </Text>
                        </View>
                      );
                    },
                  }}
                  onPress={(item: any, index: number) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedPoint(chartData[index]);
                  }}
                />

                {/* Légende du graphique */}
                <View style={styles.chartLegend}>
                  <View style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendDot,
                        { backgroundColor: colors.primary },
                      ]}
                    />
                    <Text
                      style={[
                        styles.legendText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Gains
                    </Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendDot,
                        { backgroundColor: colors.warning },
                      ]}
                    />
                    <Text
                      style={[
                        styles.legendText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Tendance
                    </Text>
                  </View>
                  {trendLineData.length > 0 && (
                    <View style={styles.legendItem}>
                      <Ionicons
                        name="trending-up"
                        size={12}
                        color={colors.warning}
                      />
                      <Text
                        style={[
                          styles.legendText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {(() => {
                          const trendValues = calculateTrendLineValues();
                          if (trendValues.length >= 2) {
                            const first = trendValues[0];
                            const last = trendValues[trendValues.length - 1];
                            const variation =
                              ((last - first) / (first || 1)) * 100;
                            return variation > 0
                              ? `+${variation.toFixed(1)}%`
                              : `${variation.toFixed(1)}%`;
                          }
                          return "";
                        })()}
                      </Text>
                    </View>
                  )}
                </View>
              </Animated.View>
            ) : (
              <View style={styles.chartEmpty}>
                <Ionicons
                  name="bar-chart-outline"
                  size={48}
                  color={colors.textSecondary}
                />
                <Text
                  style={[
                    styles.chartEmptyText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Aucune donnée de gains pour cette période
                </Text>
              </View>
            )}
          </View>

          {/* Sélecteur de période et stats */}
          <View
            style={[styles.periodContainer, { backgroundColor: colors.card }]}
          >
            <View style={styles.periodSelector}>
              {PERIODS.map((period) => (
                <TouchableOpacity
                  key={period.id}
                  style={[
                    styles.periodOption,
                    selectedPeriod === period.id && {
                      backgroundColor: colors.primary + "10",
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedPeriod(period.id as any);
                  }}
                >
                  <Ionicons
                    name={period.icon}
                    size={16}
                    color={
                      selectedPeriod === period.id
                        ? colors.primary
                        : colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.periodOptionText,
                      {
                        color:
                          selectedPeriod === period.id
                            ? colors.primary
                            : colors.textSecondary,
                        fontWeight:
                          selectedPeriod === period.id ? "600" : "500",
                      },
                    ]}
                  >
                    {period.label}
                  </Text>
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
                style={[styles.periodEarningsValue, { color: colors.primary }]}
              >
                {formatMoney(periodEarnings)}
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
                      width: `${Math.min(periodPercentage, 100)}%`,
                    },
                  ]}
                />
              </View>
              <Text
                style={[styles.progressText, { color: colors.textSecondary }]}
              >
                {periodPercentage.toFixed(1)}% du total
              </Text>
            </View>
          </View>

          {/* Stats rapides */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <LinearGradient
                colors={[colors.warning + "20", colors.warning + "10"]}
                style={styles.statIcon}
              >
                <Ionicons name="time" size={20} color={colors.warning} />
              </LinearGradient>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {formatMoney(stats.pendingEarnings)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                En attente
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <LinearGradient
                colors={[colors.success + "20", colors.success + "10"]}
                style={styles.statIcon}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.success}
                />
              </LinearGradient>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stats.responseRate}%
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Réponse
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <LinearGradient
                colors={[colors.error + "20", colors.error + "10"]}
                style={styles.statIcon}
              >
                <Ionicons name="close-circle" size={20} color={colors.error} />
              </LinearGradient>
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
              <LinearGradient
                colors={[colors.primary + "20", colors.secondary + "10"]}
                style={styles.sectionIcon}
              >
                <Ionicons
                  name="receipt-outline"
                  size={14}
                  color={colors.primary}
                />
              </LinearGradient>
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
                <TouchableOpacity
                  key={transaction._id}
                  style={[
                    styles.transactionCard,
                    { backgroundColor: colors.card },
                    index === 0 && styles.firstTransaction,
                  ]}
                  onPress={() => {
                    setSelectedTransaction(transaction);
                    setModalVisible(true);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.transactionLeft}>
                    <LinearGradient
                      colors={[
                        getStatusColor(transaction.status) + "20",
                        getStatusColor(transaction.status) + "10",
                      ]}
                      style={styles.transactionIcon}
                    >
                      <Ionicons
                        name={getStatusIcon(transaction.status)}
                        size={20}
                        color={getStatusColor(transaction.status)}
                      />
                    </LinearGradient>

                    <View style={styles.transactionInfo}>
                      <View style={styles.transactionHeader}>
                        <Text
                          style={[
                            styles.transactionType,
                            { color: colors.text },
                          ]}
                        >
                          {transaction.missionType}
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
                      {transaction.status === "completed" ? "+" : ""}
                      {formatMoney(transaction.amount)}
                    </Text>
                  </View>
                </TouchableOpacity>
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
                    name="receipt-outline"
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

          <View style={styles.bottomSpace} />
        </Animated.View>
      </ScrollView>

      {/* Modal détail transaction */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <BlurView intensity={90} style={styles.modalOverlay} tint={colorScheme}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setModalVisible(false)}
            activeOpacity={1}
          />
          {selectedTransaction && (
            <Animated.View
              style={[styles.modalContent, { backgroundColor: colors.card }]}
            >
              <LinearGradient
                colors={[colors.primary + "10", colors.secondary + "05"]}
                style={styles.modalGradient}
              >
                <View style={styles.modalHeader}>
                  <LinearGradient
                    colors={[
                      getStatusColor(selectedTransaction.status) + "20",
                      getStatusColor(selectedTransaction.status) + "10",
                    ]}
                    style={styles.modalIcon}
                  >
                    <Ionicons
                      name={getStatusIcon(selectedTransaction.status)}
                      size={28}
                      color={getStatusColor(selectedTransaction.status)}
                    />
                  </LinearGradient>
                  <View style={styles.modalHeaderText}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>
                      {selectedTransaction.missionType}
                    </Text>
                    <View
                      style={[
                        styles.modalStatusBadge,
                        {
                          backgroundColor:
                            getStatusColor(selectedTransaction.status) + "15",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.modalStatusText,
                          { color: getStatusColor(selectedTransaction.status) },
                        ]}
                      >
                        {getStatusText(selectedTransaction.status)}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    style={styles.modalClose}
                  >
                    <Ionicons
                      name="close"
                      size={24}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalBody}>
                  <View style={styles.modalInfoRow}>
                    <Ionicons
                      name="person-outline"
                      size={18}
                      color={colors.primary}
                    />
                    <Text
                      style={[
                        styles.modalInfoText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {selectedTransaction.client.firstName}{" "}
                      {selectedTransaction.client.lastName}
                    </Text>
                  </View>

                  <View style={styles.modalInfoRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color={colors.primary}
                    />
                    <Text
                      style={[
                        styles.modalInfoText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {new Date(selectedTransaction.date).toLocaleDateString(
                        "fr-FR",
                        {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </Text>
                  </View>

                  <View style={styles.modalInfoRow}>
                    <Ionicons
                      name="cash-outline"
                      size={18}
                      color={colors.success}
                    />
                    <Text
                      style={[
                        styles.modalInfoText,
                        { color: colors.success, fontWeight: "bold" },
                      ]}
                    >
                      Montant : {formatMoney(selectedTransaction.amount)}
                    </Text>
                  </View>

                  <View style={styles.modalDivider} />

                  <Text
                    style={[styles.modalId, { color: colors.textSecondary }]}
                  >
                    ID Transaction: {selectedTransaction._id}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Fermer</Text>
                </TouchableOpacity>
              </LinearGradient>
            </Animated.View>
          )}
        </BlurView>
      </Modal>
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
    width: 100,
    height: 100,
    borderRadius: 50,
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
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#fff" },
  content: { padding: 16, gap: 16 },
  totalCard: {
    padding: 24,
    borderRadius: 28,
    gap: 12,
  },
  totalCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalCardLabel: { fontSize: 14, color: "#fff", opacity: 0.9 },
  totalCardBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  totalCardBadgeText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  totalCardValue: { fontSize: 44, fontWeight: "bold", color: "#fff" },
  totalCardFooter: { flexDirection: "row", gap: 20 },
  totalCardFooterItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  totalCardFooterText: { color: "#fff", fontSize: 12, opacity: 0.9 },
  // Graphique
  chartCard: {
    borderRadius: 24,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  chartTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  chartIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  chartTitle: { fontSize: 16, fontWeight: "600" },
  periodButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  periodButtonText: { fontSize: 12, fontWeight: "500" },
  chartEmpty: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  chartEmptyText: { fontSize: 14 },
  chartLegend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
  },
  pointerLabel: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pointerLabelText: {
    fontSize: 12,
    fontWeight: "600",
  },
  xAxisLabel: {
    fontSize: 10,
    transform: [{ rotate: "0deg" }],
  },
  // Période
  periodContainer: {
    padding: 16,
    borderRadius: 24,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  periodSelector: {
    flexDirection: "row",
    gap: 8,
  },
  periodOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 30,
  },
  periodOptionText: { fontSize: 13 },
  periodEarnings: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  periodEarningsLabel: { fontSize: 13 },
  periodEarningsValue: { fontSize: 24, fontWeight: "bold" },
  periodProgress: { flexDirection: "row", alignItems: "center", gap: 10 },
  progressBar: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  progressText: { fontSize: 11, fontWeight: "500" },
  // Stats
  statsGrid: { flexDirection: "row", gap: 12 },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: 14,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: { fontSize: 16, fontWeight: "bold", marginBottom: 2 },
  statLabel: { fontSize: 11 },
  // Transactions
  transactionsSection: { gap: 12 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 4,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: { fontSize: 16, fontWeight: "600", flex: 1 },
  sectionLink: { fontSize: 13, fontWeight: "500" },
  transactionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  firstTransaction: { borderWidth: 1, borderColor: "rgba(184, 134, 11, 0.3)" },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  transactionInfo: { flex: 1, gap: 4 },
  transactionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  transactionType: { fontSize: 14, fontWeight: "600" },
  transactionStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  transactionStatusText: { fontSize: 10, fontWeight: "600" },
  transactionClient: { fontSize: 12 },
  transactionMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  transactionDate: { fontSize: 11 },
  transactionRight: { alignItems: "flex-end" },
  transactionAmount: { fontSize: 18, fontWeight: "bold" },
  // Modal
  modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center" },
  modalContent: {
    width: "85%",
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
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  modalIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  modalHeaderText: { flex: 1 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 4 },
  modalStatusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  modalStatusText: { fontSize: 11, fontWeight: "600" },
  modalClose: { padding: 4 },
  modalBody: { gap: 12 },
  modalInfoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  modalInfoText: { fontSize: 14, flex: 1 },
  modalDivider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.05)",
    marginVertical: 8,
  },
  modalId: { fontSize: 10, textAlign: "center" },
  modalButton: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
  },
  modalButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  emptyContainer: {
    alignItems: "center",
    padding: 40,
    borderRadius: 24,
    gap: 12,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: { fontSize: 16, fontWeight: "600" },
  emptyText: { fontSize: 13, textAlign: "center" },
  bottomSpace: { height: 30 },
});
