import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Dimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { api } from "../../../config/api";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

interface Log {
  _id: string;
  type: string;
  title: string;
  description: string;
  createdAt: string;
  metadata?: any;
  user?: { firstName: string; lastName: string };
}

export default function VehicleLogScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    loadLogs();
  }, [id, filter]);

  const loadLogs = async () => {
    try {
      const params: any = {};
      if (filter !== "all") params.type = filter;
      const response = await api.get(`/vehicles/${id}/logs`, { params });
      setLogs(response.data.data);
    } catch (error) {
      console.log("Erreur chargement logs:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLogs();
  };

  const getIconName = (type: string) => {
    switch (type) {
      case "intervention":
        return "construct";
      case "diagnostic":
        return "medkit";
      case "note":
        return "document-text";
      case "transfer":
        return "swap-horizontal";
      case "sos":
        return "alert-circle";
      case "maintenance":
        return "calendar";
      case "mileage_update":
        return "speedometer";
      default:
        return "time";
    }
  };

  const getIconBgColor = (type: string) => {
    switch (type) {
      case "intervention":
        return "#4CAF50";
      case "diagnostic":
        return "#2196F3";
      case "note":
        return "#9C27B0";
      case "transfer":
        return "#FF9800";
      case "sos":
        return "#F44336";
      case "maintenance":
        return "#009688";
      case "mileage_update":
        return "#3F51B5";
      default:
        return "#9E9E9E";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filters = [
    { id: "all", label: "Tous" },
    { id: "intervention", label: "Interventions" },
    { id: "diagnostic", label: "Diagnostics" },
    { id: "maintenance", label: "Maintenance" },
    { id: "note", label: "Notes" },
  ];

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Journal du véhicule</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      {/* Filtres */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        {filters.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[
              styles.filterChip,
              filter === f.id && { backgroundColor: colors.primary },
            ]}
            onPress={() => setFilter(f.id)}
          >
            <Text
              style={[
                styles.filterText,
                { color: filter === f.id ? "#fff" : colors.textSecondary },
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {logs.length > 0 ? (
          logs.map((log, index) => (
            <View
              key={log._id}
              style={[
                styles.logCard,
                { backgroundColor: colors.card },
                index === logs.length - 1 && styles.lastCard,
              ]}
            >
              <View style={styles.logHeader}>
                <View
                  style={[
                    styles.logIcon,
                    { backgroundColor: getIconBgColor(log.type) + "20" },
                  ]}
                >
                  <Ionicons
                    name={getIconName(log.type)}
                    size={22}
                    color={getIconBgColor(log.type)}
                  />
                </View>
                <View style={styles.logInfo}>
                  <Text style={[styles.logTitle, { color: colors.text }]}>
                    {log.title}
                  </Text>
                  <Text
                    style={[styles.logDate, { color: colors.textSecondary }]}
                  >
                    {formatDate(log.createdAt)}
                  </Text>
                </View>
              </View>
              <Text
                style={[styles.logDescription, { color: colors.textSecondary }]}
              >
                {log.description}
              </Text>
              {log.user && (
                <Text
                  style={[styles.logAuthor, { color: colors.textSecondary }]}
                >
                  Par {log.user.firstName} {log.user.lastName}
                </Text>
              )}
            </View>
          ))
        ) : (
          <View
            style={[styles.emptyContainer, { backgroundColor: colors.card }]}
          >
            <Ionicons
              name="document-text-outline"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Aucun événement
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Le journal du véhicule est vide
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 60,
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
  filtersContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 25,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  filterText: {
    fontSize: 13,
    fontWeight: "500",
  },
  scrollContent: {
    padding: 20,
    gap: 12,
  },
  logCard: {
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  lastCard: {
    marginBottom: 0,
  },
  logHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  logIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  logInfo: {
    flex: 1,
  },
  logTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  logDate: {
    fontSize: 11,
  },
  logDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  logAuthor: {
    fontSize: 11,
    fontStyle: "italic",
  },
  emptyContainer: {
    alignItems: "center",
    padding: 40,
    borderRadius: 20,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
});
