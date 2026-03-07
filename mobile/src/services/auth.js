import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authService = {
  // Inscription
  async register(userData) {
    const response = await api.post('/auth/register', userData);
    if (response.data.data?.token) {
      await AsyncStorage.setItem('token', response.data.data.token);
    }
    return response.data;
  },

  // Connexion
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.data?.token) {
      await AsyncStorage.setItem('token', response.data.data.token);
    }
    return response.data;
  },

  // Déconnexion
  async logout() {
    await AsyncStorage.removeItem('token');
  },

  // Récupérer le profil
  async getProfile() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Mettre à jour le profil
  async updateProfile(profileData) {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },

  // Changer mot de passe
  async changePassword(currentPassword, newPassword) {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  },

  // Vérifier si l'utilisateur est connecté
  async isAuthenticated() {
    const token = await AsyncStorage.getItem('token');
    return !!token;
  }
};