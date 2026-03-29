// app/settings/support.tsx - Version design moderne

import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  StatusBar,
  Animated,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as MailComposer from "expo-mail-composer";

export default function SupportSettingsScreen() {
  const router = useRouter();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme ?? "light"];

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const itemsAnim = useRef(
    [1, 2, 3, 4].map(() => new Animated.Value(0))
  ).current;

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

    itemsAnim.forEach((anim, index) => {
      Animated.spring(anim, {
        toValue: 1,
        delay: 200 + index * 100,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const handleContactSupport = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const isAvailable = await MailComposer.isAvailableAsync();
    if (isAvailable) {
      await MailComposer.composeAsync({
        recipients: ["support@kadimaroad.com"],
        subject: "[Kadima Road] Demande d'assistance",
        body: `
Bonjour,

Je contacte le support concernant :

[Description de votre demande]

---
Application: Kadima Road
Version: 1.0.0
Plateforme: ${Platform.OS}
---
        `.trim(),
      });
    } else {
      Linking.openURL(
        "mailto:support@kadimaroad.com?subject=[Kadima Road] Demande d'assistance"
      );
    }
  };

  const handleReportProblem = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const isAvailable = await MailComposer.isAvailableAsync();
    if (isAvailable) {
      await MailComposer.composeAsync({
        recipients: ["support@kadimaroad.com"],
        subject: "[Kadima Road] Signalement de problème",
        body: `
Bonjour,

Je rencontre un problème avec l'application :

[Description du problème]

Étapes pour reproduire :
1. 
2. 
3. 

---
Application: Kadima Road
Version: 1.0.0
Plateforme: ${Platform.OS}
---
        `.trim(),
      });
    } else {
      Linking.openURL(
        "mailto:support@kadimaroad.com?subject=[Kadima Road] Signalement de problème"
      );
    }
  };

  const handleOpenFAQ = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL("https://kadimaroad.com/faq");
  };

  const handleOpenWebsite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL("https://kadimaroad.com");
  };

  const handleOpenInstagram = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL("https://instagram.com/kadimaroad");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Header avec gradient */}
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Aide et support</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        {/* Centre d'aide / FAQ */}
        <Animated.View
          style={[
            styles.menuItem,
            { backgroundColor: colors.surface },
            { transform: [{ scale: itemsAnim[0] }], opacity: itemsAnim[0] },
          ]}
        >
          <TouchableOpacity
            style={styles.menuItemContent}
            onPress={handleOpenFAQ}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[colors.primary + "20", colors.primary + "10"]}
              style={styles.menuIcon}
            >
              <Ionicons
                name="document-text-outline"
                size={22}
                color={colors.primary}
              />
            </LinearGradient>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>
                Centre d'aide
              </Text>
              <Text
                style={[styles.menuSubtitle, { color: colors.textSecondary }]}
              >
                FAQ, guides et tutoriels
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Contacter le support */}
        <Animated.View
          style={[
            styles.menuItem,
            { backgroundColor: colors.surface },
            { transform: [{ scale: itemsAnim[1] }], opacity: itemsAnim[1] },
          ]}
        >
          <TouchableOpacity
            style={styles.menuItemContent}
            onPress={handleContactSupport}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[colors.primary + "20", colors.primary + "10"]}
              style={styles.menuIcon}
            >
              <Ionicons name="mail-outline" size={22} color={colors.primary} />
            </LinearGradient>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>
                Contacter le support
              </Text>
              <Text
                style={[styles.menuSubtitle, { color: colors.textSecondary }]}
              >
                support@kadimaroad.com
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Signaler un problème */}
        <Animated.View
          style={[
            styles.menuItem,
            { backgroundColor: colors.surface },
            { transform: [{ scale: itemsAnim[2] }], opacity: itemsAnim[2] },
          ]}
        >
          <TouchableOpacity
            style={styles.menuItemContent}
            onPress={handleReportProblem}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[colors.warning + "20", colors.warning + "10"]}
              style={[
                styles.menuIcon,
                { backgroundColor: colors.warning + "10" },
              ]}
            >
              <Ionicons
                name="alert-circle-outline"
                size={22}
                color={colors.warning}
              />
            </LinearGradient>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>
                Signaler un problème
              </Text>
              <Text
                style={[styles.menuSubtitle, { color: colors.textSecondary }]}
              >
                Nous aider à améliorer l'application
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Site web */}
        <Animated.View
          style={[
            styles.menuItem,
            { backgroundColor: colors.surface },
            { transform: [{ scale: itemsAnim[3] }], opacity: itemsAnim[3] },
          ]}
        >
          <TouchableOpacity
            style={styles.menuItemContent}
            onPress={handleOpenWebsite}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[colors.primary + "20", colors.primary + "10"]}
              style={styles.menuIcon}
            >
              <Ionicons name="globe-outline" size={22} color={colors.primary} />
            </LinearGradient>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>
                Site web
              </Text>
              <Text
                style={[styles.menuSubtitle, { color: colors.textSecondary }]}
              >
                kadimaroad.com
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Instagram */}
        <Animated.View
          style={[
            styles.menuItem,
            { backgroundColor: colors.surface },
            { transform: [{ scale: itemsAnim[3] }], opacity: itemsAnim[3] },
          ]}
        >
          <TouchableOpacity
            style={styles.menuItemContent}
            onPress={handleOpenInstagram}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[colors.primary + "20", colors.primary + "10"]}
              style={styles.menuIcon}
            >
              <Ionicons
                name="logo-instagram"
                size={22}
                color={colors.primary}
              />
            </LinearGradient>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>
                Instagram
              </Text>
              <Text
                style={[styles.menuSubtitle, { color: colors.textSecondary }]}
              >
                @kadimaroad
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Note sur les délais de réponse */}
        <Animated.View
          style={[
            styles.noteCard,
            { backgroundColor: colors.surface },
            { transform: [{ scale: itemsAnim[3] }], opacity: itemsAnim[3] },
          ]}
        >
          <LinearGradient
            colors={[colors.primary + "05", colors.secondary + "02"]}
            style={styles.noteGradient}
          >
            <Ionicons name="time-outline" size={24} color={colors.primary} />
            <Text style={[styles.noteTitle, { color: colors.text }]}>
              Délais de réponse
            </Text>
            <Text style={[styles.noteText, { color: colors.textSecondary }]}>
              Notre équipe s'efforce de répondre à toutes les demandes dans un
              délai de 24 à 48 heures ouvrées.
            </Text>
          </LinearGradient>
        </Animated.View>

        <View style={styles.bottomSpace} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  menuItem: {
    borderRadius: 20,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
  },
  noteCard: {
    borderRadius: 20,
    marginTop: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  noteGradient: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  noteText: {
    fontSize: 12,
    flex: 2,
  },
  bottomSpace: {
    height: 20,
  },
});
