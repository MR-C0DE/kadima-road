import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Animated,
  Easing,
  Platform,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../config/api";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Mapping des sévérités
const SEVERITY_CONFIG = {
  VERT: {
    color: "#4CAF50",
    bgColor: "#4CAF5020",
    icon: "checkmark-circle",
    text: "Peut rouler",
    description: "Situation stable, vous pouvez continuer votre route",
  },
  ORANGE: {
    color: "#FF9800",
    bgColor: "#FF980020",
    icon: "warning",
    text: "Prudence recommandée",
    description: "Soyez vigilant, une réparation est conseillée",
  },
  ROUGE: {
    color: "#E63946",
    bgColor: "#E6394620",
    icon: "alert-circle",
    text: "Ne pas rouler",
    description: "Situation dangereuse, ne démarrez pas",
  },
};

export default function DiagnosticResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [diagnostic, setDiagnostic] = useState(null);
  const [loading, setLoading] = useState(false);
  const [textAnswer, setTextAnswer] = useState("");

  useEffect(() => {
    if (params.questions) {
      setQuestions(JSON.parse(params.questions));
    }

    // Animation d'entrée
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

    // Animation de rotation continue
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  useEffect(() => {
    if (diagnostic) {
      // Animation de progression quand le diagnostic arrive
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(
          diagnostic.diagnostic?.severity === "ROUGE"
            ? Haptics.NotificationFeedbackType.Error
            : diagnostic.diagnostic?.severity === "ORANGE"
            ? Haptics.NotificationFeedbackType.Warning
            : Haptics.NotificationFeedbackType.Success
        );
      }
    }
  }, [diagnostic]);

  const handleAnswer = async (answer) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const newAnswers = [
      ...answers,
      {
        question: questions[currentQuestionIndex],
        answer: answer,
      },
    ];
    setAnswers(newAnswers);

    if (currentQuestionIndex === questions.length - 1) {
      await getDiagnostic(newAnswers);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      // Animation pour la question suivante
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
    }
  };

  const handleTextAnswer = (answer) => {
    if (!answer.trim()) {
      Alert.alert("Erreur", "Veuillez entrer une réponse");
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const newAnswers = [
      ...answers,
      {
        question: questions[currentQuestionIndex],
        answer: answer.trim(),
      },
    ];
    setAnswers(newAnswers);

    if (currentQuestionIndex === questions.length - 1) {
      getDiagnostic(newAnswers);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setTextAnswer("");
      // Animation pour la question suivante
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
    }
  };

  const getDiagnostic = async (finalAnswers) => {
    setLoading(true);
    try {
      const response = await api.post("/diagnostic/result", {
        description: params.description,
        answers: finalAnswers,
      });

      setDiagnostic(response.data.data);
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'obtenir le diagnostic");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityConfig = (severity) => {
    return SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.VERT;
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  // Écran de questions
  if (!diagnostic && !loading) {
    const currentQuestion = questions[currentQuestionIndex];
    const isTextQuestion =
      currentQuestion?.toLowerCase().includes("modèle") ||
      currentQuestion?.toLowerCase().includes("marque") ||
      currentQuestion?.toLowerCase().includes("année") ||
      currentQuestion?.toLowerCase().includes("kilométrage") ||
      currentQuestion?.toLowerCase().includes("dernière révision") ||
      currentQuestion?.toLowerCase().includes("type de carburant") ||
      currentQuestion?.toLowerCase().includes("couleur") ||
      currentQuestion?.toLowerCase().includes("immatriculation") ||
      currentQuestion?.toLowerCase().includes("modèle") ||
      currentQuestion?.toLowerCase().includes("version") ||
      currentQuestion?.toLowerCase().includes("motorisation");

    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Barre de navigation */}
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.navGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => router.push("/diagnostic")}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>
            Question {currentQuestionIndex + 1}/{questions.length}
          </Text>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => router.push("/(tabs)")}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>

        {/* Barre de progression */}
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.primary,
                width: `${
                  ((currentQuestionIndex + 1) / questions.length) * 100
                }%`,
              },
            ]}
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.questionContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.questionIcon}>
              <Ionicons
                name={isTextQuestion ? "create-outline" : "help-circle"}
                size={40}
                color={colors.primary}
              />
            </View>

            <Text style={[styles.question, { color: colors.text }]}>
              {currentQuestion}
            </Text>

            {isTextQuestion ? (
              // Interface pour questions textuelles
              <View style={styles.textInputContainer}>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="Votre réponse..."
                  placeholderTextColor={colors.placeholder}
                  value={textAnswer}
                  onChangeText={setTextAnswer}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />

                <View style={styles.textInputButtons}>
                  <TouchableOpacity
                    style={[
                      styles.cancelButton,
                      { borderColor: colors.border },
                    ]}
                    onPress={() => setTextAnswer("")}
                  >
                    <Text
                      style={[
                        styles.cancelButtonText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Effacer
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.confirmButton,
                      { backgroundColor: colors.primary },
                    ]}
                    onPress={() => handleTextAnswer(textAnswer)}
                    disabled={!textAnswer.trim()}
                  >
                    <Text style={styles.confirmButtonText}>Confirmer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              // Interface Oui/Non pour les autres questions
              <View style={styles.answerButtons}>
                <TouchableOpacity
                  style={[styles.answerButton, { borderColor: colors.border }]}
                  onPress={() => handleAnswer("Oui")}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={["#4CAF5020", "transparent"]}
                    style={styles.answerGradient}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={40}
                      color="#4CAF50"
                    />
                    <Text style={[styles.answerText, { color: colors.text }]}>
                      Oui
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.answerButton, { borderColor: colors.border }]}
                  onPress={() => handleAnswer("Non")}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={["#E6394620", "transparent"]}
                    style={styles.answerGradient}
                  >
                    <Ionicons name="close-circle" size={40} color="#E63946" />
                    <Text style={[styles.answerText, { color: colors.text }]}>
                      Non
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* Indicateur de progression */}
            <Text
              style={[styles.questionHint, { color: colors.textSecondary }]}
            >
              {isTextQuestion
                ? "Donnez une réponse précise pour aider le diagnostic"
                : "Répondez par Oui ou Non pour affiner le diagnostic"}
            </Text>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  // Écran de chargement - VERSION AMÉLIORÉE
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Overlay avec dégradé */}
        <LinearGradient
          colors={
            colorScheme === "dark"
              ? ["rgba(212,175,55,0.15)", "rgba(128,0,32,0.15)"]
              : ["rgba(212,175,55,0.1)", "rgba(128,0,32,0.1)"]
          }
          style={StyleSheet.absoluteFill}
        />

        {/* Cercles décoratifs animés */}
        <Animated.View
          style={[
            styles.loadingCircle1,
            {
              backgroundColor: colors.primary + "20",
              transform: [{ scale: scaleAnim }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.loadingCircle2,
            {
              backgroundColor: colors.secondary + "20",
              transform: [{ scale: scaleAnim }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.loadingCircle3,
            {
              backgroundColor: colors.primary + "15",
              transform: [{ scale: scaleAnim }],
            },
          ]}
        />

        <View style={styles.loadingContent}>
          {/* Logo animé avec rotation */}
          <Animated.View
            style={[
              styles.loadingLogoContainer,
              {
                transform: [{ scale: scaleAnim }, { rotate: rotate }],
              },
            ]}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.loadingLogoGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="medkit" size={60} color="#fff" />
            </LinearGradient>
          </Animated.View>

          {/* Texte principal */}
          <Text style={[styles.loadingMainText, { color: colors.text }]}>
            Diagnostic en cours
          </Text>

          {/* Indicateur de progression personnalisé */}
          <View style={styles.loadingProgressContainer}>
            <View
              style={[
                styles.loadingProgressRing,
                { borderColor: colors.primary + "30" },
              ]}
            >
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
            <Text
              style={[styles.loadingProgressText, { color: colors.primary }]}
            >
              {Math.floor(progressAnim._value * 100)}%
            </Text>
          </View>

          {/* Étapes du diagnostic avec animation */}
          <View style={styles.loadingSteps}>
            <Animated.View
              style={[
                styles.loadingStep,
                {
                  opacity: fadeAnim,
                  transform: [{ translateX: slideAnim }],
                },
              ]}
            >
              <View
                style={[
                  styles.loadingStepDot,
                  { backgroundColor: colors.primary },
                ]}
              />
              <Text style={[styles.loadingStepText, { color: colors.text }]}>
                1. Analyse des symptômes
              </Text>
              {progressAnim._value > 0.3 && (
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              )}
            </Animated.View>

            <Animated.View
              style={[
                styles.loadingStep,
                {
                  opacity: fadeAnim,
                  transform: [{ translateX: slideAnim }],
                  marginLeft: 10,
                },
              ]}
            >
              <View
                style={[
                  styles.loadingStepDot,
                  { backgroundColor: colors.primary },
                ]}
              />
              <Text style={[styles.loadingStepText, { color: colors.text }]}>
                2. Recherche de causes
              </Text>
              {progressAnim._value > 0.6 && (
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              )}
            </Animated.View>

            <Animated.View
              style={[
                styles.loadingStep,
                {
                  opacity: fadeAnim,
                  transform: [{ translateX: slideAnim }],
                  marginLeft: 20,
                },
              ]}
            >
              <View
                style={[
                  styles.loadingStepDot,
                  { backgroundColor: colors.primary },
                ]}
              />
              <Text style={[styles.loadingStepText, { color: colors.text }]}>
                3. Génération des recommandations
              </Text>
              {progressAnim._value > 0.9 && (
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              )}
            </Animated.View>
          </View>

          {/* Message rassurant */}
          <Text
            style={[styles.loadingMessage, { color: colors.textSecondary }]}
          >
            Notre intelligence artificielle analyse votre situation...
          </Text>

          {/* Barre de progression linéaire */}
          <View
            style={[
              styles.loadingLinearProgress,
              { backgroundColor: colors.border },
            ]}
          >
            <Animated.View
              style={[
                styles.loadingLinearFill,
                {
                  backgroundColor: colors.primary,
                  width: progressWidth,
                },
              ]}
            />
          </View>

          {/* Bouton d'annulation */}
          <TouchableOpacity
            style={[styles.loadingCancelButton, { borderColor: colors.border }]}
            onPress={() => router.push("/diagnostic")}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={20} color={colors.textSecondary} />
            <Text
              style={[
                styles.loadingCancelText,
                { color: colors.textSecondary },
              ]}
            >
              Annuler le diagnostic
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Écran de résultat
  if (diagnostic) {
    const severityConfig = getSeverityConfig(diagnostic.diagnostic?.severity);

    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Barre de navigation */}
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.navGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => router.push("/diagnostic")}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Résultat du diagnostic</Text>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => router.push("/(tabs)")}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Animated.View
            style={[
              styles.resultContent,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {/* Header avec sévérité */}
            <LinearGradient
              colors={[severityConfig.color, severityConfig.color + "80"]}
              style={styles.severityHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.severityIconContainer}>
                <Ionicons name={severityConfig.icon} size={50} color="#fff" />
              </View>
              <Text style={styles.severityTitle}>{severityConfig.text}</Text>
              <Text style={styles.severityDescription}>
                {severityConfig.description}
              </Text>
            </LinearGradient>

            {/* Barre de confiance */}
            <View
              style={[
                styles.confidenceContainer,
                { backgroundColor: colors.surface },
              ]}
            >
              <View style={styles.confidenceHeader}>
                <Text
                  style={[
                    styles.confidenceLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  Confiance du diagnostic
                </Text>
                <Text
                  style={[styles.confidenceValue, { color: colors.primary }]}
                >
                  {diagnostic.diagnostic?.confidence}%
                </Text>
              </View>
              <View
                style={[
                  styles.confidenceBar,
                  { backgroundColor: colors.border },
                ]}
              >
                <Animated.View
                  style={[
                    styles.confidenceFill,
                    {
                      backgroundColor: colors.primary,
                      width: progressWidth,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Cause probable */}
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <View style={styles.cardHeader}>
                <Ionicons name="construct" size={24} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  Cause probable
                </Text>
              </View>
              <Text style={[styles.cardContent, { color: colors.text }]}>
                {diagnostic.diagnostic?.probableCause}
              </Text>
            </View>

            {/* Explication */}
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <View style={styles.cardHeader}>
                <Ionicons
                  name="information-circle"
                  size={24}
                  color={colors.primary}
                />
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  Explication
                </Text>
              </View>
              <Text style={[styles.cardContent, { color: colors.text }]}>
                {diagnostic.diagnostic?.explanation}
              </Text>
            </View>

            {/* Actions recommandées */}
            {diagnostic.actions?.length > 0 && (
              <View style={[styles.card, { backgroundColor: colors.surface }]}>
                <View style={styles.cardHeader}>
                  <Ionicons name="list" size={24} color={colors.primary} />
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    Actions recommandées
                  </Text>
                </View>
                {diagnostic.actions.map((action, index) => (
                  <Animated.View
                    key={index}
                    style={[
                      styles.actionItem,
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
                      colors={[colors.primary + "20", "transparent"]}
                      style={styles.actionGradient}
                    >
                      <Ionicons
                        name={
                          action.type === "check"
                            ? "eye-outline"
                            : "call-outline"
                        }
                        size={20}
                        color={colors.primary}
                      />
                      <Text style={[styles.actionText, { color: colors.text }]}>
                        {action.step}
                      </Text>
                    </LinearGradient>
                  </Animated.View>
                ))}
              </View>
            )}

            {/* Recommandation finale */}
            <View
              style={[
                styles.recommendationCard,
                {
                  backgroundColor: severityConfig.bgColor,
                  borderColor: severityConfig.color,
                },
              ]}
            >
              <Ionicons
                name={severityConfig.icon}
                size={30}
                color={severityConfig.color}
              />
              <Text style={[styles.recommendationText, { color: colors.text }]}>
                {diagnostic.recommendation === "conduire au garage" &&
                  "🚗 Rendez-vous dans un garage"}
                {diagnostic.recommendation === "appeler un helper" &&
                  "🆘 Appelez un helper immédiatement"}
                {diagnostic.recommendation === "réparer soi-même" &&
                  "🔧 Vous pouvez réparer vous-même"}
              </Text>
            </View>

            {/* Boutons d'action */}
            <View style={styles.actionButtons}>
              {diagnostic.recommendation === "appeler un helper" && (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => router.push("/sos")}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[colors.primary, colors.secondary]}
                    style={styles.primaryButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="alert-circle" size={24} color="#fff" />
                    <Text style={styles.buttonText}>Appeler un helper</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {diagnostic.recommendation === "conduire au garage" && (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => router.push("/helpers")}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[colors.primary, colors.secondary]}
                    style={styles.primaryButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="car" size={24} color="#fff" />
                    <Text style={styles.buttonText}>Trouver un garage</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: colors.border }]}
                onPress={() => router.push("/diagnostic")}
              >
                <Ionicons
                  name="refresh"
                  size={20}
                  color={colors.textSecondary}
                />
                <Text
                  style={[
                    styles.secondaryButtonText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Nouveau diagnostic
                </Text>
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
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 50 : 40,
    paddingBottom: 15,
    paddingHorizontal: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  navTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  progressBar: {
    height: 4,
    width: "100%",
  },
  progressFill: {
    height: "100%",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  questionContainer: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 400,
  },
  questionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0,0,0,0.03)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  question: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 40,
    textAlign: "center",
    lineHeight: 30,
    paddingHorizontal: 20,
  },
  answerButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    gap: 15,
  },
  answerButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  answerGradient: {
    padding: 20,
    alignItems: "center",
  },
  answerText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "600",
  },
  questionHint: {
    marginTop: 30,
    fontSize: 14,
    textAlign: "center",
  },
  // Styles pour les questions textuelles
  textInputContainer: {
    width: "100%",
    marginVertical: 20,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: "top",
    marginBottom: 15,
  },
  textInputButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  confirmButton: {
    flex: 2,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Styles pour l'écran de chargement
  loadingCircle1: {
    position: "absolute",
    width: screenWidth * 0.8,
    height: screenWidth * 0.8,
    borderRadius: screenWidth * 0.4,
    top: -screenWidth * 0.2,
    right: -screenWidth * 0.2,
  },
  loadingCircle2: {
    position: "absolute",
    width: screenWidth * 0.7,
    height: screenWidth * 0.7,
    borderRadius: screenWidth * 0.35,
    bottom: -screenHeight * 0.15,
    left: -screenWidth * 0.15,
  },
  loadingCircle3: {
    position: "absolute",
    width: screenWidth * 0.6,
    height: screenWidth * 0.6,
    borderRadius: screenWidth * 0.3,
    top: screenHeight * 0.2,
    right: screenWidth * 0.1,
  },
  loadingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  loadingLogoContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  loadingLogoGradient: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingMainText: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  loadingProgressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
    position: "relative",
  },
  loadingProgressRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  loadingProgressText: {
    fontSize: 28,
    fontWeight: "bold",
  },
  loadingSteps: {
    width: "100%",
    marginBottom: 30,
    backgroundColor: "rgba(0,0,0,0.02)",
    padding: 20,
    borderRadius: 20,
  },
  loadingStep: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  loadingStepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  loadingStepText: {
    fontSize: 15,
    flex: 1,
  },
  loadingMessage: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 25,
    fontStyle: "italic",
    paddingHorizontal: 20,
  },
  loadingLinearProgress: {
    width: "80%",
    height: 8,
    borderRadius: 4,
    marginBottom: 30,
    overflow: "hidden",
  },
  loadingLinearFill: {
    height: "100%",
    borderRadius: 4,
  },
  loadingCancelButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderWidth: 1.5,
    borderRadius: 30,
    gap: 8,
  },
  loadingCancelText: {
    fontSize: 15,
    fontWeight: "500",
  },
  resultContent: {
    padding: 20,
    gap: 15,
  },
  severityHeader: {
    padding: 25,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 5,
  },
  severityIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  severityTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  severityDescription: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
    textAlign: "center",
  },
  confidenceContainer: {
    padding: 15,
    borderRadius: 16,
    marginBottom: 5,
  },
  confidenceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  confidenceLabel: {
    fontSize: 14,
  },
  confidenceValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  confidenceBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  confidenceFill: {
    height: "100%",
    borderRadius: 4,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  cardContent: {
    fontSize: 16,
    lineHeight: 24,
  },
  actionItem: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: "hidden",
  },
  actionGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    gap: 12,
  },
  actionText: {
    fontSize: 14,
    flex: 1,
  },
  recommendationCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    gap: 15,
    marginTop: 10,
  },
  recommendationText: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  actionButtons: {
    gap: 10,
    marginTop: 20,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  primaryButtonGradient: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonText: {
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
});
