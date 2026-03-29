// app/(tabs)/index.tsx - Version avec chargement cohérent

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Easing,
  Platform,
  RefreshControl,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { api } from "../../config/api";
import { Image } from "expo-image";

const { width, height } = Dimensions.get("window");

// ============================================
// TYPES
// ============================================

interface Intervention {
  _id: string;
  type: string;
  status: string;
  createdAt: string;
  problem?: { description: string; category: string };
  pricing?: { final: number };
}

interface UserStats {
  vehiclesCount: number;
  interventionsCount: number;
  completedInterventions: number;
  averageRating: number;
  totalSpent: number;
  recentInterventions: Intervention[];
}

interface UserDetails {
  firstName: string;
  lastName: string;
  email: string;
  photo?: string;
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

// Actions rapides
const QUICK_ACTIONS = [
  {
    id: "sos",
    title: "SOS Urgence",
    icon: "alert-circle",
    gradient: ["#EF4444", "#DC2626"],
    route: "/sos",
    description: "Aide immédiate 24/7",
    badge: "URGENT",
    color: "#EF4444",
  },
  {
    id: "diagnostic",
    title: "Diagnostic IA",
    icon: "medkit",
    gradient: ["#3B82F6", "#2563EB"],
    route: "/diagnostic",
    description: "Analyse de panne",
    badge: "IA",
    color: "#3B82F6",
  },
  {
    id: "helpers",
    title: "Helpers",
    icon: "people",
    gradient: ["#8B5CF6", "#7C3AED"],
    route: "/helpers",
    description: "Trouver de l'aide",
    badge: "PRO",
    color: "#8B5CF6",
  },
  {
    id: "vehicles",
    title: "Véhicules",
    icon: "car",
    gradient: ["#22C55E", "#16A34A"],
    route: "/vehicles",
    description: "Gérer mes véhicules",
    badge: null,
    color: "#22C55E",
  },
];

// Astuces de sécurité
const TIPS = [
  {
    text: "En cas de panne, activez vos feux de détresse",
    icon: "car",
    color: "#EF4444",
  },
  {
    text: "Placez le triangle à 30 mètres derrière votre véhicule",
    icon: "triangle",
    color: "#F59E0B",
  },
  {
    text: "Restez à l'intérieur du véhicule en attendant l'aide",
    icon: "lock-closed",
    color: "#22C55E",
  },
  {
    text: "Ayez toujours une batterie externe pour votre téléphone",
    icon: "battery-charging",
    color: "#3B82F6",
  },
  {
    text: "Notez votre plaque d'immatriculation en cas d'appel",
    icon: "document-text",
    color: "#8B5CF6",
  },
];

// Configuration des icônes météo
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

// ============================================
// COMPOSANT MÉTÉO
// ============================================

const WeatherWidget = ({
  colors,
  weather,
  loading,
  error,
}: {
  colors: any;
  weather: WeatherData | null;
  loading: boolean;
  error: boolean;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (weather || error) {
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
  }, [weather, error]);

  if (loading) {
    return (
      <View
        style={[styles.weatherSkeleton, { backgroundColor: colors.surface }]}
      >
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
            Météo...
          </Text>
        </LinearGradient>
      </View>
    );
  }

  if (error || !weather) {
    return (
      <Animated.View
        style={[
          styles.weatherContainer,
          {
            backgroundColor: colors.surface,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={[colors.primary + "10", colors.secondary + "05"]}
          style={styles.weatherGradient}
        >
          <View style={styles.weatherError}>
            <Ionicons
              name="cloud-offline-outline"
              size={32}
              color={colors.textSecondary}
            />
            <Text
              style={[styles.weatherErrorText, { color: colors.textSecondary }]}
            >
              Météo indisponible
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  }

  const weatherIcon = getWeatherIcon(weather.icon);

  return (
    <Animated.View
      style={[
        styles.weatherContainer,
        {
          backgroundColor: colors.surface,
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
            {weather.icon ? (
              <Image
                source={{
                  uri: `https://openweathermap.org/img/wn/${weather.icon}@2x.png`,
                }}
                style={styles.weatherIconImage}
                contentFit="contain"
              />
            ) : (
              <Ionicons
                name={weatherIcon as any}
                size={48}
                color={colors.primary}
              />
            )}
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

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // États
  const [stats, setStats] = useState<UserStats>({
    vehiclesCount: 0,
    interventionsCount: 0,
    completedInterventions: 0,
    averageRating: 5.0,
    totalSpent: 0,
    recentInterventions: [],
  });
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [greeting, setGreeting] = useState("Bonjour");
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  // États météo
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const sosAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const tipFadeAnim = useRef(new Animated.Value(1)).current;
  const tipTranslateAnim = useRef(new Animated.Value(0)).current;

  // ============================================
  // EFFETS ET ANIMATIONS
  // ============================================

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Bonjour");
    else if (hour < 18) setGreeting("Bon après-midi");
    else setGreeting("Bonsoir");

    // Animations d'entrée
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(headerAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(statsAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(sosAnim, {
        toValue: 1,
        friction: 5,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();

    // Animation de pulsation pour le bouton SOS
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotation des astuces
    const tipInterval = setInterval(() => {
      Animated.parallel([
        Animated.timing(tipFadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(tipTranslateAnim, {
          toValue: -20,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentTipIndex((prev) => (prev + 1) % TIPS.length);
        tipTranslateAnim.setValue(20);
        Animated.parallel([
          Animated.timing(tipFadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(tipTranslateAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, 5000);

    loadUserData();
    getWeather();

    return () => clearInterval(tipInterval);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
      getWeather();
    }, [])
  );

  // ============================================
  // FONCTIONS API
  // ============================================

  const getWeather = async () => {
    setWeatherLoading(true);
    setWeatherError(false);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setWeatherError(true);
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

      if (response.data.success && response.data.data) {
        setWeather(response.data.data);
      } else {
        setWeatherError(true);
      }
    } catch (error) {
      console.error("Erreur météo:", error);
      setWeatherError(true);
    } finally {
      setWeatherLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      const statsResponse = await api.get("/users/stats/me");
      const statsData = statsResponse.data.data;

      const interventionsResponse = await api.get("/interventions");
      const interventions = interventionsResponse.data.data || [];

      const recentInterventions = interventions
        .sort(
          (a: Intervention, b: Intervention) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 3);

      const userResponse = await api.get("/auth/user/me");

      setStats({
        vehiclesCount: statsData.vehiclesCount || 0,
        interventionsCount:
          statsData.totalInterventions || interventions.length,
        completedInterventions: statsData.completedInterventions || 0,
        averageRating: statsData.averageRating || 5.0,
        totalSpent: statsData.totalSpent || 0,
        recentInterventions: recentInterventions,
      });
      setUserDetails(userResponse.data.data);
    } catch (error) {
      console.log("Erreur chargement données:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await Promise.all([loadUserData(), getWeather()]);
  };

  // ============================================
  // HANDLERS
  // ============================================

  const handleSOSPress = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    router.push("/sos");
  };

  const handleQuickAction = (action: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(action.route);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "completed":
        return {
          color: "#22C55E",
          bgColor: "#22C55E15",
          text: "Terminée",
          icon: "checkmark-circle",
        };
      case "pending":
        return {
          color: "#F59E0B",
          bgColor: "#F59E0B15",
          text: "En attente",
          icon: "time",
        };
      case "cancelled":
        return {
          color: "#EF4444",
          bgColor: "#EF444415",
          text: "Annulée",
          icon: "close-circle",
        };
      default:
        return {
          color: "#3B82F6",
          bgColor: "#3B82F615",
          text: "En cours",
          icon: "car",
        };
    }
  };

  // ============================================
  // ANIMATIONS INTERPOLATIONS
  // ============================================

  const headerTranslateY = headerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 0],
  });
  const statsScale = statsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });
  const sosScale = sosAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1],
  });

  // ============================================
  // RENDU - CHARGEMENT COHÉRENT AVEC LES AUTRES PAGES
  // ============================================

  if (loading && !refreshing) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.loadingLogo}
        >
          <Ionicons name="car" size={40} color="#fff" />
        </LinearGradient>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Chargement...
        </Text>
        <ActivityIndicator size="large" color={colors.primary} />
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

      {/* Cercles décoratifs */}
      <Animated.View
        style={[
          styles.decorativeCircle,
          styles.circle1,
          {
            backgroundColor: colors.primary + "08",
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.decorativeCircle,
          styles.circle2,
          {
            backgroundColor: colors.secondary + "08",
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        <Animated.View
          style={[
            styles.content,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Header avec profil */}
          <Animated.View
            style={[
              styles.header,
              { transform: [{ translateY: headerTranslateY }] },
            ]}
          >
            <View>
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>
                {greeting} 👋
              </Text>
              <Text style={[styles.userName, { color: colors.text }]}>
                {userDetails?.firstName || user?.name || "Conducteur"}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.profileButton,
                { backgroundColor: colors.surface },
              ]}
              onPress={() => router.push("/(tabs)/profile")}
              activeOpacity={0.9}
            >
              {userDetails?.photo ? (
                <Image
                  source={{ uri: userDetails.photo }}
                  style={styles.profileImage}
                />
              ) : (
                <LinearGradient
                  colors={[colors.primary, colors.secondary]}
                  style={styles.profileGradient}
                >
                  <Text style={styles.profileInitial}>
                    {userDetails?.firstName?.[0] || user?.name?.[0] || "U"}
                  </Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Widget Météo */}
          <WeatherWidget
            colors={colors}
            weather={weather}
            loading={weatherLoading}
            error={weatherError}
          />

          {/* Cartes statistiques */}
          <Animated.View
            style={[styles.statsGrid, { transform: [{ scale: statsScale }] }]}
          >
            <View
              style={[styles.statCard, { backgroundColor: colors.surface }]}
            >
              <LinearGradient
                colors={[colors.primary + "20", colors.primary + "10"]}
                style={styles.statIconBg}
              >
                <Ionicons name="car" size={22} color={colors.primary} />
              </LinearGradient>
              <Text style={[styles.statNumber, { color: colors.text }]}>
                {stats.vehiclesCount}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Véhicules
              </Text>
            </View>

            <View
              style={[styles.statCard, { backgroundColor: colors.surface }]}
            >
              <LinearGradient
                colors={[colors.primary + "20", colors.primary + "10"]}
                style={styles.statIconBg}
              >
                <Ionicons name="time" size={22} color={colors.primary} />
              </LinearGradient>
              <Text style={[styles.statNumber, { color: colors.text }]}>
                {stats.interventionsCount}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Interventions
              </Text>
            </View>

            <View
              style={[styles.statCard, { backgroundColor: colors.surface }]}
            >
              <LinearGradient
                colors={[colors.primary + "20", colors.primary + "10"]}
                style={styles.statIconBg}
              >
                <Ionicons name="cash" size={22} color={colors.success} />
              </LinearGradient>
              <Text style={[styles.statNumber, { color: colors.text }]}>
                {formatPrice(stats.totalSpent)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Dépensé
              </Text>
            </View>
          </Animated.View>

          {/* Statistiques supplémentaires */}
          <View
            style={[styles.extraStats, { backgroundColor: colors.surface }]}
          >
            <View style={styles.extraStatItem}>
              <Ionicons name="star" size={18} color="#FFD700" />
              <Text style={[styles.extraStatValue, { color: colors.text }]}>
                {stats.averageRating.toFixed(1)}
              </Text>
              <Text
                style={[styles.extraStatLabel, { color: colors.textSecondary }]}
              >
                Note
              </Text>
            </View>
            <View
              style={[
                styles.extraStatDivider,
                { backgroundColor: colors.border },
              ]}
            />
            <View style={styles.extraStatItem}>
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={colors.success}
              />
              <Text style={[styles.extraStatValue, { color: colors.text }]}>
                {stats.completedInterventions}
              </Text>
              <Text
                style={[styles.extraStatLabel, { color: colors.textSecondary }]}
              >
                Réussies
              </Text>
            </View>
          </View>

          {/* Bouton SOS */}
          <Animated.View
            style={[styles.sosWrapper, { transform: [{ scale: sosScale }] }]}
          >
            <TouchableOpacity
              style={styles.sosButton}
              onPress={handleSOSPress}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[colors.error, "#B71C1C"]}
                style={styles.sosGradient}
              >
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <View style={styles.sosIconContainer}>
                    <Ionicons name="alert-circle" size={64} color="#fff" />
                  </View>
                </Animated.View>
                <Text style={styles.sosText}>SOS URGENCE</Text>
                <Text style={styles.sosSubtext}>Appel d'urgence 24/7</Text>
                <View style={styles.sosBadge}>
                  <Text style={styles.sosBadgeText}>DISPONIBLE</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Actions rapides */}
          <View style={styles.quickActionsContainer}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Actions rapides
              </Text>
              <TouchableOpacity onPress={() => router.push("/diagnostic")}>
                <Text style={[styles.sectionLink, { color: colors.primary }]}>
                  Tout voir
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.quickActionsGrid}>
              {QUICK_ACTIONS.map((action, index) => (
                <Animated.View
                  key={action.id}
                  style={{
                    opacity: fadeAnim,
                    transform: [
                      {
                        translateY: slideAnim.interpolate({
                          inputRange: [0, 50],
                          outputRange: [0, 15 * (index + 1)],
                        }),
                      },
                    ],
                  }}
                >
                  <TouchableOpacity
                    style={[
                      styles.quickActionCard,
                      { backgroundColor: colors.surface },
                    ]}
                    onPress={() => handleQuickAction(action)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={action.gradient}
                      style={styles.quickActionIcon}
                    >
                      <Ionicons name={action.icon} size={28} color="#fff" />
                    </LinearGradient>
                    <Text
                      style={[styles.quickActionTitle, { color: colors.text }]}
                    >
                      {action.title}
                    </Text>
                    <Text
                      style={[
                        styles.quickActionDesc,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {action.description}
                    </Text>
                    {action.badge && (
                      <View
                        style={[
                          styles.actionBadge,
                          { backgroundColor: action.color + "20" },
                        ]}
                      >
                        <Text
                          style={[
                            styles.actionBadgeText,
                            { color: action.color },
                          ]}
                        >
                          {action.badge}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </View>

          {/* Dernières interventions */}
          <View style={styles.recentContainer}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Dernières interventions
              </Text>
              {stats.recentInterventions.length > 0 && (
                <TouchableOpacity onPress={() => router.push("/history")}>
                  <Text style={[styles.sectionLink, { color: colors.primary }]}>
                    Voir tout
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {stats.recentInterventions.length > 0 ? (
              stats.recentInterventions.map((intervention, index) => {
                const statusConfig = getStatusConfig(intervention.status);
                const hasPrice =
                  intervention.pricing?.final && intervention.pricing.final > 0;
                return (
                  <Animated.View
                    key={intervention._id}
                    style={{
                      opacity: fadeAnim,
                      transform: [
                        {
                          translateY: slideAnim.interpolate({
                            inputRange: [0, 50],
                            outputRange: [0, 10 * (index + 1)],
                          }),
                        },
                      ],
                    }}
                  >
                    <TouchableOpacity
                      style={[
                        styles.recentCard,
                        { backgroundColor: colors.surface },
                      ]}
                      onPress={() =>
                        router.push(`/interventions/${intervention._id}`)
                      }
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.recentIcon,
                          { backgroundColor: statusConfig.bgColor },
                        ]}
                      >
                        <Ionicons
                          name={statusConfig.icon}
                          size={24}
                          color={statusConfig.color}
                        />
                      </View>
                      <View style={styles.recentInfo}>
                        <View style={styles.recentHeader}>
                          <Text
                            style={[styles.recentType, { color: colors.text }]}
                          >
                            {intervention.type === "sos"
                              ? "🚨 SOS Urgence"
                              : "🔧 Assistance"}
                          </Text>
                          <View
                            style={[
                              styles.recentStatus,
                              { backgroundColor: statusConfig.bgColor },
                            ]}
                          >
                            <Text
                              style={[
                                styles.recentStatusText,
                                { color: statusConfig.color },
                              ]}
                            >
                              {statusConfig.text}
                            </Text>
                          </View>
                        </View>
                        <Text
                          style={[
                            styles.recentDescription,
                            { color: colors.textSecondary },
                          ]}
                          numberOfLines={2}
                        >
                          {intervention.problem?.description ||
                            "Intervention sans description"}
                        </Text>
                        <View style={styles.recentFooter}>
                          <Text
                            style={[
                              styles.recentDate,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {formatDate(intervention.createdAt)}
                          </Text>
                          {hasPrice && (
                            <View style={styles.recentPrice}>
                              <Ionicons
                                name="cash-outline"
                                size={12}
                                color={colors.success}
                              />
                              <Text
                                style={[
                                  styles.recentPriceText,
                                  { color: colors.success },
                                ]}
                              >
                                {formatPrice(intervention.pricing!.final)}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </Animated.View>
                );
              })
            ) : (
              <Animated.View
                style={[
                  styles.emptyRecent,
                  { backgroundColor: colors.surface },
                  { opacity: fadeAnim },
                ]}
              >
                <Ionicons
                  name="time-outline"
                  size={56}
                  color={colors.textSecondary}
                />
                <Text style={[styles.emptyRecentTitle, { color: colors.text }]}>
                  Aucune intervention
                </Text>
                <Text
                  style={[
                    styles.emptyRecentText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Utilisez SOS ou Diagnostic pour commencer
                </Text>
                <TouchableOpacity
                  style={[
                    styles.emptyRecentButton,
                    { backgroundColor: colors.error },
                  ]}
                  onPress={() => router.push("/sos")}
                >
                  <Text style={styles.emptyRecentButtonText}>SOS Urgence</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>

          {/* Tips de sécurité */}
          <Animated.View
            style={[
              styles.tipCard,
              { backgroundColor: colors.surface },
              { opacity: fadeAnim },
            ]}
          >
            <LinearGradient
              colors={[colors.primary + "10", colors.secondary + "05"]}
              style={styles.tipGradient}
            >
              <View style={styles.tipHeader}>
                <View
                  style={[
                    styles.tipIcon,
                    { backgroundColor: colors.primary + "15" },
                  ]}
                >
                  <Ionicons name="bulb" size={22} color={colors.primary} />
                </View>
                <Text style={[styles.tipTitle, { color: colors.text }]}>
                  Astuce sécurité
                </Text>
              </View>
              <Animated.View
                style={[
                  styles.tipContent,
                  {
                    opacity: tipFadeAnim,
                    transform: [{ translateY: tipTranslateAnim }],
                  },
                ]}
              >
                <View
                  style={[
                    styles.tipIconSmall,
                    { backgroundColor: TIPS[currentTipIndex].color + "20" },
                  ]}
                >
                  <Ionicons
                    name={TIPS[currentTipIndex].icon}
                    size={20}
                    color={TIPS[currentTipIndex].color}
                  />
                </View>
                <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                  {TIPS[currentTipIndex].text}
                </Text>
              </Animated.View>
              <View style={styles.tipDots}>
                {TIPS.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.tipDot,
                      {
                        backgroundColor:
                          index === currentTipIndex
                            ? colors.primary
                            : colors.border,
                        width: index === currentTipIndex ? 24 : 8,
                      },
                    ]}
                  />
                ))}
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Version app */}
          <Text style={[styles.versionText, { color: colors.textSecondary }]}>
            Kadima Road v1.0.0
          </Text>
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
}

// ============================================
// STYLES
// ============================================

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
  loadingText: { fontSize: 14 },
  scrollContent: { flexGrow: 1, paddingBottom: 30 },
  decorativeCircle: {
    position: "absolute",
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
  },
  circle1: { top: -width * 0.2, right: -width * 0.2 },
  circle2: { bottom: -height * 0.3, left: -width * 0.3 },
  content: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  greeting: { fontSize: 14, marginBottom: 4 },
  userName: { fontSize: 26, fontWeight: "bold" },
  profileButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileGradient: { flex: 1, justifyContent: "center", alignItems: "center" },
  profileImage: { width: 52, height: 52, borderRadius: 26 },
  profileInitial: { color: "#fff", fontSize: 22, fontWeight: "bold" },
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
  weatherIconImage: { width: 60, height: 60 },
  weatherDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  weatherDetail: { flexDirection: "row", alignItems: "center", gap: 6 },
  weatherDetailText: { fontSize: 12 },
  weatherSkeleton: { marginBottom: 20, borderRadius: 24, overflow: "hidden" },
  weatherSkeletonContent: { padding: 20, alignItems: "center", gap: 8 },
  weatherSkeletonText: { fontSize: 12 },
  weatherError: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  weatherErrorText: { fontSize: 14 },
  // Statistiques
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statNumber: { fontSize: 18, fontWeight: "bold", marginBottom: 2 },
  statLabel: { fontSize: 11 },
  extraStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  extraStatItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  extraStatValue: { fontSize: 15, fontWeight: "600" },
  extraStatLabel: { fontSize: 11 },
  extraStatDivider: { width: 1, height: 24 },
  // SOS
  sosWrapper: { marginBottom: 32 },
  sosButton: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#E63946",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  sosGradient: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  sosIconContainer: { marginBottom: 16 },
  sosText: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "bold",
    letterSpacing: 2,
    marginBottom: 6,
  },
  sosSubtext: { color: "#fff", fontSize: 14, opacity: 0.9 },
  sosBadge: {
    position: "absolute",
    top: 16,
    right: 20,
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  sosBadgeText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  // Actions rapides
  quickActionsContainer: { marginBottom: 32 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold" },
  sectionLink: { fontSize: 13, fontWeight: "500" },
  quickActionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  quickActionCard: {
    width: (width - 52) / 2,
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  quickActionTitle: { fontSize: 15, fontWeight: "600", marginBottom: 4 },
  quickActionDesc: { fontSize: 11, textAlign: "center" },
  actionBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  actionBadgeText: { fontSize: 9, fontWeight: "bold" },
  // Interventions
  recentContainer: { marginBottom: 24 },
  recentCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 20,
    marginBottom: 10,
    alignItems: "center",
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recentIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  recentInfo: { flex: 1 },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  recentType: { fontSize: 14, fontWeight: "600" },
  recentStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  recentStatusText: { fontSize: 9, fontWeight: "600" },
  recentDescription: { fontSize: 12, marginBottom: 6 },
  recentFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  recentDate: { fontSize: 11 },
  recentPrice: { flexDirection: "row", alignItems: "center", gap: 4 },
  recentPriceText: { fontSize: 11, fontWeight: "600" },
  emptyRecent: { padding: 40, borderRadius: 20, alignItems: "center", gap: 12 },
  emptyRecentTitle: { fontSize: 16, fontWeight: "600" },
  emptyRecentText: { fontSize: 13, textAlign: "center" },
  emptyRecentButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 25,
    marginTop: 8,
  },
  emptyRecentButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  // Tips
  tipCard: {
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tipGradient: { padding: 20 },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  tipIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  tipTitle: { fontSize: 16, fontWeight: "600" },
  tipContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 70,
  },
  tipIconSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  tipText: { fontSize: 14, lineHeight: 20, flex: 1 },
  tipDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
  },
  tipDot: { height: 6, borderRadius: 3 },
  versionText: {
    textAlign: "center",
    fontSize: 11,
    marginTop: 24,
    marginBottom: 20,
  },
});
