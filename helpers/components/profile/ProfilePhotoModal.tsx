import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

interface ProfilePhotoModalProps {
  visible: boolean;
  colors: any;
  colorScheme: string | null;
  onClose: () => void;
  onTakePhoto: () => void;
  onPickImage: () => void;
  onDeletePhoto: () => void;
  hasPhoto: boolean;
}

export default function ProfilePhotoModal({
  visible,
  colors,
  colorScheme,
  onClose,
  onTakePhoto,
  onPickImage,
  onDeletePhoto,
  hasPhoto,
}: ProfilePhotoModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <BlurView intensity={90} tint={colorScheme} style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          activeOpacity={1}
        />
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <Text
            style={[
              styles.modalTitle,
              { color: colors.text, textAlign: "center", marginBottom: 20 },
            ]}
          >
            Photo de profil
          </Text>

          <TouchableOpacity
            style={[styles.photoOption, { borderColor: colors.border }]}
            onPress={onTakePhoto}
          >
            <View
              style={[
                styles.photoOptionIcon,
                { backgroundColor: colors.primary + "15" },
              ]}
            >
              <Ionicons name="camera" size={24} color={colors.primary} />
            </View>
            <View style={styles.photoOptionText}>
              <Text style={[styles.photoOptionTitle, { color: colors.text }]}>
                Prendre une photo
              </Text>
              <Text
                style={[
                  styles.photoOptionDesc,
                  { color: colors.textSecondary },
                ]}
              >
                Utiliser l'appareil photo
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.photoOption, { borderColor: colors.border }]}
            onPress={onPickImage}
          >
            <View
              style={[
                styles.photoOptionIcon,
                { backgroundColor: colors.primary + "15" },
              ]}
            >
              <Ionicons name="images" size={24} color={colors.primary} />
            </View>
            <View style={styles.photoOptionText}>
              <Text style={[styles.photoOptionTitle, { color: colors.text }]}>
                Choisir dans la galerie
              </Text>
              <Text
                style={[
                  styles.photoOptionDesc,
                  { color: colors.textSecondary },
                ]}
              >
                Sélectionner une photo existante
              </Text>
            </View>
          </TouchableOpacity>

          {hasPhoto && (
            <TouchableOpacity
              style={[styles.photoOption, { borderColor: colors.border }]}
              onPress={onDeletePhoto}
            >
              <View
                style={[
                  styles.photoOptionIcon,
                  { backgroundColor: "#F44336" + "15" },
                ]}
              >
                <Ionicons name="trash" size={24} color="#F44336" />
              </View>
              <View style={styles.photoOptionText}>
                <Text style={[styles.photoOptionTitle, { color: "#F44336" }]}>
                  Supprimer la photo
                </Text>
                <Text
                  style={[
                    styles.photoOptionDesc,
                    { color: colors.textSecondary },
                  ]}
                >
                  Revenir à l'avatar par défaut
                </Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.modalButton, { marginTop: 10 }]}
            onPress={onClose}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.modalButtonGradient}
            >
              <Text style={styles.modalButtonText}>Annuler</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center" },
  modalContent: {
    width: "90%",
    borderRadius: 28,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  modalTitle: { fontSize: 20, fontWeight: "600" },
  photoOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    gap: 16,
  },
  photoOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  photoOptionText: { flex: 1 },
  photoOptionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 2 },
  photoOptionDesc: { fontSize: 13 },
  modalButton: { borderRadius: 30, overflow: "hidden" },
  modalButtonGradient: { padding: 16, alignItems: "center" },
  modalButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
