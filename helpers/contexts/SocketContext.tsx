// helpers/contexts/SocketContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { AppState, Alert } from "react-native";
import {
  connectSocket,
  getSocket,
  disconnectSocket,
  joinIntervention,
  sendStatusUpdate,
  sendLocation,
} from "../services/socket";
import { useAuth } from "./AuthContext";
import { useNetwork } from "./NetworkContext";

// ✅ CRÉER L'EVENT EMITTER AVANT TOUT
class SimpleEventEmitter {
  private listeners: Map<string, ((data: any) => void)[]> = new Map();

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) return;
    const callbacks = this.listeners.get(event)!;
    const index = callbacks.indexOf(callback);
    if (index !== -1) callbacks.splice(index, 1);
  }

  emit(event: string, data: any) {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event)!.forEach((callback) => callback(data));
  }
}

// ✅ EXPORTER L'EVENT EMITTER AVANT LE CONTEXTE
export const socketEvents = new SimpleEventEmitter();

interface SocketContextType {
  isConnected: boolean;
  currentInterventionId: string | null;
  joinInterventionRoom: (interventionId: string) => void;
  leaveInterventionRoom: () => void;
  updateStatus: (interventionId: string, status: string, note?: string) => void;
  updateLocation: (
    interventionId: string,
    latitude: number,
    longitude: number
  ) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

// Configuration
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY = 2000;
const HEARTBEAT_INTERVAL = 30000;
const HEARTBEAT_TIMEOUT = 5000;

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const { status } = useNetwork();

  const [isConnected, setIsConnected] = useState(false);
  const [currentInterventionId, setCurrentInterventionId] = useState<
    string | null
  >(null);
  const socketRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const isConnectingRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);

  // ============================================
  // SETUP DES ÉCOUTEURS SOCKET
  // ============================================
  const setupSocketListeners = useCallback((socket: any) => {
    console.log("📡 Setup des écouteurs Socket.IO pour Helpers");

    socket.on("connect", () => {
      console.log(`✅ Socket connecté! ID: ${socket.id}`);
      if (isMountedRef.current) {
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      }
    });

    socket.on("disconnect", (reason: string) => {
      console.log(`🔌 Socket déconnecté: ${reason}`);
      if (isMountedRef.current) {
        setIsConnected(false);
      }

      if (reason !== "io client disconnect" && isMountedRef.current) {
        console.log(`🔄 Tentative de reconnexion dans ${RECONNECT_DELAY}ms...`);
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current && isAuthenticated) {
            connectSocketInternal();
          }
        }, RECONNECT_DELAY);
      }
    });

    socket.on("connect_error", (err: any) => {
      console.error(`❌ Socket error: ${err.message}`);
      if (isMountedRef.current) {
        setIsConnected(false);
        reconnectAttemptsRef.current += 1;
      }
    });

    // ============================================
    // ÉCOUTEURS POUR PROPAGATION VIA EVENT EMITTER
    // ============================================

    socket.on("new-mission", (data: any) => {
      console.log(
        "📢 [SocketContext] new-mission reçu, propagation via EventEmitter"
      );
      socketEvents.emit("new-mission", data);
    });

    socket.on("mission-cancelled", (data: any) => {
      console.log(
        "📢 [SocketContext] mission-cancelled reçu, propagation via EventEmitter"
      );
      socketEvents.emit("mission-cancelled", data);
    });

    socket.on("mission-cancelled-detail", (data: any) => {
      console.log(
        "📢 [SocketContext] mission-cancelled-detail reçu, propagation via EventEmitter"
      );
      socketEvents.emit("mission-cancelled-detail", data);
    });

    socket.on("status-update", (data: any) => {
      console.log("📢 [SocketContext] status-update reçu:", data);
      socketEvents.emit("status-update", {
        ...data,
        cancelledBy: data.updatedBy,
        reason: data.note,
      });

      if (data.status === "cancelled") {
        socketEvents.emit("mission-cancelled-detail", {
          missionId: data.interventionId,
          cancelledBy: data.updatedBy,
          reason: data.note,
          missionTitle: data.missionTitle || "Mission",
        });
      }
    });

    socket.on("mission-accepted", (data: any) => {
      console.log(
        "📢 [SocketContext] mission-accepted reçu, propagation via EventEmitter"
      );
      socketEvents.emit("mission-accepted", data);
    });

    socket.on("mission-completed", (data: any) => {
      console.log(
        "📢 [SocketContext] mission-completed reçu, propagation via EventEmitter"
      );
      socketEvents.emit("mission-completed", data);
    });

    // Heartbeat
    socket.on("pong", () => {
      // Heartbeat reçu
    });
  }, []);

  // ============================================
  // HEARTBEAT
  // ============================================
  const setupHeartbeat = useCallback((socket: any) => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    let lastPong = Date.now();
    let heartbeatTimeout: NodeJS.Timeout | null = null;

    socket.on("pong", () => {
      lastPong = Date.now();
      if (heartbeatTimeout) {
        clearTimeout(heartbeatTimeout);
        heartbeatTimeout = null;
      }
    });

    heartbeatIntervalRef.current = setInterval(() => {
      if (socket && socket.connected) {
        const timeSinceLastPong = Date.now() - lastPong;
        if (timeSinceLastPong > HEARTBEAT_TIMEOUT * 2) {
          console.log("⚠️ Heartbeat timeout, socket probablement mort");
          socket.disconnect();
        } else {
          socket.emit("ping");

          heartbeatTimeout = setTimeout(() => {
            console.log("⚠️ Pas de pong reçu, reconnexion...");
            socket.disconnect();
          }, HEARTBEAT_TIMEOUT);
        }
      }
    }, HEARTBEAT_INTERVAL);
  }, []);

  // ============================================
  // CONNEXION
  // ============================================
  const connectSocketInternal = useCallback(async () => {
    if (!isAuthenticated || isConnectingRef.current) {
      return;
    }

    isConnectingRef.current = true;

    try {
      if (socketRef.current) {
        console.log("🔄 Socket déjà existant, déconnexion d'abord...");
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      console.log("🔌 Connexion Socket.IO...");
      const socket = await connectSocket();

      if (socket && isMountedRef.current) {
        socketRef.current = socket;
        setupSocketListeners(socket);
        setupHeartbeat(socket);
        setIsConnected(socket.connected);

        // Si on avait une intervention en cours, la réjoindre
        if (currentInterventionId && socket.connected) {
          console.log(
            `🔁 Rejoindre intervention ${currentInterventionId} après reconnexion`
          );
          joinIntervention(currentInterventionId);
        }
      }
    } catch (error) {
      console.error("❌ Erreur connexion socket:", error);
      if (isMountedRef.current) {
        setIsConnected(false);
      }
    } finally {
      isConnectingRef.current = false;
    }
  }, [
    isAuthenticated,
    currentInterventionId,
    setupSocketListeners,
    setupHeartbeat,
  ]);

  // ============================================
  // ACTIONS
  // ============================================
  const joinInterventionRoom = useCallback(
    (interventionId: string) => {
      if (!socketRef.current || !isConnected) {
        console.log("⚠️ Pas de connexion, tentative de reconnexion...");
        connectSocketInternal().then(() => {
          if (socketRef.current && isConnected) {
            console.log(`🔗 Rejoint intervention ${interventionId}`);
            joinIntervention(interventionId);
            setCurrentInterventionId(interventionId);
          }
        });
        return;
      }

      console.log(`🔗 Rejoint intervention ${interventionId}`);
      joinIntervention(interventionId);
      setCurrentInterventionId(interventionId);
    },
    [isConnected, connectSocketInternal]
  );

  const leaveInterventionRoom = useCallback(() => {
    if (currentInterventionId) {
      console.log(`🚪 Quitte intervention ${currentInterventionId}`);
      setCurrentInterventionId(null);
    }
  }, [currentInterventionId]);

  const updateStatus = useCallback(
    (interventionId: string, status: string, note?: string) => {
      if (!socketRef.current || !isConnected) {
        console.log("⚠️ Pas de connexion pour updateStatus");
        return;
      }
      console.log(`📡 Envoi statut ${status} pour ${interventionId}`);
      sendStatusUpdate(interventionId, status, note);
    },
    [isConnected]
  );

  const updateLocation = useCallback(
    (interventionId: string, latitude: number, longitude: number) => {
      if (!socketRef.current || !isConnected) {
        return;
      }
      sendLocation(interventionId, latitude, longitude);
    },
    [isConnected]
  );

  // ============================================
  // ALERTES GLOBALES POUR ANNULATIONS
  // ============================================
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleStatusUpdate = (data: any) => {
      if (data.status === "cancelled") {
        console.log(
          `❌ Intervention ${data.interventionId} annulée par ${data.updatedBy}`
        );

        Alert.alert(
          "❌ Intervention annulée",
          data.note || "Le client a annulé l'intervention",
          [{ text: "OK" }]
        );

        if (currentInterventionId === data.interventionId) {
          leaveInterventionRoom();
        }
      }
    };

    socket.on("status-update", handleStatusUpdate);

    return () => {
      socket.off("status-update", handleStatusUpdate);
    };
  }, [currentInterventionId, leaveInterventionRoom]);

  // ============================================
  // SURVEILLANCE RÉSEAU
  // ============================================
  useEffect(() => {
    if (
      status.isConnected &&
      status.isInternetReachable &&
      status.isApiReachable
    ) {
      if (!isConnected && !isConnectingRef.current) {
        console.log("🌐 Connexion réseau rétablie, reconnexion socket...");
        connectSocketInternal();
      }
    }
  }, [
    status.isConnected,
    status.isInternetReachable,
    status.isApiReachable,
    isConnected,
    connectSocketInternal,
  ]);

  // ============================================
  // SURVEILLANCE APP STATE
  // ============================================
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        console.log(
          "📱 Application revenue au premier plan, vérification connexion..."
        );
        if (!isConnected && !isConnectingRef.current) {
          connectSocketInternal();
        }
      }
    });

    return () => subscription.remove();
  }, [isConnected, connectSocketInternal]);

  // ============================================
  // CONNEXION INITIALE
  // ============================================
  useEffect(() => {
    isMountedRef.current = true;

    const initSocket = async () => {
      if (isAuthenticated && !socketRef.current && !isConnectingRef.current) {
        await connectSocketInternal();
      }
    };

    initSocket();

    return () => {
      isMountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated, connectSocketInternal]);

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        currentInterventionId,
        joinInterventionRoom,
        leaveInterventionRoom,
        updateStatus,
        updateLocation,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
