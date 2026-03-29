// backend/src/services/googlePlacesService.js
import axios from 'axios';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// @desc    Rechercher des garages à proximité via Google Places
export const searchNearbyGarages = async (lat, lng, radius = 5000) => {
  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
      {
        params: {
          location: `${lat},${lng}`,
          radius,
          type: 'car_repair',
          key: GOOGLE_MAPS_API_KEY
        }
      }
    );

    console.log(`🔍 Google Places - ${response.data.results.length} garages trouvés`);

    const garages = response.data.results
      .map(place => {
        // Vérifier que les coordonnées existent
        if (!place.geometry?.location) {
          console.log('⚠️ Garage sans coordonnées:', place.name);
          return null;
        }

        return {
          _id: `google_${place.place_id}`,
          name: place.name,
          address: place.vicinity,
          phone: place.formatted_phone_number || null,
          services: [],
          rating: place.rating || 0,
          location: {
            coordinates: [
              place.geometry.location.lng,
              place.geometry.location.lat
            ]
          },
          source: 'google',
          googlePlaceId: place.place_id
        };
      })
      .filter(g => g !== null);

    console.log(`✅ ${garages.length} garages Google formatés avec coordonnées`);
    return garages;

  } catch (error) {
    console.error('❌ Erreur Google Places (garages):', error.message);
    return [];
  }
};

// @desc    Rechercher des services de remorquage via Google Places
export const searchNearbyTowing = async (lat, lng, radius = 5000) => {
  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
      {
        params: {
          location: `${lat},${lng}`,
          radius,
          keyword: 'towing service',
          key: GOOGLE_MAPS_API_KEY
        }
      }
    );

    console.log(`🔍 Google Places - ${response.data.results.length} services de remorquage trouvés`);

    const towingServices = response.data.results
      .map(place => {
        if (!place.geometry?.location) {
          console.log('⚠️ Remorquage sans coordonnées:', place.name);
          return null;
        }

        return {
          _id: `google_${place.place_id}`,
          name: place.name,
          address: place.vicinity,
          phone: place.formatted_phone_number || null,
          pricing: {
            basePrice: 75,
            perKm: 2,
            afterHours: 50
          },
          available24h: true,
          rating: place.rating || 0,
          location: {
            coordinates: [
              place.geometry.location.lng,
              place.geometry.location.lat
            ]
          },
          source: 'google',
          googlePlaceId: place.place_id
        };
      })
      .filter(t => t !== null);

    console.log(`✅ ${towingServices.length} services de remorquage Google formatés avec coordonnées`);
    return towingServices;

  } catch (error) {
    console.error('❌ Erreur Google Places (towing):', error.message);
    return [];
  }
};