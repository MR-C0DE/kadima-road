// helpers/components/missions/details/MissionActions.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { STATUS_CONFIG } from "./types";
import { SafetyChecklistModal } from "./SafetyChecklistModal";

interface MissionActionsProps {
  status: string;
  nextStatuses: string[];
  isActive: boolean;
  colors: any;
  colorScheme: string | null;
  missionType?: string;
  onStatusUpdate: (status: string) => void;
  onCancelPress: () => void;
}

export const MissionActions = ({
  status,
  nextStatuses,
  isActive,
  colors,
  colorScheme,
  missionType,
  onStatusUpdate,
  onCancelPress,
}: MissionActionsProps) => {
  const [showSafetyChecklist, setShowSafetyChecklist] = useState(false);

  if (!isActive) return null;

  const normalActions = nextStatuses.filter((s) => s !== "cancelled");
  const hasCancel = nextStatuses.includes("cancelled");

  const getActionIcon = (action: string): keyof typeof Ionicons.glyphMap => {
    const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
      en_route: "car",
      arrived: "location",
      in_progress: "construct",
      completed: "checkmark-circle",
    };
    return icons[action] || "arrow-forward";
  };

  const getActionLabel = (action: string) => {
    const config = STATUS_CONFIG[action];
    return config?.label || action;
  };

  const getActionColor = (action: string) => {
    if (action === "completed") return "#22C55E";
    if (action === "en_route") return "#3B82F6";
    if (action === "arrived") return "#F59E0B";
    if (action === "in_progress") return "#8B5CF6";
    return "#6B7280";
  };

  const getActionDescription = (action: string) => {
    const descriptions: Record<string, string> = {
      en_route: "Partir vers le client",
      arrived: "Vous êtes sur place",
      in_progress: "Commencer l'intervention",
      completed: "Terminer la mission",
    };
    return descriptions[action] || "";
  };

  const handleActionPress = (action: string) => {
    if (action === "en_route") {
      // ✅ Ouvrir la checklist de sécurité
      setShowSafetyChecklist(true);
    } else {
      // Pour les autres actions, appel direct
      onStatusUpdate(action);
    }
  };

  const handleSafetyChecklistConfirm = () => {
    setShowSafetyChecklist(false);
    onStatusUpdate("en_route");
  };

  return (
    <>
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.textSecondary }]}>
          Mettre à jour
        </Text>

        <View style={styles.grid}>
          {normalActions.map((action) => {
            const actionColor = getActionColor(action);
            const isEnRoute = action === "en_route";
            return (
              <TouchableOpacity
                key={action}
                style={[
                  styles.card,
                  styles.actionCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: actionColor + "40",
                  },
                ]}
                onPress={() => handleActionPress(action)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[actionColor, actionColor + "CC"]}
                  style={styles.cardIcon}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons
                    name={getActionIcon(action)}
                    size={28}
                    color="#fff"
                  />
                </LinearGradient>
                <View style={styles.cardTextContainer}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {getActionLabel(action)}
                  </Text>
                  <Text
                    style={[
                      styles.cardSubtitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {getActionDescription(action)}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {hasCancel && (
          <TouchableOpacity
            style={[styles.cancelCard, { backgroundColor: colors.card }]}
            onPress={onCancelPress}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={["#EF444410", "#EF444405"]}
              style={styles.cancelIcon}
            >
              <Ionicons name="close" size={24} color="#EF4444" />
            </LinearGradient>
            <View style={styles.cancelTextContainer}>
              <Text style={[styles.cancelTitle, { color: "#EF4444" }]}>
                Annuler la mission
              </Text>
              <Text
                style={[styles.cancelSubtitle, { color: colors.textSecondary }]}
              >
                Cette action est irréversible
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Modal de checklist de sécurité avec bouton "En route" intégré */}
      <SafetyChecklistModal
        visible={showSafetyChecklist}
        onClose={() => setShowSafetyChecklist(false)}
        onConfirm={handleSafetyChecklistConfirm}
        colors={colors}
        colorScheme={colorScheme}
        missionType={missionType}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 16,
  },
  title: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    flex: 1,
    minWidth: "45%",
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 20,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionCard: {
    borderWidth: 1.5,
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 11,
  },
  cancelCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  cancelIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelTextContainer: {
    flex: 1,
  },
  cancelTitle: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 2,
  },
  cancelSubtitle: {
    fontSize: 11,
  },
});
