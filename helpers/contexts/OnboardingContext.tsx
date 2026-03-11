import React, { createContext, useState, useContext, ReactNode } from "react";

interface OnboardingData {
  services: string[];
  equipment: string[];
  radius: string;
  address: string;
  basePrice: string;
  perKm: string;
  availability: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  documents: {
    license: boolean;
    insurance: boolean;
    identity: boolean;
  };
}

interface OnboardingContextType {
  data: OnboardingData;
  updateServices: (services: string[]) => void;
  updateEquipment: (equipment: string[]) => void;
  updateZone: (radius: string, address: string) => void;
  updatePricing: (basePrice: string, perKm: string) => void;
  updateAvailability: (availability: any) => void;
  updateDocuments: (documents: any) => void;
  resetData: () => void;
}

const defaultData: OnboardingData = {
  services: [],
  equipment: [],
  radius: "10",
  address: "",
  basePrice: "25",
  perKm: "1",
  availability: {
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
  },
  documents: {
    license: false,
    insurance: false,
    identity: false,
  },
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined
);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
};

interface OnboardingProviderProps {
  children: ReactNode;
}

export const OnboardingProvider = ({ children }: OnboardingProviderProps) => {
  const [data, setData] = useState<OnboardingData>(defaultData);

  const updateServices = (services: string[]) => {
    setData((prev) => ({ ...prev, services }));
  };

  const updateEquipment = (equipment: string[]) => {
    setData((prev) => ({ ...prev, equipment }));
  };

  const updateZone = (radius: string, address: string) => {
    setData((prev) => ({ ...prev, radius, address }));
  };

  const updatePricing = (basePrice: string, perKm: string) => {
    setData((prev) => ({ ...prev, basePrice, perKm }));
  };

  const updateAvailability = (availability: any) => {
    setData((prev) => ({ ...prev, availability }));
  };

  const updateDocuments = (documents: any) => {
    setData((prev) => ({ ...prev, documents }));
  };

  const resetData = () => {
    setData(defaultData);
  };

  return (
    <OnboardingContext.Provider
      value={{
        data,
        updateServices,
        updateEquipment,
        updateZone,
        updatePricing,
        updateAvailability,
        updateDocuments,
        resetData,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};
