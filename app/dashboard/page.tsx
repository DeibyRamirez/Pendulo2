"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Calendar, BarChart3, Clock, Globe, MapPin, ClipboardList } from "lucide-react";
import Link from "next/link";
import { Timestamp } from "firebase/firestore";
import { useReservations } from "@/hooks/useReservations";
import { listarPracticasDeUsuario } from "@/app/services/penduloDataService";
import { useModuloEvaluacion } from "@/hooks/useModuloEvaluacion";

const PENDULO_PREDETERMINADO = "UAC-01";

function toDate(value: Timestamp | Date): Date {
  if (value instanceof Date) return value;
  return value?.toDate?.() ?? new Date();
}

function formatFechaCorta(value: Timestamp | Date): string {
  const date = toDate(value);
  return date.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { reservaciones } = useReservations(user?.uid || "");
  const { activo: moduloEvaluacion } = useModuloEvaluacion();
  const [practicasRealizadas, setPracticasRealizadas] = useState(0);

  const penduloIds = useMemo(
    () => [...new Set([PENDULO_PREDETERMINADO, ...reservaciones.map((r) => r.pendulo_id).filter(Boolean)])],
    [reservaciones],
  );

  useEffect(() => {
    if (!user?.uid) return;
    let cancelado = false;
    listarPracticasDeUsuario(user.uid, penduloIds)
      .then((data: { practicaId: string }[]) => {
        if (!cancelado) setPracticasRealizadas(data.length);
      })
      .catch(() => {
        if (!cancelado) {
          const desdeReservas = reservaciones.reduce(
            (acc, r) => acc + (r.practicas_realizadas ?? 0),
            0,
          );
          setPracticasRealizadas(desdeReservas);
        }
      });
    return () => {
      cancelado = true;
    };
  }, [user?.uid, penduloIds, reservaciones]);

  const ahora = new Date();
  const proximaSesion = reservaciones
    .filter((r) => r.estado !== "cancelled" && toDate(r.inicio_sesion_reserva) > ahora)
    .sort(
      (a, b) =>
        toDate(a.inicio_sesion_reserva).getTime() - toDate(b.inicio_sesion_reserva).getTime(),
    )[0];

  const tiempoTotalMin = Math.round(
    reservaciones
      .filter((r) => r.estado === "completed" || r.estado === "active")
      .reduce((acc, r) => {
        const inicio = toDate(r.inicio_sesion_reserva);
        const fin = toDate(r.final_sesion_reserva);
        return acc + (fin.getTime() - inicio.getTime()) / 60000;
      }, 0),
  );

  return (
    <ProtectedRoute requiredRole="Estudiante" exactRole>
      <div className="bg-background">
        <main className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{user?.institucion}</p>
            </div>
            <Button variant="outline" size="sm" onClick={logout} className="w-full sm:w-auto touch-target">
              <LogOut className="w-4 h-4 mr-2" />
              Salir
            </Button>
          </div>
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Bienvenido, {user?.nombre?.split(" ")[0]}</h2>
            <p className="text-muted-foreground">Explora el péndulo remoto y agenda tus sesiones de experimentos</p>
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
                  Monitorea la práctica en vivo. El inicio de práctica se habilita únicamente durante tu turno reservado.
                </p>
                <Link href="/dashboard/realtime">
                  <Button className="w-full">Ir a Tiempo Real</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Card: Agendar Sesión */}
            <Card className="border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Agendar Sesión
                </CardTitle>
                <CardDescription>
                  Reserva tu tiempo para usar el péndulo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Selecciona fecha y hora para agendar una sesión de hasta 30 minutos. Visualiza la disponibilidad en tiempo real.
                </p>
                <Link href="/dashboard/reservas">
                  <Button className="w-full">Agendar</Button>
                </Link>
              </CardContent>
            </Card>

            {moduloEvaluacion ? (
            <Card className="border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-primary" />
                  Trabajos asignados
                </CardTitle>
                <CardDescription>
                  Cuestionarios de tus grupos con fecha límite
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Completa una práctica en el péndulo y envía las respuestas. Sin muestras no se puede entregar.
                </p>
                <Link href="/dashboard/trabajos">
                  <Button className="w-full">Ver trabajos</Button>
                </Link>
              </CardContent>
            </Card>
            ) : null}

            {/* Card: Mis Reservas */}
            <Card className="border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Mis Reservas
                </CardTitle>
                <CardDescription>
                  Ver y gestionar tus sesiones agendadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Consulta el historial de tus reservas activas e históricas. Cancela sesiones si lo necesitas.
                </p>
                <Link href="/dashboard/mis-reservas">
                  <Button className="w-full" variant="outline">Ver Reservas</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Card: Historial de Datos */}
            <Card className="border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Historial
                </CardTitle>
                <CardDescription>
                  Revisa datos de sesiones anteriores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Consulta el historial de prácticas, con un Excel por práctica y un Excel general.
                </p>
                <Link href="/dashboard/historial">
                  <Button className="w-full" variant="outline">Ver Historial</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Card: Mapa de Péndulos */}
            <Card className="border-border/50 hover:border-primary/50 transition-colors md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  Mapa de Péndulos WPA
                </CardTitle>
                <CardDescription>
                  Explora los péndulos de la red y abre cada nodo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 rounded-lg border border-border bg-muted/40 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Red global activa</p>
                      <p className="text-xs text-muted-foreground">Consulta disponibilidad y estado por institución</p>
                    </div>
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <Link href="/mapa">
                  <Button className="w-full">Ver mapa de péndulos</Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Live Preview Section
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
          </Card> */}

          {/* Información del Sistema */}
          <Card className="border-border/50 bg-card/30">
            <CardHeader>
              <CardTitle className="text-lg">Información del Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary mb-1">{practicasRealizadas}</p>
                  <p className="text-sm text-muted-foreground">Prácticas realizadas</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary mb-1">
                    {proximaSesion ? formatFechaCorta(proximaSesion.inicio_sesion_reserva) : "—"}
                  </p>
                  <p className="text-sm text-muted-foreground">Próxima sesión</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary mb-1">
                    {tiempoTotalMin > 0 ? `${tiempoTotalMin} min` : "—"}
                  </p>
                  <p className="text-sm text-muted-foreground">Tiempo total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
}
