// components/settings/AccountSection.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Dimensions, // ← IMPORT UNIQUE
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import SettingsSection from "./SettingsSection";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { api } from "../../config/api";
import { Colors } from "@/constants/theme";

const { width, height } = Dimensions.get("window");

interface AccountSectionProps {
  userDetails: any;
  onUpdate: () => void;
}

export default function AccountSection({
  userDetails,
  onUpdate,
}: AccountSectionProps) {
  const { logout } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme ?? "light"];

  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({
    firstName: userDetails?.firstName || "",
    lastName: userDetails?.lastName || "",
    phone: userDetails?.phone || "",
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Formatage téléphone
  const formatPhoneNumber = (phone: string) =>
    phone.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5");

  // Modifier le profil
  const updateUserProfile = async () => {
    if (
      !editProfileForm.firstName.trim() ||
      !editProfileForm.lastName.trim() ||
      !editProfileForm.phone.trim()
    ) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Veuillez remplir tous les champs",
      });
      return;
    }

    setUpdatingProfile(true);
    try {
      await api.put(`/users/${userDetails?._id}`, {
        firstName: editProfileForm.firstName.trim(),
        lastName: editProfileForm.lastName.trim(),
        phone: editProfileForm.phone.trim(),
      });
      await onUpdate();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: "success",
        text1: "Succès",
        text2: "Profil mis à jour",
      });
      setEditProfileModalVisible(false);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: error.response?.data?.message || "Impossible de mettre à jour",
      });
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Changer le mot de passe
  const handleChangePassword = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Les mots de passe ne correspondent pas",
      });
      return;
    }
    if (passwordForm.new.length < 6) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Minimum 6 caractères",
      });
      return;
    }

    setUpdatingPassword(true);
    try {
      await api.post("/users/change-password", {
        currentPassword: passwordForm.current,
        newPassword: passwordForm.new,
      });
      setPasswordModalVisible(false);
      setPasswordForm({ current: "", new: "", confirm: "" });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: "success",
        text1: "Succès",
        text2: "Mot de passe modifié",
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: error.response?.data?.message || "Échec",
      });
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Supprimer le compte
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "SUPPRIMER") {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: 'Tapez "SUPPRIMER" pour confirmer',
      });
      return;
    }

    setDeleting(true);
    try {
      await api.delete(`/users/${userDetails?._id}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: "success",
        text1: "Compte supprimé",
        text2: "Nous espérons vous revoir",
      });
      setTimeout(() => logout(), 1500);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: error.response?.data?.message || "Impossible de supprimer",
      });
    } finally {
      setDeleting(false);
      setDeleteModalVisible(false);
    }
  };

  return (
    <>
      <SettingsSection title="Compte et sécurité" icon="person-outline">
        {/* Modifier le profil */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setEditProfileModalVisible(true)}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="create-outline" size={20} color={colors.primary} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>
              Modifier mon profil
            </Text>
          </View>
          <Text style={[styles.menuItemValue, { color: colors.textSecondary }]}>
            {userDetails?.firstName} {userDetails?.lastName}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        {/* Changer le mot de passe */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setPasswordModalVisible(true)}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={colors.primary}
            />
            <Text style={[styles.menuItemText, { color: colors.text }]}>
              Changer le mot de passe
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        {/* Supprimer le compte */}
        <TouchableOpacity
          style={[styles.menuItem, styles.dangerItem]}
          onPress={() => setDeleteModalVisible(true)}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="trash-outline" size={20} color={colors.error} />
            <Text style={[styles.menuItemText, { color: colors.error }]}>
              Supprimer mon compte
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.error} />
        </TouchableOpacity>
      </SettingsSection>

      {/* Modal Édition Profil */}
      <Modal visible={editProfileModalVisible} transparent animationType="fade">
        <BlurView
          intensity={80}
          style={styles.modalOverlay}
          tint={effectiveTheme === "dark" ? "dark" : "light"}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Modifier mon profil
              </Text>
              <TouchableOpacity
                onPress={() => setEditProfileModalVisible(false)}
              >
                <Ionicons
                  name="close-outline"
                  size={24}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Prénom"
              placeholderTextColor={colors.placeholder}
              value={editProfileForm.firstName}
              onChangeText={(text) =>
                setEditProfileForm({ ...editProfileForm, firstName: text })
              }
            />
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Nom"
              placeholderTextColor={colors.placeholder}
              value={editProfileForm.lastName}
              onChangeText={(text) =>
                setEditProfileForm({ ...editProfileForm, lastName: text })
              }
            />
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Téléphone"
              placeholderTextColor={colors.placeholder}
              keyboardType="phone-pad"
              value={editProfileForm.phone}
              onChangeText={(text) =>
                setEditProfileForm({ ...editProfileForm, phone: text })
              }
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonCancel,
                  { borderColor: colors.border },
                ]}
                onPress={() => setEditProfileModalVisible(false)}
              >
                <Text style={{ color: colors.textSecondary }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonSave,
                  { backgroundColor: colors.primary },
                ]}
                onPress={updateUserProfile}
                disabled={updatingProfile}
              >
                {updatingProfile ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff" }}>Enregistrer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>

      {/* Modal Mot de passe */}
      <Modal visible={passwordModalVisible} transparent animationType="fade">
        <BlurView
          intensity={80}
          style={styles.modalOverlay}
          tint={effectiveTheme === "dark" ? "dark" : "light"}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Changer le mot de passe
              </Text>
              <TouchableOpacity onPress={() => setPasswordModalVisible(false)}>
                <Ionicons
                  name="close-outline"
                  size={24}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Mot de passe actuel"
              placeholderTextColor={colors.placeholder}
              secureTextEntry
              value={passwordForm.current}
              onChangeText={(text) =>
                setPasswordForm({ ...passwordForm, current: text })
              }
            />
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Nouveau mot de passe"
              placeholderTextColor={colors.placeholder}
              secureTextEntry
              value={passwordForm.new}
              onChangeText={(text) =>
                setPasswordForm({ ...passwordForm, new: text })
              }
            />
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Confirmer"
              placeholderTextColor={colors.placeholder}
              secureTextEntry
              value={passwordForm.confirm}
              onChangeText={(text) =>
                setPasswordForm({ ...passwordForm, confirm: text })
              }
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonCancel,
                  { borderColor: colors.border },
                ]}
                onPress={() => setPasswordModalVisible(false)}
              >
                <Text style={{ color: colors.textSecondary }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonSave,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleChangePassword}
                disabled={updatingPassword}
              >
                {updatingPassword ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff" }}>Modifier</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>

      {/* Modal Suppression compte */}
      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <BlurView
          intensity={80}
          style={styles.modalOverlay}
          tint={effectiveTheme === "dark" ? "dark" : "light"}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.error }]}>
                Supprimer mon compte
              </Text>
              <TouchableOpacity onPress={() => setDeleteModalVisible(false)}>
                <Ionicons
                  name="close-outline"
                  size={24}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            <Text style={[styles.warningText, { color: colors.textSecondary }]}>
              Cette action est irréversible. Toutes vos données seront
              supprimées.
            </Text>
            <Text style={[styles.confirmText, { color: colors.text }]}>
              Tapez{" "}
              <Text style={{ fontWeight: "bold", color: colors.error }}>
                SUPPRIMER
              </Text>{" "}
              pour confirmer
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="SUPPRIMER"
              placeholderTextColor={colors.placeholder}
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonCancel,
                  { borderColor: colors.border },
                ]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={{ color: colors.textSecondary }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonSave,
                  { backgroundColor: colors.error },
                ]}
                onPress={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff" }}>Supprimer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: "500",
  },
  menuItemValue: {
    fontSize: 14,
    marginRight: 8,
  },
  dangerItem: {
    borderBottomWidth: 0,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: width * 0.9,
    borderRadius: 28,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 25,
    alignItems: "center",
  },
  modalButtonCancel: {
    borderWidth: 1,
  },
  modalButtonSave: {
    borderWidth: 0,
  },
  warningText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  confirmText: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: 12,
  },
});
