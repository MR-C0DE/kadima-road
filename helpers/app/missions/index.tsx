import { Redirect } from "expo-router";

export default function MissionsIndex() {
  // Redirige vers l'onglet Missions dans les tabs
  return <Redirect href="/(tabs)/missions" />;
}
