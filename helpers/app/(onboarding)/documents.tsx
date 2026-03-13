import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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

const DOCUMENTS = [
  {
    id: "license",
    label: "Permis de conduire",
    icon: "id-card",
    description: "Recto et verso",
    color: "#FF6B6B",
  },
  {
    id: "insurance",
    label: "Attestation d'assurance",
    icon: "shield",
    description: "Assurance professionnelle",
    color: "#4ECDC4",
  },
  {
    id: "identity",
    label: "Pièce d'identité",
    icon: "person",
    description: "Carte d'identité ou passeport",
    color: "#45B7D1",
  },
];

export default function DocumentsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { data, updateDocuments } = useOnboarding();

  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

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
    // Animation de succès quand un document est ajouté
    Animated.sequence([
      Animated.spring(successAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.spring(successAnim, {
        toValue: 0,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
  }, [data.documents]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["80%", "100%"],
  });

  const toggleDocument = (docId: string) => {
    setUploadingDoc(docId);

    // Simuler un upload - maintenant on stocke un objet complet
    setTimeout(() => {
      updateDocuments({
        ...data.documents,
        [docId]: {
          type: docId,
          url: `simulated-url/${docId}.pdf`,
          verified: false,
          status: "pending",
          uploadedAt: new Date().toISOString(),
          fileName: `${docId}.pdf`,
          fileSize: 1024 * 1024, // 1MB simulé
          mimeType: "application/pdf",
        },
      });
      setUploadingDoc(null);
    }, 500);
  };

  // Compter les documents uploadés (qui ont une URL)
  const selectedCount = Object.values(data.documents).filter(
    (doc: any) => doc && doc.url
  ).length;

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
          <Text style={styles.headerTitle}>Étape 6/6</Text>
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
              Documents
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Optionnel - Accélérez la validation de votre profil
            </Text>
          </View>

          {/* Carte info */}
          <LinearGradient
            colors={[colors.primary + "10", colors.secondary + "05"]}
            style={styles.infoCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons
              name="shield-checkmark"
              size={32}
              color={colors.primary}
            />
            <View style={styles.infoTexts}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>
                Profil vérifié plus rapidement
              </Text>
              <Text
                style={[
                  styles.infoDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Les helpers avec documents vérifiés sont plus visibles
              </Text>
            </View>
          </LinearGradient>

          {/* Compteur */}
          <View style={styles.counterContainer}>
            <Text style={[styles.counterText, { color: colors.textSecondary }]}>
              {selectedCount} document{selectedCount !== 1 ? "s" : ""} sur{" "}
              {DOCUMENTS.length}
            </Text>
            <View
              style={[styles.counterBar, { backgroundColor: colors.border }]}
            >
              <View
                style={[
                  styles.counterFill,
                  {
                    backgroundColor: colors.primary,
                    width: `${(selectedCount / DOCUMENTS.length) * 100}%`,
                  },
                ]}
              />
            </View>
          </View>

          {/* Liste des documents */}
          <View style={styles.documentsList}>
            {DOCUMENTS.map((doc, index) => {
              const docData = data.documents[doc.id];
              const isUploaded = docData?.url;
              const isUploading = uploadingDoc === doc.id;
              const translateY = slideAnim.interpolate({
                inputRange: [0, 30],
                outputRange: [0, 10 * (index + 1)],
              });

              return (
                <Animated.View
                  key={doc.id}
                  style={[
                    styles.documentWrapper,
                    {
                      opacity: fadeAnim,
                      transform: [{ translateY }],
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.documentCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: isUploaded ? doc.color : colors.border,
                      },
                    ]}
                    onPress={() => toggleDocument(doc.id)}
                    disabled={isUploading}
                    activeOpacity={0.7}
                  >
                    <View style={styles.documentLeft}>
                      <View
                        style={[
                          styles.documentIcon,
                          {
                            backgroundColor: isUploaded
                              ? doc.color + "15"
                              : "transparent",
                          },
                        ]}
                      >
                        <Ionicons
                          name={isUploaded ? "checkmark-circle" : doc.icon}
                          size={28}
                          color={isUploaded ? doc.color : colors.primary}
                        />
                      </View>
                      <View style={styles.documentInfo}>
                        <Text
                          style={[styles.documentLabel, { color: colors.text }]}
                        >
                          {doc.label}
                        </Text>
                        <Text
                          style={[
                            styles.documentDescription,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {isUploaded ? docData.fileName : doc.description}
                        </Text>
                        {isUploaded && (
                          <Text
                            style={[
                              styles.documentDate,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {new Date(docData.uploadedAt).toLocaleDateString()}
                          </Text>
                        )}
                      </View>
                    </View>

                    <View style={styles.documentRight}>
                      {isUploading ? (
                        <Animated.View
                          style={[
                            styles.uploadingIndicator,
                            { transform: [{ scale: successAnim }] },
                          ]}
                        >
                          <Ionicons
                            name="sync"
                            size={22}
                            color={colors.primary}
                          />
                        </Animated.View>
                      ) : isUploaded ? (
                        <View
                          style={[
                            styles.uploadedBadge,
                            { backgroundColor: doc.color },
                          ]}
                        >
                          <Ionicons name="checkmark" size={14} color="#fff" />
                        </View>
                      ) : (
                        <Ionicons
                          name="cloud-upload-outline"
                          size={24}
                          color={colors.primary}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>

          {/* Note */}
          <View style={styles.noteContainer}>
            <Ionicons
              name="time-outline"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={[styles.noteText, { color: colors.textSecondary }]}>
              Vous pourrez toujours ajouter ces documents plus tard
            </Text>
          </View>

          {/* Espace pour le bouton */}
          <View style={styles.bottomSpace} />
        </Animated.View>
      </ScrollView>

      {/* Footer avec bouton */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => router.push("/(onboarding)/success")}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.nextButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.nextButtonText}>Terminer</Text>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
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
    marginBottom: 20,
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
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    marginBottom: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  infoTexts: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  infoDescription: {
    fontSize: 12,
  },
  counterContainer: {
    marginBottom: 20,
  },
  counterText: {
    fontSize: 13,
    marginBottom: 6,
  },
  counterBar: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  counterFill: {
    height: "100%",
    borderRadius: 2,
  },
  documentsList: {
    gap: 12,
    marginBottom: 16,
  },
  documentWrapper: {
    width: "100%",
  },
  documentCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  documentLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  documentInfo: {
    flex: 1,
  },
  documentLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  documentDescription: {
    fontSize: 12,
  },
  documentDate: {
    fontSize: 10,
    marginTop: 2,
  },
  documentRight: {
    marginLeft: 8,
  },
  uploadedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadingIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  noteContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
  },
  noteText: {
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
});
