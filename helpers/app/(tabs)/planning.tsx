// helpers/app/(tabs)/planning.tsx - Version corrigée
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
  Switch,
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

interface DaySchedule {
  day: string;
  isActive: boolean;
  startTime: string;
  endTime: string;
}

const DAYS = [
  { id: "monday", label: "Lundi", short: "L" },
  { id: "tuesday", label: "Mardi", short: "M" },
  { id: "wednesday", label: "Mercredi", short: "M" },
  { id: "thursday", label: "Jeudi", short: "J" },
  { id: "friday", label: "Vendredi", short: "V" },
  { id: "saturday", label: "Samedi", short: "S" },
  { id: "sunday", label: "Dimanche", short: "D" },
];

const TIME_SLOTS = [
  "00:00",
  "01:00",
  "02:00",
  "03:00",
  "04:00",
  "05:00",
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
  "23:00",
];

export default function PlanningScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // États
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [globalAvailability, setGlobalAvailability] = useState(true);
  const [schedule, setSchedule] = useState<DaySchedule[]>(
    DAYS.map((day) => ({
      day: day.id,
      isActive: true,
      startTime: "09:00",
      endTime: "18:00",
    }))
  );
  const [selectedDay, setSelectedDay] = useState<string>("monday");
  const [showTimePicker, setShowTimePicker] = useState<"start" | "end" | null>(
    null
  );

  // Animations - initialiser avec des valeurs par défaut pour éviter les problèmes
  const fadeAnim = useRef(new Animated.Value(1)).current; // ← Démarrer à 1 (visible)
  const slideAnim = useRef(new Animated.Value(0)).current; // ← Démarrer à 0 (pas de translation)
  const scaleAnim = useRef(new Animated.Value(1)).current; // ← Démarrer à 1 (pas d'échelle)

  // Référence pour éviter les appels multiples
  const isMountedRef = useRef(true);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    isMountedRef.current = true;

    // Timeout de sécurité
    loadingTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current && loading) {
        console.log("⚠️ Planning - Timeout, arrêt du chargement");
        setLoading(false);
      }
    }, 5000);

    // Chargement des données
    loadAvailability();

    // Nettoyage
    return () => {
      isMountedRef.current = false;
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  const loadAvailability = async () => {
    try {
      const response = await api.get("/helpers/availability");
      const data = response.data.data;

      if (isMountedRef.current) {
        setGlobalAvailability(data.isAvailable);

        if (data.schedule && data.schedule.length > 0) {
          setSchedule(data.schedule);
        }
        console.log("✅ Planning chargé avec succès");
      }
    } catch (error) {
      console.log("❌ Erreur chargement planning:", error);
    } finally {
      if (isMountedRef.current) {
        // ✅ Forcer loading à false après 500ms minimum pour que l'utilisateur voit au moins un aperçu
        setTimeout(() => {
          if (isMountedRef.current) {
            setLoading(false);
          }
        }, 500);
      }
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadAvailability();
    setRefreshing(false);
  };

  const toggleGlobalAvailability = async () => {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newStatus = !globalAvailability;

    try {
      await api.put("/helpers/availability", { isAvailable: newStatus });
      setGlobalAvailability(newStatus);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert("Erreur", "Impossible de changer votre statut");
    }
  };

  const toggleDayActive = (dayId: string) => {
    setSchedule(
      schedule.map((day) =>
        day.day === dayId ? { ...day, isActive: !day.isActive } : day
      )
    );
  };

  const updateDayTime = (
    dayId: string,
    type: "start" | "end",
    time: string
  ) => {
    setSchedule(
      schedule.map((day) =>
        day.day === dayId ? { ...day, [`${type}Time`]: time } : day
      )
    );
    setShowTimePicker(null);
  };

  const saveSchedule = async () => {
    if (Platform.OS !== "web")
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const activeDays = schedule.filter((day) => day.isActive);
      await api.put("/helpers/availability", {
        isAvailable: globalAvailability,
        schedule: activeDays.map((day) => ({
          day: day.day,
          startTime: day.startTime,
          endTime: day.endTime,
        })),
      });
      Alert.alert("Succès", "Planning mis à jour");
    } catch (error) {
      Alert.alert("Erreur", "Impossible de sauvegarder le planning");
    }
  };

  const getCurrentDaySchedule = () =>
    schedule.find((d) => d.day === selectedDay);

  // ✅ Écran de chargement SIMPLIFIÉ (sans animations problématiques)
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.loadingLogo}
          >
            <Ionicons name="calendar" size={40} color="#fff" />
          </LinearGradient>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Chargement...
          </Text>
        </View>
      </View>
    );
  }

  const currentDaySchedule = getCurrentDaySchedule();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Header */}
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
          <Text style={styles.headerTitle}>Planning</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.headerButton}>
            <Ionicons name="refresh" size={24} color="#fff" />
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
          />
        }
      >
        {/* ✅ Suppression des animations qui causent des problèmes */}
        <View style={styles.content}>
          {/* Statut global */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View
                  style={[
                    styles.iconContainer,
                    {
                      backgroundColor: globalAvailability
                        ? colors.success + "20"
                        : colors.error + "20",
                    },
                  ]}
                >
                  <Ionicons
                    name={globalAvailability ? "sunny" : "moon"}
                    size={24}
                    color={globalAvailability ? colors.success : colors.error}
                  />
                </View>
                <View>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>
                    Disponibilité
                  </Text>
                  <Text
                    style={[
                      styles.value,
                      {
                        color: globalAvailability
                          ? colors.success
                          : colors.error,
                      },
                    ]}
                  >
                    {globalAvailability ? "Disponible" : "Indisponible"}
                  </Text>
                </View>
              </View>
              <Switch
                value={globalAvailability}
                onValueChange={toggleGlobalAvailability}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
          </View>

          {/* Sélecteur de jours */}
          <View style={styles.daysWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.daysContainer}
            >
              {DAYS.map((day) => {
                const isSelected = selectedDay === day.id;
                const isActive = schedule.find(
                  (d) => d.day === day.id
                )?.isActive;
                return (
                  <TouchableOpacity
                    key={day.id}
                    style={[
                      styles.dayButton,
                      isSelected && { backgroundColor: colors.primary + "15" },
                    ]}
                    onPress={() => setSelectedDay(day.id)}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        {
                          color: isSelected
                            ? colors.primary
                            : colors.textSecondary,
                        },
                      ]}
                    >
                      {day.short}
                    </Text>
                    {isActive && (
                      <View
                        style={[
                          styles.dayDot,
                          { backgroundColor: colors.success },
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Carte du jour */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.dayHeader}>
              <View>
                <Text style={[styles.dayTitle, { color: colors.text }]}>
                  {DAYS.find((d) => d.id === selectedDay)?.label}
                </Text>
                <Text
                  style={[styles.daySubtitle, { color: colors.textSecondary }]}
                >
                  {currentDaySchedule?.isActive
                    ? `${currentDaySchedule.startTime} - ${currentDaySchedule.endTime}`
                    : "Jour non travaillé"}
                </Text>
              </View>
              <Switch
                value={currentDaySchedule?.isActive || false}
                onValueChange={() => toggleDayActive(selectedDay)}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>

            {currentDaySchedule?.isActive && (
              <View style={styles.timeSection}>
                {/* Début */}
                <TouchableOpacity
                  style={[
                    styles.timeRow,
                    { backgroundColor: colors.background },
                  ]}
                  onPress={() =>
                    setShowTimePicker(
                      showTimePicker === "start" ? null : "start"
                    )
                  }
                >
                  <Text
                    style={[styles.timeLabel, { color: colors.textSecondary }]}
                  >
                    Début
                  </Text>
                  <View style={styles.timeValue}>
                    <Text style={[styles.timeText, { color: colors.text }]}>
                      {currentDaySchedule.startTime}
                    </Text>
                    <Ionicons
                      name={
                        showTimePicker === "start"
                          ? "chevron-up"
                          : "chevron-down"
                      }
                      size={18}
                      color={colors.primary}
                    />
                  </View>
                </TouchableOpacity>

                {showTimePicker === "start" && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.timePicker}
                  >
                    {TIME_SLOTS.map((time) => (
                      <TouchableOpacity
                        key={time}
                        style={[
                          styles.timeSlot,
                          currentDaySchedule.startTime === time && {
                            backgroundColor: colors.primary,
                          },
                        ]}
                        onPress={() =>
                          updateDayTime(selectedDay, "start", time)
                        }
                      >
                        <Text
                          style={[
                            styles.timeSlotText,
                            {
                              color:
                                currentDaySchedule.startTime === time
                                  ? "#fff"
                                  : colors.text,
                            },
                          ]}
                        >
                          {time}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}

                {/* Fin */}
                <TouchableOpacity
                  style={[
                    styles.timeRow,
                    { backgroundColor: colors.background },
                  ]}
                  onPress={() =>
                    setShowTimePicker(showTimePicker === "end" ? null : "end")
                  }
                >
                  <Text
                    style={[styles.timeLabel, { color: colors.textSecondary }]}
                  >
                    Fin
                  </Text>
                  <View style={styles.timeValue}>
                    <Text style={[styles.timeText, { color: colors.text }]}>
                      {currentDaySchedule.endTime}
                    </Text>
                    <Ionicons
                      name={
                        showTimePicker === "end" ? "chevron-up" : "chevron-down"
                      }
                      size={18}
                      color={colors.primary}
                    />
                  </View>
                </TouchableOpacity>

                {showTimePicker === "end" && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.timePicker}
                  >
                    {TIME_SLOTS.map((time) => (
                      <TouchableOpacity
                        key={time}
                        style={[
                          styles.timeSlot,
                          currentDaySchedule.endTime === time && {
                            backgroundColor: colors.primary,
                          },
                        ]}
                        onPress={() => updateDayTime(selectedDay, "end", time)}
                      >
                        <Text
                          style={[
                            styles.timeSlotText,
                            {
                              color:
                                currentDaySchedule.endTime === time
                                  ? "#fff"
                                  : colors.text,
                            },
                          ]}
                        >
                          {time}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}
          </View>

          {/* Résumé de la semaine */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Résumé de la semaine
            </Text>
            <View style={styles.summaryGrid}>
              {DAYS.map((day) => {
                const daySchedule = schedule.find((d) => d.day === day.id);
                const isActive = daySchedule?.isActive && globalAvailability;
                return (
                  <View key={day.id} style={styles.summaryItem}>
                    <Text
                      style={[
                        styles.summaryDay,
                        {
                          color: isActive
                            ? colors.primary
                            : colors.textSecondary,
                        },
                      ]}
                    >
                      {day.short}
                    </Text>
                    {isActive ? (
                      <Text
                        style={[
                          styles.summaryTime,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {daySchedule.startTime}
                      </Text>
                    ) : (
                      <View
                        style={[
                          styles.summaryDot,
                          { backgroundColor: colors.border },
                        ]}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Bouton sauvegarder */}
          <TouchableOpacity style={styles.saveButton} onPress={saveSchedule}>
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.saveButtonGradient}
            >
              <Text style={styles.saveButtonText}>Sauvegarder</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.bottomSpace} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  loadingText: {
    fontSize: 14,
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
  content: {
    padding: 16,
    gap: 16,
  },
  // Cartes unifiées
  card: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    fontSize: 12,
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
  },
  // Jours
  daysWrapper: {
    marginVertical: 4,
  },
  daysContainer: {
    gap: 8,
    paddingHorizontal: 4,
  },
  dayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  dayText: {
    fontSize: 16,
    fontWeight: "600",
  },
  dayDot: {
    position: "absolute",
    bottom: 6,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  // Jour sélectionné
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 2,
  },
  daySubtitle: {
    fontSize: 13,
  },
  timeSection: {
    gap: 8,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 14,
  },
  timeLabel: {
    fontSize: 14,
  },
  timeValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeText: {
    fontSize: 15,
    fontWeight: "500",
  },
  timePicker: {
    maxHeight: 48,
  },
  timeSlot: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "rgba(0,0,0,0.03)",
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: "500",
  },
  // Résumé
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryItem: {
    alignItems: "center",
    gap: 4,
  },
  summaryDay: {
    fontSize: 13,
    fontWeight: "600",
  },
  summaryTime: {
    fontSize: 11,
  },
  summaryDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  // Bouton
  saveButton: {
    borderRadius: 30,
    overflow: "hidden",
    marginTop: 8,
  },
  saveButtonGradient: {
    padding: 16,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomSpace: {
    height: 80,
  },
});
