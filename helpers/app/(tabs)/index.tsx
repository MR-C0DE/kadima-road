// helpers/app/(tabs)/index.tsx - VERSION COMPLÈTE AVEC EVENTEMITTER
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Dimensions,
  Animated,
  Platform,
  Modal,
  StatusBar,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { useSocket } from "../../contexts/SocketContext";
import { socketEvents } from "../../contexts/SocketContext";
import { api } from "../../config/api";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";
import * as Location from "expo-location";
import { CancelNotificationModal } from "../../components/CancelNotificationModal";

const { width, height } = Dimensions.get("window");

// Types
interface Mission {
  _id: string;
  type: string;
  distance: number;
  reward: number;
  client?: {
    firstName: string;
    lastName: string;
    photo?: string;
    phone?: string;
  };
  user?: {
    firstName: string;
    lastName: string;
    photo?: string;
    phone?: string;
  };
  estimatedTime: string;
  estimatedTimeMinutes: number;
  problem: {
    description: string;
    category: string;
  };
  location: {
    address: string;
    coordinates: [number, number];
  };
  createdAt: string;
  status?: string;
}

interface HelperStats {
  todayEarnings: number;
  todayMissions: number;
  averageRating: number;
  totalMissions: number;
  responseRate: number;
  ranking: number;
  level: string;
  completionRate: number;
}

interface WeatherData {
  temp: number;
  condition: string;
  icon: string;
  city: string;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
}

// Configuration des statuts
const STATUS_CONFIG: Record<
  string,
  {
    color: string;
    bgColor: string;
    icon: string;
    label: string;
  }
> = {
  pending: {
    color: "#FFC107",
    bgColor: "#FFC10720",
    icon: "time",
    label: "En attente",
  },
  accepted: {
    color: "#4CAF50",
    bgColor: "#4CAF5020",
    icon: "checkmark-circle",
    label: "Acceptée",
  },
  en_route: {
    color: "#2196F3",
    bgColor: "#2196F320",
    icon: "car",
    label: "En route",
  },
  arrived: {
    color: "#FF9800",
    bgColor: "#FF980020",
    icon: "location",
    label: "Arrivé",
  },
  in_progress: {
    color: "#9C27B0",
    bgColor: "#9C27B020",
    icon: "construct",
    label: "En cours",
  },
  completed: {
    color: "#4CAF50",
    bgColor: "#4CAF5020",
    icon: "checkmark-done",
    label: "Terminée",
  },
  cancelled: {
    color: "#F44336",
    bgColor: "#F4433620",
    icon: "close-circle",
    label: "Annulée",
  },
};

// Astuces pour les helpers
const HELPER_TIPS = [
  {
    text: "Arrivez toujours avec 5 minutes d'avance pour montrer votre professionnalisme",
    icon: "time",
    color: "#3B82F6",
    category: "Ponctualité",
  },
  {
    text: "Vérifiez votre équipement avant chaque mission : câbles, cric, triangle, gilet",
    icon: "construct",
    color: "#F59E0B",
    category: "Équipement",
  },
  {
    text: "Communiquez clairement l'heure d'arrivée estimée (ETA) au client",
    icon: "chatbubble",
    color: "#22C55E",
    category: "Communication",
  },
  {
    text: "Prenez des photos avant et après l'intervention pour éviter les litiges",
    icon: "camera",
    color: "#8B5CF6",
    category: "Preuve",
  },
  {
    text: "Soyez courtois et professionnel, un sourire fait la différence",
    icon: "heart",
    color: "#EF4444",
    category: "Attitude",
  },
  {
    text: "Si vous êtes en retard, prévenez immédiatement le client",
    icon: "warning",
    color: "#F97316",
    category: "Communication",
  },
];

// Fonctions utilitaires
const getTimeColor = (minutes: number, colors: any): string => {
  if (minutes < 10) return colors.success;
  if (minutes < 20) return colors.warning;
  return colors.error;
};

const getLevelColor = (level: string, colors: any): string => {
  switch (level) {
    case "Expert":
      return "#FFD700";
    case "Confirmé":
      return "#C0C0C0";
    case "Intermédiaire":
      return "#CD7F32";
    default:
      return colors.primary;
  }
};

const getMissionIcon = (category: string): keyof typeof Ionicons.glyphMap => {
  const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
    battery: "battery-dead",
    tire: "car",
    fuel: "water",
    towing: "construct",
    lockout: "key",
    diagnostic: "medkit",
    jumpstart: "flash",
    minor_repair: "build",
  };
  return icons[category] || "help-circle";
};

const getMissionType = (type: string): string => {
  const types: Record<string, string> = {
    battery: "Batterie",
    tire: "Pneu",
    fuel: "Essence",
    towing: "Remorquage",
    lockout: "Clés",
    diagnostic: "Diagnostic",
    jumpstart: "Démarrage",
    minor_repair: "Réparation",
  };
  return types[type] || type;
};

const calculateEstimatedTime = (
  distance: number
): { text: string; minutes: number } => {
  const minutes = Math.max(5, Math.round((distance / 30) * 60));
  if (minutes < 60) {
    return { text: `${minutes} min`, minutes };
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return { text: `${hours} h`, minutes };
  }
  return { text: `${hours} h ${remainingMinutes} min`, minutes };
};

const getClientName = (
  mission: Mission
): { firstName: string; lastName: string } => {
  if (mission.client) {
    return {
      firstName: mission.client.firstName || "Client",
      lastName: mission.client.lastName || "",
    };
  }
  if (mission.user) {
    return {
      firstName: mission.user.firstName || "Client",
      lastName: mission.user.lastName || "",
    };
  }
  return { firstName: "Client", lastName: "" };
};

const getWeatherIcon = (iconCode: string): string => {
  const code = iconCode?.substring(0, 2);
  switch (code) {
    case "01":
      return "sunny";
    case "02":
      return "partly-sunny";
    case "03":
    case "04":
      return "cloudy";
    case "09":
    case "10":
      return "rainy";
    case "11":
      return "thunderstorm";
    case "13":
      return "snow";
    case "50":
      return "fog";
    default:
      return "cloudy";
  }
};

// Composant Météo
const WeatherWidget = ({
  colors,
  weather,
  loading,
}: {
  colors: any;
  weather: WeatherData | null;
  loading: boolean;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (weather) {
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
    }
  }, [weather]);

  if (loading || !weather) {
    return (
      <View style={[styles.weatherSkeleton, { backgroundColor: colors.card }]}>
        <LinearGradient
          colors={[colors.primary + "10", colors.secondary + "05"]}
          style={styles.weatherSkeletonContent}
        >
          <ActivityIndicator size="small" color={colors.primary} />
          <Text
            style={[
              styles.weatherSkeletonText,
              { color: colors.textSecondary },
            ]}
          >
            Chargement météo...
          </Text>
        </LinearGradient>
      </View>
    );
  }

  const weatherIcon = getWeatherIcon(weather.icon);

  return (
    <Animated.View
      style={[
        styles.weatherContainer,
        {
          backgroundColor: colors.card,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={[colors.primary + "10", colors.secondary + "05"]}
        style={styles.weatherGradient}
      >
        <View style={styles.weatherMain}>
          <View style={styles.weatherTempContainer}>
            <Text style={[styles.weatherTemp, { color: colors.text }]}>
              {Math.round(weather.temp)}°
            </Text>
            <Text
              style={[styles.weatherCondition, { color: colors.textSecondary }]}
            >
              {weather.condition}
            </Text>
          </View>
          <View style={styles.weatherIconContainer}>
            <LinearGradient
              colors={[colors.primary + "20", colors.secondary + "10"]}
              style={styles.weatherIconBg}
            >
              <Ionicons
                name={weatherIcon as any}
                size={40}
                color={colors.primary}
              />
            </LinearGradient>
          </View>
        </View>

        <View style={styles.weatherDetails}>
          <View style={styles.weatherDetail}>
            <Ionicons
              name="location-outline"
              size={14}
              color={colors.primary}
            />
            <Text
              style={[
                styles.weatherDetailText,
                { color: colors.textSecondary },
              ]}
              numberOfLines={1}
            >
              {weather.city}
            </Text>
          </View>
          <View style={styles.weatherDetail}>
            <Ionicons
              name="thermometer-outline"
              size={14}
              color={colors.primary}
            />
            <Text
              style={[
                styles.weatherDetailText,
                { color: colors.textSecondary },
              ]}
            >
              Ressenti {Math.round(weather.feelsLike)}°
            </Text>
          </View>
          <View style={styles.weatherDetail}>
            <Ionicons name="water-outline" size={14} color={colors.primary} />
            <Text
              style={[
                styles.weatherDetailText,
                { color: colors.textSecondary },
              ]}
            >
              {weather.humidity}%
            </Text>
          </View>
          <View style={styles.weatherDetail}>
            <Ionicons name="flag-outline" size={14} color={colors.primary} />
            <Text
              style={[
                styles.weatherDetailText,
                { color: colors.textSecondary },
              ]}
            >
              {weather.windSpeed} km/h
            </Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

// Composant Astuce
const TipCard = ({
  colors,
  tip,
  index,
}: {
  colors: any;
  tip: any;
  index: number;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(-20)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.spring(translateX, {
        toValue: 0,
        friction: 6,
        tension: 40,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.tipItem,
        {
          backgroundColor: colors.card,
          opacity: fadeAnim,
          transform: [{ translateX }, { scale: scaleAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={[tip.color + "20", tip.color + "05"]}
        style={styles.tipIcon}
      >
        <Ionicons name={tip.icon} size={20} color={tip.color} />
      </LinearGradient>
      <View style={styles.tipContent}>
        <View style={styles.tipHeader}>
          <Text style={[styles.tipCategory, { color: tip.color }]}>
            {tip.category}
          </Text>
        </View>
        <Text style={[styles.tipText, { color: colors.textSecondary }]}>
          {tip.text}
        </Text>
      </View>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.tipShare, { backgroundColor: tip.color + "10" }]}
      >
        <Ionicons name="share-outline" size={14} color={tip.color} />
      </TouchableOpacity>
    </Animated.View>
  );
};

// Modal d'annulation
const CancelModal = ({
  visible,
  onClose,
  onConfirm,
  colors,
  colorScheme,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  colors: any;
  colorScheme: string | null;
}) => {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
      setReason("");
    }
  }, [visible]);

  const handleConfirm = async () => {
    if (!reason.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Erreur", "Veuillez indiquer une raison");
      return;
    }
    setIsSubmitting(true);
    await onConfirm(reason.trim());
    setIsSubmitting(false);
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <BlurView intensity={90} tint={colorScheme} style={styles.modalOverlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.cancelModalContainer,
            {
              backgroundColor: colors.card,
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <LinearGradient
            colors={[colors.error + "15", colors.error + "05"]}
            style={styles.cancelModalGradient}
          >
            <View style={styles.cancelModalHeader}>
              <LinearGradient
                colors={[colors.error + "20", colors.error + "10"]}
                style={styles.cancelModalIcon}
              >
                <Ionicons name="alert-circle" size={28} color={colors.error} />
              </LinearGradient>
              <Text style={[styles.cancelModalTitle, { color: colors.text }]}>
                Annuler la mission
              </Text>
              <TouchableOpacity
                onPress={onClose}
                style={styles.cancelModalClose}
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text
              style={[
                styles.cancelModalSubtitle,
                { color: colors.textSecondary },
              ]}
            >
              Pourquoi annulez-vous cette mission ?
            </Text>

            <TextInput
              style={[
                styles.cancelModalInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Ex: Problème de véhicule, client non joignable..."
              placeholderTextColor={colors.placeholder}
              multiline
              numberOfLines={3}
              value={reason}
              onChangeText={setReason}
              textAlignVertical="top"
              autoFocus
            />

            <View style={styles.cancelModalButtons}>
              <TouchableOpacity
                style={[
                  styles.cancelModalBtn,
                  styles.cancelModalBtnCancel,
                  { borderColor: colors.border },
                ]}
                onPress={onClose}
              >
                <Text style={{ color: colors.textSecondary }}>Retour</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.cancelModalBtn,
                  styles.cancelModalBtnConfirm,
                  { backgroundColor: colors.error },
                ]}
                onPress={handleConfirm}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "600" }}>
                    Confirmer l'annulation
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <Text
              style={[styles.cancelModalNote, { color: colors.textSecondary }]}
            >
              <Ionicons name="information-circle" size={12} /> Cette action est
              irréversible
            </Text>
          </LinearGradient>
        </Animated.View>
      </BlurView>
    </Modal>
  );
};

// Composant pour une mission en cours
const ActiveMissionCard = ({
  mission,
  colors,
  onPress,
  onCancel,
}: {
  mission: Mission;
  colors: any;
  onPress: () => void;
  onCancel: () => void;
}) => {
  const statusConfig =
    STATUS_CONFIG[mission.status || "accepted"] || STATUS_CONFIG.accepted;
  const clientName = getClientName(mission);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDistance = (distance: number) => {
    if (distance < 1) return `${Math.round(distance * 1000)} m`;
    return `${distance.toFixed(1)} km`;
  };

  return (
    <Animated.View
      style={[
        styles.activeMissionCard,
        {
          backgroundColor: colors.card,
          opacity: fadeAnim,
          transform: [{ translateY }],
        },
      ]}
    >
      <LinearGradient
        colors={[colors.primary + "05", colors.secondary + "02"]}
        style={styles.activeMissionCardBg}
      />

      <TouchableOpacity
        style={styles.activeMissionContent}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={styles.activeMissionHeader}>
          <View style={styles.activeMissionUser}>
            <LinearGradient
              colors={[colors.primary + "20", colors.secondary + "10"]}
              style={styles.activeMissionAvatar}
            >
              <Text
                style={[
                  styles.activeMissionAvatarText,
                  { color: colors.primary },
                ]}
              >
                {clientName.firstName?.[0]}
                {clientName.lastName?.[0]}
              </Text>
            </LinearGradient>
            <View>
              <Text
                style={[styles.activeMissionUserName, { color: colors.text }]}
              >
                {clientName.firstName} {clientName.lastName}
              </Text>
              <Text
                style={[
                  styles.activeMissionType,
                  { color: colors.textSecondary },
                ]}
              >
                {getMissionType(mission.type)}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.activeMissionStatus,
              { backgroundColor: statusConfig.bgColor },
            ]}
          >
            <Ionicons
              name={statusConfig.icon}
              size={12}
              color={statusConfig.color}
            />
            <Text
              style={[
                styles.activeMissionStatusText,
                { color: statusConfig.color },
              ]}
            >
              {statusConfig.label}
            </Text>
          </View>
        </View>

        <Text
          style={[
            styles.activeMissionDescription,
            { color: colors.textSecondary },
          ]}
          numberOfLines={2}
        >
          {mission.problem?.description || "Intervention en cours"}
        </Text>

        <View style={styles.activeMissionInfo}>
          <View style={styles.infoItem}>
            <Ionicons
              name="location-outline"
              size={14}
              color={colors.primary}
            />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {formatDistance(mission.distance)}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="cash-outline" size={14} color={colors.success} />
            <Text style={[styles.infoText, { color: colors.success }]}>
              ${mission.reward}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons
              name="time-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              {formatTime(mission.createdAt)}
            </Text>
          </View>
        </View>

        <View style={styles.activeMissionLocation}>
          <Ionicons name="location-outline" size={12} color={colors.primary} />
          <Text
            style={[
              styles.activeMissionAddress,
              { color: colors.textSecondary },
            ]}
            numberOfLines={1}
          >
            {mission.location?.address || "Adresse non disponible"}
          </Text>
        </View>

        <View style={styles.activeMissionActions}>
          <TouchableOpacity
            style={[
              styles.activeMissionActionBtn,
              { borderColor: colors.error },
            ]}
            onPress={onCancel}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            <Ionicons name="close-circle" size={16} color={colors.error} />
            <Text
              style={[styles.activeMissionActionText, { color: colors.error }]}
            >
              Annuler
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.activeMissionViewBtn,
              { backgroundColor: colors.primary },
            ]}
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            <Ionicons name="eye-outline" size={16} color="#fff" />
            <Text style={styles.activeMissionViewText}>Suivre</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Composant pour une mission disponible
const AvailableMissionCard = ({
  mission,
  colors,
  onPress,
}: {
  mission: Mission;
  colors: any;
  onPress: () => void;
}) => {
  const clientName = getClientName(mission);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const formatDistance = (distance: number) => {
    if (distance < 1) return `${Math.round(distance * 1000)} m`;
    return `${distance.toFixed(1)} km`;
  };

  return (
    <Animated.View
      style={[
        styles.missionCard,
        {
          backgroundColor: colors.card,
          opacity: fadeAnim,
          transform: [{ translateY }],
        },
      ]}
    >
      <LinearGradient
        colors={[colors.primary + "05", colors.secondary + "02"]}
        style={styles.missionCardBg}
      />

      <TouchableOpacity
        style={styles.missionCardContent}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={styles.missionHeader}>
          <View style={styles.missionLeft}>
            <LinearGradient
              colors={[colors.primary + "20", colors.secondary + "10"]}
              style={styles.missionIcon}
            >
              <Ionicons
                name={getMissionIcon(mission.problem?.category || "other")}
                size={20}
                color={colors.primary}
              />
            </LinearGradient>
            <View>
              <Text style={[styles.missionType, { color: colors.text }]}>
                {getMissionType(mission.type)}
              </Text>
              <Text
                style={[styles.missionClient, { color: colors.textSecondary }]}
              >
                {clientName.firstName} {clientName.lastName}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.missionDistance,
              { backgroundColor: colors.primary + "10" },
            ]}
          >
            <Ionicons
              name="location-outline"
              size={12}
              color={colors.primary}
            />
            <Text
              style={[styles.missionDistanceText, { color: colors.primary }]}
            >
              {formatDistance(mission.distance)}
            </Text>
          </View>
        </View>

        <Text
          style={[styles.missionDescription, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {mission.problem?.description || "Nouvelle demande d'assistance"}
        </Text>

        <View style={styles.missionFooter}>
          <View
            style={[
              styles.missionTime,
              {
                backgroundColor:
                  getTimeColor(mission.estimatedTimeMinutes, colors) + "15",
              },
            ]}
          >
            <Ionicons
              name="time-outline"
              size={14}
              color={getTimeColor(mission.estimatedTimeMinutes, colors)}
            />
            <Text
              style={[
                styles.missionTimeText,
                { color: getTimeColor(mission.estimatedTimeMinutes, colors) },
              ]}
            >
              {mission.estimatedTime}
            </Text>
          </View>
          <Text style={[styles.missionReward, { color: colors.success }]}>
            ${mission.reward}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { updateStatus, isConnected } = useSocket();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // États
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelMissionId, setCancelMissionId] = useState<string | null>(null);
  const [availableMissions, setAvailableMissions] = useState<Mission[]>([]);
  const [currentMissions, setCurrentMissions] = useState<Mission[]>([]);
  const [stats, setStats] = useState<HelperStats>({
    todayEarnings: 0,
    todayMissions: 0,
    averageRating: 0,
    totalMissions: 0,
    responseRate: 100,
    ranking: 0,
    level: "Débutant",
    completionRate: 0,
  });

  // État pour le modal d'annulation
  const [cancelModal, setCancelModal] = useState<{
    visible: boolean;
    missionId: string;
    missionTitle: string;
    reason?: string;
    cancelledBy: "user" | "helper" | "system";
    autoCloseDelay: number;
  }>({
    visible: false,
    missionId: "",
    missionTitle: "",
    cancelledBy: "system",
    autoCloseDelay: 0,
  });

  // États météo
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  // Refs
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const tipIndexRef = useRef(0);
  const tipIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // ============================================
  // CHARGEMENT MÉTÉO
  // ============================================
  const getWeather = async () => {
    setWeatherLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setWeatherLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 10000,
      });

      const response = await api.get("/users/weather", {
        params: { lat: loc.coords.latitude, lng: loc.coords.longitude },
        timeout: 10000,
      });

      if (response.data.success && response.data.data && isMountedRef.current) {
        setWeather(response.data.data);
      }
    } catch (error) {
      console.log("Erreur météo:", error);
    } finally {
      setWeatherLoading(false);
    }
  };

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // ============================================
  // REFRESH UNIQUEMENT LES SOS DISPONIBLES
  // ============================================
  const refreshAvailableSOS = useCallback(async () => {
    console.log("🔄 refreshAvailableSOS() - Rechargement des SOS disponibles");

    if (!isMountedRef.current) return;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("⚠️ Permission de localisation non accordée");
        return;
      }

      const locationResponse = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 10000,
      });

      const { latitude, longitude } = locationResponse.coords;
      console.log("📍 Position pour les SOS:", { latitude, longitude });

      const response = await api.get(
        `/helpers/available-sos?lat=${latitude}&lng=${longitude}&radius=50`
      );

      console.log(`📦 ${response.data.data.length} SOS reçus de l'API`);

      const missionsWithEta = (response.data.data || []).map((mission: any) => {
        const distance = mission.distance || 0;
        const eta = calculateEstimatedTime(distance);
        return {
          ...mission,
          estimatedTime: eta.text,
          estimatedTimeMinutes: eta.minutes,
        };
      });

      console.log(
        `📊 ${missionsWithEta.length} missions disponibles mises à jour`
      );
      setAvailableMissions(missionsWithEta);
    } catch (error) {
      console.log("❌ Erreur refreshAvailableSOS:", error);
    }
  }, []);

  useEffect(() => {
    console.log("📡 [Accueil] Installation des écouteurs EventEmitter");

    // ✅ NOUVELLE MISSION
    const handleNewMission = (data: any) => {
      console.log("📢 [Accueil] Nouvelle mission via EventEmitter:", data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (isMountedRef.current) {
        refreshAvailableSOS();
      }
    };

    // ✅ MISSION ANNULÉE (simple)
    const handleMissionCancelled = (data: any) => {
      console.log("📢 [Accueil] Mission annulée via EventEmitter:", data);
      if (isMountedRef.current) {
        setCurrentMissions((prev) =>
          prev.filter((mission) => mission._id !== data.missionId)
        );
        refreshAvailableSOS();
      }
    };

    // ✅ NOUVEAU : DÉTAIL D'ANNULATION POUR MODAL AVEC TIMEOUT
    const handleMissionCancelledDetail = (data: {
      missionId: string;
      cancelledBy: "user" | "helper" | "system";
      reason?: string;
      missionTitle: string;
    }) => {
      console.log("📢 [Accueil] Détail annulation:", data);

      // Déterminer le délai d'auto-fermeture : 15 secondes si annulé par client
      let autoCloseDelay = 0;
      if (data.cancelledBy === "user") {
        autoCloseDelay = 15;
      }

      setCancelModal({
        visible: true,
        missionId: data.missionId,
        missionTitle: data.missionTitle,
        reason: data.reason,
        cancelledBy: data.cancelledBy,
        autoCloseDelay,
      });

      // Supprimer la mission des missions en cours
      setCurrentMissions((prev) =>
        prev.filter((m) => m._id !== data.missionId)
      );

      // Vibration
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    };

    // ✅ MISE À JOUR STATUT
    const handleStatusUpdate = (data: any) => {
      console.log("📢 [Accueil] Mise à jour statut via EventEmitter:", data);
      if (isMountedRef.current) {
        if (data.status === "cancelled") {
          setCurrentMissions((prev) =>
            prev.filter((mission) => mission._id !== data.interventionId)
          );
          // Ne plus afficher d'alerte ici car on a le modal
          refreshAvailableSOS();
        } else {
          refreshAvailableSOS();
        }
      }
    };

    // ✅ MISSION ACCEPTÉE PAR UN AUTRE HELPER
    const handleMissionAccepted = (data: any) => {
      console.log(
        "📢 [Accueil] Mission acceptée par un autre helper via EventEmitter:",
        data
      );
      if (isMountedRef.current) {
        refreshAvailableSOS();
      }
    };

    // ✅ MISSION COMPLÉTÉE
    const handleMissionCompleted = (data: any) => {
      console.log("📢 [Accueil] Mission complétée via EventEmitter:", data);
      if (isMountedRef.current) {
        setCurrentMissions((prev) =>
          prev.filter((mission) => mission._id !== data.missionId)
        );
      }
    };

    // Ajout des écouteurs sur l'EventEmitter
    socketEvents.on("new-mission", handleNewMission);
    socketEvents.on("mission-cancelled", handleMissionCancelled);
    socketEvents.on("mission-cancelled-detail", handleMissionCancelledDetail);
    socketEvents.on("status-update", handleStatusUpdate);
    socketEvents.on("mission-accepted", handleMissionAccepted);
    socketEvents.on("mission-completed", handleMissionCompleted);

    return () => {
      console.log("🧹 [Accueil] Nettoyage des écouteurs EventEmitter");
      socketEvents.off("new-mission", handleNewMission);
      socketEvents.off("mission-cancelled", handleMissionCancelled);
      socketEvents.off(
        "mission-cancelled-detail",
        handleMissionCancelledDetail
      );
      socketEvents.off("status-update", handleStatusUpdate);
      socketEvents.off("mission-accepted", handleMissionAccepted);
      socketEvents.off("mission-completed", handleMissionCompleted);
    };
  }, [refreshAvailableSOS, setCurrentMissions]);
  // ============================================
  // INITIALISATION
  // ============================================
  useEffect(() => {
    isMountedRef.current = true;

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    loadData();
    getWeather();

    return () => {
      isMountedRef.current = false;
      stopPolling();
      if (tipIntervalRef.current) clearInterval(tipIntervalRef.current);
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
      getWeather();
      return () => {};
    }, [])
  );

  // ============================================
  // CHARGEMENT COMPLET DES DONNÉES
  // ============================================
  const loadData = async () => {
    console.log("🔄 ========== loadData() ==========");
    console.log("⏰ Timestamp:", new Date().toISOString());

    try {
      // 1. Profil helper
      console.log("📡 1. Chargement du profil helper...");
      const profileResponse = await api.get("/helpers/profile/me");
      const profile = profileResponse.data.data;
      setIsAvailable(profile.availability?.isAvailable ?? true);
      console.log(
        "✅ Profil chargé - Disponible:",
        profile.availability?.isAvailable
      );

      // 2. Statistiques
      console.log("📊 2. Chargement des statistiques...");
      try {
        const statsResponse = await api.get("/helpers/earnings/stats");
        const statsData = statsResponse.data.data;

        let level = "Débutant";
        if (statsData.completedMissions > 100) level = "Expert";
        else if (statsData.completedMissions > 50) level = "Confirmé";
        else if (statsData.completedMissions > 20) level = "Intermédiaire";

        const completionRate =
          statsData.completedMissions > 0
            ? Math.round(
                (statsData.completedMissions /
                  (statsData.completedMissions +
                    (statsData.cancelledMissions || 0))) *
                  100
              )
            : 100;

        setStats({
          todayEarnings: statsData.todayEarnings || 0,
          todayMissions: statsData.todayMissions || 0,
          averageRating: profile.stats?.averageRating || 0,
          totalMissions: statsData.completedMissions || 0,
          responseRate: statsData.responseRate || 100,
          ranking: 12,
          level: level,
          completionRate: completionRate,
        });
        console.log(
          "✅ Stats chargées - Missions totales:",
          statsData.completedMissions
        );
      } catch (error) {
        console.log("⚠️ Erreur chargement stats:", error);
      }

      // 3. Missions disponibles
      console.log("📍 3. Chargement des missions disponibles...");
      await refreshAvailableSOS();

      // 4. Missions en cours
      console.log("🚗 4. Chargement des missions en cours...");
      try {
        const currentResponse = await api.get("/helpers/missions/current");
        const missionsWithEta = (currentResponse.data.data || []).map(
          (mission: any) => {
            const distance = mission.distance || 0;
            const eta = calculateEstimatedTime(distance);
            return {
              ...mission,
              estimatedTime: eta.text,
              estimatedTimeMinutes: eta.minutes,
            };
          }
        );
        console.log(`📊 ${missionsWithEta.length} missions en cours chargées`);
        setCurrentMissions(missionsWithEta);
      } catch (error) {
        console.log("⚠️ Erreur chargement missions en cours:", error);
        setCurrentMissions([]);
      }

      console.log("✅ ========== loadData() terminé ==========");
    } catch (error) {
      console.error("❌ Erreur loadData:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadData();
    await getWeather();
    setRefreshing(false);
  };

  const toggleAvailability = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newStatus = !isAvailable;
    try {
      await api.put("/helpers/availability", { isAvailable: newStatus });
      setIsAvailable(newStatus);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert("Erreur", "Impossible de changer le statut");
    }
  };

  const handleMissionPress = (mission: Mission) => {
    setSelectedMission(mission);
    setShowMissionModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleCancelPress = (missionId: string) => {
    setCancelMissionId(missionId);
    setCancelModalVisible(true);
  };

  const handleCancelConfirm = async (reason: string) => {
    if (!cancelMissionId) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentMissions((prev) =>
      prev.filter((mission) => mission._id !== cancelMissionId)
    );

    try {
      await api.put(`/helpers/missions/${cancelMissionId}/status`, {
        status: "cancelled",
        reason: reason,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCancelModalVisible(false);
      setCancelMissionId(null);
      await loadData();
    } catch (error: any) {
      await loadData();
      Alert.alert(
        "Erreur",
        error.response?.data?.message || "Impossible d'annuler la mission"
      );
    }
  };

  const handleAcceptMission = async () => {
    if (!selectedMission) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowMissionModal(false);

    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      await api.post(
        `/helpers/accept-sos/${selectedMission._id}`,
        {},
        { params: { lat: loc.coords.latitude, lng: loc.coords.longitude } }
      );
      Alert.alert(
        "✅ Mission acceptée",
        "Rendez-vous dans l'onglet Missions pour plus de détails"
      );
      await loadData();
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'accepter la mission");
    }
  };

  const formatDistance = (distance: number) => {
    if (distance < 1) return `${Math.round(distance * 1000)} m`;
    return `${distance.toFixed(1)} km`;
  };

  const hasActiveMissions = currentMissions.length > 0;
  const hasAvailableMissions = availableMissions.length > 0;

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.loadingLogo}
          >
            <Ionicons name="flash" size={40} color="#fff" />
          </LinearGradient>
          <Text style={[styles.loadingText, { color: colors.primary }]}>
            Kadima
          </Text>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.header}
      >
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerGreeting}>Bonjour,</Text>
              <View style={styles.headerNameRow}>
                <Text style={styles.headerName}>
                  {user?.firstName || "Helper"}
                </Text>
                <View
                  style={[
                    styles.headerLevel,
                    {
                      backgroundColor:
                        getLevelColor(stats.level, colors) + "30",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.headerLevelText,
                      { color: getLevelColor(stats.level, colors) },
                    ]}
                  >
                    {stats.level}
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.statusButton,
                {
                  backgroundColor: isAvailable ? colors.success : colors.error,
                },
              ]}
              onPress={toggleAvailability}
              activeOpacity={0.8}
            >
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>
                {isAvailable ? "Disponible" : "Indisponible"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.headerStats}>
            <View style={styles.headerStat}>
              <Text style={styles.headerStatValue}>{stats.todayMissions}</Text>
              <Text style={styles.headerStatLabel}>aujourd'hui</Text>
            </View>
            <View style={styles.headerStatDivider} />
            <View style={styles.headerStat}>
              <Text style={styles.headerStatValue}>${stats.todayEarnings}</Text>
              <Text style={styles.headerStatLabel}>gagnés</Text>
            </View>
            <View style={styles.headerStatDivider} />
            <View style={styles.headerStat}>
              <Text style={styles.headerStatValue}>
                {stats.completionRate}%
              </Text>
              <Text style={styles.headerStatLabel}>complétées</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <Animated.View
          style={[
            styles.content,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* 🌤️ MÉTÉO */}
          <WeatherWidget
            colors={colors}
            weather={weather}
            loading={weatherLoading}
          />

          {/* 🚗 Missions en cours */}
          {hasActiveMissions && (
            <View style={styles.activeSection}>
              <View style={styles.sectionHeader}>
                <LinearGradient
                  colors={[colors.primary + "20", colors.secondary + "10"]}
                  style={styles.sectionIcon}
                >
                  <Ionicons name="car" size={16} color={colors.primary} />
                </LinearGradient>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  En cours ({currentMissions.length})
                </Text>
                <TouchableOpacity onPress={() => router.push("/missions")}>
                  <Text style={[styles.sectionLink, { color: colors.primary }]}>
                    Voir tout
                  </Text>
                </TouchableOpacity>
              </View>
              {currentMissions.slice(0, 2).map((mission) => (
                <ActiveMissionCard
                  key={mission._id}
                  mission={mission}
                  colors={colors}
                  onPress={() => router.push(`/missions/${mission._id}`)}
                  onCancel={() => handleCancelPress(mission._id)}
                />
              ))}
            </View>
          )}

          {/* 📊 Grille de stats */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <View
                style={[
                  styles.statIcon,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Ionicons name="star" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.statCardValue, { color: colors.text }]}>
                {stats.averageRating.toFixed(1)}
              </Text>
              <Text
                style={[styles.statCardLabel, { color: colors.textSecondary }]}
              >
                Note
              </Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <View
                style={[
                  styles.statIcon,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={colors.primary}
                />
              </View>
              <Text style={[styles.statCardValue, { color: colors.text }]}>
                {stats.totalMissions}
              </Text>
              <Text
                style={[styles.statCardLabel, { color: colors.textSecondary }]}
              >
                Missions
              </Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <View
                style={[
                  styles.statIcon,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Ionicons name="trending-up" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.statCardValue, { color: colors.text }]}>
                {stats.responseRate}%
              </Text>
              <Text
                style={[styles.statCardLabel, { color: colors.textSecondary }]}
              >
                Réponse
              </Text>
            </View>
          </View>

          {/* 📋 Missions disponibles */}
          <View style={styles.missionsSection}>
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={[colors.primary + "20", colors.secondary + "10"]}
                style={styles.sectionIcon}
              >
                <Ionicons
                  name="alert-circle"
                  size={16}
                  color={colors.primary}
                />
              </LinearGradient>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Missions disponibles
              </Text>
              <TouchableOpacity onPress={() => router.push("/missions")}>
                <Text style={[styles.sectionLink, { color: colors.primary }]}>
                  Voir tout
                </Text>
              </TouchableOpacity>
            </View>

            {hasAvailableMissions ? (
              availableMissions
                .slice(0, 3)
                .map((mission) => (
                  <AvailableMissionCard
                    key={mission._id}
                    mission={mission}
                    colors={colors}
                    onPress={() => handleMissionPress(mission)}
                  />
                ))
            ) : (
              <View
                style={[
                  styles.emptyContainer,
                  { backgroundColor: colors.card },
                ]}
              >
                <LinearGradient
                  colors={[colors.primary + "10", colors.secondary + "05"]}
                  style={styles.emptyIcon}
                >
                  <Ionicons
                    name="car-outline"
                    size={32}
                    color={colors.textSecondary}
                  />
                </LinearGradient>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  Aucune mission
                </Text>
                <Text
                  style={[styles.emptyText, { color: colors.textSecondary }]}
                >
                  Les missions apparaîtront ici en temps réel
                </Text>
              </View>
            )}
          </View>

          {/* 💡 Conseils du jour */}
          <View style={styles.tipsSection}>
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={[colors.primary + "20", colors.secondary + "10"]}
                style={styles.sectionIcon}
              >
                <Ionicons name="bulb" size={16} color={colors.primary} />
              </LinearGradient>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Conseils du jour
              </Text>
            </View>
            <View style={styles.tipsList}>
              {HELPER_TIPS.map((tip, index) => (
                <TipCard key={index} colors={colors} tip={tip} index={index} />
              ))}
            </View>
          </View>

          <View style={styles.tabBarSpace} />
        </Animated.View>
      </ScrollView>

      {/* Modal Mission */}
      <Modal
        visible={showMissionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMissionModal(false)}
      >
        <BlurView intensity={90} tint={colorScheme} style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setShowMissionModal(false)}
            activeOpacity={1}
          />
          {selectedMission && (
            <Animated.View
              style={[
                styles.modalContent,
                {
                  backgroundColor: colors.card,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <LinearGradient
                  colors={[colors.primary + "20", colors.secondary + "10"]}
                  style={styles.modalIcon}
                >
                  <Ionicons
                    name={getMissionIcon(
                      selectedMission.problem?.category || "other"
                    )}
                    size={32}
                    color={colors.primary}
                  />
                </LinearGradient>
                <View style={styles.modalTitleContainer}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    {getMissionType(selectedMission.type)}
                  </Text>
                  <Text
                    style={[
                      styles.modalClient,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {getClientName(selectedMission).firstName}{" "}
                    {getClientName(selectedMission).lastName}
                  </Text>
                </View>
              </View>

              <View style={styles.modalDetails}>
                <View style={styles.modalDetail}>
                  <Ionicons
                    name="location-outline"
                    size={18}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.modalDetailText, { color: colors.text }]}
                  >
                    {formatDistance(selectedMission.distance)}
                  </Text>
                  <Text
                    style={[
                      styles.modalDetailLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Distance
                  </Text>
                </View>
                <View style={styles.modalDetail}>
                  <Ionicons
                    name="time-outline"
                    size={18}
                    color={getTimeColor(
                      selectedMission.estimatedTimeMinutes,
                      colors
                    )}
                  />
                  <Text
                    style={[
                      styles.modalDetailText,
                      {
                        color: getTimeColor(
                          selectedMission.estimatedTimeMinutes,
                          colors
                        ),
                      },
                    ]}
                  >
                    {selectedMission.estimatedTime}
                  </Text>
                  <Text
                    style={[
                      styles.modalDetailLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Temps estimé
                  </Text>
                </View>
                <View style={styles.modalDetail}>
                  <Ionicons
                    name="cash-outline"
                    size={18}
                    color={colors.success}
                  />
                  <Text
                    style={[styles.modalDetailText, { color: colors.success }]}
                  >
                    ${selectedMission.reward}
                  </Text>
                  <Text
                    style={[
                      styles.modalDetailLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Gain
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.modalDescription,
                  { backgroundColor: colors.background },
                ]}
              >
                <Text
                  style={[styles.modalDescriptionText, { color: colors.text }]}
                >
                  {selectedMission.problem?.description ||
                    "Nouvelle demande d'assistance"}
                </Text>
                <Text
                  style={[
                    styles.modalAddressText,
                    { color: colors.textSecondary },
                  ]}
                >
                  {selectedMission.location?.address ||
                    "Adresse non disponible"}
                </Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[
                    styles.modalAcceptButton,
                    { backgroundColor: colors.success },
                  ]}
                  onPress={handleAcceptMission}
                >
                  <Text style={styles.modalAcceptText}>
                    Accepter la mission
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalCloseButton,
                    { borderColor: colors.border },
                  ]}
                  onPress={() => setShowMissionModal(false)}
                >
                  <Text
                    style={[
                      styles.modalCloseText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Fermer
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
        </BlurView>
      </Modal>

      {/* Modal d'annulation */}
      <CancelModal
        visible={cancelModalVisible}
        onClose={() => setCancelModalVisible(false)}
        onConfirm={handleCancelConfirm}
        colors={colors}
        colorScheme={colorScheme}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  loadingText: { fontSize: 20, fontWeight: "600" },
  header: {
    paddingTop: Platform.OS === "ios" ? 0 : StatusBar.currentHeight,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerSafeArea: {
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginHorizontal: 10,
  },
  headerGreeting: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.8,
    marginBottom: 4,
  },
  headerNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerName: { fontSize: 22, fontWeight: "bold", color: "#fff" },
  headerLevel: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  headerLevelText: { fontSize: 11, fontWeight: "600" },
  statusButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    gap: 8,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" },
  statusText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  headerStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    padding: 16,
  },
  headerStat: { alignItems: "center" },
  headerStatValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 2,
  },
  headerStatLabel: { fontSize: 11, color: "#fff", opacity: 0.8 },
  headerStatDivider: {
    width: 1,
    height: "70%",
    backgroundColor: "rgba(255,255,255,0.3)",
    alignSelf: "center",
  },
  content: { flex: 1, padding: 16 },

  // Météo
  weatherContainer: { marginBottom: 20, borderRadius: 24, overflow: "hidden" },
  weatherGradient: { padding: 16 },
  weatherMain: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  weatherTempContainer: { alignItems: "flex-start" },
  weatherTemp: { fontSize: 36, fontWeight: "bold" },
  weatherCondition: { fontSize: 14, marginTop: 4 },
  weatherIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  weatherIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  weatherDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  weatherDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  weatherDetailText: { fontSize: 12, flex: 1 },
  weatherSkeleton: { marginBottom: 20, borderRadius: 24, overflow: "hidden" },
  weatherSkeletonContent: { padding: 20, alignItems: "center", gap: 8 },
  weatherSkeletonText: { fontSize: 12 },

  // Conseils
  tipsSection: { marginTop: 8, marginBottom: 24 },
  tipsList: { gap: 10 },
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 20,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tipIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  tipContent: { flex: 1 },
  tipHeader: { marginBottom: 4 },
  tipCategory: { fontSize: 10, fontWeight: "600", textTransform: "uppercase" },
  tipText: { fontSize: 13, lineHeight: 18 },
  tipShare: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: "600", flex: 1 },
  sectionLink: { fontSize: 13, fontWeight: "500" },
  activeSection: { marginBottom: 24 },
  statsGrid: { flexDirection: "row", gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statCardValue: { fontSize: 16, fontWeight: "bold", marginBottom: 2 },
  statCardLabel: { fontSize: 10 },
  missionsSection: { gap: 12, marginBottom: 24 },
  activeMissionCard: {
    borderRadius: 24,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    position: "relative",
    overflow: "hidden",
  },
  activeMissionCardBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.5,
  },
  activeMissionContent: { padding: 16 },
  activeMissionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  activeMissionUser: { flexDirection: "row", alignItems: "center", gap: 12 },
  activeMissionAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  activeMissionAvatarText: { fontSize: 16, fontWeight: "600" },
  activeMissionUserName: { fontSize: 15, fontWeight: "600", marginBottom: 2 },
  activeMissionType: { fontSize: 12 },
  activeMissionStatus: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  activeMissionStatusText: { fontSize: 10, fontWeight: "600" },
  activeMissionDescription: { fontSize: 13, marginBottom: 12, lineHeight: 18 },
  activeMissionInfo: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 8,
  },
  activeMissionLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.02)",
  },
  activeMissionAddress: { flex: 1, fontSize: 12 },
  activeMissionActions: { flexDirection: "row", gap: 8, marginTop: 4 },
  activeMissionActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1,
    gap: 6,
  },
  activeMissionActionText: { fontSize: 12, fontWeight: "600" },
  activeMissionViewBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 30,
    gap: 6,
  },
  activeMissionViewText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  missionCard: {
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: "relative",
    overflow: "hidden",
  },
  missionCardBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.5,
  },
  missionCardContent: { padding: 16 },
  missionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  missionLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  missionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  missionType: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  missionClient: { fontSize: 12 },
  missionDistance: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
  },
  missionDistanceText: { fontSize: 11, fontWeight: "500" },
  missionDescription: { fontSize: 13, marginBottom: 12 },
  missionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  missionTime: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
  },
  missionTimeText: { fontSize: 11, fontWeight: "500" },
  missionReward: { fontSize: 16, fontWeight: "700" },
  emptyContainer: {
    alignItems: "center",
    padding: 32,
    borderRadius: 20,
    gap: 12,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: { fontSize: 16, fontWeight: "600" },
  emptyText: { fontSize: 13, textAlign: "center" },
  tabBarSpace: { height: 80 },
  modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center" },
  modalContent: {
    width: "90%",
    maxWidth: 400,
    padding: 24,
    borderRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
  },
  modalIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitleContainer: { flex: 1 },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 2 },
  modalClient: { fontSize: 14 },
  modalDetails: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  modalDetail: { alignItems: "center", gap: 4, flex: 1 },
  modalDetailText: { fontSize: 14, fontWeight: "500" },
  modalDetailLabel: { fontSize: 10, marginTop: 2, textAlign: "center" },
  modalDescription: { padding: 16, borderRadius: 16, marginBottom: 20, gap: 8 },
  modalDescriptionText: { fontSize: 14, lineHeight: 20, textAlign: "center" },
  modalAddressText: { fontSize: 12, textAlign: "center" },
  modalActions: { gap: 10 },
  modalAcceptButton: { padding: 16, borderRadius: 30, alignItems: "center" },
  modalAcceptText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  modalCloseButton: {
    padding: 14,
    borderRadius: 30,
    borderWidth: 1,
    alignItems: "center",
  },
  modalCloseText: { fontSize: 14, fontWeight: "500" },
  cancelModalContainer: {
    width: "90%",
    maxWidth: 400,
    borderRadius: 32,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 20,
  },
  cancelModalGradient: { padding: 24 },
  cancelModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  cancelModalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cancelModalTitle: { fontSize: 20, fontWeight: "700", flex: 1 },
  cancelModalClose: { padding: 4 },
  cancelModalSubtitle: { fontSize: 14, marginBottom: 16 },
  cancelModalInput: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  cancelModalButtons: { flexDirection: "row", gap: 12, marginBottom: 16 },
  cancelModalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelModalBtnCancel: { borderWidth: 1 },
  cancelModalBtnConfirm: { borderWidth: 0 },
  cancelModalNote: { fontSize: 11, textAlign: "center", opacity: 0.7 },
  infoItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  infoText: { fontSize: 12, fontWeight: "500" },
});
