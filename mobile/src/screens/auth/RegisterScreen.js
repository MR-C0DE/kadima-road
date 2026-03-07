// Exemple pour DiagnosticScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DiagnosticScreen() {
  return (
    <View style={styles.container}>
      <Text>Écran de diagnostic IA</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});