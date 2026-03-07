import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/home/HomeScreen';
import DiagnosticScreen from '../screens/diagnostic/DiagnosticScreen';
import NearbyHelpersScreen from '../screens/helpers/NearbyHelpersScreen';
import InterventionsScreen from '../screens/interventions/InterventionsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Accueil') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Diagnostic') iconName = focused ? 'medkit' : 'medkit-outline';
          else if (route.name === 'Helpers') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'Interventions') iconName = focused ? 'list' : 'list-outline';
          else if (route.name === 'Profil') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#E63946',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Accueil" component={HomeScreen} />
      <Tab.Screen name="Diagnostic" component={DiagnosticScreen} />
      <Tab.Screen name="Helpers" component={NearbyHelpersScreen} />
      <Tab.Screen name="Interventions" component={InterventionsScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}