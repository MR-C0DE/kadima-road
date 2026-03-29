// helpers/components/missions/MissionTabs.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";

const { width } = Dimensions.get("window");

interface MissionTabsProps {
  activeTab: "available" | "current" | "history";
  onTabChange: (tab: "available" | "current" | "history") => void;
  availableCount: number;
  currentCount: number;
  colors: any;
  tabIndicatorPosition: Animated.AnimatedInterpolation<string | number>;
}

export const MissionTabs = ({
  activeTab,
  onTabChange,
  availableCount,
  currentCount,
  colors,
  tabIndicatorPosition,
}: MissionTabsProps) => {
  return (
    <View style={[styles.tabContainer, { backgroundColor: colors.card }]}>
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => onTabChange("available")}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.tabText,
            {
              color:
                activeTab === "available"
                  ? colors.primary
                  : colors.textSecondary,
            },
          ]}
        >
          Disponibles
        </Text>
        {availableCount > 0 && activeTab === "available" && (
          <View style={[styles.tabBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.tabBadgeText}>{availableCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => onTabChange("current")}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.tabText,
            {
              color:
                activeTab === "current" ? colors.primary : colors.textSecondary,
            },
          ]}
        >
          En cours
        </Text>
        {currentCount > 0 && (
          <View style={[styles.tabBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.tabBadgeText}>{currentCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => onTabChange("history")}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.tabText,
            {
              color:
                activeTab === "history" ? colors.primary : colors.textSecondary,
            },
          ]}
        >
          Historique
        </Text>
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.tabIndicator,
          {
            backgroundColor: colors.primary,
            transform: [{ translateX: tabIndicatorPosition }],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 16,
    padding: 4,
    borderRadius: 16,
    position: "relative",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  tabText: { fontSize: 13, fontWeight: "500" },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
  },
  tabBadgeText: { color: "#fff", fontSize: 10, fontWeight: "600" },
  tabIndicator: {
    position: "absolute",
    bottom: 4,
    left: 4,
    width: (width - 40) / 3 - 8,
    height: 32,
    borderRadius: 12,
    zIndex: -1,
  },
});
