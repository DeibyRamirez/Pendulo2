"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "estudiante" | "docente" | "admin";
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading, rol } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // No autenticado, redirigir al login
        router.push("/login");
      } else if (requiredRole && rol !== requiredRole) {
        // Rol insuficiente, redirigir al dashboard del usuario
        router.push(`/${getDashboardPath(rol)}`);
      }
    }
  }, [user, loading, rol, requiredRole, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requiredRole && rol !== requiredRole) {
    return null;
  }

  return <>{children}</>;
}

function getDashboardPath(rol: string | null): string {
  switch (rol) {
    case "admin":
      return "admin";
    case "docente":
      return "docente";
    case "estudiante":
    default:
      return "dashboard";
  }
}
