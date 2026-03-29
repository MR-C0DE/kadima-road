// helpers/components/NetworkAlert.tsx
import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNetwork } from "../contexts/NetworkContext";
import { useTheme } from "../contexts/ThemeContext";
import { Colors } from "@/constants/theme";

export const NetworkAlert = () => {
  const { status, isOffline, checkConnection } = useNetwork();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme ?? "light"];

  const slideAnim = useRef(new Animated.Value(-100)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOffline) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOffline]);

  if (!isOffline) return null;

  const getErrorMessage = () => {
    if (!status.isConnected) {
      return "Aucune connexion internet";
    }
    if (!status.isInternetReachable) {
      return "Connexion internet instable";
    }
    if (!status.isApiReachable) {
      return "Serveur indisponible";
    }
    if (!status.isSocketConnected) {
      return "Connexion temps réel perdue";
    }
    return "Problème de connexion";
  };

  const getIcon = () => {
    if (!status.isConnected) return "wifi-outline";
    if (!status.isInternetReachable) return "wifi-outline";
    if (!status.isApiReachable) return "server-outline";
    if (!status.isSocketConnected) return "radio-outline";
    return "alert-circle-outline";
  };

  const getSubMessage = () => {
    if (!status.isConnected) {
      return "Vérifiez votre connexion Wi-Fi ou données mobiles";
    }
    if (!status.isInternetReachable) {
      return "La connexion est établie mais internet est inaccessible";
    }
    if (!status.isApiReachable) {
      return "Nos serveurs sont momentanément indisponibles";
    }
    if (!status.isSocketConnected) {
      return "Reconnexion en cours aux services temps réel...";
    }
    return "Veuillez vérifier votre connexion et réessayer";
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim,
        },
      ]}
    >
      <LinearGradient
        colors={[colors.error, colors.error + "CC"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name={getIcon()} size={22} color="#fff" />
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.title}>Connexion perdue</Text>
            <Text style={styles.message}>{getErrorMessage()}</Text>
            <Text style={styles.subMessage}>{getSubMessage()}</Text>
          </View>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={checkConnection}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["rgba(255,255,255,0.2)", "rgba(255,255,255,0.1)"]}
              style={styles.retryGradient}
            >
              <Ionicons name="refresh-outline" size={18} color="#fff" />
              <Text style={styles.retryText}>Réessayer</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {status.reconnectAttempts > 0 && (
          <View style={styles.reconnectIndicator}>
            <Text style={styles.reconnectText}>
              Tentative de reconnexion {status.reconnectAttempts}/10
            </Text>
            <View style={styles.reconnectProgress}>
              <View
                style={[
                  styles.reconnectProgressFill,
                  {
                    width: `${(status.reconnectAttempts / 10) * 100}%`,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
            </View>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  gradient: {
    paddingTop: Platform.OS === "ios" ? 50 : 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  message: {
    color: "#fff",
    fontSize: 13,
    opacity: 0.95,
    marginBottom: 2,
  },
  subMessage: {
    color: "#fff",
    fontSize: 11,
    opacity: 0.8,
  },
  retryButton: {
    borderRadius: 30,
    overflow: "hidden",
  },
  retryGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  reconnectIndicator: {
    marginTop: 12,
    gap: 6,
  },
  reconnectText: {
    color: "#fff",
    fontSize: 11,
    textAlign: "center",
    opacity: 0.9,
  },
  reconnectProgress: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    overflow: "hidden",
  },
  reconnectProgressFill: {
    height: "100%",
    borderRadius: 2,
  },
});
