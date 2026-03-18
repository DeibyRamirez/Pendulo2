"use client";

import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Settings, Users, Zap, FileDown } from "lucide-react";
import Link from "next/link";

export default function DashboardAdminPage() {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-background">
        {/* Navbar */}
        <nav className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="4" r="2" />
                  <line x1="12" y1="6" x2="12" y2="16" />
                  <circle cx="12" cy="18" r="3" fill="currentColor" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">WPA</h1>
                <p className="text-xs text-muted-foreground">Administrador</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{user?.nombre || user?.email}</p>
                <p className="text-xs text-muted-foreground">Administrador</p>
              </div>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Panel de Administración</h2>
            <p className="text-muted-foreground">Gestiona usuarios, péndulos y configuraciones del sistema</p>
          </div>

          {/* Grid de módulos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Card: Gestionar Usuarios */}
            <Card className="border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Gestionar Usuarios
                </CardTitle>
                <CardDescription>
                  Administra cuentas y roles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Ver, editar roles, desactivar cuentas y revisar permisos de usuarios en el sistema.
                </p>
                <Button className="w-full">Ir a Usuarios</Button>
              </CardContent>
            </Card>

            {/* Card: Gestionar Péndulos */}
            <Card className="border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Gestionar Péndulos
                </CardTitle>
                <CardDescription>
                  Registrar y configurar péndulos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Registra nuevos péndulos de la red WPA con coordenadas, institución y estado inicial.
                </p>
                <Button className="w-full">Ir a Péndulos</Button>
              </CardContent>
            </Card>

            {/* Card: Reportes */}
            <Card className="border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileDown className="w-5 h-5 text-primary" />
                  Reportes
                </CardTitle>
                <CardDescription>
                  Descargar reportes del sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Exporta reportes completos de reservas, usuarios activos y estadísticas del sistema.
                </p>
                <Button className="w-full" variant="outline">Descargar Reportes</Button>
              </CardContent>
            </Card>

            {/* Card: Configuración del Sistema */}
            <Card className="border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  Configuración
                </CardTitle>
                <CardDescription>
                  Ajustes generales del sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Configura parámetros del sistema, límites de tiempo de sesión y otras opciones.
                </p>
                <Button className="w-full" variant="outline">Configurar</Button>
              </CardContent>
            </Card>

            {/* Card: Ver Historial Completo */}
            <Card className="border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileDown className="w-5 h-5 text-primary" />
                  Historial
                </CardTitle>
                <CardDescription>
                  Todos los datos del sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Accede al historial completo de todas las sesiones, usuarios y experimentos del sistema.
                </p>
                <Link href="/historial">
                  <Button className="w-full" variant="outline">Ver Historial</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Card: Mapa de Péndulos */}
            <Card className="border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Mapa WPA
                </CardTitle>
                <CardDescription>
                  Red global de péndulos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Visualiza todos los péndulos de la red WPA en el mapa interactivo mundial.
                </p>
                <Link href="/mapa">
                  <Button className="w-full">Ver Mapa</Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Estadísticas Generales */}
          <Card className="border-border/50 bg-card/30 mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Estadísticas del Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary mb-1">156</p>
                  <p className="text-sm text-muted-foreground">Usuarios</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary mb-1">328</p>
                  <p className="text-sm text-muted-foreground">Sesiones</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary mb-1">12</p>
                  <p className="text-sm text-muted-foreground">Péndulos Activos</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary mb-1">98%</p>
                  <p className="text-sm text-muted-foreground">Uptime</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary mb-1">8 Paises</p>
                  <p className="text-sm text-muted-foreground">Red Global</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alertas y Notificaciones */}
          <Card className="border-border/50 border-yellow-500/50 bg-yellow-500/5">
            <CardHeader>
              <CardTitle className="text-lg text-yellow-600">⚠️ Alertas del Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• 2 usuarios pendientes de verificación de email</li>
                <li>• 1 péndulo sin conexión (Nodo: UNIANDES)</li>
                <li>• Base de datos: 75% de capacidad utilizada</li>
              </ul>
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
}
