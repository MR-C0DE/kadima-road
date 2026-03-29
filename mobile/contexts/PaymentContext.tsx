// contexts/PaymentContext.tsx - Version simplifiée
import React, { createContext, useState, useContext } from "react";

interface PaymentContextType {
  cards: any[];
  loading: boolean;
  addCard: () => Promise<void>;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const PaymentProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const addCard = async () => {
    // Simuler l'ajout d'une carte
    console.log("Ajout de carte simulé");
    return Promise.resolve();
  };

  return (
    <PaymentContext.Provider value={{ cards, loading, addCard }}>
      {children}
    </PaymentContext.Provider>
  );
};

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (!context)
    throw new Error("usePayment must be used within PaymentProvider");
  return context;
};
