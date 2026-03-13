import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { useOnboarding } from "../../contexts/OnboardingContext";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const EQUIPMENT_ITEMS = [
  {
    id: "cables",
    label: "Câbles de démarrage",
    icon: "flash",
    category: "Électrique",
    color: "#FF6B6B",
  },
  {
    id: "jack",
    label: "Cric",
    icon: "car",
    category: "Levage",
    color: "#4ECDC4",
  },
  {
    id: "triangle",
    label: "Triangle de signalisation",
    icon: "warning",
    category: "Sécurité",
    color: "#45B7D1",
  },
  {
    id: "vest",
    label: "Gilet de sécurité",
    icon: "shirt",
    category: "Sécurité",
    color: "#96CEB4",
  },
  {
    id: "tire_iron",
    label: "Clé à roue",
    icon: "construct",
    category: "Outillage",
    color: "#FFEAA7",
  },
  {
    id: "compressor",
    label: "Compresseur",
    icon: "airplane",
    category: "Pneumatique",
    color: "#DDA0DD",
  },
  {
    id: "battery_booster",
    label: "Booster batterie",
    icon: "battery-charging",
    category: "Électrique",
    color: "#6C5B7B",
  },
  {
    id: "tow_rope",
    label: "Câble de remorquage",
    icon: "git-network",
    category: "Remorquage",
    color: "#F08A5D",
  },
];

export default function EquipmentScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { data, updateEquipment } = useOnboarding();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["64%", "80%"],
  });

  const toggleEquipment = (itemId: string) => {
    const newEquipment = data.equipment.includes(itemId)
      ? data.equipment.filter((id) => id !== itemId)
      : [...data.equipment, itemId];
    updateEquipment(newEquipment);
  };

  const selectedCount = data.equipment.length;
  const progress = selectedCount / EQUIPMENT_ITEMS.length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Étape 5/6</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Barre de progression */}
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBar,
              { backgroundColor: "rgba(255,255,255,0.2)" },
            ]}
          >
            <Animated.View
              style={[
                styles.progressFill,
                { backgroundColor: "#fff", width: progressWidth },
              ]}
            />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Titre */}
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: colors.text }]}>
              Votre équipement
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Sélectionnez le matériel dont vous disposez
            </Text>
          </View>

          {/* Carte résumé */}
          <LinearGradient
            colors={[colors.primary + "10", colors.secondary + "05"]}
            style={styles.summaryCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.primary }]}>
                  {selectedCount}
                </Text>
                <Text
                  style={[styles.summaryLabel, { color: colors.textSecondary }]}
                >
                  équipements
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {EQUIPMENT_ITEMS.length}
                </Text>
                <Text
                  style={[styles.summaryLabel, { color: colors.textSecondary }]}
                >
                  au total
                </Text>
              </View>
            </View>

            {/* Mini barre de progression */}
            <View style={styles.progressMiniContainer}>
              <View
                style={[
                  styles.progressMiniBar,
                  { backgroundColor: colors.border },
                ]}
              >
                <View
                  style={[
                    styles.progressMiniFill,
                    {
                      backgroundColor: colors.primary,
                      width: `${progress * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>
          </LinearGradient>

          {/* Grille d'équipement */}
          <View style={styles.equipmentGrid}>
            {EQUIPMENT_ITEMS.map((item, index) => {
              const isSelected = data.equipment.includes(item.id);
              const translateY = slideAnim.interpolate({
                inputRange: [0, 30],
                outputRange: [0, 10 * (index + 1)],
              });
              const scaleAnim = useRef(new Animated.Value(1)).current;

              const handlePress = () => {
                Animated.sequence([
                  Animated.spring(scaleAnim, {
                    toValue: 0.95,
                    friction: 3,
                    useNativeDriver: true,
                  }),
                  Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 3,
                    useNativeDriver: true,
                  }),
                ]).start();
                toggleEquipment(item.id);
              };

              return (
                <Animated.View
                  key={item.id}
                  style={[
                    styles.equipmentWrapper,
                    {
                      opacity: fadeAnim,
                      transform: [{ scale: scaleAnim }, { translateY }],
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.equipmentCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: isSelected ? item.color : colors.border,
                      },
                    ]}
                    onPress={handlePress}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.equipmentIconContainer,
                        {
                          backgroundColor: isSelected
                            ? item.color + "15"
                            : "transparent",
                        },
                      ]}
                    >
                      <Ionicons
                        name={item.icon}
                        size={28}
                        color={isSelected ? item.color : colors.textSecondary}
                      />
                    </View>

                    <View style={styles.equipmentInfo}>
                      <Text
                        style={[
                          styles.equipmentLabel,
                          { color: isSelected ? item.color : colors.text },
                        ]}
                        numberOfLines={1}
                      >
                        {item.label}
                      </Text>
                      <Text
                        style={[
                          styles.equipmentCategory,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {item.category}
                      </Text>
                    </View>

                    {isSelected ? (
                      <View
                        style={[
                          styles.selectedBadge,
                          { backgroundColor: item.color },
                        ]}
                      >
                        <Ionicons name="checkmark" size={14} color="#fff" />
                      </View>
                    ) : (
                      <Ionicons
                        name="add-circle-outline"
                        size={24}
                        color={colors.textSecondary}
                      />
                    )}
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>

          {/* Note */}
          <View style={styles.noteContainer}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={[styles.noteText, { color: colors.textSecondary }]}>
              Vous pourrez modifier votre équipement plus tard
            </Text>
          </View>

          {/* Espace pour le bouton */}
          <View style={styles.bottomSpace} />
        </Animated.View>
      </ScrollView>

      {/* Footer avec bouton */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => router.push("/(onboarding)/documents")}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.nextButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.nextButtonText}>Continuer</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 15,
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
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  headerRight: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: 20,
  },
  progressBar: {
    height: 4,
    width: "100%",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  titleContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: "center",
    flex: 1,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 13,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  progressMiniContainer: {
    marginTop: 8,
  },
  progressMiniBar: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressMiniFill: {
    height: "100%",
    borderRadius: 2,
  },
  equipmentGrid: {
    gap: 10,
    marginBottom: 16,
  },
  equipmentWrapper: {
    width: "100%",
  },
  equipmentCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  equipmentIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  equipmentInfo: {
    flex: 1,
  },
  equipmentLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  equipmentCategory: {
    fontSize: 12,
  },
  selectedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  noteContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
  },
  noteText: {
    fontSize: 12,
  },
  bottomSpace: {
    height: 30,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  nextButton: {
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  nextButtonGradient: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
