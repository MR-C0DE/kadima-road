// helpers/components/missions/details/MissionInfoCard.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

const { width, height } = Dimensions.get("window");

interface MissionInfoCardProps {
  mission: {
    client: { firstName: string; lastName: string; phone: string };
    problem: { description: string };
    location: { address: string };
    vehicle?: {
      make: string;
      model: string;
      year: number;
      licensePlate: string;
      color?: string;
      fuelType?: string;
      history?: {
        lastIntervention?: {
          date: string;
          type: string;
          description: string;
        };
        recentInterventions?: Array<{
          date: string;
          type: string;
          description: string;
        }>;
        nextMaintenance?: {
          type: string;
          dueKm: number;
          currentKm: number;
        };
        alerts?: string[];
        currentMileage?: number;
      };
    };
    distance?: number;
  };
  statusConfig: { label: string; bgColor: string; color: string };
  colors: any;
  colorScheme: string | null;
  onCallPress: () => void;
}

export const MissionInfoCard = ({
  mission,
  statusConfig,
  colors,
  colorScheme,
  onCallPress,
}: MissionInfoCardProps) => {
  const [historyModalVisible, setHistoryModalVisible] = useState(false);

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return "Non disponible";
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(
        6,
        10
      )}`;
    }
    if (cleaned.length === 11 && cleaned.startsWith("1")) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(
        4,
        7
      )}-${cleaned.slice(7, 11)}`;
    }
    return phone;
  };

  const getVehicleDisplay = () => {
    if (!mission.vehicle) return null;
    const { make, model, year, licensePlate, color, fuelType } =
      mission.vehicle;
    const vehicleName = `${make} ${model}${year ? ` (${year})` : ""}`;
    const details = [];
    if (color) details.push(color);
    if (fuelType) {
      const fuelMap: Record<string, string> = {
        essence: "Essence",
        diesel: "Diesel",
        electrique: "Électrique",
        hybride: "Hybride",
      };
      details.push(fuelMap[fuelType] || fuelType);
    }
    return {
      name: vehicleName,
      licensePlate: licensePlate,
      details: details.join(" • "),
    };
  };

  const vehicleInfo = getVehicleDisplay();
  const history = mission.vehicle?.history;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInterventionIcon = (
    type: string
  ): keyof typeof Ionicons.glyphMap => {
    const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
      battery: "battery-dead",
      tire: "car",
      fuel: "water",
      towing: "construct",
      lockout: "key",
      diagnostic: "medkit",
      jumpstart: "flash",
      minor_repair: "build",
      sos: "alert-circle",
      assistance: "help-circle",
    };
    return icons[type] || "construct";
  };

  const getInterventionColor = (type: string): string => {
    const colorsMap: Record<string, string> = {
      battery: "#FF6B6B",
      tire: "#4ECDC4",
      fuel: "#45B7D1",
      towing: "#96CEB4",
      lockout: "#FFEAA7",
      diagnostic: "#DDA0DD",
      jumpstart: "#FFD93D",
      minor_repair: "#6C5B7B",
      sos: "#EF4444",
      assistance: "#3B82F6",
    };
    return colorsMap[type] || "#6B7280";
  };

  const hasHistory =
    history &&
    (history.lastIntervention ||
      history.alerts ||
      history.currentMileage ||
      (history.recentInterventions && history.recentInterventions.length > 0));

  // Les 3 dernières interventions (pour l'affichage rapide)
  const recentInterventions = history?.recentInterventions?.slice(0, 3) || [];

  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        {/* ============================================
            1. CLIENT + STATUT + BOUTON APPEL
        ============================================ */}
        <View style={styles.headerRow}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>
              {mission.client.firstName?.[0] ?? "?"}
              {mission.client.lastName?.[0] ?? ""}
            </Text>
          </LinearGradient>

          <View style={styles.clientInfo}>
            <Text style={[styles.clientName, { color: colors.text }]}>
              {mission.client.firstName ?? ""} {mission.client.lastName ?? ""}
            </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusConfig.bgColor },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: statusConfig.color },
                ]}
              />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.callButton, { backgroundColor: colors.success }]}
            onPress={onCallPress}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.success, colors.success + "CC"]}
              style={styles.callGradient}
            >
              <Ionicons name="call" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ============================================
            2. PROBLÈME
        ============================================ */}
        {mission.problem?.description ? (
          <View style={styles.problemRow}>
            <Ionicons
              name="alert-circle-outline"
              size={16}
              color={colors.primary}
            />
            <Text
              style={[styles.problemText, { color: colors.textSecondary }]}
              numberOfLines={2}
            >
              {mission.problem.description}
            </Text>
          </View>
        ) : null}

        {/* ============================================
            3. ADRESSE
        ============================================ */}
        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={16} color={colors.primary} />
          <Text
            style={[styles.addressText, { color: colors.text }]}
            numberOfLines={2}
          >
            {mission.location?.address ?? "Adresse non disponible"}
          </Text>
        </View>

        {/* ============================================
            4. TÉLÉPHONE + DISTANCE (en ligne)
        ============================================ */}
        <View style={styles.infoRow}>
          <View style={styles.phoneRow}>
            <Ionicons
              name="call-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={[styles.phoneText, { color: colors.textSecondary }]}>
              {formatPhoneNumber(mission.client.phone)}
            </Text>
          </View>

          {mission.distance !== undefined && mission.distance !== null && (
            <View style={styles.distanceRow}>
              <Ionicons
                name="navigate-outline"
                size={14}
                color={colors.primary}
              />
              <Text
                style={[styles.distanceText, { color: colors.textSecondary }]}
              >
                {mission.distance.toFixed(1)} km
              </Text>
            </View>
          )}
        </View>

        {/* ============================================
            5. VÉHICULE (avec icône dossier pour l'historique)
        ============================================ */}
        {vehicleInfo && (
          <View style={styles.vehicleSection}>
            <LinearGradient
              colors={[colors.primary + "10", colors.secondary + "05"]}
              style={styles.vehicleCard}
            >
              <View style={styles.vehicleHeader}>
                <LinearGradient
                  colors={[colors.primary + "20", colors.primary + "10"]}
                  style={styles.vehicleIcon}
                >
                  <Ionicons
                    name="car-outline"
                    size={18}
                    color={colors.primary}
                  />
                </LinearGradient>
                <Text style={[styles.vehicleTitle, { color: colors.text }]}>
                  Véhicule
                </Text>

                {/* Icône dossier pour ouvrir l'historique */}
                {hasHistory && (
                  <TouchableOpacity
                    style={styles.historyIconButton}
                    onPress={() => setHistoryModalVisible(true)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={[colors.primary + "15", colors.secondary + "08"]}
                      style={styles.historyIconBg}
                    >
                      <Ionicons
                        name="folder-open-outline"
                        size={16}
                        color={colors.primary}
                      />
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={[styles.vehicleName, { color: colors.text }]}>
                {vehicleInfo.name}
              </Text>

              {vehicleInfo.licensePlate && (
                <View style={styles.licensePlateRow}>
                  <Ionicons
                    name="qr-code-outline"
                    size={14}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.licensePlate, { color: colors.primary }]}
                  >
                    {vehicleInfo.licensePlate.toUpperCase()}
                  </Text>
                </View>
              )}

              {vehicleInfo.details && (
                <Text
                  style={[
                    styles.vehicleDetails,
                    { color: colors.textSecondary },
                  ]}
                >
                  {vehicleInfo.details}
                </Text>
              )}

              {/* Résumé rapide de l'historique (kilométrage + 3 dernières interventions) */}
              {history && (
                <View style={styles.vehicleHistorySummary}>
                  {/* Kilométrage */}
                  {history.currentMileage !== undefined && (
                    <View style={styles.mileageBadge}>
                      <Ionicons
                        name="speedometer-outline"
                        size={12}
                        color={colors.primary}
                      />
                      <Text
                        style={[
                          styles.mileageText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {history.currentMileage.toLocaleString()} km
                      </Text>
                    </View>
                  )}

                  {/* 3 dernières interventions */}
                  {recentInterventions.length > 0 && (
                    <View style={styles.recentInterventions}>
                      <Text
                        style={[
                          styles.recentInterventionsTitle,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Dernières interventions
                      </Text>
                      {recentInterventions.map((intervention, index) => (
                        <View key={index} style={styles.recentInterventionItem}>
                          <LinearGradient
                            colors={[
                              getInterventionColor(intervention.type) + "20",
                              getInterventionColor(intervention.type) + "10",
                            ]}
                            style={styles.recentInterventionIcon}
                          >
                            <Ionicons
                              name={getInterventionIcon(intervention.type)}
                              size={10}
                              color={getInterventionColor(intervention.type)}
                            />
                          </LinearGradient>
                          <Text
                            style={[
                              styles.recentInterventionText,
                              { color: colors.textSecondary },
                            ]}
                            numberOfLines={1}
                          >
                            {intervention.description}
                          </Text>
                          <Text
                            style={[
                              styles.recentInterventionDate,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {formatDate(intervention.date)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </LinearGradient>
          </View>
        )}
      </View>

      {/* ============================================
          MODAL D'HISTORIQUE COMPLET DU VÉHICULE
      ============================================ */}
      <Modal
        visible={historyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setHistoryModalVisible(false)}
      >
        <BlurView intensity={90} tint={colorScheme} style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setHistoryModalVisible(false)}
            activeOpacity={1}
          />

          <View style={[styles.historyModal, { backgroundColor: colors.card }]}>
            <LinearGradient
              colors={[colors.primary + "10", colors.secondary + "05"]}
              style={styles.historyModalGradient}
            >
              {/* En-tête du modal */}
              <View style={styles.historyModalHeader}>
                <View style={styles.historyModalTitleContainer}>
                  <LinearGradient
                    colors={[colors.primary + "20", colors.primary + "10"]}
                    style={styles.historyModalIcon}
                  >
                    <Ionicons
                      name="folder-open"
                      size={24}
                      color={colors.primary}
                    />
                  </LinearGradient>
                  <Text
                    style={[styles.historyModalTitle, { color: colors.text }]}
                  >
                    Dossier véhicule
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setHistoryModalVisible(false)}
                  style={styles.historyModalClose}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Informations générales du véhicule */}
                {vehicleInfo && (
                  <View style={styles.historyVehicleInfo}>
                    <View style={styles.historyVehicleHeader}>
                      <LinearGradient
                        colors={[
                          colors.primary + "20",
                          colors.secondary + "10",
                        ]}
                        style={styles.historyVehicleIcon}
                      >
                        <Ionicons name="car" size={28} color={colors.primary} />
                      </LinearGradient>
                      <View>
                        <Text
                          style={[
                            styles.historyVehicleName,
                            { color: colors.text },
                          ]}
                        >
                          {vehicleInfo.name}
                        </Text>
                        <Text
                          style={[
                            styles.historyVehiclePlate,
                            { color: colors.primary },
                          ]}
                        >
                          {vehicleInfo.licensePlate?.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    {vehicleInfo.details && (
                      <Text
                        style={[
                          styles.historyVehicleDetails,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {vehicleInfo.details}
                      </Text>
                    )}
                  </View>
                )}

                {/* Kilométrage */}
                {history?.currentMileage !== undefined && (
                  <View style={styles.historySection}>
                    <View style={styles.historySectionHeader}>
                      <Ionicons
                        name="speedometer-outline"
                        size={18}
                        color={colors.primary}
                      />
                      <Text
                        style={[
                          styles.historySectionTitle,
                          { color: colors.text },
                        ]}
                      >
                        Kilométrage
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.historyMileageCard,
                        { backgroundColor: colors.background },
                      ]}
                    >
                      <Text
                        style={[
                          styles.historyMileageValue,
                          { color: colors.primary },
                        ]}
                      >
                        {history.currentMileage.toLocaleString()} km
                      </Text>
                    </View>
                  </View>
                )}

                {/* Alertes */}
                {history?.alerts && history.alerts.length > 0 && (
                  <View style={styles.historySection}>
                    <View style={styles.historySectionHeader}>
                      <Ionicons
                        name="warning-outline"
                        size={18}
                        color={colors.error}
                      />
                      <Text
                        style={[
                          styles.historySectionTitle,
                          { color: colors.error },
                        ]}
                      >
                        Alertes
                      </Text>
                    </View>
                    {history.alerts.map((alert, index) => (
                      <View
                        key={index}
                        style={[
                          styles.historyAlertCard,
                          { backgroundColor: colors.error + "10" },
                        ]}
                      >
                        <Ionicons
                          name="alert-circle"
                          size={18}
                          color={colors.error}
                        />
                        <Text
                          style={[
                            styles.historyAlertText,
                            { color: colors.error },
                          ]}
                        >
                          {alert}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Dernière intervention */}
                {history?.lastIntervention && (
                  <View style={styles.historySection}>
                    <View style={styles.historySectionHeader}>
                      <Ionicons
                        name="construct-outline"
                        size={18}
                        color={colors.warning}
                      />
                      <Text
                        style={[
                          styles.historySectionTitle,
                          { color: colors.text },
                        ]}
                      >
                        Dernière intervention
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.historyInterventionCard,
                        { backgroundColor: colors.background },
                      ]}
                    >
                      <View style={styles.historyInterventionDate}>
                        <Ionicons
                          name="calendar-outline"
                          size={14}
                          color={colors.primary}
                        />
                        <Text
                          style={[
                            styles.historyInterventionDateText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {formatDateTime(history.lastIntervention.date)}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.historyInterventionDesc,
                          { color: colors.text },
                        ]}
                      >
                        {history.lastIntervention.description}
                      </Text>
                      <View style={styles.historyInterventionType}>
                        <LinearGradient
                          colors={[
                            getInterventionColor(
                              history.lastIntervention.type
                            ) + "20",
                            getInterventionColor(
                              history.lastIntervention.type
                            ) + "10",
                          ]}
                          style={styles.historyInterventionTypeBadge}
                        >
                          <Ionicons
                            name={getInterventionIcon(
                              history.lastIntervention.type
                            )}
                            size={12}
                            color={getInterventionColor(
                              history.lastIntervention.type
                            )}
                          />
                          <Text
                            style={[
                              styles.historyInterventionTypeText,
                              {
                                color: getInterventionColor(
                                  history.lastIntervention.type
                                ),
                              },
                            ]}
                          >
                            {history.lastIntervention.type.toUpperCase()}
                          </Text>
                        </LinearGradient>
                      </View>
                    </View>
                  </View>
                )}

                {/* Toutes les interventions récentes */}
                {history?.recentInterventions &&
                  history.recentInterventions.length > 0 && (
                    <View style={styles.historySection}>
                      <View style={styles.historySectionHeader}>
                        <Ionicons
                          name="time-outline"
                          size={18}
                          color={colors.primary}
                        />
                        <Text
                          style={[
                            styles.historySectionTitle,
                            { color: colors.text },
                          ]}
                        >
                          Historique des interventions
                        </Text>
                      </View>
                      {history.recentInterventions.map(
                        (intervention, index) => (
                          <View
                            key={index}
                            style={[
                              styles.historyRecentCard,
                              { backgroundColor: colors.background },
                            ]}
                          >
                            <View style={styles.historyRecentHeader}>
                              <LinearGradient
                                colors={[
                                  getInterventionColor(intervention.type) +
                                    "20",
                                  getInterventionColor(intervention.type) +
                                    "10",
                                ]}
                                style={styles.historyRecentIcon}
                              >
                                <Ionicons
                                  name={getInterventionIcon(intervention.type)}
                                  size={16}
                                  color={getInterventionColor(
                                    intervention.type
                                  )}
                                />
                              </LinearGradient>
                              <View style={styles.historyRecentInfo}>
                                <Text
                                  style={[
                                    styles.historyRecentDesc,
                                    { color: colors.text },
                                  ]}
                                >
                                  {intervention.description}
                                </Text>
                                <Text
                                  style={[
                                    styles.historyRecentDate,
                                    { color: colors.textSecondary },
                                  ]}
                                >
                                  {formatDate(intervention.date)}
                                </Text>
                              </View>
                            </View>
                          </View>
                        )
                      )}
                    </View>
                  )}

                {/* Prochain entretien */}
                {history?.nextMaintenance && (
                  <View style={styles.historySection}>
                    <View style={styles.historySectionHeader}>
                      <Ionicons
                        name="calendar-outline"
                        size={18}
                        color={colors.primary}
                      />
                      <Text
                        style={[
                          styles.historySectionTitle,
                          { color: colors.text },
                        ]}
                      >
                        Prochain entretien
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.historyMaintenanceCard,
                        { backgroundColor: colors.background },
                      ]}
                    >
                      <Text
                        style={[
                          styles.historyMaintenanceType,
                          { color: colors.primary },
                        ]}
                      >
                        {history.nextMaintenance.type}
                      </Text>
                      <Text
                        style={[
                          styles.historyMaintenanceKm,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Dans{" "}
                        {(
                          history.nextMaintenance.dueKm -
                          history.nextMaintenance.currentKm
                        ).toLocaleString()}{" "}
                        km
                      </Text>
                      <View style={styles.historyMaintenanceProgress}>
                        <View
                          style={[
                            styles.historyMaintenanceBar,
                            { backgroundColor: colors.border },
                          ]}
                        >
                          <View
                            style={[
                              styles.historyMaintenanceFill,
                              {
                                backgroundColor: colors.primary,
                                width: `${Math.min(
                                  100,
                                  (history.nextMaintenance.currentKm /
                                    history.nextMaintenance.dueKm) *
                                    100
                                )}%`,
                              },
                            ]}
                          />
                        </View>
                        <Text
                          style={[
                            styles.historyMaintenanceText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {history.nextMaintenance.currentKm.toLocaleString()} /{" "}
                          {history.nextMaintenance.dueKm.toLocaleString()} km
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </ScrollView>

              <TouchableOpacity
                style={[
                  styles.historyModalButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => setHistoryModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.historyModalButtonText}>Fermer</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </BlurView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 20,
    padding: 16,
    borderRadius: 24,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  callGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  problemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  problemText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  // Adresse seule
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  // Téléphone + Distance en ligne
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  phoneText: {
    fontSize: 12,
  },
  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: "500",
  },
  vehicleSection: {
    marginTop: 4,
  },
  vehicleCard: {
    padding: 12,
    borderRadius: 18,
    gap: 8,
  },
  vehicleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  vehicleIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  vehicleTitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    flex: 1,
  },
  historyIconButton: {
    marginLeft: "auto",
  },
  historyIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  vehicleName: {
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 36,
  },
  licensePlateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 36,
  },
  licensePlate: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  vehicleDetails: {
    fontSize: 12,
    marginLeft: 36,
  },
  vehicleHistorySummary: {
    marginTop: 8,
    marginLeft: 36,
    gap: 8,
  },
  mileageBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(0,0,0,0.03)",
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  mileageText: {
    fontSize: 10,
    fontWeight: "500",
  },
  recentInterventions: {
    gap: 6,
  },
  recentInterventionsTitle: {
    fontSize: 10,
    fontWeight: "500",
    marginBottom: 2,
  },
  recentInterventionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  recentInterventionIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  recentInterventionText: {
    flex: 1,
    fontSize: 11,
  },
  recentInterventionDate: {
    fontSize: 10,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  historyModal: {
    width: "90%",
    maxHeight: "85%",
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 20,
  },
  historyModalGradient: {
    padding: 20,
  },
  historyModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  historyModalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  historyModalIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  historyModalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  historyModalClose: {
    padding: 4,
  },
  historyVehicleInfo: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.02)",
  },
  historyVehicleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  historyVehicleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  historyVehicleName: {
    fontSize: 16,
    fontWeight: "600",
  },
  historyVehiclePlate: {
    fontSize: 12,
    fontWeight: "600",
  },
  historyVehicleDetails: {
    fontSize: 12,
    marginLeft: 60,
  },
  historySection: {
    marginBottom: 20,
  },
  historySectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  historySectionTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  historyMileageCard: {
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  historyMileageValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  historyAlertCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  historyAlertText: {
    fontSize: 13,
    flex: 1,
  },
  historyInterventionCard: {
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  historyInterventionDate: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  historyInterventionDateText: {
    fontSize: 12,
  },
  historyInterventionDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  historyInterventionType: {
    alignItems: "flex-start",
  },
  historyInterventionTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  historyInterventionTypeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  historyRecentCard: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  historyRecentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  historyRecentIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  historyRecentInfo: {
    flex: 1,
  },
  historyRecentDesc: {
    fontSize: 13,
    marginBottom: 2,
  },
  historyRecentDate: {
    fontSize: 11,
  },
  historyMaintenanceCard: {
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  historyMaintenanceType: {
    fontSize: 16,
    fontWeight: "600",
  },
  historyMaintenanceKm: {
    fontSize: 13,
  },
  historyMaintenanceProgress: {
    marginTop: 8,
  },
  historyMaintenanceBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  historyMaintenanceFill: {
    height: "100%",
    borderRadius: 3,
  },
  historyMaintenanceText: {
    fontSize: 11,
    marginTop: 6,
    textAlign: "center",
  },
  historyModalButton: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
  },
  historyModalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
