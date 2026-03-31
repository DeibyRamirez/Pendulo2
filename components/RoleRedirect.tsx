"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getDashboardPathByRole } from "@/lib/roles";

export function RoleRedirect() {
  const { user, loading, rol } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && rol) {
      // Redirigir según el rol
      const dashboardPath = getDashboardPathByRole(rol);
      if (!window.location.pathname.includes(dashboardPath)) {
        router.push(`/${dashboardPath}`);
      }
    }
  }, [user, loading, rol, router]);

  return null;
}
