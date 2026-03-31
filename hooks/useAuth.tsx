"use client";

import { useState, useEffect, useContext, createContext, ReactNode } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/app/services/firebase";
import { normalizeRole, type UserRole } from "@/lib/roles";

export interface AuthUser extends User {
  rol?: UserRole;
  institucion?: string;
  nombre?: string;
  estado?: "active" | "disabled";
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  rol: UserRole | null;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [rol, setRol] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        try {
          const userDoc = await getDoc(doc(db, "usuarios", authUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const authUserWithRole = authUser as AuthUser;
            const normalizedRole = normalizeRole(userData.rol);
            authUserWithRole.rol = normalizedRole;
            authUserWithRole.institucion = userData.institucion;
            authUserWithRole.nombre = userData.nombre;
            authUserWithRole.estado = userData.estado || "active";

            setUser(authUserWithRole);
            setRol(normalizedRole);
          } else {
            const authUserWithDefaultRole = authUser as AuthUser;
            authUserWithDefaultRole.rol = "Estudiante";
            setUser(authUserWithDefaultRole);
            setRol("Estudiante");
          }
        } catch (error) {
          console.error("Error obteniendo datos del usuario:", error);
          const fallbackUser = authUser as AuthUser;
          fallbackUser.rol = "Estudiante";
          setUser(fallbackUser);
          setRol("Estudiante");
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
