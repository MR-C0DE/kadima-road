// helpers/app/settings/account.tsx
// Écran de compte et sécurité - Profil, mot de passe, suppression du compte

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
  StatusBar,
  Animated,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { api } from "../../config/api";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";

// ============================================
// TYPES
// ============================================

interface UserDetails {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  photo?: string;
  createdAt: string;
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function AccountSettingsScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme ?? "light"];

  // États
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Modales
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const itemsAnim = useRef([1, 2, 3].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    loadUserData();
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
  // CHARGEMENT DES DONNÉES
  // ============================================

  const loadUserData = async () => {
    try {
      const response = await api.get("/helpers/profile/me");
      const data = response.data.data;
      setUserDetails({
        _id: data.user._id,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        email: data.user.email,
        phone: data.user.phone,
        photo: data.photo,
        createdAt: data.createdAt,
      });
      setEditProfileForm({
        firstName: data.user.firstName || "",
        lastName: data.user.lastName || "",
        phone: data.user.phone || "",
      });
    } catch (error) {
      console.error("Erreur chargement profil:", error);
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Impossible de charger votre profil",
        position: "bottom",
      });
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // PHOTO DE PROFIL
  // ============================================

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Toast.show({
        type: "error",
        text1: "Permission refusée",
        text2: "Vous devez autoriser l'accès à la caméra",
        position: "bottom",
      });
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadPhoto(result.assets[0].uri);
    }
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Toast.show({
        type: "error",
        text1: "Permission refusée",
        text2: "Vous devez autoriser l'accès à la galerie",
        position: "bottom",
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadPhoto(result.assets[0].uri);
    }
  };

  const uploadPhoto = async (uri: string) => {
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("photo", {
        uri,
        type: "image/jpeg",
        name: `profile_${Date.now()}.jpg`,
      } as any);

      await api.post("/helpers/profile/photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await loadUserData();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: "success",
        text1: "Succès",
        text2: "Photo de profil mise à jour",
        position: "bottom",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Impossible de télécharger l'image",
        position: "bottom",
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async () => {
    setUploadingPhoto(true);
    try {
      await api.delete("/helpers/profile/photo");
      await loadUserData();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: "success",
        text1: "Succès",
        text2: "Photo de profil supprimée",
        position: "bottom",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Impossible de supprimer la photo",
        position: "bottom",
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  // ============================================
  // MODIFICATION DU PROFIL
  // ============================================

  const updateUserProfile = async () => {
    if (!editProfileForm.firstName.trim() || !editProfileForm.lastName.trim()) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Le prénom et le nom sont requis",
        position: "bottom",
      });
      return;
    }

    setUpdatingProfile(true);
    try {
      await api.put("/helpers/profile/me", {
        firstName: editProfileForm.firstName.trim(),
        lastName: editProfileForm.lastName.trim(),
        phone: editProfileForm.phone.trim(),
      });

      await loadUserData();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: "success",
        text1: "Succès",
        text2: "Profil mis à jour",
        position: "bottom",
      });
      setEditProfileModalVisible(false);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2:
          error.response?.data?.message ||
          "Impossible de mettre à jour le profil",
        position: "bottom",
      });
    } finally {
      setUpdatingProfile(false);
    }
  };

  // ============================================
  // CHANGEMENT DE MOT DE PASSE
  // ============================================

  const handleChangePassword = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Les mots de passe ne correspondent pas",
        position: "bottom",
      });
      return;
    }
    if (passwordForm.new.length < 6) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Le mot de passe doit contenir au moins 6 caractères",
        position: "bottom",
      });
      return;
    }

    setUpdatingPassword(true);
    try {
      await api.post("/auth/change-password", {
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
        position: "bottom",
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2:
          error.response?.data?.message ||
          "Impossible de modifier le mot de passe",
        position: "bottom",
      });
    } finally {
      setUpdatingPassword(false);
    }
  };

  // ============================================
  // SUPPRESSION DU COMPTE
  // ============================================

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "SUPPRIMER") {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: 'Tapez "SUPPRIMER" pour confirmer',
        position: "bottom",
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
        text2: "Nous espérons vous revoir bientôt",
        position: "bottom",
        visibilityTime: 3000,
      });
      setTimeout(() => logout(), 2000);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2:
          error.response?.data?.message || "Impossible de supprimer le compte",
        position: "bottom",
      });
      setDeleting(false);
    }
  };

  // ============================================
  // UTILITAIRES
  // ============================================

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `+1 (${cleaned.slice(0, 3)}) ${cleaned.slice(
        3,
        6
      )}-${cleaned.slice(6, 10)}`;
    }
    if (cleaned.length === 11 && cleaned.startsWith("1")) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(
        4,
        7
      )}-${cleaned.slice(7, 11)}`;
    }
    return phone;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Date inconnue";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

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
            <Ionicons name="person" size={40} color="#fff" />
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
          <Text style={styles.headerTitle}>Compte et sécurité</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        {/* Carte utilisateur */}
        <Animated.View
          style={[
            styles.userCard,
            { backgroundColor: colors.surface },
            { transform: [{ scale: itemsAnim[0] }], opacity: itemsAnim[0] },
          ]}
        >
          <LinearGradient
            colors={[colors.primary + "10", colors.secondary + "05"]}
            style={styles.userCardGradient}
          >
            <TouchableOpacity
              onPress={handlePickImage}
              style={styles.avatarContainer}
            >
              {uploadingPhoto ? (
                <View style={[styles.avatar, styles.avatarLoading]}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : userDetails?.photo ? (
                <Image
                  source={{ uri: userDetails.photo }}
                  style={styles.avatarImage}
                  contentFit="cover"
                />
              ) : (
                <LinearGradient
                  colors={[colors.primary, colors.secondary]}
                  style={styles.avatar}
                >
                  <Text style={styles.avatarText}>
                    {userDetails?.firstName?.[0]}
                    {userDetails?.lastName?.[0]}
                  </Text>
                </LinearGradient>
              )}
              <View
                style={[styles.editBadge, { backgroundColor: colors.primary }]}
              >
                <Ionicons name="camera" size={12} color="#fff" />
              </View>
            </TouchableOpacity>

            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: colors.text }]}>
                {userDetails?.firstName} {userDetails?.lastName}
              </Text>
              <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                {userDetails?.email}
              </Text>
              {userDetails?.phone && (
                <Text
                  style={[styles.userPhone, { color: colors.textSecondary }]}
                >
                  {formatPhoneNumber(userDetails.phone)}
                </Text>
              )}
              <Text style={[styles.userDate, { color: colors.textSecondary }]}>
                Membre depuis {formatDate(userDetails?.createdAt)}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Modifier le profil */}
        <Animated.View
          style={[
            styles.menuItem,
            { backgroundColor: colors.surface },
            { transform: [{ scale: itemsAnim[1] }], opacity: itemsAnim[1] },
          ]}
        >
          <TouchableOpacity
            style={styles.menuItemContent}
            onPress={() => setEditProfileModalVisible(true)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[colors.primary + "20", colors.primary + "10"]}
              style={styles.menuIcon}
            >
              <Ionicons
                name="person-outline"
                size={22}
                color={colors.primary}
              />
            </LinearGradient>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>
                Modifier mon profil
              </Text>
              <Text
                style={[styles.menuSubtitle, { color: colors.textSecondary }]}
              >
                Prénom, nom, téléphone
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Changer le mot de passe */}
        <Animated.View
          style={[
            styles.menuItem,
            { backgroundColor: colors.surface },
            { transform: [{ scale: itemsAnim[2] }], opacity: itemsAnim[2] },
          ]}
        >
          <TouchableOpacity
            style={styles.menuItemContent}
            onPress={() => setPasswordModalVisible(true)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[colors.primary + "20", colors.primary + "10"]}
              style={styles.menuIcon}
            >
              <Ionicons
                name="lock-closed-outline"
                size={22}
                color={colors.primary}
              />
            </LinearGradient>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>
                Changer le mot de passe
              </Text>
              <Text
                style={[styles.menuSubtitle, { color: colors.textSecondary }]}
              >
                Modifier votre mot de passe
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Supprimer le compte */}
        <Animated.View
          style={[
            styles.menuItem,
            styles.dangerItem,
            { backgroundColor: colors.surface },
            { transform: [{ scale: itemsAnim[2] }], opacity: itemsAnim[2] },
          ]}
        >
          <TouchableOpacity
            style={styles.menuItemContent}
            onPress={() => setDeleteModalVisible(true)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[colors.error + "20", colors.error + "10"]}
              style={[
                styles.menuIcon,
                { backgroundColor: colors.error + "10" },
              ]}
            >
              <Ionicons name="trash-outline" size={22} color={colors.error} />
            </LinearGradient>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuTitle, { color: colors.error }]}>
                Supprimer mon compte
              </Text>
              <Text style={[styles.menuSubtitle, { color: colors.error }]}>
                Cette action est irréversible
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.error} />
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.bottomSpace} />
      </Animated.ScrollView>

      {/* ============================================
          MODAL ÉDITION PROFIL
      ============================================ */}
      <Modal visible={editProfileModalVisible} transparent animationType="fade">
        <BlurView
          intensity={90}
          style={styles.modalOverlay}
          tint={effectiveTheme === "dark" ? "dark" : "light"}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContainer}
          >
            <Animated.View
              style={[
                styles.modalContent,
                { backgroundColor: colors.card },
                {
                  transform: [
                    {
                      scale: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.9, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={[colors.primary + "10", colors.secondary + "05"]}
                style={styles.modalGradient}
              >
                <View style={styles.modalHeader}>
                  <LinearGradient
                    colors={[colors.primary + "20", colors.primary + "10"]}
                    style={styles.modalIcon}
                  >
                    <Ionicons name="person" size={24} color={colors.primary} />
                  </LinearGradient>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    Modifier mon profil
                  </Text>
                  <TouchableOpacity
                    onPress={() => setEditProfileModalVisible(false)}
                    style={styles.modalClose}
                  >
                    <Ionicons
                      name="close"
                      size={24}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={[
                    styles.input,
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
                    styles.input,
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
                    styles.input,
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
                      styles.modalBtn,
                      styles.modalBtnCancel,
                      { borderColor: colors.border },
                    ]}
                    onPress={() => setEditProfileModalVisible(false)}
                  >
                    <Text style={{ color: colors.textSecondary }}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalBtn,
                      styles.modalBtnSave,
                      { backgroundColor: colors.primary },
                    ]}
                    onPress={updateUserProfile}
                    disabled={updatingProfile}
                  >
                    {updatingProfile ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={{ color: "#fff" }}>Enregistrer</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </Animated.View>
          </KeyboardAvoidingView>
        </BlurView>
      </Modal>

      {/* ============================================
          MODAL MOT DE PASSE
      ============================================ */}
      <Modal visible={passwordModalVisible} transparent animationType="fade">
        <BlurView
          intensity={90}
          style={styles.modalOverlay}
          tint={effectiveTheme === "dark" ? "dark" : "light"}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContainer}
          >
            <Animated.View
              style={[
                styles.modalContent,
                { backgroundColor: colors.card },
                {
                  transform: [
                    {
                      scale: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.9, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={[colors.primary + "10", colors.secondary + "05"]}
                style={styles.modalGradient}
              >
                <View style={styles.modalHeader}>
                  <LinearGradient
                    colors={[colors.primary + "20", colors.primary + "10"]}
                    style={styles.modalIcon}
                  >
                    <Ionicons
                      name="lock-closed"
                      size={24}
                      color={colors.primary}
                    />
                  </LinearGradient>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    Changer le mot de passe
                  </Text>
                  <TouchableOpacity
                    onPress={() => setPasswordModalVisible(false)}
                    style={styles.modalClose}
                  >
                    <Ionicons
                      name="close"
                      size={24}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={[
                    styles.input,
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
                    styles.input,
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
                    styles.input,
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
                      styles.modalBtn,
                      styles.modalBtnCancel,
                      { borderColor: colors.border },
                    ]}
                    onPress={() => setPasswordModalVisible(false)}
                  >
                    <Text style={{ color: colors.textSecondary }}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalBtn,
                      styles.modalBtnSave,
                      { backgroundColor: colors.primary },
                    ]}
                    onPress={handleChangePassword}
                    disabled={updatingPassword}
                  >
                    {updatingPassword ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={{ color: "#fff" }}>Modifier</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </Animated.View>
          </KeyboardAvoidingView>
        </BlurView>
      </Modal>

      {/* ============================================
          MODAL SUPPRESSION COMPTE
      ============================================ */}
      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <BlurView
          intensity={90}
          style={styles.modalOverlay}
          tint={effectiveTheme === "dark" ? "dark" : "light"}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContainer}
          >
            <Animated.View
              style={[
                styles.modalContent,
                { backgroundColor: colors.card },
                {
                  transform: [
                    {
                      scale: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.9, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={[colors.error + "10", colors.error + "05"]}
                style={styles.modalGradient}
              >
                <View style={styles.modalHeader}>
                  <LinearGradient
                    colors={[colors.error + "20", colors.error + "10"]}
                    style={[
                      styles.modalIcon,
                      { backgroundColor: colors.error + "10" },
                    ]}
                  >
                    <Ionicons name="warning" size={24} color={colors.error} />
                  </LinearGradient>
                  <Text style={[styles.modalTitle, { color: colors.error }]}>
                    Supprimer mon compte
                  </Text>
                  <TouchableOpacity
                    onPress={() => setDeleteModalVisible(false)}
                    style={styles.modalClose}
                  >
                    <Ionicons
                      name="close"
                      size={24}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                <Text
                  style={[styles.warningText, { color: colors.textSecondary }]}
                >
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
                    styles.input,
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
                      styles.modalBtn,
                      styles.modalBtnCancel,
                      { borderColor: colors.border },
                    ]}
                    onPress={() => setDeleteModalVisible(false)}
                  >
                    <Text style={{ color: colors.textSecondary }}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalBtn,
                      styles.modalBtnSave,
                      { backgroundColor: colors.error },
                    ]}
                    onPress={handleDeleteAccount}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={{ color: "#fff" }}>Supprimer</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </Animated.View>
          </KeyboardAvoidingView>
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
  userCard: {
    borderRadius: 24,
    marginBottom: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  userCardGradient: {
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLoading: {
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  avatarImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  avatarText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 13,
    marginBottom: 2,
  },
  userDate: {
    fontSize: 11,
  },
  menuItem: {
    borderRadius: 20,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
  },
  dangerItem: {
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
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
  modalContainer: {
    width: "90%",
    maxWidth: 400,
  },
  modalContent: {
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 20,
  },
  modalGradient: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  modalIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  modalClose: {
    padding: 4,
  },
  input: {
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
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
  },
  modalBtnCancel: {
    borderWidth: 1,
  },
  modalBtnSave: {
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
