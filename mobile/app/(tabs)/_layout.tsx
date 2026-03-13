import { Tabs } from "expo-router";
import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { View, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function TabLayout() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <Tabs
      screenOptions={({ route }) => ({
        // HEADER COMPLÈTEMENT DÉSACTIVÉ
        headerShown: false,

        // Configuration de la tab bar
        tabBarActiveTintColor: colors.tabIconSelected,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: Platform.OS === "ios" ? 85 : 65,
          paddingBottom: Platform.OS === "ios" ? 30 : 10,
          paddingTop: 10,
        },
        tabBarLabel: () => null,
        tabBarIconStyle: {
          marginTop: 5,
        },
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, size }) => (
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="home" size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="diagnostic"
        options={{
          tabBarIcon: ({ color, size }) => (
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="medkit" size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="helpers"
        options={{
          title: "Helpers",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, size }) => (
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="person" size={size} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
