// app/(tabs)/profile.tsx - Version originale, sans modifications

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  StatusBar,
  Dimensions,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { Colors } from "@/constants/theme";
import { useProfileData } from "../../hooks/useProfileData";
import {
  ProfileHeader,
  PersonalInfoCard,
  MainVehicleCard,
  RecentInterventionsCard,
  QuickActions,
  ProfilePhotoModal,
} from "../../components/profile";

const { width, height } = Dimensions.get("window");

export default function ProfileScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];

  const {
    userDetails,
    loading,
    refreshing,
    uploadingPhoto,
    photoModalVisible,
    setPhotoModalVisible,
    onRefresh,
    handlePickImage,
    handleTakePhoto,
    handleDeletePhoto,
    getTotalDistance,
    getBadges,
  } = useProfileData();

  if (loading && !refreshing) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Chargement...
          </Text>
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <ProfileHeader
          userDetails={userDetails}
          uploadingPhoto={uploadingPhoto}
          onPhotoPress={() => setPhotoModalVisible(true)}
          totalDistance={getTotalDistance()}
          badges={getBadges()}
        />

        <View style={styles.contentContainer}>
          <PersonalInfoCard userDetails={userDetails} />
          <MainVehicleCard
            userDetails={userDetails}
            onPress={() => router.push("/vehicles")}
          />
          <RecentInterventionsCard
            interventions={userDetails?.recentInterventions || []}
          />
          <QuickActions onLogout={logout} />
        </View>
      </ScrollView>

      <ProfilePhotoModal
        visible={photoModalVisible}
        onClose={() => setPhotoModalVisible(false)}
        onTakePhoto={handleTakePhoto}
        onPickImage={handlePickImage}
        onDeletePhoto={handleDeletePhoto}
        hasPhoto={!!userDetails?.photo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContent: {
    alignItems: "center",
    gap: 20,
  },
  loadingText: {
    fontSize: 14,
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 30,
    gap: 16,
  },
});
