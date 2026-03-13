import React, { createContext, useState, useContext, useEffect } from "react";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "admin" | "employe";
  garageId?: string;
  photo?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Utilisateurs de test
const MOCK_USERS = [
  {
    id: "1",
    firstName: "Garage",
    lastName: "Principal",
    email: "garage@test.com",
    password: "password123",
    role: "admin" as const,
    garageId: "g1",
  },
  {
    id: "2",
    firstName: "Jean",
    lastName: "Mécanicien",
    email: "employe@test.com",
    password: "password123",
    role: "employe" as const,
    garageId: "g1",
    photo: undefined,
  },
];

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier si un utilisateur est déjà connecté
    const savedUser = localStorage.getItem("mockUser");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Simuler un délai réseau
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Chercher l'utilisateur dans la liste mock
    const foundUser = MOCK_USERS.find(
      (u) => u.email === email && u.password === password
    );

    if (!foundUser) {
      throw new Error("Email ou mot de passe incorrect");
    }

    // Enlever le mot de passe avant de stocker
    const { password: _, ...userWithoutPassword } = foundUser;

    // Sauvegarder dans localStorage
    localStorage.setItem("mockUser", JSON.stringify(userWithoutPassword));
    setUser(userWithoutPassword);
  };

  const logout = () => {
    localStorage.removeItem("mockUser");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
