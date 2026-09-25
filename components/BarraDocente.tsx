"use client";

import Link from "next/link";
import { useState } from "react";
import { LogOut, Menu, X, Users, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";

const navLinks = [
  { name: "Panel docente", href: "/docente", icon: LayoutDashboard },
  { name: "Grupos", href: "/docente/grupos", icon: Users },
];

export function BarraDocente() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const userInitial = (user?.nombre || user?.email || "?").charAt(0).toUpperCase();

  return (
    <nav className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
        <Link href="/docente" className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="4" r="2" />
              <line x1="12" y1="6" x2="12" y2="16" />
              <circle cx="12" cy="18" r="3" fill="currentColor" />
            </svg>
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-foreground truncate">WPA</h1>
            <p className="text-xs text-muted-foreground">Docente</p>
          </div>
        </Link>

        <div className="hidden lg:flex items-center gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.name}
            </Link>
          ))}
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">{user?.nombre || user?.email}</p>
            <p className="text-xs text-muted-foreground">{user?.institucion}</p>
          </div>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            Salir
          </Button>
        </div>

        <div className="flex lg:hidden items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
            {userInitial}
          </div>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="touch-target" aria-label="Abrir menú">
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(100vw-2rem,20rem)]">
              <SheetHeader>
                <SheetTitle>Menú docente</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-sm font-medium text-foreground">{user?.nombre || user?.email}</p>
                  <p className="text-xs text-muted-foreground">{user?.institucion}</p>
                </div>
                <nav className="flex flex-col gap-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground touch-target"
                    >
                      <link.icon className="h-4 w-4" />
                      {link.name}
                    </Link>
                  ))}
                </nav>
                <Button variant="outline" className="w-full touch-target" onClick={() => { setMobileOpen(false); logout(); }}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Salir
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
