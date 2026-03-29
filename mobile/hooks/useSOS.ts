// hooks/useSOS.ts
import { useEffect, useRef } from "react";
import { useSOS } from "../contexts/SOSContext";
import { api } from "../config/api";
import { AppState } from "react-native";

export const useSOSPolling = () => {
  const { sosState, updateSOSStatus, cancelSOS } = useSOS();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkStatus = async () => {
    if (!sosState.activeSOS) return;

    try {
      const response = await api.get(`/sos/${sosState.activeSOS.id}`);
      const alert = response.data.data;

      if (alert.status !== sosState.activeSOS.status) {
        updateSOSStatus(alert.status, alert.intervention?.helper);
      }

      if (alert.status === "resolved" || alert.status === "cancelled") {
        stopPolling();
      }
    } catch (error) {
      console.error("Erreur polling SOS:", error);
      if (error.response?.status === 404) {
        cancelSOS();
        stopPolling();
      }
    }
  };

  const startPolling = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(checkStatus, 3000);
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    if (sosState.isWaiting && sosState.activeSOS) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [sosState.isWaiting, sosState.activeSOS]);

  return { isWaiting: sosState.isWaiting, activeSOS: sosState.activeSOS };
};
