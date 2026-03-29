// components/vehicle/VehicleModals.tsx - Version avec Alert

import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Animated,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../contexts/ThemeContext";
import { Colors } from "@/constants/theme";
import * as Haptics from "expo-haptics";
import { api } from "../../config/api";

interface VehicleModalsProps {
  noteModalVisible: boolean;
  setNoteModalVisible: (visible: boolean) => void;
  noteText: string;
  setNoteText: (text: string) => void;
  onAddNote: () => void;
  mileageModalVisible: boolean;
  setMileageModalVisible: (visible: boolean) => void;
  newMileage: string;
  setNewMileage: (mileage: string) => void;
  currentMileage: number;
  onUpdateMileage: () => void;
  transferModalVisible: boolean;
  setTransferModalVisible: (visible: boolean) => void;
  transferEmail: string;
  setTransferEmail: (email: string) => void;
  transferPrice: string;
  setTransferPrice: (price: string) => void;
  foundUser: any;
  onSearchUser: () => void;
  searchingUser: boolean;
  onTransfer: () => void;
  transferring: boolean;
  vehicle: any;
}

// Composant Modal wrapper
const ModalWrapper = ({
  visible,
  onClose,
  children,
  title,
  icon,
  iconColor,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
  icon: string;
  iconColor: string;
  colors: any;
}) => {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const handleDismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <BlurView
        intensity={90}
        style={styles.modalOverlay}
        tint={colors.theme === "dark" ? "dark" : "light"}
      >
        <TouchableWithoutFeedback onPress={handleDismissKeyboard}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={handleDismissKeyboard}
          activeOpacity={1}
        />

        <Animated.View
          style={[
            styles.modalContainer,
            {
              backgroundColor: colors.card,
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <LinearGradient
            colors={[colors.primary + "10", colors.secondary + "05"]}
            style={styles.modalGradient}
          >
            <View style={styles.modalHeader}>
              <LinearGradient
                colors={[iconColor + "20", iconColor + "10"]}
                style={styles.modalIconContainer}
              >
                <Ionicons name={icon as any} size={24} color={iconColor} />
              </LinearGradient>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {title}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.modalClose}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {children}
          </LinearGradient>
        </Animated.View>
      </BlurView>
    </Modal>
  );
};

// Modal Note
const NoteModal = ({
  visible,
  onClose,
  noteText,
  setNoteText,
  onAddNote,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  noteText: string;
  setNoteText: (text: string) => void;
  onAddNote: () => void;
  colors: any;
}) => {
  const [localText, setLocalText] = useState(noteText);

  useEffect(() => {
    if (visible) {
      setLocalText(noteText);
    }
  }, [visible, noteText]);

  const handleAdd = () => {
    if (localText.trim()) {
      setNoteText(localText);
      onClose();
      Alert.alert("✅ Note ajoutée", "Votre note a été sauvegardée");
      onAddNote();
    } else {
      Alert.alert("Erreur", "Veuillez écrire une note");
    }
  };

  const handleClose = () => {
    Keyboard.dismiss();
    setLocalText("");
    onClose();
  };

  return (
    <ModalWrapper
      visible={visible}
      onClose={handleClose}
      title="Ajouter une note"
      icon="create-outline"
      iconColor={colors.primary}
      colors={colors}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <TextInput
          style={[
            styles.noteInput,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
          placeholder="Écrivez votre note..."
          placeholderTextColor={colors.placeholder}
          multiline
          numberOfLines={5}
          value={localText}
          onChangeText={setLocalText}
          autoFocus
          textAlignVertical="top"
          blurOnSubmit={true}
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
        />
        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={[
              styles.modalButton,
              styles.modalButtonCancel,
              { borderColor: colors.border },
            ]}
            onPress={handleClose}
          >
            <Text style={{ color: colors.textSecondary }}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modalButton,
              styles.modalButtonSave,
              { backgroundColor: colors.primary },
            ]}
            onPress={handleAdd}
          >
            <Text style={{ color: "#fff" }}>Ajouter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ModalWrapper>
  );
};

// Modal Kilométrage
const MileageModal = ({
  visible,
  onClose,
  newMileage,
  setNewMileage,
  currentMileage,
  onUpdateMileage,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  newMileage: string;
  setNewMileage: (mileage: string) => void;
  currentMileage: number;
  onUpdateMileage: () => void;
  colors: any;
}) => {
  const [localMileage, setLocalMileage] = useState(newMileage);

  useEffect(() => {
    if (visible) {
      setLocalMileage(newMileage);
    }
  }, [visible, newMileage]);

  const handleUpdate = () => {
    const mileage = parseInt(localMileage);
    if (localMileage.trim() && !isNaN(mileage) && mileage > currentMileage) {
      setNewMileage(localMileage);
      onClose();
      Alert.alert(
        "✅ Kilométrage mis à jour",
        `${localMileage} km enregistrés`
      );
      onUpdateMileage();
    } else if (isNaN(mileage)) {
      Alert.alert("Erreur", "Veuillez entrer un nombre valide");
    } else if (mileage <= currentMileage) {
      Alert.alert("Erreur", "Le kilométrage doit être supérieur à l'actuel");
    }
  };

  const handleClose = () => {
    Keyboard.dismiss();
    setLocalMileage("");
    onClose();
  };

  return (
    <ModalWrapper
      visible={visible}
      onClose={handleClose}
      title="Mettre à jour le kilométrage"
      icon="speedometer-outline"
      iconColor={colors.primary}
      colors={colors}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.mileageInfo}>
          <Text style={[styles.mileageLabel, { color: colors.textSecondary }]}>
            Kilométrage actuel
          </Text>
          <Text style={[styles.mileageValue, { color: colors.text }]}>
            {currentMileage.toLocaleString()} km
          </Text>
        </View>
        <View style={styles.inputContainer}>
          <LinearGradient
            colors={[colors.primary + "15", colors.primary + "05"]}
            style={styles.inputIcon}
          >
            <Ionicons
              name="speedometer-outline"
              size={18}
              color={colors.primary}
            />
          </LinearGradient>
          <TextInput
            style={[styles.mileageInput, { color: colors.text }]}
            placeholder="Nouveau kilométrage"
            placeholderTextColor={colors.placeholder}
            keyboardType="numeric"
            value={localMileage}
            onChangeText={setLocalMileage}
            returnKeyType="done"
            onSubmitEditing={handleUpdate}
            blurOnSubmit={true}
          />
          <Text style={[styles.inputUnit, { color: colors.textSecondary }]}>
            km
          </Text>
        </View>
        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={[
              styles.modalButton,
              styles.modalButtonCancel,
              { borderColor: colors.border },
            ]}
            onPress={handleClose}
          >
            <Text style={{ color: colors.textSecondary }}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modalButton,
              styles.modalButtonSave,
              { backgroundColor: colors.primary },
            ]}
            onPress={handleUpdate}
          >
            <Text style={{ color: "#fff" }}>Mettre à jour</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ModalWrapper>
  );
};

// Modal Transfert
const TransferModal = ({
  visible,
  onClose,
  transferEmail,
  setTransferEmail,
  transferPrice,
  setTransferPrice,
  foundUser,
  onSearchUser,
  searchingUser,
  onTransfer,
  transferring,
  vehicle,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  transferEmail: string;
  setTransferEmail: (email: string) => void;
  transferPrice: string;
  setTransferPrice: (price: string) => void;
  foundUser: any;
  onSearchUser: () => void;
  searchingUser: boolean;
  onTransfer: () => void;
  transferring: boolean;
  vehicle: any;
  colors: any;
}) => {
  const [localEmail, setLocalEmail] = useState(transferEmail);
  const [localPrice, setLocalPrice] = useState(transferPrice);
  const [step, setStep] = useState<"email" | "confirm">("email");
  const [localFoundUser, setLocalFoundUser] = useState<any>(null);
  const [localSearching, setLocalSearching] = useState(false);

  useEffect(() => {
    if (visible) {
      setLocalEmail(transferEmail);
      setLocalPrice(transferPrice);
      setLocalFoundUser(foundUser);
      setStep("email");
    }
  }, [visible, transferEmail, transferPrice, foundUser]);

  const handleSearchUser = async () => {
    if (!localEmail.trim()) {
      Alert.alert("Erreur", "Veuillez entrer un email");
      return;
    }

    setLocalSearching(true);
    try {
      const response = await api.get(`/users/search?email=${localEmail}`);

      if (response.data.success && response.data.data) {
        const user = response.data.data;
        setLocalFoundUser(user);
        setTransferEmail(localEmail);
        Alert.alert(
          "✅ Utilisateur trouvé",
          `${user.firstName} ${user.lastName}\n${user.email}`
        );
      } else {
        setLocalFoundUser(null);
        Alert.alert("Non trouvé", "Aucun utilisateur avec cet email");
      }
    } catch (error: any) {
      console.error("Erreur recherche utilisateur:", error);
      setLocalFoundUser(null);
      Alert.alert(
        "Erreur",
        error.response?.data?.message || "Utilisateur non trouvé"
      );
    } finally {
      setLocalSearching(false);
    }
  };

  const handleTransferConfirm = () => {
    if (localFoundUser) {
      Alert.alert(
        "⚠️ Confirmer le transfert",
        `Transférer ${vehicle?.make} ${vehicle?.model} à ${localFoundUser.firstName} ${localFoundUser.lastName} ?`,
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Transférer",
            style: "destructive",
            onPress: () => {
              setTransferPrice(localPrice);
              setTransferEmail(localEmail);
              onClose();
              onTransfer();
            },
          },
        ]
      );
    }
  };

  const handleClose = () => {
    Keyboard.dismiss();
    setLocalEmail("");
    setLocalPrice("");
    setLocalFoundUser(null);
    onClose();
  };

  return (
    <ModalWrapper
      visible={visible}
      onClose={handleClose}
      title="Transférer le véhicule"
      icon="swap-horizontal-outline"
      iconColor={colors.warning}
      colors={colors}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text
          style={[styles.transferSubtitle, { color: colors.textSecondary }]}
        >
          {vehicle?.make} {vehicle?.model} - {vehicle?.licensePlate}
        </Text>

        {step === "email" ? (
          <>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Email du nouveau propriétaire *
            </Text>
            <View style={styles.emailContainer}>
              <TextInput
                style={[
                  styles.emailInput,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="exemple@email.com"
                placeholderTextColor={colors.placeholder}
                value={localEmail}
                onChangeText={(text) => {
                  setLocalEmail(text);
                  if (localFoundUser) setLocalFoundUser(null);
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="done"
                onSubmitEditing={handleSearchUser}
                blurOnSubmit={true}
              />
              <TouchableOpacity
                style={[
                  styles.searchButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleSearchUser}
                disabled={localSearching || !localEmail.trim()}
              >
                {localSearching ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Ionicons name="search" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>

            {localFoundUser && (
              <Animated.View
                style={[
                  styles.userCard,
                  { backgroundColor: colors.background },
                ]}
              >
                <LinearGradient
                  colors={[colors.primary, colors.secondary]}
                  style={styles.userAvatar}
                >
                  <Text style={styles.userAvatarText}>
                    {localFoundUser.firstName?.[0]}
                    {localFoundUser.lastName?.[0]}
                  </Text>
                </LinearGradient>
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, { color: colors.text }]}>
                    {localFoundUser.firstName} {localFoundUser.lastName}
                  </Text>
                  <Text
                    style={[styles.userEmail, { color: colors.textSecondary }]}
                  >
                    {localFoundUser.email}
                  </Text>
                </View>
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={colors.success}
                />
              </Animated.View>
            )}

            {localFoundUser && (
              <TouchableOpacity
                style={[
                  styles.nextButton,
                  { backgroundColor: colors.primary, marginTop: 16 },
                ]}
                onPress={() => setStep("confirm")}
              >
                <Text style={styles.nextButtonText}>Continuer</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            )}
          </>
        ) : (
          <>
            <View style={styles.userSummary}>
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.summaryAvatar}
              >
                <Text style={styles.summaryAvatarText}>
                  {localFoundUser?.firstName?.[0]}
                  {localFoundUser?.lastName?.[0]}
                </Text>
              </LinearGradient>
              <View>
                <Text style={[styles.summaryName, { color: colors.text }]}>
                  {localFoundUser?.firstName} {localFoundUser?.lastName}
                </Text>
                <Text
                  style={[styles.summaryEmail, { color: colors.textSecondary }]}
                >
                  {localFoundUser?.email}
                </Text>
              </View>
            </View>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Prix de vente (optionnel)
            </Text>
            <View style={styles.priceContainer}>
              <Text style={[styles.currencySymbol, { color: colors.primary }]}>
                $
              </Text>
              <TextInput
                style={[styles.priceInput, { color: colors.text }]}
                placeholder="0.00"
                placeholderTextColor={colors.placeholder}
                value={localPrice}
                onChangeText={setLocalPrice}
                keyboardType="numeric"
                returnKeyType="done"
                onSubmitEditing={handleTransferConfirm}
                blurOnSubmit={true}
              />
              <Text
                style={[styles.currencyLabel, { color: colors.textSecondary }]}
              >
                CAD
              </Text>
            </View>

            <View
              style={[
                styles.warningCard,
                { backgroundColor: colors.error + "10" },
              ]}
            >
              <Ionicons name="warning-outline" size={18} color={colors.error} />
              <Text style={[styles.warningText, { color: colors.error }]}>
                Cette action est irréversible. Le véhicule sera transféré
                définitivement.
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonCancel,
                  { borderColor: colors.border },
                ]}
                onPress={() => setStep("email")}
              >
                <Text style={{ color: colors.textSecondary }}>Retour</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonSave,
                  { backgroundColor: colors.error },
                ]}
                onPress={handleTransferConfirm}
                disabled={transferring}
              >
                {transferring ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff" }}>Confirmer</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </ModalWrapper>
  );
};

export default function VehicleModals(props: VehicleModalsProps) {
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme ?? "light"];

  return (
    <>
      <NoteModal
        visible={props.noteModalVisible}
        onClose={() => props.setNoteModalVisible(false)}
        noteText={props.noteText}
        setNoteText={props.setNoteText}
        onAddNote={props.onAddNote}
        colors={colors}
      />

      <MileageModal
        visible={props.mileageModalVisible}
        onClose={() => props.setMileageModalVisible(false)}
        newMileage={props.newMileage}
        setNewMileage={props.setNewMileage}
        currentMileage={props.currentMileage}
        onUpdateMileage={props.onUpdateMileage}
        colors={colors}
      />

      <TransferModal
        visible={props.transferModalVisible}
        onClose={() => props.setTransferModalVisible(false)}
        transferEmail={props.transferEmail}
        setTransferEmail={props.setTransferEmail}
        transferPrice={props.transferPrice}
        setTransferPrice={props.setTransferPrice}
        foundUser={props.foundUser}
        onSearchUser={props.onSearchUser}
        searchingUser={props.searchingUser}
        onTransfer={props.onTransfer}
        transferring={props.transferring}
        vehicle={props.vehicle}
        colors={colors}
      />
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
    borderRadius: 32,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 20,
  },
  modalGradient: {
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  modalIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    flex: 1,
  },
  modalClose: {
    padding: 4,
  },
  // Note Modal
  noteInput: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    fontSize: 15,
    minHeight: 120,
    marginBottom: 20,
    textAlignVertical: "top",
  },
  // Mileage Modal
  mileageInfo: {
    alignItems: "center",
    marginBottom: 20,
  },
  mileageLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  mileageValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
    height: 56,
  },
  inputIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  mileageInput: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  inputUnit: {
    fontSize: 14,
    marginLeft: 8,
  },
  // Transfer Modal
  transferSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 8,
  },
  emailContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  emailInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },
  searchButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    marginBottom: 16,
    gap: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  userAvatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 30,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  userSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 16,
    borderRadius: 20,
    marginBottom: 20,
  },
  summaryAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryAvatarText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  summaryName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  summaryEmail: {
    fontSize: 12,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 56,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: "600",
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  currencyLabel: {
    fontSize: 14,
    marginLeft: 8,
  },
  warningCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    gap: 12,
    marginBottom: 20,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonCancel: {
    borderWidth: 1,
  },
  modalButtonSave: {
    borderWidth: 0,
  },
});
