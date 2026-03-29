// app/vehicles/[id].tsx - Version avec micro-interactions et design cohérent

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Platform,
  Dimensions,
  ActivityIndicator,
  Alert,
  Share,
  Animated,
} from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../config/api";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import * as DocumentPicker from "expo-document-picker";
import {
  VehicleHeader,
  VehicleStats,
  VehicleDetails,
  VehicleInfoTab,
  VehicleLogsTab,
  VehicleNotesTab,
  VehicleDocumentsTab,
  VehicleModals,
} from "../../components/vehicle";

const { width } = Dimensions.get("window");

export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // États
  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "info" | "logs" | "notes" | "documents"
  >("info");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // États modales
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [mileageModalVisible, setMileageModalVisible] = useState(false);
  const [newMileage, setNewMileage] = useState("");
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [transferEmail, setTransferEmail] = useState("");
  const [transferPrice, setTransferPrice] = useState("");
  const [searchingUser, setSearchingUser] = useState(false);
  const [foundUser, setFoundUser] = useState<any>(null);
  const [transferring, setTransferring] = useState(false);

  // États documents
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [docProgress, setDocProgress] = useState<{ [key: string]: number }>({});

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
  }, []);

  const loadVehicle = useCallback(async () => {
    if (!id || id === "undefined") {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await api.get(`/vehicles/${id}`);
      setVehicle(response.data.data);
    } catch (error) {
      Alert.alert("Erreur", "Impossible de charger le véhicule", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, router]);

  useEffect(() => {
    loadVehicle();
  }, [loadVehicle]);

  useFocusEffect(
    useCallback(() => {
      loadVehicle();
    }, [loadVehicle])
  );

  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await loadVehicle();
  };

  // Notes
  const addNote = async () => {
    if (!noteText.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await api.post(`/vehicles/${id}/notes`, { text: noteText });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: "success",
        text1: "Note ajoutée",
        text2: "Votre note a été sauvegardée",
        position: "bottom",
      });
      setNoteModalVisible(false);
      setNoteText("");
      loadVehicle();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Impossible d'ajouter la note",
        position: "bottom",
      });
    }
  };

  // Kilométrage
  const updateMileage = async () => {
    const mileage = parseInt(newMileage);
    if (isNaN(mileage) || mileage <= (vehicle?.currentMileage || 0)) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Le kilométrage doit être supérieur",
        position: "bottom",
      });
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await api.put(`/vehicles/${id}/mileage`, { mileage, source: "user" });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: "success",
        text1: "Kilométrage mis à jour",
        text2: `${newMileage} km enregistrés`,
        position: "bottom",
      });
      setMileageModalVisible(false);
      setNewMileage("");
      loadVehicle();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Impossible de mettre à jour",
        position: "bottom",
      });
    }
  };

  // Analyse IA
  const analyzeVehicle = async () => {
    setIsAnalyzing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const response = await api.post(`/vehicles/${id}/analyze`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: "success",
        text1: "✨ Analyse IA",
        text2: `Score de fiabilité: ${response.data.data.reliabilityScore}%`,
        position: "bottom",
      });
      loadVehicle();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Impossible d'analyser le véhicule",
        position: "bottom",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Partage
  const shareVehicle = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `🚗 ${vehicle?.make} ${vehicle?.model} (${
          vehicle?.year
        })\n📋 ${vehicle?.licensePlate}\n📊 ${(
          vehicle?.currentMileage || 0
        ).toLocaleString()} km\n🔧 Fiabilité: ${
          vehicle?.aiProfile?.reliabilityScore || 100
        }%`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  // Documents
  const pickDocument = async (docType: string, docTitle: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/jpeg", "image/png"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      setUploadingDoc(docType);
      const formData = new FormData();
      formData.append("document", {
        uri: result.assets[0].uri,
        type: result.assets[0].mimeType || "application/octet-stream",
        name: result.assets[0].name || "document.pdf",
      } as any);
      formData.append("type", docType);
      formData.append("title", docTitle);
      await api.post(`/vehicles/${id}/documents`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: "success",
        text1: "Document ajouté",
        text2: `${docTitle} a été ajouté avec succès`,
        position: "bottom",
      });
      loadVehicle();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: error.response?.data?.message || "Upload impossible",
        position: "bottom",
      });
    } finally {
      setUploadingDoc(null);
    }
  };

  const deleteDocument = async (docId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      "Supprimer le document",
      "Voulez-vous vraiment supprimer ce document ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/vehicles/${id}/documents/${docId}`);
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
              Toast.show({
                type: "success",
                text1: "Document supprimé",
                text2: "Le document a été retiré",
                position: "bottom",
              });
              loadVehicle();
            } catch (error) {
              Toast.show({
                type: "error",
                text1: "Erreur",
                text2: "Impossible de supprimer",
                position: "bottom",
              });
            }
          },
        },
      ]
    );
  };

  const openDocument = async (fileUrl: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const { Linking } = require("react-native");
      await Linking.openURL(fileUrl);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Impossible d'ouvrir le document",
        position: "bottom",
      });
    }
  };

  // Transfert
  const searchUser = async () => {
    if (!transferEmail.trim()) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Email requis",
        position: "bottom",
      });
      return;
    }
    setSearchingUser(true);
    try {
      const response = await api.get(`/users/search?email=${transferEmail}`);
      if (response.data.data) {
        setFoundUser(response.data.data);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Toast.show({
          type: "success",
          text1: "Utilisateur trouvé",
          text2: `${response.data.data.firstName} ${response.data.data.lastName}`,
          position: "bottom",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Non trouvé",
          text2: "Aucun utilisateur avec cet email",
          position: "bottom",
        });
        setFoundUser(null);
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Utilisateur non trouvé",
        position: "bottom",
      });
      setFoundUser(null);
    } finally {
      setSearchingUser(false);
    }
  };

  const handleTransfer = async () => {
    if (!foundUser) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Veuillez trouver un utilisateur",
        position: "bottom",
      });
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "⚠️ Confirmer le transfert",
      `Transférer ${vehicle?.make} ${vehicle?.model} à ${foundUser.firstName} ${foundUser.lastName} ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Transférer",
          style: "destructive",
          onPress: async () => {
            setTransferring(true);
            try {
              await api.post(`/vehicles/${id}/transfer`, {
                newOwnerId: foundUser._id,
                price: parseFloat(transferPrice) || undefined,
              });
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
              Toast.show({
                type: "success",
                text1: "Véhicule transféré",
                text2: "Le véhicule a changé de propriétaire",
                position: "bottom",
              });
              setTimeout(() => router.replace("/vehicles"), 1500);
            } catch (error: any) {
              Toast.show({
                type: "error",
                text1: "Erreur",
                text2: error.response?.data?.message || "Échec du transfert",
                position: "bottom",
              });
            } finally {
              setTransferring(false);
              setTransferModalVisible(false);
            }
          },
        },
      ]
    );
  };

  const isCurrentOwner = vehicle?.owners?.some(
    (o: any) => o.user?._id === user?.id && o.isCurrent
  );

  if (loading) {
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
          Chargement du véhicule...
        </Text>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!vehicle) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.errorContainer}>
          <LinearGradient
            colors={[colors.error + "20", colors.error + "10"]}
            style={styles.errorIcon}
          >
            <Ionicons name="alert-circle" size={60} color={colors.error} />
          </LinearGradient>
          <Text style={[styles.errorText, { color: colors.error }]}>
            Véhicule non trouvé
          </Text>
          <TouchableOpacity
            style={[styles.errorButton, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.errorButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      <VehicleHeader
        vehicle={vehicle}
        isCurrentOwner={isCurrentOwner}
        onEdit={() => router.push(`/vehicles/edit/${id}`)}
      />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        style={{ opacity: fadeAnim }}
      >
        <VehicleStats
          vehicle={vehicle}
          isCurrentOwner={isCurrentOwner}
          onMileageUpdate={() => setMileageModalVisible(true)}
          onAnalyze={analyzeVehicle}
          onShare={shareVehicle}
          onTransfer={() => setTransferModalVisible(true)}
          isAnalyzing={isAnalyzing}
        />

        <VehicleDetails vehicle={vehicle} />

        {/* Tabs avec animation d'indicateur */}
        <View style={styles.tabsContainer}>
          {(["info", "logs", "notes", "documents"] as const).map((tab) => {
            const isActive = activeTab === tab;
            const getIcon = () => {
              switch (tab) {
                case "info":
                  return "information-circle-outline";
                case "logs":
                  return "time-outline";
                case "notes":
                  return "document-text-outline";
                case "documents":
                  return "folder-outline";
              }
            };
            const getLabel = () => {
              switch (tab) {
                case "info":
                  return "Infos";
                case "logs":
                  return "Journal";
                case "notes":
                  return "Notes";
                case "documents":
                  return "Docs";
              }
            };
            const getCount = () => {
              switch (tab) {
                case "notes":
                  return vehicle.notes?.length;
                case "documents":
                  return vehicle.documents?.length;
                default:
                  return null;
              }
            };
            const count = getCount();

            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveTab(tab);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.tabContent}>
                  <Ionicons
                    name={getIcon()}
                    size={18}
                    color={isActive ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.tabText,
                      {
                        color: isActive ? colors.primary : colors.textSecondary,
                      },
                    ]}
                  >
                    {getLabel()}
                  </Text>
                  {count !== undefined && count > 0 && (
                    <View
                      style={[
                        styles.tabBadge,
                        { backgroundColor: colors.primary + "15" },
                      ]}
                    >
                      <Text
                        style={[styles.tabBadgeText, { color: colors.primary }]}
                      >
                        {count}
                      </Text>
                    </View>
                  )}
                </View>
                {isActive && (
                  <View
                    style={[
                      styles.tabUnderline,
                      { backgroundColor: colors.primary },
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Contenu des onglets */}
        <View style={styles.tabContentContainer}>
          {activeTab === "info" && <VehicleInfoTab vehicle={vehicle} />}
          {activeTab === "logs" && <VehicleLogsTab logs={vehicle.logs || []} />}
          {activeTab === "notes" && (
            <VehicleNotesTab
              notes={vehicle.notes || []}
              isCurrentOwner={isCurrentOwner}
              onAddNote={() => setNoteModalVisible(true)}
            />
          )}
          {activeTab === "documents" && (
            <VehicleDocumentsTab
              documents={vehicle.documents || []}
              isCurrentOwner={isCurrentOwner}
              onUpload={pickDocument}
              onDelete={deleteDocument}
              onOpen={openDocument}
              uploadingDoc={uploadingDoc}
              docProgress={docProgress}
            />
          )}
        </View>

        <View style={styles.bottomSpace} />
      </Animated.ScrollView>

      <VehicleModals
        noteModalVisible={noteModalVisible}
        setNoteModalVisible={setNoteModalVisible}
        noteText={noteText}
        setNoteText={setNoteText}
        onAddNote={addNote}
        mileageModalVisible={mileageModalVisible}
        setMileageModalVisible={setMileageModalVisible}
        newMileage={newMileage}
        setNewMileage={setNewMileage}
        currentMileage={vehicle.currentMileage}
        onUpdateMileage={updateMileage}
        transferModalVisible={transferModalVisible}
        setTransferModalVisible={setTransferModalVisible}
        transferEmail={transferEmail}
        setTransferEmail={setTransferEmail}
        transferPrice={transferPrice}
        setTransferPrice={setTransferPrice}
        foundUser={foundUser}
        onSearchUser={searchUser}
        searchingUser={searchingUser}
        onTransfer={handleTransfer}
        transferring={transferring}
        vehicle={vehicle}
      />

      <Toast />
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
  loadingText: { fontSize: 14 },
  scrollContent: { padding: 16, paddingBottom: 30 },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    padding: 20,
  },
  errorIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: { fontSize: 16, textAlign: "center" },
  errorButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 25 },
  errorButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  tabsContainer: {
    flexDirection: "row",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    position: "relative",
  },
  tabActive: {},
  tabContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "500",
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 4,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  tabUnderline: {
    position: "absolute",
    bottom: -1,
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 1,
  },
  tabContentContainer: {
    flex: 1,
  },
  bottomSpace: {
    height: 20,
  },
});
