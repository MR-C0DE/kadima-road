// components/settings/NotificationsSection.tsx
import React, { useState } from "react";
import { View, Text, StyleSheet, Switch, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SettingsSection from "./SettingsSection";
import { useTheme } from "../../contexts/ThemeContext";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface NotificationsSectionProps {
  settings: any;
  onSaveSettings: (newSettings: any) => void;
}

export default function NotificationsSection({
  settings,
  onSaveSettings,
}: NotificationsSectionProps) {
  const { effectiveTheme } = useTheme();
  const colorScheme = useColorScheme();
  const colors = Colors[effectiveTheme ?? "light"];

  const [expanded, setExpanded] = useState(false);
  const [notifications, setNotifications] = useState({
    push: settings?.notifications?.push ?? true,
    email: settings?.notifications?.email ?? true,
    sms: settings?.notifications?.sms ?? true,
  });

  const toggleNotification = (
    type: "push" | "email" | "sms",
    value: boolean
  ) => {
    const newNotifications = { ...notifications, [type]: value };
    setNotifications(newNotifications);
    onSaveSettings({ ...settings, notifications: newNotifications });
  };

  const subCategories = [
    { id: "sos", label: "Alertes SOS", icon: "alert-circle" },
    { id: "intervention", label: "Mise à jour intervention", icon: "car" },
    { id: "helper", label: "Helper en route", icon: "navigate" },
    { id: "promo", label: "Offres et actualités", icon: "gift" },
  ];

  return (
    <SettingsSection title="Notifications" icon="notifications-outline">
      {/* Push notifications */}
      <View style={styles.settingRow}>
        <View style={styles.settingLeft}>
          <Ionicons
            name="phone-portrait-outline"
            size={20}
            color={colors.primary}
          />
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            Notifications push
          </Text>
        </View>
        <Switch
          value={notifications.push}
          onValueChange={(value) => toggleNotification("push", value)}
          trackColor={{ false: colors.border, true: colors.primary }}
        />
      </View>

      {/* Email notifications */}
      <View style={styles.settingRow}>
        <View style={styles.settingLeft}>
          <Ionicons name="mail-outline" size={20} color={colors.primary} />
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            Notifications email
          </Text>
        </View>
        <Switch
          value={notifications.email}
          onValueChange={(value) => toggleNotification("email", value)}
          trackColor={{ false: colors.border, true: colors.primary }}
        />
      </View>

      {/* SMS notifications */}
      <View style={[styles.settingRow, styles.lastRow]}>
        <View style={styles.settingLeft}>
          <Ionicons
            name="chatbubble-outline"
            size={20}
            color={colors.primary}
          />
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            Notifications SMS
          </Text>
        </View>
        <Switch
          value={notifications.sms}
          onValueChange={(value) => toggleNotification("sms", value)}
          trackColor={{ false: colors.border, true: colors.primary }}
        />
      </View>

      {/* Section dépliante pour sous-catégories */}
      {notifications.push && (
        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => setExpanded(!expanded)}
        >
          <Text style={[styles.expandText, { color: colors.textSecondary }]}>
            {expanded ? "Masquer les détails" : "Détail des notifications push"}
          </Text>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={16}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      )}

      {expanded && notifications.push && (
        <View style={styles.subCategories}>
          {subCategories.map((cat) => (
            <View key={cat.id} style={styles.subCategoryRow}>
              <View style={styles.settingLeft}>
                <Ionicons
                  name={cat.icon}
                  size={18}
                  color={colors.textSecondary}
                />
                <Text
                  style={[
                    styles.subCategoryLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  {cat.label}
                </Text>
              </View>
              <Switch
                value={true}
                onValueChange={() => {}}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
          ))}
        </View>
      )}
    </SettingsSection>
  );
}

const styles = StyleSheet.create({
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  expandButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    marginTop: 8,
  },
  expandText: {
    fontSize: 13,
  },
  subCategories: {
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 16,
    backgroundColor: "rgba(0,0,0,0.02)",
    borderRadius: 12,
  },
  subCategoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  subCategoryLabel: {
    fontSize: 14,
  },
});
