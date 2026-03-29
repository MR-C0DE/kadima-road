// helpers/components/missions/details/MissionMap.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";

const GOOGLE_MAPS_APIKEY = "AIzaSyDGpdR97HaU5KBE3yTSq_W7Lu5StXhJh1E";

interface MissionMapProps {
  clientLocation: { latitude: number; longitude: number };
  helperLocation?: { latitude: number; longitude: number } | null;
  mapRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  minimized: boolean;
  colors: any;
  onCalculateDistance: (distance: number) => void;
  onToggleMinimize: () => void;
}

export const MissionMap = ({
  clientLocation,
  helperLocation,
  mapRegion,
  minimized,
  colors,
  onCalculateDistance,
  onToggleMinimize,
}: MissionMapProps) => {
  const calculateDistance = (point1: any, point2: any) => {
    const R = 6371;
    const dLat = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const dLon = ((point2.longitude - point1.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((point1.latitude * Math.PI) / 180) *
        Math.cos((point2.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const distance = helperLocation
    ? calculateDistance(helperLocation, clientLocation)
    : null;

  // Carte réduite
  if (minimized) {
    return (
      <TouchableOpacity
        style={[styles.minimizedContainer, { backgroundColor: colors.card }]}
        onPress={onToggleMinimize}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={[colors.primary + "20", colors.secondary + "10"]}
          style={styles.minimizedGradient}
        >
          <View style={styles.minimizedContent}>
            <View style={styles.minimizedIconContainer}>
              <Ionicons name="map" size={20} color={colors.primary} />
            </View>
            <View style={styles.minimizedTextContainer}>
              <Text style={[styles.minimizedTitle, { color: colors.text }]}>
                Carte réduite
              </Text>
              <Text
                style={[
                  styles.minimizedSubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                Appuyez pour agrandir
              </Text>
            </View>
            <Ionicons name="expand" size={20} color={colors.primary} />
          </View>
          {distance && (
            <View
              style={[
                styles.minimizedDistance,
                { backgroundColor: colors.primary + "15" },
              ]}
            >
              <Ionicons name="navigate" size={14} color={colors.primary} />
              <Text
                style={[
                  styles.minimizedDistanceText,
                  { color: colors.primary },
                ]}
              >
                {distance.toFixed(1)} km
              </Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Carte normale (agrandie)
  return (
    <View style={[styles.mapCard, { backgroundColor: colors.card }]}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={mapRegion}
        showsUserLocation={true}
        followsUserLocation={true}
      >
        <Marker
          coordinate={clientLocation}
          title="Client"
          description="Position du client"
        >
          <View
            style={[styles.clientMarker, { backgroundColor: colors.error }]}
          >
            <Ionicons name="person" size={16} color="#fff" />
          </View>
        </Marker>

        {helperLocation && (
          <Marker coordinate={helperLocation} title="Votre position">
            <View
              style={[styles.helperMarker, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="car" size={16} color="#fff" />
            </View>
          </Marker>
        )}

        {helperLocation && (
          <MapViewDirections
            origin={helperLocation}
            destination={clientLocation}
            apikey={GOOGLE_MAPS_APIKEY}
            strokeWidth={4}
            strokeColor={colors.primary}
            optimizeWaypoints={true}
            onReady={(result) => {
              onCalculateDistance(result.distance);
            }}
            onError={(errorMessage) => {
              console.log("Erreur itinéraire:", errorMessage);
            }}
          />
        )}
      </MapView>

      <View style={styles.navigationInfo}>
        <View style={styles.navItem}>
          <Ionicons name="navigate" size={20} color={colors.primary} />
          <Text style={[styles.navText, { color: colors.text }]}>
            {distance ? `${distance.toFixed(1)} km` : "Calcul en cours..."}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.navButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            if (helperLocation) {
              const url = Platform.select({
                ios: `maps:?saddr=${helperLocation.latitude},${helperLocation.longitude}&daddr=${clientLocation.latitude},${clientLocation.longitude}`,
                android: `google.navigation:q=${clientLocation.latitude},${clientLocation.longitude}`,
              });
              if (url) Linking.openURL(url);
            }
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="map" size={18} color="#fff" />
          <Text style={styles.navButtonText}>Ouvrir dans Maps</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Styles carte normale
  mapCard: {
    marginHorizontal: 20,
    marginTop: 40, // ✅ ESPACE ENTRE HEADER ET CARTE
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  map: { height: 250, width: "100%" },
  clientMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  helperMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  navigationInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  navItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  navText: { fontSize: 14, fontWeight: "500" },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  navButtonText: { color: "#fff", fontSize: 13, fontWeight: "600" },

  // Styles carte réduite
  minimizedContainer: {
    marginHorizontal: 20,
    marginTop: 40, // ✅ ESPACE ENTRE HEADER ET CARTE RÉDUITE
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  minimizedGradient: {
    padding: 16,
  },
  minimizedContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  minimizedIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  minimizedTextContainer: {
    flex: 1,
  },
  minimizedTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  minimizedSubtitle: {
    fontSize: 12,
  },
  minimizedDistance: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    marginTop: 12,
  },
  minimizedDistanceText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
