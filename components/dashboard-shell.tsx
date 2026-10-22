"use client"

import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { SIGLA_PROYECTO } from "@/lib/marca"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset className="flex flex-col min-h-svh">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4 md:hidden">
          <SidebarTrigger className="touch-target -ml-1" />
          <span className="font-semibold text-foreground">Dashboard {SIGLA_PROYECTO}</span>
        </header>
        <div className="flex-1 min-h-0 overflow-auto">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
