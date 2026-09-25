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
} from "lucide-react"
import { useModuloEvaluacion } from "@/hooks/useModuloEvaluacion"
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

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Tiempo Real", href: "/dashboard/realtime", icon: Activity },
  { name: "Reservas", href: "/dashboard/reservas", icon: Calendar },
  { name: "Mis Reservas", href: "/dashboard/mis-reservas", icon: Calendar },
  { name: "Historial", href: "/dashboard/historial", icon: History },
  { name: "Trabajos asignados", href: "/dashboard/trabajos", icon: ClipboardList, plusEvaluacion: true },
  { name: "Agente IA", href: "/dashboard/agente-ia", icon: Bot },
]

function NavItems() {
  const pathname = usePathname()
  const { setOpenMobile, isMobile } = useSidebar()
  const { activo: moduloEvaluacion } = useModuloEvaluacion()
  const itemsVisibles = navigation.filter((item) => !item.plusEvaluacion || moduloEvaluacion)

  const closeMobile = () => {
    if (isMobile) setOpenMobile(false)
  }

  return (
    <>
      {itemsVisibles.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`))
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

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/" onClick={() => isMobile && setOpenMobile(false)}>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
                  <Activity className="h-4 w-4 text-sidebar-primary-foreground" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">WPA</span>
                  <span className="text-xs text-muted-foreground">Dashboard</span>
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
              <Link href="/" onClick={() => isMobile && setOpenMobile(false)}>
                <Home />
                <span>Volver al inicio</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
