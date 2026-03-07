import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SOSButton from '../../components/SOSButton';
import { locationService } from '../../services/location';

export default function HomeScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = async () => {
    const hasPermission = await locationService.requestPermission();
    if (hasPermission) {
      const loc = await locationService.getCurrentLocation();
      if (loc) {
        setLocation(loc);
        const addr = await locationService.getAddressFromCoords(loc.lat, loc.lng);
        setAddress(addr || 'Position obtenue');
      }
    }
  };

  const handleSOS = () => {
    navigation.navigate('SOS', { location, address });
  };

  const handleDiagnostic = () => {
    navigation.navigate('Diagnostic');
  };

  return (
    <ScrollView style={styles.container}>
      <SOSButton onPress={handleSOS} />

      <View style={styles.locationCard}>
        <Ionicons name="location" size={24} color="#E63946" />
        <View style={styles.locationInfo}>
          <Text style={styles.locationTitle}>Position actuelle</Text>
          <Text style={styles.locationAddress}>{address || 'Récupération...'}</Text>
        </View>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleDiagnostic}>
          <Ionicons name="medkit" size={32} color="#E63946" />
          <Text style={styles.actionText}>Diagnostic IA</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Helpers')}
        >
          <Ionicons name="people" size={32} color="#E63946" />
          <Text style={styles.actionText}>Helpers</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Interventions')}
        >
          <Ionicons name="list" size={32} color="#E63946" />
          <Text style={styles.actionText}>Historique</Text>
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
  locationCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  locationInfo: {
    marginLeft: 12,
    flex: 1
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 4
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    width: '30%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  actionText: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center'
  }
});