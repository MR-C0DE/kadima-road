// mobile/contexts/NetworkContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { AppState, Platform } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { api } from "../config/api";
import { getSocket } from "../services/socket";

// Types
export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
  isApiReachable: boolean;
  isSocketConnected: boolean;
  connectionType: string | null;
  lastChecked: Date | null;
}

interface NetworkContextType {
  status: NetworkStatus;
  checkConnection: () => Promise<void>;
  isOffline: boolean;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

// Configuration
const API_HEALTH_CHECK_INTERVAL = 30000; // 30 secondes
const SOCKET_HEALTH_CHECK_INTERVAL = 15000; // 15 secondes

export const NetworkProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    isApiReachable: true,
    isSocketConnected: false,
    connectionType: null,
    lastChecked: null,
  });

  const apiCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const socketCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);

  // Vérifier la connexion API
  const checkApiReachability = useCallback(async (): Promise<boolean> => {
    try {
      // Timeout court pour ne pas bloquer
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${api.defaults.baseURL}/health`, {
        method: "HEAD",
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timeoutId);

      const isReachable = response?.ok ?? false;

      setStatus((prev) => ({
        ...prev,
        isApiReachable: isReachable,
        lastChecked: new Date(),
      }));

      return isReachable;
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        isApiReachable: false,
        lastChecked: new Date(),
      }));
      return false;
    }
  }, []);

  // Vérifier la connexion Socket
  const checkSocketConnection = useCallback((): boolean => {
    const socket = getSocket();
    const isConnected = socket?.connected ?? false;

    setStatus((prev) => ({
      ...prev,
      isSocketConnected: isConnected,
    }));

    return isConnected;
  }, []);

  // Vérification complète de la connexion
  const checkConnection = useCallback(async () => {
    // 1. Vérifier la connexion internet via NetInfo
    const netInfo = await NetInfo.fetch();
    const isConnected = netInfo.isConnected ?? false;
    const isInternetReachable = netInfo.isInternetReachable ?? false;
    const connectionType = netInfo.type ?? null;

    setStatus((prev) => ({
      ...prev,
      isConnected,
      isInternetReachable,
      connectionType,
    }));

    // 2. Si internet est disponible, vérifier l'API et le Socket
    if (isConnected && isInternetReachable) {
      await checkApiReachability();
      checkSocketConnection();
    } else {
      setStatus((prev) => ({
        ...prev,
        isApiReachable: false,
        isSocketConnected: false,
      }));
    }
  }, [checkApiReachability, checkSocketConnection]);

  // Écouter les changements de réseau
  useEffect(() => {
    isMounted.current = true;

    // Vérification initiale
    checkConnection();

    // Écouter NetInfo
    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      if (isMounted.current) {
        const isConnected = state.isConnected ?? false;
        const isInternetReachable = state.isInternetReachable ?? false;

        setStatus((prev) => ({
          ...prev,
          isConnected,
          isInternetReachable,
          connectionType: state.type ?? null,
        }));

        // Si la connexion est rétablie, refaire une vérification complète
        if (isConnected && isInternetReachable) {
          setTimeout(() => checkConnection(), 1000);
        } else {
          setStatus((prev) => ({
            ...prev,
            isApiReachable: false,
            isSocketConnected: false,
          }));
        }
      }
    });

    // Vérification périodique de l'API (toutes les 30s)
    apiCheckInterval.current = setInterval(() => {
      if (
        isMounted.current &&
        status.isConnected &&
        status.isInternetReachable
      ) {
        checkApiReachability();
      }
    }, API_HEALTH_CHECK_INTERVAL);

    // Vérification périodique du Socket (toutes les 15s)
    socketCheckInterval.current = setInterval(() => {
      if (
        isMounted.current &&
        status.isConnected &&
        status.isInternetReachable
      ) {
        checkSocketConnection();
      }
    }, SOCKET_HEALTH_CHECK_INTERVAL);

    // Écouter les changements d'état de l'application (background/foreground)
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        // L'application revient au premier plan, vérifier la connexion
        checkConnection();
      }
    });

    return () => {
      isMounted.current = false;
      unsubscribeNetInfo();
      subscription.remove();
      if (apiCheckInterval.current) clearInterval(apiCheckInterval.current);
      if (socketCheckInterval.current)
        clearInterval(socketCheckInterval.current);
    };
  }, [checkConnection, status.isConnected, status.isInternetReachable]);

  const isOffline =
    !status.isConnected ||
    !status.isInternetReachable ||
    !status.isApiReachable;

  return (
    <NetworkContext.Provider value={{ status, checkConnection, isOffline }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error("useNetwork must be used within NetworkProvider");
  }
  return context;
};
