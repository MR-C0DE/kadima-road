// components/settings/PrivacySection.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import SettingsSection from "./SettingsSection";
import { useTheme } from "../../contexts/ThemeContext";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { api } from "../../config/api";
import Toast from "react-native-toast-message";
import * as Haptics from "expo-haptics";

interface PrivacySectionProps {
  settings: any;
  onSaveSettings: (newSettings: any) => void;
}

const LOCATION_OPTIONS = [
  { id: "always", label: "Toujours" },
  { id: "sos_only", label: "Uniquement lors d'un SOS" },
  { id: "never", label: "Jamais" },
];

export default function PrivacySection({
  settings,
  onSaveSettings,
}: PrivacySectionProps) {
  const { effectiveTheme } = useTheme();
  const colorScheme = useColorScheme();
  const colors = Colors[effectiveTheme ?? "light"];

  const [shareLocation, setShareLocation] = useState(
    settings?.privacy?.shareLocation ?? true
  );
  const [shareData, setShareData] = useState(
    settings?.privacy?.shareData ?? false
  );
  const [locationMode, setLocationMode] = useState("always");
  const [downloading, setDownloading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleShareLocationChange = (value: boolean) => {
    setShareLocation(value);
    onSaveSettings({
      ...settings,
      privacy: { ...settings.privacy, shareLocation: value },
    });
  };

  const handleShareDataChange = (value: boolean) => {
    setShareData(value);
    onSaveSettings({
      ...settings,
      privacy: { ...settings.privacy, shareData: value },
    });
  };

  const handleLocationModeChange = (mode: string) => {
    setLocationMode(mode);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDownloadData = async () => {
    setDownloading(true);
    try {
      const response = await api.get("/users/export-data");
      const data = response.data.data;
      const jsonString = JSON.stringify(data, null, 2);
      const filePath = `${
        FileSystem.documentDirectory
      }kadima_data_${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(filePath, jsonString);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: "application/json",
          dialogTitle: "Exporter mes données",
        });
      }
      Toast.show({
        type: "success",
        text1: "Succès",
        text2: "Données prêtes à être partagées",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Impossible d'exporter les données",
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleClearHistory = () => {
    Alert.alert(
      "Supprimer l'historique",
      "Voulez-vous vraiment supprimer tout l'historique des interventions ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete("/users/history");
              Toast.show({
                type: "success",
                text1: "Succès",
                text2: "Historique supprimé",
              });
            } catch (error) {
              Toast.show({
                type: "error",
                text1: "Erreur",
                text2: "Impossible de supprimer",
              });
            }
          },
        },
      ]
    );
  };

  return (
    <SettingsSection title="Confidentialité" icon="shield-outline">
      {/* Partager ma position */}
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.menuItemLeft}>
          <Ionicons name="location-outline" size={20} color={colors.primary} />
          <Text style={[styles.menuItemText, { color: colors.text }]}>
            Partager ma position
          </Text>
        </View>
        <View style={styles.menuItemRight}>
          <Text style={[styles.menuItemValue, { color: colors.textSecondary }]}>
            {shareLocation
              ? locationMode === "always"
                ? "Toujours"
                : locationMode === "sos_only"
                ? "SOS uniquement"
                : "Désactivé"
              : "Désactivé"}
          </Text>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={18}
            color={colors.textSecondary}
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandedOptions}>
          {LOCATION_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.id}
              style={[
                styles.radioOption,
                locationMode === opt.id && {
                  backgroundColor: colors.primary + "10",
                },
              ]}
              onPress={() => {
                handleLocationModeChange(opt.id);
                if (opt.id !== "never") handleShareLocationChange(true);
                else handleShareLocationChange(false);
              }}
            >
              <View
                style={[
                  styles.radioCircle,
                  locationMode === opt.id && { borderColor: colors.primary },
                ]}
              >
                {locationMode === opt.id && (
                  <View
                    style={[
                      styles.radioInner,
                      { backgroundColor: colors.primary },
                    ]}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.radioLabel,
                  {
                    color:
                      locationMode === opt.id ? colors.primary : colors.text,
                  },
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Partager mes données */}
      <View style={styles.settingRow}>
        <View style={styles.settingLeft}>
          <Ionicons name="analytics-outline" size={20} color={colors.primary} />
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            Partager mes données d'utilisation
          </Text>
        </View>
        <Switch
          value={shareData}
          onValueChange={handleShareDataChange}
          trackColor={{ false: colors.border, true: colors.primary }}
        />
      </View>

      {/* Télécharger mes données */}
      <TouchableOpacity
        style={styles.menuItem}
        onPress={handleDownloadData}
        disabled={downloading}
      >
        <View style={styles.menuItemLeft}>
          <Ionicons name="download-outline" size={20} color={colors.primary} />
          <Text style={[styles.menuItemText, { color: colors.text }]}>
            Télécharger mes données
          </Text>
        </View>
        {downloading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textSecondary}
          />
        )}
      </TouchableOpacity>

      {/* Supprimer l'historique */}
      <TouchableOpacity
        style={[styles.menuItem, styles.lastItem]}
        onPress={handleClearHistory}
      >
        <View style={styles.menuItemLeft}>
          <Ionicons name="trash-outline" size={20} color={colors.error} />
          <Text style={[styles.menuItemText, { color: colors.error }]}>
            Supprimer l'historique
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.error} />
      </TouchableOpacity>
    </SettingsSection>
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
  lastItem: {
    borderBottomWidth: 0,
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
  menuItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  menuItemValue: {
    fontSize: 14,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
  },
  expandedOptions: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  radioLabel: {
    fontSize: 14,
  },
});
