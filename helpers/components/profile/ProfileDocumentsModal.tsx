// helpers/components/profile/ProfileDocumentsModal.tsx

import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Animated,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { api } from "../../config/api";

import { HelperProfile, DocumentInfo } from "./types";
import {
  getDocumentIcon,
  getDocumentLabel,
  formatDate,
  formatFileSize,
  truncateFileName,
} from "./constants";

interface ProfileDocumentsModalProps {
  visible: boolean;
  profile: HelperProfile | null;
  colors: any;
  colorScheme: string | null;
  onClose: () => void;
  onPickDocument: (type: string) => void;
  onRefresh?: () => void;
}

const getDocumentStatus = (doc?: DocumentInfo) => {
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

export default function ProfileDocumentsModal({
  visible,
  profile,
  colors,
  colorScheme,
  onClose,
  onPickDocument,
  onRefresh,
}: ProfileDocumentsModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [docProgress, setDocProgress] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0.9);
    }
  }, [visible]);

  const handleDeleteDocument = async (docType: string) => {
    Alert.alert(
      "Supprimer le document",
      "Voulez-vous vraiment supprimer ce document ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/documents/${docType}`);
              if (onRefresh) onRefresh();
              Alert.alert("Succès", "Document supprimé");
            } catch (error: any) {
              Alert.alert(
                "Erreur",
                error.response?.data?.message || "Impossible de supprimer"
              );
            }
          },
        },
      ]
    );
  };

  // Récupérer les documents du profil
  const documents = profile?.documents || {};
  const docTypes = ["license", "insurance", "certification"];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={90} tint={colorScheme} style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          activeOpacity={1}
        />

        <Animated.View
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.card,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              <LinearGradient
                colors={[colors.primary + "20", colors.secondary + "10"]}
                style={styles.modalHeaderIcon}
              >
                <Ionicons name="document" size={22} color={colors.primary} />
              </LinearGradient>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Documents
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.modalClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Description */}
          <Text
            style={[styles.modalDescription, { color: colors.textSecondary }]}
          >
            Gérez vos documents officiels
          </Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {docTypes.map((docType) => {
              const doc = documents[docType as keyof typeof documents];
              const status = getDocumentStatus(doc);
              const hasDocument = doc && doc.url;

              return (
                <View
                  key={docType}
                  style={[
                    styles.documentContainer,
                    { borderColor: colors.border },
                  ]}
                >
                  <View style={styles.documentHeader}>
                    <View style={styles.documentTitleContainer}>
                      <View
                        style={[
                          styles.documentTypeIcon,
                          { backgroundColor: colors.primary + "15" },
                        ]}
                      >
                        <Ionicons
                          name={getDocumentIcon(docType)}
                          size={20}
                          color={colors.primary}
                        />
                      </View>
                      <View>
                        <Text
                          style={[styles.documentType, { color: colors.text }]}
                        >
                          {getDocumentLabel(docType)}
                        </Text>
                        {hasDocument && doc?.fileName && (
                          <Text
                            style={[
                              styles.documentFileName,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {truncateFileName(doc.fileName)} •{" "}
                            {formatFileSize(doc.fileSize)}
                          </Text>
                        )}
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
                      <Text
                        style={[styles.rejectionText, { color: colors.error }]}
                      >
                        {doc.rejectionReason}
                      </Text>
                    </View>
                  )}

                  {hasDocument && doc?.uploadedAt && (
                    <Text
                      style={[
                        styles.documentDate,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Uploadé le {formatDate(doc.uploadedAt)}
                    </Text>
                  )}

                  <View style={styles.documentActions}>
                    {!hasDocument && (
                      <TouchableOpacity
                        style={[
                          styles.documentActionButton,
                          { borderColor: colors.primary },
                        ]}
                        onPress={() => onPickDocument(docType)}
                        disabled={uploadingDoc === docType}
                      >
                        {uploadingDoc === docType ? (
                          <View style={styles.uploadProgress}>
                            <ActivityIndicator
                              size="small"
                              color={colors.primary}
                            />
                            {docProgress[docType] !== undefined && (
                              <Text
                                style={[
                                  styles.uploadProgressText,
                                  { color: colors.primary },
                                ]}
                              >
                                {docProgress[docType]}%
                              </Text>
                            )}
                          </View>
                        ) : (
                          <>
                            <Ionicons
                              name="cloud-upload-outline"
                              size={18}
                              color={colors.primary}
                            />
                            <Text
                              style={[
                                styles.documentActionText,
                                { color: colors.primary },
                              ]}
                            >
                              Uploader
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}

                    {hasDocument && doc.status !== "verified" && (
                      <TouchableOpacity
                        style={[
                          styles.documentActionButton,
                          { borderColor: colors.error },
                        ]}
                        onPress={() => handleDeleteDocument(docType)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color={colors.error}
                        />
                        <Text
                          style={[
                            styles.documentActionText,
                            { color: colors.error },
                          ]}
                        >
                          Supprimer
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Bouton de fermeture */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.closeButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="close-outline" size={20} color="#fff" />
              <Text style={styles.closeButtonText}>Fermer</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "85%",
    borderRadius: 28,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalHeaderIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  modalClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  modalDescription: {
    fontSize: 14,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  documentContainer: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  documentHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  documentTitleContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    flex: 1,
  },
  documentTypeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  documentType: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  documentFileName: {
    fontSize: 10,
    marginTop: 2,
    flexShrink: 1,
  },
  documentStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
    flexShrink: 0,
    marginLeft: 8,
  },
  documentStatusText: {
    fontSize: 9,
    fontWeight: "600",
  },
  rejectionContainer: {
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  rejectionText: {
    fontSize: 11,
  },
  documentDate: {
    fontSize: 10,
    marginBottom: 8,
  },
  documentActions: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  documentActionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  documentActionText: {
    fontSize: 11,
    fontWeight: "500",
  },
  uploadProgress: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  uploadProgressText: {
    fontSize: 11,
    fontWeight: "500",
    minWidth: 30,
  },
  closeButton: {
    marginTop: 16,
    borderRadius: 30,
    overflow: "hidden",
  },
  closeButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    gap: 8,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
