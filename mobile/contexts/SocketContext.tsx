// mobile/contexts/SocketContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import {
  connectSocket,
  getSocket,
  disconnectSocket,
  trackIntervention,
} from "../services/socket";
import { useAuth } from "./AuthContext";

interface SocketContextType {
  isConnected: boolean;
  currentInterventionId: string | null;
  trackInterventionRoom: (
    interventionId: string,
    onLocationUpdate: (data: any) => void,
    onStatusUpdate: (data: any) => void
  ) => () => void;
  stopTracking: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [currentInterventionId, setCurrentInterventionId] = useState<
    string | null
  >(null);
  const socketRef = useRef<any>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Connexion automatique quand l'utilisateur est authentifié
  useEffect(() => {
    let mounted = true;

    const initSocket = async () => {
      if (isAuthenticated && !socketRef.current) {
        console.log("🔌 SocketProvider Mobile: Connexion WebSocket...");
        const socket = await connectSocket();
        if (socket && mounted) {
          socketRef.current = socket;
          setIsConnected(true);
          console.log("✅ SocketProvider Mobile: Connecté");
        }
      }
    };

    initSocket();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  // Suivre une intervention
  const trackInterventionRoom = useCallback(
    (
      interventionId: string,
      onLocationUpdate: (data: any) => void,
      onStatusUpdate: (data: any) => void
    ) => {
      if (!socketRef.current || !isConnected) {
        console.log(
          "⚠️ SocketProvider Mobile: Pas de connexion, tentative de reconnexion..."
        );
        connectSocket().then((socket) => {
          if (socket) {
            socketRef.current = socket;
            setIsConnected(true);
            const cleanup = trackIntervention(
              interventionId,
              onLocationUpdate,
              onStatusUpdate
            );
            cleanupRef.current = cleanup;
            setCurrentInterventionId(interventionId);
            console.log(
              `✅ SocketProvider Mobile: Tracking intervention ${interventionId}`
            );
          }
        });
        return () => {};
      }

      console.log(
        `🔗 SocketProvider Mobile: Tracking intervention ${interventionId}`
      );
      const cleanup = trackIntervention(
        interventionId,
        onLocationUpdate,
        onStatusUpdate
      );
      cleanupRef.current = cleanup;
      setCurrentInterventionId(interventionId);

      return cleanup;
    },
    [isConnected]
  );

  // Arrêter le tracking
  const stopTracking = useCallback(() => {
    if (cleanupRef.current) {
      console.log(
        `🚪 SocketProvider Mobile: Arrêt du tracking pour ${currentInterventionId}`
      );
      cleanupRef.current();
      cleanupRef.current = null;
      setCurrentInterventionId(null);
    }
  }, [currentInterventionId]);

  // Nettoyage à la déconnexion
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
      if (socketRef.current) {
        disconnectSocket();
        socketRef.current = null;
      }
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        currentInterventionId,
        trackInterventionRoom,
        stopTracking,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
