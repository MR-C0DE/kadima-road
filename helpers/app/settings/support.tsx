// helpers/app/settings/support.tsx
// Écran d'aide et support - Centre d'aide, contact, FAQ

import React, { useRef, useEffect, useState } from "react";
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
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as MailComposer from "expo-mail-composer";
import Toast from "react-native-toast-message";

const { width } = Dimensions.get("window"); // ← AJOUTER CETTE LIGNE

// ============================================
// OPTIONS DE SUPPORT
// ============================================

const SUPPORT_OPTIONS = [
  {
    id: "faq",
    title: "Centre d'aide",
    icon: "document-text-outline",
    description: "FAQ, guides et tutoriels",
    color: "#3B82F6",
    action: "faq",
  },
  {
    id: "contact",
    title: "Contacter le support",
    icon: "mail-outline",
    description: "support@moxtor.com",
    color: "#8B5CF6",
    action: "email",
  },
  {
    id: "report",
    title: "Signaler un problème",
    icon: "alert-circle-outline",
    description: "Nous aider à améliorer l'application",
    color: "#F59E0B",
    action: "report",
  },
  {
    id: "whatsapp",
    title: "WhatsApp",
    icon: "logo-whatsapp",
    description: "Support rapide 7j/7",
    color: "#22C55E",
    action: "whatsapp",
  },
  {
    id: "website",
    title: "Site web",
    icon: "globe-outline",
    description: "moxtor.com",
    color: "#06B6D4",
    action: "website",
  },
  {
    id: "instagram",
    title: "Instagram",
    icon: "logo-instagram",
    description: "@moxtor_helpers",
    color: "#EC4899",
    action: "instagram",
  },
];

// ============================================
// FAQ ITEMS
// ============================================

const FAQ_ITEMS = [
  {
    id: "1",
    question: "Comment devenir helper ?",
    answer:
      "Inscrivez-vous via l'application, complétez votre profil avec vos services, équipement et documents, puis attendez la validation de notre équipe.",
  },
  {
    id: "2",
    question: "Comment sont calculés mes gains ?",
    answer:
      "Vos gains sont calculés selon vos tarifs : prix de base + frais kilométriques. Vous pouvez définir vos tarifs dans les paramètres.",
  },
  {
    id: "3",
    question: "Quand suis-je payé ?",
    answer:
      "Les paiements sont traités sous 48h après la fin de l'intervention, directement sur votre compte bancaire.",
  },
  {
    id: "4",
    question: "Que faire en cas de problème avec un client ?",
    answer:
      "Contactez notre support immédiatement via l'application ou par email à support@moxtor.com.",
  },
  {
    id: "5",
    question: "Puis-je refuser une mission ?",
    answer:
      "Oui, vous pouvez refuser une mission. Cependant, un taux de refus élevé peut affecter votre visibilité.",
  },
];

// ============================================
// COMPOSANT FAQ ITEM
// ============================================

const FAQItem = ({
  item,
  colors,
  isExpanded,
  onToggle,
  index,
}: {
  item: any;
  colors: any;
  isExpanded: boolean;
  onToggle: () => void;
  index: number;
}) => {
  const rotateAnim = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;
  const heightAnim = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.spring(translateX, {
        toValue: 0,
        friction: 6,
        tension: 40,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    Animated.spring(rotateAnim, {
      toValue: isExpanded ? 1 : 0,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();

    Animated.spring(heightAnim, {
      toValue: isExpanded ? 1 : 0,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
  }, [isExpanded]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const maxHeight = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200],
  });

  return (
    <Animated.View
      style={[
        styles.faqItem,
        {
          backgroundColor: colors.surface,
          opacity: fadeAnim,
          transform: [{ translateX }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.faqHeader}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <Text style={[styles.faqQuestion, { color: colors.text }]}>
          {item.question}
        </Text>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons
            name="chevron-down"
            size={20}
            color={colors.textSecondary}
          />
        </Animated.View>
      </TouchableOpacity>

      <Animated.View style={{ maxHeight, overflow: "hidden" }}>
        <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>
          {item.answer}
        </Text>
      </Animated.View>
    </Animated.View>
  );
};

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function SupportSettingsScreen() {
  const router = useRouter();
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme ?? "light"];
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const itemsAnim = useRef(
    SUPPORT_OPTIONS.map(() => new Animated.Value(0))
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
        delay: 200 + index * 80,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  // ============================================
  // ACTIONS
  // ============================================

  const handleOpenFAQ = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Ouvre le premier élément de la FAQ
    if (FAQ_ITEMS.length > 0) {
      setExpandedFaq(expandedFaq === FAQ_ITEMS[0].id ? null : FAQ_ITEMS[0].id);
    }
  };

  const handleContactSupport = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const isAvailable = await MailComposer.isAvailableAsync();
    if (isAvailable) {
      await MailComposer.composeAsync({
        recipients: ["support@moxtor.com"],
        subject: "[Moxtor Helpers] Demande d'assistance",
        body: `
Bonjour,

Je contacte le support concernant :

[Description de votre demande]

---
Application: Moxtor Helpers
Version: 1.0.0
Plateforme: ${Platform.OS}
---
        `.trim(),
      });
    } else {
      Linking.openURL(
        "mailto:support@moxtor.com?subject=[Moxtor Helpers] Demande d'assistance"
      );
    }
  };

  const handleReportProblem = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const isAvailable = await MailComposer.isAvailableAsync();
    if (isAvailable) {
      await MailComposer.composeAsync({
        recipients: ["support@moxtor.com"],
        subject: "[Moxtor Helpers] Signalement de problème",
        body: `
Bonjour,

Je rencontre un problème avec l'application :

[Description du problème]

Étapes pour reproduire :
1. 
2. 
3. 

---
Application: Moxtor Helpers
Version: 1.0.0
Plateforme: ${Platform.OS}
---
        `.trim(),
      });
    } else {
      Linking.openURL(
        "mailto:support@moxtor.com?subject=[Moxtor Helpers] Signalement de problème"
      );
    }
  };

  const handleOpenWhatsApp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(
      "https://wa.me/16135550123?text=Bonjour%2C%20j%27ai%20besoin%20d%27aide%20sur%20Moxtor%20Helpers"
    );
  };

  const handleOpenWebsite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL("https://moxtor.com");
  };

  const handleOpenInstagram = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL("https://instagram.com/moxtor_helpers");
  };

  const handleAction = (action: string) => {
    switch (action) {
      case "faq":
        handleOpenFAQ();
        break;
      case "email":
        handleContactSupport();
        break;
      case "report":
        handleReportProblem();
        break;
      case "whatsapp":
        handleOpenWhatsApp();
        break;
      case "website":
        handleOpenWebsite();
        break;
      case "instagram":
        handleOpenInstagram();
        break;
    }
  };

  const toggleFaq = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  // ============================================
  // RENDU
  // ============================================

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
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
        {/* Options de support */}
        <View style={styles.supportGrid}>
          {SUPPORT_OPTIONS.map((option, index) => (
            <Animated.View
              key={option.id}
              style={[
                styles.supportCard,
                {
                  backgroundColor: colors.surface,
                  opacity: itemsAnim[index],
                  transform: [
                    {
                      translateY: itemsAnim[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.supportCardContent}
                onPress={() => handleAction(option.action)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[option.color + "20", option.color + "10"]}
                  style={styles.supportIcon}
                >
                  <Ionicons name={option.icon} size={28} color={option.color} />
                </LinearGradient>
                <Text style={[styles.supportTitle, { color: colors.text }]}>
                  {option.title}
                </Text>
                <Text
                  style={[
                    styles.supportDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  {option.description}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* Section FAQ */}
        <View style={styles.faqSection}>
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={[colors.primary + "20", colors.secondary + "10"]}
              style={styles.sectionIcon}
            >
              <Ionicons name="help-circle" size={18} color={colors.primary} />
            </LinearGradient>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Foire aux questions
            </Text>
          </View>

          <View style={styles.faqList}>
            {FAQ_ITEMS.map((item, index) => (
              <FAQItem
                key={item.id}
                item={item}
                colors={colors}
                isExpanded={expandedFaq === item.id}
                onToggle={() => toggleFaq(item.id)}
                index={index}
              />
            ))}
          </View>
        </View>

        {/* Note sur les délais de réponse */}
        <View style={[styles.noteCard, { backgroundColor: colors.surface }]}>
          <LinearGradient
            colors={[colors.primary + "05", colors.secondary + "02"]}
            style={styles.noteGradient}
          >
            <Ionicons name="time-outline" size={24} color={colors.primary} />
            <View style={styles.noteContent}>
              <Text style={[styles.noteTitle, { color: colors.text }]}>
                Délais de réponse
              </Text>
              <Text style={[styles.noteText, { color: colors.textSecondary }]}>
                Notre équipe s'efforce de répondre à toutes les demandes dans un
                délai de 24 à 48 heures ouvrées.
              </Text>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.bottomSpace} />
      </Animated.ScrollView>

      <Toast />
    </View>
  );
}

// ============================================
// STYLES
// ============================================

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
  supportGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  supportCard: {
    width: (width - 44) / 2,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  supportCardContent: {
    alignItems: "center",
    padding: 20,
    gap: 8,
  },
  supportIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  supportTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  supportDescription: {
    fontSize: 12,
    textAlign: "center",
  },
  faqSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  faqList: {
    gap: 10,
  },
  faqItem: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  noteCard: {
    borderRadius: 20,
    marginTop: 8,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  noteGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  noteText: {
    fontSize: 12,
    lineHeight: 16,
  },
  bottomSpace: {
    height: 20,
  },
});
