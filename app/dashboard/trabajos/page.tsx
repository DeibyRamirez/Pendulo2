"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { GuardiaModuloEvaluacion } from "@/components/guardia-modulo-evaluacion";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listarAsignacionesEstudiante, obtenerEntrega } from "@/app/services/grupoService";
import { ClipboardList, Loader2 } from "lucide-react";
import type { Timestamp } from "firebase/firestore";

interface TrabajoFila {
  id: string;
  titulo?: string;
  grupo_nombre?: string;
  fecha_limite?: Timestamp;
}

function formatFecha(valor?: Timestamp) {
  const fecha = valor?.toDate?.();
  if (!fecha) return "Sin fecha";
  return fecha.toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PaginaTrabajosEstudiante() {
  const { user } = useAuth();
  const [trabajos, setTrabajos] = useState<TrabajoFila[]>([]);
  const [entregados, setEntregados] = useState<Record<string, boolean>>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.uid) return;
    let cancelado = false;
    setCargando(true);
    listarAsignacionesEstudiante(user.uid)
      .then(async (lista: TrabajoFila[]) => {
        if (cancelado) return;
        setTrabajos(lista);
        const estados: Record<string, boolean> = {};
        await Promise.all(
          lista.map(async (t) => {
            const entrega = await obtenerEntrega(t.id, user.uid);
            estados[t.id] = Boolean(entrega);
          }),
        );
        if (!cancelado) setEntregados(estados);
      })
      .catch((err: Error) => {
        if (!cancelado) setError(err.message || "No se pudieron cargar los trabajos");
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [user?.uid]);

  return (
    <ProtectedRoute requiredRole="Estudiante" exactRole>
      <GuardiaModuloEvaluacion destino="/dashboard">
      <div className="min-h-screen bg-background p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Trabajos asignados</h2>
            <p className="text-muted-foreground">
              Completa una práctica en el péndulo y luego envía el cuestionario de cada trabajo.
            </p>
          </div>

          {error ? <p className="text-sm text-destructive mb-4">{error}</p> : null}

          {cargando ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Cargando trabajos…
            </div>
          ) : trabajos.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center text-muted-foreground">
                No tienes trabajos asignados. Cuando tu docente te agregue a un grupo, aparecerán aquí.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {trabajos.map((trabajo) => {
                const vencido = trabajo.fecha_limite?.toDate?.()
                  ? trabajo.fecha_limite.toDate() < new Date()
                  : false;
                return (
                  <Card key={trabajo.id} className="border-border/50 hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <ClipboardList className="w-5 h-5 text-primary" />
                            {trabajo.titulo}
                          </CardTitle>
                          <CardDescription>
                            {trabajo.grupo_nombre || "Grupo"} · Límite: {formatFecha(trabajo.fecha_limite)}
                          </CardDescription>
                        </div>
                        <Badge variant={entregados[trabajo.id] ? "default" : vencido ? "destructive" : "outline"}>
                          {entregados[trabajo.id] ? "Enviado" : vencido ? "Vencido" : "Pendiente"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Link href={`/dashboard/trabajos/${trabajo.id}`}>
                        <Button className="w-full">
                          {entregados[trabajo.id] || vencido ? "Ver cuestionario" : "Responder cuestionario"}
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
      </GuardiaModuloEvaluacion>
    </ProtectedRoute>
  );
}
