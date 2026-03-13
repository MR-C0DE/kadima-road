import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Animated,
  Dimensions,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { useOnboarding } from "../../contexts/OnboardingContext";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const DAYS = [
  { id: "monday", label: "Lundi", short: "LUN", icon: "calendar-outline" },
  { id: "tuesday", label: "Mardi", short: "MAR", icon: "calendar-outline" },
  {
    id: "wednesday",
    label: "Mercredi",
    short: "MER",
    icon: "calendar-outline",
  },
  { id: "thursday", label: "Jeudi", short: "JEU", icon: "calendar-outline" },
  { id: "friday", label: "Vendredi", short: "VEN", icon: "calendar-outline" },
  { id: "saturday", label: "Samedi", short: "SAM", icon: "calendar-outline" },
  { id: "sunday", label: "Dimanche", short: "DIM", icon: "calendar-outline" },
];

export default function AvailabilityScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { data, updateAvailability } = useOnboarding();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [selectAllAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["48%", "64%"],
  });

  const toggleDay = (dayId: string) => {
    updateAvailability({
      ...data.availability,
      [dayId]: !data.availability[dayId],
    });
  };

  const selectAll = () => {
    const allSelected = Object.values(data.availability).every(Boolean);
    const newAvailability = {};
    DAYS.forEach((day) => {
      newAvailability[day.id] = !allSelected;
    });
    updateAvailability(newAvailability);

    Animated.sequence([
      Animated.spring(selectAllAnim, {
        toValue: 0.95,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.spring(selectAllAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const selectedCount = Object.values(data.availability).filter(Boolean).length;
  const allSelected = selectedCount === DAYS.length;
  const someSelected = selectedCount > 0 && selectedCount < DAYS.length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Étape 4/6</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Barre de progression */}
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBar,
              { backgroundColor: "rgba(255,255,255,0.2)" },
            ]}
          >
            <Animated.View
              style={[
                styles.progressFill,
                { backgroundColor: "#fff", width: progressWidth },
              ]}
            />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
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
          {/* Titre */}
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: colors.text }]}>
              Vos disponibilités
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Sélectionnez vos jours de travail
            </Text>
          </View>

          {/* Carte résumé */}
          <LinearGradient
            colors={[colors.primary + "10", colors.secondary + "05"]}
            style={styles.summaryCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.primary }]}>
                  {selectedCount}
                </Text>
                <Text
                  style={[styles.summaryLabel, { color: colors.textSecondary }]}
                >
                  jours sélectionnés
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {DAYS.length - selectedCount}
                </Text>
                <Text
                  style={[styles.summaryLabel, { color: colors.textSecondary }]}
                >
                  jours off
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* Bouton Tout sélectionner */}
          <Animated.View style={{ transform: [{ scale: selectAllAnim }] }}>
            <TouchableOpacity
              style={[
                styles.selectAllButton,
                {
                  backgroundColor: colors.card,
                  borderColor: allSelected ? colors.primary : colors.border,
                },
              ]}
              onPress={selectAll}
              activeOpacity={0.7}
            >
              <Ionicons
                name={allSelected ? "checkmark-circle" : "checkbox-outline"}
                size={20}
                color={allSelected ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.selectAllText,
                  { color: allSelected ? colors.primary : colors.text },
                ]}
              >
                {allSelected ? "Tout désélectionner" : "Sélectionner tout"}
              </Text>
              {someSelected && !allSelected && (
                <View
                  style={[
                    styles.partialIndicator,
                    { backgroundColor: colors.primary },
                  ]}
                />
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Liste des jours */}
          <View style={styles.daysContainer}>
            {DAYS.map((day, index) => {
              const isSelected = data.availability[day.id];
              const translateY = slideAnim.interpolate({
                inputRange: [0, 30],
                outputRange: [0, 10 * (index + 1)],
              });

              return (
                <Animated.View
                  key={day.id}
                  style={[
                    styles.dayWrapper,
                    {
                      opacity: fadeAnim,
                      transform: [{ translateY }],
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.dayCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: isSelected
                          ? colors.primary
                          : colors.border,
                      },
                    ]}
                    onPress={() => toggleDay(day.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dayLeft}>
                      <View
                        style={[
                          styles.dayIcon,
                          {
                            backgroundColor: isSelected
                              ? colors.primary + "15"
                              : "transparent",
                          },
                        ]}
                      >
                        <Ionicons
                          name={isSelected ? "calendar" : "calendar-outline"}
                          size={22}
                          color={
                            isSelected ? colors.primary : colors.textSecondary
                          }
                        />
                      </View>
                      <View>
                        <Text style={[styles.dayLabel, { color: colors.text }]}>
                          {day.label}
                        </Text>
                        <Text
                          style={[
                            styles.dayShort,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {day.short}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.dayRight}>
                      {isSelected ? (
                        <View
                          style={[
                            styles.selectedBadge,
                            { backgroundColor: colors.primary },
                          ]}
                        >
                          <Ionicons name="checkmark" size={14} color="#fff" />
                        </View>
                      ) : (
                        <View
                          style={[
                            styles.unselectedBadge,
                            { borderColor: colors.border },
                          ]}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>

          {/* Message d'information */}
          <View style={styles.infoContainer}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Vous pourrez modifier vos disponibilités à tout moment
            </Text>
          </View>

          {/* Espace pour le bouton */}
          <View style={styles.bottomSpace} />
        </Animated.View>
      </ScrollView>

      {/* Footer avec bouton */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            selectedCount === 0 && styles.disabledButton,
          ]}
          onPress={() => router.push("/(onboarding)/equipment")}
          disabled={selectedCount === 0}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.nextButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.nextButtonText}>Continuer</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 15,
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
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  headerRight: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: 20,
  },
  progressBar: {
    height: 4,
    width: "100%",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  titleContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  summaryItem: {
    alignItems: "center",
    flex: 1,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 13,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  selectAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    gap: 8,
    position: "relative",
  },
  selectAllText: {
    fontSize: 15,
    fontWeight: "500",
  },
  partialIndicator: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#fff",
  },
  daysContainer: {
    gap: 10,
    marginBottom: 16,
  },
  dayWrapper: {
    width: "100%",
  },
  dayCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  dayLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dayIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  dayShort: {
    fontSize: 12,
  },
  dayRight: {
    alignItems: "center",
  },
  selectedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  unselectedBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
  },
  infoText: {
    fontSize: 12,
  },
  bottomSpace: {
    height: 30,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  nextButton: {
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  nextButtonGradient: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  disabledButton: {
    opacity: 0.5,
  },
});
