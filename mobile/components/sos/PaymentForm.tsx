// mobile/components/sos/PaymentForm.tsx
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
} from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../config/api";

const { height, width } = Dimensions.get("window");

interface PaymentFormProps {
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
  colors: any;
}

export const PaymentForm = ({
  amount,
  onSuccess,
  onError,
  onCancel,
  colors,
}: PaymentFormProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState("");
  const [webViewLoading, setWebViewLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  const handlePayment = async () => {
    setLoading(true);

    try {
      console.log("💰 Création session Stripe - Montant:", amount);

      const response = await api.post("/payments/create-checkout-session", {
        amount: amount,
        currency: "cad",
        customer_email: user?.email,
      });

      const { sessionUrl, paymentIntentId } = response.data.data;

      console.log("✅ Session créée:", sessionUrl);

      setPaymentUrl(sessionUrl);
      setShowWebView(true);
      setWebViewLoading(true);
    } catch (error: any) {
      console.error("❌ Erreur création session:", error);
      onError(
        error.response?.data?.message || error.message || "Erreur de paiement"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log("📩 Message WebView:", data);

      if (data.type === "payment_success") {
        setShowWebView(false);
        onSuccess(data.paymentIntentId);
      } else if (data.type === "payment_cancel") {
        setShowWebView(false);
        onError("Paiement annulé");
      }
    } catch (error) {
      console.error("Erreur message WebView:", error);
    }
  };

  const handleNavigationStateChange = (navState: any) => {
    const { url } = navState;
    console.log("🌐 Navigation WebView:", url);

    // Détecter le retour de Stripe (deep link)
    if (url.includes("kadima://payment/success")) {
      const match = url.match(/session_id=([^&]+)/);
      if (match) {
        console.log("✅ Paiement réussi, session_id:", match[1]);
        setShowWebView(false);
        onSuccess(match[1]);
      }
    } else if (url.includes("kadima://payment/cancel")) {
      console.log("❌ Paiement annulé");
      setShowWebView(false);
      onError("Paiement annulé");
    }
  };

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
            Paiement sécurisé
          </Text>
          {webViewLoading && (
            <View style={styles.webViewLoader}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}
        </View>

        <WebView
          ref={webViewRef}
          source={{ uri: paymentUrl }}
          style={styles.webView}
          onMessage={handleWebViewMessage}
          onNavigationStateChange={handleNavigationStateChange}
          onLoadStart={() => setWebViewLoading(true)}
          onLoadEnd={() => setWebViewLoading(false)}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          injectedJavaScript={`
            // Script pour capturer les événements de paiement
            window.addEventListener('message', function(event) {
              if (event.data.type === 'payment_success' || event.data.type === 'payment_cancel') {
                window.ReactNativeWebView.postMessage(JSON.stringify(event.data));
              }
            });
            true;
          `}
          renderLoading={() => (
            <View style={styles.webViewLoadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
        />

        {webViewLoading && (
          <View style={styles.webViewLoadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>
        Paiement sécurisé
      </Text>

      <View style={[styles.amountCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>
          Montant à autoriser
        </Text>
        <Text style={[styles.amountValue, { color: colors.primary }]}>
          ${amount.toFixed(2)}
        </Text>
        <Text style={[styles.amountHint, { color: colors.textSecondary }]}>
          Vous ne serez débité qu'à la fin de l'intervention
        </Text>
      </View>

      <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
        <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          Paiement sécurisé par Stripe. Vos informations bancaires sont cryptées
          et jamais stockées sur nos serveurs.
        </Text>
      </View>

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
          style={styles.payButton}
          onPress={handlePayment}
          disabled={loading}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.payButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="lock-closed" size={18} color="#fff" />
                <Text style={styles.payButtonText}>
                  Autoriser {amount.toFixed(2)} $
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.paymentMethods}>
        <Ionicons name="logo-google" size={20} color={colors.textSecondary} />
        <Ionicons name="logo-apple" size={20} color={colors.textSecondary} />
        <Text
          style={[styles.paymentMethodsText, { color: colors.textSecondary }]}
        >
          Visa • Mastercard • Amex • Discover
        </Text>
      </View>

      <Text style={[styles.secureText, { color: colors.textSecondary }]}>
        <Ionicons name="shield-checkmark" size={12} /> Paiement 100% sécurisé
      </Text>
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
    marginBottom: 10,
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
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
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
    borderRadius: 30,
    overflow: "hidden",
  },
  payButtonGradient: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  payButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  paymentMethods: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 12,
  },
  paymentMethodsText: {
    fontSize: 12,
  },
  secureText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 10,
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  webViewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 50 : 40,
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
});
