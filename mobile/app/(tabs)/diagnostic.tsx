import React from "react";
import { Redirect } from "expo-router";

export default function DiagnosticTab() {
  // Redirige vers l'écran de diagnostic dans le dossier /diagnostic
  return <Redirect href="/diagnostic" />;
}
