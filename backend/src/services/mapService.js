import axios from 'axios';
import logger from '../config/logger.js';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Calculer la distance entre deux points
export const calculateDistance = async (origin, destination) => {
  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/distancematrix/json',
      {
        params: {
          origins: `${origin.lat},${origin.lng}`,
          destinations: `${destination.lat},${destination.lng}`,
          key: GOOGLE_MAPS_API_KEY,
          units: 'metric'
        }
      }
    );

    if (response.data.status === 'OK') {
      const element = response.data.rows[0].elements[0];
      return {
        distance: element.distance.value / 1000, // en km
        duration: element.duration.value / 60, // en minutes
        distanceText: element.distance.text,
        durationText: element.duration.text
      };
    }
    return null;
  } catch (error) {
    logger.error(`Erreur calcul distance: ${error.message}`);
    throw error;
  }
};

// Obtenir les coordonnées d'une adresse
export const geocodeAddress = async (address) => {
  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/geocode/json',
      {
        params: {
          address,
          key: GOOGLE_MAPS_API_KEY
        }
      }
    );

    if (response.data.status === 'OK') {
      const location = response.data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng,
        formattedAddress: response.data.results[0].formatted_address
      };
    }
    return null;
  } catch (error) {
    logger.error(`Erreur géocodage: ${error.message}`);
    throw error;
  }
};

// Obtenir l'adresse à partir de coordonnées
export const reverseGeocode = async (lat, lng) => {
  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/geocode/json',
      {
        params: {
          latlng: `${lat},${lng}`,
          key: GOOGLE_MAPS_API_KEY
        }
      }
    );

    if (response.data.status === 'OK') {
      return response.data.results[0].formatted_address;
    }
    return null;
  } catch (error) {
    logger.error(`Erreur géocodage inverse: ${error.message}`);
    throw error;
  }
};

// Calculer un itinéraire
export const getDirections = async (origin, destination, waypoints = []) => {
  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/directions/json',
      {
        params: {
          origin: `${origin.lat},${origin.lng}`,
          destination: `${destination.lat},${destination.lng}`,
          waypoints: waypoints.map(wp => `${wp.lat},${wp.lng}`).join('|'),
          key: GOOGLE_MAPS_API_KEY,
          mode: 'driving'
        }
      }
    );

    if (response.data.status === 'OK') {
      const route = response.data.routes[0];
      return {
        distance: route.legs.reduce((sum, leg) => sum + leg.distance.value, 0) / 1000,
        duration: route.legs.reduce((sum, leg) => sum + leg.duration.value, 0) / 60,
        polyline: route.overview_polyline.points,
        steps: route.legs.flatMap(leg => leg.steps)
      };
    }
    return null;
  } catch (error) {
    logger.error(`Erreur itinéraire: ${error.message}`);
    throw error;
  }
};

// Trouver les helpers à proximité
export const findNearbyHelpers = async (helpers, userLocation, radius = 10) => {
  const nearbyHelpers = [];

  for (const helper of helpers) {
    if (helper.serviceArea && helper.serviceArea.coordinates) {
      const [helperLng, helperLat] = helper.serviceArea.coordinates;
      
      const distance = await calculateDistance(
        { lat: userLocation.lat, lng: userLocation.lng },
        { lat: helperLat, lng: helperLng }
      );

      if (distance && distance.distance <= radius) {
        nearbyHelpers.push({
          helper,
          distance: distance.distance,
          duration: distance.duration
        });
      }
    }
  }

  // Trier par distance
  return nearbyHelpers.sort((a, b) => a.distance - b.distance);
};