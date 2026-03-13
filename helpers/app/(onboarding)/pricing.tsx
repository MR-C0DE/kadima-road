import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useOnboarding } from "../../contexts/OnboardingContext";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

export default function PricingScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { data, updatePricing } = useOnboarding();

  // États locaux pour les inputs
  const [basePrice, setBasePrice] = useState(data.basePrice || "");
  const [perKm, setPerKm] = useState(data.perKm || "");
  const [focusedInput, setFocusedInput] = useState<"base" | "km" | null>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const basePriceAnim = useRef(new Animated.Value(0)).current;
  const perKmAnim = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    Animated.spring(basePriceAnim, {
      toValue: focusedInput === "base" ? 1 : 0,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
  }, [focusedInput]);

  useEffect(() => {
    Animated.spring(perKmAnim, {
      toValue: focusedInput === "km" ? 1 : 0,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
  }, [focusedInput]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["32%", "48%"],
  });

  const handleBasePriceChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, "");
    setBasePrice(numericValue);
    updatePricing(numericValue, perKm);
  };

  const handlePerKmChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, "");
    setPerKm(numericValue);
    updatePricing(basePrice, numericValue);
  };

  const basePriceBorderColor = basePriceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.primary],
  });

  const perKmBorderColor = perKmAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.primary],
  });

  const basePriceShadow = basePriceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.15],
  });

  const perKmShadow = perKmAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.15],
  });

  const isValid = basePrice && perKm;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Header fixe */}
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
          <Text style={styles.headerTitle}>Étape 3/6</Text>
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

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
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
                Vos tarifs
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Fixez vos prix pour les interventions
              </Text>
            </View>

            {/* Carte récapitulative */}
            <LinearGradient
              colors={[colors.primary + "10", colors.secondary + "05"]}
              style={styles.summaryCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text
                    style={[
                      styles.summaryLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Prix de base
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    ${basePrice || "0"}
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text
                    style={[
                      styles.summaryLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Par km
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    ${perKm || "0"}
                  </Text>
                </View>
              </View>
              <View style={styles.summaryTotal}>
                <Text
                  style={[
                    styles.summaryTotalLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  Total estimé pour 10km
                </Text>
                <Text
                  style={[styles.summaryTotalValue, { color: colors.primary }]}
                >
                  {basePrice && perKm
                    ? `$${parseInt(basePrice) + parseInt(perKm) * 10}`
                    : "--"}
                </Text>
              </View>
            </LinearGradient>

            {/* Prix de base */}
            <View style={styles.inputSection}>
              <View style={styles.inputHeader}>
                <Ionicons
                  name="cash-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Prix de base
                </Text>
                <Text style={[styles.inputCurrency, { color: colors.primary }]}>
                  $
                </Text>
              </View>

              <Animated.View
                style={[
                  styles.inputContainer,
                  {
                    borderColor: basePriceBorderColor,
                    shadowColor: colors.primary,
                    shadowOpacity: basePriceShadow,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 8,
                    elevation: basePriceAnim,
                  },
                ]}
              >
                <Text style={[styles.inputPrefix, { color: colors.primary }]}>
                  $
                </Text>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="25"
                  placeholderTextColor={colors.placeholder}
                  value={basePrice}
                  onChangeText={handleBasePriceChange}
                  keyboardType="numeric"
                  onFocus={() => setFocusedInput("base")}
                  onBlur={() => setFocusedInput(null)}
                />
              </Animated.View>
              <Text style={[styles.inputHint, { color: colors.textSecondary }]}>
                Montant de base pour toute intervention
              </Text>
            </View>

            {/* Frais par km */}
            <View style={styles.inputSection}>
              <View style={styles.inputHeader}>
                <Ionicons name="car-outline" size={20} color={colors.primary} />
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Frais par kilomètre
                </Text>
                <Text style={[styles.inputCurrency, { color: colors.primary }]}>
                  $/km
                </Text>
              </View>

              <Animated.View
                style={[
                  styles.inputContainer,
                  {
                    borderColor: perKmBorderColor,
                    shadowColor: colors.primary,
                    shadowOpacity: perKmShadow,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 8,
                    elevation: perKmAnim,
                  },
                ]}
              >
                <Text style={[styles.inputPrefix, { color: colors.primary }]}>
                  $
                </Text>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="1"
                  placeholderTextColor={colors.placeholder}
                  value={perKm}
                  onChangeText={handlePerKmChange}
                  keyboardType="numeric"
                  onFocus={() => setFocusedInput("km")}
                  onBlur={() => setFocusedInput(null)}
                />
              </Animated.View>
              <Text style={[styles.inputHint, { color: colors.textSecondary }]}>
                Frais additionnels par kilomètre parcouru
              </Text>
            </View>

            {/* Exemples */}
            <View style={styles.examplesSection}>
              <Text
                style={[styles.examplesTitle, { color: colors.textSecondary }]}
              >
                Exemples de tarifs
              </Text>
              <View style={styles.examplesGrid}>
                {[5, 10, 15, 20].map((distance) => {
                  const total =
                    basePrice && perKm
                      ? parseInt(basePrice) + parseInt(perKm) * distance
                      : null;
                  return (
                    <View
                      key={distance}
                      style={[
                        styles.exampleCard,
                        { backgroundColor: colors.card },
                      ]}
                    >
                      <Text
                        style={[styles.exampleDistance, { color: colors.text }]}
                      >
                        {distance} km
                      </Text>
                      <Text
                        style={[styles.examplePrice, { color: colors.primary }]}
                      >
                        {total ? `$${total}` : "--"}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Espace pour le bouton */}
            <View style={styles.bottomSpace} />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer fixe avec bouton */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.nextButton, !isValid && styles.disabledButton]}
          onPress={() => router.push("/(onboarding)/availability")}
          disabled={!isValid}
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
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: "center",
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "600",
  },
  summaryDivider: {
    width: 1,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  summaryTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  summaryTotalLabel: {
    fontSize: 13,
  },
  summaryTotalValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  inputSection: {
    marginBottom: 24,
  },
  inputHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  inputCurrency: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: "auto",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: "transparent",
  },
  inputPrefix: {
    fontSize: 18,
    fontWeight: "500",
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: "500",
    padding: 0,
  },
  inputHint: {
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  examplesSection: {
    marginTop: 8,
  },
  examplesTitle: {
    fontSize: 13,
    marginBottom: 12,
  },
  examplesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  exampleCard: {
    width: (width - 70) / 4,
    padding: 12,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  exampleDistance: {
    fontSize: 12,
    marginBottom: 4,
  },
  examplePrice: {
    fontSize: 14,
    fontWeight: "600",
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
