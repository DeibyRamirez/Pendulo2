"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Activity,
  LayoutDashboard,
  Calendar,
  History,
  Home,
  Bot,
  ClipboardList,
  Globe,
  LogOut,
  Users,
  type LucideIcon,
} from "lucide-react"
import { useModuloEvaluacion } from "@/hooks/useModuloEvaluacion"
import { useAuth } from "@/hooks/useAuth"
import { IconoPendulo } from "@/components/IconoPendulo"
import { SIGLA_PROYECTO } from "@/lib/marca"
import { obtenerRutaInicioPorRol } from "@/lib/rutas"
import type { UserRole } from "@/lib/roles"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"

type NavItem = {
  name: string
  href: string
  icon: LucideIcon
  roles: UserRole[]
  plusEvaluacion?: boolean
  exact?: boolean
}

const todos: UserRole[] = ["Estudiante", "Docente", "Admin"]

function itemsDeNavegacion(panelHref: string): NavItem[] {
  return [
    { name: "Panel", href: panelHref, icon: LayoutDashboard, roles: todos, exact: true },
    { name: "Tiempo Real", href: "/dashboard/realtime", icon: Activity, roles: todos },
    { name: "Reservas", href: "/dashboard/reservas", icon: Calendar, roles: todos },
    { name: "Mis Reservas", href: "/dashboard/mis-reservas", icon: Calendar, roles: ["Estudiante", "Docente"] },
    { name: "Historial", href: "/dashboard/historial", icon: History, roles: todos },
    { name: "Trabajos asignados", href: "/dashboard/trabajos", icon: ClipboardList, roles: ["Estudiante"], plusEvaluacion: true },
    { name: "Grupos", href: "/docente/grupos", icon: Users, roles: ["Docente"], plusEvaluacion: true },
    { name: "Agente IA", href: "/dashboard/agente-ia", icon: Bot, roles: todos },
    { name: "Mapa", href: "/mapa", icon: Globe, roles: ["Docente", "Admin"] },
  ]
}

function NavItems() {
  const pathname = usePathname()
  const { setOpenMobile, isMobile } = useSidebar()
  const { rol } = useAuth()
  const { activo: moduloEvaluacion } = useModuloEvaluacion()
  const panelHref = rol ? obtenerRutaInicioPorRol(rol) : null
  const itemsVisibles = itemsDeNavegacion(panelHref ?? "/dashboard").filter((item) => {
    if (!panelHref && item.exact) return false
    if (item.plusEvaluacion && !moduloEvaluacion) return false
    if (!rol) return item.roles.length === todos.length
    return item.roles.includes(rol)
  })

  const closeMobile = () => {
    if (isMobile) setOpenMobile(false)
  }

  return (
    <>
      {itemsVisibles.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild isActive={isActive} tooltip={item.name}>
              <Link href={item.href} onClick={closeMobile}>
                <item.icon />
                <span>{item.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      })}
    </>
  )
}

export function DashboardSidebar() {
  const { setOpenMobile, isMobile } = useSidebar()
  const { rol, logout } = useAuth()

  const closeMobile = () => {
    if (isMobile) setOpenMobile(false)
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={rol ? obtenerRutaInicioPorRol(rol) : "/"} onClick={closeMobile}>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
                  <IconoPendulo className="h-4 w-4 text-sidebar-primary-foreground" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">{SIGLA_PROYECTO}</span>
                  <span className="text-xs text-muted-foreground">{rol ?? "Panel"}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <NavItems />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Volver al inicio">
              <Link href="/" onClick={closeMobile}>
                <Home />
                <span>Volver al inicio</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Salir"
              onClick={() => {
                closeMobile()
                void logout()
              }}
            >
              <LogOut />
              <span>Salir</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
