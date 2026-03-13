import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { HelperProfile } from "./types";
import { formatDate } from "./constants";

interface ProfileDocumentsModalProps {
  visible: boolean;
  profile: HelperProfile | null;
  colors: any;
  colorScheme: string | null | undefined;
  scaleAnim: any;
  onClose: () => void;
  onPickDocument: (type: string) => void;
}

export default function ProfileDocumentsModal({
  visible,
  profile,
  colors,
  colorScheme,
  scaleAnim,
  onClose,
  onPickDocument,
}: ProfileDocumentsModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={90} tint={colorScheme} style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.card,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Documents
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.modalClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {profile?.documents && profile.documents.length > 0 ? (
              profile.documents.map((doc, index) => (
                <View
                  key={index}
                  style={[styles.documentItem, { borderColor: colors.border }]}
                >
                  <View style={styles.documentInfo}>
                    <View
                      style={[
                        styles.documentIcon,
                        {
                          backgroundColor: doc.verified
                            ? "#4CAF50" + "20"
                            : "#FF9800" + "20",
                        },
                      ]}
                    >
                      <Ionicons
                        name={doc.verified ? "checkmark-circle" : "time"}
                        size={20}
                        color={doc.verified ? "#4CAF50" : "#FF9800"}
                      />
                    </View>
                    <View>
                      <Text
                        style={[styles.documentName, { color: colors.text }]}
                      >
                        {doc.type === "license"
                          ? "Permis de conduire"
                          : doc.type === "insurance"
                          ? "Assurance"
                          : doc.type === "certification"
                          ? "Certification"
                          : doc.type}
                      </Text>
                      <Text
                        style={[
                          styles.documentDate,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {formatDate(doc.uploadedAt)}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.documentStatus,
                      { color: doc.verified ? "#4CAF50" : "#FF9800" },
                    ]}
                  >
                    {doc.verified ? "Validé" : "En attente"}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Aucun document uploadé
              </Text>
            )}

            <View style={styles.uploadButtons}>
              <TouchableOpacity
                style={[styles.uploadButton, { borderColor: colors.primary }]}
                onPress={() => onPickDocument("license")}
              >
                <Ionicons
                  name="cloud-upload-outline"
                  size={18}
                  color={colors.primary}
                />
                <Text
                  style={[styles.uploadButtonText, { color: colors.primary }]}
                >
                  Permis de conduire
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.uploadButton, { borderColor: colors.primary }]}
                onPress={() => onPickDocument("insurance")}
              >
                <Ionicons
                  name="cloud-upload-outline"
                  size={18}
                  color={colors.primary}
                />
                <Text
                  style={[styles.uploadButtonText, { color: colors.primary }]}
                >
                  Assurance
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.uploadButton, { borderColor: colors.primary }]}
                onPress={() => onPickDocument("certification")}
              >
                <Ionicons
                  name="cloud-upload-outline"
                  size={18}
                  color={colors.primary}
                />
                <Text
                  style={[styles.uploadButtonText, { color: colors.primary }]}
                >
                  Certification
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.modalButton} onPress={onClose}>
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.modalButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.modalButtonText}>Fermer</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

// Note: Importer Animated
import Animated from "react-native-reanimated";

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
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
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  modalClose: {
    padding: 4,
  },
  documentItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 8,
  },
  documentInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  documentName: {
    fontSize: 14,
    fontWeight: "500",
  },
  documentDate: {
    fontSize: 11,
    marginTop: 2,
  },
  documentStatus: {
    fontSize: 12,
    fontWeight: "500",
  },
  uploadButtons: {
    gap: 8,
    marginTop: 16,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderWidth: 1,
    borderRadius: 25,
    gap: 6,
  },
  uploadButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
  emptyText: {
    fontSize: 13,
    fontStyle: "italic",
    textAlign: "center",
    padding: 20,
  },
  modalButton: {
    marginTop: 20,
    borderRadius: 30,
    overflow: "hidden",
  },
  modalButtonGradient: {
    padding: 16,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
