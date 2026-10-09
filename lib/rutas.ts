import { getDashboardPathByRole } from "@/lib/roles"

/**
 * Ruta del panel de inicio según el rol del usuario.
 * Sin sesión (rol vacío) devuelve la portada pública.
 */
export function obtenerRutaInicioPorRol(rol?: string | null): string {
  if (!rol) return "/"
  return `/${getDashboardPathByRole(rol)}`
}
