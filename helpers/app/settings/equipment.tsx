// helpers/app/settings/equipment.tsx
// Écran de l'équipement - Matériel disponible du helper

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
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../config/api";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";

// ============================================
// ÉQUIPEMENT DISPONIBLE
// ============================================

const AVAILABLE_EQUIPMENT = [
  {
    id: "cables",
    label: "Câbles de démarrage",
    icon: "flash",
    description: "Câbles pour démarrage assisté",
    category: "Électrique",
    color: "#EF4444",
  },
  {
    id: "jack",
    label: "Cric",
    icon: "car",
    description: "Cric pour changement de roue",
    category: "Levage",
    color: "#F59E0B",
  },
  {
    id: "triangle",
    label: "Triangle de signalisation",
    icon: "warning",
    description: "Triangle de sécurité",
    category: "Sécurité",
    color: "#3B82F6",
  },
  {
    id: "vest",
    label: "Gilet de sécurité",
    icon: "shirt",
    description: "Gilet haute visibilité",
    category: "Sécurité",
    color: "#8B5CF6",
  },
  {
    id: "tire_iron",
    label: "Clé à roue",
    icon: "construct",
    description: "Clé pour dévisser les écrous",
    category: "Outillage",
    color: "#EC4899",
  },
  {
    id: "compressor",
    label: "Compresseur",
    icon: "airplane",
    description: "Compresseur portable",
    category: "Pneumatique",
    color: "#06B6D4",
  },
  {
    id: "battery_booster",
    label: "Booster batterie",
    icon: "battery-charging",
    description: "Démarreur portable",
    category: "Électrique",
    color: "#10B981",
  },
  {
    id: "tow_rope",
    label: "Câble de remorquage",
    icon: "git-network",
    description: "Câble pour remorquage",
    category: "Remorquage",
    color: "#F97316",
  },
  {
    id: "flashlight",
    label: "Lampe torche",
    icon: "flashlight",
    description: "Éclairage pour intervention de nuit",
    category: "Éclairage",
    color: "#A855F7",
  },
  {
    id: "first_aid",
    label: "Trousse de secours",
    icon: "medkit",
    description: "Premiers secours",
    category: "Sécurité",
    color: "#EF4444",
  },
  {
    id: "multitool",
    label: "Multi-outils",
    icon: "build",
    description: "Outil multifonction",
    category: "Outillage",
    color: "#6B7280",
  },
  {
    id: "gloves",
    label: "Gants de protection",
    icon: "hand-left",
    description: "Gants pour intervention",
    category: "Protection",
    color: "#9CA3AF",
  },
];

// Catégories pour les sections
const CATEGORIES = [
  { id: "Électrique", icon: "flash", color: "#EF4444" },
  { id: "Sécurité", icon: "shield", color: "#3B82F6" },
  { id: "Outillage", icon: "construct", color: "#F59E0B" },
  { id: "Levage", icon: "car", color: "#10B981" },
  { id: "Pneumatique", icon: "airplane", color: "#06B6D4" },
  { id: "Remorquage", icon: "git-network", color: "#F97316" },
  { id: "Éclairage", icon: "flashlight", color: "#A855F7" },
  { id: "Protection", icon: "hand-left", color: "#9CA3AF" },
];

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function EquipmentSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme ?? "light"];

  // États
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadEquipment();
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

    // Initialiser toutes les catégories comme dépliées
    const initialExpanded: Record<string, boolean> = {};
    CATEGORIES.forEach((cat) => {
      initialExpanded[cat.id] = true;
    });
    setExpandedCategories(initialExpanded);
  }, []);

  // ============================================
  // CHARGEMENT DE L'ÉQUIPEMENT
  // ============================================

  const loadEquipment = async () => {
    try {
      const response = await api.get("/helpers/profile/me");
      const profile = response.data.data;

      const equipment = profile.equipment || [];
      const equipmentNames = equipment
        .filter((e: any) => e.has)
        .map((e: any) => e.name);

      setSelectedEquipment(equipmentNames);
    } catch (error) {
      console.error("Erreur chargement équipement:", error);
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Impossible de charger votre équipement",
        position: "bottom",
      });
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // SAUVEGARDE EN TEMPS RÉEL
  // ============================================

  const saveEquipment = async (newEquipment: string[]) => {
    if (saving) return;
    setSaving(true);

    try {
      const equipmentList = newEquipment.map((name) => ({
        name,
        has: true,
        lastChecked: new Date().toISOString(),
      }));

      await api.put("/helpers/profile/me", {
        equipment: equipmentList,
      });

      Toast.show({
        type: "success",
        text1: "Équipement mis à jour",
        text2: `${newEquipment.length} élément${
          newEquipment.length !== 1 ? "s" : ""
        } sélectionné${newEquipment.length !== 1 ? "s" : ""}`,
        position: "bottom",
        visibilityTime: 1500,
      });
    } catch (error: any) {
      console.error("Erreur sauvegarde équipement:", error);
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: error.response?.data?.message || "Impossible de sauvegarder",
        position: "bottom",
      });
      await loadEquipment();
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // GESTION DE L'ÉQUIPEMENT
  // ============================================

  const toggleEquipment = async (equipmentId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    let newEquipment: string[];
    if (selectedEquipment.includes(equipmentId)) {
      newEquipment = selectedEquipment.filter((id) => id !== equipmentId);
    } else {
      newEquipment = [...selectedEquipment, equipmentId];
    }

    setSelectedEquipment(newEquipment);
    await saveEquipment(newEquipment);
  };

  const toggleCategory = (categoryId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  // ============================================
  // RENDU PAR CATÉGORIE
  // ============================================

  const getEquipmentByCategory = (category: string) => {
    return AVAILABLE_EQUIPMENT.filter((eq) => eq.category === category);
  };

  const getCategoryCount = (category: string) => {
    const equipment = getEquipmentByCategory(category);
    const selected = equipment.filter((eq) =>
      selectedEquipment.includes(eq.id)
    ).length;
    return `${selected}/${equipment.length}`;
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
            <Ionicons name="build" size={40} color="#fff" />
          </LinearGradient>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Chargement...
          </Text>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  const totalSelected = selectedEquipment.length;
  const totalAvailable = AVAILABLE_EQUIPMENT.length;

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
          <Text style={styles.headerTitle}>Équipement</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        {/* En-tête avec compteur */}
        <View style={styles.counterContainer}>
          <LinearGradient
            colors={[colors.primary + "20", colors.secondary + "10"]}
            style={styles.counterBadge}
          >
            <Ionicons name="build" size={12} color={colors.primary} />
            <Text style={[styles.counterText, { color: colors.primary }]}>
              {totalSelected} / {totalAvailable} équipements
            </Text>
          </LinearGradient>
        </View>

        {/* Barre de progression */}
        <View style={styles.progressContainer}>
          <View
            style={[styles.progressBar, { backgroundColor: colors.border }]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.success,
                  width: `${(totalSelected / totalAvailable) * 100}%`,
                },
              ]}
            />
          </View>
        </View>

        {/* Liste par catégories */}
        {CATEGORIES.map((category, categoryIndex) => {
          const equipmentItems = getEquipmentByCategory(category.id);
          if (equipmentItems.length === 0) return null;

          const isExpanded = expandedCategories[category.id];
          const categorySelectedCount = equipmentItems.filter((eq) =>
            selectedEquipment.includes(eq.id)
          ).length;

          return (
            <View key={category.id} style={styles.categorySection}>
              <TouchableOpacity
                style={[
                  styles.categoryHeader,
                  { backgroundColor: colors.surface },
                ]}
                onPress={() => toggleCategory(category.id)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[category.color + "20", category.color + "10"]}
                  style={styles.categoryIcon}
                >
                  <Ionicons
                    name={category.icon}
                    size={20}
                    color={category.color}
                  />
                </LinearGradient>
                <Text style={[styles.categoryTitle, { color: colors.text }]}>
                  {category.id}
                </Text>
                <View style={styles.categoryRight}>
                  <View
                    style={[
                      styles.categoryCount,
                      { backgroundColor: colors.primary + "10" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryCountText,
                        { color: colors.primary },
                      ]}
                    >
                      {categorySelectedCount}/{equipmentItems.length}
                    </Text>
                  </View>
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={colors.textSecondary}
                  />
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.equipmentList}>
                  {equipmentItems.map((item, index) => {
                    const isSelected = selectedEquipment.includes(item.id);
                    const translateX = new Animated.Value(-20);

                    Animated.spring(translateX, {
                      toValue: 0,
                      friction: 6,
                      tension: 40,
                      delay: index * 50,
                      useNativeDriver: true,
                    }).start();

                    return (
                      <Animated.View
                        key={item.id}
                        style={[
                          styles.equipmentCard,
                          {
                            backgroundColor: colors.surface,
                            borderColor: isSelected
                              ? item.color
                              : colors.border,
                            transform: [{ translateX }],
                          },
                        ]}
                      >
                        <TouchableOpacity
                          style={styles.equipmentContent}
                          onPress={() => toggleEquipment(item.id)}
                          activeOpacity={0.7}
                          disabled={saving}
                        >
                          <View
                            style={[
                              styles.equipmentIcon,
                              {
                                backgroundColor: isSelected
                                  ? item.color + "20"
                                  : colors.background,
                              },
                            ]}
                          >
                            <Ionicons
                              name={item.icon}
                              size={24}
                              color={
                                isSelected ? item.color : colors.textSecondary
                              }
                            />
                          </View>

                          <View style={styles.equipmentInfo}>
                            <Text
                              style={[
                                styles.equipmentLabel,
                                {
                                  color: isSelected ? item.color : colors.text,
                                  fontWeight: isSelected ? "600" : "500",
                                },
                              ]}
                            >
                              {item.label}
                            </Text>
                            <Text
                              style={[
                                styles.equipmentDescription,
                                { color: colors.textSecondary },
                              ]}
                            >
                              {item.description}
                            </Text>
                          </View>

                          {isSelected && (
                            <View
                              style={[
                                styles.selectedBadge,
                                { backgroundColor: item.color },
                              ]}
                            >
                              <Ionicons
                                name="checkmark"
                                size={16}
                                color="#fff"
                              />
                            </View>
                          )}
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}

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
                À propos de l'équipement
              </Text>
              <Text style={[styles.noteText, { color: colors.textSecondary }]}>
                L'équipement que vous sélectionnez sera visible par les
                conducteurs. Plus vous avez d'équipement, plus vous êtes mis en
                avant.
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Indicateur de sauvegarde */}
        {saving && (
          <View style={styles.savingIndicator}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.savingText, { color: colors.textSecondary }]}>
              Sauvegarde...
            </Text>
          </View>
        )}

        <View style={styles.bottomSpace} />
      </Animated.ScrollView>

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
  counterContainer: {
    alignItems: "flex-end",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  counterBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  counterText: {
    fontSize: 12,
    fontWeight: "500",
  },
  progressContainer: {
    marginBottom: 20,
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
  categorySection: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 20,
    marginBottom: 8,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  categoryRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  categoryCount: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryCountText: {
    fontSize: 11,
    fontWeight: "500",
  },
  equipmentList: {
    gap: 10,
    marginLeft: 12,
  },
  equipmentCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  equipmentContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  equipmentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  equipmentInfo: {
    flex: 1,
  },
  equipmentLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  equipmentDescription: {
    fontSize: 11,
  },
  selectedBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
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
  savingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  savingText: {
    fontSize: 12,
  },
  bottomSpace: {
    height: 20,
  },
});
