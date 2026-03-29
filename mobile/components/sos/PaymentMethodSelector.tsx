// components/sos/PaymentMethodSelector.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { WebView } from "react-native-webview";
import { api } from "../../config/api";

const { width, height } = Dimensions.get("window");

interface SavedCard {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

interface PaymentMethodSelectorProps {
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
  colors: any;
}

export const PaymentMethodSelector = ({
  amount,
  onSuccess,
  onError,
  onCancel,
  colors,
}: PaymentMethodSelectorProps) => {
  const [loading, setLoading] = useState(false);
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showAddCard, setShowAddCard] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState("");
  const [showWebView, setShowWebView] = useState(false);
  const [webViewLoading, setWebViewLoading] = useState(true);

  useEffect(() => {
    loadSavedCards();
  }, []);

  const loadSavedCards = async () => {
    try {
      const response = await api.get("/payments/saved-cards");
      console.log("📦 Cartes chargées:", response.data);
      setSavedCards(response.data.data || []);
      const defaultCard = response.data.data?.find(
        (c: SavedCard) => c.isDefault
      );
      if (defaultCard) {
        setSelectedCardId(defaultCard.id);
      } else if (response.data.data?.length > 0) {
        setSelectedCardId(response.data.data[0].id);
      }
    } catch (error) {
      console.error("Erreur chargement cartes:", error);
    }
  };

  const handleAddCard = async () => {
    setLoading(true);
    try {
      console.log("🟡 Création session pour ajouter carte...");

      const response = await api.post("/payments/setup-session", {
        customer_email: "user@email.com",
      });

      console.log("📦 Réponse API:", response.data);

      const { sessionUrl } = response.data.data;
      console.log("🔗 Session URL:", sessionUrl);

      setPaymentUrl(sessionUrl);
      setShowWebView(true);
      setWebViewLoading(true);
    } catch (error: any) {
      console.error("❌ Erreur ajout carte:", error);
      onError(
        error.response?.data?.message ||
          error.message ||
          "Impossible d'ajouter la carte"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorize = async () => {
    if (!selectedCardId && savedCards.length === 0) {
      setShowAddCard(true);
      return;
    }

    setLoading(true);
    try {
      console.log(
        "🟡 Autorisation paiement - Montant:",
        amount,
        "Carte:",
        selectedCardId
      );

      const response = await api.post("/payments/authorize", {
        amount: amount,
        paymentMethodId: selectedCardId,
        saveCard: false,
      });

      const { paymentIntentId } = response.data.data;
      console.log("✅ Autorisation réussie:", paymentIntentId);
      onSuccess(paymentIntentId);
    } catch (error: any) {
      console.error("❌ Erreur autorisation:", error);
      onError(error.response?.data?.message || "Erreur de paiement");
    } finally {
      setLoading(false);
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log("📩 Message WebView:", data);
      if (data.type === "card_added") {
        setShowWebView(false);
        loadSavedCards();
        Alert.alert("✅ Carte ajoutée", "Votre carte a été enregistrée");
      }
    } catch (error) {
      console.error("Erreur message WebView:", error);
    }
  };

  const handleWebViewNavigation = (navState: any) => {
    const { url } = navState;
    console.log("🌐 Navigation WebView:", url);

    if (url.includes("kadima://card/success")) {
      console.log("✅ Carte ajoutée avec succès");
      setShowWebView(false);
      loadSavedCards();
      Alert.alert("✅ Carte ajoutée", "Votre carte a été enregistrée");
    } else if (url.includes("kadima://card/cancel")) {
      console.log("❌ Ajout carte annulé");
      setShowWebView(false);
    }
  };

  const getCardIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case "visa":
        return "logo-google";
      case "mastercard":
        return "card";
      case "amex":
        return "card";
      default:
        return "card";
    }
  };

  // Écran d'ajout de carte (WebView)
  if (showWebView) {
    return (
      <View style={styles.webViewContainer}>
        <View
          style={[
            styles.webViewHeader,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => setShowWebView(false)}
            style={styles.webViewClose}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.webViewTitle, { color: colors.text }]}>
            Ajouter une carte
          </Text>
          {webViewLoading && (
            <View style={styles.webViewLoader}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}
        </View>

        <WebView
          source={{ uri: paymentUrl }}
          style={styles.webView}
          onMessage={handleWebViewMessage}
          onNavigationStateChange={handleWebViewNavigation}
          onLoadStart={() => {
            console.log("🟡 WebView chargement...");
            setWebViewLoading(true);
          }}
          onLoadEnd={() => {
            console.log("✅ WebView chargé");
            setWebViewLoading(false);
          }}
          onError={(error) => {
            console.error("❌ WebView erreur:", error);
            setShowWebView(false);
            onError("Erreur de chargement");
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
          renderLoading={() => (
            <View style={styles.webViewLoadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text
                style={[
                  styles.webViewLoadingText,
                  { color: colors.textSecondary },
                ]}
              >
                Chargement...
              </Text>
            </View>
          )}
        />

        {webViewLoading && (
          <View style={styles.webViewLoadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text
              style={[
                styles.webViewLoadingText,
                { color: colors.textSecondary },
              ]}
            >
              Chargement...
            </Text>
          </View>
        )}
      </View>
    );
  }

  // Écran principal de sélection de carte
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Paiement</Text>

      <View style={[styles.amountCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>
          Montant à autoriser
        </Text>
        <Text style={[styles.amountValue, { color: colors.primary }]}>
          ${amount.toFixed(2)}
        </Text>
        <Text style={[styles.amountHint, { color: colors.textSecondary }]}>
          Débité uniquement après l'intervention
        </Text>
      </View>

      {/* Cartes enregistrées */}
      {savedCards.length > 0 && (
        <View style={styles.cardsSection}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Cartes enregistrées
          </Text>

          {savedCards.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={[
                styles.cardItem,
                {
                  backgroundColor: colors.surface,
                  borderColor:
                    selectedCardId === card.id ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSelectedCardId(card.id)}
              activeOpacity={0.7}
            >
              <View style={styles.cardLeft}>
                <Ionicons
                  name={getCardIcon(card.brand)}
                  size={28}
                  color={
                    selectedCardId === card.id
                      ? colors.primary
                      : colors.textSecondary
                  }
                />
                <View>
                  <Text style={[styles.cardBrand, { color: colors.text }]}>
                    {card.brand.toUpperCase()} •••• {card.last4}
                  </Text>
                  <Text
                    style={[styles.cardExpiry, { color: colors.textSecondary }]}
                  >
                    Expire {card.expMonth}/{card.expYear}
                  </Text>
                </View>
              </View>
              {selectedCardId === card.id && (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={colors.success}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Bouton ajouter carte */}
      <TouchableOpacity
        style={[styles.addCardButton, { borderColor: colors.border }]}
        onPress={handleAddCard}
        disabled={loading}
      >
        <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
        <Text style={[styles.addCardText, { color: colors.primary }]}>
          {savedCards.length > 0
            ? "Ajouter une autre carte"
            : "Ajouter une carte"}
        </Text>
      </TouchableOpacity>

      {/* Boutons d'action */}
      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.cancelButton, { borderColor: colors.border }]}
          onPress={onCancel}
          disabled={loading}
        >
          <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
            Annuler
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.payButton, { backgroundColor: colors.primary }]}
          onPress={handleAuthorize}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="lock-closed" size={18} color="#fff" />
              <Text style={styles.payButtonText}>Autoriser le paiement</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  amountCard: {
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  amountLabel: {
    fontSize: 14,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: "bold",
  },
  amountHint: {
    fontSize: 12,
    textAlign: "center",
  },
  cardsSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  cardItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardBrand: {
    fontSize: 14,
    fontWeight: "500",
  },
  cardExpiry: {
    fontSize: 12,
  },
  addCardButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 30,
    borderWidth: 1,
    gap: 8,
  },
  addCardText: {
    fontSize: 14,
    fontWeight: "500",
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 30,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "500",
  },
  payButton: {
    flex: 2,
    padding: 16,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  payButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  webViewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  webViewClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  webViewTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  webViewLoader: {
    width: 40,
    alignItems: "center",
  },
  webView: {
    flex: 1,
  },
  webViewLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  webViewLoadingText: {
    marginTop: 10,
    fontSize: 14,
  },
});
