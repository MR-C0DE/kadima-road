import * as Location from 'expo-location';

export const locationService = {
  // Demander la permission
  async requestPermission() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  },

  // Obtenir la position actuelle
  async getCurrentLocation() {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      
      return {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        accuracy: location.coords.accuracy
      };
    } catch (error) {
      console.error('Erreur de localisation:', error);
      return null;
    }
  },

  // Obtenir l'adresse à partir des coordonnées
  async getAddressFromCoords(lat, lng) {
    try {
      const [address] = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng
      });
      
      if (address) {
        return `${address.street}, ${address.city}, ${address.region}`;
      }
      return null;
    } catch (error) {
      console.error('Erreur géocodage inverse:', error);
      return null;
    }
  },

  // Calculer la distance entre deux points
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
};