"use client";

import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Calendar, BarChart3, Users, FileDown } from "lucide-react";
import Link from "next/link";
import { PendulumChart } from "@/components/pendulum-chart";

export default function DashboardDocentePage() {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute requiredRole="Docente" exactRole>
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
                <p className="text-xs text-muted-foreground">Docente</p>
              </div>
            </div>
            
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

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Bienvenido, Prof. {user?.nombre?.split(" ")[0]}</h2>
            <p className="text-muted-foreground">Gestiona las reservas de tu clase y revisa los reportes de experimentos</p>
          </div>

          {/* Grid de módulos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Card: Ver Péndulo en Vivo */}
            <Card className="border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Péndulo en Vivo
                </CardTitle>
                <CardDescription>
                  Visualiza los datos en tiempo real del péndulo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Observa el movimiento del péndulo, ángulo, velocidad y oscilaciones en tiempo real con gráficas interactivas.
                </p>
                <Link href="/pendulo">
                  <Button className="w-full">Ver Dashboard</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Card: Gestionar Reservas */}
            <Card className="border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Gestionar Reservas
                </CardTitle>
                <CardDescription>
                  Administra las reservas de tu clase
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Crea, modifica y cancela reservas para tus estudiantes. Visualiza el calendario completo de disponibilidad.
                </p>
                <Link href="/reservas">
                  <Button className="w-full">Gestionar</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Card: Reportes y Exportación */}
            <Card className="border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileDown className="w-5 h-5 text-primary" />
                  Reportes
                </CardTitle>
                <CardDescription>
                  Descargar reportes de reservas en CSV
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Exporta datos de todas las reservas incluyendo usuario, institución, fecha, hora y duración.
                </p>
                <Button className="w-full" variant="outline">Descargar Reporte</Button>
              </CardContent>
            </Card>

            {/* Card: Historial Completo */}
            <Card className="border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Historial
                </CardTitle>
                <CardDescription>
                  Revisa datos de todos los experimentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Consulta el historial completo de experimentos con gráficas, datos y análisis de sesiones.
                </p>
                <Link href="/historial">
                  <Button className="w-full" variant="outline">Ver Historial</Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Live Preview Section */}
          <Card className="mb-8 border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Péndulo en Tiempo Real</CardTitle>
                  <CardDescription>Datos actuales del sistema</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm text-muted-foreground">En vivo</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <PendulumChart />
              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">15.7°</p>
                  <p className="text-sm text-muted-foreground">Ángulo actual</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">0.42 m/s</p>
                  <p className="text-sm text-muted-foreground">Velocidad</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">2.01 s</p>
                  <p className="text-sm text-muted-foreground">Período</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estadísticas de Clase */}
          <Card className="border-border/50 bg-card/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Estadísticas de Clase
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary mb-1">24</p>
                  <p className="text-sm text-muted-foreground">Estudiantes</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary mb-1">18</p>
                  <p className="text-sm text-muted-foreground">Sesiones Completadas</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary mb-1">6</p>
                  <p className="text-sm text-muted-foreground">Reservas Pendientes</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary mb-1">92%</p>
                  <p className="text-sm text-muted-foreground">Tasa de Asistencia</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
}
