import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Animated,
  Easing,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../config/api";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");

// Questions fréquentes pour aider l'utilisateur
const COMMON_ISSUES = [
  {
    id: "no-start",
    label: "Ne démarre pas",
    icon: "flash-off",
    gradient: ["#E63946", "#B71C1C"],
    description: "Le moteur ne tourne pas",
  },
  {
    id: "strange-noise",
    label: "Bruit bizarre",
    icon: "volume-high",
    gradient: ["#D4AF37", "#B8860B"],
    description: "Cliquetis, sifflement",
  },
  {
    id: "check-engine",
    label: "Voyant moteur",
    icon: "warning",
    gradient: ["#800020", "#4A0010"],
    description: "Témoin allumé",
  },
  {
    id: "overheating",
    label: "Surchauffe",
    icon: "thermometer",
    gradient: ["#E63946", "#B71C1C"],
    description: "Température élevée",
  },
  {
    id: "vibration",
    label: "Vibrations",
    icon: "car",
    gradient: ["#D4AF37", "#B8860B"],
    description: "Tremblements",
  },
  {
    id: "smoke",
    label: "Fumée",
    icon: "cloudy",
    gradient: ["#800020", "#4A0010"],
    description: "Fumée anormale",
  },
];

// Diagnostic rapide
const QUICK_DIAGNOSTICS = [
  {
    id: "battery",
    label: "Batterie",
    icon: "battery-dead",
    description: "Vérifier la batterie",
    color: "#E63946",
  },
  {
    id: "tire",
    label: "Pneus",
    icon: "car-sport",
    description: "Vérifier pression",
    color: "#D4AF37",
  },
  {
    id: "oil",
    label: "Huile",
    icon: "water",
    description: "Niveau d'huile",
    color: "#800020",
  },
  {
    id: "brakes",
    label: "Freins",
    icon: "warning",
    description: "Usure freins",
    color: "#E63946",
  },
  {
    id: "engine",
    label: "Moteur",
    icon: "cog",
    description: "Performance",
    color: "#D4AF37",
  },
  {
    id: "lights",
    label: "Lumières",
    icon: "flashlight",
    description: "Éclairage",
    color: "#800020",
  },
];

export default function DiagnosticScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedQuick, setSelectedQuick] = useState(null);
  const [selectedQuickDiagnostic, setSelectedQuickDiagnostic] = useState(null);

  // Animations - utilisation de useState
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [scaleAnim] = useState(new Animated.Value(0.95));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [inputFocusAnim] = useState(new Animated.Value(0));

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

    // Animation de pulsation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleStartDiagnostic = async () => {
    if (!description.trim()) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert("Erreur", "Veuillez décrire le problème");
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setLoading(true);
    try {
      const response = await api.post("/diagnostic/start", {
        description: description.trim(),
      });

      router.push({
        pathname: "/diagnostic/result",
        params: {
          sessionId: response.data.data.sessionId,
          description: description,
          questions: JSON.stringify(response.data.data.questions),
        },
      });
    } catch (error) {
      Alert.alert("Erreur", "Impossible de démarrer le diagnostic");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (issue) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const descriptions = {
      "no-start":
        "Ma voiture ne démarre pas, le moteur ne tourne pas. J'entends un clic mais rien ne se passe.",
      "strange-noise":
        "Ma voiture fait un bruit étrange quand je roule. C'est un bruit de cliquetis qui augmente avec l'accélération.",
      "check-engine":
        "Le voyant moteur est allumé sur le tableau de bord. La voiture semble fonctionner normalement mais je m'inquiète.",
      overheating:
        "La température du moteur est trop élevée. La jauge est dans le rouge et de la vapeur sort du capot.",
      vibration:
        "Ma voiture vibre anormalement, surtout à haute vitesse. Le volant tremble.",
      smoke:
        "De la fumée sort du moteur ou de l'échappement. Elle est blanche/bleue/noire.",
    };

    setDescription(descriptions[issue.id] || "");
    setSelectedQuick(issue.id);
  };

  const handleQuickDiagnostic = (item) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setSelectedQuickDiagnostic(item.id);

    const descriptions = {
      battery:
        "Je soupçonne un problème de batterie. La voiture a du mal à démarrer et les lumières sont faibles.",
      tire: "Je pense avoir un problème de pneu. La voiture tire d'un côté ou je sens des vibrations.",
      oil: "Je veux vérifier le niveau d'huile. Le voyant d'huile est allumé ou je n'ai pas fait de vidange depuis longtemps.",
      brakes:
        "J'ai un problème de freins. Ils font du bruit, sont mous ou la pédale vibre.",
      engine: "Le moteur fait un bruit anormal ou manque de puissance.",
      lights: "Un ou plusieurs feux ne fonctionnent pas.",
    };

    setDescription(descriptions[item.id] || "");
  };

  const handleFocus = () => {
    Animated.spring(inputFocusAnim, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    Animated.spring(inputFocusAnim, {
      toValue: 0,
      friction: 5,
      tension: 40,
      useNativeDriver: false,
    }).start();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Fond avec dégradé */}
      <LinearGradient
        colors={
          colorScheme === "dark"
            ? ["rgba(212,175,55,0.05)", "rgba(128,0,32,0.05)"]
            : ["rgba(212,175,55,0.02)", "rgba(128,0,32,0.02)"]
        }
        style={StyleSheet.absoluteFill}
      />

      {/* Cercles décoratifs */}
      <Animated.View
        style={[
          styles.decorativeCircle,
          styles.circle1,
          {
            backgroundColor: colors.primary + "10",
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.decorativeCircle,
          styles.circle2,
          {
            backgroundColor: colors.secondary + "10",
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.push("/(tabs)")}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>

            <View style={styles.headerContent}>
              <View style={styles.headerIconContainer}>
                <Ionicons name="medkit" size={50} color="#fff" />
              </View>
              <Text style={styles.headerTitle}>Diagnostic IA</Text>
              <Text style={styles.headerSubtitle}>
                Décrivez votre panne pour obtenir une analyse instantanée
              </Text>
            </View>
          </LinearGradient>

          {/* Diagnostic rapide avec indicateur de scroll */}
          <View style={styles.quickDiagnosticSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Diagnostic rapide
              </Text>
              <View style={styles.scrollHint}>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.primary}
                />
                <Text
                  style={[styles.scrollHintText, { color: colors.primary }]}
                >
                  Faites défiler
                </Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickDiagnosticScroll}
            >
              {QUICK_DIAGNOSTICS.map((item, index) => (
                <Animated.View
                  key={item.id}
                  style={[
                    styles.quickDiagnosticItem,
                    selectedQuickDiagnostic === item.id &&
                      styles.quickDiagnosticItemSelected,
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
                  <TouchableOpacity
                    onPress={() => handleQuickDiagnostic(item)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={
                        selectedQuickDiagnostic === item.id
                          ? [item.color, item.color + "80"]
                          : ["transparent", "transparent"]
                      }
                      style={[
                        styles.quickDiagnosticGradient,
                        selectedQuickDiagnostic !== item.id && {
                          borderWidth: 2,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name={item.icon}
                        size={28}
                        color={
                          selectedQuickDiagnostic === item.id
                            ? "#fff"
                            : colors.primary
                        }
                      />
                    </LinearGradient>
                    <Text
                      style={[
                        styles.quickDiagnosticLabel,
                        {
                          color:
                            selectedQuickDiagnostic === item.id
                              ? colors.primary
                              : colors.text,
                          fontWeight:
                            selectedQuickDiagnostic === item.id
                              ? "bold"
                              : "normal",
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                    <Text
                      style={[
                        styles.quickDiagnosticDesc,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {item.description}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
              {/* Indicateur de fin de scroll */}
              <View style={styles.scrollEndIndicator}>
                <Ionicons
                  name="arrow-forward-circle"
                  size={24}
                  color={colors.primary}
                />
              </View>
            </ScrollView>
          </View>

          {/* Problèmes fréquents */}
          <View style={styles.quickSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Problèmes fréquents
            </Text>
            <View style={styles.quickGrid}>
              {COMMON_ISSUES.map((issue, index) => (
                <Animated.View
                  key={issue.id}
                  style={[
                    styles.quickButtonWrapper,
                    {
                      opacity: fadeAnim,
                      transform: [
                        {
                          translateY: slideAnim.interpolate({
                            inputRange: [0, 50],
                            outputRange: [0, 20 * (index + 1)],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.quickButton,
                      selectedQuick === issue.id && styles.quickButtonSelected,
                    ]}
                    onPress={() => handleQuickSelect(issue)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={
                        selectedQuick === issue.id
                          ? issue.gradient
                          : ["transparent", "transparent"]
                      }
                      style={[
                        styles.quickButtonGradient,
                        selectedQuick !== issue.id && {
                          borderWidth: 1,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name={issue.icon}
                        size={28}
                        color={
                          selectedQuick === issue.id ? "#fff" : colors.primary
                        }
                      />
                      <Text
                        style={[
                          styles.quickLabel,
                          {
                            color:
                              selectedQuick === issue.id ? "#fff" : colors.text,
                            fontWeight:
                              selectedQuick === issue.id ? "bold" : "normal",
                          },
                        ]}
                      >
                        {issue.label}
                      </Text>
                      <Text
                        style={[
                          styles.quickDesc,
                          {
                            color:
                              selectedQuick === issue.id
                                ? "#fff"
                                : colors.textSecondary,
                          },
                        ]}
                      >
                        {issue.description}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </View>

          {/* Zone de description */}
          <View style={styles.descriptionSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Description détaillée
            </Text>

            <Animated.View
              style={[
                styles.inputContainer,
                {
                  borderColor: inputFocusAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [colors.border, colors.primary],
                  }),
                  borderWidth: inputFocusAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 2],
                  }),
                },
              ]}
            >
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    height: 150,
                  },
                ]}
                placeholder="Ex: Ma voiture fait un bruit de cliquetis quand j'accélère..."
                placeholderTextColor={colors.placeholder}
                multiline
                value={description}
                onChangeText={setDescription}
                textAlignVertical="top"
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </Animated.View>

            {/* Suggestions */}
            {description.length === 0 && (
              <View style={styles.suggestionsContainer}>
                <Text
                  style={[
                    styles.suggestionsTitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  Suggestions :
                </Text>
                <View style={styles.suggestionChips}>
                  <TouchableOpacity
                    style={[
                      styles.suggestionChip,
                      { borderColor: colors.border },
                    ]}
                    onPress={() =>
                      setDescription("La voiture tremble à l'accélération")
                    }
                  >
                    <Text
                      style={[
                        styles.suggestionChipText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Tremblement
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.suggestionChip,
                      { borderColor: colors.border },
                    ]}
                    onPress={() => setDescription("Le moteur cale au ralenti")}
                  >
                    <Text
                      style={[
                        styles.suggestionChipText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Moteur cale
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.suggestionChip,
                      { borderColor: colors.border },
                    ]}
                    onPress={() =>
                      setDescription("Fumée blanche à l'échappement")
                    }
                  >
                    <Text
                      style={[
                        styles.suggestionChipText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Fumée blanche
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Boutons d'action */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.startButtonWrapper}
                onPress={handleStartDiagnostic}
                disabled={loading || !description.trim()}
                activeOpacity={0.8}
              >
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <LinearGradient
                    colors={
                      description.trim()
                        ? [colors.primary, colors.secondary]
                        : [colors.disabled, colors.disabled]
                    }
                    style={styles.startButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="search" size={24} color="#fff" />
                        <Text style={styles.startButtonText}>
                          Démarrer le diagnostic
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </Animated.View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: colors.border }]}
                onPress={() => router.push("/(tabs)")}
              >
                <Ionicons name="home" size={20} color={colors.textSecondary} />
                <Text
                  style={[
                    styles.secondaryButtonText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Retour à l'accueil
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Statistiques */}
          <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
            <View style={styles.statItem}>
              <Ionicons name="time" size={20} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                2-3 min
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Diagnostic
              </Text>
            </View>
            <View
              style={[styles.statDivider, { backgroundColor: colors.border }]}
            />
            <View style={styles.statItem}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.statValue, { color: colors.text }]}>
                98%
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Précision
              </Text>
            </View>
            <View
              style={[styles.statDivider, { backgroundColor: colors.border }]}
            />
            <View style={styles.statItem}>
              <Ionicons name="car" size={20} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                150+
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Pannes
              </Text>
            </View>
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
  decorativeCircle: {
    position: "absolute",
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
  },
  circle1: {
    top: -width * 0.2,
    right: -width * 0.2,
  },
  circle2: {
    bottom: -width * 0.2,
    left: -width * 0.2,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    position: "relative",
  },
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerContent: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  headerIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  quickDiagnosticSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  scrollHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  scrollHintText: {
    fontSize: 12,
  },
  quickDiagnosticScroll: {
    paddingHorizontal: 20,
    gap: 12,
    paddingRight: 30,
  },
  quickDiagnosticItem: {
    width: 100,
    marginRight: 5,
  },
  quickDiagnosticItemSelected: {
    transform: [{ scale: 1.05 }],
  },
  quickDiagnosticGradient: {
    width: 100,
    height: 100,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    backgroundColor: "transparent",
  },
  quickDiagnosticLabel: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  quickDiagnosticDesc: {
    fontSize: 10,
    textAlign: "center",
  },
  scrollEndIndicator: {
    width: 40,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 5,
  },
  quickSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickButtonWrapper: {
    width: "48%",
    marginBottom: 12,
  },
  quickButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  quickButtonSelected: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  quickButtonGradient: {
    padding: 16,
    alignItems: "center",
    borderRadius: 16,
  },
  quickLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 2,
  },
  quickDesc: {
    fontSize: 10,
    textAlign: "center",
  },
  descriptionSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  inputContainer: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 15,
    overflow: "hidden",
  },
  input: {
    padding: 16,
    fontSize: 16,
    textAlignVertical: "top",
  },
  suggestionsContainer: {
    marginBottom: 20,
  },
  suggestionsTitle: {
    fontSize: 14,
    marginBottom: 10,
  },
  suggestionChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  suggestionChipText: {
    fontSize: 12,
  },
  actionButtons: {
    gap: 10,
  },
  startButtonWrapper: {
    borderRadius: 16,
    overflow: "hidden",
  },
  startButtonGradient: {
    flexDirection: "row",
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  startButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  secondaryButton: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  statsCard: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 10,
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    height: "70%",
    alignSelf: "center",
  },
});
