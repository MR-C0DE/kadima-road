// components/vehicle/VehicleNotesTab.tsx - Version avec gestion sécurisée de l'auteur

import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../contexts/ThemeContext";
import { Colors } from "@/constants/theme";

const { width } = Dimensions.get("window");

interface VehicleNotesTabProps {
  notes: any[];
  isCurrentOwner: boolean;
  onAddNote: () => void;
}

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
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
};

// Fonction pour obtenir le nom de l'auteur de manière sécurisée
const getAuthorName = (note: any): string => {
  // Cas 1: author est un objet avec firstName et lastName
  if (note.author && typeof note.author === "object") {
    if (note.author.firstName || note.author.lastName) {
      return (
        `${note.author.firstName || ""} ${note.author.lastName || ""}`.trim() ||
        "Utilisateur"
      );
    }
    // Si l'objet author existe mais pas firstName/lastName
    if (note.author.name) return note.author.name;
  }
  // Cas 2: author est un string (ID)
  if (typeof note.author === "string" && note.author) {
    return "Utilisateur";
  }
  // Cas 3: authorName direct
  if (note.authorName) return note.authorName;
  // Cas 4: pas d'auteur
  return "Utilisateur";
};

// Composant de note individuelle avec animation
const NoteItem = ({
  note,
  colors,
  index,
}: {
  note: any;
  colors: any;
  index: number;
}) => {
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

  const authorName = getAuthorName(note);
  const isPrivate = note.isPrivate === true;
  const hasValidDate = note.createdAt && note.createdAt !== "undefined";

  return (
    <Animated.View
      style={[
        styles.noteCard,
        {
          backgroundColor: colors.background,
          opacity: fadeAnim,
          transform: [{ translateX }],
        },
      ]}
    >
      <View style={styles.noteHeader}>
        <View style={styles.noteAuthorContainer}>
          <LinearGradient
            colors={[colors.primary + "20", colors.primary + "10"]}
            style={styles.noteAvatar}
          >
            <Ionicons name="person-outline" size={14} color={colors.primary} />
          </LinearGradient>
          <View style={styles.noteMeta}>
            <Text style={[styles.noteAuthor, { color: colors.text }]}>
              {authorName}
            </Text>
            {hasValidDate && (
              <Text style={[styles.noteDate, { color: colors.textSecondary }]}>
                {formatDate(note.createdAt)}
              </Text>
            )}
          </View>
        </View>
        {isPrivate && (
          <View
            style={[
              styles.privateBadge,
              { backgroundColor: colors.warning + "15" },
            ]}
          >
            <Ionicons name="lock-closed" size={10} color={colors.warning} />
            <Text style={[styles.privateText, { color: colors.warning }]}>
              Privé
            </Text>
          </View>
        )}
      </View>

      <Text style={[styles.noteText, { color: colors.text }]}>
        {note.text || "Note sans contenu"}
      </Text>
    </Animated.View>
  );
};

export default function VehicleNotesTab({
  notes,
  isCurrentOwner,
  onAddNote,
}: VehicleNotesTabProps) {
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme ?? "light"];
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

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

  const handleAddNote = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAddNote();
  };

  // Filtrer les notes invalides et trier par date
  const validNotes = (notes || []).filter(
    (note) => note && note.text && note.text.trim() !== ""
  );
  const sortedNotes = [...validNotes].sort(
    (a, b) =>
      new Date(b.createdAt || 0).getTime() -
      new Date(a.createdAt || 0).getTime()
  );

  return (
    <Animated.View
      style={[
        styles.card,
        { backgroundColor: colors.surface },
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={[colors.primary + "05", colors.secondary + "02"]}
        style={styles.cardBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* En-tête */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={[colors.primary + "20", colors.secondary + "10"]}
            style={styles.headerIcon}
          >
            <Ionicons
              name="document-text-outline"
              size={18}
              color={colors.primary}
            />
          </LinearGradient>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Notes
          </Text>
        </View>
        <View
          style={[
            styles.countBadge,
            { backgroundColor: colors.primary + "15" },
          ]}
        >
          <Text style={[styles.countText, { color: colors.primary }]}>
            {sortedNotes.length}
          </Text>
        </View>
      </View>

      {/* Bouton ajouter note - seulement pour le propriétaire */}
      {isCurrentOwner && (
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary + "10" }]}
          onPress={handleAddNote}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.addButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="add-outline" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Ajouter une note</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Liste des notes */}
      {sortedNotes.length > 0 ? (
        <View style={styles.notesList}>
          {sortedNotes.map((note, index) => (
            <NoteItem
              key={note._id || index}
              note={note}
              colors={colors}
              index={index}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <LinearGradient
            colors={[colors.primary + "15", colors.primary + "05"]}
            style={styles.emptyIcon}
          >
            <Ionicons
              name="document-text-outline"
              size={32}
              color={colors.primary}
            />
          </LinearGradient>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Aucune note
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Ajoutez des notes pour suivre l'entretien de votre véhicule
          </Text>
          {isCurrentOwner && (
            <TouchableOpacity
              style={[
                styles.emptyAddButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={handleAddNote}
            >
              <Ionicons name="add-outline" size={18} color="#fff" />
              <Text style={styles.emptyAddText}>Ajouter une note</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    position: "relative",
    overflow: "hidden",
  },
  cardBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.5,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  countText: {
    fontSize: 12,
    fontWeight: "600",
  },
  addButton: {
    marginBottom: 20,
    borderRadius: 30,
    overflow: "hidden",
  },
  addButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  notesList: {
    gap: 12,
  },
  noteCard: {
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  noteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  noteAuthorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  noteAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  noteMeta: {
    flex: 1,
  },
  noteAuthor: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
  },
  noteDate: {
    fontSize: 10,
  },
  privateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  privateText: {
    fontSize: 9,
    fontWeight: "600",
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 42,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 12,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  emptyAddButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginTop: 8,
  },
  emptyAddText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
});
