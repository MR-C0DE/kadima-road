// app/vehicles/[id]/documents.tsx
import { View, Text, StyleSheet } from "react-native";

export default function DocumentsScreen() {
  return (
    <View style={styles.container}>
      <Text>Documents du véhicule</Text>
      <Text style={styles.text}>Fonctionnalité à venir</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    marginTop: 10,
    color: "#666",
  },
});
