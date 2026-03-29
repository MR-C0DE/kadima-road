// contexts/SOSContext.tsx
import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
// ⚡ SUPPRIMER l'import de api (plus besoin)
// import { api } from '../config/api';

interface SOSState {
  activeSOS: {
    id: string;
    status:
      | "pending"
      | "dispatched"
      | "en_route"
      | "arrived"
      | "completed"
      | "cancelled";
    helper?: {
      id: string;
      name: string;
      phone: string;
      eta: number;
    };
    paymentIntentId?: string;
    createdAt: Date;
  } | null;
  isWaiting: boolean;
}

interface SOSContextType {
  sosState: SOSState;
  startSOS: (sosId: string, paymentIntentId: string) => void;
  updateSOSStatus: (status: string, helper?: any) => void;
  cancelSOS: () => Promise<void>;
  clearSOS: () => void;
  resumeWaiting: () => void;
}

const SOSContext = createContext<SOSContextType | undefined>(undefined);

const SOS_STORAGE_KEY = "@kadima_active_sos";

export const SOSProvider = ({ children }: { children: React.ReactNode }) => {
  const [sosState, setSosState] = useState<SOSState>({
    activeSOS: null,
    isWaiting: false,
  });

  useEffect(() => {
    loadSavedSOS();
  }, []);

  const loadSavedSOS = async () => {
    try {
      const saved = await AsyncStorage.getItem(SOS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          new Date(parsed.createdAt).getTime() >
          Date.now() - 2 * 60 * 60 * 1000
        ) {
          setSosState(parsed);
        } else {
          await AsyncStorage.removeItem(SOS_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error("Erreur chargement SOS:", error);
    }
  };

  const saveState = async (state: SOSState) => {
    try {
      await AsyncStorage.setItem(SOS_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Erreur sauvegarde SOS:", error);
    }
  };

  const startSOS = (sosId: string, paymentIntentId: string) => {
    const newState = {
      activeSOS: {
        id: sosId,
        status: "pending" as const,
        paymentIntentId,
        createdAt: new Date(),
      },
      isWaiting: true,
    };
    setSosState(newState);
    saveState(newState);
  };

  const updateSOSStatus = (status: string, helper?: any) => {
    if (!sosState.activeSOS) return;

    const newState = {
      ...sosState,
      activeSOS: {
        ...sosState.activeSOS,
        status: status as any,
        helper: helper
          ? {
              id: helper._id,
              name: `${helper.user.firstName} ${helper.user.lastName}`,
              phone: helper.user.phone,
              eta: helper.eta,
            }
          : sosState.activeSOS.helper,
      },
    };

    if (status === "dispatched") {
      newState.isWaiting = false;
    }

    setSosState(newState);
    saveState(newState);
  };

  const cancelSOS = async () => {
    // ⚡ SUPPRIMER l'appel à /payments/cancel
    // if (sosState.activeSOS?.paymentIntentId) {
    //   try {
    //     await api.post('/payments/cancel', {
    //       paymentIntentId: sosState.activeSOS.paymentIntentId
    //     });
    //   } catch (error) {
    //     console.error('Erreur annulation paiement:', error);
    //   }
    // }

    setSosState({ activeSOS: null, isWaiting: false });
    await AsyncStorage.removeItem(SOS_STORAGE_KEY);
  };

  const clearSOS = () => {
    setSosState({ activeSOS: null, isWaiting: false });
    AsyncStorage.removeItem(SOS_STORAGE_KEY);
  };

  const resumeWaiting = () => {
    setSosState((prev) => ({ ...prev, isWaiting: true }));
  };

  return (
    <SOSContext.Provider
      value={{
        sosState,
        startSOS,
        updateSOSStatus,
        cancelSOS,
        clearSOS,
        resumeWaiting,
      }}
    >
      {children}
    </SOSContext.Provider>
  );
};

export const useSOS = () => {
  const context = useContext(SOSContext);
  if (!context) throw new Error("useSOS must be used within SOSProvider");
  return context;
};
