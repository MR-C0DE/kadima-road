// app/settings/emergency.tsx - Version design moderne avec backend complet

import React, { useEffect, useState, useRef } from "react";
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

interface EmergencyContact {
  _id?: string;
  name: string;
  phone: string;
  relationship: string;
}

export default function EmergencySettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme ?? "light"];

  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(
    null
  );
  const [form, setForm] = useState({
    name: "",
    phone: "",
    relationship: "",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadContacts();
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
  }, []);

  const loadContacts = async () => {
    try {
      const response = await api.get("/users/emergency-contacts");
      setContacts(response.data.data || []);
    } catch (error) {
      console.error("Erreur chargement contacts:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const validateForm = () => {
    if (!form.name.trim()) {
      Alert.alert("Erreur", "Le nom est requis");
      return false;
    }
    if (!form.phone.trim()) {
      Alert.alert("Erreur", "Le numéro de téléphone est requis");
      return false;
    }
    const phoneDigits = form.phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      Alert.alert(
        "Erreur",
        "Numéro de téléphone invalide (10 chiffres requis)"
      );
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSaving(true);

    try {
      if (editingContact) {
        await api.put(`/users/emergency-contacts/${editingContact._id}`, form);
        Alert.alert("✅ Succès", "Contact modifié avec succès");
      } else {
        await api.post("/users/emergency-contacts", form);
        Alert.alert("✅ Succès", "Contact ajouté avec succès");
      }

      setModalVisible(false);
      setEditingContact(null);
      setForm({ name: "", phone: "", relationship: "" });
      loadContacts();
    } catch (error: any) {
      Alert.alert(
        "Erreur",
        error.response?.data?.message || "Impossible de sauvegarder"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (contact: EmergencyContact) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      "⚠️ Supprimer le contact",
      `Voulez-vous vraiment supprimer ${contact.name} de vos contacts d'urgence ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            setDeleting(contact._id);
            try {
              await api.delete(`/users/emergency-contacts/${contact._id}`);
              Alert.alert("✅ Succès", "Contact supprimé avec succès");
              loadContacts();
            } catch (error) {
              Alert.alert("Erreur", "Impossible de supprimer le contact");
            } finally {
              setDeleting(null);
            }
          },
        },
      ]
    );
  };

  const openEditModal = (contact: EmergencyContact) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingContact(contact);
    setForm({
      name: contact.name,
      phone: contact.phone,
      relationship: contact.relationship,
    });
    setModalVisible(true);
  };

  const openAddModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingContact(null);
    setForm({ name: "", phone: "", relationship: "" });
    setModalVisible(true);
  };

  const closeModal = () => {
    Keyboard.dismiss();
    setModalVisible(false);
    setEditingContact(null);
    setForm({ name: "", phone: "", relationship: "" });
  };

  // Composant de contact individuel avec animation
  const ContactCard = ({
    contact,
    index,
  }: {
    contact: EmergencyContact;
    index: number;
  }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const fadeAnimItem = useRef(new Animated.Value(0)).current;
    const translateX = useRef(new Animated.Value(-20)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(fadeAnimItem, {
          toValue: 1,
          duration: 400,
          delay: index * 100,
          useNativeDriver: true,
        }),
        Animated.spring(translateX, {
          toValue: 0,
          friction: 6,
          tension: 40,
          delay: index * 100,
          useNativeDriver: true,
        }),
      ]).start();
    }, []);

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }).start();
    };

    const isDeleting = deleting === contact._id;

    return (
      <Animated.View
        style={[
          styles.contactCardWrapper,
          {
            opacity: fadeAnimItem,
            transform: [{ scale: scaleAnim }, { translateX }],
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.contactCard, { backgroundColor: colors.surface }]}
          onPress={() => openEditModal(contact)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        >
          <LinearGradient
            colors={[colors.error + "10", colors.error + "05"]}
            style={styles.contactIcon}
          >
            <Ionicons name="person" size={24} color={colors.error} />
          </LinearGradient>

          <View style={styles.contactInfo}>
            <Text style={[styles.contactName, { color: colors.text }]}>
              {contact.name}
            </Text>
            <Text
              style={[styles.contactPhone, { color: colors.textSecondary }]}
            >
              {formatPhoneNumber(contact.phone)}
            </Text>
            {contact.relationship && (
              <View style={styles.relationshipBadge}>
                <Ionicons name="heart-outline" size={10} color={colors.error} />
                <Text
                  style={[styles.relationshipText, { color: colors.error }]}
                >
                  {contact.relationship}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.contactActions}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: colors.primary + "10" },
              ]}
              onPress={() => openEditModal(contact)}
            >
              <Ionicons
                name="create-outline"
                size={18}
                color={colors.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: colors.error + "10" },
              ]}
              onPress={() => handleDelete(contact)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color={colors.error} />
              ) : (
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.loadingLogo}
          >
            <Ionicons name="call" size={40} color="#fff" />
          </LinearGradient>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Chargement des contacts...
          </Text>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Header avec gradient */}
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
          <Text style={styles.headerTitle}>Contacts d'urgence</Text>
          <TouchableOpacity
            onPress={openAddModal}
            style={styles.addButton}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={["rgba(255,255,255,0.2)", "rgba(255,255,255,0.1)"]}
              style={styles.addButtonGradient}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        {/* Avertissement */}
        <View
          style={[styles.warningCard, { backgroundColor: colors.error + "10" }]}
        >
          <Ionicons name="warning-outline" size={20} color={colors.error} />
          <Text style={[styles.warningText, { color: colors.error }]}>
            Ces contacts seront prévenus en cas d'alerte SOS.
          </Text>
        </View>

        {/* Liste des contacts */}
        {contacts.length > 0 ? (
          <View style={styles.contactsList}>
            {contacts.map((contact, index) => (
              <ContactCard
                key={contact._id || index}
                contact={contact}
                index={index}
              />
            ))}
          </View>
        ) : (
          <Animated.View
            style={[
              styles.emptyContainer,
              { backgroundColor: colors.surface },
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={[colors.error + "20", colors.error + "10"]}
              style={styles.emptyIcon}
            >
              <Ionicons name="people-outline" size={48} color={colors.error} />
            </LinearGradient>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Aucun contact d'urgence
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Ajoutez des contacts pour être prévenu en cas d'urgence
            </Text>
            <TouchableOpacity
              style={[
                styles.addContactButton,
                { backgroundColor: colors.error },
              ]}
              onPress={openAddModal}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addContactText}>Ajouter un contact</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </Animated.ScrollView>

      {/* Modal d'ajout/modification */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <BlurView
          intensity={90}
          style={styles.modalOverlay}
          tint={effectiveTheme === "dark" ? "dark" : "light"}
        >
          <TouchableWithoutFeedback onPress={closeModal}>
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
                    style={styles.modalIcon}
                  >
                    <Ionicons
                      name="alert-circle"
                      size={24}
                      color={colors.error}
                    />
                  </LinearGradient>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    {editingContact
                      ? "Modifier le contact"
                      : "Ajouter un contact"}
                  </Text>
                  <TouchableOpacity
                    onPress={closeModal}
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
                  placeholder="Nom complet"
                  placeholderTextColor={colors.placeholder}
                  value={form.name}
                  onChangeText={(text) => setForm({ ...form, name: text })}
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
                  placeholder="Numéro de téléphone"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="phone-pad"
                  value={form.phone}
                  onChangeText={(text) => setForm({ ...form, phone: text })}
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
                  placeholder="Relation (ex: Conjoint, Parent, Ami)"
                  placeholderTextColor={colors.placeholder}
                  value={form.relationship}
                  onChangeText={(text) =>
                    setForm({ ...form, relationship: text })
                  }
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[
                      styles.modalBtn,
                      styles.modalBtnCancel,
                      { borderColor: colors.border },
                    ]}
                    onPress={closeModal}
                  >
                    <Text style={{ color: colors.textSecondary }}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalBtn,
                      styles.modalBtnSave,
                      { backgroundColor: colors.error },
                    ]}
                    onPress={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={{ color: "#fff" }}>
                        {editingContact ? "Modifier" : "Ajouter"}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </Animated.View>
          </KeyboardAvoidingView>
        </BlurView>
      </Modal>
    </View>
  );
}

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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
  },
  addButtonGradient: {
    flex: 1,
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
    fontSize: 13,
    fontWeight: "500",
  },
  contactsList: {
    gap: 12,
  },
  contactCardWrapper: {
    marginBottom: 0,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  contactIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 13,
    marginBottom: 4,
  },
  relationshipBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.03)",
  },
  relationshipText: {
    fontSize: 10,
    fontWeight: "500",
  },
  contactActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    padding: 40,
    borderRadius: 24,
    gap: 16,
    marginTop: 40,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  addContactButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 8,
    marginTop: 8,
  },
  addContactText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
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
});
