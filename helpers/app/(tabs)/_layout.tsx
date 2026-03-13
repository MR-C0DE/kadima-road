import { Tabs } from "expo-router";
import React, { useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import { Platform, Animated, StyleSheet, View, Text } from "react-native";
import { BlurView } from "expo-blur";

export default function TabLayout() {
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];

  // Animations
  const tabAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(tabAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const tabBarTranslateY = tabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 0],
  });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          position: "absolute",
          bottom: Platform.OS === "ios" ? 0 : 0,
          left: 20,
          right: 20,
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: Platform.OS === "ios" ? 75 : 65,
          borderRadius: 35,
          transform: [{ translateY: tabBarTranslateY }],
        },
        tabBarBackground: () => (
          <BlurView
            intensity={80}
            tint={effectiveTheme === "dark" ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarItemStyle: {
          paddingVertical: 8,
        },
        tabBarLabel: ({ focused, color, children }) => {
          if (!focused) return null;
          return (
            <Animated.View
              style={[
                styles.tabLabel,
                {
                  backgroundColor: colors.primary + "20",
                },
              ]}
            >
              <Text style={[styles.tabLabelText, { color }]}>{children}</Text>
            </Animated.View>
          );
        },
        tabBarIconStyle: {
          marginTop: Platform.OS === "ios" ? 0 : 5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={focused ? 26 : 24}
                color={color}
              />
              {focused && (
                <View style={[styles.activeDot, { backgroundColor: color }]} />
              )}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="missions"
        options={{
          title: "Missions",
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons
                name={focused ? "car" : "car-outline"}
                size={focused ? 26 : 24}
                color={color}
              />
              {focused && (
                <View style={[styles.activeDot, { backgroundColor: color }]} />
              )}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="gains"
        options={{
          title: "Gains",
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons
                name={focused ? "wallet" : "wallet-outline"}
                size={focused ? 26 : 24}
                color={color}
              />
              {focused && (
                <View style={[styles.activeDot, { backgroundColor: color }]} />
              )}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="planning"
        options={{
          title: "Planning",
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons
                name={focused ? "calendar" : "calendar-outline"}
                size={focused ? 26 : 24}
                color={color}
              />
              {focused && (
                <View style={[styles.activeDot, { backgroundColor: color }]} />
              )}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons
                name={focused ? "person" : "person-outline"}
                size={focused ? 26 : 24}
                color={color}
              />
              {focused && (
                <View style={[styles.activeDot, { backgroundColor: color }]} />
              )}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  activeDot: {
    position: "absolute",
    bottom: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  tabLabel: {
    position: "absolute",
    top: -25,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
    alignSelf: "center",
  },
  tabLabelText: {
    fontSize: 11,
    fontWeight: "500",
  },
});
