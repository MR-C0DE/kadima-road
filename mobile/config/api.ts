import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Configuration de l'API
export const API_URL = "http://192.168.2.19:4040/api";

// Instance axios pré-configurée
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log("✅ Token ajouté à la requête");
      } else {
        console.log("⚠️ Pas de token trouvé");
      }
    } catch (error) {
      console.error("Erreur lors de la récupération du token:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs 401 (token expiré)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.log("🔴 Token expiré ou invalide");
      // Optionnel : déconnecter l'utilisateur
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      // Tu pourrais rediriger vers login ici
    }
    return Promise.reject(error);
  }
);
