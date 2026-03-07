import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL de ton backend (change l'IP selon ton réseau)
const BASE_URL = 'http://localhost:4040/api';
// Pour émulateur Android: 'http://10.0.2.2:5000/api'
// Pour vrai téléphone: 'http://192.168.x.x:5000/api' (IP de ton PC)

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
      await AsyncStorage.removeItem('token');
      // Rediriger vers login (à gérer dans le navigateur)
    }
    return Promise.reject(error);
  }
);

export default api;