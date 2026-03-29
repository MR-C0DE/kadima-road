// components/vehicle/VehicleDocumentsTab.tsx - Version avec imports corrigés

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../contexts/ThemeContext";
import { Colors } from "@/constants/theme";

const { width } = Dimensions.get("window");

const DOCUMENT_TYPES = [
  {
    id: "carte_grise",
    label: "Carte grise",
    icon: "card-outline",
    color: "#22C55E",
    required: true,
  },
  {
    id: "assurance",
    label: "Assurance",
    icon: "shield-outline",
    color: "#3B82F6",
    required: true,
  },
  {
    id: "controle_technique",
    label: "Contrôle technique",
    icon: "checkmark-circle-outline",
    color: "#F59E0B",
    required: false,
  },
  {
    id: "facture_achat",
    label: "Facture d'achat",
    icon: "receipt-outline",
    color: "#8B5CF6",
    required: false,
  },
  {
    id: "photo",
    label: "Photo",
    icon: "camera-outline",
    color: "#EC4899",
    required: false,
  },
];

interface VehicleDocumentsTabProps {
  documents: any[];
  isCurrentOwner: boolean;
  onUpload: (docType: string, docTitle: string) => void;
  onDelete: (docId: string) => void;
  onOpen: (fileUrl: string) => void;
  uploadingDoc: string | null;
  docProgress: { [key: string]: number };
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

export default function VehicleDocumentsTab({
  documents,
  isCurrentOwner,
  onUpload,
  onDelete,
  onOpen,
  uploadingDoc,
  docProgress,
}: VehicleDocumentsTabProps) {
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme ?? "light"];

  const getDocumentTypeInfo = (type: string) => {
    return DOCUMENT_TYPES.find((d) => d.id === type) || DOCUMENT_TYPES[0];
  };

  const requiredCount = DOCUMENT_TYPES.filter((d) => d.required).length;
  const uploadedRequiredCount = documents.filter((d) => {
    const docInfo = getDocumentTypeInfo(d.type);
    return docInfo.required;
  }).length;

  const uploadProgress = (uploadedRequiredCount / requiredCount) * 100;

  const handleUpload = (docType: string, docTitle: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onUpload(docType, docTitle);
  };

  const handleDelete = (docId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDelete(docId);
  };

  const handleOpen = (fileUrl: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onOpen(fileUrl);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <LinearGradient
        colors={[colors.primary + "05", colors.secondary + "02"]}
        style={styles.cardBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* En-tête avec progression */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={[colors.primary + "20", colors.secondary + "10"]}
            style={styles.headerIcon}
          >
            <Ionicons name="folder-outline" size={18} color={colors.primary} />
          </LinearGradient>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Documents
          </Text>
        </View>
        <View
          style={[
            styles.countBadge,
            { backgroundColor: colors.primary + "15" },
          ]}
        >
          <Text style={[styles.countText, { color: colors.primary }]}>
            {documents.length}
          </Text>
        </View>
      </View>

      {/* Barre de progression des documents requis */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
            Documents requis
          </Text>
          <Text style={[styles.progressValue, { color: colors.primary }]}>
            {uploadedRequiredCount}/{requiredCount}
          </Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.success,
                width: `${uploadProgress}%`,
              },
            ]}
          />
        </View>
      </View>

      {/* Upload section */}
      {isCurrentOwner && (
        <View style={styles.uploadSection}>
          <Text style={[styles.uploadTitle, { color: colors.textSecondary }]}>
            Ajouter un document
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.uploadScrollContent}
          >
            {DOCUMENT_TYPES.map((docType) => {
              const isUploaded = documents.some((d) => d.type === docType.id);
              return (
                <TouchableOpacity
                  key={docType.id}
                  style={[
                    styles.uploadButton,
                    {
                      borderColor: isUploaded ? docType.color : colors.border,
                      backgroundColor: isUploaded
                        ? docType.color + "10"
                        : colors.background,
                    },
                  ]}
                  onPress={() => handleUpload(docType.id, docType.label)}
                  disabled={uploadingDoc === docType.id || isUploaded}
                  activeOpacity={0.7}
                >
                  {uploadingDoc === docType.id ? (
                    <View style={styles.uploadProgressContainer}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text
                        style={[
                          styles.uploadProgressText,
                          { color: colors.primary },
                        ]}
                      >
                        {docProgress[docType.id] || 0}%
                      </Text>
                    </View>
                  ) : (
                    <>
                      <LinearGradient
                        colors={[docType.color + "20", docType.color + "05"]}
                        style={styles.uploadIcon}
                      >
                        <Ionicons
                          name={isUploaded ? "checkmark" : docType.icon}
                          size={24}
                          color={isUploaded ? docType.color : docType.color}
                        />
                      </LinearGradient>
                      <Text
                        style={[
                          styles.uploadLabel,
                          { color: isUploaded ? docType.color : colors.text },
                        ]}
                      >
                        {docType.label}
                      </Text>
                      {docType.required && (
                        <View
                          style={[
                            styles.requiredBadge,
                            {
                              backgroundColor: isUploaded
                                ? docType.color + "15"
                                : colors.error + "15",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.requiredText,
                              {
                                color: isUploaded
                                  ? docType.color
                                  : colors.error,
                              },
                            ]}
                          >
                            {isUploaded ? "Validé" : "Requis"}
                          </Text>
                        </View>
                      )}
                      {isUploaded && (
                        <View style={styles.uploadedCheck}>
                          <Ionicons
                            name="checkmark-circle"
                            size={16}
                            color={docType.color}
                          />
                        </View>
                      )}
                    </>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Documents existants */}
      {documents && documents.length > 0 ? (
        <View style={styles.documentsList}>
          <Text style={[styles.documentsTitle, { color: colors.text }]}>
            Documents existants
          </Text>
          {documents.map((doc) => {
            const docInfo = getDocumentTypeInfo(doc.type);
            return (
              <TouchableOpacity
                key={doc._id}
                style={[
                  styles.documentCard,
                  { backgroundColor: colors.background },
                ]}
                onPress={() => handleOpen(doc.fileUrl)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[docInfo.color + "15", docInfo.color + "05"]}
                  style={styles.documentIcon}
                >
                  <Ionicons
                    name={docInfo.icon}
                    size={24}
                    color={docInfo.color}
                  />
                </LinearGradient>
                <View style={styles.documentInfo}>
                  <View style={styles.documentHeader}>
                    <Text
                      style={[styles.documentTitle, { color: colors.text }]}
                    >
                      {doc.title}
                    </Text>
                    {doc.isVerified && (
                      <View
                        style={[
                          styles.verifiedBadge,
                          { backgroundColor: colors.success + "15" },
                        ]}
                      >
                        <Ionicons
                          name="checkmark-circle"
                          size={12}
                          color={colors.success}
                        />
                        <Text
                          style={[
                            styles.verifiedText,
                            { color: colors.success },
                          ]}
                        >
                          Vérifié
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.documentMeta,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {doc.fileName} • {formatFileSize(doc.fileSize)}
                  </Text>
                  <Text
                    style={[
                      styles.documentDate,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Ajouté le {formatDate(doc.createdAt)}
                  </Text>
                </View>
                {isCurrentOwner && (
                  <TouchableOpacity
                    style={[
                      styles.deleteButton,
                      { backgroundColor: colors.error + "10" },
                    ]}
                    onPress={() => handleDelete(doc._id)}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color={colors.error}
                    />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <LinearGradient
            colors={[colors.primary + "15", colors.primary + "05"]}
            style={styles.emptyIcon}
          >
            <Ionicons
              name="folder-open-outline"
              size={32}
              color={colors.primary}
            />
          </LinearGradient>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Aucun document
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Ajoutez vos documents pour les avoir toujours à portée de main
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    position: "relative",
    overflow: "hidden",
  },
  cardBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.5,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  countText: {
    fontSize: 12,
    fontWeight: "600",
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
    fontSize: 12,
  },
  progressValue: {
    fontSize: 12,
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
  uploadSection: {
    marginBottom: 20,
  },
  uploadTitle: {
    fontSize: 13,
    marginBottom: 12,
  },
  uploadScrollContent: {
    paddingRight: 20,
    gap: 12,
  },
  uploadButton: {
    width: 100,
    alignItems: "center",
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    position: "relative",
  },
  uploadIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  uploadLabel: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  requiredBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  requiredText: {
    fontSize: 9,
    fontWeight: "600",
  },
  uploadedCheck: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  uploadProgressContainer: {
    alignItems: "center",
    gap: 8,
  },
  uploadProgressText: {
    fontSize: 12,
    fontWeight: "500",
  },
  documentsList: {
    marginTop: 8,
  },
  documentsTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  documentCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    gap: 12,
  },
  documentIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  documentInfo: {
    flex: 1,
  },
  documentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  documentTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: "600",
  },
  documentMeta: {
    fontSize: 11,
    marginBottom: 2,
  },
  documentDate: {
    fontSize: 10,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 12,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: 12,
    textAlign: "center",
  },
});
