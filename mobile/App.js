import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import des navigateurs
import AuthNavigator from './src/navigation/AuthNavigator';
import MainTabNavigator from './src/navigation/MainTabNavigator';

// Écrans supplémentaires
import SOSScreen from './src/screens/home/SOSScreen';
import DiagnosticResultScreen from './src/screens/diagnostic/DiagnosticResultScreen';
import HelperProfileScreen from './src/screens/helpers/HelperProfileScreen';
import InterventionDetailScreen from './src/screens/interventions/InterventionDetailScreen';

const Stack = createStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      setIsAuthenticated(!!token);
    } catch (error) {
      console.error('Erreur vérification auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E63946" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          // Routes pour utilisateur connecté
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen name="SOS" component={SOSScreen} />
            <Stack.Screen name="DiagnosticResult" component={DiagnosticResultScreen} />
            <Stack.Screen name="HelperProfile" component={HelperProfileScreen} />
            <Stack.Screen name="InterventionDetail" component={InterventionDetailScreen} />
          </>
        ) : (
          // Routes pour non connecté
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  }
});