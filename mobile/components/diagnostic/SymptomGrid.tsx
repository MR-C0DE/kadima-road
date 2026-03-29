// components/diagnostic/SymptomGrid.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

interface Symptom {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  description: string;
}

const SYMPTOMS: Symptom[] = [
  {
    id: "battery",
    label: "Batterie",
    icon: "battery-dead",
    color: "#EF4444",
    description: "Ne démarre pas",
  },
  {
    id: "tire",
    label: "Pneu",
    icon: "car-sport",
    color: "#F59E0B",
    description: "Crevé, vibre",
  },
  {
    id: "engine",
    label: "Moteur",
    icon: "cog",
    color: "#EF4444",
    description: "Bruit, fumée",
  },
  {
    id: "warning",
    label: "Voyant",
    icon: "warning",
    color: "#F59E0B",
    description: "Voyant allumé",
  },
  {
    id: "noise",
    label: "Bruit",
    icon: "volume-high",
    color: "#8B5CF6",
    description: "Cliquetis",
  },
  {
    id: "overheat",
    label: "Surchauffe",
    icon: "thermometer",
    color: "#EF4444",
    description: "Température",
  },
];

interface SymptomGridProps {
  onSelect: (symptom: Symptom) => void;
  colors: any;
}

export default function SymptomGrid({ onSelect, colors }: SymptomGridProps) {
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>
        Choisissez un symptôme
      </Text>
      <View style={styles.grid}>
        {SYMPTOMS.map((symptom) => (
          <TouchableOpacity
            key={symptom.id}
            style={[styles.symptomCard, { backgroundColor: colors.surface }]}
            onPress={() => onSelect(symptom)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[symptom.color + "20", symptom.color + "10"]}
              style={styles.iconContainer}
            >
              <Ionicons name={symptom.icon} size={32} color={symptom.color} />
            </LinearGradient>
            <Text style={[styles.symptomLabel, { color: colors.text }]}>
              {symptom.label}
            </Text>
            <Text
              style={[styles.symptomDesc, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {symptom.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: 16,
  },
  symptomCard: {
    width: (width - 52) / 3,
    alignItems: "center",
    padding: 12,
    borderRadius: 20,
    gap: 8,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  symptomLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  symptomDesc: {
    fontSize: 10,
    textAlign: "center",
  },
});
