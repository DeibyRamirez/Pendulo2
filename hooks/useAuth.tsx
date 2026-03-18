"use client";

import { useState, useEffect, useContext, createContext, ReactNode } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/app/services/firebase";

export interface AuthUser extends User {
  rol?: "estudiante" | "docente" | "admin";
  institucion?: string;
  nombre?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  rol: string | null;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [rol, setRol] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        try {
          const userDoc = await getDoc(doc(db, "usuarios", authUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const authUserWithRole = authUser as AuthUser;
            authUserWithRole.rol = userData.rol || "estudiante";
            authUserWithRole.institucion = userData.institucion;
            authUserWithRole.nombre = userData.nombre;

            setUser(authUserWithRole);
            setRol(userData.rol || "estudiante");
          }
        } catch (error) {
          console.error("Error obteniendo datos del usuario:", error);
          setUser(authUser as AuthUser);
        }
      } else {
        setUser(null);
        setRol(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setRol(null);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const value = { user, loading, rol, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de AuthProvider");
  }
  return context;
}
