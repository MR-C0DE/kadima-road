// helpers/services/socket.ts - Version complète avec tous les écouteurs
import io from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SOCKET_URL } from "../config/api";

let socket: any = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

export const connectSocket = async () => {
  try {
    const token = await AsyncStorage.getItem("token");
    console.log(`🔌 Tentative connexion WebSocket - URL: ${SOCKET_URL}`);

    if (!token) {
      console.log("❌ Pas de token, impossible de se connecter");
      return null;
    }

    if (socket) {
      console.log("🔄 Socket déjà existant, déconnexion d'abord...");
      socket.disconnect();
      socket = null;
    }

    socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      forceNew: true,
    });

    socket.on("connect", () => {
      console.log(`✅ Socket connecté! ID: ${socket.id}`);
      reconnectAttempts = 0;
    });

    socket.on("disconnect", (reason: string) => {
      console.log(`🔌 Socket déconnecté: ${reason}`);
      if (reason === "io server disconnect") {
        setTimeout(() => {
          if (socket) socket.connect();
        }, 1000);
      }
    });

    socket.on("connect_error", (err: any) => {
      reconnectAttempts++;
      console.error(
        `❌ Socket error (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}):`,
        err.message
      );

      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.log("❌ Échec de reconnexion après plusieurs tentatives");
      }
    });

    // ============================================
    // ÉCOUTEURS D'ÉVÉNEMENTS GLOBAUX
    // ============================================

    // Nouvelle mission (SOS créé)
    socket.on("new-mission", (data: any) => {
      console.log("📢 [Socket] new-mission reçu:", data);
    });

    // Mission annulée (simple)
    socket.on("mission-cancelled", (data: any) => {
      console.log("📢 [Socket] mission-cancelled reçu:", data);
    });

    // ✅ NOUVEAU : Annulation détaillée avec raison et qui a annulé
    socket.on("mission-cancelled-detail", (data: any) => {
      console.log("📢 [Socket] mission-cancelled-detail reçu:", data);
      console.log("   - missionId:", data.missionId);
      console.log("   - cancelledBy:", data.cancelledBy);
      console.log("   - reason:", data.reason);
      console.log("   - missionTitle:", data.missionTitle);
    });

    // Mise à jour de statut
    socket.on("status-update", (data: any) => {
      console.log("📢 [Socket] status-update reçu:", data);
      console.log("   - interventionId:", data.interventionId);
      console.log("   - status:", data.status);
      console.log("   - note:", data.note);
    });

    // Mission acceptée par un helper
    socket.on("mission-accepted", (data: any) => {
      console.log("📢 [Socket] mission-accepted reçu:", data);
    });

    // Mission terminée
    socket.on("mission-completed", (data: any) => {
      console.log("📢 [Socket] mission-completed reçu:", data);
    });

    // Erreur
    socket.on("error", (data: any) => {
      console.error("❌ [Socket] error reçu:", data);
    });

    return socket;
  } catch (error) {
    console.error("❌ Connexion socket:", error);
    return null;
  }
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    console.log("🔌 Déconnexion WebSocket manuelle");
    socket.disconnect();
    socket = null;
    reconnectAttempts = 0;
  }
};

// ============================================
// ÉMISSION D'ÉVÉNEMENTS (Helper → Backend)
// ============================================

export const joinIntervention = (interventionId: string) => {
  const sock = getSocket();
  if (sock && sock.connected) {
    console.log(`🎯 join-intervention: ${interventionId}`);
    sock.emit("join-intervention", interventionId);
  } else {
    console.log(
      `❌ joinIntervention: socket non connecté, tentative de reconnexion...`
    );
    connectSocket().then((newSocket) => {
      if (newSocket && newSocket.connected) {
        newSocket.emit("join-intervention", interventionId);
      }
    });
  }
};

export const leaveIntervention = (interventionId: string) => {
  const sock = getSocket();
  if (sock && sock.connected) {
    console.log(`🚪 leave-intervention: ${interventionId}`);
    sock.emit("leave-intervention", interventionId);
  }
};

export const sendLocation = (
  interventionId: string,
  latitude: number,
  longitude: number
) => {
  const sock = getSocket();
  if (sock && sock.connected) {
    sock.emit("location-update", { interventionId, latitude, longitude });
  }
};

export const sendStatusUpdate = (
  interventionId: string,
  status: string,
  note?: string
) => {
  const sock = getSocket();
  if (sock && sock.connected) {
    console.log(`📡 sendStatusUpdate: ${interventionId} -> ${status}`);
    sock.emit("status-update", { interventionId, status, note });
  } else {
    console.log(`❌ sendStatusUpdate: socket non connecté`);
    connectSocket().then((newSocket) => {
      if (newSocket && newSocket.connected) {
        newSocket.emit("status-update", { interventionId, status, note });
      }
    });
  }
};

export const sendChatMessage = (
  interventionId: string,
  message: string,
  type: string = "text"
) => {
  const sock = getSocket();
  if (sock && sock.connected) {
    sock.emit("chat-message", { interventionId, message, type });
  }
};

// ============================================
// ÉCOUTEURS D'ÉVÉNEMENTS (avec callbacks)
// ============================================

export const onNewMission = (callback: (data: any) => void) => {
  const sock = getSocket();
  if (sock) {
    sock.on("new-mission", callback);
  }
};

export const onMissionCancelled = (callback: (data: any) => void) => {
  const sock = getSocket();
  if (sock) {
    sock.on("mission-cancelled", callback);
  }
};

// ✅ NOUVEAU : Écouter les annulations détaillées
export const onMissionCancelledDetail = (callback: (data: any) => void) => {
  const sock = getSocket();
  if (sock) {
    sock.on("mission-cancelled-detail", callback);
  }
};

export const onStatusUpdate = (callback: (data: any) => void) => {
  const sock = getSocket();
  if (sock) {
    sock.on("status-update", callback);
  }
};

export const onMissionAccepted = (callback: (data: any) => void) => {
  const sock = getSocket();
  if (sock) {
    sock.on("mission-accepted", callback);
  }
};

export const onMissionCompleted = (callback: (data: any) => void) => {
  const sock = getSocket();
  if (sock) {
    sock.on("mission-completed", callback);
  }
};

// ============================================
// SUPPRESSION DES ÉCOUTEURS
// ============================================

export const offNewMission = (callback?: (data: any) => void) => {
  const sock = getSocket();
  if (sock) {
    sock.off("new-mission", callback);
  }
};

export const offMissionCancelled = (callback?: (data: any) => void) => {
  const sock = getSocket();
  if (sock) {
    sock.off("mission-cancelled", callback);
  }
};

export const offMissionCancelledDetail = (callback?: (data: any) => void) => {
  const sock = getSocket();
  if (sock) {
    sock.off("mission-cancelled-detail", callback);
  }
};

export const offStatusUpdate = (callback?: (data: any) => void) => {
  const sock = getSocket();
  if (sock) {
    sock.off("status-update", callback);
  }
};

export const offMissionAccepted = (callback?: (data: any) => void) => {
  const sock = getSocket();
  if (sock) {
    sock.off("mission-accepted", callback);
  }
};

export const offMissionCompleted = (callback?: (data: any) => void) => {
  const sock = getSocket();
  if (sock) {
    sock.off("mission-completed", callback);
  }
};
