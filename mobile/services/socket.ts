// mobile/services/socket.ts
import io from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SOCKET_URL } from "../config/api";
import { Platform } from "react-native";

let socket: any = null;

export const connectSocket = async () => {
  try {
    const token = await AsyncStorage.getItem("token");

    console.log(`🔌 Tentative connexion WebSocket Mobile - URL: ${SOCKET_URL}`);
    console.log(`🔑 Token présent: ${token ? "OUI" : "NON"}`);

    if (!token) {
      console.log("❌ Pas de token, impossible de se connecter au socket");
      return null;
    }

    socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      forceNew: true,
      ...(Platform.OS !== "web" && {
        transports: ["websocket"],
        upgrade: false,
      }),
    });

    socket.on("connect", () => {
      console.log(`✅ Socket Mobile connecté! ID: ${socket.id}`);
    });

    socket.on("disconnect", (reason: string) => {
      console.log(`🔌 Socket Mobile déconnecté: ${reason}`);
    });

    socket.on("connect_error", (err: any) => {
      console.error("❌ Socket Mobile error:", err.message);
    });

    return socket;
  } catch (error) {
    console.error("❌ Connexion socket mobile:", error);
    return null;
  }
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    console.log("🔌 Déconnexion WebSocket Mobile manuelle");
    socket.disconnect();
    socket = null;
  }
};

export const trackIntervention = (
  interventionId: string,
  onLocationUpdate: (data: any) => void,
  onStatusUpdate: (data: any) => void
) => {
  const sock = getSocket();
  if (!sock) {
    console.log("❌ trackIntervention: socket non connecté");
    return () => {};
  }

  console.log(`🎯 Client suit intervention: ${interventionId}`);
  sock.emit("track-intervention", interventionId);

  sock.on("location-update", onLocationUpdate);
  sock.on("status-update", onStatusUpdate);

  console.log(`✅ Écouteurs ajoutés pour intervention ${interventionId}`);

  return () => {
    console.log(`👋 Client arrête de suivre: ${interventionId}`);
    sock.off("location-update", onLocationUpdate);
    sock.off("status-update", onStatusUpdate);
  };
};

export const sendStatusUpdate = (
  interventionId: string,
  status: string,
  note?: string
) => {
  const sock = getSocket();
  if (sock && sock.connected) {
    console.log(`📡 Client envoie statut: ${interventionId} -> ${status}`);
    sock.emit("status-update", { interventionId, status, note });
  } else {
    console.log(
      `❌ sendStatusUpdate: socket non connecté (connected: ${sock?.connected})`
    );
  }
};
