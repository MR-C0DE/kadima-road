// helpers/app/settings/documents.tsx
// Écran des documents - Permis, assurance, certification

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
  Animated,
  Modal,
  Alert,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../config/api";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import Toast from "react-native-toast-message";

// ============================================
// TYPES DE DOCUMENTS
// ============================================

const DOCUMENT_TYPES = [
  {
    id: "license",
    label: "Permis de conduire",
    icon: "card-outline",
    description: "Recto et verso",
    required: true,
    color: "#3B82F6",
  },
  {
    id: "insurance",
    label: "Attestation d'assurance",
    icon: "shield-outline",
    description: "Assurance professionnelle",
    required: true,
    color: "#F59E0B",
  },
  {
    id: "certification",
    label: "Certification",
    icon: "ribbon-outline",
    description: "Certificat de formation",
    required: false,
    color: "#10B981",
  },
];

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function DocumentsSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme ?? "light"];

  // États
  const [loading, setLoading] = useState(true);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [documents, setDocuments] = useState<any>({
    license: null,
    insurance: null,
    certification: null,
  });
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const itemsAnim = useRef(
    DOCUMENT_TYPES.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    loadDocuments();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    itemsAnim.forEach((anim, index) => {
      Animated.spring(anim, {
        toValue: 1,
        delay: 200 + index * 100,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  // ============================================
  // CHARGEMENT DES DOCUMENTS
  // ============================================

  const loadDocuments = async () => {
    try {
      const response = await api.get("/documents");
      const docs = response.data.data || {};
      setDocuments(docs);
    } catch (error) {
      console.error("Erreur chargement documents:", error);
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Impossible de charger vos documents",
        position: "bottom",
      });
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // UPLOAD DE DOCUMENT
  // ============================================

  const pickDocument = async (docType: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];

      // Vérifier la taille (max 10MB)
      if (file.size && file.size > 10 * 1024 * 1024) {
        Toast.show({
          type: "error",
          text1: "Fichier trop volumineux",
          text2: "La taille maximale est de 10MB",
          position: "bottom",
        });
        return;
      }

      setUploadingDoc(docType);

      const formData = new FormData();
      formData.append("document", {
        uri: file.uri,
        type: file.mimeType || "application/octet-stream",
        name: file.name || `${docType}.${file.name?.split(".").pop() || "pdf"}`,
      } as any);

      await api.post(`/documents/${docType}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await loadDocuments();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: "success",
        text1: "Document uploadé",
        text2: `${
          DOCUMENT_TYPES.find((d) => d.id === docType)?.label
        } a été ajouté`,
        position: "bottom",
      });
    } catch (error: any) {
      console.error("Erreur upload document:", error);
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2:
          error.response?.data?.message || "Impossible d'uploader le document",
        position: "bottom",
      });
    } finally {
      setUploadingDoc(null);
    }
  };

  // ============================================
  // SUPPRESSION DE DOCUMENT
  // ============================================

  const deleteDocument = async (docType: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      "Supprimer le document",
      `Voulez-vous vraiment supprimer ${
        DOCUMENT_TYPES.find((d) => d.id === docType)?.label
      } ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/documents/${docType}`);
              await loadDocuments();
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
              Toast.show({
                type: "success",
                text1: "Document supprimé",
                text2: "Le document a été retiré",
                position: "bottom",
              });
            } catch (error: any) {
              Toast.show({
                type: "error",
                text1: "Erreur",
                text2:
                  error.response?.data?.message || "Impossible de supprimer",
                position: "bottom",
              });
            }
          },
        },
      ]
    );
  };

  // ============================================
  // PRÉVISUALISATION
  // ============================================

  const previewDocument = (url: string) => {
    setPreviewUrl(url);
    setPreviewModalVisible(true);
  };

  const openInBrowser = async () => {
    if (previewUrl) {
      await Linking.openURL(previewUrl);
    }
  };

  // ============================================
  // UTILITAIRES
  // ============================================

  const getDocumentStatus = (doc: any) => {
    if (!doc || !doc.url) {
      return { label: "Manquant", color: "#6B7280", icon: "close-circle" };
    }
    if (doc.status === "verified") {
      return { label: "Vérifié", color: "#22C55E", icon: "checkmark-circle" };
    }
    if (doc.status === "pending") {
      return { label: "En attente", color: "#F59E0B", icon: "time" };
    }
    if (doc.status === "rejected") {
      return { label: "Rejeté", color: "#EF4444", icon: "alert-circle" };
    }
    return { label: "Uploadé", color: "#3B82F6", icon: "document" };
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const truncateFileName = (fileName: string, maxLength = 25) => {
    if (!fileName) return "";
    if (fileName.length <= maxLength) return fileName;
    const ext = fileName.split(".").pop();
    const name = fileName.slice(0, maxLength - (ext?.length || 0) - 3);
    return `${name}...${ext}`;
  };

  // ============================================
  // COMPTEUR
  // ============================================

  const requiredCount = DOCUMENT_TYPES.filter((d) => d.required).length;
  const uploadedRequiredCount = DOCUMENT_TYPES.filter(
    (d) => d.required && documents[d.id]?.url
  ).length;
  const totalCount = DOCUMENT_TYPES.filter((d) => documents[d.id]?.url).length;

  // ============================================
  // RENDU
  // ============================================

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.loadingLogo}
          >
            <Ionicons name="document-text" size={40} color="#fff" />
          </LinearGradient>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Chargement...
          </Text>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Documents</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        {/* Barre de progression */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text
              style={[styles.progressLabel, { color: colors.textSecondary }]}
            >
              Documents requis
            </Text>
            <Text style={[styles.progressValue, { color: colors.primary }]}>
              {uploadedRequiredCount}/{requiredCount}
            </Text>
          </View>
          <View
            style={[styles.progressBar, { backgroundColor: colors.border }]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.success,
                  width: `${(uploadedRequiredCount / requiredCount) * 100}%`,
                },
              ]}
            />
          </View>
        </View>

        {/* Liste des documents */}
        <View style={styles.documentsList}>
          {DOCUMENT_TYPES.map((docType, index) => {
            const doc = documents[docType.id];
            const status = getDocumentStatus(doc);
            const hasDocument = doc && doc.url;
            const isUploading = uploadingDoc === docType.id;

            return (
              <Animated.View
                key={docType.id}
                style={[
                  styles.documentCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: hasDocument ? docType.color : colors.border,
                    opacity: itemsAnim[index],
                    transform: [
                      {
                        translateY: itemsAnim[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [30, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.documentHeader}>
                  <View style={styles.documentTitleContainer}>
                    <View
                      style={[
                        styles.documentIcon,
                        {
                          backgroundColor: hasDocument
                            ? docType.color + "20"
                            : colors.background,
                        },
                      ]}
                    >
                      <Ionicons
                        name={docType.icon}
                        size={24}
                        color={
                          hasDocument ? docType.color : colors.textSecondary
                        }
                      />
                    </View>
                    <View>
                      <Text
                        style={[
                          styles.documentLabel,
                          {
                            color: hasDocument ? docType.color : colors.text,
                          },
                        ]}
                      >
                        {docType.label}
                        {docType.required && (
                          <Text style={{ color: colors.error }}> *</Text>
                        )}
                      </Text>
                      <Text
                        style={[
                          styles.documentDescription,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {docType.description}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.documentStatusBadge,
                      { backgroundColor: status.color + "20" },
                    ]}
                  >
                    <Ionicons
                      name={status.icon}
                      size={12}
                      color={status.color}
                    />
                    <Text
                      style={[
                        styles.documentStatusText,
                        { color: status.color },
                      ]}
                    >
                      {status.label}
                    </Text>
                  </View>
                </View>

                {doc?.rejectionReason && (
                  <View style={styles.rejectionContainer}>
                    <Ionicons
                      name="alert-circle"
                      size={14}
                      color={colors.error}
                    />
                    <Text
                      style={[styles.rejectionText, { color: colors.error }]}
                    >
                      {doc.rejectionReason}
                    </Text>
                  </View>
                )}

                {hasDocument && (
                  <>
                    <View style={styles.documentMeta}>
                      <Text
                        style={[
                          styles.documentFileName,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {truncateFileName(doc.fileName || "Document")}
                      </Text>
                      <Text
                        style={[
                          styles.documentSize,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {formatFileSize(doc.fileSize)}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.documentDate,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Uploadé le {formatDate(doc.uploadedAt)}
                    </Text>
                  </>
                )}

                <View style={styles.documentActions}>
                  {!hasDocument && (
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        {
                          borderColor: colors.primary,
                          backgroundColor: colors.primary + "10",
                        },
                      ]}
                      onPress={() => pickDocument(docType.id)}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <ActivityIndicator
                          size="small"
                          color={colors.primary}
                        />
                      ) : (
                        <>
                          <Ionicons
                            name="cloud-upload-outline"
                            size={18}
                            color={colors.primary}
                          />
                          <Text
                            style={[
                              styles.actionText,
                              { color: colors.primary },
                            ]}
                          >
                            Uploader
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}

                  {hasDocument && (
                    <>
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          { borderColor: colors.primary },
                        ]}
                        onPress={() => previewDocument(doc.url)}
                      >
                        <Ionicons
                          name="eye-outline"
                          size={18}
                          color={colors.primary}
                        />
                        <Text
                          style={[styles.actionText, { color: colors.primary }]}
                        >
                          Voir
                        </Text>
                      </TouchableOpacity>

                      {doc.status !== "verified" && (
                        <TouchableOpacity
                          style={[
                            styles.actionButton,
                            { borderColor: colors.error },
                          ]}
                          onPress={() => deleteDocument(docType.id)}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={18}
                            color={colors.error}
                          />
                          <Text
                            style={[styles.actionText, { color: colors.error }]}
                          >
                            Supprimer
                          </Text>
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                </View>
              </Animated.View>
            );
          })}
        </View>

        {/* Note informative */}
        <View style={[styles.noteCard, { backgroundColor: colors.surface }]}>
          <LinearGradient
            colors={[colors.primary + "05", colors.secondary + "02"]}
            style={styles.noteGradient}
          >
            <Ionicons
              name="information-circle"
              size={24}
              color={colors.primary}
            />
            <View style={styles.noteContent}>
              <Text style={[styles.noteTitle, { color: colors.text }]}>
                À propos des documents
              </Text>
              <Text style={[styles.noteText, { color: colors.textSecondary }]}>
                Les documents vérifiés augmentent votre crédibilité et votre
                visibilité. Les documents requis sont nécessaires pour être
                approuvé.
              </Text>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.bottomSpace} />
      </Animated.ScrollView>

      {/* Modal de prévisualisation */}
      <Modal
        visible={previewModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewModalVisible(false)}
      >
        <BlurView
          intensity={90}
          style={styles.modalOverlay}
          tint={effectiveTheme === "dark" ? "dark" : "light"}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setPreviewModalVisible(false)}
            activeOpacity={1}
          />

          <View style={[styles.previewModal, { backgroundColor: colors.card }]}>
            <View style={styles.previewHeader}>
              <Text style={[styles.previewTitle, { color: colors.text }]}>
                Aperçu du document
              </Text>
              <TouchableOpacity
                onPress={() => setPreviewModalVisible(false)}
                style={styles.previewClose}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.previewContent}>
              {previewUrl && (
                <View style={styles.previewInfo}>
                  <Ionicons
                    name="document-text"
                    size={48}
                    color={colors.primary}
                  />
                  <Text
                    style={[
                      styles.previewUrlText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {previewUrl.split("/").pop()}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.openButton,
                      { backgroundColor: colors.primary },
                    ]}
                    onPress={openInBrowser}
                  >
                    <Ionicons name="open-outline" size={18} color="#fff" />
                    <Text style={styles.openButtonText}>
                      Ouvrir dans le navigateur
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.closeModalButton, { borderColor: colors.border }]}
              onPress={() => setPreviewModalVisible(false)}
            >
              <Text
                style={[styles.closeModalText, { color: colors.textSecondary }]}
              >
                Fermer
              </Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>

      <Toast />
    </View>
  );
}

// ============================================
// STYLES
// ============================================

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
  backButton: {
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
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  progressSection: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  progressValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  documentsList: {
    gap: 12,
    marginBottom: 20,
  },
  documentCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  documentHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  documentTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  documentLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  documentDescription: {
    fontSize: 11,
  },
  documentStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  documentStatusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  rejectionContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(239,68,68,0.1)",
    marginBottom: 12,
  },
  rejectionText: {
    fontSize: 12,
    flex: 1,
  },
  documentMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  documentFileName: {
    fontSize: 11,
    flex: 1,
  },
  documentSize: {
    fontSize: 11,
  },
  documentDate: {
    fontSize: 10,
    marginBottom: 12,
  },
  documentActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 25,
    borderWidth: 1,
    gap: 6,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "500",
  },
  noteCard: {
    borderRadius: 20,
    marginTop: 8,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  noteGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  noteText: {
    fontSize: 12,
    lineHeight: 16,
  },
  bottomSpace: {
    height: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  previewModal: {
    width: "90%",
    maxWidth: 400,
    borderRadius: 28,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 20,
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  previewClose: {
    padding: 4,
  },
  previewContent: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },
  previewInfo: {
    alignItems: "center",
    gap: 16,
  },
  previewUrlText: {
    fontSize: 12,
    textAlign: "center",
  },
  openButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
  },
  openButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  closeModalButton: {
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1,
    alignItems: "center",
  },
  closeModalText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
