"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function BarraDocente() {
  const { user, logout } = useAuth();

  return (
    <nav className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/docente" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="4" r="2" />
              <line x1="12" y1="6" x2="12" y2="16" />
              <circle cx="12" cy="18" r="3" fill="currentColor" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">WPA</h1>
            <p className="text-xs text-muted-foreground">Docente</p>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">{user?.nombre || user?.email}</p>
            <p className="text-xs text-muted-foreground">{user?.institucion}</p>
          </div>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            Salir
          </Button>
        </div>
      </div>
    </nav>
  );
}
