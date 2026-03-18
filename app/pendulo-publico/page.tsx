"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, QrCode } from "lucide-react";
import Link from "next/link";
import { PendulumChart } from "@/components/pendulum-chart";

export default function PublicPendulumPage() {
  const [qrCode, setQrCode] = useState<string>("");

  useEffect(() => {
    // Generar QR usando una librería como qrcode.react
    // Por ahora, mostrar placeholder
    setQrCode("QR_CODE_PLACEHOLDER");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar Pública */}
      <nav className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="4" r="2" />
                <line x1="12" y1="6" x2="12" y2="16" />
                <circle cx="12" cy="18" r="3" fill="currentColor" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">WPA</h1>
              <p className="text-xs text-muted-foreground">World Pendulum Alliance</p>
            </div>
          </Link>
          
          <Link href="/login">
            <Button>
              <LogIn className="w-4 h-4 mr-2" />
              Iniciar Sesión
            </Button>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-3">
            Péndulo Remoto - Corporación Universitaria Autónoma del Cauca
          </h1>
          <p className="text-lg text-muted-foreground">
            Visualiza los datos en tiempo real del péndulo físico sin necesidad de iniciar sesión
          </p>
        </div>

        {/* Grid de contenido */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Sección principal: Vista en Vivo */}
          <div className="lg:col-span-2">
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Péndulo en Vivo</CardTitle>
                    <CardDescription>Datos en tiempo real del sistema</CardDescription>
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
                    <p className="text-sm text-muted-foreground">Ángulo</p>
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

            {/* Información del Péndulo */}
            <Card className="border-border/50 mt-6">
              <CardHeader>
                <CardTitle>Información del Péndulo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Estado</span>
                    <span className="font-medium flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      Activo
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Institución</span>
                    <span className="font-medium">Corporación Universitaria Autónoma del Cauca</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Ubicación</span>
                    <span className="font-medium">Popayán, Colombia</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Última Actualización</span>
                    <span className="font-medium">Ahora</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar: QR y Acceso Rápido */}
          <div className="space-y-6">
            {/* Card QR */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  Código QR
                </CardTitle>
                <CardDescription>
                  Escanea para acceder a esta página
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="w-40 h-40 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border mb-4">
                  <div className="text-center">
                    <QrCode className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">QR Code</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full" size="sm">
                  Descargar QR
                </Button>
              </CardContent>
            </Card>

            {/* Card de Acceso */}
            <Card className="border-border/50 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg">Acceso Completo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Inicia sesión para acceder a todas las funcionalidades: agendamiento, historial y más datos detallados.
                </p>
                <Link href="/login" className="w-full block">
                  <Button className="w-full">
                    <LogIn className="w-4 h-4 mr-2" />
                    Iniciar Sesión
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Card de Información */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">¿Nuevo Usuario?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Crea una cuenta para agendar sesiones y acceder a datos históricos de experimentos.
                </p>
                <Link href="/registro" className="w-full block">
                  <Button variant="outline" className="w-full">
                    Crear Cuenta
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Características */}
        <Card className="border-border/50 bg-card/30 mb-8">
          <CardHeader>
            <CardTitle>Características de la Plataforma</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg">📊</span>
                </div>
                <h3 className="font-medium text-foreground mb-2">Datos en Tiempo Real</h3>
                <p className="text-sm text-muted-foreground">Visualiza ángulo, velocidad y oscilaciones</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg">📅</span>
                </div>
                <h3 className="font-medium text-foreground mb-2">Agendamiento</h3>
                <p className="text-sm text-muted-foreground">Reserva sesiones de hasta 30 minutos</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg">📈</span>
                </div>
                <h3 className="font-medium text-foreground mb-2">Historial</h3>
                <p className="text-sm text-muted-foreground">Accede a datos de sesiones anteriores</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg">🗺️</span>
                </div>
                <h3 className="font-medium text-foreground mb-2">Red Global</h3>
                <p className="text-sm text-muted-foreground">Conecta con péndulos de otras universidades</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
