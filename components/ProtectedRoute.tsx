"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getDashboardPathByRole, hasRequiredRole, type UserRole } from "@/lib/roles";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  exactRole?: boolean;
}

export function ProtectedRoute({ children, requiredRole, exactRole = false }: ProtectedRouteProps) {
  const { user, loading, rol } = useAuth();
  const router = useRouter();

  const hasAccess = exactRole
    ? (!requiredRole || rol === requiredRole)
    : hasRequiredRole(rol, requiredRole);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // No autenticado, redirigir al login
        router.push("/login");
      } else if (!hasAccess) {
        // Rol insuficiente, redirigir al dashboard del usuario
        router.push(`/${getDashboardPathByRole(rol)}`);
      }
    }
  }, [user, loading, hasAccess, rol, router]);

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

  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
}
