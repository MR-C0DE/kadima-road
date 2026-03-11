import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_URL = "http://192.168.2.19:4040/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Fonction pour attendre un certain temps
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Intercepteur pour gérer les erreurs 429 avec retry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si c'est une erreur 429 et qu'on n'a pas déjà retenté
    if (error.response?.status === 429 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Récupérer le délai d'attente recommandé (souvent dans l'en-tête Retry-After)
      const retryAfter = error.response.headers["retry-after"] || 5; // 5 secondes par défaut
      const waitTime = parseInt(retryAfter) * 1000 || 5000;

      console.log(
        `⏳ Rate limit atteint. Attente de ${waitTime / 1000}s avant retry...`
      );
      await sleep(waitTime);

      // Réessayer la requête
      return api(originalRequest);
    }

    return Promise.reject(error);
  }
);

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
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
