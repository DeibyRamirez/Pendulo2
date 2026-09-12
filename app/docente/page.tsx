"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { BarraDocente } from "@/components/BarraDocente";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, BarChart3, Users, FileDown, Globe, MapPin, Loader2, UsersRound } from "lucide-react";
import Link from "next/link";
import { obtenerEstadisticasDocente } from "@/app/services/grupoService";
import { exportarExcelGeneralDocente, exportarExcelMuestrasDocente } from "@/app/services/lecturasExportService";
import { useModuloEvaluacion } from "@/hooks/useModuloEvaluacion";

export default function DashboardDocentePage() {
  const { user } = useAuth();
  const [exportando, setExportando] = useState(false);
  const [exportandoMuestras, setExportandoMuestras] = useState(false);
  const [errorExcel, setErrorExcel] = useState("");
  const [errorExcelMuestras, setErrorExcelMuestras] = useState("");
  const { activo: moduloEvaluacion } = useModuloEvaluacion();
  const [stats, setStats] = useState({
    grupos: 0,
    estudiantes: 0,
    asignaciones: 0,
    entregas: 0,
  });

  useEffect(() => {
    if (!user?.uid) return;
    let cancelado = false;
    obtenerEstadisticasDocente(user.uid)
      .then((datos: typeof stats) => {
        if (!cancelado) setStats(datos);
      })
      .catch(() => {
        if (!cancelado) setStats({ grupos: 0, estudiantes: 0, asignaciones: 0, entregas: 0 });
      });
    return () => {
      cancelado = true;
    };
  }, [user?.uid]);

  async function alDescargarMuestras() {
    if (!user?.uid) return;
    setErrorExcelMuestras("");
    setExportandoMuestras(true);
    try {
      await exportarExcelMuestrasDocente(user.uid);
    } catch (err) {
      setErrorExcelMuestras(err instanceof Error ? err.message : "No se pudo generar el Excel de muestras");
    } finally {
      setExportandoMuestras(false);
    }
  }

  async function alDescargarReporte() {
    if (!user?.uid) return;
    setErrorExcel("");
    setExportando(true);
    try {
      await exportarExcelGeneralDocente(user.uid);
    } catch (err) {
      setErrorExcel(err instanceof Error ? err.message : "No se pudo generar el Excel");
    } finally {
      setExportando(false);
    }
  }

  return (
    <ProtectedRoute requiredRole="Docente" exactRole>
      <div className="min-h-screen bg-background">
        <BarraDocente />

        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Bienvenido, Prof. {user?.nombre?.split(" ")[0]}
            </h2>
            <p className="text-muted-foreground">
              Consulta el péndulo en vivo, reservas, historial y el Excel de muestras de cada práctica
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {moduloEvaluacion ? (
            <Card className="border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UsersRound className="w-5 h-5 text-primary" />
                  Grupos de trabajo
                </CardTitle>
                <CardDescription>Crea grupos, asigna estudiantes y trabajos</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Organiza clases como Física II, asigna prácticas con fecha límite y califica el cuestionario.
                </p>
                <Link href="/docente/grupos">
                  <Button className="w-full">Gestionar grupos</Button>
                </Link>
              </CardContent>
            </Card>
            ) : null}

            <Card className="border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Péndulo en Vivo
                </CardTitle>
                <CardDescription>Visualiza los datos en tiempo real del péndulo</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Observa el movimiento del péndulo, ángulo, velocidad y oscilaciones en tiempo real con gráficas
                  interactivas.
                </p>
                <Link href="/mapa">
                  <Button className="w-full">Ver Mapa</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Gestionar Reservas
                </CardTitle>
                <CardDescription>Administra las reservas de tu clase</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Crea, modifica y cancela reservas para tus estudiantes. Visualiza el calendario completo de
                  disponibilidad.
                </p>
                <Link href="/reservas">
                  <Button className="w-full">Gestionar</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileDown className="w-5 h-5 text-primary" />
                  Excel de muestras
                </CardTitle>
                <CardDescription>Tus prácticas y todas las muestras, con nombre del estudiante</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Un Excel con dos hojas: tus prácticas y todas las muestras de todos los usuarios, con el nombre de cada estudiante. No incluye cuestionarios.
                </p>
                {/* <Button className="w-full" onClick={alDescargarMuestras} disabled={exportandoMuestras}>
                  {exportandoMuestras ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
                  Descargar Excel de muestras
                </Button> */}
                {errorExcelMuestras ? <p className="text-sm text-destructive mt-3">{errorExcelMuestras}</p> : null}
                <Link href="/historial" className="mt-3 block">
                  <Button className="w-full" variant="outline">
                    <FileDown className="w-4 h-4 mr-2" />
                    Ir al historial
                  </Button>
                </Link>
                {moduloEvaluacion ? (
                  <div className="mt-3">
                    <Button className="w-full" variant="outline" onClick={alDescargarReporte} disabled={exportando}>
                      {exportando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
                      Excel de entregas (cuestionarios)
                    </Button>
                    {errorExcel ? <p className="text-sm text-destructive mt-3">{errorExcel}</p> : null}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Historial
                </CardTitle>
                <CardDescription>Revisa datos de todos los experimentos</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Consulta el historial completo de experimentos con gráficas, datos y análisis de sesiones.
                </p>
                <Link href="/historial">
                  <Button className="w-full" variant="outline">
                    Ver Historial
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  Mapa de Péndulos WPA
                </CardTitle>
                <CardDescription>Visualiza los nodos de la red y abre cada péndulo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 rounded-lg border border-border bg-muted/40 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Red global de laboratorios</p>
                      <p className="text-xs text-muted-foreground">
                        Consulta estado, ubicación y acceso a cada péndulo
                      </p>
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

          {moduloEvaluacion ? (
          <Card className="border-border/50 bg-card/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Estadísticas de Clase
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary mb-1">{stats.estudiantes}</p>
                  <p className="text-sm text-muted-foreground">Estudiantes</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary mb-1">{stats.asignaciones}</p>
                  <p className="text-sm text-muted-foreground">Asignaciones</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary mb-1">{stats.entregas}</p>
                  <p className="text-sm text-muted-foreground">Entregas</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary mb-1">{stats.grupos}</p>
                  <p className="text-sm text-muted-foreground">Grupos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          ) : null}
        </main>
      </div>
    </ProtectedRoute>
  );
}
