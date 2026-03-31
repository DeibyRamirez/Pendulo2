export const ROLES = ["Estudiante", "Docente", "Admin"] as const;

export type UserRole = (typeof ROLES)[number];

const ROLE_PRIORITY: Record<UserRole, number> = {
  Estudiante: 1,
  Docente: 2,
  Admin: 3,
};

export function normalizeRole(role?: string | null): UserRole {
  switch ((role || "").toLowerCase()) {
    case "admin":
      return "Admin";
    case "docente":
      return "Docente";
    case "estudiante":
    default:
      return "Estudiante";
  }
}

export function hasRequiredRole(
  currentRole: string | null | undefined,
  requiredRole?: UserRole
): boolean {
  if (!requiredRole) return true;
  const normalized = normalizeRole(currentRole);
  return ROLE_PRIORITY[normalized] >= ROLE_PRIORITY[requiredRole];
}

export function getDashboardPathByRole(role: string | null | undefined): string {
  const normalized = normalizeRole(role);
  if (normalized === "Admin") return "admin";
  if (normalized === "Docente") return "docente";
  return "dashboard";
}
