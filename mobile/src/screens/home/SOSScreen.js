import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import api from '../../services/api';
import { locationService } from '../../services/location';

export default function SOSScreen({ route, navigation }) {
  const { location: initialLocation, address: initialAddress } = route.params || {};
  const [location, setLocation] = useState(initialLocation);
  const [address, setAddress] = useState(initialAddress);
  const [problem, setProblem] = useState('');
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('other');
  const [severity, setSeverity] = useState('medium');

  const categories = [
    { id: 'battery', label: 'Batterie', icon: 'battery-dead' },
    { id: 'tire', label: 'Pneu', icon: 'car-sport' },
    { id: 'fuel', label: 'Essence', icon: 'water' },
    { id: 'engine', label: 'Moteur', icon: 'cog' },
    { id: 'accident', label: 'Accident', icon: 'warning' },
    { id: 'other', label: 'Autre', icon: 'help-circle' }
  ];

  useEffect(() => {
    if (!location) {
      getLocation();
    }
  }, []);

  const getLocation = async () => {
    const loc = await locationService.getCurrentLocation();
    if (loc) {
      setLocation(loc);
      const addr = await locationService.getAddressFromCoords(loc.lat, loc.lng);
      setAddress(addr);
    }
  };

  const handleEmergencyCall = () => {
    Alert.alert(
      'Appeler les secours',
      'Voulez-vous appeler le 911 ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Appeler', 
          onPress: () => Linking.openURL('tel:911'),
          style: 'destructive'
        }
      ]
    );
  };

  const handleSendSOS = async () => {
    if (!location) {
      Alert.alert('Erreur', 'Position non disponible');
      return;
    }

    if (!problem.trim()) {
      Alert.alert('Erreur', 'Décrivez brièvement le problème');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/sos', {
        location: {
          coordinates: [location.lng, location.lat],
          address
        },
        problem: {
          description: problem,
          category,
          severity
        }
      });

      Alert.alert(
        'SOS Envoyé',
        'Un helper va vous contacter dans quelques minutes.',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.replace('Interventions')
          }
        ]
      );
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'envoyer l\'alerte SOS');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.emergencyHeader}>
        <Ionicons name="alert-circle" size={60} color="white" />
        <Text style={styles.emergencyTitle}>Alerte SOS</Text>
        <Text style={styles.emergencySubtitle}>
          Un helper va être contacté immédiatement
        </Text>
      </View>

      <TouchableOpacity 
        style={styles.emergencyCall}
        onPress={handleEmergencyCall}
      >
        <Ionicons name="call" size={24} color="white" />
        <Text style={styles.emergencyCallText}>Appeler le 911</Text>
      </TouchableOpacity>

      {location && (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: location.lat,
              longitude: location.lng,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01
            }}
          >
            <Marker
              coordinate={{
                latitude: location.lat,
                longitude: location.lng
              }}
              title="Votre position"
            />
          </MapView>
        </View>
      )}

      <View style={styles.form}>
        <Text style={styles.label}>Type de problème</Text>
        <View style={styles.categories}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryButton,
                category === cat.id && styles.categoryButtonActive
              ]}
              onPress={() => setCategory(cat.id)}
            >
              <Ionicons 
                name={cat.icon} 
                size={24} 
                color={category === cat.id ? 'white' : '#666'} 
              />
              <Text style={[
                styles.categoryText,
                category === cat.id && styles.categoryTextActive
              ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Gravité</Text>
        <View style={styles.severityButtons}>
          {['low', 'medium', 'high', 'critical'].map(s => (
            <TouchableOpacity
              key={s}
              style={[
                styles.severityButton,
                severity === s && styles[`severity${s}`]
              ]}
              onPress={() => setSeverity(s)}
            >
              <Text style={[
                styles.severityText,
                severity === s && styles.severityTextActive
              ]}>
                {s === 'low' && 'Léger'}
                {s === 'medium' && 'Moyen'}
                {s === 'high' && 'Grave'}
                {s === 'critical' && 'Critique'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Description du problème</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: La voiture ne démarre pas, bruit bizarre..."
          multiline
          numberOfLines={4}
          value={problem}
          onChangeText={setProblem}
        />

        <TouchableOpacity
          style={[styles.sendButton, loading && styles.disabledButton]}
          onPress={handleSendSOS}
          disabled={loading}
        >
          <Text style={styles.sendButtonText}>
            {loading ? 'Envoi...' : 'Envoyer l\'alerte SOS'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  emergencyHeader: {
    backgroundColor: '#E63946',
    padding: 20,
    alignItems: 'center'
  },
  emergencyTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10
  },
  emergencySubtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    marginTop: 5
  },
  emergencyCall: {
    backgroundColor: '#2d2d2d',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginTop: 1
  },
  emergencyCallText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10
  },
  mapContainer: {
    height: 200,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden'
  },
  map: {
    flex: 1
  },
  form: {
    padding: 16
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333'
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16
  },
  categoryButton: {
    width: '30%',
    margin: '1.5%',
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd'
  },
  categoryButtonActive: {
    backgroundColor: '#E63946',
    borderColor: '#E63946'
  },
  categoryText: {
    marginTop: 4,
    fontSize: 12,
    color: '#666'
  },
  categoryTextActive: {
    color: 'white'
  },
  severityButtons: {
    flexDirection: 'row',
    marginBottom: 16
  },
  severityButton: {
    flex: 1,
    padding: 12,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center'
  },
  severitylow: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50'
  },
  severitymedium: {
    backgroundColor: '#FFC107',
    borderColor: '#FFC107'
  },
  severityhigh: {
    backgroundColor: '#FF9800',
    borderColor: '#FF9800'
  },
  severitycritical: {
    backgroundColor: '#E63946',
    borderColor: '#E63946'
  },
  severityText: {
    color: '#666'
  },
  severityTextActive: {
    color: 'white',
    fontWeight: 'bold'
  },
  input: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 16,
    minHeight: 100,
    textAlignVertical: 'top'
  },
  sendButton: {
    backgroundColor: '#E63946',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  disabledButton: {
    opacity: 0.6
  },
  sendButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold'
  }
});