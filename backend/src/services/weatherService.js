// backend/src/services/weatherService.js
import axios from 'axios';

const API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export const getWeather = async (lat, lng) => {
  try {
    const response = await axios.get(`${BASE_URL}/weather`, {
      params: {
        lat,
        lon: lng,
        units: 'metric',
        lang: 'fr',
        appid: API_KEY
      }
    });

    const data = response.data;
    
    // Traduction des conditions météo en français
    const conditionMap = {
      'clear sky': 'Ciel dégagé',
      'few clouds': 'Peu nuageux',
      'scattered clouds': 'Nuages épars',
      'broken clouds': 'Nuages fragmentés',
      'overcast clouds': 'Très nuageux',
      'light rain': 'Pluie légère',
      'moderate rain': 'Pluie modérée',
      'heavy rain': 'Pluie forte',
      'shower rain': 'Averses',
      'rain': 'Pluie',
      'thunderstorm': 'Orage',
      'snow': 'Neige',
      'light snow': 'Neige légère',
      'mist': 'Brume',
      'fog': 'Brouillard'
    };

    const condition = conditionMap[data.weather[0].description] || data.weather[0].description;

    return {
      temp: Math.round(data.main.temp),
      condition: condition.charAt(0).toUpperCase() + condition.slice(1),
      icon: data.weather[0].icon,
      city: data.name,
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 3.6), // m/s → km/h
      sunrise: data.sys.sunrise,
      sunset: data.sys.sunset
    };
  } catch (error) {
    console.error('Erreur météo:', error.message);
    return null;
  }
};